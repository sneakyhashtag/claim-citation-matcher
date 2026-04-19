import Stripe from "stripe";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { sql } from "@/lib/db";
import { setProCookie } from "@/lib/pro-cookie";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { getIdentifier } from "@/lib/db-usage";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

/**
 * Creates a Stripe subscription from a validated paymentMethodId.
 * Called after /api/setup-intent confirms the card is valid.
 * Grants Pro access immediately on success.
 */
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json(
      { error: "You must be signed in to subscribe." },
      { status: 401 }
    );
  }

  const identifier = getIdentifier(req, session);
  const rl = await checkRateLimit(identifier, "subscribe", [
    { windowType: "minute", limit: 5 },
  ]);
  if (!rl.allowed) return rateLimitResponse(rl.retryAfterSeconds);

  const body = await req.json().catch(() => ({}));
  const plan: string = body.plan === "yearly" ? "yearly" : "monthly";
  const paymentMethodId: string | undefined = body.paymentMethodId;

  if (!paymentMethodId) {
    return NextResponse.json({ error: "Missing paymentMethodId" }, { status: 400 });
  }

  const priceId =
    plan === "yearly"
      ? process.env.STRIPE_YEARLY_PRICE_ID
      : process.env.STRIPE_MONTHLY_PRICE_ID;

  if (!priceId) {
    return NextResponse.json(
      { error: `STRIPE_${plan.toUpperCase()}_PRICE_ID is not configured` },
      { status: 500 }
    );
  }

  // Find or create the Stripe customer for this user
  let customerId: string;
  const existing = await stripe.customers.list({
    email: session.user.email,
    limit: 1,
  });
  if (existing.data.length > 0) {
    customerId = existing.data[0].id;
  } else {
    const customer = await stripe.customers.create({
      email: session.user.email,
    });
    customerId = customer.id;
  }

  // Attach the validated payment method to the customer
  try {
    await stripe.paymentMethods.attach(paymentMethodId, { customer: customerId });
  } catch {
    // Already attached — ignore
  }
  await stripe.customers.update(customerId, {
    invoice_settings: { default_payment_method: paymentMethodId },
  });

  // Check trial eligibility
  const trialResult = await sql`
    SELECT has_used_trial FROM users WHERE email = ${session.user.email}
  `;
  const hasUsedTrial = trialResult.rows[0]?.has_used_trial ?? false;

  const subParams: Stripe.SubscriptionCreateParams = {
    customer: customerId,
    items: [{ price: priceId }],
    default_payment_method: paymentMethodId,
    expand: ["latest_invoice.payment_intent"],
    ...(hasUsedTrial
      ? {}
      : {
          trial_period_days: 7,
        }),
  };

  let subscription: Stripe.Subscription;
  try {
    subscription = await stripe.subscriptions.create(subParams);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Subscription failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  // Check if the first invoice needs additional payment action (3DS/SCA)
  // This only applies to non-trial subscriptions where a charge happens immediately.
  const latestInvoice = subscription.latest_invoice as (Stripe.Invoice & { payment_intent?: Stripe.PaymentIntent | string | null }) | null;
  const paymentIntentRaw = latestInvoice?.payment_intent;
  const paymentIntent = typeof paymentIntentRaw === "object" && paymentIntentRaw !== null
    ? paymentIntentRaw as Stripe.PaymentIntent
    : null;

  if (paymentIntent && paymentIntent.status === "requires_action") {
    return NextResponse.json({
      requiresAction: true,
      clientSecret: paymentIntent.client_secret,
      subscriptionId: subscription.id,
    });
  }

  if (
    paymentIntent &&
    paymentIntent.status !== "succeeded" &&
    paymentIntent.status !== "processing" &&
    subscription.status !== "trialing" &&
    subscription.status !== "active"
  ) {
    return NextResponse.json(
      { error: "Payment could not be processed. Please try a different card." },
      { status: 402 }
    );
  }

  // Mark trial used if applicable
  if (!hasUsedTrial) {
    await sql`
      INSERT INTO users (email, has_used_trial, created_at)
      VALUES (${session.user.email}, true, NOW())
      ON CONFLICT (email) DO UPDATE SET has_used_trial = true
    `;
  }

  const res = NextResponse.json({ success: true });
  setProCookie(res);
  return res;
}
