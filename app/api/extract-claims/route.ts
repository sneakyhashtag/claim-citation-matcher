import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { writeCount } from "@/lib/usage-cookie";
import { checkUsageDB, incrementUsageDB, DAILY_LIMIT, getIdentifier } from "@/lib/db-usage";
import { checkIsPro } from "@/lib/pro-cookie";
import { claimExtractionModel } from "@/lib/models";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";

const client = new Anthropic();

type Claim = { claim: string; searchQuery: string };

/** Strip markdown code fences then extract the JSON array by finding the
 *  outermost [ … ] span. Throws if no valid array is found. */
function parseClaimsArray(raw: string): Claim[] {
  // Remove code fences: ```json ... ``` or ``` ... ```
  const stripped = raw.replace(/```(?:json)?\s*([\s\S]*?)```/gi, "$1").trim();
  const text = stripped.length > 0 ? stripped : raw;

  const start = text.indexOf("[");
  const end = text.lastIndexOf("]");
  if (start === -1 || end === -1 || end <= start) {
    throw new Error("No JSON array found in response");
  }

  const parsed: unknown = JSON.parse(text.slice(start, end + 1));
  if (!Array.isArray(parsed)) throw new Error("Parsed value is not an array");
  return parsed as Claim[];
}

const SYSTEM_NORMAL = `You are a research assistant that identifies factual claims in text that would benefit from academic citations.

For each claim, return a JSON object with:
- "claim": the exact or near-exact sentence/phrase from the text that makes the claim
- "searchQuery": a concise academic search query (suitable for Google Scholar or PubMed) to find supporting papers

Return ONLY a valid JSON array of these objects. No markdown, no explanation, just the JSON array.`;

const SYSTEM_STRICT = `Return ONLY a valid JSON array. No markdown, no code fences, no explanation, no text before or after the array.
Each element must have exactly two string fields: "claim" and "searchQuery".
Start your response with [ and end with ].`;

async function callClaude(text: string, model: string, strict: boolean): Promise<string> {
  const message = await client.messages.stream({
    model,
    max_tokens: 2048,
    system: strict ? SYSTEM_STRICT : SYSTEM_NORMAL,
    messages: [
      {
        role: "user",
        content: strict
          ? `Extract all factual claims that need citations. Return ONLY a JSON array where each object has "claim" and "searchQuery". Start with [ and end with ].\n\n${text}`
          : `Identify all factual claims in the following text that would need academic citations. Return them as a JSON array.\n\n${text}`,
      },
    ],
  }).finalMessage();
  return message.content.find((b) => b.type === "text")?.text ?? "";
}

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
  const pro = !!session?.user && checkIsPro(req, session.user.email);

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

  // ── 5. Rate limiting ──────────────────────────────────────────────────────────
  {
    const identifier = getIdentifier(req, session);
    const rl = await checkRateLimit(
      identifier,
      "extract-claims",
      session?.user
        ? [{ windowType: "minute", limit: 20 }, { windowType: "hour", limit: 100 }]
        : [{ windowType: "minute", limit: 5 },  { windowType: "hour", limit: 20 }]
    );
    if (!rl.allowed) return rateLimitResponse(rl.retryAfterSeconds);
  }

  // ── 6. Call the Anthropic API (with one retry using a stricter prompt) ───────
  const model = claimExtractionModel(pro);
  let raw = await callClaude(text, model, false);

  let claims: Claim[];
  try {
    claims = parseClaimsArray(raw);
  } catch {
    // Retry once with a strict prompt that forces bare JSON output
    raw = await callClaude(text, model, true);
    try {
      claims = parseClaimsArray(raw);
    } catch {
      return NextResponse.json(
        { error: "Failed to parse claims from model response", raw },
        { status: 500 }
      );
    }
  }

  // ── 7. Increment DB counter, update cookie cache, and respond ─────────────
  if (!pro) {
    const { count: newCount, remaining } = await incrementUsageDB(req, session);
    const res = NextResponse.json({ claims, remaining, limit: DAILY_LIMIT });
    writeCount(res, newCount);
    return res;
  }

  return NextResponse.json({ claims, remaining: null, limit: null });
}
