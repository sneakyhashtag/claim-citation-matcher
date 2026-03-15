import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getDb, type SearchRow } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = getDb();
  const rows = db
    .prepare(
      "SELECT * FROM searches WHERE user_email = ? ORDER BY created_at DESC LIMIT 50"
    )
    .all(session.user.email) as SearchRow[];

  const searches = rows.map((row) => ({
    id: row.id,
    paragraph: row.paragraph,
    claims: JSON.parse(row.claims_json),
    results: JSON.parse(row.results_json),
    createdAt: row.created_at,
  }));

  return NextResponse.json({ searches });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { paragraph, claims, results } = await req.json();

  if (!paragraph || !claims || !results) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const db = getDb();
  const stmt = db.prepare(
    "INSERT INTO searches (user_email, paragraph, claims_json, results_json) VALUES (?, ?, ?, ?)"
  );
  const info = stmt.run(
    session.user.email,
    paragraph,
    JSON.stringify(claims),
    JSON.stringify(results)
  );

  return NextResponse.json({ id: info.lastInsertRowid });
}
