import Stripe from "stripe";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

// NEXTAUTH_URL is the authoritative base URL for this app — it's already
// required for NextAuth to work, so it's always set in production.
// Strip any trailing slash so we can safely append paths.
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

  const params: Stripe.Checkout.SessionCreateParams = {
    mode: "subscription",
    line_items: [{ price: priceId, quantity: 1 }],
    // {CHECKOUT_SESSION_ID} is a Stripe template variable replaced at redirect time.
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
