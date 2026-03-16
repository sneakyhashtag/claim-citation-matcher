import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { z } from "zod";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { readPro } from "@/lib/pro-cookie";
import type { RatedPaper } from "@/lib/rate-relevance";

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
  const pro = readPro(req);
  if (!pro) {
    return NextResponse.json({ error: "Pro subscription required" }, { status: 403 });
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

  const response = await client.messages.parse({
    model: "claude-opus-4-6",
    max_tokens: 2048,
    system: `You are an academic writing assistant. Rewrite the following paragraph with proper in-text citations using the citation style specified. Only use papers from the provided list. Prefer papers categorized as Direct or High relevance with higher citation counts and h-index. Do not use Moderate papers unless no better option exists.`,
    messages: [
      {
        role: "user",
        content: `Citation style: ${citationStyle}

Original paragraph:
${paragraph}

Available papers:
${papersBlock}

Return a JSON object with:
- rewritten_paragraph: the paragraph rewritten with in-text citations at every relevant claim
- reference_list: an array of full formatted references for each source you cited, in ${citationStyle} format`,
      },
    ],
    output_config: {
      format: zodOutputFormat(OmakaseSchema),
    },
  });

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
