import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { sql } from "@/lib/db";

async function ensureUser(email: string, name?: string | null): Promise<number> {
  await sql`
    INSERT INTO users (email, name)
    VALUES (${email}, ${name ?? null})
    ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name
  `;
  const res = await sql`SELECT id FROM users WHERE email = ${email}`;
  return res.rows[0].id as number;
}

/** GET /api/tabs — return all tabs for the signed-in user, newest first */
export async function GET(_req: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = await ensureUser(session.user.email, session.user.name);

  const result = await sql`
    SELECT id, preview, paragraph, claims, results, omakase_result, created_at, updated_at
    FROM   search_tabs
    WHERE  user_id = ${userId}
    ORDER  BY updated_at DESC
    LIMIT  30
  `;

  const tabs = result.rows.map((row) => ({
    id: String(row.id),
    preview: row.preview ?? "",
    paragraph: row.paragraph ?? "",
    claims: row.claims ?? [],
    results: row.results ?? [],
    omakase: row.omakase_result ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));

  return NextResponse.json({ tabs });
}

/** POST /api/tabs — create a new tab */
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const { preview = "", paragraph = "", claims = [], results = [], omakase = null } = body;

  const userId = await ensureUser(session.user.email, session.user.name);

  const result = await sql`
    INSERT INTO search_tabs (user_id, preview, paragraph, claims, results, omakase_result)
    VALUES (
      ${userId},
      ${preview},
      ${paragraph},
      ${JSON.stringify(claims)}::jsonb,
      ${JSON.stringify(results)}::jsonb,
      ${omakase ? JSON.stringify(omakase) : null}::jsonb
    )
    RETURNING id, created_at, updated_at
  `;

  return NextResponse.json({
    id: String(result.rows[0].id),
    createdAt: result.rows[0].created_at,
    updatedAt: result.rows[0].updated_at,
  });
}
