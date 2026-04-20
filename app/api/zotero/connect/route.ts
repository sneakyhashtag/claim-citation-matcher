import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { checkIsPro } from "@/lib/pro-cookie";
import { buildOAuth1Header, signCookieValue } from "@/lib/oauth1";

const REQUEST_TOKEN_URL = "https://www.zotero.org/oauth/request";
const AUTHORIZE_URL = "https://www.zotero.org/oauth/authorize";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!checkIsPro(req, session.user.email)) {
    return NextResponse.json({ error: "Pro required" }, { status: 403 });
  }

  const consumerKey = process.env.ZOTERO_CLIENT_KEY;
  const consumerSecret = process.env.ZOTERO_CLIENT_SECRET;
  if (!consumerKey || !consumerSecret) {
    return NextResponse.json({ error: "Zotero app credentials not configured" }, { status: 500 });
  }

  const appUrl = process.env.NEXTAUTH_URL ?? `https://${req.headers.get("host")}`;
  const callbackUrl = `${appUrl}/api/zotero/callback`;

  const authHeader = buildOAuth1Header({
    method: "POST",
    url: REQUEST_TOKEN_URL,
    consumerKey,
    consumerSecret,
    extra: { oauth_callback: callbackUrl },
  });

  const zoteroRes = await fetch(REQUEST_TOKEN_URL, {
    method: "POST",
    headers: {
      Authorization: authHeader,
      "Content-Type": "application/x-www-form-urlencoded",
    },
  });

  if (!zoteroRes.ok) {
    const body = await zoteroRes.text();
    console.error("[zotero/connect] request token error:", zoteroRes.status, body);
    return NextResponse.json({ error: "Failed to get request token from Zotero" }, { status: 502 });
  }

  const body = await zoteroRes.text();
  const params = new URLSearchParams(body);
  const requestToken = params.get("oauth_token");
  const requestTokenSecret = params.get("oauth_token_secret");

  if (!requestToken || !requestTokenSecret) {
    return NextResponse.json({ error: "Invalid response from Zotero" }, { status: 502 });
  }

  const authorizeUrl =
    `${AUTHORIZE_URL}?oauth_token=${requestToken}` +
    `&library_access=1&notes_access=0&write_access=1&all_groups=none`;

  const response = NextResponse.redirect(authorizeUrl);
  response.cookies.set("_rf_zotero_req", signCookieValue(requestTokenSecret), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 15, // 15 minutes — long enough for the OAuth round-trip
  });
  return response;
}
