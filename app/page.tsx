"use client";

import { useEffect, useRef, useState } from "react";
import { signIn, signOut, useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
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

// ── relevance tiers ───────────────────────────────────────────────────────────

function getTier(score: number): {
  label: string;
  cardClass: string;
  badgeClass: string;
} {
  if (score >= 5) return {
    label: "Direct",
    cardClass: "bg-green-50 border-green-200",
    badgeClass: "bg-green-100 text-green-800",
  };
  if (score >= 4) return {
    label: "High",
    cardClass: "bg-blue-50 border-blue-200",
    badgeClass: "bg-blue-100 text-blue-800",
  };
  return {
    label: "Moderate",
    cardClass: "bg-amber-50 border-amber-200",
    badgeClass: "bg-amber-100 text-amber-800",
  };
}

// ── small components ──────────────────────────────────────────────────────────

function ScoreBadge({ score }: { score: number }) {
  const { label, badgeClass } = getTier(score);
  return (
    <span className={`shrink-0 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${badgeClass}`}>
      {label}
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

// ── stat badge ────────────────────────────────────────────────────────────────

function StatBadge({
  icon,
  text,
  colorClass,
}: {
  icon: React.ReactNode;
  text: string;
  colorClass: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium ${colorClass}`}
    >
      {icon}
      {text}
    </span>
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

  const authorYearMeta = [authorLine, paper.year].filter(Boolean).join(" · ");

  const { cardClass } = getTier(paper.relevanceScore);

  return (
    <div className={`rounded-md border p-4 shadow-sm ${cardClass}`}>
      {/* title row */}
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
        <div className="flex items-center gap-1.5 shrink-0">
          {paper.source && (
            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
              paper.source === "Semantic Scholar"
                ? "bg-purple-100 text-purple-700"
                : "bg-gray-100 text-gray-600"
            }`}>
              {paper.source === "Semantic Scholar" ? "S2" : "OA"}
            </span>
          )}
          <ScoreBadge score={paper.relevanceScore} />
        </div>
      </div>

      {/* authors · year */}
      {authorYearMeta && (
        <p className="mt-1.5 text-xs text-gray-500 break-words">{authorYearMeta}</p>
      )}

      {/* journal */}
      {paper.journal && (
        <p className="mt-0.5 text-xs text-gray-500 italic truncate" title={paper.journal}>
          {paper.journal}
        </p>
      )}

      {/* stat badges row */}
      <div className="mt-2 flex flex-wrap gap-1.5">
        {/* orange — total citation count */}
        {paper.citationCount != null && paper.citationCount > 0 && (
          <StatBadge
            colorClass="bg-orange-50 border-orange-200 text-orange-700"
            text={`Cited ${paper.citationCount.toLocaleString()}x`}
            icon={
              <svg className="h-3 w-3 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.038 7.048 8.287 8.287 0 009 9.6a8.983 8.983 0 013.361-6.867 8.21 8.21 0 003 2.48z"/>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 18a3.75 3.75 0 00.495-7.467 5.99 5.99 0 00-1.925 3.546 5.974 5.974 0 01-2.133-1A3.75 3.75 0 0012 18z"/>
              </svg>
            }
          />
        )}

        {/* purple — influential citation count (Semantic Scholar only) */}
        {paper.source === "Semantic Scholar" &&
          paper.influentialCitationCount != null &&
          paper.influentialCitationCount > 0 && (
          <StatBadge
            colorClass="bg-purple-50 border-purple-200 text-purple-700"
            text={`Influential: ${paper.influentialCitationCount}`}
            icon={
              <svg className="h-3 w-3 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.562.562 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"/>
              </svg>
            }
          />
        )}

        {/* blue — journal h-index */}
        {paper.journalHIndex != null && (
          <StatBadge
            colorClass="bg-blue-50 border-blue-200 text-blue-700"
            text={`h-index: ${paper.journalHIndex}`}
            icon={
              <svg className="h-3 w-3 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z"/>
              </svg>
            }
          />
        )}

        {/* green — field / subject area */}
        {paper.subjectArea && (
          <StatBadge
            colorClass="bg-green-50 border-green-200 text-green-700"
            text={paper.subjectArea}
            icon={
              <svg className="h-3 w-3 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25"/>
              </svg>
            }
          />
        )}
      </div>

      {/* relevance explanation */}
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

function ClaimCard({ result, index }: { result: ClaimResult; index: number }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
      {/* claim header */}
      <div className="bg-gray-50 border-b border-gray-200 px-5 py-4">
        <div className="flex items-center gap-2 mb-2">
          <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-gray-900 text-white text-xs font-medium shrink-0">
            {index + 1}
          </span>
          <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">Claim</span>
        </div>
        <p className="text-sm font-medium text-gray-900 leading-relaxed">
          &ldquo;{result.claim}&rdquo;
        </p>
      </div>

      {/* papers */}
      <div className="px-5 py-4">
        {result.papers.length === 0 ? (
          <p className="text-xs text-gray-400">
            No relevant papers found for this claim.
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            {result.papers.map((paper, i) => (
              <PaperCard key={paper.doi ?? i} paper={paper} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── how to use modal ──────────────────────────────────────────────────────────

function HowToUseModal({ onClose }: { onClose: () => void }) {
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);

  return (
    <AnimatePresence>
      <>
        <motion.div
          key="modal-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 bg-black/30 z-50 backdrop-blur-[2px]"
          onClick={onClose}
        />
        <motion.div
          key="modal"
          initial={{ opacity: 0, scale: 0.96, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 8 }}
          transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
          className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md mx-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="how-to-use-title"
        >
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
            {/* header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 id="how-to-use-title" className="font-semibold text-gray-900 text-base">
                How it works
              </h2>
              <button
                onClick={onClose}
                className="p-1.5 rounded-md text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                aria-label="Close"
              >
                <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
                  <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z"/>
                </svg>
              </button>
            </div>

            {/* body */}
            <div className="px-6 py-5 space-y-4">
              <p className="text-sm text-gray-600 leading-relaxed">
                Paste any academic paragraph and Reference Finder will identify the claims that need citations, then search real academic databases to find relevant papers for each one.
              </p>

              <ol className="space-y-3">
                {[
                  { icon: "1", text: "Your paragraph is scanned for individual factual claims that would need academic backing." },
                  { icon: "2", text: "Each claim is searched against OpenAlex and Semantic Scholar in parallel — covering 250 million+ real academic works." },
                  { icon: "3", text: "Papers are rated for relevance and returned with APA citations you can copy directly." },
                ].map(({ icon, text }) => (
                  <li key={icon} className="flex items-start gap-3">
                    <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-gray-900 text-white text-xs font-medium shrink-0 mt-0.5">
                      {icon}
                    </span>
                    <p className="text-sm text-gray-600 leading-relaxed">{text}</p>
                  </li>
                ))}
              </ol>

              <div className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 space-y-2">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Relevance tiers</p>
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center gap-2.5">
                    <span className="inline-block w-2.5 h-2.5 rounded-full bg-green-400 shrink-0" />
                    <span className="text-xs text-gray-700"><strong>Direct</strong> — directly supports or proves the claim</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <span className="inline-block w-2.5 h-2.5 rounded-full bg-blue-400 shrink-0" />
                    <span className="text-xs text-gray-700"><strong>High</strong> — closely related and useful context</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <span className="inline-block w-2.5 h-2.5 rounded-full bg-amber-400 shrink-0" />
                    <span className="text-xs text-gray-700"><strong>Moderate</strong> — touches on the topic, not a direct match</span>
                  </div>
                </div>
              </div>

              <p className="text-xs text-gray-400">
                Papers are sourced from OpenAlex <span className="font-medium text-gray-500">OA</span> and Semantic Scholar <span className="font-medium text-purple-500">S2</span>, with verifiable DOIs linking to original publications.
              </p>
            </div>
          </div>
        </motion.div>
      </>
    </AnimatePresence>
  );
}

// ── user menu ─────────────────────────────────────────────────────────────────

function UserMenu({
  session,
  onOpenHistory,
}: {
  session: { user?: { name?: string | null; email?: string | null; image?: string | null } | null };
  onOpenHistory: () => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const handleKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKey);
    };
  }, []);

  const name = session.user?.name ?? "Account";
  const firstName = name.split(" ")[0];
  const image = session.user?.image;
  const initials = name.split(" ").map((n: string) => n[0]).slice(0, 2).join("").toUpperCase();

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-2.5 py-1.5 shadow-sm hover:border-gray-300 transition-colors"
        aria-haspopup="true"
        aria-expanded={open}
      >
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={image}
            alt={name}
            width={24}
            height={24}
            className="h-6 w-6 rounded-full object-cover"
          />
        ) : (
          <span className="h-6 w-6 rounded-full bg-gray-900 text-white text-xs font-medium flex items-center justify-center">
            {initials}
          </span>
        )}
        <span className="text-sm font-medium text-gray-700 max-w-[120px] truncate hidden sm:block">
          {firstName}
        </span>
        <svg className={`h-3.5 w-3.5 text-gray-400 transition-transform ${open ? "rotate-180" : ""}`} viewBox="0 0 20 20" fill="currentColor" aria-hidden>
          <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd"/>
        </svg>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -4 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="absolute right-0 mt-1.5 w-44 rounded-xl border border-gray-100 bg-white shadow-lg py-1 z-50"
            role="menu"
          >
            <div className="px-3 py-2 border-b border-gray-100">
              <p className="text-xs font-medium text-gray-900 truncate">{name}</p>
              {session.user?.email && (
                <p className="text-xs text-gray-400 truncate">{session.user.email}</p>
              )}
            </div>
            <button
              onClick={() => { setOpen(false); onOpenHistory(); }}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              role="menuitem"
            >
              <svg className="h-4 w-4 text-gray-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-13a.75.75 0 00-1.5 0v5c0 .414.336.75.75.75h4a.75.75 0 000-1.5h-3.25V5z" clipRule="evenodd"/>
              </svg>
              History
            </button>
            <button
              onClick={() => signOut()}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              role="menuitem"
            >
              <svg className="h-4 w-4 text-gray-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
                <path fillRule="evenodd" d="M3 4.25A2.25 2.25 0 015.25 2h5.5A2.25 2.25 0 0113 4.25v2a.75.75 0 01-1.5 0v-2a.75.75 0 00-.75-.75h-5.5a.75.75 0 00-.75.75v11.5c0 .414.336.75.75.75h5.5a.75.75 0 00.75-.75v-2a.75.75 0 011.5 0v2A2.25 2.25 0 0110.75 18h-5.5A2.25 2.25 0 013 15.75V4.25z" clipRule="evenodd"/>
                <path fillRule="evenodd" d="M19 10a.75.75 0 00-.75-.75H8.704l1.048-1.04a.75.75 0 10-1.06-1.062l-2.25 2.25a.75.75 0 000 1.06l2.25 2.25a.75.75 0 101.06-1.06L8.704 10.75H18.25A.75.75 0 0019 10z" clipRule="evenodd"/>
              </svg>
              Sign out
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── page ──────────────────────────────────────────────────────────────────────

interface HistoryEntry {
  id: number;
  paragraph: string;
  claims: { claim: string; searchQuery: string }[];
  results: ClaimResult[];
  createdAt: string;
}

export default function Home() {
  const { data: session, status: sessionStatus } = useSession();
  const [ready, setReady] = useState(false);
  const [stage, setStage] = useState<"auth" | "app">(session ? "app" : "auth");
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");
  const [results, setResults] = useState<ClaimResult[]>([]);
  const [currentClaims, setCurrentClaims] = useState<{ claim: string; searchQuery: string }[]>([]);
  const [error, setError] = useState("");

  // History sidebar
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Modals
  const [showHowTo, setShowHowTo] = useState(false);

  // Usage counter — default to full allowance so counter is visible immediately
  const [usage, setUsage] = useState({ count: 0, remaining: 3, limit: 3 });

  const fetchUsage = async () => {
    const { data } = await apiFetch<{ count: number; remaining: number; limit: number }>("/api/usage");
    if (data) setUsage(data);
  };

  useEffect(() => {
    const t = setTimeout(() => setReady(true), 1500);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (session) setStage("app");
  }, [session]);

  useEffect(() => {
    if (stage === "app") fetchUsage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage]);

  const fetchHistory = async () => {
    setHistoryLoading(true);
    const { data } = await apiFetch<{ searches: HistoryEntry[] }>("/api/history");
    if (data) setHistory(data.searches);
    setHistoryLoading(false);
  };

  const openHistory = () => {
    setShowHistory(true);
    fetchHistory();
  };

  const loadHistoryEntry = (entry: HistoryEntry) => {
    setText(entry.paragraph);
    setCurrentClaims(entry.claims);
    setResults(entry.results);
    setError("");
    setShowHistory(false);
  };

  const remaining = CHAR_LIMIT - text.length;
  const overLimit = remaining < 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (overLimit) return;

    setLoading(true);
    setError("");
    setResults([]);
    setCurrentClaims([]);

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
        // Refresh usage in case the limit was hit server-side
        await fetchUsage();
        return;
      }

      const { claims } = claimsData;

      if (!claims?.length) {
        setError("No factual claims were found in this paragraph. Try a paragraph with specific statistics or scientific statements.");
        return;
      }

      setCurrentClaims(claims);
      setStatus(`Found ${claims.length} claim${claims.length > 1 ? "s" : ""}. Searching for papers…`);

      const claimResults: ClaimResult[] = await Promise.all(
        claims.map(async (c): Promise<ClaimResult> => {
          const { data: searchData } = await apiFetch<{ papers: RatedPaper[] }>(
            `/api/search-papers?query=${encodeURIComponent(c.searchQuery)}`
          );
          if (!searchData?.papers?.length) return { claim: c.claim, papers: [] };

          const { data: rateData } = await apiFetch<{ papers: RatedPaper[] }>(
            "/api/rate-relevance",
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ claim: c.claim, papers: searchData.papers }),
            }
          );
          if (!rateData) return { claim: c.claim, papers: [] };

          return {
            claim: c.claim,
            papers: (rateData.papers ?? []).sort((a, b) => b.relevanceScore - a.relevanceScore),
          };
        })
      );

      setResults(claimResults);
      setStatus("");
      await fetchUsage();

      // Save to history if signed in
      if (session?.user?.email) {
        await apiFetch("/api/history", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ paragraph: text, claims, results: claimResults }),
        });
      }
    } catch {
      setError("An unexpected error occurred. Please try again.");
      setStatus("");
    } finally {
      setLoading(false);
    }
  };

  const hasActivity = loading || error !== "" || results.length > 0;
  const isCentered = !ready && !hasActivity;

  return (
    <>
      {/* ── how to use modal ── */}
      {showHowTo && <HowToUseModal onClose={() => setShowHowTo(false)} />}

      {/* ── history sidebar ── */}
      <AnimatePresence>
        {showHistory && (
          <>
            {/* backdrop */}
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/20 z-40"
              onClick={() => setShowHistory(false)}
            />
            {/* panel */}
            <motion.aside
              key="sidebar"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
              className="fixed top-0 right-0 h-full w-full max-w-sm bg-white shadow-2xl z-50 flex flex-col"
            >
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                <h2 className="font-semibold text-gray-900">Search History</h2>
                <button
                  onClick={() => setShowHistory(false)}
                  className="p-1.5 rounded-md text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                  aria-label="Close history"
                >
                  <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
                    <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z"/>
                  </svg>
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-4 py-4">
                {historyLoading ? (
                  <div className="flex items-center justify-center py-12 text-sm text-gray-400">
                    Loading…
                  </div>
                ) : history.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-12">
                    No searches yet. Run your first analysis to see it here.
                  </p>
                ) : (
                  <ul className="flex flex-col gap-2">
                    {history.map((entry) => (
                      <li key={entry.id}>
                        <button
                          onClick={() => loadHistoryEntry(entry)}
                          className="w-full text-left rounded-lg border border-gray-100 bg-gray-50 hover:bg-gray-100 hover:border-gray-200 px-4 py-3 transition-colors"
                        >
                          <p className="text-sm text-gray-800 line-clamp-2 leading-relaxed">
                            {entry.paragraph}
                          </p>
                          <div className="mt-1.5 flex items-center gap-2 text-xs text-gray-400">
                            <span>{entry.claims.length} claim{entry.claims.length !== 1 ? "s" : ""}</span>
                            <span>·</span>
                            <span>{new Date(entry.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}</span>
                          </div>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* ── main page ── */}
      <motion.div
        layout
        className={`min-h-screen bg-gray-50 px-4 sm:px-6 ${isCentered ? "flex items-center justify-center py-12" : "py-12"}`}
      >
        {/* user menu — fixed top-right, only for signed-in users in app stage */}
        <AnimatePresence>
          {session && stage === "app" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed top-4 right-4 z-30"
            >
              <UserMenu session={session} onOpenHistory={openHistory} />
            </motion.div>
          )}
        </AnimatePresence>

        <main className="mx-auto w-full max-w-2xl">
          <motion.div
            layout
            className={`${hasActivity ? "mb-6 text-left" : ready ? "mb-8 text-center" : "mb-0 text-center"}`}
          >
            <motion.h1
              layout
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: [0.25, 0.1, 0.25, 1] }}
              className="font-[family-name:var(--font-playfair)] text-4xl font-extrabold text-gray-900 sm:text-5xl leading-tight tracking-tight"
            >
              Reference Finder
            </motion.h1>

            <AnimatePresence>
              {ready && stage === "app" && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                  className="mt-2 text-sm text-gray-500"
                >
                  {session?.user?.name
                    ? `Welcome back, ${session.user.name.split(" ")[0]}. Paste a paragraph to find citations.`
                    : "Paste a paragraph to find academic citations for each factual claim."}
                </motion.p>
              )}
              {ready && stage === "auth" && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                  className="mt-2 text-sm text-gray-500"
                >
                  Find academic citations for every factual claim in your writing.
                </motion.p>
              )}
            </AnimatePresence>
          </motion.div>

          <AnimatePresence mode="wait">

            {/* ── auth stage ── */}
            {ready && stage === "auth" && (
              <motion.div
                key="auth"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.6, delay: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
                className="flex flex-col items-center gap-3 mt-2"
              >
                <button
                  onClick={() => signIn("google")}
                  disabled={sessionStatus === "loading"}
                  className="flex items-center justify-center gap-3 w-full max-w-xs rounded-xl bg-gray-900 px-6 py-3 text-sm font-medium text-white shadow-sm hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" aria-hidden>
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Sign in with Google
                </button>

                <div className="flex items-center gap-3 w-full max-w-xs">
                  <div className="flex-1 h-px bg-gray-200" />
                  <span className="text-xs text-gray-400">or</span>
                  <div className="flex-1 h-px bg-gray-200" />
                </div>

                <button
                  onClick={() => setStage("app")}
                  className="w-full max-w-xs rounded-xl border border-gray-200 bg-white px-6 py-3 text-sm font-medium text-gray-600 hover:border-gray-300 hover:text-gray-900 transition-colors"
                >
                  Continue as Guest
                </button>

                <button
                  type="button"
                  onClick={() => setShowHowTo(true)}
                  className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 transition-colors mt-1"
                >
                  <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM8.94 6.94a.75.75 0 11-1.061-1.061 3 3 0 112.871 5.026v.345a.75.75 0 01-1.5 0v-.5c0-.72.57-1.172 1.081-1.287A1.5 1.5 0 108.94 6.94zM10 15a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd"/>
                  </svg>
                  How to use
                </button>
              </motion.div>
            )}

            {/* ── app stage ── */}
            {ready && stage === "app" && (
              <motion.div
                key="app"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.15, ease: [0.25, 0.1, 0.25, 1] }}
              >
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
                    <span
                      className={`absolute bottom-2 right-3 text-xs tabular-nums ${
                        overLimit ? "text-red-500 font-medium" : remaining <= 200 ? "text-yellow-600" : "text-gray-400"
                      }`}
                    >
                      {remaining < 0 ? `${Math.abs(remaining)} over limit` : `${remaining} remaining`}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-3">
                    <button
                      type="button"
                      onClick={() => setText(EXAMPLE_TEXT)}
                      disabled={loading}
                      className="text-sm text-gray-500 underline underline-offset-2 hover:text-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      Try an example
                    </button>
                    <div className="flex items-center gap-3">
                      <span className={`text-xs font-medium tabular-nums px-2 py-1 rounded-md ${
                        usage.remaining === 0
                          ? "bg-red-100 text-red-600"
                          : usage.remaining === 1
                          ? "bg-amber-100 text-amber-700"
                          : "bg-gray-100 text-gray-600"
                      }`}>
                        {usage.remaining}/{usage.limit} searches left today
                      </span>
                      <button
                        type="submit"
                        disabled={!text.trim() || overLimit || loading || usage.remaining === 0}
                        className="px-5 py-2 rounded-lg bg-gray-900 text-white text-sm font-medium hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                      >
                        {loading ? "Analyzing…" : "Submit"}
                      </button>
                    </div>
                  </div>
                </form>

                {usage?.remaining === 0 && !loading && (
                  <div className="mt-3 flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
                    <svg className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
                      <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd"/>
                    </svg>
                    <p className="text-sm text-amber-800">
                      You&apos;ve reached your daily limit of {usage.limit} free searches. Upgrade to Pro for unlimited access.
                    </p>
                  </div>
                )}

                {loading && (
                  <div className="mt-8 flex items-center gap-3 text-sm text-gray-500">
                    <svg className="animate-spin h-4 w-4 shrink-0 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden>
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                    <span>{status}</span>
                  </div>
                )}

                {error && <ErrorBanner message={error} />}

                {results.length > 0 && (
                  <div className="mt-8 flex flex-col gap-6">
                    <h2 className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                      {results.length} claim{results.length > 1 ? "s" : ""} found
                    </h2>
                    {results.map((result, i) => (
                      <ClaimCard key={i} result={result} index={i} />
                    ))}
                  </div>
                )}
              </motion.div>
            )}

          </AnimatePresence>
        </main>
      </motion.div>
    </>
  );
}
