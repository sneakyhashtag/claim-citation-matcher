import { NextResponse } from "next/server";

/** Returns the Stripe publishable key for use in the client-side Stripe.js SDK. */
export async function GET() {
  const key = process.env.STRIPE_PUBLISHABLE_KEY;
  if (!key) {
    return NextResponse.json({ error: "Stripe is not configured" }, { status: 500 });
  }
  return NextResponse.json({ publishableKey: key });
}
