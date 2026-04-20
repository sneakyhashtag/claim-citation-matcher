import Stripe from "stripe";
import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET ?? "";

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
      const session = event.data.object as Stripe.Checkout.Session;
      console.log(`[webhook] checkout completed for: ${session.customer_email}`);
      break;
    }

    case "customer.subscription.updated": {
      // Trial converted to paid subscription — mark trial as used.
      const sub = event.data.object as Stripe.Subscription;
      const prev = (event.data.previous_attributes ?? {}) as { status?: string };
      if (prev.status === "trialing" && sub.status === "active") {
        console.log(`[webhook] trial converted to active for subscription: ${sub.id}`);
        await markTrialUsed(sub.customer as string);
      }
      break;
    }

    case "customer.subscription.deleted": {
      // If deleted while still in trial period, mark trial as used so the
      // user cannot claim another free trial.
      const sub = event.data.object as Stripe.Subscription;
      const nowSec = Math.floor(Date.now() / 1000);
      const deletedDuringTrial = sub.trial_end !== null && sub.trial_end > nowSec;
      if (deletedDuringTrial) {
        console.log(`[webhook] subscription cancelled during trial: ${sub.id}`);
        await markTrialUsed(sub.customer as string);
      } else {
        console.log(`[webhook] subscription cancelled (post-trial): ${sub.id}`);
      }
      break;
    }

    case "invoice.payment_failed": {
      const invoice = event.data.object as Stripe.Invoice;
      console.log(`[webhook] payment failed for: ${invoice.customer_email}`);
      break;
    }

    default:
      break;
  }

  return NextResponse.json({ received: true });
}

async function markTrialUsed(customerId: string): Promise<void> {
  try {
    const customer = await stripe.customers.retrieve(customerId);
    if (customer.deleted || !("email" in customer) || !customer.email) return;
    await sql`
      INSERT INTO users (email, has_used_trial, created_at)
      VALUES (${customer.email}, true, NOW())
      ON CONFLICT (email) DO UPDATE SET has_used_trial = true
    `;
    console.log(`[webhook] has_used_trial set for: ${customer.email}`);
  } catch (err) {
    console.error("[webhook] markTrialUsed failed:", err);
  }
}
