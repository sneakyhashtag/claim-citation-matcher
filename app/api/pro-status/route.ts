import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { checkIsPro, clearProCookie } from "@/lib/pro-cookie";

export async function GET(req: NextRequest) {
  const session = await auth();

  // Guest users never have Pro access.
  // Clear any stale pro cookie so it doesn't linger on their browser.
  if (!session?.user) {
    const res = NextResponse.json({ pro: false });
    clearProCookie(res);
    return res;
  }

  return NextResponse.json({ pro: checkIsPro(req, session.user.email) });
}
