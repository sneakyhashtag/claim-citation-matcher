import { Resend } from "resend";

// Lazy — avoids "Missing API key" build error when RESEND_API_KEY is not set locally.
let _resend: Resend | null = null;
function getResend(): Resend {
  if (!_resend) _resend = new Resend(process.env.RESEND_API_KEY ?? "");
  return _resend;
}

const FROM = process.env.EMAIL_FROM ?? "Reference Finder <noreply@referencefinder.app>";

export async function sendPaymentFailedEmail(to: string): Promise<void> {
  if (!process.env.RESEND_API_KEY) {
    console.warn("[email] RESEND_API_KEY not set — skipping payment failed email");
    return;
  }
  try {
    await getResend().emails.send({
      from: FROM,
      to,
      subject: "Action needed: payment issue with your Reference Finder subscription",
      html: `
        <div style="font-family: system-ui, sans-serif; max-width: 480px; margin: 0 auto; color: #1a1a1a;">
          <h2 style="font-size: 20px; font-weight: 600; margin-bottom: 8px;">
            We couldn't process your payment
          </h2>
          <p style="color: #555; line-height: 1.6;">
            Your most recent Reference Finder Pro payment didn't go through.
            Don't worry — your Pro access is still active for the next
            <strong>3 days</strong> while we retry the charge.
          </p>
          <p style="color: #555; line-height: 1.6;">
            To avoid any interruption, please check that your payment method
            is up to date in your billing portal.
          </p>
          <a href="${process.env.NEXTAUTH_URL ?? "https://referencefinder.app"}"
             style="display: inline-block; margin-top: 16px; padding: 12px 24px;
                    background: #18181b; color: #fff; border-radius: 8px;
                    text-decoration: none; font-weight: 600; font-size: 14px;">
            Update payment method
          </a>
          <p style="margin-top: 24px; font-size: 12px; color: #888;">
            If you have questions, reply to this email and we'll help you out.
          </p>
        </div>
      `,
    });
    console.log(`[email] payment failed email sent to ${to}`);
  } catch (err) {
    console.error("[email] failed to send payment failed email:", err);
  }
}
