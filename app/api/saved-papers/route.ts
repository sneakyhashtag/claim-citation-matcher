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

/** GET /api/saved-papers — list all saved papers for the signed-in user */
export async function GET(_req: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = await ensureUser(session.user.email, session.user.name);

  const result = await sql`
    SELECT id, doi, title, authors, year, journal, created_at
    FROM   saved_papers
    WHERE  user_id = ${userId}
    ORDER  BY created_at DESC
    LIMIT  200
  `;

  const papers = result.rows.map((row) => ({
    id: String(row.id),
    doi: row.doi ?? null,
    title: row.title ?? "Untitled",
    authors: row.authors ?? [],
    year: row.year ?? null,
    journal: row.journal ?? null,
    createdAt: row.created_at,
  }));

  return NextResponse.json({ papers });
}

/** POST /api/saved-papers — save a paper */
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid body" }, { status: 400 });

  const { doi, title, authors, year, journal } = body;
  const userId = await ensureUser(session.user.email, session.user.name);

  const result = await sql`
    INSERT INTO saved_papers (user_id, doi, title, authors, year, journal)
    VALUES (
      ${userId},
      ${doi ?? null},
      ${title ?? "Untitled"},
      ${JSON.stringify(authors ?? [])}::jsonb,
      ${year ?? null},
      ${journal ?? null}
    )
    RETURNING id, created_at
  `;

  return NextResponse.json({
    id: String(result.rows[0].id),
    createdAt: result.rows[0].created_at,
  });
}
