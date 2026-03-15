import { createHmac, timingSafeEqual } from "crypto";
import type { NextRequest, NextResponse } from "next/server";

const COOKIE_NAME = "_rf_pro";
const PRO_DURATION_DAYS = 31;

// Reuses the same COOKIE_SECRET as the usage cookie.
function getSecret(): string {
  return (
    process.env.COOKIE_SECRET ??
    "dev-fallback-please-set-COOKIE_SECRET-in-production"
  );
}

interface ProPayload {
  /** UTC date string "YYYY-MM-DD" — pro access is valid through this date. */
  until: string;
}

function todayUTC(): string {
  return new Date().toISOString().slice(0, 10);
}

function futureDateUTC(days: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

// ── signing ─────────────────────────────────────────────────────────────────

function sign(data: string): string {
  return createHmac("sha256", getSecret()).update(data).digest("base64url");
}

function encode(payload: ProPayload): string {
  const data = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${data}.${sign(data)}`;
}

function decode(raw: string): ProPayload | null {
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
  const until = p.until;
  if (typeof until !== "string") return null;

  return { until } satisfies ProPayload;
}

// ── public API ───────────────────────────────────────────────────────────────

/** Returns true if the request carries a valid, unexpired pro cookie. */
export function readPro(req: NextRequest): boolean {
  const raw = req.cookies.get(COOKIE_NAME)?.value ?? "";
  if (!raw) return false;
  const payload = decode(raw);
  if (!payload) return false;
  return payload.until >= todayUTC();
}

/**
 * Delete the pro cookie from a response.
 * Call this whenever the server determines the user is not signed in,
 * so stale pro cookies don't linger on guest browsers.
 */
export function clearProCookie(res: NextResponse): void {
  res.cookies.set(COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
}

/** Write a signed pro cookie onto a response, valid for PRO_DURATION_DAYS days. */
export function setProCookie(res: NextResponse): void {
  const until = futureDateUTC(PRO_DURATION_DAYS);
  res.cookies.set(COOKIE_NAME, encode({ until }), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * PRO_DURATION_DAYS,
  });
}
