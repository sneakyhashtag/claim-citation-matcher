import { createHmac, timingSafeEqual } from "crypto";
import type { NextRequest, NextResponse } from "next/server";

export const DAILY_LIMIT = 10;
const COOKIE_NAME = "_rf_usage";

// Falls back to a long development default so local dev works out of the box.
// In production, set COOKIE_SECRET in your Vercel environment variables.
function getSecret(): string {
  return (
    process.env.COOKIE_SECRET ??
    "dev-fallback-please-set-COOKIE_SECRET-in-production"
  );
}

// ── payload ────────────────────────────────────────────────────────────────────

interface UsagePayload {
  count: number;
  date: string; // "YYYY-MM-DD" UTC — used to detect day rollover
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

  // Constant-time comparison prevents timing-based signature recovery
  const expected = sign(data);
  const aBuf = Buffer.from(sig);
  const bBuf = Buffer.from(expected);
  if (aBuf.length !== bBuf.length || !timingSafeEqual(aBuf, bBuf)) return null;

  try {
    return JSON.parse(
      Buffer.from(data, "base64url").toString("utf8")
    ) as UsagePayload;
  } catch {
    return null;
  }
}

// ── public API ─────────────────────────────────────────────────────────────────

/** Read current usage from the request cookie without modifying anything. */
export function readUsage(req: NextRequest): UsageInfo {
  const today = todayUTC();
  const raw = req.cookies.get(COOKIE_NAME)?.value ?? "";
  const payload = raw ? decode(raw) : null;

  // Missing, tampered, or stale cookie → treat as zero usage
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
 * Check whether a search is allowed and, if so, compute the incremented cookie
 * value to be written.
 *
 * The caller MUST call `applyToResponse(res)` on every response that exits
 * after this check (including 400 / 500 errors) so the count is persisted
 * even when downstream processing fails.
 */
export function checkAndIncrement(req: NextRequest): {
  allowed: boolean;
  info: UsageInfo;
  applyToResponse: (res: NextResponse) => void;
} {
  const today = todayUTC();
  const raw = req.cookies.get(COOKIE_NAME)?.value ?? "";
  const payload = raw ? decode(raw) : null;

  const currentCount = payload?.date === today ? payload.count : 0;

  if (currentCount >= DAILY_LIMIT) {
    return {
      allowed: false,
      info: { count: currentCount, remaining: 0, limit: DAILY_LIMIT },
      applyToResponse: () => {},
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
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        path: "/",
        // 2 days — correctness is driven by the `date` field inside the
        // payload, not this expiry. Cookie is refreshed on every search.
        maxAge: 60 * 60 * 24 * 2,
      });
    },
  };
}
