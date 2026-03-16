"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { signIn, signOut, useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import type { Paper, RatedPaper } from "@/lib/rate-relevance";

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

function pickGreeting(firstName: string): string {
  const hour = new Date().getHours();
  const timeGreeting =
    hour >= 5 && hour < 12 ? `Good morning, ${firstName}.` :
    hour >= 12 && hour < 17 ? `Good afternoon, ${firstName}.` :
    hour >= 17 && hour < 21 ? `Good evening, ${firstName}.` :
    `Working late, ${firstName}?`;

  const pool = [
    `Welcome back, ${firstName}.`,
    `Good to see you, ${firstName}.`,
    `Hey ${firstName}, ready to research?`,
    `What are we citing today, ${firstName}?`,
    `Back for more papers, ${firstName}?`,
    `Let's find some references, ${firstName}.`,
    `Hi ${firstName}, what's the topic today?`,
    `Research time, ${firstName}.`,
    `${firstName}, let's get citing.`,
    `What are we working on, ${firstName}?`,
    timeGreeting,
    timeGreeting, // weighted slightly higher
  ];
  return pool[Math.floor(Math.random() * pool.length)];
}

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

// ── recency filter ────────────────────────────────────────────────────────────

type YearFilter = "all" | "5yr" | "3yr" | "1yr" | "2020-2025";

const YEAR_FILTERS: { id: YearFilter; label: string }[] = [
  { id: "all",       label: "All time" },
  { id: "5yr",       label: "Last 5 years" },
  { id: "3yr",       label: "Last 3 years" },
  { id: "1yr",       label: "Last year" },
  { id: "2020-2025", label: "2020–2025" },
];

function paperInRange(year: number | null, filter: YearFilter): boolean {
  if (filter === "all") return true;
  if (year == null) return false; // undated papers hidden by any non-"all" filter
  const now = new Date().getFullYear();
  if (filter === "5yr") return year >= now - 5;
  if (filter === "3yr") return year >= now - 3;
  if (filter === "1yr") return year >= now - 1;
  if (filter === "2020-2025") return year >= 2020 && year <= 2025;
  return true;
}

// ── helpers ──────────────────────────────────────────────────────────────────

function cleanDoi(doi: string | null): string | null {
  if (!doi) return null;
  return doi.replace(/^https?:\/\/doi\.org\//i, "");
}

function doiUrl(doi: string | null): string | null {
  if (!doi) return null;
  if (/^https?:\/\//i.test(doi)) return doi;
  return `https://doi.org/${doi}`;
}

interface ParsedAuthor {
  first: string;
  last: string;
  initials: string; // e.g. "J. M."
}

function parseAuthors(names: string[]): ParsedAuthor[] {
  return names.map((name) => {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return { first: "", last: name, initials: "" };
    if (parts.length === 1) return { first: "", last: parts[0], initials: "" };
    const last = parts[parts.length - 1];
    const firstParts = parts.slice(0, -1);
    const first = firstParts.join(" ");
    const initials = firstParts.map((p) => (p[0] ?? "").toUpperCase() + ".").join(" ");
    return { first, last, initials };
  });
}

function authorLabel(a: ParsedAuthor): string {
  return `${a.last}${a.initials ? ", " + a.initials : ""}`;
}

// ── citation formatters ───────────────────────────────────────────────────────

function formatCitationAPA(paper: Paper): string {
  const parsed = parseAuthors(paper.authors);
  let authorStr: string;
  if (parsed.length === 0) {
    authorStr = "Unknown Author";
  } else if (parsed.length === 1) {
    authorStr = authorLabel(parsed[0]);
  } else if (parsed.length === 2) {
    authorStr = `${authorLabel(parsed[0])}, & ${authorLabel(parsed[1])}`;
  } else if (parsed.length <= 20) {
    const all = parsed.map(authorLabel);
    const last = all.pop()!;
    authorStr = all.join(", ") + ", & " + last;
  } else {
    const first19 = parsed.slice(0, 19).map(authorLabel);
    const lastA = parsed[parsed.length - 1];
    authorStr = first19.join(", ") + ", \u2026 " + authorLabel(lastA);
  }

  const year = paper.year ? `(${paper.year})` : "(n.d.)";
  const parts: string[] = [`${authorStr} ${year}. ${paper.title ?? "Untitled"}.`];

  if (paper.journal) {
    let j = paper.journal;
    if (paper.volume) { j += `, ${paper.volume}`; if (paper.issue) j += `(${paper.issue})`; }
    if (paper.pages) j += `, ${paper.pages}`;
    parts.push(j + ".");
  }
  const url = doiUrl(paper.doi);
  if (url) parts.push(url);
  return parts.join(" ");
}

function formatCitationMLA(paper: Paper): string {
  const parsed = parseAuthors(paper.authors);
  let authorStr = "";
  if (parsed.length === 1) {
    const a = parsed[0];
    authorStr = `${a.last}, ${a.first || a.initials}.`;
  } else if (parsed.length === 2) {
    const [a, b] = parsed;
    authorStr = `${a.last}, ${a.first || a.initials}, and ${b.first || b.initials} ${b.last}.`;
  } else if (parsed.length > 2) {
    const a = parsed[0];
    authorStr = `${a.last}, ${a.first || a.initials}, et al.`;
  }

  const title = paper.title ? `"${paper.title}."` : '"Untitled."';
  const year = paper.year ? String(paper.year) : "n.d.";
  let sourcePart = "";
  if (paper.journal) {
    sourcePart = paper.journal;
    if (paper.volume) sourcePart += `, vol. ${paper.volume}`;
    if (paper.issue) sourcePart += `, no. ${paper.issue}`;
    sourcePart += `, ${year}`;
    if (paper.pages) sourcePart += `, pp. ${paper.pages}`;
    sourcePart += ".";
  }
  const url = doiUrl(paper.doi);
  return [authorStr, title, (sourcePart + (url ? " " + url + "." : "")).trim()].filter(Boolean).join(" ");
}

function formatCitationChicago(paper: Paper): string {
  const parsed = parseAuthors(paper.authors);
  let authorStr = "";
  if (parsed.length === 1) {
    const a = parsed[0];
    authorStr = `${a.last}, ${a.first || a.initials}.`;
  } else if (parsed.length === 2) {
    const [a, b] = parsed;
    authorStr = `${a.last}, ${a.first || a.initials}, and ${b.first || b.initials} ${b.last}.`;
  } else if (parsed.length === 3) {
    const [a, b, c] = parsed;
    authorStr = `${a.last}, ${a.first || a.initials}, ${b.first || b.initials} ${b.last}, and ${c.first || c.initials} ${c.last}.`;
  } else if (parsed.length > 3) {
    const a = parsed[0];
    authorStr = `${a.last}, ${a.first || a.initials}, et al.`;
  }

  const year = paper.year ? `${paper.year}.` : "n.d.";
  const title = paper.title ? `"${paper.title}."` : '"Untitled."';
  let sourcePart = "";
  if (paper.journal) {
    sourcePart = paper.journal;
    if (paper.volume) {
      sourcePart += ` ${paper.volume}`;
      if (paper.issue) sourcePart += `, no. ${paper.issue}`;
    }
    if (paper.pages) sourcePart += `: ${paper.pages}`;
    sourcePart += ".";
  }
  const url = doiUrl(paper.doi);
  return [authorStr, year, title, (sourcePart + (url ? " " + url + "." : "")).trim()].filter(Boolean).join(" ");
}

function formatCitationHarvard(paper: Paper): string {
  const parsed = parseAuthors(paper.authors);
  let authorStr: string;
  if (parsed.length === 0) {
    authorStr = "Unknown Author";
  } else if (parsed.length === 1) {
    authorStr = authorLabel(parsed[0]);
  } else if (parsed.length <= 3) {
    const all = parsed.map(authorLabel);
    const last = all.pop()!;
    authorStr = all.join(", ") + " and " + last;
  } else {
    authorStr = authorLabel(parsed[0]) + " et al.";
  }

  const year = paper.year ? `(${paper.year})` : "(n.d.)";
  const title = paper.title ? `'${paper.title}'` : "'Untitled'";
  let result = `${authorStr} ${year} ${title}`;

  if (paper.journal) {
    result += `, ${paper.journal}`;
    if (paper.volume) { result += `, vol. ${paper.volume}`; if (paper.issue) result += `, no. ${paper.issue}`; }
    if (paper.pages) result += `, pp. ${paper.pages}`;
    result += ".";
  } else {
    result += ".";
  }
  const raw = cleanDoi(paper.doi);
  if (raw) result += ` Available at: doi:${raw}.`;
  return result;
}

function formatCitationIEEE(paper: Paper): string {
  const parsed = parseAuthors(paper.authors);
  const ieeeA = (a: ParsedAuthor) => `${a.initials ? a.initials + " " : ""}${a.last}`;
  let authorStr = "";
  if (parsed.length === 1) {
    authorStr = ieeeA(parsed[0]);
  } else if (parsed.length === 2) {
    authorStr = `${ieeeA(parsed[0])} and ${ieeeA(parsed[1])}`;
  } else if (parsed.length > 2) {
    const all = parsed.map(ieeeA);
    const last = all.pop()!;
    authorStr = all.join(", ") + ", and " + last;
  }

  const title = paper.title ? `"${paper.title},"` : '"Untitled,"';
  let source = "";
  if (paper.journal) {
    source = paper.journal;
    if (paper.volume) source += `, vol. ${paper.volume}`;
    if (paper.issue) source += `, no. ${paper.issue}`;
    if (paper.pages) source += `, pp. ${paper.pages}`;
    if (paper.year) source += `, ${paper.year}`;
  }
  const raw = cleanDoi(paper.doi);
  const doiPart = raw ? `, doi: ${raw}` : "";

  const pieces: string[] = [];
  if (authorStr) pieces.push(authorStr + ", ");
  pieces.push(title);
  pieces.push(source ? ` ${source}${doiPart}.` : ".");
  return pieces.join("");
}

function formatCitationVancouver(paper: Paper): string {
  const parsed = parseAuthors(paper.authors);
  const vanA = (a: ParsedAuthor) => {
    const inits = a.initials.replace(/\.\s*/g, "");
    return `${a.last}${inits ? " " + inits : ""}`;
  };
  let authorStr = "";
  if (parsed.length <= 6) {
    authorStr = parsed.map(vanA).join(", ");
  } else {
    authorStr = parsed.slice(0, 6).map(vanA).join(", ") + ", et al";
  }
  if (authorStr) authorStr += ".";

  const title = (paper.title ?? "Untitled") + ".";
  let source = "";
  if (paper.journal) {
    source = paper.journal + ".";
    if (paper.year) {
      source += ` ${paper.year}`;
      if (paper.volume) {
        source += `;${paper.volume}`;
        if (paper.issue) source += `(${paper.issue})`;
      }
      if (paper.pages) source += `:${paper.pages}`;
      source += ".";
    }
  } else if (paper.year) {
    source = `${paper.year}.`;
  }
  const raw = cleanDoi(paper.doi);
  const doiPart = raw ? ` doi: ${raw}` : "";
  return [authorStr, title, (source + doiPart).trim()].filter(Boolean).join(" ");
}

// ── export generators ─────────────────────────────────────────────────────────

// Tracks the citation format most recently used in any CitationMenu so the
// plain-text export can match what the user has been copying.
let _lastCitFmtId: (typeof CITATION_FORMATS)[number]["id"] = "apa";

function bibTexEscape(s: string): string {
  // Minimal escaping: protect literal braces and ampersands.
  return s.replace(/\\/g, "\\textbackslash{}").replace(/[{}]/g, (c) => `\\${c}`).replace(/&/g, "\\&");
}

function makeBibKey(paper: Paper, index: number): string {
  const authorPart = paper.authors[0]
    ? (paper.authors[0].trim().split(/\s+/).pop() ?? "unknown")
    : `ref${index}`;
  const yearPart = paper.year ?? "nd";
  const titleWord = (paper.title ?? "")
    .split(/\s+/)
    .find((w) => w.length > 3 && /^[a-zA-Z]/.test(w)) ?? "untitled";
  return `${authorPart}${yearPart}${titleWord}`
    .replace(/[^a-zA-Z0-9]/g, "")
    .toLowerCase()
    .slice(0, 40);
}

function generateBibTeX(papers: Paper[]): string {
  const usedKeys = new Map<string, number>();
  return papers
    .map((p, idx) => {
      let key = makeBibKey(p, idx);
      const count = usedKeys.get(key) ?? 0;
      usedKeys.set(key, count + 1);
      if (count > 0) key = `${key}${String.fromCharCode(96 + count)}`; // append a, b, c…

      const authorsBib = p.authors
        .map((name) => {
          const parts = name.trim().split(/\s+/);
          if (parts.length === 1) return parts[0];
          const last = parts[parts.length - 1];
          const first = parts.slice(0, -1).join(" ");
          return `${last}, ${first}`;
        })
        .join(" and ");

      const rawDoi = cleanDoi(p.doi);
      const lines: string[] = [
        `@article{${key},`,
        authorsBib ? `  author    = {${bibTexEscape(authorsBib)}},` : null,
        p.title    ? `  title     = {${bibTexEscape(p.title)}},`        : null,
        p.journal  ? `  journal   = {${bibTexEscape(p.journal)}},`       : null,
        p.year     ? `  year      = {${p.year}},`                        : null,
        p.volume   ? `  volume    = {${p.volume}},`                      : null,
        p.issue    ? `  number    = {${p.issue}},`                       : null,
        p.pages    ? `  pages     = {${p.pages.replace(/[–—]/, "--")}},` : null,
        rawDoi     ? `  doi       = {${rawDoi}},`                        : null,
        `}`,
      ].filter((l): l is string => l !== null);
      return lines.join("\n");
    })
    .join("\n\n");
}

function generateRIS(papers: Paper[]): string {
  return papers
    .map((p) => {
      const lines: string[] = ["TY  - JOUR"];
      for (const name of p.authors) {
        const parts = name.trim().split(/\s+/);
        if (parts.length === 1) {
          lines.push(`AU  - ${parts[0]}`);
        } else {
          const last = parts[parts.length - 1];
          const first = parts.slice(0, -1).join(" ");
          lines.push(`AU  - ${last}, ${first}`);
        }
      }
      if (p.title)   lines.push(`TI  - ${p.title}`);
      if (p.journal) lines.push(`JO  - ${p.journal}`);
      if (p.year)    lines.push(`PY  - ${p.year}`);
      if (p.volume)  lines.push(`VL  - ${p.volume}`);
      if (p.issue)   lines.push(`IS  - ${p.issue}`);
      if (p.pages) {
        const [sp, ep] = p.pages.split(/[-–—]/);
        if (sp?.trim()) lines.push(`SP  - ${sp.trim()}`);
        if (ep?.trim()) lines.push(`EP  - ${ep.trim()}`);
      }
      const rawDoi = cleanDoi(p.doi);
      if (rawDoi) lines.push(`DO  - ${rawDoi}`);
      lines.push("ER  - ");
      return lines.join("\n");
    })
    .join("\n\n");
}

function generatePlainText(papers: Paper[], formatFn: (p: Paper) => string): string {
  return papers.map((p, i) => `${i + 1}. ${formatFn(p)}`).join("\n\n");
}

function triggerDownload(content: string, filename: string): void {
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ── export menu ───────────────────────────────────────────────────────────────

function ExportMenu({
  papers,
  isPro,
  isSignedIn,
  onUpgrade,
}: {
  papers: Paper[];
  isPro: boolean;
  isSignedIn: boolean;
  onUpgrade: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [showProGate, setShowProGate] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const down = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const key = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", down);
    document.addEventListener("keydown", key);
    return () => {
      document.removeEventListener("mousedown", down);
      document.removeEventListener("keydown", key);
    };
  }, []);

  const handleExport = (type: "bibtex" | "ris" | "plaintext") => {
    if (papers.length === 0) return;
    if (type === "bibtex") {
      triggerDownload(generateBibTeX(papers), "references.bib");
    } else if (type === "ris") {
      triggerDownload(generateRIS(papers), "references.ris");
    } else {
      const fmt = CITATION_FORMATS.find((f) => f.id === _lastCitFmtId) ?? CITATION_FORMATS[0];
      triggerDownload(generatePlainText(papers, fmt.fn), `references-${fmt.id}.txt`);
    }
    setOpen(false);
  };

  // Read last-used format at open time so the label is fresh
  const plainLabel = open
    ? (CITATION_FORMATS.find((f) => f.id === _lastCitFmtId)?.label ?? "APA 7th")
    : "Plain text";

  const EXPORT_OPTIONS = [
    {
      type: "bibtex" as const,
      label: "BibTeX",
      ext: ".bib",
      icon: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
          <polyline points="14 2 14 8 20 8"/>
          <line x1="16" y1="13" x2="8" y2="13"/>
          <line x1="16" y1="17" x2="8" y2="17"/>
          <polyline points="10 9 9 9 8 9"/>
        </svg>
      ),
    },
    {
      type: "ris" as const,
      label: "RIS",
      ext: ".ris",
      icon: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
          <polyline points="14 2 14 8 20 8"/>
          <line x1="12" y1="18" x2="12" y2="12"/>
          <line x1="9" y1="15" x2="15" y2="15"/>
        </svg>
      ),
    },
    {
      type: "plaintext" as const,
      label: open ? plainLabel : "Plain text",
      ext: ".txt",
      icon: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <line x1="17" y1="10" x2="3" y2="10"/>
          <line x1="21" y1="6" x2="3" y2="6"/>
          <line x1="21" y1="14" x2="3" y2="14"/>
          <line x1="17" y1="18" x2="3" y2="18"/>
        </svg>
      ),
    },
  ];

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => isPro ? setOpen((o) => !o) : setShowProGate((v) => !v)}
        disabled={papers.length === 0}
        className={`inline-flex items-center gap-1.5 rounded-lg border border-white/10 light:border-[rgba(44,24,16,0.14)] bg-white/[0.05] light:bg-[rgba(44,24,16,0.04)] px-2.5 py-1 text-xs transition-colors disabled:opacity-30 disabled:cursor-not-allowed ${
          isPro
            ? "text-slate-400 light:text-[#6B4226] hover:bg-white/[0.09] light:hover:bg-[rgba(44,24,16,0.08)] hover:text-slate-200 light:hover:text-[#2C1810]"
            : "text-slate-600 light:text-[#A67856] opacity-60"
        }`}
      >
        {isPro ? (
          <svg className="h-3 w-3 shrink-0" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M3 16.5v1.25C3 18.99 4.01 20 5.25 20h9.5C15.99 20 17 18.99 17 17.75V16.5"/>
            <path d="M10 3.5v9M6.5 9l3.5 3.5 3.5-3.5"/>
          </svg>
        ) : (
          <svg className="h-3 w-3 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
            <path d="M7 11V7a5 5 0 0110 0v4"/>
          </svg>
        )}
        Export
        {isPro ? (
          <svg className={`h-2.5 w-2.5 transition-transform ${open ? "rotate-180" : ""}`} viewBox="0 0 20 20" fill="currentColor" aria-hidden>
            <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd"/>
          </svg>
        ) : (
          <ProBadge />
        )}
      </button>

      {/* Pro gate popover */}
      <AnimatePresence>
        {showProGate && !isPro && (
          <ProGatePopover
            isSignedIn={isSignedIn}
            onUpgrade={onUpgrade}
            onClose={() => setShowProGate(false)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {open && isPro && (
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 4 }}
            transition={{ duration: 0.14, ease: "easeOut" }}
            className="absolute top-full left-0 mt-1.5 z-30 w-52 rounded-xl border border-white/[0.10] light:border-[rgba(80,50,20,0.16)] bg-[#141828] light:bg-[rgba(248,246,234,1)] shadow-2xl py-1 overflow-hidden"
            role="menu"
          >
            <p className="px-3 pt-1.5 pb-1 text-[10px] font-semibold uppercase tracking-widest text-slate-500 light:text-[#8B5E3C]">
              Download as
            </p>
            {EXPORT_OPTIONS.map(({ type, label, ext, icon }) => (
              <button
                key={type}
                type="button"
                onClick={() => handleExport(type)}
                className="w-full flex items-center gap-2.5 px-3 py-1.5 text-xs text-slate-300 light:text-[#2C1810] hover:bg-white/[0.07] light:hover:bg-[rgba(44,24,16,0.06)] transition-colors text-left"
                role="menuitem"
              >
                <span className="text-slate-500 light:text-[#8B5E3C] shrink-0">{icon}</span>
                <span className="flex-1 truncate">{label}</span>
                <span className="text-slate-600 light:text-[#A67856] font-mono text-[10px] shrink-0">{ext}</span>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
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
    cardClass: "bg-green-500/[0.07] light:bg-[rgba(30,70,32,0.05)] border-green-500/25 light:border-[rgba(30,70,32,0.22)]",
    badgeClass: "bg-green-500/15 text-green-400 light:bg-[rgba(30,70,32,0.11)] light:border-[rgba(30,70,32,0.32)] light:text-[#1E4620]",
  };
  if (score >= 4) return {
    label: "High",
    cardClass: "bg-blue-500/[0.07] light:bg-[rgba(42,48,112,0.05)] border-blue-500/25 light:border-[rgba(42,48,112,0.2)]",
    badgeClass: "bg-blue-500/15 text-blue-400 light:bg-[rgba(42,48,112,0.09)] light:border-[rgba(42,48,112,0.28)] light:text-[#2A3070]",
  };
  return {
    label: "Moderate",
    cardClass: "bg-amber-500/[0.06] light:bg-[rgba(107,58,0,0.05)] border-amber-500/20 light:border-[rgba(107,58,0,0.2)]",
    badgeClass: "bg-amber-500/15 text-amber-400 light:bg-[rgba(107,58,0,0.09)] light:border-[rgba(107,58,0,0.26)] light:text-[#6B3A00]",
  };
}

// ── pro gate primitives ───────────────────────────────────────────────────────
//
// POLICY: All new features default to Pro-only. Add isPro gating with
// ProGatePopover when building anything new, unless explicitly told otherwise.

function ProBadge() {
  return (
    <span className="inline-flex items-center gap-0.5 rounded-full border px-1.5 py-px text-[9px] font-bold uppercase tracking-wider bg-amber-500/15 border-amber-500/30 text-amber-400 light:bg-amber-700/[0.08] light:border-amber-700/20 light:text-amber-700">
      <svg className="h-2 w-2 shrink-0" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
        <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/>
      </svg>
      Pro
    </span>
  );
}

/**
 * Pro-gate message. Uses a React portal to render directly into document.body,
 * completely escaping all stacking contexts including Framer Motion transform
 * containers (which would otherwise trap position:fixed children).
 * Solid colours only — no blur, no transparency.
 */
function ProGatePopover({
  isSignedIn,
  onUpgrade,
  onClose,
}: {
  isSignedIn: boolean;
  onUpgrade: () => void;
  onClose: () => void;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  if (!mounted) return null;

  return createPortal(
    <>
      {/* Dim backdrop — click anywhere to close */}
      <div
        style={{ position: "fixed", inset: 0, zIndex: 9998, background: "rgba(0,0,0,0.45)" }}
        onClick={onClose}
      />

      {/* Outer div owns the fixed centering — keeps it out of Framer Motion's
          transform so scale animation never overwrites translate(-50%,-50%). */}
      <div
        style={{
          position: "fixed",
          left: "50%",
          top: "50%",
          transform: "translate(-50%, -50%)",
          zIndex: 9999,
          width: "18rem",
        }}
      >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.15, ease: "easeOut" }}
        style={{ backdropFilter: "none", WebkitBackdropFilter: "none" }}
        className="rounded-2xl px-5 py-4
                   bg-[#1a2035] light:bg-[#faf8f2]
                   border-2 border-[#2e3a5a] light:border-[#b89660]
                   shadow-[0_8px_40px_rgba(0,0,0,0.7),0_2px_8px_rgba(0,0,0,0.4)]
                   light:shadow-[0_8px_32px_rgba(124,78,24,0.25),0_2px_6px_rgba(124,78,24,0.12)]"
      >
        <div className="flex items-start gap-3">
          {/* Lock icon */}
          <div className="mt-0.5 shrink-0 flex h-8 w-8 items-center justify-center rounded-full bg-[#2e3a5a] light:bg-[#e8dfc8] border border-[#3d4e78] light:border-[#c4a870]">
            <svg className="h-3.5 w-3.5 text-amber-400 light:text-amber-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
              <path d="M7 11V7a5 5 0 0110 0v4"/>
            </svg>
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white light:text-[#1a0f00] mb-1.5">
              Pro feature
            </p>
            <p className="text-xs text-[#94a3b8] light:text-[#4a3010] leading-relaxed">
              {isSignedIn ? (
                <>
                  <button
                    type="button"
                    onClick={() => { onClose(); onUpgrade(); }}
                    className="font-semibold text-amber-400 light:text-amber-700 underline underline-offset-2 hover:text-amber-300 light:hover:text-amber-900 transition-colors"
                  >
                    Upgrade to Pro
                  </button>
                  {" "}to unlock this feature.
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => { onClose(); onUpgrade(); }}
                    className="font-semibold text-amber-400 light:text-amber-700 underline underline-offset-2 hover:text-amber-300 light:hover:text-amber-900 transition-colors"
                  >
                    Sign in
                  </button>
                  {" "}and upgrade to Pro to unlock this feature.
                </>
              )}
            </p>
          </div>

          {/* Dismiss × */}
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 -mt-0.5 -mr-1 rounded-lg p-1 text-[#64748b] hover:text-white light:text-[#8b6a40] light:hover:text-[#1a0f00] transition-colors"
            aria-label="Dismiss"
          >
            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
      </motion.div>
      </div>
    </>,
    document.body
  );
}

// ── Omakase citation style picker modal ───────────────────────────────────────

const OMAKASE_STYLES = [
  { id: "apa",       label: "APA",       subtitle: "7th edition" },
  { id: "mla",       label: "MLA",       subtitle: "9th edition" },
  { id: "chicago",   label: "Chicago",   subtitle: "17th edition" },
  { id: "harvard",   label: "Harvard",   subtitle: "Author–date" },
  { id: "ieee",      label: "IEEE",      subtitle: "Numbered refs" },
  { id: "vancouver", label: "Vancouver", subtitle: "Numbered refs" },
] as const;

type OmakaseStyleId = (typeof OMAKASE_STYLES)[number]["id"];

function OmakaseCitationPicker({
  onSelect,
  onClose,
}: {
  onSelect: (style: OmakaseStyleId) => void;
  onClose: () => void;
}) {
  return (
    <>
      {/* Backdrop */}
      <motion.div
        key="omakase-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.18 }}
        className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <motion.div
        key="omakase-panel"
        initial={{ opacity: 0, scale: 0.95, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 12 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
      >
        <div
          className="pointer-events-auto w-full max-w-sm rounded-2xl border border-white/[0.10] light:border-[rgba(80,50,20,0.16)] glass-panel shadow-2xl p-6"
          role="dialog"
          aria-modal
          aria-label="Choose citation style"
        >
          {/* Header */}
          <div className="flex items-start justify-between mb-5">
            <div>
              <h2 className="text-base font-semibold text-slate-100 light:text-[#2C1810] letterpress-title">
                Choose citation style
              </h2>
              <p className="mt-0.5 text-xs text-slate-500 light:text-[#8B5E3C]">
                Your paragraph will be rewritten with inline citations.
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="ml-3 shrink-0 rounded-lg p-1 text-slate-500 hover:text-slate-300 light:text-[#8B5E3C] light:hover:text-[#2C1810] hover:bg-white/[0.07] light:hover:bg-[rgba(44,24,16,0.06)] transition-colors"
              aria-label="Close"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>

          {/* Style grid */}
          <div className="grid grid-cols-2 gap-2">
            {OMAKASE_STYLES.map(({ id, label, subtitle }) => (
              <button
                key={id}
                type="button"
                onClick={() => onSelect(id)}
                className="group flex flex-col items-start gap-0.5 rounded-xl border border-white/[0.08] light:border-[rgba(80,50,20,0.12)] bg-white/[0.04] light:bg-[rgba(44,24,16,0.03)] px-4 py-3 text-left transition-all hover:border-amber-500/40 light:hover:border-amber-700/30 hover:bg-amber-500/[0.07] light:hover:bg-amber-700/[0.05] hover:shadow-[0_0_12px_1px_rgba(251,191,36,0.10)]"
              >
                <span className="text-sm font-semibold text-slate-200 light:text-[#2C1810] group-hover:text-amber-300 light:group-hover:text-amber-800 transition-colors">
                  {label}
                </span>
                <span className="text-[10px] text-slate-500 light:text-[#8B5E3C]">
                  {subtitle}
                </span>
              </button>
            ))}
          </div>
        </div>
      </motion.div>
    </>
  );
}

// ── Omakase result — helpers ──────────────────────────────────────────────────

/**
 * Splits a paragraph into alternating plain-text and citation segments.
 * Matches author-date styles like (Smith et al., 2021) and numbered
 * styles like [1] or [1,2] or [1–3].
 */
function splitCitations(text: string): { kind: "text" | "cite"; value: string }[] {
  const re = /(\[[0-9][0-9,;\s–\-]*\]|\([^()]*\b(?:19|20)\d{2}[a-z]?\b[^()]*\))/g;
  const segments: { kind: "text" | "cite"; value: string }[] = [];
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) segments.push({ kind: "text", value: text.slice(last, m.index) });
    segments.push({ kind: "cite", value: m[0] });
    last = m.index + m[0].length;
  }
  if (last < text.length) segments.push({ kind: "text", value: text.slice(last) });
  return segments;
}

const CopyIcon = () => (
  <svg className="h-3 w-3 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
    <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
  </svg>
);
const CheckIcon = () => (
  <svg className="h-3 w-3 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);

function useCopyButton(text: () => string) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* clipboard unavailable */ }
  };
  return { copied, copy };
}

// ── Omakase result — inline section ──────────────────────────────────────────

function OmakaseResultSection({
  rewrittenParagraph,
  referenceList,
  styleName,
  onDismiss,
}: {
  rewrittenParagraph: string;
  referenceList: string[];
  styleName: string;
  onDismiss: () => void;
}) {
  const sectionRef = useRef<HTMLDivElement>(null);

  // Scroll into view once on mount with breathing room above the section
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    // Wait for the DOM paint + animation frame so getBoundingClientRect is accurate
    const id = setTimeout(() => {
      const top = el.getBoundingClientRect().top + window.scrollY - 80;
      window.scrollTo({ top, behavior: "smooth" });
    }, 120);
    return () => clearTimeout(id);
  }, []);

  const refText  = referenceList.map((r, i) => `${i + 1}. ${r}`).join("\n");
  const allText  = `${rewrittenParagraph}\n\nReferences\n${refText}`;
  const para     = useCopyButton(() => rewrittenParagraph);
  const refs     = useCopyButton(() => refText);
  const all      = useCopyButton(() => allText);
  const segments = splitCitations(rewrittenParagraph);

  const btnBase  = "inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap";
  const btnAmber = `${btnBase} border-amber-500/30 light:border-amber-700/25 bg-amber-500/10 light:bg-amber-700/[0.07] text-amber-300 light:text-amber-800 hover:bg-amber-500/[0.18] light:hover:bg-amber-700/[0.12]`;
  const btnGhost = `${btnBase} border-white/[0.09] light:border-[rgba(80,50,20,0.13)] text-slate-400 light:text-[#6B4226] hover:bg-white/[0.06] light:hover:bg-[rgba(44,24,16,0.05)]`;

  return (
    <motion.div
      ref={sectionRef}
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
      className="rounded-2xl border border-amber-500/[0.18] light:border-[rgba(120,80,30,0.18)] bg-[#0b0d1a] light:bg-[rgba(253,250,243,1)] shadow-[0_0_0_1px_rgba(251,191,36,0.04),0_8px_32px_rgba(0,0,0,0.35)] light:shadow-[0_4px_24px_rgba(100,60,10,0.10)] overflow-hidden"
    >
      {/* Amber gradient top-line accent */}
      <div className="h-px bg-gradient-to-r from-transparent via-amber-500/50 light:via-amber-700/35 to-transparent" />

      {/* ── Header ── */}
      <div className="flex items-center justify-between px-5 pt-4 pb-3.5 border-b border-white/[0.06] light:border-[rgba(80,50,20,0.09)]">
        <div className="flex items-center gap-2.5 min-w-0">
          <svg className="h-4 w-4 shrink-0 text-amber-400 light:text-amber-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z"/>
            <path d="M18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456z"/>
          </svg>
          <div className="min-w-0">
            <h2 className="text-sm font-semibold text-slate-100 light:text-[#2C1810] letterpress-title truncate">
              Omakase rewrite
            </h2>
            <p className="text-[10px] text-slate-500 light:text-[#8B5E3C]">
              {styleName} · {referenceList.length} reference{referenceList.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onDismiss}
          className="ml-3 shrink-0 rounded-lg p-1.5 text-slate-500 hover:text-slate-300 light:text-[#8B5E3C] light:hover:text-[#2C1810] hover:bg-white/[0.07] light:hover:bg-[rgba(44,24,16,0.06)] transition-colors"
          aria-label="Dismiss Omakase result"
        >
          <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>

      {/* ── Paragraph ── */}
      <div className="px-5 pt-5 pb-4">
        <div className="flex items-center justify-between gap-4 mb-3">
          <h3 className="text-[10px] font-semibold uppercase tracking-widest text-slate-500 light:text-[#8B5E3C] shrink-0">
            Rewritten paragraph
          </h3>
          <button type="button" onClick={para.copy} className={btnGhost}>
            {para.copied ? <><CheckIcon />Copied!</> : <><CopyIcon />Copy paragraph</>}
          </button>
        </div>
        <p className="text-sm leading-[1.85] text-slate-200 light:text-[#2C1810]">
          {segments.map((seg, i) =>
            seg.kind === "cite" ? (
              <mark
                key={i}
                className="rounded-sm px-[3px] py-px font-medium not-italic
                           text-amber-300 bg-amber-500/[0.18] border border-amber-500/[0.22]
                           light:text-amber-900 light:bg-amber-600/[0.11] light:border-amber-700/[0.20]"
                style={{ WebkitBoxDecorationBreak: "clone", boxDecorationBreak: "clone" }}
              >
                {seg.value}
              </mark>
            ) : (
              <span key={i}>{seg.value}</span>
            )
          )}
        </p>
      </div>

      {/* ── Divider ── */}
      <div className="mx-5 border-t border-white/[0.05] light:border-[rgba(80,50,20,0.08)]" />

      {/* ── References ── */}
      {referenceList.length > 0 && (
        <div className="px-5 pt-4 pb-5 bg-white/[0.015] light:bg-[rgba(44,24,16,0.025)]">
          <div className="flex items-center justify-between gap-4 mb-3">
            <h3 className="text-[10px] font-semibold uppercase tracking-widest text-slate-500 light:text-[#8B5E3C] shrink-0">
              References
            </h3>
            <button type="button" onClick={refs.copy} className={btnGhost}>
              {refs.copied ? <><CheckIcon />Copied!</> : <><CopyIcon />Copy references</>}
            </button>
          </div>
          <ol className="flex flex-col gap-2">
            {referenceList.map((ref, i) => (
              <li key={i} className="flex gap-3 text-xs leading-relaxed text-slate-300 light:text-[#3D2010]">
                <span className="shrink-0 mt-px font-mono text-[10px] text-amber-600/70 light:text-amber-800/60 select-none tabular-nums">
                  [{i + 1}]
                </span>
                <span>{ref}</span>
              </li>
            ))}
          </ol>
        </div>
      )}

      {/* ── Footer ── */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 px-5 py-3.5 border-t border-white/[0.06] light:border-[rgba(80,50,20,0.09)]
                      bg-white/[0.015] light:bg-[rgba(44,24,16,0.018)]">
        <p className="text-[10px] text-slate-600 light:text-[#A67856] hidden sm:block">
          Citations are highlighted in the paragraph above.
        </p>
        <button type="button" onClick={all.copy} className={btnAmber}>
          {all.copied
            ? <><CheckIcon />Copied!</>
            : <><CopyIcon />Copy all</>}
        </button>
      </div>
    </motion.div>
  );
}

// ── Omakase loading overlay ────────────────────────────────────────────────────

function OmakaseLoadingOverlay({ styleName }: { styleName: string }) {
  return (
    <>
      <motion.div
        key="omakase-loading-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.18 }}
        className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
      />
      <motion.div
        key="omakase-loading-panel"
        initial={{ opacity: 0, scale: 0.95, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 12 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
      >
        <div className="pointer-events-auto w-full max-w-sm rounded-2xl border border-white/[0.10] light:border-[rgba(80,50,20,0.16)] glass-panel shadow-2xl px-8 py-10 flex flex-col items-center gap-4 text-center">
          {/* Spinning sparkles */}
          <div className="relative flex items-center justify-center">
            <svg className="absolute h-12 w-12 animate-spin text-amber-500/20" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" fill="none"/>
            </svg>
            <svg className="h-6 w-6 text-amber-400 light:text-amber-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z"/>
              <path d="M18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456z"/>
            </svg>
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-100 light:text-[#2C1810]">
              Rewriting with {styleName} citations…
            </p>
            <p className="mt-1 text-xs text-slate-500 light:text-[#8B5E3C]">
              Inserting references from your matched papers
            </p>
          </div>
        </div>
      </motion.div>
    </>
  );
}

// ── small components ──────────────────────────────────────────────────────────

function ScoreBadge({ score }: { score: number }) {
  const { label, badgeClass } = getTier(score);
  return (
    <span className={`shrink-0 inline-flex items-center gap-1 rounded-full border border-transparent px-2 py-0.5 text-xs font-medium ${badgeClass}`}>
      {label}
    </span>
  );
}

const CITATION_FORMATS = [
  { id: "apa",       label: "APA 7th",      fn: formatCitationAPA },
  { id: "mla",       label: "MLA 9th",      fn: formatCitationMLA },
  { id: "chicago",   label: "Chicago 17th", fn: formatCitationChicago },
  { id: "harvard",   label: "Harvard",      fn: formatCitationHarvard },
  { id: "ieee",      label: "IEEE",         fn: formatCitationIEEE },
  { id: "vancouver", label: "Vancouver",    fn: formatCitationVancouver },
] as const;

function CitationMenu({ paper }: { paper: Paper }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const down = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    const key  = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", down);
    document.addEventListener("keydown", key);
    return () => { document.removeEventListener("mousedown", down); document.removeEventListener("keydown", key); };
  }, []);

  const handleCopy = async (id: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      _lastCitFmtId = id as (typeof CITATION_FORMATS)[number]["id"];
      setCopied(id);
      setTimeout(() => { setCopied(null); setOpen(false); }, 1400);
    } catch { /* clipboard access denied */ }
  };

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="inline-flex items-center gap-1 text-xs text-slate-500 light:text-[#8B2500] hover:text-slate-300 light:hover:text-[#6B1C00] transition-colors"
        title="Copy citation"
      >
        <svg className="h-3 w-3" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 3H5a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-3M8 3a2 2 0 002 2h2a2 2 0 002-2M8 3a2 2 0 012-2h2a2 2 0 012 2"/>
        </svg>
        Cite
        <svg className={`h-2.5 w-2.5 transition-transform ${open ? "rotate-180" : ""}`} viewBox="0 0 20 20" fill="currentColor" aria-hidden>
          <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd"/>
        </svg>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 4 }}
            transition={{ duration: 0.14, ease: "easeOut" }}
            className="absolute bottom-full left-0 mb-2 z-30 w-44 rounded-xl border border-white/[0.10] light:border-[rgba(80,50,20,0.16)] bg-[#141828] light:bg-[rgba(248,246,234,1)] shadow-2xl py-1 overflow-hidden"
            role="menu"
          >
            <p className="px-3 pt-1.5 pb-1 text-[10px] font-semibold uppercase tracking-widest text-slate-500 light:text-[#8B5E3C]">
              Copy citation
            </p>
            {CITATION_FORMATS.map(({ id, label, fn }) => {
              const isCopied = copied === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => handleCopy(id, fn(paper))}
                  className="w-full flex items-center justify-between px-3 py-1.5 text-xs text-slate-300 light:text-[#2C1810] hover:bg-white/[0.07] light:hover:bg-[rgba(44,24,16,0.06)] transition-colors text-left"
                  role="menuitem"
                >
                  <span className={isCopied ? "text-green-400 light:text-[#1E4620] font-medium" : ""}>{label}</span>
                  {isCopied ? (
                    <svg className="h-3.5 w-3.5 text-green-400 light:text-[#1E4620] shrink-0" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
                      <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd"/>
                    </svg>
                  ) : (
                    <svg className="h-3 w-3 text-slate-600 light:text-[#A67856] shrink-0" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8 3H5a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-3M8 3a2 2 0 002 2h2a2 2 0 002-2M8 3a2 2 0 012-2h2a2 2 0 012 2"/>
                    </svg>
                  )}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
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
      className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-medium tracking-wide ${colorClass}${glowing ? " stat-badge-glow" : ""}`}
      style={glowing ? { boxShadow: "0 0 7px 1px rgba(234,88,12,0.35)" } : undefined}
    >
      {icon}
      {text}
    </span>
  );
}

// ── shared paper stats row ────────────────────────────────────────────────────

function PaperStatBadges({ paper }: { paper: Paper }) {
  return (
    <div className="mt-2 flex flex-wrap gap-1.5">
      {paper.citationCount != null && paper.citationCount > 0 && (
        <StatBadge
          colorClass={
            paper.citationCount >= 500
              ? "bg-orange-500/15 border-orange-500/40 text-orange-400 light:bg-[rgba(139,37,0,0.10)] light:border-[rgba(139,37,0,0.32)] light:text-[#7A2000]"
              : "bg-orange-500/10 border-orange-500/20 text-orange-500 light:bg-[rgba(139,37,0,0.07)] light:border-[rgba(139,37,0,0.22)] light:text-[#7A2000]"
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
      {paper.source === "Semantic Scholar" &&
        paper.influentialCitationCount != null &&
        paper.influentialCitationCount > 0 && (
        <StatBadge
          colorClass="bg-violet-500/10 border-violet-500/20 text-violet-400 light:bg-[rgba(75,20,95,0.08)] light:border-[rgba(75,20,95,0.24)] light:text-[#4B1460]"
          text={`Influential: ${paper.influentialCitationCount}`}
          icon={
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.562.562 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"/>
            </svg>
          }
        />
      )}
      {paper.journalHIndex != null && (
        <StatBadge
          colorClass="bg-sky-500/10 border-sky-500/20 text-sky-400 light:bg-[rgba(15,50,100,0.08)] light:border-[rgba(15,50,100,0.24)] light:text-[#0F3264]"
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
      {paper.impactFactor != null && (
        <StatBadge
          colorClass="bg-teal-500/10 border-teal-500/20 text-teal-400 light:bg-[rgba(0,75,70,0.08)] light:border-[rgba(0,75,70,0.24)] light:text-[#004B46]"
          text={`IF ${paper.impactFactor.toFixed(1)}`}
          icon={
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M3 7.5 7.5 3m0 0L12 7.5M7.5 3v13.5m13.5 0L16.5 21m0 0L12 16.5m4.5 4.5V7.5"/>
            </svg>
          }
        />
      )}
      {paper.subjectArea && (
        <StatBadge
          colorClass="bg-emerald-500/10 border-emerald-500/20 text-emerald-400 light:bg-[rgba(10,60,25,0.08)] light:border-[rgba(10,60,25,0.24)] light:text-[#0A3C19]"
          text={paper.subjectArea}
          icon={
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25"/>
            </svg>
          }
        />
      )}
    </div>
  );
}

// ── paper card ────────────────────────────────────────────────────────────────

function PaperCard({
  paper,
  index = 0,
  knownPaperKeys,
  onUsageUpdate,
  yearFilter = "all",
  isPro = false,
  isSignedIn = false,
  onUpgrade,
}: {
  paper: RatedPaper;
  index?: number;
  knownPaperKeys?: Set<string>;
  onUsageUpdate?: (remaining: number) => void;
  yearFilter?: YearFilter;
  isPro?: boolean;
  isSignedIn?: boolean;
  onUpgrade?: () => void;
}) {
  const [relatedOpen, setRelatedOpen] = useState(false);
  const [relatedLoading, setRelatedLoading] = useState(false);
  const [relatedPapers, setRelatedPapers] = useState<Paper[] | null>(null);
  const [relatedError, setRelatedError] = useState<string | null>(null);
  const [showProGate, setShowProGate] = useState(false);

  const authorLine =
    paper.authors.length === 0
      ? null
      : paper.authors.length <= 3
        ? paper.authors.join(", ")
        : `${paper.authors[0]}, et al.`;

  const authorYearMeta = [authorLine, paper.year].filter(Boolean).join(" · ");
  const { cardClass } = getTier(paper.relevanceScore);

  const handleFindRelated = async () => {
    if (relatedPapers !== null) {
      setRelatedOpen((o) => !o);
      return;
    }
    setRelatedOpen(true);
    setRelatedLoading(true);
    setRelatedError(null);
    try {
      const res = await fetch("/api/related-papers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: paper.title, abstract: paper.abstract, doi: paper.doi, s2PaperId: paper.s2PaperId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setRelatedError(data?.error ?? "Failed to load related papers.");
        if (res.status === 429) setRelatedOpen(false);
        return;
      }
      if (typeof data.remaining === "number") onUsageUpdate?.(data.remaining);
      // Filter out papers already shown in main results
      const fetched: Paper[] = data.papers ?? [];
      const filtered = knownPaperKeys
        ? fetched.filter((p) => {
            const doiKey = p.doi ? p.doi.replace(/^https?:\/\/doi\.org\//i, "").toLowerCase() : null;
            const titleKey = p.title?.toLowerCase().trim() ?? null;
            return !(doiKey && knownPaperKeys.has(doiKey)) && !(titleKey && knownPaperKeys.has(titleKey));
          })
        : fetched;
      setRelatedPapers(filtered);
    } catch {
      setRelatedError("Failed to load related papers.");
    } finally {
      setRelatedLoading(false);
    }
  };

  return (
    <div>
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
                className="text-sm font-medium text-slate-100 light:text-[#2C1810] hover:text-blue-400 light:hover:text-[#8B2500] transition-colors leading-snug break-words"
              >
                {paper.title ?? "Untitled"}
              </a>
            ) : (
              <span className="text-sm font-medium text-slate-100 light:text-[#2C1810] leading-snug break-words">
                {paper.title ?? "Untitled"}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            {paper.source && (
              <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                paper.source === "Semantic Scholar"
                  ? "bg-purple-500/15 text-purple-400 light:bg-[rgba(75,20,95,0.10)] light:text-[#4B1460]"
                  : "bg-white/10 light:bg-[rgba(44,24,16,0.08)] text-slate-300 light:text-[#4A2E1A]"
              }`}>
                {paper.source === "Semantic Scholar" ? "S2" : "OA"}
              </span>
            )}
            <ScoreBadge score={paper.relevanceScore} />
          </div>
        </div>

        {/* authors · year */}
        {authorYearMeta && (
          <p className="mt-1.5 text-xs text-slate-400 light:text-[#6B4226] break-words">{authorYearMeta}</p>
        )}

        {/* journal */}
        {paper.journal && (
          <p className="mt-0.5 text-xs text-slate-500 light:text-[#6B4226] italic truncate" title={paper.journal}>
            {paper.journal}
          </p>
        )}

        {/* stat badges */}
        <PaperStatBadges paper={paper} />

        {/* relevance explanation */}
        <p className="mt-2 text-xs text-slate-500 light:text-[#6B4226] italic leading-relaxed">
          {paper.relevanceExplanation}
        </p>

        <div className="mt-2 flex items-center gap-3">
          <CitationMenu paper={paper} />
          <div className="relative">
            <button
              type="button"
              onClick={isPro ? handleFindRelated : () => setShowProGate((v) => !v)}
              disabled={isPro && relatedLoading}
              className={`inline-flex items-center gap-1 text-xs transition-colors disabled:opacity-50 ${
                isPro
                  ? "text-slate-500 light:text-[#8B2500] hover:text-slate-300 light:hover:text-[#6B1C00]"
                  : "text-slate-600 light:text-[#A67856] opacity-60"
              }`}
            >
              {isPro ? (
                relatedLoading ? (
                  <svg className="h-3 w-3 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden>
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                ) : (
                  <svg className="h-3 w-3" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
                    <circle cx="8" cy="8" r="5"/>
                    <path strokeLinecap="round" d="M13 13l3 3"/>
                    <path strokeLinecap="round" d="M8 6v4M6 8h4"/>
                  </svg>
                )
              ) : (
                <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                  <path d="M7 11V7a5 5 0 0110 0v4"/>
                </svg>
              )}
              {isPro
                ? (relatedLoading ? "Searching…" : relatedOpen && relatedPapers !== null ? "Hide related" : "Find more like this")
                : "Find more like this"}
              {!isPro && <ProBadge />}
            </button>
            <AnimatePresence>
              {showProGate && !isPro && (
                <ProGatePopover
                  isSignedIn={isSignedIn}
                  onUpgrade={onUpgrade ?? (() => {})}
                  onClose={() => setShowProGate(false)}
                />
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>

      {/* related papers expandable section */}
      <AnimatePresence>
        {relatedOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
            className="overflow-hidden"
          >
            <div className="mt-1 ml-3 border-l-2 border-white/[0.08] light:border-[rgba(44,24,16,0.12)] pl-3">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-500 light:text-[#8B5E3C]">
                  Related papers
                </p>
                <button
                  type="button"
                  onClick={() => setRelatedOpen(false)}
                  className="inline-flex items-center gap-0.5 text-[10px] text-slate-600 light:text-[#A67856] hover:text-slate-400 light:hover:text-[#8B5E3C] transition-colors"
                  aria-label="Collapse related papers"
                >
                  <svg className="h-3 w-3" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.5l11-11M15.5 15.5l-11-11" />
                  </svg>
                  Collapse
                </button>
              </div>
              {relatedLoading && (
                <div className="flex items-center gap-2 py-2">
                  <svg className="h-3.5 w-3.5 animate-spin text-slate-500 light:text-[#8B5E3C] shrink-0" viewBox="0 0 24 24" fill="none" aria-hidden>
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                  <span className="text-xs text-slate-500 light:text-[#8B5E3C]">Searching for related papers…</span>
                </div>
              )}
              {relatedError && (
                <p className="text-xs text-red-400 py-2">{relatedError}</p>
              )}
              {!relatedLoading && relatedPapers !== null && (() => {
                const visible = relatedPapers.filter((p) => paperInRange(p.year, yearFilter));
                const hidden = relatedPapers.length - visible.length;
                if (relatedPapers.length === 0) return (
                  <p className="text-xs text-slate-500 light:text-[#8B5E3C] py-2">No related papers found.</p>
                );
                if (visible.length === 0) return (
                  <p className="text-xs text-slate-500 light:text-[#8B5E3C] py-2">
                    No related papers match the selected date filter.
                    {hidden > 0 && <span className="ml-1 text-slate-600 light:text-[#A67856]">({hidden} hidden)</span>}
                  </p>
                );
                return (
                  <div className="flex flex-col gap-2">
                    {visible.map((rp, i) => (
                      <RelatedPaperCard key={rp.doi ?? rp.title ?? i} paper={rp} index={i} />
                    ))}
                    {hidden > 0 && (
                      <p className="text-[11px] text-slate-600 light:text-[#A67856] pt-0.5">
                        {hidden} older paper{hidden !== 1 ? "s" : ""} hidden by date filter.
                      </p>
                    )}
                  </div>
                );
              })()}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── related paper card (no relevance score, no nested find-more) ──────────────

function RelatedPaperCard({ paper, index = 0 }: { paper: Paper; index?: number }) {
  const authorLine =
    paper.authors.length === 0
      ? null
      : paper.authors.length <= 3
        ? paper.authors.join(", ")
        : `${paper.authors[0]}, et al.`;
  const authorYearMeta = [authorLine, paper.year].filter(Boolean).join(" · ");

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, delay: index * 0.06, ease: [0.25, 0.1, 0.25, 1] }}
      className="paper-card rounded-md border p-3 bg-white/[0.03] light:bg-[rgba(44,24,16,0.03)] border-white/[0.08] light:border-[rgba(44,24,16,0.12)]"
    >
      {/* title row */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          {paper.doi ? (
            <a
              href={doiUrl(paper.doi) ?? paper.doi}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-medium text-slate-100 light:text-[#2C1810] hover:text-blue-400 light:hover:text-[#8B2500] transition-colors leading-snug break-words"
            >
              {paper.title ?? "Untitled"}
            </a>
          ) : (
            <span className="text-sm font-medium text-slate-100 light:text-[#2C1810] leading-snug break-words">
              {paper.title ?? "Untitled"}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {paper.source && (
            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
              paper.source === "Semantic Scholar"
                ? "bg-purple-500/15 text-purple-400 light:bg-[rgba(75,20,95,0.10)] light:text-[#4B1460]"
                : "bg-white/10 light:bg-[rgba(44,24,16,0.08)] text-slate-300 light:text-[#4A2E1A]"
            }`}>
              {paper.source === "Semantic Scholar" ? "S2" : "OA"}
            </span>
          )}
          <span className="shrink-0 inline-flex items-center gap-1 rounded-full border border-transparent px-2 py-0.5 text-xs font-medium bg-slate-500/15 text-slate-400 light:bg-[rgba(44,24,16,0.08)] light:text-[#5A3820]">
            Related
          </span>
        </div>
      </div>

      {/* authors · year */}
      {authorYearMeta && (
        <p className="mt-1.5 text-xs text-slate-400 light:text-[#6B4226] break-words">{authorYearMeta}</p>
      )}

      {/* journal */}
      {paper.journal && (
        <p className="mt-0.5 text-xs text-slate-500 light:text-[#6B4226] italic truncate" title={paper.journal}>
          {paper.journal}
        </p>
      )}

      {/* stat badges */}
      <PaperStatBadges paper={paper} />

      <div className="mt-2">
        <CitationMenu paper={paper} />
      </div>
    </motion.div>
  );
}

// ── recency filter bar ────────────────────────────────────────────────────────

function RecencyFilter({
  value,
  onChange,
  isPro = false,
  isSignedIn = false,
  onUpgrade,
}: {
  value: YearFilter;
  onChange: (f: YearFilter) => void;
  isPro?: boolean;
  isSignedIn?: boolean;
  onUpgrade?: () => void;
}) {
  const [showProGate, setShowProGate] = useState(false);

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-widest text-slate-500 light:text-[#8B5E3C] shrink-0">
        <svg className="h-3 w-3" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
          <rect x="3" y="4" width="14" height="13" rx="2"/>
          <path strokeLinecap="round" d="M3 8h14M7 2v4M13 2v4"/>
        </svg>
        Published
        {!isPro && <ProBadge />}
      </span>
      <div className={`relative flex items-center gap-1 flex-wrap ${!isPro ? "opacity-60" : ""}`} role="group" aria-label="Filter papers by publication date">
        {YEAR_FILTERS.map(({ id, label }) => {
          const active = value === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => isPro ? onChange(id) : setShowProGate((v) => !v)}
              aria-pressed={active}
              className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors ${
                active && isPro
                  ? "bg-white/[0.12] border-white/20 text-slate-200 light:bg-[rgba(44,24,16,0.10)] light:border-[rgba(44,24,16,0.22)] light:text-[#2C1810]"
                  : "border-transparent text-slate-500 light:text-[#8B5E3C] hover:bg-white/[0.06] light:hover:bg-[rgba(44,24,16,0.05)] hover:text-slate-300 light:hover:text-[#4A2E1A]"
              }`}
            >
              {label}
            </button>
          );
        })}
        <AnimatePresence>
          {showProGate && !isPro && (
            <ProGatePopover
              isSignedIn={isSignedIn}
              onUpgrade={onUpgrade ?? (() => {})}
              onClose={() => setShowProGate(false)}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ── claim card ────────────────────────────────────────────────────────────────

function ClaimCard({
  result,
  index,
  knownPaperKeys,
  onUsageUpdate,
  yearFilter = "all",
  isPro = false,
  isSignedIn = false,
  onUpgrade,
}: {
  result: ClaimResult;
  index: number;
  knownPaperKeys?: Set<string>;
  onUsageUpdate?: (remaining: number) => void;
  yearFilter?: YearFilter;
  isPro?: boolean;
  isSignedIn?: boolean;
  onUpgrade?: () => void;
}) {
  const visiblePapers = result.papers.filter((p) => paperInRange(p.year, yearFilter));
  const hiddenCount = result.papers.length - visiblePapers.length;

  const topScore = visiblePapers.length > 0
    ? Math.max(...visiblePapers.map((p) => p.relevanceScore))
    : 0;
  const accentClass =
    topScore >= 5 ? "border-l-green-500/60 light:border-l-[rgba(30,70,32,0.55)]" :
    topScore >= 4 ? "border-l-blue-500/55 light:border-l-[rgba(42,48,112,0.50)]" :
    visiblePapers.length > 0 ? "border-l-amber-500/50 light:border-l-[rgba(107,58,0,0.45)]" :
    "border-l-white/15 light:border-l-[rgba(44,24,16,0.2)]";

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: index * 0.1, ease: [0.25, 0.1, 0.25, 1] }}
      className={`claim-card rounded-xl border border-white/10 light:border-[rgba(80,50,20,0.1)] border-l-2 ${accentClass} bg-white/[0.03] light:bg-[rgba(44,24,16,0.025)] backdrop-blur-sm`}
    >
      {/* claim header */}
      <div className="bg-white/[0.04] light:bg-[rgba(44,24,16,0.03)] border-b border-white/10 light:border-[rgba(80,50,20,0.1)] px-5 py-4 rounded-t-xl overflow-hidden">
        <div className="flex items-center gap-2 mb-2">
          <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-white/15 light:bg-[rgba(44,24,16,0.1)] text-white light:text-[#2C1810] text-xs font-medium shrink-0">
            {index + 1}
          </span>
          <span className="text-xs font-medium text-slate-500 light:text-[#6B4226] uppercase tracking-wide">Claim</span>
        </div>
        <p className="text-sm font-medium text-slate-100 light:text-[#2C1810] leading-relaxed">
          &ldquo;{result.claim}&rdquo;
        </p>
      </div>

      {/* papers */}
      <div className="px-5 py-4">
        {result.papers.length === 0 ? (
          <p className="text-xs text-slate-500 light:text-[#6B4226]">
            No relevant papers found for this claim.
          </p>
        ) : visiblePapers.length === 0 ? (
          <p className="text-xs text-slate-500 light:text-[#6B4226]">
            No papers match the selected date filter.
            {hiddenCount > 0 && (
              <span className="ml-1 text-slate-600 light:text-[#A67856]">
                ({hiddenCount} paper{hiddenCount !== 1 ? "s" : ""} hidden)
              </span>
            )}
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            {visiblePapers.map((paper, i) => (
              <PaperCard key={paper.doi ?? i} paper={paper} index={i} knownPaperKeys={knownPaperKeys} onUsageUpdate={onUsageUpdate} yearFilter={yearFilter} isPro={isPro} isSignedIn={isSignedIn} onUpgrade={onUpgrade} />
            ))}
            {hiddenCount > 0 && (
              <p className="text-[11px] text-slate-600 light:text-[#A67856] pt-0.5">
                {hiddenCount} older paper{hiddenCount !== 1 ? "s" : ""} hidden by date filter.
              </p>
            )}
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
      className="parchment-pill flex items-center justify-center w-8 h-8 rounded-xl border border-white/15 light:border-[rgba(80,50,20,0.18)] bg-white/10 light:bg-[rgba(248,246,234,0.92)] hover:bg-white/15 light:hover:bg-[rgba(240,238,218,0.95)] backdrop-blur-sm transition-colors"
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

// ── user menu (floating, top-right) ───────────────────────────────────────────

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
        className="parchment-pill flex items-center gap-2 rounded-xl border border-white/15 light:border-[rgba(80,50,20,0.18)] bg-white/10 light:bg-[rgba(248,246,234,0.92)] backdrop-blur-sm px-2.5 py-1.5 hover:bg-white/15 light:hover:bg-[rgba(240,238,218,0.95)] transition-colors"
        aria-haspopup="true"
        aria-expanded={open}
      >
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={image} alt={name} width={24} height={24} className="h-6 w-6 rounded-full object-cover" />
        ) : (
          <span className="h-6 w-6 rounded-full bg-white/15 light:bg-[rgba(44,24,16,0.1)] text-white light:text-[#4A2E1A] text-xs font-medium flex items-center justify-center">
            {initials}
          </span>
        )}
        <span className="text-sm font-medium text-slate-200 light:text-[#2C1810] max-w-[120px] truncate hidden sm:block">
          {firstName}
        </span>
        <svg className={`h-3.5 w-3.5 text-slate-400 light:text-[#8B5E3C] transition-transform ${open ? "rotate-180" : ""}`} viewBox="0 0 20 20" fill="currentColor" aria-hidden>
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
            className="absolute right-0 mt-1.5 w-44 rounded-xl border border-white/[0.10] light:border-[rgba(80,50,20,0.14)] bg-[#141828] light:bg-[rgba(248,246,234,1)] shadow-xl py-1 z-50"
            role="menu"
          >
            <div className="px-3 py-2 border-b border-white/[0.08] light:border-[rgba(80,50,20,0.09)]">
              <p className="text-xs font-medium text-slate-100 light:text-[#2C1810] truncate">{name}</p>
              {session.user?.email && (
                <p className="text-xs text-slate-400 light:text-[#8B5E3C] truncate">{session.user.email}</p>
              )}
            </div>
            <button
              onClick={() => { setOpen(false); onOpenHistory(); }}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-slate-300 light:text-[#4A2E1A] hover:bg-white/[0.06] light:hover:bg-[rgba(44,24,16,0.05)] transition-colors"
              role="menuitem"
            >
              <svg className="h-4 w-4 text-slate-500 light:text-[#A67856]" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-13a.75.75 0 00-1.5 0v5c0 .414.336.75.75.75h4a.75.75 0 000-1.5h-3.25V5z" clipRule="evenodd"/>
              </svg>
              History
            </button>
            <button
              onClick={() => signOut()}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-slate-300 light:text-[#4A2E1A] hover:bg-white/[0.06] light:hover:bg-[rgba(44,24,16,0.05)] transition-colors"
              role="menuitem"
            >
              <svg className="h-4 w-4 text-slate-500 light:text-[#A67856]" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
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
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 light:border-[rgba(80,50,20,0.1)] shrink-0">
              <h2 id="how-to-use-title" className="font-semibold text-slate-100 light:text-[#2C1810] text-base">
                How it works
              </h2>
              <button
                onClick={onClose}
                className="p-1.5 rounded-md text-slate-500 light:text-[#A67856] hover:text-slate-200 light:hover:text-[#4A2E1A] hover:bg-white/10 light:hover:bg-black/[0.06] transition-colors"
                aria-label="Close"
              >
                <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
                  <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z"/>
                </svg>
              </button>
            </div>

            {/* body */}
            <div className="px-6 py-5 space-y-5 overflow-y-auto">
              <p className="text-sm text-slate-400 light:text-[#6B4226] leading-relaxed">
                Paste any academic paragraph and Reference Finder automatically finds citations for it — no searching required. It identifies each factual claim, queries OpenAlex and Semantic Scholar in parallel, and returns ranked papers with one-click APA citations.
              </p>

              {/* steps */}
              <div>
                <p className="text-xs font-medium text-slate-500 light:text-[#6B4226] uppercase tracking-wide mb-2.5">How it works</p>
                <ol className="space-y-3">
                  {[
                    { icon: "1", text: "Paste any paragraph containing factual claims — research writing, essay drafts, literature reviews, or anything that needs citations." },
                    { icon: "2", text: "Claude scans your text and extracts each individual claim that would benefit from academic backing." },
                    { icon: "3", text: "Each claim is searched against OpenAlex and Semantic Scholar in parallel, covering 250 million+ real academic works across all fields." },
                    { icon: "4", text: "Results are rated for relevance and ranked. Copy any paper's APA citation with one click." },
                  ].map(({ icon, text }) => (
                    <li key={icon} className="flex items-start gap-3">
                      <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-white/15 light:bg-[rgba(44,24,16,0.1)] text-slate-100 light:text-[#2C1810] text-xs font-medium shrink-0 mt-0.5">
                        {icon}
                      </span>
                      <p className="text-sm text-slate-400 light:text-[#6B4226] leading-relaxed">{text}</p>
                    </li>
                  ))}
                </ol>
              </div>

              {/* paper badges */}
              <div className="rounded-xl border border-white/10 light:border-[rgba(80,50,20,0.1)] bg-white/[0.04] light:bg-[rgba(44,24,16,0.03)] px-4 py-3 space-y-2">
                <p className="text-xs font-medium text-slate-500 light:text-[#6B4226] uppercase tracking-wide">Paper stat badges</p>
                <p className="text-xs text-slate-500 light:text-[#6B4226] leading-relaxed">
                  Each paper card shows stat badges that help you judge paper quality at a glance. Higher numbers on all of these mean a stronger, more reputable paper.
                </p>
                <div className="flex flex-col gap-2">
                  <div className="flex items-start gap-2.5">
                    <span className="text-orange-400 text-sm shrink-0 leading-none mt-0.5">🔥</span>
                    <span className="text-xs text-slate-300 light:text-[#4A2E1A]"><strong className="text-orange-400 light:text-[#7A2000]">Flame — total citations.</strong> How many times this paper has been cited. Glows orange when ≥ 500, signalling a highly cited work.</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <span className="text-violet-400 text-sm shrink-0 leading-none mt-0.5">★</span>
                    <span className="text-xs text-slate-300 light:text-[#4A2E1A]"><strong className="text-violet-400 light:text-[#4B1460]">Star — influential citations.</strong> Citations that actually mattered — papers that meaningfully built on this work, as identified by Semantic Scholar.</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <span className="text-sky-400 text-sm shrink-0 leading-none mt-0.5">▦</span>
                    <span className="text-xs text-slate-300 light:text-[#4A2E1A]"><strong className="text-sky-400 light:text-[#0F3264]">Bar chart — journal h-index.</strong> Measures journal prestige: a journal with h-index 50 has published at least 50 papers each cited at least 50 times.</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <span className="text-teal-400 text-sm shrink-0 leading-none mt-0.5">IF</span>
                    <span className="text-xs text-slate-300 light:text-[#4A2E1A]"><strong className="text-teal-400 light:text-[#004B46]">IF — impact factor proxy.</strong> The 2-year mean citedness from OpenAlex: the average number of times recent articles in this journal were cited over the past two years. This is a free, openly computed equivalent of the traditional Impact Factor. Only shown for OpenAlex sources where data is available.</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <span className="text-emerald-400 text-sm shrink-0 leading-none mt-0.5">📖</span>
                    <span className="text-xs text-slate-300 light:text-[#4A2E1A]"><strong className="text-emerald-400 light:text-[#0A3C19]">Book — research field.</strong> The subject area or discipline the paper belongs to. Only shown when available.</span>
                  </div>
                </div>
              </div>

              {/* relevance tiers */}
              <div className="rounded-xl border border-white/10 light:border-[rgba(80,50,20,0.1)] bg-white/[0.04] light:bg-[rgba(44,24,16,0.03)] px-4 py-3 space-y-2">
                <p className="text-xs font-medium text-slate-500 light:text-[#6B4226] uppercase tracking-wide">Relevance tiers</p>
                <p className="text-xs text-slate-500 light:text-[#6B4226] leading-relaxed">
                  Papers are ranked by relevance with three color-coded tiers.
                </p>
                <div className="flex flex-col gap-2">
                  <div className="flex items-start gap-2.5">
                    <span className="inline-block w-2.5 h-2.5 rounded-full bg-green-400 shrink-0 mt-0.5" />
                    <span className="text-xs text-slate-300 light:text-[#4A2E1A]"><strong className="text-green-400 light:text-[#1E4620]">Direct</strong> — the paper directly supports the claim.</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <span className="inline-block w-2.5 h-2.5 rounded-full bg-blue-400 shrink-0 mt-0.5" />
                    <span className="text-xs text-slate-300 light:text-[#4A2E1A]"><strong className="text-blue-400 light:text-[#2A3070]">High</strong> — closely related and useful context for the claim.</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <span className="inline-block w-2.5 h-2.5 rounded-full bg-amber-400 shrink-0 mt-0.5" />
                    <span className="text-xs text-slate-300 light:text-[#4A2E1A]"><strong className="text-amber-400 light:text-[#6B3A00]">Moderate</strong> — touches on the topic but is not a direct match.</span>
                  </div>
                </div>
              </div>

              {/* good to know */}
              <div className="space-y-2.5">
                <p className="text-xs font-medium text-slate-500 light:text-[#6B4226] uppercase tracking-wide">Good to know</p>
                <div className="flex items-start gap-2.5">
                  <span className="text-base shrink-0 leading-none">🌐</span>
                  <p className="text-xs text-slate-400 light:text-[#4A2E1A] leading-relaxed">
                    <strong className="text-slate-200 light:text-[#2C1810]">Any language.</strong> Paste paragraphs in any language — the app will find English-language papers for your claims.
                  </p>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="text-base shrink-0 leading-none">🔢</span>
                  <p className="text-xs text-slate-400 light:text-[#4A2E1A] leading-relaxed">
                    <strong className="text-slate-200 light:text-[#2C1810]">10 free searches per day.</strong> The counter resets at midnight UTC and is tracked by a secure signed cookie.
                  </p>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="text-base shrink-0 leading-none">👤</span>
                  <p className="text-xs text-slate-400 light:text-[#4A2E1A] leading-relaxed">
                    <strong className="text-slate-200 light:text-[#2C1810]">Sign in or continue as guest.</strong> Sign in with Google to save your search history across sessions, or use the app as a guest — history is still saved in your browser.
                  </p>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="text-base shrink-0 leading-none">💡</span>
                  <p className="text-xs text-slate-400 light:text-[#4A2E1A] leading-relaxed">
                    <strong className="text-slate-200 light:text-[#2C1810]">Try an example.</strong> Not sure where to start? Click the button below the text box to load a sample paragraph. Click again for a different field.
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
          className="pointer-events-auto w-full max-w-md"
          role="dialog"
          aria-modal="true"
          aria-labelledby="plan-modal-title"
        >
          <div className="glass-panel rounded-2xl shadow-2xl border overflow-hidden flex flex-col max-h-[calc(100vh-2rem)]">
            {/* header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 light:border-[rgba(80,50,20,0.1)] shrink-0">
              <div>
                <h2 id="plan-modal-title" className="font-semibold text-slate-100 light:text-[#2C1810] text-base">
                  Upgrade to Pro
                </h2>
                <p className="text-xs text-slate-500 light:text-[#6B4226] mt-0.5">Everything you need for serious research.</p>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-md text-slate-500 light:text-[#A67856] hover:text-slate-200 light:hover:text-[#4A2E1A] hover:bg-white/10 light:hover:bg-black/[0.06] transition-colors"
                aria-label="Close"
              >
                <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
                  <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z"/>
                </svg>
              </button>
            </div>

            <div className="overflow-y-auto">
              {/* feature list */}
              <div className="px-6 pt-5 pb-4">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-500 light:text-[#8B5E3C] mb-3">
                  What you unlock
                </p>
                <ul className="grid grid-cols-2 gap-x-4 gap-y-2.5">
                  {([
                    ["Unlimited searches", "3/day on free"],
                    ["10,000 char limit", "1,000 on free"],
                    ["Document upload", "PDFs, Word, images"],
                    ["Omakase mode", "Auto-rewrite with citations"],
                    ["Export results", "BibTeX, RIS, plain text"],
                    ["Date filter", "Narrow by publication year"],
                    ["Find more like this", "Discover related papers"],
                    ["All future features", "Included automatically"],
                  ] as [string, string][]).map(([title, sub]) => (
                    <li key={title} className="flex items-start gap-2">
                      <span className="mt-0.5 shrink-0 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500/15 light:bg-emerald-700/10">
                        <svg className="h-2.5 w-2.5 text-emerald-400 light:text-emerald-700" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                          <polyline points="2 6 5 9 10 3"/>
                        </svg>
                      </span>
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-slate-200 light:text-[#2C1810] leading-tight">{title}</p>
                        <p className="text-[10px] text-slate-500 light:text-[#8B5E3C] leading-tight mt-0.5">{sub}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>

              {/* divider */}
              <div className="mx-6 border-t border-white/[0.07] light:border-[rgba(80,50,20,0.09)]" />

              {/* plan cards */}
              <div className="px-6 py-4 flex flex-col gap-3">
                {/* Monthly */}
                <button
                  onClick={() => onSelectPlan("monthly")}
                  disabled={upgrading}
                  className="w-full text-left rounded-xl border-2 border-white/15 light:border-[rgba(80,50,20,0.15)] px-4 py-4 hover:border-white/30 light:hover:border-[rgba(80,50,20,0.28)] hover:bg-white/[0.05] light:hover:bg-black/[0.04] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-slate-100 light:text-[#2C1810]">Monthly</p>
                      <p className="text-xs text-slate-500 light:text-[#6B4226] mt-0.5">Billed every month</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-slate-100 light:text-[#2C1810]">¥849</p>
                      <p className="text-xs text-slate-500 light:text-[#6B4226]">/ month</p>
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
                      <p className="text-lg font-bold text-amber-300 light:text-amber-700">¥8,490</p>
                      <p className="text-xs text-amber-500 light:text-amber-600">/ year</p>
                    </div>
                  </div>
                </button>

                {upgrading && (
                  <p className="text-center text-xs text-slate-500 pt-1">Redirecting to checkout…</p>
                )}
              </div>
            </div>
          </div>
        </motion.div>
        </div>
      </>
    </AnimatePresence>
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
  const [yearFilter, setYearFilter] = useState<YearFilter>("all");

  // Keys of all papers already shown in the main results — used to deduplicate related papers
  const knownPaperKeys = useMemo(() => {
    const keys = new Set<string>();
    for (const r of results) {
      for (const p of r.papers) {
        const doi = p.doi ? p.doi.replace(/^https?:\/\/doi\.org\//i, "").toLowerCase() : null;
        if (doi) keys.add(doi);
        if (p.title) keys.add(p.title.toLowerCase().trim());
      }
    }
    return keys;
  }, [results]);

  // Flat deduplicated list of all papers across claims — used for bulk export
  const allPapers = useMemo(() => {
    const seen = new Set<string>();
    const out: Paper[] = [];
    for (const r of results) {
      for (const p of r.papers) {
        const doi = p.doi ? p.doi.replace(/^https?:\/\/doi\.org\//i, "").toLowerCase() : null;
        const key = doi ?? p.title?.toLowerCase().trim();
        if (!key || seen.has(key)) continue;
        seen.add(key);
        out.push(p);
      }
    }
    return out;
  }, [results]);
  const [error, setError] = useState("");

  // History sidebar
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  // Modals
  const [showHowTo, setShowHowTo] = useState(false);

  // Usage counter — default to full allowance so counter is visible immediately
  const [usage, setUsage] = useState({ count: 0, remaining: 3, limit: 3 });
  const [isPro, setIsPro] = useState(false);
  const [proSuccess, setProSuccess] = useState(false);
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [upgrading, setUpgrading] = useState(false);
  const [showUpgradeHint, setShowUpgradeHint] = useState(false);
  const [showOmakaseGate, setShowOmakaseGate] = useState(false);
  const [showOmakasePicker, setShowOmakasePicker] = useState(false);
  const [omakaseLoading, setOmakaseLoading] = useState<{ style: OmakaseStyleId; label: string } | null>(null);
  const [omakaseResult, setOmakaseResult] = useState<{ rewritten_paragraph: string; reference_list: string[]; label: string } | null>(null);
  const [omakaseError, setOmakaseError] = useState<string | null>(null);
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
    // Check Stripe subscription status on every app load so Pro access survives
    // sign-out / sign-in cycles. The route reads the email from the server-side
    // session and re-sets the Pro cookie if an active subscription is found.
    apiFetch<{ pro: boolean }>("/api/check-subscription").then(({ data }) => {
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

  // Auto-dismiss the Pro success banner after 5 seconds
  useEffect(() => {
    if (!proSuccess) return;
    const t = setTimeout(() => setProSuccess(false), 5000);
    return () => clearTimeout(t);
  }, [proSuccess]);

  const openHistory = () => {
    setHistory(lsGetHistory());
    setShowHistory(true);
  };

  const clearHistory = () => {
    lsClearHistory();
    setHistory([]);
    setShowClearConfirm(false);
  };

  const loadHistoryEntry = (entry: HistoryEntry) => {
    setText(entry.paragraph);
    setCurrentClaims(entry.claims);
    setResults(entry.results);
    setError("");
    setShowHistory(false);
  };

  const isSignedIn = !!session?.user;
  const handleUpgradeClick = () => {
    if (isSignedIn) setShowPlanModal(true);
    else signIn();
  };

  const charLimit = isPro ? PRO_CHAR_LIMIT : FREE_CHAR_LIMIT;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setLoading(true);
    setError("");
    setResults([]);
    setCurrentClaims([]);
    setYearFilter("all");

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

  const greeting = useMemo(
    () => session?.user?.name ? pickGreeting(session.user.name.split(" ")[0]) : null,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [session?.user?.name]
  );

  const hasActivity = loading || error !== "" || results.length > 0;
  const isCentered = !ready && !hasActivity;

  return (
    <>
      {/* ── how to use modal ── */}
      {showHowTo && <HowToUseModal onClose={() => setShowHowTo(false)} />}

      {/* ── omakase citation style picker ── */}
      <AnimatePresence>
        {showOmakasePicker && (
          <OmakaseCitationPicker
            onSelect={async (style) => {
              const entry = OMAKASE_STYLES.find((s) => s.id === style)!;
              setShowOmakasePicker(false);
              setOmakaseLoading({ style, label: entry.label });
              setOmakaseError(null);

              // Collect all rated papers across every claim result
              const allRatedPapers = (() => {
                const seen = new Set<string>();
                const out: import("@/lib/rate-relevance").RatedPaper[] = [];
                for (const r of results) {
                  for (const p of r.papers) {
                    const doi = p.doi?.replace(/^https?:\/\/doi\.org\//i, "").toLowerCase() ?? null;
                    const key = doi ?? p.title?.toLowerCase().trim();
                    if (!key || seen.has(key)) continue;
                    seen.add(key);
                    out.push(p);
                  }
                }
                return out;
              })();

              try {
                const res = await fetch("/api/omakase", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    paragraph: text,
                    papers: allRatedPapers,
                    citationStyle: entry.label,
                  }),
                });
                const json = await res.json();
                if (!res.ok) {
                  setOmakaseError(json?.error ?? `Request failed (${res.status})`);
                } else {
                  setOmakaseResult({
                    rewritten_paragraph: json.rewritten_paragraph,
                    reference_list: json.reference_list ?? [],
                    label: entry.label,
                  });
                }
              } catch {
                setOmakaseError("Network error — please check your connection and try again.");
              } finally {
                setOmakaseLoading(null);
              }
            }}
            onClose={() => setShowOmakasePicker(false)}
          />
        )}
      </AnimatePresence>

      {/* ── omakase loading overlay ── */}
      <AnimatePresence>
        {omakaseLoading && (
          <OmakaseLoadingOverlay styleName={omakaseLoading.label} />
        )}
      </AnimatePresence>

      {/* ── omakase error toast ── */}
      <AnimatePresence>
        {omakaseError && (
          <motion.div
            key="omakase-error"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.18 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2.5 rounded-xl border border-red-500/25 bg-[#1a0a0a] light:bg-[#fdf2f2] px-4 py-3 shadow-2xl text-xs text-red-400 light:text-red-700 max-w-sm w-full"
          >
            <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            <span className="flex-1">{omakaseError}</span>
            <button
              type="button"
              onClick={() => setOmakaseError(null)}
              className="shrink-0 rounded p-0.5 hover:bg-red-500/10 transition-colors"
              aria-label="Dismiss"
            >
              <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

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
              className="fixed top-0 right-0 h-full w-full max-w-[380px] z-50 flex flex-col bg-[#0e1120] light:bg-[#EAE9C8] border-l border-white/[0.08] light:border-[rgba(80,50,20,0.12)] shadow-[-8px_0_32px_rgba(0,0,0,0.45)] light:shadow-[-8px_0_32px_rgba(80,50,20,0.12)]"
              role="complementary"
              aria-label="Search history"
            >
              {/* Header */}
              <div className="border-b border-white/[0.08] light:border-[rgba(80,50,20,0.09)] shrink-0">
                {/* Title row */}
                <div className="flex items-center justify-between px-5 pt-5 pb-4">
                  <div>
                    <h2 className="text-base font-bold text-slate-100 light:text-[#2C1810] tracking-tight">
                      Search History
                    </h2>
                    <p className="text-xs text-slate-500 light:text-[#8B5E3C] mt-0.5">
                      {history.length === 0
                        ? "No searches yet"
                        : `${history.length} search${history.length !== 1 ? "es" : ""}`}
                    </p>
                  </div>

                  {/* Close button — prominent X in top-right */}
                  <button
                    onClick={() => { setShowHistory(false); setShowClearConfirm(false); }}
                    className="flex items-center justify-center w-8 h-8 rounded-lg text-slate-400 light:text-[#8B5E3C] hover:text-slate-100 light:hover:text-[#2C1810] hover:bg-white/[0.10] light:hover:bg-black/[0.07] transition-colors"
                    aria-label="Close history"
                  >
                    <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
                      <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z"/>
                    </svg>
                  </button>
                </div>

                {/* Clear all row — only shown when history exists */}
                {history.length > 0 && (
                  <div className="px-5 pb-3">
                    {showClearConfirm ? (
                      /* Confirmation prompt */
                      <div className="flex items-center justify-between rounded-lg bg-red-500/[0.09] light:bg-red-50 border border-red-500/20 light:border-red-200 px-3 py-2">
                        <span className="text-xs text-red-400 light:text-red-600 font-medium">
                          Delete all history?
                        </span>
                        <div className="flex items-center gap-2 ml-3">
                          <button
                            onClick={clearHistory}
                            className="px-2.5 py-1 rounded-md text-xs font-semibold bg-red-500/20 light:bg-red-100 text-red-400 light:text-red-600 hover:bg-red-500/30 light:hover:bg-red-200 transition-colors"
                          >
                            Delete
                          </button>
                          <button
                            onClick={() => setShowClearConfirm(false)}
                            className="px-2.5 py-1 rounded-md text-xs font-medium text-slate-400 light:text-[#8B5E3C] hover:text-slate-200 light:hover:text-[#4A2E1A] hover:bg-white/[0.08] light:hover:bg-[rgba(44,24,16,0.05)] transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => setShowClearConfirm(true)}
                        className="inline-flex items-center gap-1.5 text-xs font-medium text-rose-400/70 light:text-rose-600/70 hover:text-rose-400 light:hover:text-rose-600 transition-colors group"
                      >
                        <svg className="h-3.5 w-3.5 opacity-70 group-hover:opacity-100 transition-opacity" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
                          <path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.52.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4zM8.58 7.72a.75.75 0 00-1.5.06l.3 7.5a.75.75 0 101.5-.06l-.3-7.5zm4.34.06a.75.75 0 10-1.5-.06l-.3 7.5a.75.75 0 101.5.06l.3-7.5z" clipRule="evenodd"/>
                        </svg>
                        Clear all
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Entry list */}
              <div className="flex-1 overflow-y-auto px-4 py-4">
                {history.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <svg className="h-8 w-8 text-slate-600 light:text-[#A67856] mb-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                    <p className="text-sm font-medium text-slate-500 light:text-[#8B5E3C]">No searches yet</p>
                    <p className="text-xs text-slate-600 light:text-[#A67856] mt-1">Your analyses will appear here</p>
                  </div>
                ) : (
                  <ul className="flex flex-col gap-2">
                    {history.map((entry) => (
                      <li key={entry.id}>
                        <button
                          onClick={() => loadHistoryEntry(entry)}
                          className="w-full text-left rounded-xl border border-white/[0.09] light:border-[rgba(80,50,20,0.12)] bg-[#161b2e] light:bg-[rgba(248,246,234,0.85)] px-4 py-4 transition-all duration-150 hover:bg-[#1d2440] light:hover:bg-[rgba(248,246,234,1)] hover:border-white/[0.18] light:hover:border-[rgba(80,50,20,0.2)] hover:shadow-[0_2px_12px_rgba(0,0,0,0.35)] light:hover:shadow-[0_2px_12px_rgba(80,50,20,0.1)] group"
                        >
                          {/* Preview — single line, truncates with ellipsis */}
                          <p className="text-sm font-medium text-slate-200 light:text-[#2C1810] truncate group-hover:text-white light:group-hover:text-[#2C1810] transition-colors">
                            {entry.paragraph}
                          </p>

                          {/* Metadata row */}
                          <div className="mt-2 flex items-center justify-between">
                            <div className="flex items-center gap-2 text-xs text-slate-500 light:text-[#8B5E3C]">
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
                            <svg className="h-3.5 w-3.5 text-slate-600 light:text-[#A67856] opacity-0 group-hover:opacity-100 -translate-x-1 group-hover:translate-x-0 transition-all duration-150 shrink-0" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
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
        className={`noise-overlay relative min-h-screen bg-[var(--page-bg)] px-4 sm:px-6 ${isCentered ? "flex items-center justify-center py-12" : "pt-20 pb-12 sm:pt-14 sm:pb-12"}`}
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
        {/* Floating top-right controls — visible when in the app stage */}
        <AnimatePresence>
          {stage === "app" && ready && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed top-4 right-4 z-30 flex items-center gap-2"
            >
              <ThemeToggle theme={theme} onToggle={toggleTheme} />

              {/* Upgrade to Pro / Pro badge — signed-in users only */}
              {session && (
                isPro ? (
                  <span className="parchment-pill flex items-center gap-1.5 rounded-xl border border-amber-500/30 light:border-amber-700/35 bg-amber-500/10 light:bg-[rgba(248,246,234,0.92)] backdrop-blur-sm px-2.5 py-1.5 text-sm font-medium text-amber-400 light:text-amber-700">
                    <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                    </svg>
                    Pro
                  </span>
                ) : (
                  <button
                    onClick={() => setShowPlanModal(true)}
                    disabled={upgrading}
                    className="parchment-pill flex items-center gap-1.5 rounded-xl border border-amber-500/30 light:border-amber-700/35 bg-amber-500/10 light:bg-[rgba(248,246,234,0.92)] backdrop-blur-sm px-2.5 py-1.5 hover:bg-amber-500/15 light:hover:bg-[rgba(240,238,218,0.95)] text-sm font-medium text-amber-400 light:text-amber-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                    </svg>
                    {upgrading ? "Redirecting…" : "Upgrade to Pro"}
                  </button>
                )
              )}

              {/* User menu (signed-in) or History + Sign in (guest) */}
              {session ? (
                <UserMenu session={session} onOpenHistory={openHistory} />
              ) : (
                <>
                  <button
                    onClick={openHistory}
                    className="parchment-pill flex items-center gap-1.5 rounded-xl border border-white/15 light:border-[rgba(80,50,20,0.18)] bg-white/10 light:bg-[rgba(248,246,234,0.92)] backdrop-blur-sm px-2.5 py-1.5 hover:bg-white/15 light:hover:bg-[rgba(240,238,218,0.95)] transition-colors text-sm font-medium text-slate-300 light:text-[#4A2E1A]"
                    aria-label="Open search history"
                  >
                    <svg className="h-4 w-4 text-slate-400 light:text-[#8B5E3C]" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-13a.75.75 0 00-1.5 0v5c0 .414.336.75.75.75h4a.75.75 0 000-1.5h-3.25V5z" clipRule="evenodd"/>
                    </svg>
                    <span className="hidden sm:inline">History</span>
                  </button>
                  <button
                    onClick={() => signIn("google")}
                    className="parchment-pill flex items-center gap-1.5 rounded-xl border border-white/15 light:border-[rgba(80,50,20,0.18)] bg-white/10 light:bg-[rgba(248,246,234,0.92)] backdrop-blur-sm px-2.5 py-1.5 hover:bg-white/15 light:hover:bg-[rgba(240,238,218,0.95)] transition-colors text-sm font-medium text-slate-200 light:text-[#4A2E1A]"
                  >
                    <svg className="h-4 w-4 text-slate-400 light:text-[#8B5E3C] shrink-0" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-5.5-2.5a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0zM10 12a5.99 5.99 0 00-4.793 2.39A6.483 6.483 0 0010 16.5a6.483 6.483 0 004.793-2.11A5.99 5.99 0 0010 12z" clipRule="evenodd"/>
                    </svg>
                    Sign in
                  </button>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <main className="relative z-10 mx-auto w-full max-w-2xl">
          <motion.div
            layout
            className={`${hasActivity ? "mb-5 text-left" : ready ? "mb-5 text-center" : "mb-0 text-center"}`}
          >
            <motion.h1
              layout
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: [0.25, 0.1, 0.25, 1] }}
              className="font-[family-name:var(--font-playfair)] text-4xl font-extrabold text-white light:text-[#2C1810] sm:text-5xl leading-tight tracking-tight light:letterpress-title"
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
                  className="mt-3 text-lg font-light text-slate-400 light:text-[#6B4226] tracking-wide sm:text-xl"
                >
                  Real papers, not hallucinated ones.
                </motion.p>
              )}

              {/* App subtitle — fades in after the tagline exits */}
              {ready && stage === "app" && (
                <motion.p
                  key="app-sub"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.15, ease: "easeOut" }}
                  className="mt-5 text-sm text-slate-400 light:text-[#4A2E1A]"
                >
                  {greeting ?? "Paste a paragraph to find academic citations for each factual claim."}
                </motion.p>
              )}
              {ready && stage === "auth" && (
                <motion.p
                  key="auth-sub"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.15, ease: "easeOut" }}
                  className="mt-5 text-sm text-slate-400 light:text-[#4A2E1A]"
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
                  <div className="flex-1 h-px bg-white/10 light:bg-[rgba(44,24,16,0.1)]" />
                  <span className="text-xs text-slate-500 light:text-[#6B4226]">or</span>
                  <div className="flex-1 h-px bg-white/10 light:bg-[rgba(44,24,16,0.1)]" />
                </div>

                <button
                  onClick={() => setStage("app")}
                  className="w-full max-w-xs rounded-xl border border-white/15 light:border-[rgba(80,50,20,0.12)] bg-white/8 light:bg-[rgba(44,24,16,0.05)] px-6 py-3 text-sm font-medium text-slate-300 light:text-[#4A2E1A] hover:bg-white/12 light:hover:bg-[rgba(44,24,16,0.07)] hover:text-white light:hover:text-[#2C1810] transition-colors"
                >
                  Continue as Guest
                </button>

                <button
                  type="button"
                  onClick={() => setShowHowTo(true)}
                  className="flex items-center gap-1.5 text-sm text-slate-500 light:text-[#6B4226] hover:text-slate-300 light:hover:text-slate-800 transition-colors mt-1"
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
                      className={`parchment-textarea w-full h-44 sm:h-48 rounded-xl border bg-white/[0.05] light:bg-[rgba(255,252,234,0.75)] backdrop-blur-md px-4 py-3 pb-7 text-sm text-slate-100 light:text-[#2C1810] placeholder-white/25 resize-none focus:outline-none focus:ring-1 focus:border-transparent transition-colors disabled:opacity-50 ${
                        !isPro && text.length >= FREE_CHAR_LIMIT
                          ? "border-red-500/40 focus:ring-red-500/40"
                          : "border-white/10 light:border-[rgba(80,50,20,0.15)] focus:ring-white/20 light:focus:ring-[rgba(80,50,20,0.2)]"
                      }`}
                      disabled={loading || extracting}
                    />
                    <span
                      className={`absolute bottom-2 right-3 text-xs tabular-nums ${
                        !isPro && text.length >= FREE_CHAR_LIMIT
                          ? "text-red-400 light:text-red-600 font-medium"
                          : charLimit - text.length <= (isPro ? 500 : 100)
                          ? "text-amber-400 light:text-amber-600"
                          : "text-slate-500 light:text-[#6B4226]"
                      }`}
                    >
                      {text.length.toLocaleString()}/{charLimit.toLocaleString()}
                    </span>
                  </div>

                  {/* Free-user limit warning */}
                  {!isPro && text.length >= FREE_CHAR_LIMIT && (
                    <p className="text-xs text-red-400 light:text-red-500">
                      Free accounts are limited to 1,000 characters.{" "}
                      {session ? (
                        <>
                          <button
                            type="button"
                            onClick={() => setShowPlanModal(true)}
                            className="underline underline-offset-2 hover:text-amber-400 transition-colors"
                          >
                            Upgrade to Pro
                          </button>{" "}
                          for up to 10,000 characters.
                        </>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={() => signIn()}
                            className="underline underline-offset-2 hover:text-amber-400 transition-colors"
                          >
                            Sign in
                          </button>{" "}
                          to unlock Pro features.
                        </>
                      )}
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
                          className="flex items-center gap-1.5 text-sm text-slate-400 light:text-[#6B4226] hover:text-slate-200 light:hover:text-[#2C1810] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
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
                                className="absolute left-0 top-full mt-2 z-20 w-64 rounded-xl border border-white/15 light:border-[rgba(80,50,20,0.16)] glass-panel shadow-xl px-4 py-3"
                              >
                                <p className="text-xs text-slate-300 light:text-[#4A2E1A] leading-relaxed">
                                  Uploading documents is a Pro feature.{" "}
                                  {session ? (
                                    <>
                                      <button
                                        type="button"
                                        onClick={() => { setShowUpgradeHint(false); setShowPlanModal(true); }}
                                        className="font-semibold text-amber-600 hover:text-amber-700 underline underline-offset-2"
                                      >
                                        Upgrade to Pro
                                      </button>{" "}
                                      to upload PDFs, Word docs, and images.
                                    </>
                                  ) : (
                                    <>
                                      <button
                                        type="button"
                                        onClick={() => { setShowUpgradeHint(false); signIn(); }}
                                        className="font-semibold text-amber-600 hover:text-amber-700 underline underline-offset-2"
                                      >
                                        Sign in
                                      </button>{" "}
                                      to unlock Pro features including file uploads.
                                    </>
                                  )}
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
                        className="link-example text-sm text-slate-500 light:text-[#8B2500] hover:text-slate-300 light:hover:text-[#6B1C00] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
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
                            : "bg-white/8 light:bg-[rgba(44,24,16,0.05)] text-slate-400 light:text-[#6B4226]"
                        }`}>
                          {usage.remaining}/3 searches left today
                        </span>
                      )}
                      <button
                        type="submit"
                        disabled={!text.trim() || loading || extracting || (!isPro && usage.remaining === 0)}
                        className="btn-submit px-5 py-2 rounded-lg bg-white light:bg-[#2C1810] text-gray-950 light:text-[rgba(248,246,234,0.95)] text-sm font-semibold hover:bg-slate-100 light:hover:bg-[#3D2214] disabled:opacity-40 disabled:cursor-not-allowed"
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

                {/* Pro success toast — shown once after payment, auto-dismisses after 5 s */}
                <AnimatePresence>
                  {proSuccess && (
                    <motion.div
                      key="pro-success-banner"
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      transition={{ duration: 0.3, ease: "easeOut" }}
                      className="mt-3 flex items-start gap-3 rounded-lg border border-green-500/25 light:border-[rgba(30,70,32,0.35)] bg-green-500/10 light:bg-[rgba(30,70,32,0.07)] px-4 py-3"
                    >
                      <svg className="mt-0.5 h-4 w-4 shrink-0 text-green-500 light:text-[#1E4620]" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd"/>
                      </svg>
                      <p className="text-sm text-green-300 light:text-[#1E4620]">
                        <strong>Welcome to Pro!</strong> You now have unlimited searches. Thank you for subscribing.
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Daily limit banner */}
                {usage.remaining === 0 && !loading && !isPro && (
                  <div className="mt-3 flex items-start gap-3 rounded-lg border border-red-500/20 bg-red-500/[0.07] light:bg-red-500/[0.05] px-4 py-3">
                    <svg className="mt-0.5 h-4 w-4 shrink-0 text-red-400 light:text-red-500" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
                      <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd"/>
                    </svg>
                    <p className="text-sm text-slate-300 light:text-[#4A2E1A]">
                      You&apos;ve reached your daily limit of 3 free searches.{" "}
                      {session ? (
                        <>
                          <button
                            type="button"
                            onClick={() => setShowPlanModal(true)}
                            className="font-semibold text-amber-400 light:text-amber-700 underline underline-offset-2 hover:text-amber-300 light:hover:text-amber-800 transition-colors"
                          >
                            Upgrade to Pro
                          </button>{" "}
                          for unlimited access.
                        </>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={() => signIn()}
                            className="font-semibold text-amber-400 light:text-amber-700 underline underline-offset-2 hover:text-amber-300 light:hover:text-amber-800 transition-colors"
                          >
                            Sign in
                          </button>{" "}
                          to unlock Pro features with unlimited searches.
                        </>
                      )}
                    </p>
                  </div>
                )}

                {loading && (
                  <div className="mt-8 flex items-center gap-3 text-sm text-slate-400 light:text-[#4A2E1A]">
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
                    <div className="flex flex-col gap-2.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <h2 className="text-xs font-medium text-slate-500 light:text-[#6B4226] uppercase tracking-wide">
                            {results.length} claim{results.length > 1 ? "s" : ""} found
                          </h2>
                          <ExportMenu papers={allPapers} isPro={isPro} isSignedIn={isSignedIn} onUpgrade={handleUpgradeClick} />
                        </div>
                      </div>
                      <RecencyFilter value={yearFilter} onChange={setYearFilter} isPro={isPro} isSignedIn={isSignedIn} onUpgrade={handleUpgradeClick} />
                    </div>

                    {/* ── Omakase Mode ──────────────────────────────────── */}
                    <div className="flex justify-center">
                      <div className="relative">
                        <button
                          type="button"
                          onClick={isPro
                            ? () => setShowOmakasePicker(true)
                            : () => setShowOmakaseGate((v) => !v)
                          }
                          className={`inline-flex items-center gap-2.5 rounded-xl border px-5 py-2.5 text-sm font-medium ${
                            isPro
                              ? "btn-omakase border-amber-500/25 light:border-amber-700/20 text-amber-300 light:text-amber-800"
                              : "border-white/10 light:border-[rgba(44,24,16,0.12)] text-slate-500 light:text-[#8B5E3C] opacity-60"
                          }`}
                        >
                          {isPro ? (
                            /* Sparkles icon */
                            <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                              <path d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z"/>
                              <path d="M18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456z"/>
                              <path d="M16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z"/>
                            </svg>
                          ) : (
                            /* Lock icon */
                            <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                              <path d="M7 11V7a5 5 0 0110 0v4"/>
                            </svg>
                          )}
                          Omakase: rewrite with citations
                          {!isPro && <ProBadge />}
                        </button>

                        <AnimatePresence>
                          {showOmakaseGate && !isPro && (
                            <ProGatePopover
                              isSignedIn={isSignedIn}
                              onUpgrade={handleUpgradeClick}
                              onClose={() => setShowOmakaseGate(false)}
                            />
                          )}
                        </AnimatePresence>
                      </div>
                    </div>

                    {results.map((result, i) => (
                      <ClaimCard
                        key={i}
                        result={result}
                        index={i}
                        knownPaperKeys={knownPaperKeys}
                        yearFilter={yearFilter}
                        isPro={isPro}
                        isSignedIn={isSignedIn}
                        onUpgrade={handleUpgradeClick}
                        onUsageUpdate={(remaining) =>
                          setUsage((u) => ({ ...u, remaining, count: u.limit - remaining }))
                        }
                      />
                    ))}

                    {/* ── Omakase result ── */}
                    <AnimatePresence>
                      {omakaseResult && (
                        <OmakaseResultSection
                          rewrittenParagraph={omakaseResult.rewritten_paragraph}
                          referenceList={omakaseResult.reference_list}
                          styleName={omakaseResult.label}
                          onDismiss={() => setOmakaseResult(null)}
                        />
                      )}
                    </AnimatePresence>
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
