import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { writeCount } from "@/lib/usage-cookie";
import { checkUsageDB, incrementUsageDB, DAILY_LIMIT } from "@/lib/db-usage";
import { checkIsPro } from "@/lib/pro-cookie";
import type { Paper } from "@/lib/rate-relevance";
import { lookupSJRQuartile } from "@/lib/sjr";

interface S2Paper {
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

interface OpenAlexWork {
  id: string;
  title: string;
  publication_year: number | null;
  doi: string | null;
  cited_by_count: number;
  abstract_inverted_index: Record<string, number[]> | null;
  authorships: { author: { display_name: string } }[];
  primary_location: { source: { id: string; display_name: string } | null } | null;
  primary_topic: { field: { display_name: string } } | null;
  biblio: { volume: string | null; issue: string | null; first_page: string | null; last_page: string | null } | null;
}

function normalizeDoi(doi: string | null): string | null {
  if (!doi) return null;
  return doi.replace(/^https?:\/\/doi\.org\//i, "").toLowerCase();
}

function reconstructAbstract(idx: Record<string, number[]> | null): string | null {
  if (!idx) return null;
  const entries: [number, string][] = [];
  for (const [word, positions] of Object.entries(idx)) {
    for (const pos of positions) entries.push([pos, word]);
  }
  entries.sort((a, b) => a[0] - b[0]);
  return entries.map(([, w]) => w).join(" ");
}

function extractKeyTerms(title: string): string {
  const stopWords = new Set([
    "the","a","an","and","or","but","in","on","at","to","for","of","with","by",
    "from","is","are","was","were","be","been","its","this","that","these","those",
    "as","into","through","after","over","under","not","only","same","so","than",
    "too","very","just","if","while","since","unless","until","whether","about",
  ]);
  const words = title
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !stopWords.has(w));
  return words.slice(0, 7).join(" ");
}

function mapS2Paper(p: S2Paper): Paper {
  return {
    title: p.title ?? null,
    authors: p.authors.map((a) => a.name),
    year: p.year ?? null,
    journal: p.journal?.name ?? null,
    volume: p.journal?.volume ?? null,
    issue: null,
    pages: p.journal?.pages ?? null,
    citationCount: p.citationCount ?? 0,
    influentialCitationCount: p.influentialCitationCount ?? 0,
    ...(() => {
      const sjr = lookupSJRQuartile(p.journal?.name ?? null);
      return { sjrQuartile: sjr?.quartile ?? null, sjrCategory: sjr?.category ?? null };
    })(),
    subjectArea: p.fieldsOfStudy?.[0] ?? null,
    doi: p.externalIds?.DOI ? `https://doi.org/${p.externalIds.DOI}` : null,
    abstract: p.abstract ?? null,
    source: "Semantic Scholar",
    s2PaperId: p.paperId ?? null,
  };
}

async function fetchS2Recommendations(s2PaperId: string): Promise<Paper[]> {
  const url =
    `https://api.semanticscholar.org/recommendations/v1/papers/forpaper/${encodeURIComponent(s2PaperId)}` +
    `?fields=title,authors,year,abstract,externalIds,citationCount,influentialCitationCount,journal,fieldsOfStudy&limit=10`;
  const res = await fetch(url);
  if (!res.ok) return [];
  const data = await res.json();
  return (data.recommendedPapers ?? []).map(mapS2Paper);
}

async function fetchS2Search(query: string): Promise<Paper[]> {
  const url = new URL("https://api.semanticscholar.org/graph/v1/paper/search");
  url.searchParams.set("query", query);
  url.searchParams.set("limit", "8");
  url.searchParams.set(
    "fields",
    "title,authors,year,abstract,externalIds,citationCount,influentialCitationCount,journal,fieldsOfStudy"
  );
  const res = await fetch(url.toString());
  if (!res.ok) return [];
  const data = await res.json();
  return (data.data ?? []).map(mapS2Paper);
}

async function fetchOpenAlexSearch(query: string): Promise<Paper[]> {
  const url = new URL("https://api.openalex.org/works");
  url.searchParams.set("search", query);
  url.searchParams.set("per_page", "8");
  url.searchParams.set(
    "select",
    "id,title,publication_year,doi,cited_by_count,abstract_inverted_index,authorships,primary_location,primary_topic,biblio"
  );
  const res = await fetch(url.toString(), {
    headers: { "User-Agent": "claim-citation-matcher (mailto:contact@example.com)" },
  });
  if (!res.ok) return [];
  const data = await res.json();
  const works: OpenAlexWork[] = data.results ?? [];

  const shortId = (id: string) => id.replace("https://openalex.org/", "");
  const sourceIds = [
    ...new Set(
      works
        .map((w) => w.primary_location?.source?.id)
        .filter((id): id is string => !!id)
        .map(shortId)
    ),
  ];

  const hIndexMap: Record<string, number | null> = {};
  const ifMap: Record<string, number | null> = {};
  const issnMap: Record<string, string[]> = {};
  if (sourceIds.length > 0) {
    try {
      const sourcesUrl = new URL("https://api.openalex.org/sources");
      sourcesUrl.searchParams.set("filter", `ids.openalex:${sourceIds.join("|")}`);
      sourcesUrl.searchParams.set("select", "id,summary_stats,issn");
      sourcesUrl.searchParams.set("per_page", "20");
      const srcRes = await fetch(sourcesUrl.toString(), {
        headers: { "User-Agent": "claim-citation-matcher (mailto:contact@example.com)" },
      });
      if (srcRes.ok) {
        const srcData = await srcRes.json();
        for (const src of srcData.results ?? []) {
          const sid = shortId(src.id as string);
          hIndexMap[sid] = (src.summary_stats?.h_index as number | undefined) ?? null;
          const raw2yr = src.summary_stats?.["2yr_mean_citedness"] as number | undefined;
          ifMap[sid] = typeof raw2yr === "number" && raw2yr > 0 ? raw2yr : null;
          issnMap[sid] = (src.issn as string[] | null) ?? [];
        }
      }
    } catch {
      // continue without journal stats
    }
  }

  return works.map((work) => {
    const sid = work.primary_location?.source?.id ? shortId(work.primary_location.source.id) : null;
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
      ...(() => {
        const sjr = lookupSJRQuartile(
          work.primary_location?.source?.display_name ?? null,
          sid != null ? (issnMap[sid] ?? []) : []
        );
        return { sjrQuartile: sjr?.quartile ?? null, sjrCategory: sjr?.category ?? null };
      })(),
      subjectArea: work.primary_topic?.field?.display_name ?? null,
      doi: work.doi ?? null,
      abstract: reconstructAbstract(work.abstract_inverted_index),
      source: "OpenAlex" as const,
    };
  });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const title: string | null = body?.title ?? null;
  const doi: string | null = body?.doi ?? null;
  const s2PaperId: string | null = body?.s2PaperId ?? null;

  if (!title) {
    return NextResponse.json({ error: "title is required" }, { status: 400 });
  }

  // ── Usage limit — verified against the database (same rules as extract-claims)
  const session = await auth();
  const pro = !!session?.user && checkIsPro(req, session.user.email);

  if (!pro) {
    const usage = await checkUsageDB(req, session);
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

  const keyTerms = extractKeyTerms(title);

  const [s2Result, oaResult] = await Promise.allSettled([
    s2PaperId ? fetchS2Recommendations(s2PaperId) : fetchS2Search(keyTerms),
    fetchOpenAlexSearch(keyTerms),
  ]);

  const s2Papers = s2Result.status === "fulfilled" ? s2Result.value : [];
  const oaPapers = oaResult.status === "fulfilled" ? oaResult.value : [];

  const origDoi = normalizeDoi(doi);
  const origTitle = title.toLowerCase().trim();

  function isOriginal(p: Paper): boolean {
    if (origDoi && normalizeDoi(p.doi) === origDoi) return true;
    if (p.title && p.title.toLowerCase().trim() === origTitle) return true;
    return false;
  }

  const seen = new Set<string>();
  const papers: Paper[] = [];

  for (const paper of [...oaPapers, ...s2Papers]) {
    if (isOriginal(paper)) continue;
    const normDoi = normalizeDoi(paper.doi);
    const key = normDoi ?? paper.title?.toLowerCase().trim() ?? null;
    if (!key || seen.has(key)) continue;
    seen.add(key);
    papers.push(paper);
    if (papers.length >= 5) break;
  }

  // ── Increment DB counter, update cookie cache, and respond ─────────────────
  if (!pro) {
    const { count: newCount, remaining } = await incrementUsageDB(req, session);
    const res = NextResponse.json({ papers, remaining, limit: DAILY_LIMIT });
    writeCount(res, newCount);
    return res;
  }

  return NextResponse.json({ papers, remaining: null, limit: null });
}
