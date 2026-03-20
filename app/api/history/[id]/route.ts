import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { sql } from "@/lib/db";

/** PATCH /api/history/[id] — attach omakase result to an existing search entry */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const searchId = parseInt(id, 10);
  if (isNaN(searchId)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  const body = await req.json().catch(() => null);
  if (!body?.omakase) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  // Verify the entry belongs to this user before updating.
  const userRes = await sql`SELECT id FROM users WHERE email = ${session.user.email}`;
  if (userRes.rows.length === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const userId = userRes.rows[0].id as number;

  await sql`
    UPDATE searches
    SET    omakase_result = ${JSON.stringify(body.omakase)}::jsonb
    WHERE  id = ${searchId}
    AND    user_id = ${userId}
  `;

  return NextResponse.json({ ok: true });
}
