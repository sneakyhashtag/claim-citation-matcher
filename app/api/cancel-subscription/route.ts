import Stripe from "stripe";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { checkIsPro, clearProCookie } from "@/lib/pro-cookie";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

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

/** current_period_end — removed from Stripe v20 TS types, cast needed. */
function periodEnd(sub: Stripe.Subscription): number {
  return (sub as any).current_period_end ?? 0;
}

/**
 * Returns the first paid invoice for the subscription, or null if none exists
 * (i.e. the user is still in their trial and has never been charged).
 */
async function findPaidInvoice(
  subId: string
): Promise<{ paymentIntentId: string; amountPaid: number } | null> {
  const invoices = await stripe.invoices.list({ subscription: subId, limit: 5 });
  const paidInvoice = invoices.data.find(
    (inv) => inv.status === "paid" && (inv.amount_paid ?? 0) > 0
  );
  if (!paidInvoice) return null;

  const payments = await stripe.invoicePayments.list({ invoice: paidInvoice.id, limit: 5 });
  const paidPayment = payments.data.find((p) => p.status === "paid");
  if (!paidPayment) return null;

  const pi = paidPayment.payment.payment_intent;
  if (!pi) return null;

  const piId = typeof pi === "string" ? pi : pi.id;
  return { paymentIntentId: piId, amountPaid: paidPayment.amount_paid ?? paidInvoice.amount_paid };
}

/**
 * GET — preview: returns whether the user has been charged and when their
 * current period ends, so the frontend can show the right cancel confirmation.
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

  const paid = await findPaidInvoice(sub.id);

  return NextResponse.json({
    has_been_charged: paid !== null,
    // No refunds are issued — cancelling after charge keeps Pro until period end.
    refund_amount_cents: 0,
    current_period_end_iso: new Date(periodEnd(sub) * 1000).toISOString(),
    is_trialing: sub.status === "trialing",
  });
}

/**
 * POST — cancels the subscription.
 *
 * Trial (never charged):
 *   → Cancel immediately. Nothing to refund. Pro access ends now.
 *
 * Paid (at least one successful charge):
 *   → cancel_at_period_end. No refund. Pro continues until current_period_end.
 *     This matches how Spotify, Netflix, and Claude handle cancellation.
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

  const paid = await findPaidInvoice(sub.id);
  const hasBeenCharged = paid !== null;

  if (!hasBeenCharged) {
    // Still in trial — cancel immediately, nothing to refund.
    await stripe.subscriptions.cancel(sub.id);
    const res = NextResponse.json({
      cancelled: true,
      refunded: false,
      refund_amount_cents: 0,
      cancel_at: "immediate",
    });
    clearProCookie(res);
    return res;
  } else {
    // Already charged — cancel at end of current billing period.
    // User keeps Pro until current_period_end; no refund issued.
    await stripe.subscriptions.update(sub.id, { cancel_at_period_end: true });
    return NextResponse.json({
      cancelled: true,
      refunded: false,
      refund_amount_cents: 0,
      cancel_at: new Date(periodEnd(sub) * 1000).toISOString(),
    });
  }
}
