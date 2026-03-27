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

// ── admin bypass ─────────────────────────────────────────────────────────────

const ADMIN_EMAILS = new Set([
  "kangfuyanjin@gmail.com",
  "sainayaunglinn@gmail.com",
]);

/** Returns true if this email is an admin who always gets Pro access. */
export function isAdminEmail(email: string | null | undefined): boolean {
  return !!email && ADMIN_EMAILS.has(email);
}

// ── public API ───────────────────────────────────────────────────────────────

/** Returns true if the request carries a valid, unexpired pro cookie. */
export function readPro(req: NextRequest): boolean {
  const raw = req.cookies.get(COOKIE_NAME)?.value ?? "";
  console.log(`[pro-cookie] readPro: cookie present=${!!raw}, name=${COOKIE_NAME}`);
  if (!raw) return false;
  const payload = decode(raw);
  console.log(`[pro-cookie] readPro: decoded=${JSON.stringify(payload)}, today=${todayUTC()}`);
  if (!payload) return false;
  const valid = payload.until >= todayUTC();
  console.log(`[pro-cookie] readPro: valid=${valid}, until=${payload.until}`);
  return valid;
}

/**
 * Returns true if the user is Pro — either via admin bypass (email match)
 * or a valid signed pro cookie. Always check email first.
 */
export function checkIsPro(
  req: NextRequest,
  email: string | null | undefined
): boolean {
  if (email && ADMIN_EMAILS.has(email)) {
    console.log(`[pro-cookie] checkIsPro: admin bypass for ${email}`);
    return true;
  }
  return readPro(req);
}

/**
 * Delete the pro cookie from a response.
 * Call this whenever the server determines the user is not signed in,
 * so stale pro cookies don't linger on guest browsers.
 */
export function clearProCookie(res: NextResponse): void {
  console.log(`[pro-cookie] clearProCookie: clearing ${COOKIE_NAME}`);
  res.cookies.set(COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: true,
    path: "/",
    maxAge: 0,
  });
}

/** Write a signed pro cookie onto a response, valid for PRO_DURATION_DAYS days. */
export function setProCookie(res: NextResponse): void {
  const until = futureDateUTC(PRO_DURATION_DAYS);
  const encoded = encode({ until });
  console.log(`[pro-cookie] setProCookie: setting ${COOKIE_NAME}, until=${until}, secure=true, sameSite=lax, path=/`);
  res.cookies.set(COOKIE_NAME, encoded, {
    httpOnly: true,
    sameSite: "lax",
    secure: true,
    path: "/",
    maxAge: 60 * 60 * 24 * PRO_DURATION_DAYS,
  });
}
