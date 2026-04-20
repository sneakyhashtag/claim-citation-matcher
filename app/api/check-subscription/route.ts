import Stripe from "stripe";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { setProCookie, clearProCookie, isAdminEmail } from "@/lib/pro-cookie";
import { sql } from "@/lib/db";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

/**
 * GET /api/check-subscription
 *
 * Verifies the signed-in user's Stripe subscription status and syncs the Pro
 * cookie accordingly. The email comes from the server-side session — never
 * from the client — so it cannot be spoofed.
 *
 * - Signed in + active Stripe subscription  → sets Pro cookie, returns { pro: true }
 * - Signed in + no active subscription      → clears Pro cookie, returns { pro: false }
 * - Not signed in                           → returns { pro: false } (no cookie change)
 */
async function getHasUsedTrial(email: string): Promise<boolean> {
  try {
    const result = await sql`SELECT has_used_trial FROM users WHERE email = ${email}`;
    return result.rows[0]?.has_used_trial ?? false;
  } catch {
    return false;
  }
}

export async function GET(_req: NextRequest) {
  const session = await auth();

  if (!session?.user?.email) {
    return NextResponse.json({ pro: false, hasUsedTrial: false });
  }

  // Admin bypass — return Pro immediately without calling Stripe.
  if (isAdminEmail(session.user.email)) {
    console.log(`[check-subscription] admin bypass for ${session.user.email}`);
    const res = NextResponse.json({ pro: true, hasUsedTrial: true });
    setProCookie(res);
    return res;
  }

  const hasUsedTrial = await getHasUsedTrial(session.user.email);

  try {
    // Look up all Stripe customers with this email (there may be more than one
    // if the user checked out multiple times with the same address).
    const customers = await stripe.customers.list({
      email: session.user.email,
      limit: 5,
    });

    for (const customer of customers.data) {
      // Check active subscriptions.
      const activeSubs = await stripe.subscriptions.list({
        customer: customer.id,
        status: "active",
        limit: 1,
      });
      if (activeSubs.data.length > 0) {
        const res = NextResponse.json({ pro: true, hasUsedTrial });
        setProCookie(res);
        return res;
      }
      // Also treat trialing subscriptions as Pro.
      const trialingSubs = await stripe.subscriptions.list({
        customer: customer.id,
        status: "trialing",
        limit: 1,
      });
      if (trialingSubs.data.length > 0) {
        const res = NextResponse.json({ pro: true, hasUsedTrial });
        setProCookie(res);
        return res;
      }
    }

    // No active subscription for any matching customer record.
    const res = NextResponse.json({ pro: false, hasUsedTrial });
    clearProCookie(res);
    return res;
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to check subscription";
    return NextResponse.json({ error: message, hasUsedTrial }, { status: 500 });
  }
}
