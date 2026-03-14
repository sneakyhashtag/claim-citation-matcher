import { NextRequest, NextResponse } from "next/server";

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
    source: { display_name: string } | null;
  } | null;
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

export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get("query");

  if (!query || !query.trim()) {
    return NextResponse.json({ error: "query is required" }, { status: 400 });
  }

  const url = new URL("https://api.openalex.org/works");
  url.searchParams.set("search", query);
  url.searchParams.set("per_page", "5");
  url.searchParams.set(
    "select",
    "id,title,publication_year,doi,cited_by_count,abstract_inverted_index,authorships,primary_location"
  );

  const res = await fetch(url.toString(), {
    headers: {
      "User-Agent": "claim-citation-matcher (mailto:contact@example.com)",
    },
  });

  if (!res.ok) {
    return NextResponse.json(
      { error: `OpenAlex request failed: ${res.status}` },
      { status: 502 }
    );
  }

  const data = await res.json();
  const works: OpenAlexWork[] = data.results ?? [];

  const papers = works.map((work) => ({
    title: work.title ?? null,
    authors: work.authorships.map((a) => a.author.display_name),
    year: work.publication_year ?? null,
    journal: work.primary_location?.source?.display_name ?? null,
    citationCount: work.cited_by_count,
    doi: work.doi ?? null,
    abstract: reconstructAbstract(work.abstract_inverted_index),
  }));

  return NextResponse.json({ papers });
}
