import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { sql } from "@/lib/db";

/** PATCH /api/tabs/[id] — update tab content after a search completes */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid body" }, { status: 400 });

  const { preview, paragraph, claims, results, omakase } = body;

  // Only update the tab if it belongs to the requesting user
  const userRes = await sql`SELECT id FROM users WHERE email = ${session.user.email}`;
  if (!userRes.rows.length) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }
  const userId = userRes.rows[0].id as number;

  await sql`
    UPDATE search_tabs
    SET
      preview        = ${preview ?? null},
      paragraph      = ${paragraph ?? null},
      claims         = ${JSON.stringify(claims ?? [])}::jsonb,
      results        = ${JSON.stringify(results ?? [])}::jsonb,
      omakase_result = ${omakase ? JSON.stringify(omakase) : null}::jsonb,
      updated_at     = NOW()
    WHERE id = ${id}
      AND user_id = ${userId}
  `;

  return NextResponse.json({ ok: true });
}

/** DELETE /api/tabs/[id] — delete a single tab */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const userRes = await sql`SELECT id FROM users WHERE email = ${session.user.email}`;
  if (!userRes.rows.length) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }
  const userId = userRes.rows[0].id as number;

  await sql`
    DELETE FROM search_tabs
    WHERE id = ${id}
      AND user_id = ${userId}
  `;

  return NextResponse.json({ ok: true });
}
