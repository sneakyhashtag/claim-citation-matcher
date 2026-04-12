import Stripe from "stripe";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { sql } from "@/lib/db";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

const BASE_URL = (
  process.env.NEXTAUTH_URL ?? "http://localhost:3000"
).replace(/\/$/, "");

export async function POST(req: NextRequest) {
  const session = await auth();

  const body = await req.json().catch(() => ({}));
  const plan: string = body.plan === "yearly" ? "yearly" : "monthly";

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

  // Check whether this user has already used their free trial.
  let hasUsedTrial = false;
  if (session?.user?.email) {
    const result = await sql`
      SELECT has_used_trial FROM users WHERE email = ${session.user.email}
    `;
    hasUsedTrial = result.rows[0]?.has_used_trial ?? false;
  }

  const params: Stripe.Checkout.SessionCreateParams = {
    mode: "subscription",
    payment_method_collection: "always",
    line_items: [{ price: priceId, quantity: 1 }],
    // Only offer the trial if the user hasn't used one before.
    ...(hasUsedTrial ? {} : { subscription_data: { trial_period_days: 7 } }),
    success_url: `${BASE_URL}/?payment=success&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${BASE_URL}/`,
  };

  if (session?.user?.email) {
    params.customer_email = session.user.email;
  }

  try {
    const checkoutSession = await stripe.checkout.sessions.create(params);
    return NextResponse.json({ url: checkoutSession.url });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to create checkout session";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
