import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { sql } from "@/lib/db";

/**
 * Upsert the signed-in user into the users table (keyed by email) and return
 * their integer ID. Called on every request so we never have a missing user row.
 */
async function ensureUser(email: string, name?: string | null): Promise<number> {
  await sql`
    INSERT INTO users (email, name)
    VALUES (${email}, ${name ?? null})
    ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name
  `;
  const res = await sql`SELECT id FROM users WHERE email = ${email}`;
  return res.rows[0].id as number;
}

/** GET /api/history — return the 50 most recent searches for the signed-in user */
export async function GET(_req: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = await ensureUser(session.user.email, session.user.name);

  const result = await sql`
    SELECT id, paragraph, claims, results, omakase_result, citation_style, created_at
    FROM   searches
    WHERE  user_id = ${userId}
    ORDER  BY created_at DESC
    LIMIT  50
  `;

  const entries = result.rows.map((row) => ({
    id: String(row.id),
    paragraph: row.paragraph,
    claims: row.claims,
    results: row.results,
    omakase: row.omakase_result ?? undefined,
    citationStyle: row.citation_style,
    createdAt: row.created_at,
  }));

  return NextResponse.json({ entries });
}

/** POST /api/history — save a new search entry for the signed-in user */
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid body" }, { status: 400 });

  const { paragraph, claims, results, citationStyle } = body;
  const userId = await ensureUser(session.user.email, session.user.name);

  const result = await sql`
    INSERT INTO searches (user_id, paragraph, claims, results, citation_style)
    VALUES (
      ${userId},
      ${paragraph ?? null},
      ${JSON.stringify(claims ?? [])}::jsonb,
      ${JSON.stringify(results ?? [])}::jsonb,
      ${citationStyle ?? null}
    )
    RETURNING id, created_at
  `;

  return NextResponse.json({
    id: String(result.rows[0].id),
    createdAt: result.rows[0].created_at,
  });
}

/** DELETE /api/history — clear all search history for the signed-in user */
export async function DELETE(_req: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userRes = await sql`SELECT id FROM users WHERE email = ${session.user.email}`;
  if (userRes.rows.length > 0) {
    const userId = userRes.rows[0].id;
    await sql`DELETE FROM searches WHERE user_id = ${userId}`;
  }

  return NextResponse.json({ ok: true });
}
