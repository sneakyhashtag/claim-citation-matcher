import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { z } from "zod";
import { relevanceScoringModel } from "@/lib/models";

const client = new Anthropic();

export interface Paper {
  title: string | null;
  authors: string[];
  year: number | null;
  journal: string | null;
  volume?: string | null;
  issue?: string | null;
  pages?: string | null;
  citationCount: number;
  influentialCitationCount?: number;
  journalHIndex?: number | null;
  /** 2-year mean citedness from OpenAlex — a free proxy for Impact Factor. */
  impactFactor?: number | null;
  /** Scimago Journal Rankings quartile ("Q1"–"Q4"), looked up from the SJR index. */
  sjrQuartile?: string | null;
  /** The dominant SJR subject category for the journal (e.g. "Medicine (miscellaneous)"). */
  sjrCategory?: string | null;
  subjectArea?: string | null;
  doi: string | null;
  abstract: string | null;
  source?: "OpenAlex" | "Semantic Scholar";
  s2PaperId?: string | null;
}

export interface RatedPaper extends Paper {
  relevanceScore: number;
  relevanceExplanation: string;
  matchType?: "Abstract Match" | "Topic Match" | null;
  matchingExcerpt?: string | null;
}

const RatingSchema = z.object({
  ratings: z.array(
    z.object({
      index: z.number().int(),
      score: z.number().int().min(1).max(5),
      explanation: z.string(),
      match_type: z.enum(["Abstract Match", "Topic Match"]),
      matching_excerpt: z.string().nullable(),
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
    model: relevanceScoringModel(),
    max_tokens: 2048,
    system: `You are a research assistant evaluating how relevant academic papers are to a specific claim.

Rate each paper's relevance to the claim on a scale of 1–5:
1 = Not relevant
2 = Tangentially related
3 = Moderately relevant
4 = Highly relevant
5 = Directly supports or refutes the claim

For each paper also provide:

1. explanation: a one-sentence explanation of the relevance.

2. match_type: classify as exactly one of:
   - "Abstract Match" — a specific sentence or phrase in the abstract directly states or closely mirrors the claim
   - "Topic Match" — the paper's abstract generally discusses the topic but no single sentence directly corresponds to the claim

3. matching_excerpt:
   - For "Abstract Match": copy verbatim the single sentence or phrase from the abstract that most directly matches the claim.
   - For "Topic Match": write one brief sentence explaining how the paper's overall topic or findings relate to the claim (do not quote; synthesise).
   - Set to null only if the abstract is unavailable.`,
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
      matchType: r.match_type,
      matchingExcerpt: r.matching_excerpt ?? null,
    }));
}
