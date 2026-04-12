import { sql } from "@/lib/db";

export interface WindowLimit {
  windowType: "minute" | "hour";
  limit: number;
}

export interface RateLimitResult {
  allowed: boolean;
  retryAfterSeconds: number;
}

/** Seconds remaining until the start of the next window. */
function secondsUntilNextWindow(windowType: "minute" | "hour"): number {
  const nowSec = Date.now() / 1000;
  return windowType === "minute"
    ? Math.ceil(60 - (nowSec % 60))
    : Math.ceil(3600 - (nowSec % 3600));
}

/**
 * Increment the request counter for each window in the list and check
 * whether any limit has been exceeded.
 *
 * Uses an atomic UPSERT so concurrent requests are counted correctly.
 * Returns { allowed: true } if every window is within its limit.
 * Returns { allowed: false, retryAfterSeconds } at the first exceeded limit
 * and logs the violation.
 *
 * @param identifier  "user:email" or "ip:x.x.x.x" from getIdentifier()
 * @param route       Short route name used as a DB key (e.g. "extract-claims")
 * @param windows     One or more { windowType, limit } pairs to check in order
 */
export async function checkRateLimit(
  identifier: string,
  route: string,
  windows: WindowLimit[]
): Promise<RateLimitResult> {
  // Probabilistic cleanup — 1 % of requests delete rows older than 3 hours
  // so the table stays small without a dedicated job.
  if (Math.random() < 0.01) {
    sql`DELETE FROM rate_limits WHERE window_start < NOW() - INTERVAL '3 hours'`.catch(
      () => {}
    );
  }

  for (const { windowType, limit } of windows) {
    const routeKey = `${route}:${windowType}`;

    let count = 1;
    try {
      const result = await sql`
        INSERT INTO rate_limits (identifier, route, window_start, request_count)
        VALUES (
          ${identifier},
          ${routeKey},
          date_trunc(${windowType}, NOW()),
          1
        )
        ON CONFLICT (identifier, route, window_start)
        DO UPDATE SET request_count = rate_limits.request_count + 1
        RETURNING request_count
      `;
      count = result.rows[0]?.request_count ?? 1;
    } catch (err) {
      // If the table doesn't exist yet (e.g. before setup-db is run in a new
      // environment), fail open so legitimate traffic is never blocked.
      console.error("[rate-limit] DB error — failing open:", err);
      return { allowed: true, retryAfterSeconds: 0 };
    }

    if (count > limit) {
      const retryAfterSeconds = secondsUntilNextWindow(windowType);
      console.warn(
        `[rate-limit] BLOCKED ${identifier} → ${routeKey} (${count}/${limit}, retry in ${retryAfterSeconds}s)`
      );
      return { allowed: false, retryAfterSeconds };
    }
  }

  return { allowed: true, retryAfterSeconds: 0 };
}

/** Build a 429 NextResponse with standard Retry-After headers. */
export function rateLimitResponse(retryAfterSeconds: number): Response {
  return new Response(
    JSON.stringify({
      error: "Too many requests. Please wait a moment and try again.",
    }),
    {
      status: 429,
      headers: {
        "Content-Type": "application/json",
        "Retry-After": String(retryAfterSeconds),
        "X-RateLimit-Reset": String(
          Math.ceil(Date.now() / 1000) + retryAfterSeconds
        ),
      },
    }
  );
}
