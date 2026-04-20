import Stripe from "stripe";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { setProCookie } from "@/lib/pro-cookie";
import { sql } from "@/lib/db";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function GET(req: NextRequest) {
  // Must be signed in to activate Pro — guests cannot subscribe.
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json(
      { error: "You must be signed in to activate Pro." },
      { status: 401 }
    );
  }

  const sessionId = req.nextUrl.searchParams.get("session_id");
  if (!sessionId) {
    return NextResponse.json({ error: "Missing session_id" }, { status: 400 });
  }

  let stripeSession: Stripe.Checkout.Session;
  try {
    stripeSession = await stripe.checkout.sessions.retrieve(sessionId);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to retrieve session";
    return NextResponse.json({ error: message }, { status: 500 });
  }

  // "no_payment_required" covers trial subscriptions where no charge is made at checkout.
  const paymentOk =
    stripeSession.payment_status === "paid" ||
    stripeSession.payment_status === "no_payment_required";
  if (!paymentOk || stripeSession.status !== "complete") {
    return NextResponse.json({ error: "Payment not complete" }, { status: 402 });
  }

  // has_used_trial is managed by the Stripe webhook (subscription.updated /
  // subscription.deleted). Do not set it here.

  const res = NextResponse.json({ pro: true });
  setProCookie(res);
  return res;
}
