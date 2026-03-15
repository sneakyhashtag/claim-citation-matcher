import Stripe from "stripe";
import { NextRequest, NextResponse } from "next/server";
import { setProCookie } from "@/lib/pro-cookie";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function GET(req: NextRequest) {
  const sessionId = req.nextUrl.searchParams.get("session_id");
  if (!sessionId) {
    return NextResponse.json({ error: "Missing session_id" }, { status: 400 });
  }

  let session: Stripe.Checkout.Session;
  try {
    session = await stripe.checkout.sessions.retrieve(sessionId);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to retrieve session";
    return NextResponse.json({ error: message }, { status: 500 });
  }

  if (session.payment_status !== "paid" || session.status !== "complete") {
    return NextResponse.json({ error: "Payment not complete" }, { status: 402 });
  }

  const res = NextResponse.json({ pro: true });
  setProCookie(res);
  return res;
}
