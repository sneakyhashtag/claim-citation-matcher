import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { z } from "zod";

const client = new Anthropic();

export interface Paper {
  title: string | null;
  authors: string[];
  year: number | null;
  journal: string | null;
  citationCount: number;
  influentialCitationCount?: number;
  journalHIndex?: number | null;
  /** 2-year mean citedness from OpenAlex — a free proxy for Impact Factor. */
  impactFactor?: number | null;
  subjectArea?: string | null;
  doi: string | null;
  abstract: string | null;
  source?: "OpenAlex" | "Semantic Scholar";
}

export interface RatedPaper extends Paper {
  relevanceScore: number;
  relevanceExplanation: string;
}

const RatingSchema = z.object({
  ratings: z.array(
    z.object({
      index: z.number().int(),
      score: z.number().int().min(1).max(5),
      explanation: z.string(),
    })
  ),
});

export async function rateRelevance(
  claim: string,
  papers: Paper[]
): Promise<RatedPaper[]> {
  if (papers.length === 0) return [];

  const papersText = papers
    .map(
      (p, i) =>
        `[${i}] Title: ${p.title ?? "Unknown"}\nAbstract: ${p.abstract ?? "No abstract available"}`
    )
    .join("\n\n");

  const response = await client.messages.parse({
    model: "claude-opus-4-6",
    max_tokens: 1024,
    system: `You are a research assistant evaluating how relevant academic papers are to a specific claim.

Rate each paper's relevance to the claim on a scale of 1–5:
1 = Not relevant
2 = Tangentially related
3 = Moderately relevant
4 = Highly relevant
5 = Directly supports or refutes the claim

For each paper provide a one-sentence explanation.`,
    messages: [
      {
        role: "user",
        content: `Claim: "${claim}"\n\nPapers to rate:\n\n${papersText}`,
      },
    ],
    output_config: {
      format: zodOutputFormat(RatingSchema),
    },
  });

  const { ratings } = response.parsed_output!;

  return ratings
    .filter((r) => r.score >= 3)
    .map((r) => ({
      ...papers[r.index],
      relevanceScore: r.score,
      relevanceExplanation: r.explanation,
    }));
}
