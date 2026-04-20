import Stripe from "stripe";
import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { sendPaymentFailedEmail } from "@/lib/email";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET ?? "";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");

  if (!sig) {
    return NextResponse.json({ error: "Missing stripe-signature header" }, { status: 400 });
  }
  if (!webhookSecret) {
    console.error("[webhook] STRIPE_WEBHOOK_SECRET is not set");
    return NextResponse.json({ error: "Webhook secret not configured" }, { status: 500 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Signature verification failed";
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  try {
    switch (event.type) {
      // ── Successful recurring payment ─────────────────────────────────────
      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        // Only care about subscription invoices (not one-off charges).
        if (!invoice.subscription) break;
        const email = await emailForCustomer(invoice.customer as string);
        if (!email) break;
        await sql`
          UPDATE users
          SET pro_status        = true,
              grace_period_until = NULL
          WHERE email = ${email}
        `;
        console.log(`[webhook] payment_succeeded — Pro renewed for ${email}`);
        break;
      }

      // ── Failed payment — grant 3-day grace period + notify user ──────────
      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        if (!invoice.subscription) break;
        const email = await emailForCustomer(invoice.customer as string);
        if (!email) break;
        // Only start a grace period on the first failure attempt.
        // Stripe retries automatically; we don't want to keep resetting the window.
        const attempt = invoice.attempt_count ?? 1;
        if (attempt === 1) {
          await sql`
            UPDATE users
            SET grace_period_until = NOW() + INTERVAL '3 days'
            WHERE email = ${email}
              AND (grace_period_until IS NULL OR grace_period_until < NOW())
          `;
          await sendPaymentFailedEmail(email);
          console.log(`[webhook] payment_failed — grace period started for ${email}`);
        } else {
          console.log(`[webhook] payment_failed attempt ${attempt} for ${email} — no new grace period`);
        }
        break;
      }

      // ── Subscription status changed (plan switch, reactivation, etc.) ────
      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription;
        const prev = (event.data.previous_attributes ?? {}) as { status?: string };
        const email = await emailForCustomer(sub.customer as string);
        if (!email) break;

        if (sub.status === "active" || sub.status === "trialing") {
          await sql`
            UPDATE users
            SET pro_status        = true,
                grace_period_until = NULL
            WHERE email = ${email}
          `;
          console.log(`[webhook] subscription ${sub.id} ${sub.status} for ${email}`);
        } else if (sub.status === "canceled" || sub.status === "unpaid") {
          await sql`
            UPDATE users
            SET pro_status        = false,
                grace_period_until = NULL
            WHERE email = ${email}
          `;
          console.log(`[webhook] subscription ${sub.id} ${sub.status} — downgraded ${email}`);
        }

        // Trial converted to paid — mark trial as used.
        if (prev.status === "trialing" && sub.status === "active") {
          await markTrialUsed(email);
        }
        break;
      }

      // ── Subscription fully cancelled ─────────────────────────────────────
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        const email = await emailForCustomer(sub.customer as string);
        if (!email) break;
        await sql`
          UPDATE users
          SET pro_status        = false,
              grace_period_until = NULL
          WHERE email = ${email}
        `;
        console.log(`[webhook] subscription deleted — downgraded ${email}`);

        // Cancelled during active trial → mark trial as used.
        const nowSec = Math.floor(Date.now() / 1000);
        if (sub.trial_end !== null && sub.trial_end > nowSec) {
          await markTrialUsed(email);
        }
        break;
      }

      default:
        break;
    }
  } catch (err) {
    console.error(`[webhook] error handling ${event.type}:`, err);
    // Return 200 so Stripe doesn't retry — we'll fix any DB inconsistency via
    // check-subscription on the next page load.
    return NextResponse.json({ received: true, error: "handler error" });
  }

  return NextResponse.json({ received: true });
}

// ── helpers ──────────────────────────────────────────────────────────────────

async function emailForCustomer(customerId: string): Promise<string | null> {
  try {
    const customer = await stripe.customers.retrieve(customerId);
    if (customer.deleted || !("email" in customer) || !customer.email) return null;
    return customer.email;
  } catch {
    return null;
  }
}

async function markTrialUsed(email: string): Promise<void> {
  await sql`
    INSERT INTO users (email, has_used_trial, created_at)
    VALUES (${email}, true, NOW())
    ON CONFLICT (email) DO UPDATE SET has_used_trial = true
  `;
  console.log(`[webhook] has_used_trial set for ${email}`);
}
