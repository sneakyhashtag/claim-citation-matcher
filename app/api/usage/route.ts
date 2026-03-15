import { NextRequest, NextResponse } from "next/server";
import { readUsage } from "@/lib/usage-cookie";

export async function GET(req: NextRequest) {
  return NextResponse.json(readUsage(req));
}
