import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import { readCount, writeCount, DAILY_LIMIT } from "@/lib/usage-cookie";
import { readPro } from "@/lib/pro-cookie";

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

  // ── 2. Pro check ───────────────────────────────────────────────────────────
  const pro = readPro(req);

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

  // ── 4. Usage limit — checked BEFORE calling the Anthropic API ─────────────
  //
  // Pro users are exempt. Free/guest users get DAILY_LIMIT searches per day,
  // tracked via a signed HTTP-only cookie. The cookie is written onto the
  // response AFTER the API call so a count slot is only consumed when we
  // actually make the call.
  //
  // Note: stateless cookies cannot prevent a determined user from deleting
  // their cookie. This limit is a soft cap, not hard enforcement.

  let currentCount = 0;

  if (!pro) {
    currentCount = readCount(req);

    if (currentCount >= DAILY_LIMIT) {
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
    model: "claude-opus-4-6",
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

  // ── 6. Build response and increment the usage counter ─────────────────────
  const newCount = currentCount + 1;
  const remaining = Math.max(0, DAILY_LIMIT - newCount);

  const res = NextResponse.json({ claims, remaining, limit: DAILY_LIMIT });

  if (!pro) {
    writeCount(res, newCount);
  }

  return res;
}
