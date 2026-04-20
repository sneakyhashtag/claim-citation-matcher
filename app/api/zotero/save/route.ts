import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { sql } from "@/lib/db";
import { checkIsPro } from "@/lib/pro-cookie";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!checkIsPro(req, session.user.email)) {
    return NextResponse.json({ error: "Pro required" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid body" }, { status: 400 });

  const res = await sql`
    SELECT zotero_api_key, zotero_user_id
    FROM   users
    WHERE  email = ${session.user.email}
  `;

  const row = res.rows[0];
  if (!row?.zotero_api_key || !row?.zotero_user_id) {
    return NextResponse.json({ error: "Zotero not connected", notConnected: true }, { status: 400 });
  }

  const { title, authors, journal, year, volume, issue, pages, doi, abstract } = body;

  const creators = ((authors ?? []) as string[]).map((name) => {
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return { creatorType: "author", firstName: "", lastName: parts[0] };
    const lastName = parts[parts.length - 1];
    const firstName = parts.slice(0, -1).join(" ");
    return { creatorType: "author", firstName, lastName };
  });

  const rawDoi = doi ? doi.replace(/^https?:\/\/doi\.org\//i, "") : "";

  const zoteroItem = {
    itemType: "journalArticle",
    title: title ?? "",
    creators,
    abstractNote: abstract ?? "",
    publicationTitle: journal ?? "",
    volume: volume ?? "",
    issue: issue ?? "",
    pages: pages ?? "",
    date: year ? String(year) : "",
    DOI: rawDoi,
    url: rawDoi ? `https://doi.org/${rawDoi}` : (doi ?? ""),
  };

  const zoteroRes = await fetch(
    `https://api.zotero.org/users/${row.zotero_user_id}/items`,
    {
      method: "POST",
      headers: {
        "Zotero-API-Key": row.zotero_api_key,
        "Zotero-API-Version": "3",
        "Content-Type": "application/json",
      },
      body: JSON.stringify([zoteroItem]),
    }
  );

  if (!zoteroRes.ok) {
    const errBody = await zoteroRes.text();
    console.error("[zotero/save] Zotero API error:", zoteroRes.status, errBody);
    return NextResponse.json(
      { error: `Zotero returned ${zoteroRes.status}` },
      { status: 502 }
    );
  }

  return NextResponse.json({ ok: true });
}
