import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { writeCount } from "@/lib/usage-cookie";
import { checkUsageDB, incrementUsageDB, DAILY_LIMIT } from "@/lib/db-usage";
import { readPro } from "@/lib/pro-cookie";
import { claimExtractionModel } from "@/lib/models";

const client = new Anthropic();

export async function POST(req: NextRequest) {
  // ── 1. Parse and validate request body ────────────────────────────────────
  let text: string;
  try {
    const body = await req.json();
    if (!body?.text || typeof body.text !== "string" || !body.text.trim()) {
      return NextResponse.json({ error: "text is required" }, { status: 400 });
    }
    text = body.text;
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  // ── 2. Pro check — requires BOTH a signed-in session AND a valid Pro cookie ─
  // A guest user must never receive Pro features regardless of any cookie.
  const session = await auth();
  const pro = !!session?.user && readPro(req);

  // ── 3. Character limit ─────────────────────────────────────────────────────
  const charLimit = pro ? 10000 : 1000;
  if (text.length > charLimit) {
    return NextResponse.json(
      {
        error: pro
          ? "Text exceeds the 10,000 character limit."
          : "Free accounts are limited to 1,000 characters. Upgrade to Pro for up to 10,000 characters.",
      },
      { status: 413 }
    );
  }

  // ── 4. Usage limit — verified against the database BEFORE calling the API ──
  //
  // Pro users are exempt. Free/guest users get DAILY_LIMIT searches per day.
  // The DB is the authoritative source so the limit cannot be bypassed by
  // clearing cookies. The cookie is written onto the response AFTER a
  // successful API call as a frontend cache for instant counter display.

  let dbCount = 0;

  if (!pro) {
    const usage = await checkUsageDB(req, session);
    dbCount = usage.count;

    if (!usage.allowed) {
      return NextResponse.json(
        {
          error: `You've reached your daily limit of ${DAILY_LIMIT} free searches. Come back tomorrow, or upgrade to Pro for unlimited searches.`,
          limitReached: true,
          remaining: 0,
        },
        { status: 429 }
      );
    }
  }

  // ── 5. Call the Anthropic API ──────────────────────────────────────────────
  const stream = client.messages.stream({
    model: claimExtractionModel(pro),
    max_tokens: 2048,
    system: `You are a research assistant that identifies factual claims in text that would benefit from academic citations.

For each claim, return a JSON object with:
- "claim": the exact or near-exact sentence/phrase from the text that makes the claim
- "searchQuery": a concise academic search query (suitable for Google Scholar or PubMed) to find supporting papers

Return ONLY a valid JSON array of these objects. No markdown, no explanation, just the JSON array.`,
    messages: [
      {
        role: "user",
        content: `Identify all factual claims in the following text that would need academic citations. Return them as a JSON array.\n\n${text}`,
      },
    ],
  });

  const message = await stream.finalMessage();
  const raw = message.content.find((b) => b.type === "text")?.text ?? "";

  let claims: { claim: string; searchQuery: string }[];
  try {
    const stripped = raw.replace(/```(?:json)?\s*/gi, "").replace(/```/g, "");
    const match = stripped.match(/\[[\s\S]*\]/);
    if (!match) throw new Error("No JSON array found");
    claims = JSON.parse(match[0]);
  } catch {
    return NextResponse.json(
      { error: "Failed to parse claims from model response", raw },
      { status: 500 }
    );
  }

  // ── 6. Increment DB counter, update cookie cache, and respond ─────────────
  if (!pro) {
    const { count: newCount, remaining } = await incrementUsageDB(req, session);
    const res = NextResponse.json({ claims, remaining, limit: DAILY_LIMIT });
    writeCount(res, newCount);
    return res;
  }

  return NextResponse.json({ claims, remaining: null, limit: null });
}
