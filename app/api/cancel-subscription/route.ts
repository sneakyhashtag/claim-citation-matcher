import Stripe from "stripe";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { checkIsPro, clearProCookie } from "@/lib/pro-cookie";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

const REFUND_WINDOW_DAYS = 7;

/** Find the active (or trialing) Stripe subscription for a customer email. */
async function findActiveSubscription(
  email: string
): Promise<Stripe.Subscription | null> {
  const customers = await stripe.customers.list({ email, limit: 5 });
  for (const customer of customers.data) {
    const subs = await stripe.subscriptions.list({
      customer: customer.id,
      status: "all",
      limit: 10,
    });
    const active = subs.data.find(
      (s) => s.status === "active" || s.status === "trialing"
    );
    if (active) return active;
  }
  return null;
}

/** Days elapsed since a Unix timestamp. */
function daysSince(unixTs: number): number {
  return (Date.now() / 1000 - unixTs) / 86400;
}

/** Current billing period end from the first subscription item. */
function periodEnd(sub: Stripe.Subscription): number {
  return sub.items.data[0]?.current_period_end ?? 0;
}

/**
 * Find the PaymentIntent ID for the latest paid invoice on a subscription,
 * so we can issue a refund. Returns null if no paid invoice exists (e.g. trial).
 */
async function findPaidPaymentIntentId(
  subId: string
): Promise<{ paymentIntentId: string; amountPaid: number } | null> {
  const invoices = await stripe.invoices.list({ subscription: subId, limit: 5 });
  const paidInvoice = invoices.data.find(
    (inv) => inv.status === "paid" && (inv.amount_paid ?? 0) > 0
  );
  if (!paidInvoice) return null;

  // Use the InvoicePayments API (Stripe v20) to find the PaymentIntent.
  const payments = await stripe.invoicePayments.list({ invoice: paidInvoice.id, limit: 5 });
  const paidPayment = payments.data.find((p) => p.status === "paid");
  if (!paidPayment) return null;

  const pi = paidPayment.payment.payment_intent;
  if (!pi) return null;

  const piId = typeof pi === "string" ? pi : pi.id;
  return { paymentIntentId: piId, amountPaid: paidPayment.amount_paid ?? paidInvoice.amount_paid };
}

/**
 * GET — preview: returns subscription info without cancelling.
 */
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }
  if (!checkIsPro(req, session.user.email)) {
    return NextResponse.json({ error: "No active Pro subscription" }, { status: 403 });
  }

  const sub = await findActiveSubscription(session.user.email);
  if (!sub) {
    return NextResponse.json(
      { error: "No active Stripe subscription found for this account" },
      { status: 404 }
    );
  }

  const days = daysSince(sub.start_date);
  const eligibleForRefund = days <= REFUND_WINDOW_DAYS;

  let refundAmountCents = 0;
  if (eligibleForRefund) {
    const paid = await findPaidPaymentIntentId(sub.id);
    if (paid) refundAmountCents = paid.amountPaid;
  }

  return NextResponse.json({
    eligible_for_refund: eligibleForRefund,
    days_since_start: Math.floor(days),
    refund_amount_cents: refundAmountCents,
    current_period_end_iso: new Date(periodEnd(sub) * 1000).toISOString(),
  });
}

/**
 * POST — actually cancels the subscription.
 * Within REFUND_WINDOW_DAYS: cancel immediately + full refund of last payment.
 * After that: cancel at period end, no refund.
 */
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }
  if (!checkIsPro(req, session.user.email)) {
    return NextResponse.json({ error: "No active Pro subscription" }, { status: 403 });
  }

  const sub = await findActiveSubscription(session.user.email);
  if (!sub) {
    return NextResponse.json(
      { error: "No active Stripe subscription found for this account" },
      { status: 404 }
    );
  }

  const days = daysSince(sub.start_date);
  const eligibleForRefund = days <= REFUND_WINDOW_DAYS;

  if (eligibleForRefund) {
    // Cancel immediately.
    await stripe.subscriptions.cancel(sub.id);

    // Refund the latest paid charge, if any.
    let refundAmountCents = 0;
    const paid = await findPaidPaymentIntentId(sub.id);
    if (paid) {
      const refund = await stripe.refunds.create({
        payment_intent: paid.paymentIntentId,
        reason: "requested_by_customer",
      });
      refundAmountCents = refund.amount;
    }

    const res = NextResponse.json({
      cancelled: true,
      refunded: refundAmountCents > 0,
      refund_amount_cents: refundAmountCents,
      cancel_at: "immediate",
    });
    clearProCookie(res);
    return res;
  } else {
    // Cancel at end of billing period.
    await stripe.subscriptions.update(sub.id, { cancel_at_period_end: true });
    return NextResponse.json({
      cancelled: true,
      refunded: false,
      refund_amount_cents: 0,
      cancel_at: new Date(periodEnd(sub) * 1000).toISOString(),
    });
  }
}
