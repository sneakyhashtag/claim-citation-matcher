import { NextRequest, NextResponse } from "next/server";
import { rateRelevance, type Paper } from "@/lib/rate-relevance";

export async function POST(req: NextRequest) {
  const { claim, papers } = await req.json();

  if (!claim || typeof claim !== "string") {
    return NextResponse.json({ error: "claim is required" }, { status: 400 });
  }
  if (!Array.isArray(papers)) {
    return NextResponse.json({ error: "papers must be an array" }, { status: 400 });
  }

  const rated = await rateRelevance(claim, papers as Paper[]);
  return NextResponse.json({ papers: rated });
}
