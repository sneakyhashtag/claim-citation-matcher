import { NextRequest, NextResponse } from "next/server";
import type { Paper } from "@/lib/rate-relevance";

interface OpenAlexWork {
  id: string;
  title: string;
  publication_year: number | null;
  doi: string | null;
  cited_by_count: number;
  abstract_inverted_index: Record<string, number[]> | null;
  authorships: {
    author: { display_name: string };
  }[];
  primary_location: {
    source: { id: string; display_name: string } | null;
  } | null;
  primary_topic: {
    field: { display_name: string };
  } | null;
  biblio: {
    volume: string | null;
    issue: string | null;
    first_page: string | null;
    last_page: string | null;
  } | null;
}

interface SemanticScholarPaper {
  paperId: string;
  title: string;
  authors: { name: string }[];
  year: number | null;
  abstract: string | null;
  externalIds: { DOI?: string } | null;
  citationCount: number;
  influentialCitationCount: number;
  journal: { name: string; volume?: string; pages?: string } | null;
  fieldsOfStudy: string[] | null;
}

function reconstructAbstract(
  invertedIndex: Record<string, number[]> | null
): string | null {
  if (!invertedIndex) return null;
  const entries: [number, string][] = [];
  for (const [word, positions] of Object.entries(invertedIndex)) {
    for (const pos of positions) {
      entries.push([pos, word]);
    }
  }
  entries.sort((a, b) => a[0] - b[0]);
  return entries.map(([, word]) => word).join(" ");
}

function normalizeDoi(doi: string | null): string | null {
  if (!doi) return null;
  return doi.replace(/^https?:\/\/doi\.org\//i, "").toLowerCase();
}

async function fetchOpenAlex(query: string): Promise<Paper[]> {
  const url = new URL("https://api.openalex.org/works");
  url.searchParams.set("search", query);
  url.searchParams.set("per_page", "5");
  url.searchParams.set(
    "select",
    "id,title,publication_year,doi,cited_by_count,abstract_inverted_index,authorships,primary_location,primary_topic,biblio"
  );

  const res = await fetch(url.toString(), {
    headers: {
      "User-Agent": "claim-citation-matcher (mailto:contact@example.com)",
    },
  });
  if (!res.ok) return [];

  const data = await res.json();
  const works: OpenAlexWork[] = data.results ?? [];

  // Collect unique source IDs so we can batch-fetch journal h-indexes
  const shortId = (id: string) => id.replace("https://openalex.org/", "");
  const sourceIds = [
    ...new Set(
      works
        .map((w) => w.primary_location?.source?.id)
        .filter((id): id is string => !!id)
        .map(shortId)
    ),
  ];

  // Single batch request for journal h-index + 2yr mean citedness (≈ Impact Factor)
  const hIndexMap: Record<string, number | null> = {};
  const ifMap: Record<string, number | null> = {};
  if (sourceIds.length > 0) {
    try {
      const sourcesUrl = new URL("https://api.openalex.org/sources");
      sourcesUrl.searchParams.set(
        "filter",
        `ids.openalex:${sourceIds.join("|")}`
      );
      sourcesUrl.searchParams.set("select", "id,summary_stats");
      sourcesUrl.searchParams.set("per_page", "20");
      const sourcesRes = await fetch(sourcesUrl.toString(), {
        headers: {
          "User-Agent": "claim-citation-matcher (mailto:contact@example.com)",
        },
      });
      if (sourcesRes.ok) {
        const sourcesData = await sourcesRes.json();
        for (const src of sourcesData.results ?? []) {
          const sid = shortId(src.id as string);
          hIndexMap[sid] =
            (src.summary_stats?.h_index as number | undefined) ?? null;
          // 2yr_mean_citedness is OpenAlex's free proxy for journal Impact Factor
          const raw2yr = src.summary_stats?.["2yr_mean_citedness"] as
            | number
            | undefined;
          ifMap[sid] = typeof raw2yr === "number" && raw2yr > 0 ? raw2yr : null;
        }
      }
    } catch {
      // source stats fetch failed — continue without them
    }
  }

  return works.map((work) => {
    const sid = work.primary_location?.source?.id
      ? shortId(work.primary_location.source.id)
      : null;
    return {
      title: work.title ?? null,
      authors: work.authorships.map((a) => a.author.display_name),
      year: work.publication_year ?? null,
      journal: work.primary_location?.source?.display_name ?? null,
      volume: work.biblio?.volume ?? null,
      issue: work.biblio?.issue ?? null,
      pages: work.biblio?.first_page
        ? work.biblio.last_page
          ? `${work.biblio.first_page}–${work.biblio.last_page}`
          : work.biblio.first_page
        : null,
      citationCount: work.cited_by_count,
      journalHIndex: sid != null ? (hIndexMap[sid] ?? null) : null,
      impactFactor: sid != null ? (ifMap[sid] ?? null) : null,
      subjectArea: work.primary_topic?.field?.display_name ?? null,
      doi: work.doi ?? null,
      abstract: reconstructAbstract(work.abstract_inverted_index),
      source: "OpenAlex" as const,
    };
  });
}

async function fetchSemanticScholar(query: string): Promise<Paper[]> {
  const url = new URL("https://api.semanticscholar.org/graph/v1/paper/search");
  url.searchParams.set("query", query);
  url.searchParams.set("limit", "5");
  url.searchParams.set(
    "fields",
    "title,authors,year,abstract,externalIds,citationCount,influentialCitationCount,journal,fieldsOfStudy"
  );

  const res = await fetch(url.toString());
  if (!res.ok) return [];

  const data = await res.json();
  const papers: SemanticScholarPaper[] = data.data ?? [];

  return papers.map((p) => ({
    title: p.title ?? null,
    authors: p.authors.map((a) => a.name),
    year: p.year ?? null,
    journal: p.journal?.name ?? null,
    volume: p.journal?.volume ?? null,
    issue: null,
    pages: p.journal?.pages ?? null,
    citationCount: p.citationCount ?? 0,
    influentialCitationCount: p.influentialCitationCount ?? 0,
    subjectArea: p.fieldsOfStudy?.[0] ?? null,
    doi: p.externalIds?.DOI ? `https://doi.org/${p.externalIds.DOI}` : null,
    abstract: p.abstract ?? null,
    source: "Semantic Scholar" as const,
    s2PaperId: p.paperId ?? null,
  }));
}

export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get("query");

  if (!query || !query.trim()) {
    return NextResponse.json({ error: "query is required" }, { status: 400 });
  }

  const [openAlexResult, semanticScholarResult] = await Promise.allSettled([
    fetchOpenAlex(query),
    fetchSemanticScholar(query),
  ]);

  const openAlexPapers =
    openAlexResult.status === "fulfilled" ? openAlexResult.value : [];
  const semanticScholarPapers =
    semanticScholarResult.status === "fulfilled"
      ? semanticScholarResult.value
      : [];

  // Combine and deduplicate by DOI — OpenAlex takes priority
  const seen = new Set<string>();
  const papers: Paper[] = [];

  for (const paper of openAlexPapers) {
    const normDoi = normalizeDoi(paper.doi);
    if (normDoi) seen.add(normDoi);
    papers.push(paper);
  }

  for (const paper of semanticScholarPapers) {
    const normDoi = normalizeDoi(paper.doi);
    if (normDoi && seen.has(normDoi)) continue;
    if (normDoi) seen.add(normDoi);
    papers.push(paper);
  }

  return NextResponse.json({ papers });
}
