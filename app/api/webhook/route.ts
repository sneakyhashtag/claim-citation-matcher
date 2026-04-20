// Legacy path — kept so any existing Stripe webhook registration keeps working.
// The canonical handler lives at /api/stripe/webhook.
export { POST } from "@/app/api/stripe/webhook/route";
