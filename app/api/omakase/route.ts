import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { z } from "zod";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { checkIsPro } from "@/lib/pro-cookie";
import type { RatedPaper } from "@/lib/rate-relevance";
import { omakaseModel } from "@/lib/models";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";

const client = new Anthropic();

const OmakaseSchema = z.object({
  rewritten_paragraph: z.string().describe(
    "The original paragraph rewritten with in-text citations inserted at relevant claims."
  ),
  reference_list: z.array(z.string()).describe(
    "Full formatted references for every source cited in the rewritten paragraph, one entry per item."
  ),
});

function relevanceTier(score: number): string {
  if (score >= 5) return "Direct";
  if (score >= 4) return "High";
  return "Moderate";
}

function buildPapersBlock(papers: RatedPaper[]): string {
  return papers
    .map((p, i) => {
      const tier = relevanceTier(p.relevanceScore);
      const authors =
        p.authors.length === 0
          ? "Unknown Author"
          : p.authors.length <= 3
          ? p.authors.join(", ")
          : `${p.authors[0]} et al.`;
      const lines = [
        `[${i + 1}] ${p.title ?? "Untitled"} (${p.year ?? "n.d."})`,
        `    Authors: ${authors}`,
        `    Journal: ${p.journal ?? "Unknown"}`,
        `    Relevance: ${tier} (score ${p.relevanceScore}/5)`,
        `    Citations: ${p.citationCount ?? 0}`,
      ];
      if (p.journalHIndex != null)
        lines.push(`    Journal h-index: ${p.journalHIndex}`);
      if (p.impactFactor != null)
        lines.push(`    Impact factor (2yr): ${p.impactFactor.toFixed(2)}`);
      if (p.doi) lines.push(`    DOI: ${p.doi}`);
      return lines.join("\n");
    })
    .join("\n\n");
}

export async function POST(req: NextRequest) {
  // ── Auth: Pro-only endpoint ────────────────────────────────────────────────
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }
  const pro = checkIsPro(req, session.user.email);
  if (!pro) {
    return NextResponse.json({ error: "Pro subscription required" }, { status: 403 });
  }

  // ── Rate limit: 10/min, 30/hr per Pro user ────────────────────────────────
  {
    const rl = await checkRateLimit(
      `user:${session.user.email}`,
      "omakase",
      [{ windowType: "minute", limit: 10 }, { windowType: "hour", limit: 30 }]
    );
    if (!rl.allowed) return rateLimitResponse(rl.retryAfterSeconds);
  }

  // ── Parse body ─────────────────────────────────────────────────────────────
  const body = await req.json().catch(() => null);
  const paragraph: string | null = body?.paragraph ?? null;
  const papers: RatedPaper[] | null = body?.papers ?? null;
  const citationStyle: string | null = body?.citationStyle ?? null;

  if (!paragraph?.trim()) {
    return NextResponse.json({ error: "paragraph is required" }, { status: 400 });
  }
  if (!Array.isArray(papers) || papers.length === 0) {
    return NextResponse.json({ error: "papers array is required" }, { status: 400 });
  }
  if (!citationStyle) {
    return NextResponse.json({ error: "citationStyle is required" }, { status: 400 });
  }

  // ── Call Anthropic API ─────────────────────────────────────────────────────
  const papersBlock = buildPapersBlock(papers);

  const isNumberedStyle = ["IEEE", "Vancouver", "GB/T 7714"].some(s => citationStyle.startsWith(s));

  const numberedHint = isNumberedStyle
    ? `\n\nCRITICAL NUMBERING RULE for ${citationStyle}: Number references in ORDER OF FIRST APPEARANCE in the paragraph starting from [1]. The reference_list array must be in that exact same order: reference_list[0] is the full citation for [1], reference_list[1] for [2], etc. Never use a citation number higher than the total count of unique papers you cite. Every [N] in the paragraph must correspond exactly to reference_list[N-1].`
    : "";

  const gbtFormatHint = citationStyle === "GB/T 7714"
    ? "\n\nGB/T 7714 reference list format: Author1 LastInitials, Author2 LastInitials. Title[J]. Journal Name, Year, Volume(Issue): Pages. Example: Zhang S, Li X. Effects of climate change on coral reefs[J]. Nature Climate Change, 2020, 10(3): 234-241. List up to 3 authors then use \"et al\" for more."
    : "";

  const response = await client.messages.parse({
    model: omakaseModel(),
    max_tokens: 2048,
    system: `You are an academic writing assistant. Rewrite the following paragraph with proper in-text citations using the citation style specified. Only use papers from the provided list. Prefer papers categorized as Direct or High relevance with higher citation counts and h-index. Do not use Moderate papers unless no better option exists.${numberedHint}${gbtFormatHint}`,
    messages: [
      {
        role: "user",
        content: `Citation style: ${citationStyle}

Original paragraph:
${paragraph}

Available papers (referenced by [N] number):
${papersBlock}

Return a JSON object with:
- rewritten_paragraph: the paragraph rewritten with in-text citations at every relevant claim
- reference_list: an array of full formatted references for each source you cited, in ${citationStyle} format${isNumberedStyle ? " (ordered by first appearance in paragraph, matching [1], [2], [3]... in text)" : ""}`,
      },
    ],
    output_config: {
      format: zodOutputFormat(OmakaseSchema),
    },
  });

  // ── Post-process: normalize numbered citation indices ─────────────────────
  if (isNumberedStyle && response.parsed_output?.rewritten_paragraph) {
    const para = response.parsed_output.rewritten_paragraph;
    const refList = response.parsed_output.reference_list ?? [];

    // Extract unique cited numbers in order of first appearance
    const seenNums = new Set<number>();
    const appearedOrder: number[] = [];
    const numRe = /\[(\d+)\]/g;
    let nm: RegExpExecArray | null;
    while ((nm = numRe.exec(para)) !== null) {
      const n = parseInt(nm[1]);
      if (!seenNums.has(n)) { seenNums.add(n); appearedOrder.push(n); }
    }

    if (appearedOrder.length > 0) {
      // Build old→new map based on first-appearance order
      const renumberMap = new Map<number, number>();
      appearedOrder.forEach((oldN, i) => renumberMap.set(oldN, i + 1));

      const newPara = para.replace(/\[(\d+)\]/g, (_, d) => {
        const mapped = renumberMap.get(parseInt(d));
        return mapped ? `[${mapped}]` : `[${d}]`;
      });

      // Sort reference list to match first-appearance order
      // (assume the model listed them in ascending old-number order or first-appearance order)
      // Use the reference list as-is but truncate to cited count
      const newRefs = appearedOrder
        .map(oldN => {
          const zeroIdx = oldN - 1;
          return zeroIdx >= 0 && zeroIdx < refList.length ? refList[zeroIdx] : refList[appearedOrder.indexOf(oldN)];
        })
        .filter(Boolean);

      return NextResponse.json({
        rewritten_paragraph: newPara,
        reference_list: newRefs.length > 0 ? newRefs : refList,
      });
    }
  }

  const parsed = response.parsed_output;
  if (!parsed?.rewritten_paragraph?.trim()) {
    return NextResponse.json(
      { error: "Model returned an empty response" },
      { status: 500 }
    );
  }

  return NextResponse.json({
    rewritten_paragraph: parsed.rewritten_paragraph,
    reference_list: parsed.reference_list,
  });
}
