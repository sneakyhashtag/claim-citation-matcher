import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { checkAndIncrementUsage } from "@/lib/db";

const client = new Anthropic();

function getKey(req: NextRequest, email: string | null | undefined): string {
  if (email) return `user:${email}`;
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown";
  return `ip:${ip}`;
}

export async function POST(req: NextRequest) {
  // ── usage limit ──
  const session = await auth();
  const key = getKey(req, session?.user?.email);
  const usage = checkAndIncrementUsage(key);
  if (!usage.allowed) {
    return NextResponse.json(
      {
        error:
          "You've reached your daily limit of 3 free searches. Upgrade to Pro for unlimited access.",
        limitReached: true,
        remaining: 0,
      },
      { status: 429 }
    );
  }

  const { text } = await req.json();

  if (!text || typeof text !== "string" || !text.trim()) {
    return NextResponse.json({ error: "text is required" }, { status: 400 });
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
    // Strip markdown code fences if present, then find the JSON array
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

  return NextResponse.json({ claims });
}
