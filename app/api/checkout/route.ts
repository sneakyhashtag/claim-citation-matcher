import Stripe from "stripe";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

const BASE_URL =
  process.env.NEXT_PUBLIC_BASE_URL ??
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

export async function POST(req: NextRequest) {
  const session = await auth();

  // Build the Checkout session params
  const params: Stripe.Checkout.SessionCreateParams = {
    mode: "subscription",
    line_items: [
      {
        price_data: {
          currency: "jpy",
          product_data: {
            name: "Reference Finder Pro",
            description: "Unlimited searches per day",
          },
          unit_amount: 699,
          recurring: { interval: "month" },
        },
        quantity: 1,
      },
    ],
    // {CHECKOUT_SESSION_ID} is a Stripe template variable replaced at redirect time.
    success_url: `${BASE_URL}/?success=1&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${BASE_URL}/`,
  };

  // Pre-fill email if the user is signed in
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
