import Stripe from "stripe";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { setProCookie, clearProCookie, isAdminEmail } from "@/lib/pro-cookie";
import { sql } from "@/lib/db";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

/**
 * GET /api/check-subscription
 *
 * Verifies the signed-in user's Pro status and syncs the Pro cookie.
 * Source of truth priority:
 *   1. Admin email bypass
 *   2. DB grace_period_until (payment failed but within 3-day window)
 *   3. Stripe subscription status (active / trialing / past_due)
 * The DB pro_status column is kept in sync by the /api/stripe/webhook handler.
 */
async function getUserRow(email: string) {
  try {
    const result = await sql`
      SELECT has_used_trial, pro_status, grace_period_until
      FROM users WHERE email = ${email}
    `;
    return result.rows[0] ?? null;
  } catch {
    return null;
  }
}

export async function GET(_req: NextRequest) {
  const session = await auth();

  if (!session?.user?.email) {
    return NextResponse.json({ pro: false, hasUsedTrial: false });
  }

  const email = session.user.email;

  // Admin bypass.
  if (isAdminEmail(email)) {
    const res = NextResponse.json({ pro: true, hasUsedTrial: true });
    setProCookie(res);
    return res;
  }

  const row = await getUserRow(email);
  const hasUsedTrial: boolean = row?.has_used_trial ?? false;

  // Grace period: payment failed but we're giving the user 3 extra days.
  if (row?.grace_period_until && new Date(row.grace_period_until) > new Date()) {
    const res = NextResponse.json({ pro: true, hasUsedTrial, gracePeriod: true });
    setProCookie(res);
    return res;
  }

  try {
    const customers = await stripe.customers.list({ email, limit: 5 });

    for (const customer of customers.data) {
      // active, trialing, and past_due all count as Pro.
      // past_due = Stripe is retrying the payment (within its own retry window).
      for (const status of ["active", "trialing", "past_due"] as const) {
        const subs = await stripe.subscriptions.list({
          customer: customer.id,
          status,
          limit: 1,
        });
        if (subs.data.length > 0) {
          // Keep DB in sync in case the webhook missed an event.
          await sql`
            UPDATE users SET pro_status = true WHERE email = ${email}
          `.catch(() => {});
          const res = NextResponse.json({ pro: true, hasUsedTrial });
          setProCookie(res);
          return res;
        }
      }
    }

    // No qualifying subscription — ensure DB is also cleared.
    await sql`
      UPDATE users SET pro_status = false, grace_period_until = NULL
      WHERE email = ${email}
    `.catch(() => {});

    const res = NextResponse.json({ pro: false, hasUsedTrial });
    clearProCookie(res);
    return res;
  } catch (err) {
    // Stripe is down or rate-limited — fall back to the DB flag so we don't
    // accidentally downgrade users during an outage.
    if (row?.pro_status) {
      const res = NextResponse.json({ pro: true, hasUsedTrial, fallback: true });
      setProCookie(res);
      return res;
    }
    const message = err instanceof Error ? err.message : "Failed to check subscription";
    return NextResponse.json({ error: message, hasUsedTrial }, { status: 500 });
  }
}
