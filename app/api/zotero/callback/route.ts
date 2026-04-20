import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { sql } from "@/lib/db";
import { buildOAuth1Header, verifyCookieValue } from "@/lib/oauth1";

const ACCESS_TOKEN_URL = "https://www.zotero.org/oauth/access";

export async function GET(req: NextRequest) {
  const appUrl = process.env.NEXTAUTH_URL ?? `https://${req.headers.get("host")}`;

  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.redirect(new URL("/?error=zotero_auth", appUrl));
  }

  const { searchParams } = new URL(req.url);
  const oauthToken = searchParams.get("oauth_token");
  const oauthVerifier = searchParams.get("oauth_verifier");

  if (!oauthToken || !oauthVerifier) {
    return NextResponse.redirect(new URL("/?error=zotero_denied", appUrl));
  }

  const rawCookie = req.cookies.get("_rf_zotero_req")?.value;
  if (!rawCookie) {
    return NextResponse.redirect(new URL("/?error=zotero_expired", appUrl));
  }

  const requestTokenSecret = verifyCookieValue(rawCookie);
  if (!requestTokenSecret) {
    return NextResponse.redirect(new URL("/?error=zotero_invalid", appUrl));
  }

  const consumerKey = process.env.ZOTERO_CLIENT_KEY!;
  const consumerSecret = process.env.ZOTERO_CLIENT_SECRET!;

  const authHeader = buildOAuth1Header({
    method: "POST",
    url: ACCESS_TOKEN_URL,
    consumerKey,
    consumerSecret,
    tokenKey: oauthToken,
    tokenSecret: requestTokenSecret,
    extra: { oauth_verifier: oauthVerifier },
  });

  const zoteroRes = await fetch(ACCESS_TOKEN_URL, {
    method: "POST",
    headers: {
      Authorization: authHeader,
      "Content-Type": "application/x-www-form-urlencoded",
    },
  });

  if (!zoteroRes.ok) {
    console.error("[zotero/callback] access token error:", zoteroRes.status, await zoteroRes.text());
    return NextResponse.redirect(new URL("/?error=zotero_token_fail", appUrl));
  }

  const body = await zoteroRes.text();
  const params = new URLSearchParams(body);
  const apiKey = params.get("oauth_token"); // In Zotero, the access token IS the API key
  const userId = params.get("userID");

  if (!apiKey || !userId) {
    return NextResponse.redirect(new URL("/?error=zotero_no_key", appUrl));
  }

  await sql`
    UPDATE users
    SET    zotero_api_key = ${apiKey},
           zotero_user_id = ${userId}
    WHERE  email = ${session.user.email}
  `;

  const response = NextResponse.redirect(new URL("/?zotero_connected=1", appUrl));
  // Clear the temporary request token cookie
  response.cookies.set("_rf_zotero_req", "", { maxAge: 0, path: "/" });
  return response;
}
