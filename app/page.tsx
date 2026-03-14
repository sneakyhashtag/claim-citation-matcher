"use client";

import { useState } from "react";
import type { RatedPaper } from "@/lib/rate-relevance";

const CHAR_LIMIT = 2000;

const EXAMPLE_TEXT =
  "Regular physical exercise has been shown to reduce the risk of cardiovascular disease by up to 35%. Sleep deprivation negatively affects cognitive performance and memory consolidation. A Mediterranean diet is associated with lower rates of depression and anxiety. Screen time exceeding two hours per day is linked to increased rates of childhood obesity.";

interface ClaimResult {
  claim: string;
  papers: RatedPaper[];
}

// ── helpers ──────────────────────────────────────────────────────────────────

function formatAPA(paper: RatedPaper): string {
  const fmt = (name: string) => {
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0];
    const last = parts[parts.length - 1];
    const initials = parts
      .slice(0, -1)
      .map((p) => p[0] + ".")
      .join(" ");
    return `${last}, ${initials}`;
  };

  const authorStr =
    paper.authors.length === 0
      ? "Unknown Author"
      : paper.authors.length === 1
        ? fmt(paper.authors[0])
        : paper.authors.length === 2
          ? `${fmt(paper.authors[0])}, & ${fmt(paper.authors[1])}`
          : `${fmt(paper.authors[0])}, et al.`;

  const year = paper.year ? `(${paper.year})` : "(n.d.)";
  const journal = paper.journal ? ` ${paper.journal}.` : "";
  const doi = paper.doi ? ` ${paper.doi}` : "";

  return `${authorStr} ${year}. ${paper.title ?? "Untitled"}.${journal}${doi}`;
}

async function apiFetch<T>(
  url: string,
  options?: RequestInit
): Promise<{ data: T | null; error: string | null }> {
  try {
    const res = await fetch(url, options);
    const json = await res.json();
    if (!res.ok) {
      return {
        data: null,
        error: json?.error ?? `Request failed (${res.status})`,
      };
    }
    return { data: json, error: null };
  } catch {
    return { data: null, error: "Network error — please check your connection and try again." };
  }
}

// ── small components ──────────────────────────────────────────────────────────

function ScoreBadge({ score }: { score: number }) {
  const styles: Record<number, string> = {
    3: "bg-yellow-100 text-yellow-800",
    4: "bg-blue-100 text-blue-800",
    5: "bg-green-100 text-green-800",
  };
  const labels: Record<number, string> = {
    3: "Moderate",
    4: "High",
    5: "Direct",
  };
  return (
    <span
      className={`shrink-0 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${styles[score] ?? "bg-gray-100 text-gray-700"}`}
    >
      {score}/5 · {labels[score] ?? "Relevant"}
    </span>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard access denied — silently ignore
    }
  };
  return (
    <button
      onClick={handleCopy}
      type="button"
      className="text-xs text-gray-400 hover:text-gray-700 transition-colors"
      title="Copy APA citation"
    >
      {copied ? "✓ Copied" : "Copy APA"}
    </button>
  );
}

function ErrorBanner({ message }: { message: string }) {
  return (
    <div
      role="alert"
      className="mt-6 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3"
    >
      <svg
        className="mt-0.5 h-4 w-4 shrink-0 text-red-500"
        viewBox="0 0 20 20"
        fill="currentColor"
        aria-hidden
      >
        <path
          fillRule="evenodd"
          d="M10 18a8 8 0 100-16 8 8 0 000 16zm-.75-4.75a.75.75 0 001.5 0V10a.75.75 0 00-1.5 0v3.25zm.75-6a.75.75 0 100-1.5.75.75 0 000 1.5z"
          clipRule="evenodd"
        />
      </svg>
      <p className="text-sm text-red-700">{message}</p>
    </div>
  );
}

// ── paper card ────────────────────────────────────────────────────────────────

function PaperCard({ paper }: { paper: RatedPaper }) {
  const authorLine =
    paper.authors.length === 0
      ? null
      : paper.authors.length <= 3
        ? paper.authors.join(", ")
        : `${paper.authors[0]}, et al.`;

  const meta = [
    authorLine,
    paper.year,
    paper.journal,
    paper.citationCount != null
      ? `${paper.citationCount.toLocaleString()} citations`
      : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="rounded-md border border-gray-100 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          {paper.doi ? (
            <a
              href={paper.doi}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-medium text-gray-900 hover:text-blue-600 transition-colors leading-snug break-words"
            >
              {paper.title ?? "Untitled"}
            </a>
          ) : (
            <span className="text-sm font-medium text-gray-900 leading-snug break-words">
              {paper.title ?? "Untitled"}
            </span>
          )}
        </div>
        <ScoreBadge score={paper.relevanceScore} />
      </div>

      {meta && (
        <p className="mt-1.5 text-xs text-gray-500 break-words">{meta}</p>
      )}

      <p className="mt-2 text-xs text-gray-500 italic leading-relaxed">
        {paper.relevanceExplanation}
      </p>

      <div className="mt-2">
        <CopyButton text={formatAPA(paper)} />
      </div>
    </div>
  );
}

// ── claim card ────────────────────────────────────────────────────────────────

function ClaimCard({ result }: { result: ClaimResult }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 sm:p-5">
      <p className="text-sm font-medium text-gray-800 leading-relaxed">
        &ldquo;{result.claim}&rdquo;
      </p>

      {result.papers.length === 0 ? (
        <p className="mt-3 text-xs text-gray-400">
          No relevant papers found for this claim.
        </p>
      ) : (
        <div className="mt-3 flex flex-col gap-2">
          {result.papers.map((paper, i) => (
            <PaperCard key={paper.doi ?? i} paper={paper} />
          ))}
        </div>
      )}
    </div>
  );
}

// ── page ──────────────────────────────────────────────────────────────────────

export default function Home() {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");
  const [results, setResults] = useState<ClaimResult[]>([]);
  const [error, setError] = useState("");

  const remaining = CHAR_LIMIT - text.length;
  const overLimit = remaining < 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (overLimit) return;

    setLoading(true);
    setError("");
    setResults([]);

    try {
      setStatus("Extracting claims…");

      const { data: claimsData, error: claimsError } = await apiFetch<{
        claims: { claim: string; searchQuery: string }[];
      }>("/api/extract-claims", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });

      if (claimsError || !claimsData) {
        setError(claimsError ?? "Failed to extract claims. Please try again.");
        return;
      }

      const { claims } = claimsData;

      if (!claims?.length) {
        setError("No factual claims were found in this paragraph. Try a paragraph with specific statistics or scientific statements.");
        return;
      }

      setStatus(
        `Found ${claims.length} claim${claims.length > 1 ? "s" : ""}. Searching for papers…`
      );

      const claimResults: ClaimResult[] = await Promise.all(
        claims.map(
          async (c): Promise<ClaimResult> => {
            const { data: searchData, error: searchError } = await apiFetch<{
              papers: RatedPaper[];
            }>(`/api/search-papers?query=${encodeURIComponent(c.searchQuery)}`);

            if (searchError || !searchData?.papers?.length) {
              return { claim: c.claim, papers: [] };
            }

            const { data: rateData, error: rateError } = await apiFetch<{
              papers: RatedPaper[];
            }>("/api/rate-relevance", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ claim: c.claim, papers: searchData.papers }),
            });

            if (rateError || !rateData) {
              // Rating failed — return unrated papers rather than nothing
              return { claim: c.claim, papers: [] };
            }

            return { claim: c.claim, papers: rateData.papers ?? [] };
          }
        )
      );

      setResults(claimResults);
      setStatus("");
    } catch {
      setError("An unexpected error occurred. Please try again.");
      setStatus("");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8 sm:px-6">
      <main className="mx-auto w-full max-w-2xl">

        {/* header */}
        <div className="mb-6">
          <h1 className="text-xl font-semibold text-gray-900 sm:text-2xl">
            Claim Citation Matcher
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Paste a paragraph to find academic citations for each factual claim.
          </p>
        </div>

        {/* form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div className="relative">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value.slice(0, CHAR_LIMIT + 50))}
              placeholder="Paste your paragraph here…"
              aria-label="Paragraph input"
              className={`w-full h-44 sm:h-48 rounded-lg border bg-white px-4 py-3 pb-7 text-sm text-gray-900 placeholder-gray-400 shadow-sm resize-none focus:outline-none focus:ring-2 focus:border-transparent transition-colors disabled:opacity-50 ${
                overLimit
                  ? "border-red-400 focus:ring-red-400"
                  : "border-gray-200 focus:ring-gray-900"
              }`}
              disabled={loading}
            />
            {/* character counter */}
            <span
              className={`absolute bottom-2 right-3 text-xs tabular-nums ${
                overLimit
                  ? "text-red-500 font-medium"
                  : remaining <= 200
                    ? "text-yellow-600"
                    : "text-gray-400"
              }`}
            >
              {remaining < 0 ? `${Math.abs(remaining)} over limit` : `${remaining} remaining`}
            </span>
          </div>

          {/* button row */}
          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => setText(EXAMPLE_TEXT)}
              disabled={loading}
              className="text-sm text-gray-500 underline underline-offset-2 hover:text-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Try an example
            </button>

            <button
              type="submit"
              disabled={!text.trim() || overLimit || loading}
              className="px-5 py-2 rounded-lg bg-gray-900 text-white text-sm font-medium hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? "Analyzing…" : "Submit"}
            </button>
          </div>
        </form>

        {/* loading state */}
        {loading && (
          <div className="mt-8 flex items-center gap-3 text-sm text-gray-500">
            <svg
              className="animate-spin h-4 w-4 shrink-0 text-gray-400"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              aria-hidden
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v8H4z"
              />
            </svg>
            <span>{status}</span>
          </div>
        )}

        {/* error banner */}
        {error && <ErrorBanner message={error} />}

        {/* results */}
        {results.length > 0 && (
          <div className="mt-8 flex flex-col gap-4">
            <h2 className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              {results.length} claim{results.length > 1 ? "s" : ""} found
            </h2>
            {results.map((result, i) => (
              <ClaimCard key={i} result={result} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
