import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getUsage } from "@/lib/db";

function getKey(req: NextRequest, email: string | null | undefined): string {
  if (email) return `user:${email}`;
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown";
  return `ip:${ip}`;
}

export async function GET(req: NextRequest) {
  const session = await auth();
  const key = getKey(req, session?.user?.email);
  return NextResponse.json(getUsage(key));
}
