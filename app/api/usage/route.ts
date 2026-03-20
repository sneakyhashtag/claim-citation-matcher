import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { checkUsageDB, DAILY_LIMIT } from "@/lib/db-usage";
import { readUsage } from "@/lib/usage-cookie";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    const { count, remaining } = await checkUsageDB(req, session);
    return NextResponse.json({ count, remaining, limit: DAILY_LIMIT });
  } catch {
    // DB unavailable — fall back to cookie so the counter still displays.
    return NextResponse.json(readUsage(req));
  }
}
