import Stripe from "stripe";
import { NextRequest, NextResponse } from "next/server";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

// Set STRIPE_WEBHOOK_SECRET in your Vercel environment variables.
// Get it from the Stripe dashboard → Developers → Webhooks → your endpoint.
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET ?? "";

// Next.js parses the body by default; we need the raw bytes to verify the
// Stripe signature, so we read it as text before any JSON parsing.
export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");

  if (!sig) {
    return NextResponse.json({ error: "Missing stripe-signature header" }, { status: 400 });
  }

  if (!webhookSecret) {
    console.error("STRIPE_WEBHOOK_SECRET is not set");
    return NextResponse.json({ error: "Webhook secret not configured" }, { status: 500 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Signature verification failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed": {
      // The pro cookie is set client-side via /api/activate-pro immediately
      // after the success redirect. This webhook is the reliable server-side
      // signal and can be extended to write to a database in the future.
      const session = event.data.object as Stripe.Checkout.Session;
      console.log(`[webhook] Pro subscription activated for: ${session.customer_email}`);
      break;
    }

    case "customer.subscription.deleted": {
      // Subscription was cancelled. The signed pro cookie expires naturally
      // after PRO_DURATION_DAYS. Future: invalidate via database lookup.
      const sub = event.data.object as Stripe.Subscription;
      console.log(`[webhook] Subscription cancelled: ${sub.id}`);
      break;
    }

    case "invoice.payment_failed": {
      const invoice = event.data.object as Stripe.Invoice;
      console.log(`[webhook] Payment failed for: ${invoice.customer_email}`);
      break;
    }

    default:
      break;
  }

  return NextResponse.json({ received: true });
}
