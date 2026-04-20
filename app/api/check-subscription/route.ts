import Stripe from "stripe";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { setProCookie, clearProCookie, isAdminEmail } from "@/lib/pro-cookie";
import { sql } from "@/lib/db";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

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

  if (isAdminEmail(email)) {
    const res = NextResponse.json({ pro: true, hasUsedTrial: true, subscriptionStatus: "active" });
    setProCookie(res);
    return res;
  }

  const row = await getUserRow(email);
  const hasUsedTrial: boolean = row?.has_used_trial ?? false;

  // Grace period: payment failed but we're giving 3 extra days.
  if (row?.grace_period_until && new Date(row.grace_period_until) > new Date()) {
    const res = NextResponse.json({
      pro: true,
      hasUsedTrial,
      gracePeriod: true,
      subscriptionStatus: "past_due",
    });
    setProCookie(res);
    return res;
  }

  try {
    const customers = await stripe.customers.list({ email, limit: 5 });

    for (const customer of customers.data) {
      for (const status of ["active", "trialing", "past_due"] as const) {
        const subs = await stripe.subscriptions.list({
          customer: customer.id,
          status,
          limit: 1,
        });
        if (subs.data.length === 0) continue;

        const sub = subs.data[0];

        // Keep DB in sync.
        await sql`UPDATE users SET pro_status = true WHERE email = ${email}`.catch(() => {});

        const payload: Record<string, unknown> = {
          pro: true,
          hasUsedTrial,
          subscriptionStatus: sub.status,
          periodEnd: (sub as any).current_period_end ?? null,
          trialEnd: sub.trial_end ?? null,
        };

        const res = NextResponse.json(payload);
        setProCookie(res);
        return res;
      }
    }

    // No qualifying subscription.
    await sql`
      UPDATE users SET pro_status = false, grace_period_until = NULL WHERE email = ${email}
    `.catch(() => {});

    const res = NextResponse.json({ pro: false, hasUsedTrial });
    clearProCookie(res);
    return res;
  } catch (err) {
    // Stripe unavailable — fall back to DB flag.
    if (row?.pro_status) {
      const res = NextResponse.json({ pro: true, hasUsedTrial, fallback: true });
      setProCookie(res);
      return res;
    }
    const message = err instanceof Error ? err.message : "Failed to check subscription";
    return NextResponse.json({ error: message, hasUsedTrial }, { status: 500 });
  }
}
