import { createHmac, timingSafeEqual } from "crypto";
import type { NextRequest, NextResponse } from "next/server";

export const DAILY_LIMIT = 10;
const COOKIE_NAME = "_rf_usage";

// Set COOKIE_SECRET in your Vercel environment variables.
// The dev fallback lets local development work without any config, but you
// should always set a real secret in production.
function getSecret(): string {
  return (
    process.env.COOKIE_SECRET ??
    "dev-fallback-please-set-COOKIE_SECRET-in-production"
  );
}

// ── payload ────────────────────────────────────────────────────────────────────

interface UsagePayload {
  /** How many searches have been used on `date`. */
  count: number;
  /** UTC date string "YYYY-MM-DD". When this differs from today the count resets. */
  date: string;
}

export interface UsageInfo {
  count: number;
  remaining: number;
  limit: number;
}

function todayUTC(): string {
  return new Date().toISOString().slice(0, 10);
}

// ── signing ────────────────────────────────────────────────────────────────────
//
// Cookie value format: base64url(JSON payload) + "." + base64url(HMAC-SHA256)
//
// Security properties:
//   • Users can read the payload (it's base64, not encrypted), but they cannot
//     modify the count without invalidating the HMAC signature.
//   • Users CAN delete the cookie or open a private window to reset their count.
//     Stateless cookies cannot prevent this — the signing only stops tampering.
//   • timingSafeEqual prevents timing-based signature forgery.

function sign(data: string): string {
  return createHmac("sha256", getSecret()).update(data).digest("base64url");
}

function encode(payload: UsagePayload): string {
  const data = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${data}.${sign(data)}`;
}

function decode(raw: string): UsagePayload | null {
  const dot = raw.lastIndexOf(".");
  if (dot === -1) return null;

  const data = raw.slice(0, dot);
  const sig = raw.slice(dot + 1);

  // Both sides are base64url strings (ASCII only); compare them as UTF-8
  // buffers so we can use the constant-time Node.js primitive.
  const expected = sign(data);
  const aBuf = Buffer.from(sig);
  const bBuf = Buffer.from(expected);

  // timingSafeEqual requires equal-length buffers; length mismatch = invalid.
  if (aBuf.length !== bBuf.length || !timingSafeEqual(aBuf, bBuf)) return null;

  let parsed: unknown;
  try {
    parsed = JSON.parse(Buffer.from(data, "base64url").toString("utf8"));
  } catch {
    return null;
  }

  // Validate shape — assign to locals so TypeScript can narrow correctly.
  if (typeof parsed !== "object" || parsed === null) return null;
  const p = parsed as Record<string, unknown>;
  const count = p.count;
  const date = p.date;
  if (
    typeof count !== "number" ||
    !Number.isInteger(count) ||
    count < 0 ||
    typeof date !== "string"
  ) {
    return null;
  }

  return { count, date } satisfies UsagePayload;
}

// ── public API ─────────────────────────────────────────────────────────────────

/** Read current usage from the request cookie without modifying anything. */
export function readUsage(req: NextRequest): UsageInfo {
  const today = todayUTC();
  const raw = req.cookies.get(COOKIE_NAME)?.value ?? "";
  const payload = raw ? decode(raw) : null;

  // Missing, tampered, or stale (yesterday's) cookie → treat as zero usage.
  if (!payload || payload.date !== today) {
    return { count: 0, remaining: DAILY_LIMIT, limit: DAILY_LIMIT };
  }

  return {
    count: payload.count,
    remaining: Math.max(0, DAILY_LIMIT - payload.count),
    limit: DAILY_LIMIT,
  };
}

/**
 * Check whether a search is allowed and prepare the incremented cookie.
 *
 * The caller MUST call `applyToResponse(res)` on EVERY response that exits
 * after this check — including 400 and 500 errors — so the updated count is
 * persisted even when downstream processing fails.
 *
 * When `allowed` is false, `applyToResponse` is a no-op (nothing to update),
 * but callers should still call it for consistency.
 */
export function checkAndIncrement(req: NextRequest): {
  allowed: boolean;
  info: UsageInfo;
  applyToResponse: (res: NextResponse) => void;
} {
  const today = todayUTC();
  const raw = req.cookies.get(COOKIE_NAME)?.value ?? "";
  const payload = raw ? decode(raw) : null;

  // A stale date means a new day — reset the count to zero.
  const currentCount = payload?.date === today ? payload.count : 0;

  if (currentCount >= DAILY_LIMIT) {
    return {
      allowed: false,
      info: { count: currentCount, remaining: 0, limit: DAILY_LIMIT },
      applyToResponse: () => {}, // no-op: nothing to write when already at limit
    };
  }

  const newCount = currentCount + 1;
  const cookieValue = encode({ count: newCount, date: today });

  return {
    allowed: true,
    info: {
      count: newCount,
      remaining: DAILY_LIMIT - newCount,
      limit: DAILY_LIMIT,
    },
    applyToResponse: (res: NextResponse) => {
      res.cookies.set(COOKIE_NAME, cookieValue, {
        httpOnly: true,
        // "lax" (not "strict") so the cookie is sent on top-level navigations
        // from external sites (e.g. after an OAuth redirect from Google).
        // "strict" would withhold the cookie on cross-site navigations and
        // cause the counter to appear reset after sign-in.
        sameSite: "lax",
        // Only sent over HTTPS in production; plain HTTP is fine for local dev.
        secure: process.env.NODE_ENV === "production",
        path: "/",
        // 7 days — correctness is driven by the `date` field inside the payload,
        // not by this expiry. The cookie is refreshed on every successful search,
        // so 7 days is just a cleanup window for users who stop searching.
        maxAge: 60 * 60 * 24 * 7,
      });
    },
  };
}
