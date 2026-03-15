"use client";

import { useEffect, useRef, useState } from "react";
import { signIn, signOut, useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import type { RatedPaper } from "@/lib/rate-relevance";

const FREE_CHAR_LIMIT = 1000;
const PRO_CHAR_LIMIT = 10000;

const EXAMPLE_TEXTS = [
  // Climate change
  "Global average temperatures have risen by approximately 1.1°C above pre-industrial levels, with the past decade being the warmest on record. Arctic sea ice is declining at roughly 13% per decade, while permafrost thaws release stored methane that further amplifies warming. Sea levels are currently rising at about 3.3 millimeters per year, threatening to displace an estimated 280 million people in coastal regions by 2100. Extreme weather events including hurricanes, wildfires, and heat waves have increased in both frequency and intensity due to anthropogenic greenhouse gas emissions.",

  // Sleep and brain health
  "Adults who regularly sleep fewer than six hours per night face a 20% higher risk of cardiovascular disease compared to those sleeping seven to nine hours. The brain's glymphatic system operates primarily during sleep to clear toxic proteins such as beta-amyloid and tau, which are closely associated with the development of Alzheimer's disease. Chronic sleep deprivation impairs prefrontal cortex function, leading to reduced impulse control, poor decision-making, and heightened emotional reactivity. Adolescents who sleep less than eight hours per night consistently demonstrate lower academic performance and higher rates of anxiety and depression.",

  // Artificial intelligence and machine learning
  "Large language models require enormous computational resources to train, with some frontier models generating several hundred tons of carbon dioxide during a single training run. AI-assisted diagnostic systems have achieved over 94% accuracy in detecting early-stage lung cancer from CT scans, surpassing the average 65% accuracy rate of experienced radiologists in controlled trials. The global artificial intelligence market is projected to exceed $1.8 trillion by 2030, driven by machine learning applications in healthcare, finance, and autonomous systems. Studies have demonstrated that algorithmic hiring tools can perpetuate racial and gender biases embedded in historical training data.",

  // Economic inequality
  "The wealthiest 1% of the global population now owns more than 43% of total global wealth, a concentration that has accelerated markedly since the 2008 financial crisis. In the United States, the average income of the top 10% of earners is roughly nine times that of the bottom 90%, contributing to record levels of household debt among lower-income groups. Intergenerational income mobility has declined sharply in many developed economies, with children born into low-income families having less than a 10% chance of reaching the top income quintile as adults. High income inequality is consistently linked to worse outcomes in public health, educational attainment, and democratic participation.",

  // Antibiotic resistance
  "Antimicrobial resistance is estimated to cause approximately 1.27 million deaths annually worldwide, and the WHO projects this figure could rise to 10 million deaths per year by 2050 if current trends continue. The overuse and misuse of antibiotics in both human medicine and agricultural livestock production are the primary drivers of resistance, with over 70% of medically important antibiotics sold globally administered to food animals. Methicillin-resistant Staphylococcus aureus now accounts for more than 50% of staphylococcal infections in parts of Southeast Asia. The development pipeline for new antibiotics has nearly stalled, with fewer than 50 novel candidates in clinical trials compared to over 500 new cancer drugs.",

  // Ocean acidification
  "Ocean pH has decreased by approximately 0.1 units since the Industrial Revolution, representing a 26% increase in acidity, as the oceans absorb roughly 25% of all anthropogenic carbon dioxide emissions each year. Coral reef bleaching events have increased in frequency from once every 25 to 30 years in the 1980s to once every five to six years today, threatening ecosystems that support approximately 25% of all marine species. Ocean acidification impairs the ability of shell-forming organisms such as oysters, mussels, and pteropods to build and maintain their calcium carbonate structures. An estimated 1 billion people rely on ocean fisheries as their primary source of dietary protein, making the degradation of marine ecosystems a critical global food security issue.",

  // Childhood education
  "Children who attend high-quality early childhood education programs are 25% more likely to graduate from high school and 30% more likely to attend college compared to those who do not. The achievement gap between students from low-income and high-income families begins before kindergarten, with affluent children exposed to approximately 30 million more words by age three than children raised in poverty. Class sizes above 25 students are associated with measurably reduced academic outcomes, particularly for students from disadvantaged backgrounds, according to longitudinal studies spanning multiple countries. Teacher quality is the single most important school-based factor influencing student achievement, with highly effective teachers producing learning gains equivalent to several additional months per school year.",

  // Renewable energy
  "The cost of utility-scale solar photovoltaic electricity has fallen by more than 89% over the past decade, making it the cheapest source of new electricity generation across most of the world. Wind energy now supplies over 20% of electricity generation in Europe, and Denmark regularly generates more than 100% of its national electricity demand from wind on high-wind days. A global transition to 100% renewable energy by 2050 could prevent approximately 3.5 million premature deaths per year currently caused by air pollution from fossil fuel combustion. Investments in renewable energy infrastructure create roughly three times as many jobs per unit of energy produced compared to equivalent investments in fossil fuels.",

  // Mental health and social media
  "Rates of depression and anxiety among adolescents in the United States have increased by more than 50% since 2010, a period closely corresponding with the mass adoption of smartphones and social media platforms. Experimental studies have found that limiting social media use to 30 minutes per day produces significant reductions in loneliness and depression symptoms among young adults within just three weeks. Social comparison on image-focused platforms is strongly associated with negative body image and lower self-esteem, particularly among girls aged 11 to 17. The average teenager now spends over seven hours per day on screens, with social media algorithms specifically designed to maximize engagement by triggering emotional responses.",

  // Urbanization
  "More than 55% of the global population currently lives in urban areas, and the United Nations projects this proportion will rise to 68% by 2050, adding approximately 2.5 billion people to cities. Urban heat islands cause city centers to be 1 to 3 degrees Celsius warmer than surrounding rural areas, increasing cooling energy demand and contributing to higher mortality rates during heat waves. Access to urban green spaces is associated with lower rates of obesity, cardiovascular disease, and mental illness, yet low-income urban neighborhoods contain 34% less green space per resident than wealthy neighborhoods in the same cities. Over one billion people currently live in informal urban settlements lacking adequate access to clean water, sanitation, and secure housing.",
];

function pickExample(current: string): string {
  const pool = EXAMPLE_TEXTS.filter((e) => e !== current);
  const candidates = pool.length > 0 ? pool : EXAMPLE_TEXTS;
  return candidates[Math.floor(Math.random() * candidates.length)];
};

interface ClaimResult {
  claim: string;
  papers: RatedPaper[];
}

interface HistoryEntry {
  id: string;
  paragraph: string;
  claims: { claim: string; searchQuery: string }[];
  results: ClaimResult[];
  createdAt: string;
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
    cardClass: "bg-green-500/[0.07] light:bg-green-500/[0.08] border-green-500/25 light:border-green-500/35",
    badgeClass: "bg-green-500/15 text-green-400 light:text-green-700",
  };
  if (score >= 4) return {
    label: "High",
    cardClass: "bg-blue-500/[0.07] light:bg-blue-500/[0.07] border-blue-500/25 light:border-blue-500/30",
    badgeClass: "bg-blue-500/15 text-blue-400 light:text-blue-700",
  };
  return {
    label: "Moderate",
    cardClass: "bg-amber-500/[0.06] light:bg-amber-500/[0.07] border-amber-500/20 light:border-amber-500/30",
    badgeClass: "bg-amber-500/15 text-amber-400 light:text-amber-700",
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
      className="text-xs text-slate-500 light:text-slate-500 hover:text-slate-300 light:hover:text-slate-700 transition-colors"
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
      className="mt-6 flex items-start gap-3 rounded-lg border border-red-500/25 bg-red-500/10 px-4 py-3"
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
      <p className="text-sm text-red-400">{message}</p>
    </div>
  );
}

// ── stat badge ────────────────────────────────────────────────────────────────

function StatBadge({
  icon,
  text,
  colorClass,
  glowing = false,
}: {
  icon: React.ReactNode;
  text: string;
  colorClass: string;
  glowing?: boolean;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-medium tracking-wide ${colorClass}`}
      style={glowing ? { boxShadow: "0 0 7px 1px rgba(234,88,12,0.35)" } : undefined}
    >
      {icon}
      {text}
    </span>
  );
}

// ── paper card ────────────────────────────────────────────────────────────────

function PaperCard({ paper, index = 0 }: { paper: RatedPaper; index?: number }) {
  const authorLine =
    paper.authors.length === 0
      ? null
      : paper.authors.length <= 3
        ? paper.authors.join(", ")
        : `${paper.authors[0]}, et al.`;

  const authorYearMeta = [authorLine, paper.year].filter(Boolean).join(" · ");

  const { cardClass } = getTier(paper.relevanceScore);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.07, ease: [0.25, 0.1, 0.25, 1] }}
      className={`paper-card rounded-md border p-4 ${cardClass}`}
    >
      {/* title row */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          {paper.doi ? (
            <a
              href={paper.doi}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-medium text-slate-100 light:text-slate-900 hover:text-blue-400 light:hover:text-blue-600 transition-colors leading-snug break-words"
            >
              {paper.title ?? "Untitled"}
            </a>
          ) : (
            <span className="text-sm font-medium text-slate-100 light:text-slate-900 leading-snug break-words">
              {paper.title ?? "Untitled"}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {paper.source && (
            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
              paper.source === "Semantic Scholar"
                ? "bg-purple-500/15 text-purple-400 light:text-purple-700"
                : "bg-white/10 light:bg-black/[0.07] text-slate-300 light:text-slate-600"
            }`}>
              {paper.source === "Semantic Scholar" ? "S2" : "OA"}
            </span>
          )}
          <ScoreBadge score={paper.relevanceScore} />
        </div>
      </div>

      {/* authors · year */}
      {authorYearMeta && (
        <p className="mt-1.5 text-xs text-slate-400 light:text-slate-600 break-words">{authorYearMeta}</p>
      )}

      {/* journal */}
      {paper.journal && (
        <p className="mt-0.5 text-xs text-slate-500 light:text-slate-600 italic truncate" title={paper.journal}>
          {paper.journal}
        </p>
      )}

      {/* stat badges row */}
      <div className="mt-2 flex flex-wrap gap-1.5">
        {/* 🔥 orange flame — total citation count */}
        {paper.citationCount != null && paper.citationCount > 0 && (
          <StatBadge
            colorClass={
              paper.citationCount >= 500
                ? "bg-orange-500/15 border-orange-500/40 text-orange-400 light:text-orange-600"
                : "bg-orange-500/10 border-orange-500/20 text-orange-500 light:text-orange-600"
            }
            glowing={paper.citationCount >= 500}
            text={`Cited ${paper.citationCount.toLocaleString()}x`}
            icon={
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.038 7.048 8.287 8.287 0 009 9.6a8.983 8.983 0 013.361-6.867 8.21 8.21 0 003 2.48z"/>
                <path d="M12 18a3.75 3.75 0 00.495-7.467 5.99 5.99 0 00-1.925 3.546 5.974 5.974 0 01-2.133-1A3.75 3.75 0 0012 18z"/>
              </svg>
            }
          />
        )}

        {/* ★ purple star — influential citation count (Semantic Scholar only) */}
        {paper.source === "Semantic Scholar" &&
          paper.influentialCitationCount != null &&
          paper.influentialCitationCount > 0 && (
          <StatBadge
            colorClass="bg-violet-500/10 border-violet-500/20 text-violet-400 light:text-violet-700"
            text={`Influential: ${paper.influentialCitationCount}`}
            icon={
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.562.562 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"/>
              </svg>
            }
          />
        )}

        {/* 📊 blue bars — journal h-index */}
        {paper.journalHIndex != null && (
          <StatBadge
            colorClass="bg-sky-500/10 border-sky-500/20 text-sky-400 light:text-sky-700"
            text={`h-index: ${paper.journalHIndex}`}
            icon={
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75z"/>
                <path d="M9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625z"/>
                <path d="M16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z"/>
              </svg>
            }
          />
        )}

        {/* 📖 green book — field / subject area */}
        {paper.subjectArea && (
          <StatBadge
            colorClass="bg-emerald-500/10 border-emerald-500/20 text-emerald-400 light:text-emerald-700"
            text={paper.subjectArea}
            icon={
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25"/>
              </svg>
            }
          />
        )}
      </div>

      {/* relevance explanation */}
      <p className="mt-2 text-xs text-slate-500 light:text-slate-600 italic leading-relaxed">
        {paper.relevanceExplanation}
      </p>

      <div className="mt-2">
        <CopyButton text={formatAPA(paper)} />
      </div>
    </motion.div>
  );
}

// ── claim card ────────────────────────────────────────────────────────────────

function ClaimCard({ result, index }: { result: ClaimResult; index: number }) {
  const topScore = result.papers.length > 0
    ? Math.max(...result.papers.map((p) => p.relevanceScore))
    : 0;
  const accentClass =
    topScore >= 5 ? "border-l-green-500/60" :
    topScore >= 4 ? "border-l-blue-500/55" :
    result.papers.length > 0 ? "border-l-amber-500/50" :
    "border-l-white/15";

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: index * 0.1, ease: [0.25, 0.1, 0.25, 1] }}
      className={`claim-card rounded-xl border border-white/10 light:border-black/[0.09] border-l-2 ${accentClass} bg-white/[0.03] light:bg-black/[0.025] backdrop-blur-sm overflow-hidden`}
    >
      {/* claim header */}
      <div className="bg-white/[0.04] light:bg-black/[0.03] border-b border-white/10 light:border-black/[0.09] px-5 py-4">
        <div className="flex items-center gap-2 mb-2">
          <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-white/15 light:bg-black/[0.1] text-white light:text-slate-800 text-xs font-medium shrink-0">
            {index + 1}
          </span>
          <span className="text-xs font-medium text-slate-500 light:text-slate-600 uppercase tracking-wide">Claim</span>
        </div>
        <p className="text-sm font-medium text-slate-100 light:text-slate-900 leading-relaxed">
          &ldquo;{result.claim}&rdquo;
        </p>
      </div>

      {/* papers */}
      <div className="px-5 py-4">
        {result.papers.length === 0 ? (
          <p className="text-xs text-slate-500 light:text-slate-600">
            No relevant papers found for this claim.
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            {result.papers.map((paper, i) => (
              <PaperCard key={paper.doi ?? i} paper={paper} index={i} />
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ── theme toggle ─────────────────────────────────────────────────────────────

function ThemeToggle({ theme, onToggle }: { theme: "dark" | "light"; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      className="flex items-center justify-center w-8 h-8 rounded-xl border border-white/15 light:border-black/[0.1] bg-white/10 light:bg-black/[0.06] hover:bg-white/15 light:hover:bg-black/[0.1] backdrop-blur-sm transition-colors"
      aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
      title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
    >
      {theme === "dark" ? (
        <svg className="h-3.5 w-3.5 text-slate-300" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden>
          <circle cx="12" cy="12" r="4"/>
          <path strokeLinecap="round" d="M12 2v2M12 20v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M2 12h2M20 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
        </svg>
      ) : (
        <svg className="h-3.5 w-3.5 text-slate-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/>
        </svg>
      )}
    </button>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <motion.div
          key="modal"
          initial={{ opacity: 0, scale: 0.96, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 8 }}
          transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
          className="pointer-events-auto w-full max-w-md"
          role="dialog"
          aria-modal="true"
          aria-labelledby="how-to-use-title"
        >
          <div className="glass-panel rounded-2xl shadow-2xl border overflow-hidden flex flex-col max-h-[calc(100vh-2rem)]">
            {/* header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 light:border-black/[0.09] shrink-0">
              <h2 id="how-to-use-title" className="font-semibold text-slate-100 light:text-slate-900 text-base">
                How it works
              </h2>
              <button
                onClick={onClose}
                className="p-1.5 rounded-md text-slate-500 light:text-slate-400 hover:text-slate-200 light:hover:text-slate-700 hover:bg-white/10 light:hover:bg-black/[0.06] transition-colors"
                aria-label="Close"
              >
                <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
                  <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z"/>
                </svg>
              </button>
            </div>

            {/* body */}
            <div className="px-6 py-5 space-y-5 overflow-y-auto">
              <p className="text-sm text-slate-400 light:text-slate-600 leading-relaxed">
                Paste any academic paragraph and Reference Finder automatically finds citations for it — no searching required. It identifies each factual claim, queries OpenAlex and Semantic Scholar in parallel, and returns ranked papers with one-click APA citations.
              </p>

              {/* steps */}
              <div>
                <p className="text-xs font-medium text-slate-500 light:text-slate-600 uppercase tracking-wide mb-2.5">How it works</p>
                <ol className="space-y-3">
                  {[
                    { icon: "1", text: "Paste any paragraph containing factual claims — research writing, essay drafts, literature reviews, or anything that needs citations." },
                    { icon: "2", text: "Claude scans your text and extracts each individual claim that would benefit from academic backing." },
                    { icon: "3", text: "Each claim is searched against OpenAlex and Semantic Scholar in parallel, covering 250 million+ real academic works across all fields." },
                    { icon: "4", text: "Results are rated for relevance and ranked. Copy any paper's APA citation with one click." },
                  ].map(({ icon, text }) => (
                    <li key={icon} className="flex items-start gap-3">
                      <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-white/15 light:bg-black/[0.1] text-slate-100 light:text-slate-800 text-xs font-medium shrink-0 mt-0.5">
                        {icon}
                      </span>
                      <p className="text-sm text-slate-400 light:text-slate-600 leading-relaxed">{text}</p>
                    </li>
                  ))}
                </ol>
              </div>

              {/* paper badges */}
              <div className="rounded-xl border border-white/10 light:border-black/[0.09] bg-white/[0.04] light:bg-black/[0.03] px-4 py-3 space-y-2">
                <p className="text-xs font-medium text-slate-500 light:text-slate-600 uppercase tracking-wide">Paper stat badges</p>
                <p className="text-xs text-slate-500 light:text-slate-600 leading-relaxed">
                  Each paper card shows stat badges that help you judge paper quality at a glance. Higher numbers on all of these mean a stronger, more reputable paper.
                </p>
                <div className="flex flex-col gap-2">
                  <div className="flex items-start gap-2.5">
                    <span className="text-orange-400 text-sm shrink-0 leading-none mt-0.5">🔥</span>
                    <span className="text-xs text-slate-300 light:text-slate-700"><strong className="text-orange-400 light:text-orange-600">Flame — total citations.</strong> How many times this paper has been cited. Glows orange when ≥ 500, signalling a highly cited work.</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <span className="text-violet-400 text-sm shrink-0 leading-none mt-0.5">★</span>
                    <span className="text-xs text-slate-300 light:text-slate-700"><strong className="text-violet-400 light:text-violet-700">Star — influential citations.</strong> Citations that actually mattered — papers that meaningfully built on this work, as identified by Semantic Scholar.</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <span className="text-sky-400 text-sm shrink-0 leading-none mt-0.5">▦</span>
                    <span className="text-xs text-slate-300 light:text-slate-700"><strong className="text-sky-400 light:text-sky-700">Bar chart — journal h-index.</strong> Measures journal prestige: a journal with h-index 50 has published at least 50 papers each cited at least 50 times.</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <span className="text-emerald-400 text-sm shrink-0 leading-none mt-0.5">📖</span>
                    <span className="text-xs text-slate-300 light:text-slate-700"><strong className="text-emerald-400 light:text-emerald-700">Book — research field.</strong> The subject area or discipline the paper belongs to. Only shown when available.</span>
                  </div>
                </div>
              </div>

              {/* relevance tiers */}
              <div className="rounded-xl border border-white/10 light:border-black/[0.09] bg-white/[0.04] light:bg-black/[0.03] px-4 py-3 space-y-2">
                <p className="text-xs font-medium text-slate-500 light:text-slate-600 uppercase tracking-wide">Relevance tiers</p>
                <p className="text-xs text-slate-500 light:text-slate-600 leading-relaxed">
                  Papers are ranked by relevance with three color-coded tiers.
                </p>
                <div className="flex flex-col gap-2">
                  <div className="flex items-start gap-2.5">
                    <span className="inline-block w-2.5 h-2.5 rounded-full bg-green-400 shrink-0 mt-0.5" />
                    <span className="text-xs text-slate-300 light:text-slate-700"><strong className="text-green-400 light:text-green-700">Direct</strong> — the paper directly supports the claim.</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <span className="inline-block w-2.5 h-2.5 rounded-full bg-blue-400 shrink-0 mt-0.5" />
                    <span className="text-xs text-slate-300 light:text-slate-700"><strong className="text-blue-400 light:text-blue-700">High</strong> — closely related and useful context for the claim.</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <span className="inline-block w-2.5 h-2.5 rounded-full bg-amber-400 shrink-0 mt-0.5" />
                    <span className="text-xs text-slate-300 light:text-slate-700"><strong className="text-amber-400 light:text-amber-700">Moderate</strong> — touches on the topic but is not a direct match.</span>
                  </div>
                </div>
              </div>

              {/* good to know */}
              <div className="space-y-2.5">
                <p className="text-xs font-medium text-slate-500 light:text-slate-600 uppercase tracking-wide">Good to know</p>
                <div className="flex items-start gap-2.5">
                  <span className="text-base shrink-0 leading-none">🌐</span>
                  <p className="text-xs text-slate-400 light:text-slate-700 leading-relaxed">
                    <strong className="text-slate-200 light:text-slate-900">Any language.</strong> Paste paragraphs in any language — the app will find English-language papers for your claims.
                  </p>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="text-base shrink-0 leading-none">🔢</span>
                  <p className="text-xs text-slate-400 light:text-slate-700 leading-relaxed">
                    <strong className="text-slate-200 light:text-slate-900">10 free searches per day.</strong> The counter resets at midnight UTC and is tracked by a secure signed cookie.
                  </p>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="text-base shrink-0 leading-none">👤</span>
                  <p className="text-xs text-slate-400 light:text-slate-700 leading-relaxed">
                    <strong className="text-slate-200 light:text-slate-900">Sign in or continue as guest.</strong> Sign in with Google to save your search history across sessions, or use the app as a guest — history is still saved in your browser.
                  </p>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="text-base shrink-0 leading-none">💡</span>
                  <p className="text-xs text-slate-400 light:text-slate-700 leading-relaxed">
                    <strong className="text-slate-200 light:text-slate-900">Try an example.</strong> Not sure where to start? Click the button below the text box to load a sample paragraph. Click again for a different field.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
        </div>
      </>
    </AnimatePresence>
  );
}

// ── plan picker modal ────────────────────────────────────────────────────────

function PlanModal({
  onClose,
  onSelectPlan,
  upgrading,
}: {
  onClose: () => void;
  onSelectPlan: (plan: "monthly" | "yearly") => void;
  upgrading: boolean;
}) {
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);

  return (
    <AnimatePresence>
      <>
        <motion.div
          key="plan-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 bg-black/30 z-50 backdrop-blur-[2px]"
          onClick={onClose}
        />
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <motion.div
          key="plan-modal"
          initial={{ opacity: 0, scale: 0.96, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 8 }}
          transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
          className="pointer-events-auto w-full max-w-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="plan-modal-title"
        >
          <div className="glass-panel rounded-2xl shadow-2xl border overflow-hidden flex flex-col max-h-[calc(100vh-2rem)]">
            {/* header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 light:border-black/[0.09] shrink-0">
              <div>
                <h2 id="plan-modal-title" className="font-semibold text-slate-100 light:text-slate-900 text-base">
                  Upgrade to Pro
                </h2>
                <p className="text-xs text-slate-500 light:text-slate-600 mt-0.5">Unlimited searches, forever.</p>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-md text-slate-500 light:text-slate-400 hover:text-slate-200 light:hover:text-slate-700 hover:bg-white/10 light:hover:bg-black/[0.06] transition-colors"
                aria-label="Close"
              >
                <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
                  <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z"/>
                </svg>
              </button>
            </div>

            {/* plan cards */}
            <div className="px-6 py-5 flex flex-col gap-3 overflow-y-auto">
              {/* Monthly */}
              <button
                onClick={() => onSelectPlan("monthly")}
                disabled={upgrading}
                className="w-full text-left rounded-xl border-2 border-white/15 light:border-black/[0.12] px-4 py-4 hover:border-white/30 light:hover:border-black/[0.22] hover:bg-white/[0.05] light:hover:bg-black/[0.04] transition-colors disabled:opacity-50 disabled:cursor-not-allowed group"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-100 light:text-slate-900">Monthly</p>
                    <p className="text-xs text-slate-500 light:text-slate-600 mt-0.5">Billed every month</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-slate-100 light:text-slate-900">¥299</p>
                    <p className="text-xs text-slate-500 light:text-slate-600">/ month</p>
                  </div>
                </div>
              </button>

              {/* Yearly */}
              <button
                onClick={() => onSelectPlan("yearly")}
                disabled={upgrading}
                className="w-full text-left rounded-xl border-2 border-amber-500/50 bg-amber-500/10 px-4 py-4 hover:bg-amber-500/15 hover:border-amber-500/70 transition-colors disabled:opacity-50 disabled:cursor-not-allowed relative"
              >
                <span className="absolute -top-2.5 right-3 inline-flex items-center rounded-full bg-amber-500 px-2.5 py-0.5 text-[10px] font-bold text-white uppercase tracking-wide">
                  Save 2 months
                </span>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-amber-300 light:text-amber-700">Yearly</p>
                    <p className="text-xs text-amber-500 light:text-amber-600 mt-0.5">Billed once per year</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-amber-300 light:text-amber-700">¥2,990</p>
                    <p className="text-xs text-amber-500 light:text-amber-600">/ year</p>
                  </div>
                </div>
              </button>

              {upgrading && (
                <p className="text-center text-xs text-slate-500 pt-1">Redirecting to checkout…</p>
              )}
            </div>
          </div>
        </motion.div>
        </div>
      </>
    </AnimatePresence>
  );
}

// ── user menu ─────────────────────────────────────────────────────────────────

function UserMenu({
  session,
  onOpenHistory,
  isPro = false,
}: {
  session: { user?: { name?: string | null; email?: string | null; image?: string | null } | null };
  onOpenHistory: () => void;
  isPro?: boolean;
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
        className="flex items-center gap-2 rounded-xl border border-white/15 light:border-black/[0.1] bg-white/10 light:bg-black/[0.06] backdrop-blur-sm px-2.5 py-1.5 hover:bg-white/15 light:hover:bg-black/[0.1] transition-colors"
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
          <span className="h-6 w-6 rounded-full bg-white/15 light:bg-black/[0.1] text-white light:text-slate-800 text-xs font-medium flex items-center justify-center">
            {initials}
          </span>
        )}
        <span className="text-sm font-medium text-slate-200 light:text-slate-800 max-w-[120px] truncate hidden sm:block">
          {firstName}
        </span>
        {isPro && (
          <span className="hidden sm:inline-flex items-center gap-0.5 rounded-md bg-amber-500/15 light:bg-amber-600/[0.12] px-1.5 py-0.5 text-[10px] font-semibold text-amber-400 light:text-amber-800 leading-none">
            <svg className="h-2.5 w-2.5" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
            </svg>
            Pro
          </span>
        )}
        <svg className={`h-3.5 w-3.5 text-slate-400 light:text-slate-500 transition-transform ${open ? "rotate-180" : ""}`} viewBox="0 0 20 20" fill="currentColor" aria-hidden>
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
            className="absolute right-0 mt-1.5 w-44 rounded-xl border border-white/10 glass-panel shadow-xl py-1 z-50"
            role="menu"
          >
            <div className="px-3 py-2 border-b border-white/10">
              <p className="text-xs font-medium text-slate-200 light:text-slate-900 truncate">{name}</p>
              {session.user?.email && (
                <p className="text-xs text-slate-500 light:text-slate-600 truncate">{session.user.email}</p>
              )}
            </div>
            <button
              onClick={() => { setOpen(false); onOpenHistory(); }}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-slate-300 light:text-slate-700 hover:bg-white/[0.06] light:hover:bg-black/[0.05] transition-colors"
              role="menuitem"
            >
              <svg className="h-4 w-4 text-slate-500 light:text-slate-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-13a.75.75 0 00-1.5 0v5c0 .414.336.75.75.75h4a.75.75 0 000-1.5h-3.25V5z" clipRule="evenodd"/>
              </svg>
              History
            </button>
            <button
              onClick={() => signOut()}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-slate-300 light:text-slate-700 hover:bg-white/[0.06] light:hover:bg-black/[0.05] transition-colors"
              role="menuitem"
            >
              <svg className="h-4 w-4 text-slate-500 light:text-slate-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
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

// ── localStorage history ──────────────────────────────────────────────────────

const LS_HISTORY_KEY = "rf_history";
const MAX_HISTORY_ENTRIES = 50;

function lsGetHistory(): HistoryEntry[] {
  try {
    return JSON.parse(
      localStorage.getItem(LS_HISTORY_KEY) ?? "[]"
    ) as HistoryEntry[];
  } catch {
    return [];
  }
}

function lsAddHistory(
  entry: Omit<HistoryEntry, "id" | "createdAt">
): void {
  try {
    const next: HistoryEntry = {
      ...entry,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
    };
    localStorage.setItem(
      LS_HISTORY_KEY,
      JSON.stringify([next, ...lsGetHistory()].slice(0, MAX_HISTORY_ENTRIES))
    );
  } catch {
    // localStorage unavailable (e.g. private browsing with storage blocked)
  }
}

function lsClearHistory(): void {
  try {
    localStorage.removeItem(LS_HISTORY_KEY);
  } catch {
    // ignore
  }
}

// ── page ──────────────────────────────────────────────────────────────────────

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

  // Modals
  const [showHowTo, setShowHowTo] = useState(false);

  // Usage counter — default to full allowance so counter is visible immediately
  const [usage, setUsage] = useState({ count: 0, remaining: 3, limit: 3 });
  const [isPro, setIsPro] = useState(false);
  const [proSuccess, setProSuccess] = useState(false);
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [upgrading, setUpgrading] = useState(false);
  const [showUpgradeHint, setShowUpgradeHint] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadBtnRef = useRef<HTMLButtonElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  // ── Theme ──────────────────────────────────────────────────────────────────
  const [theme, setTheme] = useState<"dark" | "light">("light");

  // Load saved theme on mount
  useEffect(() => {
    const saved = localStorage.getItem("rf_theme") as "dark" | "light" | null;
    if (saved === "light" || saved === "dark") setTheme(saved);
  }, []);

  // Apply theme class to <html> and persist
  useEffect(() => {
    localStorage.setItem("rf_theme", theme);
    if (theme === "light") {
      document.documentElement.classList.add("light");
    } else {
      document.documentElement.classList.remove("light");
    }
  }, [theme]);

  const toggleTheme = () => setTheme((t) => (t === "dark" ? "light" : "dark"));

  const fetchUsage = async () => {
    const { data } = await apiFetch<{ count: number; remaining: number; limit: number }>("/api/usage");
    if (data) setUsage(data);
  };

  const upgradeToPro = async (plan: "monthly" | "yearly") => {
    setUpgrading(true);
    const { data, error: err } = await apiFetch<{ url: string }>("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan }),
    });
    if (data?.url) {
      window.location.href = data.url;
    } else {
      setError(err ?? "Failed to start checkout");
      setUpgrading(false);
      setShowPlanModal(false);
    }
  };

  useEffect(() => {
    // 2500ms hold so users have time to read the title + tagline before the
    // transition to the search UI begins.
    const t = setTimeout(() => setReady(true), 2500);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (session) setStage("app");
  }, [session]);

  useEffect(() => {
    if (stage !== "app") return;
    fetchUsage();
    apiFetch<{ pro: boolean }>("/api/pro-status").then(({ data }) => {
      if (data?.pro) setIsPro(true);
    });
    // Handle post-checkout success redirect: /?payment=success&session_id=cs_xxx
    const params = new URLSearchParams(window.location.search);
    const sessionId = params.get("session_id");
    if (params.get("payment") === "success" && sessionId) {
      window.history.replaceState({}, "", "/");
      apiFetch<{ pro: boolean }>(`/api/activate-pro?session_id=${sessionId}`).then(({ data }) => {
        if (data?.pro) {
          setIsPro(true);
          setProSuccess(true);
        }
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage]);

  const openHistory = () => {
    setHistory(lsGetHistory());
    setShowHistory(true);
  };

  const clearHistory = () => {
    lsClearHistory();
    setHistory([]);
  };

  const loadHistoryEntry = (entry: HistoryEntry) => {
    setText(entry.paragraph);
    setCurrentClaims(entry.claims);
    setResults(entry.results);
    setError("");
    setShowHistory(false);
  };

  const charLimit = isPro ? PRO_CHAR_LIMIT : FREE_CHAR_LIMIT;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setLoading(true);
    setError("");
    setResults([]);
    setCurrentClaims([]);

    try {
      setStatus("Extracting claims…");

      const { data: claimsData, error: claimsError } = await apiFetch<{
        claims: { claim: string; searchQuery: string }[];
        remaining?: number;
        limit?: number;
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

      // Update usage counter from the response so the UI reflects the new count
      // without a separate network round-trip.
      if (typeof claimsData.remaining === "number" && typeof claimsData.limit === "number") {
        setUsage((u) => ({ ...u, remaining: claimsData.remaining!, limit: claimsData.limit!, count: claimsData.limit! - claimsData.remaining! }));
      }

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

      // Save to browser history (works for all users, no account needed)
      lsAddHistory({ paragraph: text, claims, results: claimResults });
    } catch {
      setError("An unexpected error occurred. Please try again.");
      setStatus("");
    } finally {
      setLoading(false);
    }
  };

  // Scroll to results when they appear
  useEffect(() => {
    if (results.length > 0) {
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 350);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [results.length > 0 ? results[0]?.claim : null]);

  const hasActivity = loading || error !== "" || results.length > 0;
  const isCentered = !ready && !hasActivity;

  return (
    <>
      {/* ── how to use modal ── */}
      {showHowTo && <HowToUseModal onClose={() => setShowHowTo(false)} />}

      {/* ── plan picker modal ── */}
      {showPlanModal && (
        <PlanModal
          onClose={() => setShowPlanModal(false)}
          onSelectPlan={(plan) => upgradeToPro(plan)}
          upgrading={upgrading}
        />
      )}

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
              className="fixed inset-0 bg-black/50 z-40"
              onClick={() => setShowHistory(false)}
            />
            {/* panel */}
            <motion.aside
              key="sidebar"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 320, damping: 32, mass: 0.8 }}
              className="fixed top-0 right-0 h-full w-full max-w-[380px] z-50 flex flex-col bg-[#0e1120] light:bg-[#f0f3fa] border-l border-white/[0.08] light:border-black/[0.1] shadow-[-8px_0_32px_rgba(0,0,0,0.45)] light:shadow-[-8px_0_32px_rgba(0,0,0,0.12)]"
              role="complementary"
              aria-label="Search history"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-5 border-b border-white/[0.08] light:border-black/[0.08] shrink-0">
                <div>
                  <h2 className="text-base font-bold text-slate-100 light:text-slate-900 tracking-tight">
                    Search History
                  </h2>
                  <p className="text-xs text-slate-500 light:text-slate-500 mt-0.5">
                    {history.length === 0
                      ? "No searches yet"
                      : `${history.length} search${history.length !== 1 ? "es" : ""}`}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  {history.length > 0 && (
                    <button
                      onClick={clearHistory}
                      className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-500 light:text-slate-500 hover:text-red-400 light:hover:text-red-600 hover:bg-red-500/10 light:hover:bg-red-500/[0.08] transition-colors"
                    >
                      Clear all
                    </button>
                  )}
                  <button
                    onClick={() => setShowHistory(false)}
                    className="p-1.5 rounded-lg text-slate-500 light:text-slate-500 hover:text-slate-200 light:hover:text-slate-800 hover:bg-white/10 light:hover:bg-black/[0.06] transition-colors"
                    aria-label="Close history"
                  >
                    <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
                      <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z"/>
                    </svg>
                  </button>
                </div>
              </div>

              {/* Entry list */}
              <div className="flex-1 overflow-y-auto px-4 py-4">
                {history.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <svg className="h-8 w-8 text-slate-600 light:text-slate-400 mb-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                    <p className="text-sm font-medium text-slate-500 light:text-slate-500">No searches yet</p>
                    <p className="text-xs text-slate-600 light:text-slate-400 mt-1">Your analyses will appear here</p>
                  </div>
                ) : (
                  <ul className="flex flex-col gap-2">
                    {history.map((entry) => (
                      <li key={entry.id}>
                        <button
                          onClick={() => loadHistoryEntry(entry)}
                          className="w-full text-left rounded-xl border border-white/[0.09] light:border-black/[0.09] bg-[#161b2e] light:bg-white px-4 py-4 transition-all duration-150 hover:bg-[#1d2440] light:hover:bg-slate-50 hover:border-white/[0.18] light:hover:border-black/[0.15] hover:shadow-[0_2px_12px_rgba(0,0,0,0.35)] light:hover:shadow-[0_2px_12px_rgba(0,0,0,0.08)] group"
                        >
                          {/* Preview — single line, truncates with ellipsis */}
                          <p className="text-sm font-medium text-slate-200 light:text-slate-800 truncate group-hover:text-white light:group-hover:text-slate-900 transition-colors">
                            {entry.paragraph}
                          </p>

                          {/* Metadata row */}
                          <div className="mt-2 flex items-center justify-between">
                            <div className="flex items-center gap-2 text-xs text-slate-500 light:text-slate-500">
                              <span className="inline-flex items-center gap-1">
                                <svg className="h-3 w-3 shrink-0" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
                                  <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd"/>
                                </svg>
                                {entry.claims.length} claim{entry.claims.length !== 1 ? "s" : ""}
                              </span>
                              <span className="text-slate-700 light:text-slate-300">·</span>
                              <span>{new Date(entry.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}</span>
                            </div>
                            {/* Arrow hint — appears on hover */}
                            <svg className="h-3.5 w-3.5 text-slate-600 light:text-slate-400 opacity-0 group-hover:opacity-100 -translate-x-1 group-hover:translate-x-0 transition-all duration-150 shrink-0" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
                              <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd"/>
                            </svg>
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
        className={`noise-overlay relative min-h-screen bg-[var(--page-bg)] px-4 sm:px-6 ${isCentered ? "flex items-center justify-center py-12" : "py-12"}`}
      >
        {/* Ambient layers — dot grid, orbs, vignette */}
        <div className="pointer-events-none fixed inset-0 overflow-hidden z-0">
          {/* Dot grid pattern */}
          <div className="dot-pattern absolute inset-0" />
          {/* Gradient orbs */}
          <div className="orb-1 absolute top-[20%] left-[15%] w-[480px] h-[480px] rounded-full bg-indigo-600/[0.12] light:bg-indigo-500/[0.07] blur-[100px]" />
          <div className="orb-2 absolute bottom-[20%] right-[10%] w-[420px] h-[420px] rounded-full bg-violet-600/[0.10] light:bg-violet-500/[0.06] blur-[90px]" />
          <div className="orb-3 absolute top-[55%] left-[55%] w-[300px] h-[300px] rounded-full bg-blue-500/[0.07] light:bg-blue-400/[0.05] blur-[80px]" />
          {/* Edge vignette */}
          <div className="vignette absolute inset-0" />
        </div>
        {/* top-right controls — fixed, only visible in app stage */}
        <AnimatePresence>
          {stage === "app" && ready && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed top-4 right-4 z-30 flex items-center gap-2"
            >
              <ThemeToggle theme={theme} onToggle={toggleTheme} />

              {/* Upgrade to Pro button — shown when not already pro */}
              {!isPro && (
                <button
                  onClick={() => setShowPlanModal(true)}
                  disabled={upgrading}
                  className="btn-upgrade flex items-center gap-1.5 rounded-xl border border-amber-500/30 light:border-amber-700/40 bg-amber-500/10 light:bg-amber-600/[0.1] px-2.5 py-1.5 hover:bg-amber-500/15 hover:border-amber-500/40 text-sm font-medium text-amber-400 light:text-amber-800 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                  </svg>
                  {upgrading ? "Redirecting…" : "Upgrade to Pro"}
                </button>
              )}

              {/* Pro badge — shown when already pro */}
              {isPro && (
                <span className="flex items-center gap-1.5 rounded-xl border border-amber-500/30 light:border-amber-700/40 bg-amber-500/10 light:bg-amber-600/[0.1] px-2.5 py-1.5 text-sm font-medium text-amber-400 light:text-amber-800">
                  <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                  </svg>
                  Pro
                </span>
              )}

              {/* User menu (signed-in) or History button (guest) */}
              {session ? (
                <UserMenu session={session} onOpenHistory={openHistory} isPro={isPro} />
              ) : (
                <button
                  onClick={openHistory}
                  className="flex items-center gap-1.5 rounded-xl border border-white/15 light:border-black/[0.1] bg-white/10 light:bg-black/[0.06] backdrop-blur-sm px-2.5 py-1.5 hover:bg-white/15 light:hover:bg-black/[0.1] transition-colors text-sm font-medium text-slate-300 light:text-slate-700"
                >
                  <svg className="h-4 w-4 text-slate-400 light:text-slate-500" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-13a.75.75 0 00-1.5 0v5c0 .414.336.75.75.75h4a.75.75 0 000-1.5h-3.25V5z" clipRule="evenodd"/>
                  </svg>
                  History
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <main className="relative z-10 mx-auto w-full max-w-2xl">
          <motion.div
            layout
            className={`${hasActivity ? "mb-6 text-left" : ready ? "mb-8 text-center" : "mb-0 text-center"}`}
          >
            <motion.h1
              layout
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: [0.25, 0.1, 0.25, 1] }}
              className="font-[family-name:var(--font-playfair)] text-4xl font-extrabold text-white light:text-slate-900 sm:text-5xl leading-tight tracking-tight"
            >
              Reference Finder
            </motion.h1>

            <AnimatePresence>
              {/* Landing tagline — visible only during the initial hold, fades out when ready */}
              {!ready && (
                <motion.p
                  key="tagline"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
                  className="mt-3 text-lg font-light text-slate-400 light:text-slate-600 tracking-wide sm:text-xl"
                >
                  Real papers, not hallucinated ones.
                </motion.p>
              )}

              {/* App subtitle — fades in after the tagline exits */}
              {ready && stage === "app" && (
                <>
                  <motion.p
                    key="app-sub"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5, delay: 0.15, ease: "easeOut" }}
                    className="mt-2 text-sm text-slate-400 light:text-slate-700"
                  >
                    Paste a paragraph to find academic citations for each factual claim.
                  </motion.p>
                  {session?.user?.name && (
                    <motion.p
                      key="app-greeting"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.5, delay: 0.25, ease: "easeOut" }}
                      className="mt-1 text-sm text-slate-400 light:text-slate-600"
                    >
                      Welcome back, {session.user.name.split(" ")[0]}.
                    </motion.p>
                  )}
                </>
              )}
              {ready && stage === "auth" && (
                <motion.p
                  key="auth-sub"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.15, ease: "easeOut" }}
                  className="mt-2 text-sm text-slate-400 light:text-slate-700"
                >
                  Find academic citations for every factual claim in your writing.
                </motion.p>
              )}
            </AnimatePresence>
          </motion.div>

          <AnimatePresence mode="wait">

            {/* ── auth stage ── */}
            {ready && stage === "auth" && (
              <div className="fixed top-4 right-4 z-30">
                <ThemeToggle theme={theme} onToggle={toggleTheme} />
              </div>
            )}
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
                  className="flex items-center justify-center gap-3 w-full max-w-xs rounded-xl bg-white px-6 py-3 text-sm font-medium text-gray-900 shadow-md hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
                  <div className="flex-1 h-px bg-white/10 light:bg-black/10" />
                  <span className="text-xs text-slate-500 light:text-slate-600">or</span>
                  <div className="flex-1 h-px bg-white/10 light:bg-black/10" />
                </div>

                <button
                  onClick={() => setStage("app")}
                  className="w-full max-w-xs rounded-xl border border-white/15 light:border-black/[0.1] bg-white/8 light:bg-black/[0.05] px-6 py-3 text-sm font-medium text-slate-300 light:text-slate-700 hover:bg-white/12 light:hover:bg-black/[0.09] hover:text-white light:hover:text-slate-900 transition-colors"
                >
                  Continue as Guest
                </button>

                <button
                  type="button"
                  onClick={() => setShowHowTo(true)}
                  className="flex items-center gap-1.5 text-sm text-slate-500 light:text-slate-600 hover:text-slate-300 light:hover:text-slate-800 transition-colors mt-1"
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
                      onChange={(e) => { setText(e.target.value.slice(0, charLimit)); setUploadError(""); }}
                      placeholder="Paste your paragraph here…"
                      aria-label="Paragraph input"
                      className={`w-full h-44 sm:h-48 rounded-xl border bg-white/[0.05] light:bg-black/[0.03] backdrop-blur-md px-4 py-3 pb-7 text-sm text-slate-100 light:text-slate-900 placeholder-white/25 resize-none focus:outline-none focus:ring-1 focus:border-transparent transition-colors disabled:opacity-50 ${
                        !isPro && text.length >= FREE_CHAR_LIMIT
                          ? "border-red-500/40 focus:ring-red-500/40"
                          : "border-white/10 light:border-black/[0.1] focus:ring-white/20 light:focus:ring-black/[0.15]"
                      }`}
                      disabled={loading || extracting}
                    />
                    <span
                      className={`absolute bottom-2 right-3 text-xs tabular-nums ${
                        !isPro && text.length >= FREE_CHAR_LIMIT
                          ? "text-red-400 light:text-red-600 font-medium"
                          : charLimit - text.length <= (isPro ? 500 : 100)
                          ? "text-amber-400 light:text-amber-600"
                          : "text-slate-500 light:text-slate-600"
                      }`}
                    >
                      {text.length.toLocaleString()}/{charLimit.toLocaleString()}
                    </span>
                  </div>

                  {/* Free-user limit warning */}
                  {!isPro && text.length >= FREE_CHAR_LIMIT && (
                    <p className="text-xs text-red-400 light:text-red-500">
                      Free accounts are limited to 1,000 characters.{" "}
                      <button
                        type="button"
                        onClick={() => setShowPlanModal(true)}
                        className="underline underline-offset-2 hover:text-amber-400 transition-colors"
                      >
                        Upgrade to Pro
                      </button>{" "}
                      for up to 10,000 characters.
                    </p>
                  )}

                  {/* Hidden file input for Pro users */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.docx,.png,.jpg,.jpeg"
                    className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      // Reset immediately so the same file can be re-selected later.
                      e.target.value = "";
                      if (!file) return;

                      setExtracting(true);
                      setUploadError("");

                      const fd = new FormData();
                      fd.append("file", file);

                      const { data, error: err } = await apiFetch<{ text: string }>(
                        "/api/extract-text",
                        { method: "POST", body: fd }
                      );

                      setExtracting(false);

                      if (data?.text) {
                        setText(data.text.slice(0, charLimit));
                      } else {
                        setUploadError(err ?? "Failed to extract text from file");
                      }
                    }}
                  />

                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      {/* Upload button */}
                      <div className="relative">
                        <button
                          ref={uploadBtnRef}
                          type="button"
                          disabled={loading || extracting}
                          onClick={() => {
                            if (isPro) {
                              setShowUpgradeHint(false);
                              fileInputRef.current?.click();
                            } else {
                              setShowUpgradeHint((v) => !v);
                            }
                          }}
                          className="flex items-center gap-1.5 text-sm text-slate-400 light:text-slate-600 hover:text-slate-200 light:hover:text-slate-900 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                          aria-label="Upload document"
                        >
                          {extracting ? (
                            <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden>
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                            </svg>
                          ) : (
                            <svg className="h-4 w-4" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v1A1.5 1.5 0 004.5 19h11A1.5 1.5 0 0017 17.5v-1M10 3v10m0-10L7 6m3-3l3 3"/>
                            </svg>
                          )}
                          {extracting ? "Extracting…" : "Upload"}
                        </button>

                        {/* Upgrade hint popover for free users */}
                        <AnimatePresence>
                          {showUpgradeHint && (
                            <>
                              {/* invisible overlay to close on outside click */}
                              <div
                                className="fixed inset-0 z-10"
                                onClick={() => setShowUpgradeHint(false)}
                              />
                              <motion.div
                                initial={{ opacity: 0, y: 4 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 4 }}
                                transition={{ duration: 0.15 }}
                                className="absolute left-0 top-full mt-2 z-20 w-64 rounded-xl border border-white/15 light:border-black/[0.13] glass-panel shadow-xl px-4 py-3"
                              >
                                <p className="text-xs text-slate-300 light:text-slate-700 leading-relaxed">
                                  Uploading documents is a Pro feature.{" "}
                                  <button
                                    type="button"
                                    onClick={() => { setShowUpgradeHint(false); setShowPlanModal(true); }}
                                    className="font-semibold text-amber-600 hover:text-amber-700 underline underline-offset-2"
                                  >
                                    Upgrade to Pro
                                  </button>{" "}
                                  to upload PDFs, Word docs, and images.
                                </p>
                              </motion.div>
                            </>
                          )}
                        </AnimatePresence>
                      </div>

                      <button
                        type="button"
                        onClick={() => setText(pickExample(text))}
                        disabled={loading}
                        className="link-example text-sm text-slate-500 light:text-slate-600 hover:text-slate-300 light:hover:text-slate-900 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                      >
                        Try an example
                      </button>
                    </div>
                    <div className="flex items-center gap-3">
                      {isPro ? (
                        <span className="inline-flex items-center gap-1 rounded-md bg-amber-500/15 light:bg-amber-600/[0.12] px-2 py-1 text-xs font-semibold text-amber-400 light:text-amber-800">
                          <svg className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                          </svg>
                          Pro — unlimited searches
                        </span>
                      ) : (
                        <span className={`text-xs font-medium tabular-nums px-2 py-1 rounded-md ${
                          usage.remaining === 0
                            ? "bg-red-500/15 text-red-400 light:text-red-600"
                            : usage.remaining <= 1
                            ? "bg-amber-500/15 text-amber-400 light:text-amber-700"
                            : "bg-white/8 light:bg-black/[0.05] text-slate-400 light:text-slate-600"
                        }`}>
                          {usage.remaining}/3 searches left today
                        </span>
                      )}
                      <button
                        type="submit"
                        disabled={!text.trim() || loading || extracting || (!isPro && usage.remaining === 0)}
                        className="btn-submit px-5 py-2 rounded-lg bg-white light:bg-slate-900 text-gray-950 light:text-white text-sm font-semibold hover:bg-slate-100 light:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        {loading ? "Analyzing…" : "Submit"}
                      </button>
                    </div>
                  </div>
                </form>

                {/* Upload error — only shown after a failed file upload */}
                {uploadError && (
                  <p className="mt-2 text-xs text-red-400 light:text-red-600">{uploadError}</p>
                )}

                {/* Pro success toast */}
                {proSuccess && (
                  <div className="mt-3 flex items-start gap-3 rounded-lg border border-green-500/25 bg-green-500/10 px-4 py-3">
                    <svg className="mt-0.5 h-4 w-4 shrink-0 text-green-500" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd"/>
                    </svg>
                    <p className="text-sm text-green-300">
                      <strong>Welcome to Pro!</strong> You now have unlimited searches. Thank you for subscribing.
                    </p>
                  </div>
                )}

                {/* Daily limit banner */}
                {usage.remaining === 0 && !loading && !isPro && (
                  <div className="mt-3 flex items-start gap-3 rounded-lg border border-red-500/20 bg-red-500/[0.07] light:bg-red-500/[0.05] px-4 py-3">
                    <svg className="mt-0.5 h-4 w-4 shrink-0 text-red-400 light:text-red-500" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
                      <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd"/>
                    </svg>
                    <p className="text-sm text-slate-300 light:text-slate-700">
                      You&apos;ve reached your daily limit of 3 free searches.{" "}
                      <button
                        type="button"
                        onClick={() => setShowPlanModal(true)}
                        className="font-semibold text-amber-400 light:text-amber-700 underline underline-offset-2 hover:text-amber-300 light:hover:text-amber-800 transition-colors"
                      >
                        Upgrade to Pro
                      </button>{" "}
                      for unlimited access.
                    </p>
                  </div>
                )}

                {loading && (
                  <div className="mt-8 flex items-center gap-3 text-sm text-slate-400 light:text-slate-700">
                    <svg className="animate-spin h-4 w-4 shrink-0 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden>
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                    <span>{status}</span>
                  </div>
                )}

                {error && <ErrorBanner message={error} />}

                {results.length > 0 && (
                  <div ref={resultsRef} className="mt-8 flex flex-col gap-6">
                    <h2 className="text-xs font-medium text-slate-500 light:text-slate-600 uppercase tracking-wide">
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
