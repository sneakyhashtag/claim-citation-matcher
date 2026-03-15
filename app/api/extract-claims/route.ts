import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import { checkAndIncrement } from "@/lib/usage-cookie";
import { readPro } from "@/lib/pro-cookie";

const client = new Anthropic();

export async function POST(req: NextRequest) {
  // ── usage limit (cookie-based, bypassed for pro users) ────────────────────
  const pro = readPro(req);
  const { allowed, applyToResponse } = pro
    ? { allowed: true, applyToResponse: () => {} }
    : checkAndIncrement(req);

  if (!allowed) {
    // applyToResponse is a no-op when allowed=false, but we call it for
    // consistency so every exit path after checkAndIncrement looks the same.
    const res = NextResponse.json(
      {
        error:
          "You've reached your daily limit of 10 free searches. Come back tomorrow!",
        limitReached: true,
        remaining: 0,
      },
      { status: 429 }
    );
    applyToResponse(res);
    return res;
  }

  // Parse body after the limit check so the slot is consumed even if the
  // body is malformed (mirrors the previous DB behaviour).
  const { text } = await req.json();

  if (!text || typeof text !== "string" || !text.trim()) {
    const res = NextResponse.json(
      { error: "text is required" },
      { status: 400 }
    );
    applyToResponse(res);
    return res;
  }

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
    const res = NextResponse.json(
      { error: "Failed to parse claims from model response", raw },
      { status: 500 }
    );
    applyToResponse(res);
    return res;
  }

  const res = NextResponse.json({ claims });
  applyToResponse(res);
  return res;
}
