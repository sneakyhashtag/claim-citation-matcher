import { NextRequest, NextResponse } from "next/server";
import { readPro } from "@/lib/pro-cookie";

export async function GET(req: NextRequest) {
  return NextResponse.json({ pro: readPro(req) });
}
