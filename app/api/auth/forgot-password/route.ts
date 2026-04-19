import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { getIdentifier } from "@/lib/db-usage";

/**
 * POST /api/auth/forgot-password
 * Accepts an email address and — if the account exists — stores a reset token.
 * Always returns 200 to prevent email enumeration.
 *
 * TODO: wire up an email provider (e.g. Resend) to send the actual reset link.
 * The reset token is stored in `password_resets` table (created below if absent).
 */
export async function POST(req: NextRequest) {
  const identifier = getIdentifier(req, null);
  const rl = await checkRateLimit(identifier, "forgot-password", [
    { windowType: "minute", limit: 3 },
  ]);
  if (!rl.allowed) return rateLimitResponse(rl.retryAfterSeconds);

  const body = await req.json().catch(() => ({}));
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";

  if (!email || !email.includes("@")) {
    // Return 200 regardless to prevent enumeration
    return NextResponse.json({ ok: true });
  }

  try {
    // Ensure the reset table exists (idempotent)
    await sql`
      CREATE TABLE IF NOT EXISTS password_resets (
        id         BIGSERIAL PRIMARY KEY,
        email      TEXT NOT NULL,
        token      TEXT NOT NULL UNIQUE,
        expires_at TIMESTAMPTZ NOT NULL,
        used       BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `;
    await sql`CREATE INDEX IF NOT EXISTS idx_password_resets_token ON password_resets (token)`;

    // Check if user exists — never disclose result to caller
    const result = await sql`SELECT id FROM users WHERE email = ${email} LIMIT 1`;
    if (result.rows.length > 0) {
      // Generate a cryptographically random token
      const { randomBytes } = await import("crypto");
      const token = randomBytes(32).toString("hex");
      const expiresAt = new Date(Date.now() + 1000 * 60 * 60); // 1 hour

      // Invalidate any existing tokens for this email
      await sql`DELETE FROM password_resets WHERE email = ${email}`;

      await sql`
        INSERT INTO password_resets (email, token, expires_at)
        VALUES (${email}, ${token}, ${expiresAt.toISOString()})
      `;

      // TODO: Send email with reset link:
      // const resetUrl = `${process.env.NEXTAUTH_URL}/reset-password?token=${token}`;
      // await sendEmail({ to: email, subject: "Reset your Reference Finder password", resetUrl });
      console.log(`[forgot-password] reset token for ${email}: ${token} (expires ${expiresAt.toISOString()})`);
    }
  } catch (err) {
    // Log server-side but still return 200 to the client
    console.error("[forgot-password] error:", err);
  }

  return NextResponse.json({ ok: true });
}
