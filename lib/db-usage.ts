import { sql } from "@/lib/db";
import type { NextRequest } from "next/server";
import type { Session } from "next-auth";

export const DAILY_LIMIT = 3;

function todayUTC(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Returns a stable string identifier for the requester.
 * Signed-in users  → "user:{email}"
 * Guests           → "ip:{ip}"
 */
export function getIdentifier(req: NextRequest, session: Session | null): string {
  if (session?.user?.email) {
    return `user:${session.user.email}`;
  }
  const forwarded = req.headers.get("x-forwarded-for");
  const ip = forwarded ? forwarded.split(",")[0].trim() : "unknown";
  return `ip:${ip}`;
}

/**
 * Read today's search count from the DB without modifying it.
 * Returns { count, remaining, allowed }.
 */
export async function checkUsageDB(
  req: NextRequest,
  session: Session | null
): Promise<{ count: number; remaining: number; allowed: boolean }> {
  const identifier = getIdentifier(req, session);
  const today = todayUTC();

  const result = await sql`
    SELECT search_count
    FROM   usage
    WHERE  identifier = ${identifier}
    AND    date       = ${today}
  `;

  const count: number = result.rows[0]?.search_count ?? 0;
  const remaining = Math.max(0, DAILY_LIMIT - count);
  return { count, remaining, allowed: count < DAILY_LIMIT };
}

/**
 * Atomically increment today's count in the DB and return the new totals.
 * Uses INSERT … ON CONFLICT to upsert, so it is safe under concurrent requests.
 */
export async function incrementUsageDB(
  req: NextRequest,
  session: Session | null
): Promise<{ count: number; remaining: number }> {
  const identifier = getIdentifier(req, session);
  const today = todayUTC();

  const result = await sql`
    INSERT INTO usage (identifier, search_count, date)
    VALUES (${identifier}, 1, ${today})
    ON CONFLICT (identifier, date)
    DO UPDATE SET search_count = usage.search_count + 1
    RETURNING search_count
  `;

  const count: number = result.rows[0]?.search_count ?? 1;
  const remaining = Math.max(0, DAILY_LIMIT - count);
  return { count, remaining };
}
