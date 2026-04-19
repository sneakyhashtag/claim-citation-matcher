import Stripe from "stripe";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { getIdentifier } from "@/lib/db-usage";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

/**
 * Creates a Stripe SetupIntent for $0 card validation.
 * The client uses this to confirm card details inline; on success,
 * the paymentMethodId is passed to /api/subscribe to create the subscription.
 */
export async function POST(req: NextRequest) {
  const session = await auth();

  const identifier = getIdentifier(req, session);
  const rl = await checkRateLimit(identifier, "setup-intent", [
    { windowType: "minute", limit: 5 },
  ]);
  if (!rl.allowed) return rateLimitResponse(rl.retryAfterSeconds);

  let customerId: string | undefined;

  if (session?.user?.email) {
    const existing = await stripe.customers.list({
      email: session.user.email,
      limit: 1,
    });
    if (existing.data.length > 0) {
      customerId = existing.data[0].id;
    } else {
      const customer = await stripe.customers.create({
        email: session.user.email,
      });
      customerId = customer.id;
    }
  }

  const setupIntent = await stripe.setupIntents.create({
    usage: "off_session",
    automatic_payment_methods: { enabled: true, allow_redirects: "never" },
    ...(customerId ? { customer: customerId } : {}),
  });

  return NextResponse.json({ clientSecret: setupIntent.client_secret });
}
