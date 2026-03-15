import { createHmac, timingSafeEqual } from "crypto";
import type { NextRequest, NextResponse } from "next/server";

export const DAILY_LIMIT = 3;
const COOKIE_NAME = "_rf_usage";

function getSecret(): string {
  return (
    process.env.COOKIE_SECRET ??
    "dev-fallback-please-set-COOKIE_SECRET-in-production"
  );
}

// ── payload ────────────────────────────────────────────────────────────────────

interface UsagePayload {
  count: number;
  date: string; // "YYYY-MM-DD" UTC
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
// Cookie value: base64url(JSON) + "." + base64url(HMAC-SHA256)
// Users can read the payload but cannot forge a different count.

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

  const expected = sign(data);
  const aBuf = Buffer.from(sig);
  const bBuf = Buffer.from(expected);
  if (aBuf.length !== bBuf.length || !timingSafeEqual(aBuf, bBuf)) return null;

  let parsed: unknown;
  try {
    parsed = JSON.parse(Buffer.from(data, "base64url").toString("utf8"));
  } catch {
    return null;
  }

  if (typeof parsed !== "object" || parsed === null) return null;
  const p = parsed as Record<string, unknown>;
  if (
    typeof p.count !== "number" ||
    !Number.isInteger(p.count) ||
    p.count < 0 ||
    typeof p.date !== "string"
  ) {
    return null;
  }

  return { count: p.count as number, date: p.date as string };
}

// ── public API ─────────────────────────────────────────────────────────────────

/** Read current usage without modifying anything. */
export function readUsage(req: NextRequest): UsageInfo {
  const today = todayUTC();
  const raw = req.cookies.get(COOKIE_NAME)?.value ?? "";
  const payload = raw ? decode(raw) : null;
  const count = payload?.date === today ? payload.count : 0;

  return {
    count,
    remaining: Math.max(0, DAILY_LIMIT - count),
    limit: DAILY_LIMIT,
  };
}

/**
 * Returns the current count for today (0 if cookie is missing, tampered, or
 * from a previous day).
 */
export function readCount(req: NextRequest): number {
  const today = todayUTC();
  const raw = req.cookies.get(COOKIE_NAME)?.value ?? "";
  const payload = raw ? decode(raw) : null;
  return payload?.date === today ? payload.count : 0;
}

/**
 * Write a cookie onto a response that records `newCount` for today.
 * Call this on the final response object before returning it.
 */
export function writeCount(res: NextResponse, newCount: number): void {
  const value = encode({ count: newCount, date: todayUTC() });
  res.cookies.set(COOKIE_NAME, value, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days; reset logic lives inside the payload
  });
}

// Keep the old checkAndIncrement export so the /api/usage route still compiles.
// New code should use readCount / writeCount directly.
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
  return {
    allowed: true,
    info: {
      count: newCount,
      remaining: DAILY_LIMIT - newCount,
      limit: DAILY_LIMIT,
    },
    applyToResponse: (res: NextResponse) => writeCount(res, newCount),
  };
}
