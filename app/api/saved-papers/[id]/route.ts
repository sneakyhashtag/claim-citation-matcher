import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { sql } from "@/lib/db";

/** DELETE /api/saved-papers/[id] — remove a saved paper */
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
    DELETE FROM saved_papers
    WHERE id = ${id}
      AND user_id = ${userId}
  `;

  return NextResponse.json({ ok: true });
}
