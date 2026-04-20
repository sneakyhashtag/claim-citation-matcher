import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { sql } from "@/lib/db";
import { checkIsPro } from "@/lib/pro-cookie";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ connected: false }, { status: 401 });
  }
  if (!checkIsPro(req, session.user.email)) {
    return NextResponse.json({ connected: false }, { status: 403 });
  }

  const res = await sql`
    SELECT zotero_api_key, zotero_user_id
    FROM   users
    WHERE  email = ${session.user.email}
  `;

  const row = res.rows[0];
  return NextResponse.json({
    connected: !!(row?.zotero_api_key && row?.zotero_user_id),
  });
}
