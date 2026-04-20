"use client";

import { createContext, useDeferredValue, useContext, useEffect, useMemo, useRef, useState, type ReactElement } from "react";
import { createPortal } from "react-dom";
import { signIn, signOut, useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import type { Paper, RatedPaper } from "@/lib/rate-relevance";
import { BorderBeam } from "@/components/magicui/border-beam";
import { TextAnimate } from "@/components/magicui/text-animate";
import { getT, type Lang, detectLang, SUPPORTED_LANGS, type TFunction, type TKey } from "@/lib/i18n";

// ── i18n context ─────────────────────────────────────────────────────────────
const LangContext = createContext<TFunction>((k) => k as string);

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

function toTitleCase(str: string): string {
  return str.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}

function pickGreeting(firstName: string, t: TFunction): string {
  const p = { name: firstName };
  const hour = new Date().getHours();
  const timeGreeting =
    hour >= 5 && hour < 12 ? t("greet_morning", p) :
    hour >= 12 && hour < 17 ? t("greet_afternoon", p) :
    hour >= 17 && hour < 21 ? t("greet_evening", p) :
    t("greet_late", p);

  const pool = [
    t("greet_welcome", p),
    t("greet_good_to_see", p),
    t("greet_ready", p),
    t("greet_citing", p),
    t("greet_more_papers", p),
    t("greet_find_refs", p),
    t("greet_topic", p),
    t("greet_research_time", p),
    t("greet_get_citing", p),
    t("greet_working_on", p),
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

interface OmakaseHistoryData {
  rewritten_paragraph: string;
  reference_list: string[];
  style: string;
  label: string;
}

interface SearchTab {
  id: string;
  preview: string;
  paragraph: string;
  claims: { claim: string; searchQuery: string }[];
  results: ClaimResult[];
  omakase?: OmakaseHistoryData | null;
  starred?: boolean;
  createdAt: string;
  updatedAt: string;
}

interface SavedPaper {
  id: string;
  doi?: string | null;
  title: string;
  authors: string[];
  year?: number | null;
  journal?: string | null;
  createdAt: string;
}

// ── recency filter ────────────────────────────────────────────────────────────

type YearFilter = "all" | "5yr" | "3yr" | "1yr" | "custom";
type CustomRange = { from: number; to: number } | null;

const YEAR_FILTERS: { id: YearFilter; label: string }[] = [
  { id: "all",    label: "All time" },
  { id: "5yr",    label: "Last 5 years" },
  { id: "3yr",    label: "Last 3 years" },
  { id: "1yr",    label: "Last year" },
  { id: "custom", label: "Custom" },
];

// ── Onboarding step cards ─────────────────────────────────────────────────────

const ONBOARDING_STEPS: { labelKey: TKey; descKey: TKey; Icon: () => ReactElement }[] = [
  {
    labelKey: "step_paste_label",
    descKey: "step_paste_desc",
    Icon: () => (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
      </svg>
    ),
  },
  {
    labelKey: "step_extract_label",
    descKey: "step_extract_desc",
    Icon: () => (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96-.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 1.44-4.66z" />
        <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96-.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.44-4.66z" />
      </svg>
    ),
  },
  {
    labelKey: "step_search_label",
    descKey: "step_search_desc",
    Icon: () => (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <ellipse cx="12" cy="5" rx="9" ry="3" />
        <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
        <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
      </svg>
    ),
  },
  {
    labelKey: "step_rank_label",
    descKey: "step_rank_desc",
    Icon: () => (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <line x1="18" y1="20" x2="18" y2="10" />
        <line x1="12" y1="20" x2="12" y2="4" />
        <line x1="6" y1="20" x2="6" y2="14" />
      </svg>
    ),
  },
  {
    labelKey: "step_cite_label",
    descKey: "step_cite_desc",
    Icon: () => (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 2v7c0 1.25.75 2 2 2h3c1.25 0 2 .75 2 2" />
        <path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 2v7c0 1.25.75 2 2 2h3c1.25 0 2 .75 2 2" />
      </svg>
    ),
  },
];

const AUTH_ERROR_KEYS: Record<string, TKey> = {
  EmailNotFound: "auth_err_email_not_found",
  GoogleOnly: "auth_err_google_only",
  WrongPassword: "auth_err_wrong_password",
  CredentialsSignin: "auth_err_credentials",
  OAuthAccountNotLinked: "auth_err_oauth_linked",
  Default: "auth_err_default",
};

function paperInRange(year: number | null, filter: YearFilter, customRange?: CustomRange): boolean {
  if (filter === "all") return true;
  if (year == null) return false; // undated papers hidden by any non-"all" filter
  const now = new Date().getFullYear();
  if (filter === "5yr") return year >= now - 5;
  if (filter === "3yr") return year >= now - 3;
  if (filter === "1yr") return year >= now - 1;
  if (filter === "custom") {
    if (!customRange) return true;
    return year >= customRange.from && year <= customRange.to;
  }
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

function formatCitationGBT(paper: Paper): string {
  const parsed = parseAuthors(paper.authors);
  const gbtA = (a: ParsedAuthor) => {
    const inits = a.initials.replace(/\.\s*/g, "");
    return `${a.last}${inits ? " " + inits : ""}`;
  };
  let authorStr = "";
  if (parsed.length <= 3) {
    authorStr = parsed.map(gbtA).join(", ");
  } else {
    authorStr = parsed.slice(0, 3).map(gbtA).join(", ") + ", et al";
  }

  const title = paper.title ?? "Untitled";
  let source = "";
  if (paper.journal) {
    source = paper.journal;
    if (paper.year) {
      source += `, ${paper.year}`;
      if (paper.volume) {
        source += `, ${paper.volume}`;
        if (paper.issue) source += `(${paper.issue})`;
      }
      if (paper.pages) source += `: ${paper.pages}`;
    }
  } else if (paper.year) {
    source = `${paper.year}`;
  }

  const parts: string[] = [];
  if (authorStr) parts.push(authorStr + ".");
  parts.push(`${title}[J].`);
  if (source) parts.push(source + ".");
  return parts.join(" ");
}

// ── export generators ─────────────────────────────────────────────────────────

// Tracks the citation format most recently used in any CitationMenu so the
// plain-text export can match what the user has been copying.
let _lastCitFmtId: (typeof CITATION_FORMATS)[number]["id"] = "apa";

function bibTexEscape(s: string): string {
  return s
    .replace(/\\/g, "\\textbackslash{}")
    .replace(/[{}]/g, (c) => `\\${c}`)
    .replace(/&/g, "\\&")
    .replace(/%/g, "\\%")
    .replace(/#/g, "\\#")
    .replace(/\$/g, "\\$")
    .replace(/_/g, "\\_")
    .replace(/\^/g, "\\^{}")
    .replace(/~/g, "\\textasciitilde{}");
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

// ── language picker — inline pill variant (matches sample) ───────────────────

const LANG_CODES: Record<Lang, string> = { en: "EN", zh: "中", ja: "日", ko: "한" };

function LanguagePicker({ lang, onChange }: { lang: Lang; onChange: (l: Lang) => void }) {
  return (
    <div
      className="inline-flex items-center gap-0.5 rounded-full border p-[3px]"
      style={{ border: "1px solid var(--rule)", background: "var(--paper)" }}
    >
      {(["en", "zh", "ja", "ko"] as Lang[]).map((code) => (
        <button
          key={code}
          type="button"
          title={SUPPORTED_LANGS.find(l => l.id === code)?.label}
          onClick={() => onChange(code)}
          className="rounded-full transition-colors"
          style={{
            padding: "4px 9px",
            border: "none",
            cursor: "pointer",
            background: lang === code ? "var(--ink)" : "transparent",
            color: lang === code ? "var(--paper)" : "var(--ink-dim)",
            fontFamily: code === "en" ? "var(--mono)" : "var(--serif)",
            fontSize: code === "en" ? 10 : 13,
            fontWeight: 500,
            letterSpacing: code === "en" ? "0.5px" : 0,
            lineHeight: 1,
            minWidth: 26,
          }}
        >
          {LANG_CODES[code]}
        </button>
      ))}
    </div>
  );
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
  const t = useContext(LangContext);
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
            ? "text-[var(--ink-dim)] hover:bg-white/[0.09] light:hover:bg-[var(--paper-deep)] hover:text-[var(--ink)]"
            : "text-[var(--ink-dim)]"
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
        {t("export_btn")}
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
            className="absolute top-full left-0 mt-1.5 z-30 w-52 rounded-xl border border-white/[0.10] light:border-[rgba(80,50,20,0.16)] bg-[#141414] light:bg-[rgba(248,246,234,1)] shadow-2xl py-1 overflow-hidden"
            role="menu"
          >
            <p className="px-3 pt-1.5 pb-1 text-[10px] font-semibold uppercase tracking-widest text-[var(--ink-dim)]">
              {t("download_as")}
            </p>
            {EXPORT_OPTIONS.map(({ type, label, ext, icon }) => (
              <button
                key={type}
                type="button"
                onClick={() => handleExport(type)}
                className="w-full flex items-center gap-2.5 px-3 py-1.5 text-xs text-[var(--ink)] hover:bg-white/[0.07] light:hover:bg-[var(--paper-deep)] transition-colors text-left"
                role="menuitem"
              >
                <span className="text-[var(--ink-dim)] shrink-0">{icon}</span>
                <span className="flex-1 truncate">{label}</span>
                <span className="text-[var(--ink-dim)] font-mono text-[10px] shrink-0">{ext}</span>
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
  excerptBorderClass: string;
  excerptBgClass: string;
  excerptTextClass: string;
  excerptLabelClass: string;
} {
  if (score >= 5) return {
    label: "tier_direct",
    cardClass: "border-[var(--accent)]",
    badgeClass: "bg-[var(--accent-soft)] border-[var(--accent)] text-[var(--accent)]",
    excerptBorderClass: "border-l-[var(--accent)]",
    excerptBgClass: "bg-[var(--paper-deep)]",
    excerptTextClass: "text-[var(--ink)]",
    excerptLabelClass: "text-[var(--ink-dim)]",
  };
  if (score >= 4) return {
    label: "tier_high",
    cardClass: "border-[var(--rule)]",
    badgeClass: "bg-blue-500/10 border-blue-400/40 text-blue-400 light:bg-blue-50 light:border-blue-400/50 light:text-blue-600",
    excerptBorderClass: "border-l-[var(--accent)]",
    excerptBgClass: "bg-[var(--paper-deep)]",
    excerptTextClass: "text-[var(--ink)]",
    excerptLabelClass: "text-[var(--ink-dim)]",
  };
  return {
    label: "tier_moderate",
    cardClass: "border-[var(--rule)]",
    badgeClass: "bg-amber-500/10 border-amber-400/40 text-amber-400 light:bg-amber-50 light:border-amber-400/50 light:text-amber-600",
    excerptBorderClass: "border-l-[var(--rule)]",
    excerptBgClass: "bg-[var(--paper-deep)]",
    excerptTextClass: "text-[var(--ink-dim)]",
    excerptLabelClass: "text-[var(--ink-dim)]",
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
  const t = useContext(LangContext);
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
        style={{ backdropFilter: "none", WebkitBackdropFilter: "none", background: "var(--paper)", border: "2px solid var(--rule)" }}
        className="rounded-2xl px-5 py-4 shadow-[0_8px_40px_rgba(0,0,0,0.5),0_2px_8px_rgba(0,0,0,0.3)]"
      >
        <div className="flex items-start gap-3">
          {/* Lock icon */}
          <div className="mt-0.5 shrink-0 flex h-8 w-8 items-center justify-center rounded-full" style={{ background: "var(--accent-soft)", border: "1px solid var(--rule)" }}>
            <svg className="h-3.5 w-3.5" style={{ color: "var(--accent)" }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
              <path d="M7 11V7a5 5 0 0110 0v4"/>
            </svg>
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold mb-1.5" style={{ color: "var(--ink)" }}>
              {t("pro_feature")}
            </p>
            <p className="text-xs leading-relaxed" style={{ color: "var(--ink-dim)" }}>
              {isSignedIn ? (
                <>
                  <button
                    type="button"
                    onClick={() => { onClose(); onUpgrade(); }}
                    className="font-semibold underline underline-offset-2 transition-colors" style={{ color: "var(--accent)" }}
                  >
                    {t("pro_gate_upgrade_link")}
                  </button>
                  {" "}{t("pro_gate_upgrade_suffix")}
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => { onClose(); onUpgrade(); }}
                    className="font-semibold underline underline-offset-2 transition-colors" style={{ color: "var(--accent)" }}
                  >
                    {t("pro_gate_signin_link")}
                  </button>
                  {" "}{t("pro_gate_signin_suffix")}
                </>
              )}
            </p>
          </div>

          {/* Dismiss × */}
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 -mt-0.5 -mr-1 rounded-lg p-1 transition-colors" style={{ color: "var(--ink-dim)" }}
            onMouseEnter={e => (e.currentTarget.style.color = "var(--ink)")}
            onMouseLeave={e => (e.currentTarget.style.color = "var(--ink-dim)")}
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
  { id: "apa",       label: "APA",        subtitle: "7th edition" },
  { id: "mla",       label: "MLA",        subtitle: "9th edition" },
  { id: "chicago",   label: "Chicago",    subtitle: "17th edition" },
  { id: "harvard",   label: "Harvard",    subtitle: "Author–date" },
  { id: "ieee",      label: "IEEE",       subtitle: "Numbered refs" },
  { id: "vancouver", label: "Vancouver",  subtitle: "Numbered refs" },
  { id: "gbt",       label: "GB/T 7714", subtitle: "Chinese national standard" },
] as const;

type OmakaseStyleId = (typeof OMAKASE_STYLES)[number]["id"];

function OmakaseCitationPicker({
  onSelect,
  onClose,
}: {
  onSelect: (style: OmakaseStyleId) => void;
  onClose: () => void;
}) {
  const t = useContext(LangContext);
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
              <h2 className="text-base font-semibold text-[var(--ink)] letterpress-title">
                {t("choose_style")}
              </h2>
              <p className="mt-0.5 text-xs text-[var(--ink-dim)]">
                {t("rewrite_inline_desc")}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="ml-3 shrink-0 rounded-lg p-1 text-slate-500 hover:text-slate-300 light:text-[var(--ink-dim)] light:hover:text-[var(--ink)] hover:bg-white/[0.07] light:hover:bg-[var(--paper-deep)] transition-colors"
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
                className="group flex flex-col items-start gap-0.5 rounded-xl border border-white/[0.08] light:border-[rgba(80,50,20,0.12)] bg-[var(--bg-deep)] px-4 py-3 text-left transition-all hover:border-amber-500/40 light:hover:border-amber-700/30 hover:bg-amber-500/[0.07] light:hover:bg-amber-700/[0.05] hover:shadow-[0_0_12px_1px_rgba(251,191,36,0.10)]"
              >
                <span className="text-sm font-semibold text-[var(--ink)] group-hover:text-amber-300 light:group-hover:text-amber-800 transition-colors">
                  {label}
                </span>
                <span className="text-[10px] text-[var(--ink-dim)]">
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
 *
 * Alternates (tried left-to-right at each position):
 *  1. IEEE / Vancouver brackets  [1]  [1,2]  [1–3]
 *  2. APA / Harvard / Chicago    (Smith, 2020)  (Smith et al., 2020, p. 45)
 *  3. MLA author-page            (Smith 45)  (Smith and Jones 123–130)
 *  4. Vancouver parenthetical    (1)  (1, 2)  — only 1–3 digit numbers
 */
function splitCitations(text: string): { kind: "text" | "cite"; value: string }[] {
  // Each alternate covers one family of citation styles:
  //   1. IEEE/Vancouver brackets: [1]  [1,2]  [1–3]
  //   2. APA/Harvard/Chicago year: (Smith, 2020)  (Smith et al., 2020, p. 45)
  //   3. MLA author-page: (Smith 45)  (Jones 123–130)
  //   4. Vancouver parenthetical numbers: (1)  (1, 2)
  const re = /(\[[0-9][0-9,;\s\u2013-]*\]|\([^()]{1,120}\b(?:19|20)\d{2}[a-z]?\b[^()]{0,80}\)|\([A-Z][a-zA-Z\u00C0-\u017E.,\s]+\s+\d{1,4}(?:[\u2013-]\d{1,4})?\)|\(\d{1,3}(?:[,;\s]+\d{1,3})*\))/g;
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
  containerRef,
}: {
  rewrittenParagraph: string;
  referenceList: string[];
  styleName: string;
  onDismiss: () => void;
  containerRef?: React.RefObject<HTMLDivElement | null>;
}) {

  const t = useContext(LangContext);
  const refText  = referenceList.map((r, i) => `${i + 1}. ${r}`).join("\n");
  const allText  = `${rewrittenParagraph}\n\nReferences\n${refText}`;
  const para     = useCopyButton(() => rewrittenParagraph);
  const refs     = useCopyButton(() => refText);
  const all      = useCopyButton(() => allText);
  const segments = splitCitations(rewrittenParagraph);

  const btnBase  = "inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap";
  const btnAmber = `${btnBase} border-amber-500/30 light:border-amber-700/25 bg-amber-500/10 light:bg-amber-700/[0.07] text-amber-300 light:text-amber-800 hover:bg-amber-500/[0.18] light:hover:bg-amber-700/[0.12]`;
  const btnGhost = `${btnBase} border-white/[0.09] light:border-[var(--rule)] text-[var(--ink-dim)] hover:bg-white/[0.06] light:hover:bg-[var(--paper-deep)]`;

  return (
    <motion.div
      ref={containerRef}
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
      className="rounded-2xl border border-amber-500/[0.18] light:border-[rgba(120,80,30,0.18)] bg-[#0f0f0f] light:bg-[rgba(253,250,243,1)] shadow-[0_0_0_1px_rgba(251,191,36,0.04),0_8px_32px_rgba(0,0,0,0.35)] light:shadow-[0_4px_24px_rgba(100,60,10,0.10)] overflow-hidden"
    >
      {/* Amber gradient top-line accent */}
      <div className="h-px bg-gradient-to-r from-transparent via-amber-500/50 light:via-amber-700/35 to-transparent" />

      {/* ── Header ── */}
      <div className="flex items-center justify-between px-5 pt-4 pb-3.5 border-b border-white/[0.06] light:border-[var(--rule-soft)]">
        <div className="flex items-center gap-2.5 min-w-0">
          <svg className="h-4 w-4 shrink-0 text-amber-400 light:text-amber-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z"/>
            <path d="M18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456z"/>
          </svg>
          <div className="min-w-0">
            <h2 className="text-sm font-semibold text-[var(--ink)] letterpress-title truncate">
              {t("omakase_rewrite_title")}
            </h2>
            <p className="text-[10px] text-[var(--ink-dim)]">
              {styleName} · {referenceList.length} reference{referenceList.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onDismiss}
          className="ml-3 shrink-0 rounded-lg p-1.5 text-slate-500 hover:text-slate-300 light:text-[var(--ink-dim)] light:hover:text-[var(--ink)] hover:bg-white/[0.07] light:hover:bg-[var(--paper-deep)] transition-colors"
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
          <h3 className="text-[10px] font-semibold uppercase tracking-widest text-[var(--ink-dim)] shrink-0">
            {t("rewritten_paragraph")}
          </h3>
          <button type="button" onClick={para.copy} className={btnGhost}>
            {para.copied ? <><CheckIcon />{t("copied")}</> : <><CopyIcon />{t("copy_paragraph")}</>}
          </button>
        </div>
        <p className="text-sm leading-[1.85] text-[var(--ink)]">
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
      <div className="mx-5 border-t border-white/[0.05] light:border-[var(--rule-soft)]" />

      {/* ── References ── */}
      {referenceList.length > 0 && (
        <div className="px-5 pt-4 pb-5 bg-white/[0.015] light:bg-[rgba(44,24,16,0.025)]">
          <div className="flex items-center justify-between gap-4 mb-3">
            <h3 className="text-[10px] font-semibold uppercase tracking-widest text-[var(--ink-dim)] shrink-0">
              {t("references")}
            </h3>
            <button type="button" onClick={refs.copy} className={btnGhost}>
              {refs.copied ? <><CheckIcon />{t("copied")}</> : <><CopyIcon />{t("copy_references")}</>}
            </button>
          </div>
          <ol className="flex flex-col gap-2">
            {referenceList.map((ref, i) => (
              <li key={i} className="flex gap-3 text-xs leading-relaxed text-slate-300 light:text-[var(--ink-dim)]">
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
      <div className="flex flex-wrap items-center justify-between gap-2.5 px-5 py-3.5 border-t border-white/[0.06] light:border-[var(--rule-soft)]
                      bg-white/[0.015] light:bg-[rgba(44,24,16,0.018)]">
        <p className="text-[10px] text-[var(--ink-dim)] hidden sm:block">
          {t("citations_highlighted")}
        </p>
        <button type="button" onClick={all.copy} className={btnAmber}>
          {all.copied
            ? <><CheckIcon />{t("copied")}</>
            : <><CopyIcon />{t("copy_all")}</>}
        </button>
      </div>
    </motion.div>
  );
}

// ── Omakase loading overlay ────────────────────────────────────────────────────

function OmakaseLoadingOverlay({ styleName }: { styleName: string }) {
  const t = useContext(LangContext);
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
            <p className="text-sm font-semibold text-[var(--ink)]">
              {t("rewriting_with_style", { style: styleName })}
            </p>
            <p className="mt-1 text-xs text-[var(--ink-dim)]">
              {t("inserting_refs")}
            </p>
          </div>
        </div>
      </motion.div>
    </>
  );
}

// ── small components ──────────────────────────────────────────────────────────

function ScoreBadge({ score }: { score: number }) {
  const t = useContext(LangContext);
  const { label, badgeClass } = getTier(score);
  const filled = Math.min(Math.round(score), 5);
  return (
    <span className={`shrink-0 inline-flex items-center gap-1 rounded-full border px-2 py-0.5 font-[family-name:var(--font-dm-sans)] text-[10px] tracking-[0.5px] uppercase ${badgeClass}`}>
      <span className="flex items-center gap-px">
        {Array.from({ length: 5 }, (_, i) => (
          <svg key={i} width="7" height="7" viewBox="0 0 12 12" fill={i < filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.8" aria-hidden>
            <path strokeLinejoin="round" d="M6 1l1.24 3.09L10.5 4.5l-2.57 2.5.61 3.5L6 9l-2.54 1.5.61-3.5L1.5 4.5l3.26-.41z"/>
          </svg>
        ))}
      </span>
      {t(label as Parameters<typeof t>[0])}
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
  { id: "gbt",       label: "GB/T 7714",    fn: formatCitationGBT },
] as const;

function CitationMenu({ paper }: { paper: Paper }) {
  const t = useContext(LangContext);
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
        className="inline-flex items-center gap-1 font-[family-name:var(--font-dm-sans)] text-[11px] tracking-[0.3px] transition-colors"
        style={{ color: "var(--accent)" }}
        onMouseEnter={e => (e.currentTarget.style.opacity = "0.75")}
        onMouseLeave={e => (e.currentTarget.style.opacity = "1")}
        title={t("copy_citation")}
      >
        <svg className="h-3 w-3" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 3H5a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-3M8 3a2 2 0 002 2h2a2 2 0 002-2M8 3a2 2 0 012-2h2a2 2 0 012 2"/>
        </svg>
        {t("cite_btn")}
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
            className="absolute bottom-full left-0 mb-2 z-30 w-44 rounded-xl shadow-2xl py-1 overflow-hidden"
            style={{ background: "var(--paper)", border: "1px solid var(--rule)" }}
            role="menu"
          >
            <p className="px-3 pt-1.5 pb-1 font-[family-name:var(--font-dm-sans)] text-[10px] font-medium uppercase tracking-[0.8px]" style={{ color: "var(--ink-dim)" }}>
              {t("copy_citation_header")}
            </p>
            {CITATION_FORMATS.map(({ id, label, fn }) => {
              const isCopied = copied === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => handleCopy(id, fn(paper))}
                  className="w-full flex items-center justify-between px-3 py-1.5 font-[family-name:var(--font-dm-sans)] text-[12px] transition-colors text-left"
                  style={{ color: isCopied ? "var(--accent)" : "var(--ink)" }}
                  onMouseEnter={e => { if (!isCopied) (e.currentTarget as HTMLElement).style.background = "var(--paper-deep)"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
                  role="menuitem"
                >
                  <span>{label}</span>
                  {isCopied ? (
                    <svg className="h-3.5 w-3.5 shrink-0" style={{ color: "var(--accent)" }} viewBox="0 0 20 20" fill="currentColor" aria-hidden>
                      <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd"/>
                    </svg>
                  ) : (
                    <svg className="h-3 w-3 shrink-0" style={{ color: "var(--ink-dim)" }} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
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
  title,
}: {
  icon: React.ReactNode;
  text: string;
  colorClass: string;
  glowing?: boolean;
  title?: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-medium tracking-wide ${colorClass}${glowing ? " stat-badge-glow" : ""}`}
      style={glowing ? { boxShadow: "0 0 7px 1px rgba(234,88,12,0.35)" } : undefined}
      title={title}
    >
      {icon}
      {text}
    </span>
  );
}

const MATCH_TYPE_TOOLTIP =
  "Relevance is assessed based on the paper\u2019s abstract, not the full text. Click the DOI link to verify against the original paper.";

function MatchTypeInfoIcon() {
  return (
    <span className="relative ml-auto group/mti flex-shrink-0">
      <button
        type="button"
        aria-label={MATCH_TYPE_TOOLTIP}
        className="flex items-center justify-center rounded-full text-slate-500 hover:text-slate-300 light:text-[rgba(80,60,30,0.45)] light:hover:text-[rgba(60,40,10,0.75)] transition-colors focus:outline-none"
      >
        <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden>
          <circle cx="8" cy="8" r="6.5"/>
          <path d="M8 7v4M8 5.5v.5"/>
        </svg>
      </button>
      {/* tooltip */}
      <span
        role="tooltip"
        className="pointer-events-none absolute bottom-full right-0 z-50 mb-1.5 w-64 rounded border border-slate-700/60 bg-slate-900 px-3 py-2 text-[11px] leading-relaxed text-slate-300 opacity-0 shadow-lg transition-opacity group-hover/mti:opacity-100 group-focus-within/mti:opacity-100 light:border-[rgba(80,60,30,0.22)] light:bg-[#FDF8F0] light:text-[var(--ink-dim)]"
      >
        {MATCH_TYPE_TOOLTIP}
        {/* arrow */}
        <span className="absolute -bottom-[5px] right-2 h-2 w-2 rotate-45 border-b border-r border-slate-700/60 bg-slate-900 light:border-[rgba(80,60,30,0.22)] light:bg-[#FDF8F0]" />
      </span>
    </span>
  );
}

function sjrQuartileStyle(q: string): { colorClass: string } {
  switch (q) {
    case "Q1": return { colorClass: "bg-emerald-700/15 border-emerald-700/30 text-emerald-300 light:bg-[rgba(10,70,30,0.10)] light:border-[rgba(10,70,30,0.28)] light:text-[#0A4620]" };
    case "Q2": return { colorClass: "bg-green-500/10 border-green-500/20 text-green-400 light:bg-[rgba(20,90,30,0.08)] light:border-[rgba(20,90,30,0.22)] light:text-[#1A5C1A]" };
    case "Q3": return { colorClass: "bg-amber-500/10 border-amber-500/20 text-amber-400 light:bg-[rgba(100,60,0,0.08)] light:border-[rgba(100,60,0,0.22)] light:text-[#6B3A00]" };
    default:   return { colorClass: "bg-slate-500/10 border-slate-500/20 text-slate-400 light:bg-[rgba(80,80,80,0.07)] light:border-[rgba(80,80,80,0.18)] light:text-[#5A5A5A]" };
  }
}

// ── shared paper stats row ────────────────────────────────────────────────────

function PaperStatBadges({ paper }: { paper: Paper }) {
  const t = useContext(LangContext);
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
      {paper.sjrQuartile && (() => {
        const { colorClass } = sjrQuartileStyle(paper.sjrQuartile);
        const label = paper.sjrCategory
          ? `${paper.sjrQuartile} · ${paper.sjrCategory}`
          : paper.sjrQuartile;
        return (
          <StatBadge
            colorClass={colorClass}
            text={label}
            title={t("sjr_tooltip")}
            icon={
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 01-.982-3.172M9.497 14.25a7.454 7.454 0 00.981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 007.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M7.73 9.728a6.726 6.726 0 002.748 1.35m8.272-6.842V4.5c0 2.108-.966 3.99-2.48 5.228m2.48-5.492a46.32 46.32 0 012.916.52 6.003 6.003 0 01-5.395 4.972m0 0a6.726 6.726 0 01-2.749 1.35m0 0a6.772 6.772 0 01-3.044 0"/>
              </svg>
            }
          />
        );
      })()}
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
  customRange,
  isPro = false,
  isSignedIn = false,
  onUpgrade,
  savedPaperKeys,
  onSaveToggle,
  zoteroConnected,
  onSaveToZotero,
}: {
  paper: RatedPaper;
  index?: number;
  knownPaperKeys?: Set<string>;
  onUsageUpdate?: (remaining: number) => void;
  yearFilter?: YearFilter;
  customRange?: CustomRange;
  isPro?: boolean;
  isSignedIn?: boolean;
  onUpgrade?: () => void;
  savedPaperKeys?: Set<string>;
  onSaveToggle?: (paper: RatedPaper) => void;
  zoteroConnected?: boolean | null;
  onSaveToZotero?: (paper: Paper) => Promise<void>;
}) {
  const t = useContext(LangContext);
  const [relatedOpen, setRelatedOpen] = useState(false);
  const [relatedLoading, setRelatedLoading] = useState(false);
  const [relatedPapers, setRelatedPapers] = useState<Paper[] | null>(null);
  const [relatedError, setRelatedError] = useState<string | null>(null);
  const [showProGate, setShowProGate] = useState(false);
  const [showZoteroGate, setShowZoteroGate] = useState(false);
  const [zoteroLoading, setZoteroLoading] = useState(false);

  const authorLine =
    paper.authors.length === 0
      ? null
      : paper.authors.length <= 3
        ? paper.authors.join(", ")
        : `${paper.authors[0]}, et al.`;

  const authorYearMeta = [authorLine, paper.year].filter(Boolean).join(" · ");
  const { cardClass, excerptBorderClass, excerptBgClass, excerptTextClass, excerptLabelClass } = getTier(paper.relevanceScore);

  const isSaved = useMemo(() => {
    if (!savedPaperKeys || savedPaperKeys.size === 0) return false;
    const doi = paper.doi ? paper.doi.replace(/^https?:\/\/doi\.org\//i, "").toLowerCase() : null;
    const titleKey = paper.title?.toLowerCase().trim() ?? null;
    return (doi ? savedPaperKeys.has(doi) : false) || (titleKey ? savedPaperKeys.has(titleKey) : false);
  }, [savedPaperKeys, paper.doi, paper.title]);

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
        className={`paper-card rounded-xl border p-4 bg-[var(--paper)] ${cardClass}`}
      >
        {/* title row */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            {paper.doi ? (
              <a
                href={paper.doi}
                target="_blank"
                rel="noopener noreferrer"
                className="font-[family-name:var(--serif)] text-[15px] leading-snug break-words transition-colors"
                style={{ color: "var(--ink)" }}
                onMouseEnter={e => (e.currentTarget.style.color = "var(--accent)")}
                onMouseLeave={e => (e.currentTarget.style.color = "var(--ink)")}
              >
                {paper.title ?? "Untitled"}
              </a>
            ) : (
              <span
                className="font-[family-name:var(--serif)] text-[15px] leading-snug break-words"
                style={{ color: "var(--ink)" }}
              >
                {paper.title ?? "Untitled"}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            {paper.source && (
              <span
                className="inline-flex items-center rounded-full px-2 py-0.5 font-[family-name:var(--font-dm-sans)] text-[10px] tracking-[0.4px] uppercase"
                style={{ border: "1px solid var(--rule)", color: "var(--ink-dim)", background: "var(--paper-deep)" }}
              >
                {paper.source === "Semantic Scholar" ? "S2" : "OA"}
              </span>
            )}
            <ScoreBadge score={paper.relevanceScore} />
            {onSaveToggle && (
              <button
                type="button"
                onClick={() => onSaveToggle(paper)}
                aria-label={isSaved ? "Remove from saved papers" : "Save paper"}
                title={isSaved ? "Remove from saved papers" : "Save paper"}
                className={`flex items-center justify-center w-6 h-6 rounded transition-colors ${
                  isSaved
                    ? "text-amber-400 light:text-amber-600 hover:text-amber-300 light:hover:text-amber-700"
                    : "text-slate-600 light:text-[var(--ink-dim)] hover:text-amber-400 light:hover:text-amber-600 hover:bg-white/[0.07] light:hover:bg-black/[0.05]"
                }`}
              >
                <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill={isSaved ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.6" aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 3a2 2 0 0 0-2 2v12.28a.5.5 0 0 0 .735.44L10 14.82l6.265 2.9A.5.5 0 0 0 17 17.28V5a2 2 0 0 0-2-2H5z" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* authors · year */}
        {authorYearMeta && (
          <p className="mt-1.5 text-[11px] break-words font-[family-name:var(--font-dm-sans)] tracking-[0.2px]" style={{ color: "var(--ink-dim)" }}>{authorYearMeta}</p>
        )}

        {/* journal */}
        {paper.journal && (
          <p className="mt-0.5 text-[11px] italic truncate font-[family-name:var(--serif)]" style={{ color: "var(--ink-dim)" }} title={paper.journal}>
            {paper.journal}
          </p>
        )}

        {/* stat badges */}
        <PaperStatBadges paper={paper} />

        {/* relevance explanation */}
        <p className="mt-2 text-[12px] italic leading-relaxed font-[family-name:var(--serif)]" style={{ color: "var(--ink-dim)" }}>
          {paper.relevanceExplanation}
        </p>

        {/* matching excerpt — Abstract Match */}
        {paper.matchingExcerpt && paper.matchType === "Abstract Match" && (
          <div className={`mt-2.5 rounded-lg border-l-2 px-3 py-2.5 ${excerptBorderClass} ${excerptBgClass}`}>
            <div className="mb-2 flex items-center gap-2">
              <span
                className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium font-[family-name:var(--font-dm-sans)] tracking-[0.5px] uppercase"
                style={{ background: "var(--accent-soft)", color: "var(--accent)", border: "1px solid var(--accent)" }}
              >
                <svg width="9" height="9" viewBox="0 0 12 12" fill="currentColor" aria-hidden>
                  <path d="M10.28 2.28a.75.75 0 0 0-1.06 0L4.5 6.997 2.78 5.28a.75.75 0 0 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.06 0l5.25-5.25a.75.75 0 0 0 0-1.06Z"/>
                </svg>
                {t("abstract_match")}
              </span>
              <span className="text-[10px] font-[family-name:var(--font-dm-sans)] uppercase tracking-[0.5px]" style={{ color: "var(--ink-dim)" }}>
                {t("matching_from_abstract")}
              </span>
              <MatchTypeInfoIcon />
            </div>
            <blockquote>
              <p className={`text-[12px] italic leading-relaxed font-[family-name:var(--serif)] ${excerptTextClass}`}>
                <span className="select-none not-italic opacity-50">&ldquo;</span>
                {paper.matchingExcerpt}
                <span className="select-none not-italic opacity-50">&rdquo;</span>
              </p>
            </blockquote>
          </div>
        )}

        {/* matching excerpt — Topic Match */}
        {paper.matchingExcerpt && paper.matchType === "Topic Match" && (
          <div className="mt-2.5 rounded-lg border-l-2 px-3 py-2.5" style={{ background: "var(--paper-deep)", borderLeftColor: "var(--rule)" }}>
            <div className="mb-2 flex items-center gap-2">
              <span
                className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium font-[family-name:var(--font-dm-sans)] tracking-[0.5px] uppercase"
                style={{ background: "var(--paper)", color: "var(--ink-dim)", border: "1px solid var(--rule)" }}
              >
                <svg width="9" height="9" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden>
                  <circle cx="6" cy="6" r="4.5"/>
                  <path d="M6 4v2.5M6 8v.5"/>
                </svg>
                {t("topic_match")}
              </span>
              <span className="text-[10px] font-[family-name:var(--font-dm-sans)] uppercase tracking-[0.5px]" style={{ color: "var(--ink-dim)" }}>
                {t("how_paper_relates")}
              </span>
              <MatchTypeInfoIcon />
            </div>
            <p className="text-[12px] italic leading-relaxed font-[family-name:var(--serif)]" style={{ color: "var(--ink-dim)" }}>
              {paper.matchingExcerpt}
            </p>
          </div>
        )}

        <div className="mt-2 flex items-center gap-3 flex-wrap">
          <CitationMenu paper={paper} />
          <div className="relative">
            <button
              type="button"
              onClick={isPro
                ? async () => {
                    setZoteroLoading(true);
                    await onSaveToZotero?.(paper).catch(() => {});
                    setZoteroLoading(false);
                  }
                : () => setShowZoteroGate((v) => !v)
              }
              disabled={isPro && zoteroLoading}
              className={`inline-flex items-center gap-1 text-xs transition-colors disabled:opacity-50 ${
                isPro
                  ? "text-[var(--ink-dim)] light:text-[var(--accent)] hover:text-[var(--ink)] light:hover:text-[var(--accent)]"
                  : "text-[var(--ink-dim)]"
              }`}
            >
              {isPro ? (
                zoteroLoading ? (
                  <svg className="h-3 w-3 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden>
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                ) : (
                  <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <path d="M4 4h16v2l-6 6v6l-4-2v-4L4 6V4z"/>
                  </svg>
                )
              ) : (
                <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                  <path d="M7 11V7a5 5 0 0110 0v4"/>
                </svg>
              )}
              {isPro
                ? (zoteroConnected === false ? "Connect Zotero" : "Save to Zotero")
                : "Save to Zotero"}
              {!isPro && <ProBadge />}
            </button>
            <AnimatePresence>
              {showZoteroGate && !isPro && (
                <ProGatePopover
                  isSignedIn={isSignedIn}
                  onUpgrade={onUpgrade ?? (() => {})}
                  onClose={() => setShowZoteroGate(false)}
                />
              )}
            </AnimatePresence>
          </div>
          <div className="relative">
            <button
              type="button"
              onClick={isPro ? handleFindRelated : () => setShowProGate((v) => !v)}
              disabled={isPro && relatedLoading}
              className={`inline-flex items-center gap-1 text-xs transition-colors disabled:opacity-50 ${
                isPro
                  ? "text-[var(--ink-dim)] light:text-[var(--accent)] hover:text-[var(--ink)] light:hover:text-[var(--accent)]"
                  : "text-[var(--ink-dim)]"
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
                ? (relatedLoading ? t("searching") : relatedOpen && relatedPapers !== null ? t("hide_related") : t("find_more"))
                : t("find_more")}
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
                <p className="text-[10px] font-semibold uppercase tracking-widest text-[var(--ink-dim)]">
                  {t("related_papers_section")}
                </p>
                <button
                  type="button"
                  onClick={() => setRelatedOpen(false)}
                  className="inline-flex items-center gap-0.5 text-[10px] text-[var(--ink-dim)] hover:text-slate-400 light:hover:text-[#8B5E3C] transition-colors"
                  aria-label="Collapse related papers"
                >
                  <svg className="h-3 w-3" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.5l11-11M15.5 15.5l-11-11" />
                  </svg>
                  {t("collapse")}
                </button>
              </div>
              {relatedLoading && (
                <div className="flex items-center gap-2 py-2">
                  <svg className="h-3.5 w-3.5 animate-spin text-[var(--ink-dim)] shrink-0" viewBox="0 0 24 24" fill="none" aria-hidden>
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                  <span className="text-xs text-[var(--ink-dim)]">{t("searching_related")}</span>
                </div>
              )}
              {relatedError && (
                <p className="text-xs text-red-400 py-2">{relatedError}</p>
              )}
              {!relatedLoading && relatedPapers !== null && (() => {
                const visible = relatedPapers.filter((p) => paperInRange(p.year, yearFilter, customRange));
                const hidden = relatedPapers.length - visible.length;
                if (relatedPapers.length === 0) return (
                  <p className="text-xs text-[var(--ink-dim)] py-2">{t("no_related_found")}</p>
                );
                if (visible.length === 0) return (
                  <p className="text-xs text-[var(--ink-dim)] py-2">
                    {t("no_related")}
                    {hidden > 0 && <span className="ml-1 text-[var(--ink-dim)]">({hidden} hidden)</span>}
                  </p>
                );
                return (
                  <div className="flex flex-col gap-2">
                    {visible.map((rp, i) => (
                      <RelatedPaperCard key={rp.doi ?? rp.title ?? i} paper={rp} index={i} />
                    ))}
                    {hidden > 0 && (
                      <p className="text-[11px] text-[var(--ink-dim)] pt-0.5">
                        {hidden === 1 ? t("hidden_by_date_one") : t("hidden_by_date_many", { n: hidden })}
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
              className="text-sm font-medium text-[var(--ink)] hover:text-blue-400 light:hover:text-[var(--accent)] transition-colors leading-snug break-words"
            >
              {paper.title ?? "Untitled"}
            </a>
          ) : (
            <span className="text-sm font-medium text-[var(--ink)] leading-snug break-words">
              {paper.title ?? "Untitled"}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {paper.source && (
            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
              paper.source === "Semantic Scholar"
                ? "bg-purple-500/15 text-purple-400 light:bg-[rgba(75,20,95,0.10)] light:text-[#4B1460]"
                : "bg-white/10 light:bg-[rgba(44,24,16,0.08)] text-[var(--ink-dim)]"
            }`}>
              {paper.source === "Semantic Scholar" ? "S2" : "OA"}
            </span>
          )}
          <span className="shrink-0 inline-flex items-center gap-1 rounded-full border border-transparent px-2 py-0.5 text-xs font-medium bg-slate-500/15 text-slate-400 light:bg-[rgba(44,24,16,0.08)] light:text-[var(--ink-dim)]">
            Related
          </span>
        </div>
      </div>

      {/* authors · year */}
      {authorYearMeta && (
        <p className="mt-1.5 text-xs text-[var(--ink-dim)] break-words">{authorYearMeta}</p>
      )}

      {/* journal */}
      {paper.journal && (
        <p className="mt-0.5 text-xs text-slate-500 light:text-[var(--ink-dim)] italic truncate" title={paper.journal}>
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
  customRange,
  onCustomRange,
  isPro = false,
  isSignedIn = false,
  onUpgrade,
}: {
  value: YearFilter;
  onChange: (f: YearFilter) => void;
  customRange?: CustomRange;
  onCustomRange?: (r: CustomRange) => void;
  isPro?: boolean;
  isSignedIn?: boolean;
  onUpgrade?: () => void;
}) {
  const t = useContext(LangContext);
  const [showProGate, setShowProGate] = useState(false);
  const [showCustomPicker, setShowCustomPicker] = useState(false);
  const [draftFrom, setDraftFrom] = useState("");
  const [draftTo, setDraftTo] = useState("");

  const handleApply = () => {
    const from = parseInt(draftFrom);
    const to = parseInt(draftTo);
    if (!isNaN(from) && !isNaN(to) && from <= to) {
      onCustomRange?.({ from, to });
      onChange("custom");
      setShowCustomPicker(false);
    }
  };

  const pillBase = "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors";
  const pillActive = "bg-white/[0.12] border-white/20 text-slate-200 light:bg-[rgba(44,24,16,0.10)] light:border-[rgba(44,24,16,0.22)] light:text-[var(--ink)]";
  const pillIdle = "border-transparent text-[var(--ink-dim)] hover:bg-white/[0.06] light:hover:bg-[var(--paper-deep)] hover:text-slate-300 light:hover:text-[var(--ink-dim)]";

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-widest text-[var(--ink-dim)] shrink-0">
        <svg className="h-3 w-3" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
          <rect x="3" y="4" width="14" height="13" rx="2"/>
          <path strokeLinecap="round" d="M3 8h14M7 2v4M13 2v4"/>
        </svg>
        {t("published")}
        {!isPro && <ProBadge />}
      </span>
      <div className={`relative flex items-center gap-1 flex-wrap ${!isPro ? "opacity-75" : ""}`} role="group" aria-label="Filter papers by publication date">
        {/* Preset filter pills */}
        {YEAR_FILTERS.filter(f => f.id !== "custom").map(({ id }) => {
          const active = value === id;
          const label = t(`filter_${id}` as Parameters<typeof t>[0]);
          return (
            <button
              key={id}
              type="button"
              onClick={() => isPro ? onChange(id) : setShowProGate((v) => !v)}
              aria-pressed={active}
              className={`${pillBase} ${active && isPro ? pillActive : pillIdle}`}
            >
              {label}
            </button>
          );
        })}

        {/* Custom range button */}
        <div className="relative">
          <button
            type="button"
            onClick={() => isPro ? setShowCustomPicker((v) => !v) : setShowProGate((v) => !v)}
            aria-pressed={value === "custom" && isPro}
            className={`${pillBase} ${value === "custom" && isPro ? pillActive : pillIdle}`}
          >
            {value === "custom" && customRange
              ? `${customRange.from}–${customRange.to}`
              : t("filter_custom")}
          </button>

          {/* Custom year range picker */}
          {showCustomPicker && isPro && (
            <>
              {/* Backdrop to close on outside click */}
              <div className="fixed inset-0 z-10" onClick={() => setShowCustomPicker(false)} />
              <div className="absolute left-0 top-full mt-2 z-20 flex items-center gap-1.5 rounded-xl border border-white/[0.12] light:border-[rgba(80,50,20,0.16)] bg-[#181818] light:bg-[rgba(248,246,234,0.99)] shadow-[0_8px_32px_rgba(0,0,0,0.45)] light:shadow-[0_4px_20px_rgba(80,50,20,0.12)] px-3 py-2.5 whitespace-nowrap">
                <input
                  type="number"
                  placeholder={t("from_year")}
                  value={draftFrom}
                  onChange={(e) => setDraftFrom(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleApply()}
                  min={1900}
                  max={2100}
                  className="w-[4.5rem] rounded-lg border border-white/[0.10] light:border-[var(--rule)] bg-white/[0.07] light:bg-[rgba(44,24,16,0.05)] px-2 py-1 text-xs text-[var(--ink)] placeholder-slate-600 light:placeholder-[rgba(44,24,16,0.35)] focus:outline-none focus:ring-1 focus:ring-white/20 light:focus:ring-[rgba(80,50,20,0.2)] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
                <span className="text-[var(--ink-dim)] text-xs select-none">–</span>
                <input
                  type="number"
                  placeholder={t("to_year")}
                  value={draftTo}
                  onChange={(e) => setDraftTo(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleApply()}
                  min={1900}
                  max={2100}
                  className="w-[4.5rem] rounded-lg border border-white/[0.10] light:border-[var(--rule)] bg-white/[0.07] light:bg-[rgba(44,24,16,0.05)] px-2 py-1 text-xs text-[var(--ink)] placeholder-slate-600 light:placeholder-[rgba(44,24,16,0.35)] focus:outline-none focus:ring-1 focus:ring-white/20 light:focus:ring-[rgba(80,50,20,0.2)] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
                <button
                  type="button"
                  onClick={handleApply}
                  className="rounded-lg bg-white/[0.10] light:bg-[rgba(44,24,16,0.08)] border border-white/[0.12] light:border-[rgba(80,50,20,0.16)] px-2.5 py-1 text-xs font-medium text-[var(--ink)] hover:bg-white/[0.16] light:hover:bg-[rgba(44,24,16,0.13)] transition-colors"
                >
                  {t("apply")}
                </button>
              </div>
            </>
          )}
        </div>

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

// ── language filter ───────────────────────────────────────────────────────────

type LangFilter = "all" | "en" | "zh" | "ja";

const LANG_OPTIONS: { id: LangFilter; label: string }[] = [
  { id: "all", label: "All languages" },
  { id: "en",  label: "English" },
  { id: "zh",  label: "中文" },
  { id: "ja",  label: "日本語" },
];

function LanguageFilter({
  value,
  onChange,
  isPro = false,
  isSignedIn = false,
  onUpgrade,
}: {
  value: LangFilter;
  onChange: (f: LangFilter) => void;
  isPro?: boolean;
  isSignedIn?: boolean;
  onUpgrade?: () => void;
}) {
  const t = useContext(LangContext);
  const [showProGate, setShowProGate] = useState(false);

  const pillBase = "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors";
  const pillActive = "bg-white/[0.12] border-white/20 text-slate-200 light:bg-[rgba(44,24,16,0.10)] light:border-[rgba(44,24,16,0.22)] light:text-[var(--ink)]";
  const pillIdle = "border-transparent text-[var(--ink-dim)] hover:bg-white/[0.06] light:hover:bg-[var(--paper-deep)] hover:text-slate-300 light:hover:text-[var(--ink-dim)]";

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-widest text-[var(--ink-dim)] shrink-0">
        <svg className="h-3 w-3" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
          <circle cx="10" cy="10" r="8"/>
          <path strokeLinecap="round" d="M2 10h16M10 2c-2 3-2 13 0 16M10 2c2 3 2 13 0 16"/>
        </svg>
        {t("lang_filter_label")}
        {!isPro && <ProBadge />}
      </span>
      <div className={`relative flex items-center gap-1 flex-wrap ${!isPro ? "opacity-75" : ""}`} role="group" aria-label="Filter papers by language">
        {LANG_OPTIONS.map(({ id, label: staticLabel }) => {
          const active = value === id;
          // "All languages" and "English" are translatable; "中文"/"日本語" stay in their own script
          const label = id === "all" ? t("lang_all") : id === "en" ? t("lang_en") : staticLabel;
          return (
            <button
              key={id}
              type="button"
              onClick={() => isPro ? onChange(id) : setShowProGate((v) => !v)}
              aria-pressed={active}
              className={`${pillBase} ${active && isPro ? pillActive : pillIdle}`}
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
  customRange,
  isPro = false,
  isSignedIn = false,
  onUpgrade,
  savedPaperKeys,
  onSaveToggle,
  zoteroConnected,
  onSaveToZotero,
  isExpanded = true,
  onToggle,
  isHovered = false,
  cardRef,
}: {
  result: ClaimResult;
  index: number;
  knownPaperKeys?: Set<string>;
  onUsageUpdate?: (remaining: number) => void;
  yearFilter?: YearFilter;
  customRange?: CustomRange;
  isPro?: boolean;
  isSignedIn?: boolean;
  onUpgrade?: () => void;
  savedPaperKeys?: Set<string>;
  onSaveToggle?: (paper: RatedPaper) => void;
  zoteroConnected?: boolean | null;
  onSaveToZotero?: (paper: Paper) => Promise<void>;
  isExpanded?: boolean;
  onToggle?: () => void;
  isHovered?: boolean;
  cardRef?: (el: HTMLDivElement | null) => void;
}) {
  const t = useContext(LangContext);
  const visiblePapers = result.papers.filter((p) => paperInRange(p.year, yearFilter, customRange));
  const hiddenCount = result.papers.length - visiblePapers.length;

  const topScore = visiblePapers.length > 0
    ? Math.max(...visiblePapers.map((p) => p.relevanceScore))
    : 0;

  const accentBorderColor =
    topScore >= 5 ? "var(--accent)" :
    topScore >= 4 ? "var(--ink-dim)" :
    "var(--rule)";

  return (
    <motion.div
      ref={cardRef}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: index * 0.06, ease: [0.25, 0.1, 0.25, 1] }}
      className="claim-card rounded-xl overflow-hidden"
      style={{
        background: isHovered ? "var(--paper-deep)" : "var(--paper)",
        border: `1px solid ${isHovered ? "var(--accent)" : "var(--rule)"}`,
        borderLeft: `3px solid ${accentBorderColor}`,
        transition: "background 0.15s ease, border-color 0.15s ease",
      }}
    >
      {/* claim header — click to collapse/expand */}
      <div
        className="px-4 py-3 flex items-start gap-3 select-none"
        style={{
          background: isHovered ? "transparent" : "var(--paper-deep)",
          borderBottom: isExpanded ? "1px solid var(--rule-soft)" : "none",
          cursor: onToggle ? "pointer" : "default",
        }}
        onClick={onToggle}
      >
        <span
          className="text-[11px] tracking-[0.8px] uppercase tabular-nums mt-0.5 shrink-0 w-5"
          style={{ color: "var(--ink-dim)", fontFamily: "var(--mono)" }}
        >
          {String(index + 1).padStart(2, "0")}
        </span>
        <p className="flex-1 text-[14px] italic leading-[1.5]" style={{ color: "var(--ink)", fontFamily: "var(--serif)" }}>
          {result.claim}
        </p>
        {onToggle && (
          <svg
            className="shrink-0 mt-1 transition-transform"
            style={{ color: "var(--ink-dim)", transform: isExpanded ? "rotate(0deg)" : "rotate(-90deg)" }}
            width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden
          >
            <polyline points="2 4 6 8 10 4"/>
          </svg>
        )}
      </div>

      {/* papers — collapsible */}
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            key="papers"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
            style={{ overflow: "hidden" }}
          >
            <div className="px-4 py-4">
              {result.papers.length === 0 ? (
                <p className="text-[12px] italic" style={{ color: "var(--ink-dim)", fontFamily: "var(--serif)" }}>
                  {t("no_relevant_papers")}
                </p>
              ) : visiblePapers.length === 0 ? (
                <p className="text-[12px] italic" style={{ color: "var(--ink-dim)", fontFamily: "var(--serif)" }}>
                  {t("no_papers_date_filter")}
                  {hiddenCount > 0 && (
                    <span className="ml-1">
                      {hiddenCount === 1 ? t("papers_hidden_one") : t("papers_hidden_many", { n: hiddenCount })}
                    </span>
                  )}
                </p>
              ) : (
                <div className="flex flex-col gap-3">
                  {visiblePapers.map((paper, i) => (
                    <PaperCard key={paper.doi ?? i} paper={paper} index={i} knownPaperKeys={knownPaperKeys} onUsageUpdate={onUsageUpdate} yearFilter={yearFilter} customRange={customRange} isPro={isPro} isSignedIn={isSignedIn} onUpgrade={onUpgrade} savedPaperKeys={savedPaperKeys} onSaveToggle={onSaveToggle} zoteroConnected={zoteroConnected} onSaveToZotero={onSaveToZotero} />
                  ))}
                  {hiddenCount > 0 && (
                    <p className="text-[11px] pt-0.5" style={{ color: "var(--ink-dim)", fontFamily: "var(--sans)" }}>
                      {hiddenCount === 1 ? t("older_papers_hidden_one") : t("older_papers_hidden_many", { n: hiddenCount })}
                    </p>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
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

// ── how to use modal ──────────────────────────────────────────────────────────

function HowToUseModal({ onClose }: { onClose: () => void }) {
  const t = useContext(LangContext);
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
            <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--rule)] shrink-0">
              <h2 id="how-to-use-title" className="font-semibold text-[var(--ink)] text-base">
                {t("how_it_works_title")}
              </h2>
              <button
                onClick={onClose}
                className="p-1.5 rounded-md text-[var(--ink-dim)] hover:text-[var(--ink)] hover:bg-[var(--paper-deep)] transition-colors"
                aria-label="Close"
              >
                <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
                  <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z"/>
                </svg>
              </button>
            </div>

            {/* body */}
            <div className="px-6 py-5 space-y-5 overflow-y-auto">
              <p className="text-sm text-[var(--ink-dim)] leading-relaxed">
                {t("how_it_works_intro")}
              </p>

              {/* steps */}
              <div>
                <p className="text-xs font-medium text-slate-500 light:text-[var(--ink-dim)] uppercase tracking-wide mb-2.5">{t("how_it_works_steps")}</p>
                <ol className="space-y-3">
                  {(["how_step_1", "how_step_2", "how_step_3", "how_step_4"] as const).map((key, idx) => (
                    <li key={key} className="flex items-start gap-3">
                      <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-[var(--paper-deep)] text-[var(--ink)] text-xs font-medium shrink-0 mt-0.5">
                        {idx + 1}
                      </span>
                      <p className="text-sm text-[var(--ink-dim)] leading-relaxed">{t(key)}</p>
                    </li>
                  ))}
                </ol>
              </div>

              {/* paper badges */}
              <div className="rounded-xl border border-[var(--rule)] bg-[var(--bg-deep)] px-4 py-3 space-y-2">
                <p className="text-xs font-medium text-slate-500 light:text-[var(--ink-dim)] uppercase tracking-wide">{t("paper_stats_title")}</p>
                <p className="text-xs text-slate-500 light:text-[var(--ink-dim)] leading-relaxed">
                  {t("paper_stats_intro")}
                </p>
                <div className="flex flex-col gap-2">
                  <div className="flex items-start gap-2.5">
                    <span className="text-orange-400 text-sm shrink-0 leading-none mt-0.5">🔥</span>
                    <span className="text-xs text-[var(--ink-dim)]"><strong className="text-orange-400 light:text-[#7A2000]">{t("badge_flame_title")}</strong> {t("badge_flame_desc")}</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <span className="text-violet-400 text-sm shrink-0 leading-none mt-0.5">★</span>
                    <span className="text-xs text-[var(--ink-dim)]"><strong className="text-violet-400 light:text-[#4B1460]">{t("badge_star_title")}</strong> {t("badge_star_desc")}</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <span className="text-sky-400 text-sm shrink-0 leading-none mt-0.5">▦</span>
                    <span className="text-xs text-[var(--ink-dim)]"><strong className="text-sky-400 light:text-[#0F3264]">{t("badge_bar_title")}</strong> {t("badge_bar_desc")}</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <span className="text-teal-400 text-sm shrink-0 leading-none mt-0.5">IF</span>
                    <span className="text-xs text-[var(--ink-dim)]"><strong className="text-teal-400 light:text-[#004B46]">{t("badge_if_title")}</strong> {t("badge_if_desc")}</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <span className="text-emerald-300 text-sm shrink-0 leading-none mt-0.5 font-semibold">Q</span>
                    <span className="text-xs text-[var(--ink-dim)]"><strong className="text-emerald-300 light:text-[#0A4620]">{t("badge_q_title")}</strong> {t("badge_q_desc")}</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <span className="text-emerald-400 text-sm shrink-0 leading-none mt-0.5">📖</span>
                    <span className="text-xs text-[var(--ink-dim)]"><strong className="text-emerald-400 light:text-[#0A3C19]">{t("badge_book_title")}</strong> {t("badge_book_desc")}</span>
                  </div>
                </div>
              </div>

              {/* relevance tiers */}
              <div className="rounded-xl border border-[var(--rule)] bg-[var(--bg-deep)] px-4 py-3 space-y-2">
                <p className="text-xs font-medium text-slate-500 light:text-[var(--ink-dim)] uppercase tracking-wide">{t("relevance_tiers_title")}</p>
                <p className="text-xs text-slate-500 light:text-[var(--ink-dim)] leading-relaxed">
                  {t("relevance_tiers_intro")}
                </p>
                <div className="flex flex-col gap-2">
                  <div className="flex items-start gap-2.5">
                    <span className="inline-block w-2.5 h-2.5 rounded-full bg-green-400 shrink-0 mt-0.5" />
                    <span className="text-xs text-[var(--ink-dim)]"><strong className="text-green-400 light:text-[#1E4620]">{t("tier_direct")}</strong> — {t("tier_direct_desc")}</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <span className="inline-block w-2.5 h-2.5 rounded-full bg-blue-400 shrink-0 mt-0.5" />
                    <span className="text-xs text-[var(--ink-dim)]"><strong className="text-blue-400 light:text-[#2A3070]">{t("tier_high")}</strong> — {t("tier_high_desc")}</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <span className="inline-block w-2.5 h-2.5 rounded-full bg-amber-400 shrink-0 mt-0.5" />
                    <span className="text-xs text-[var(--ink-dim)]"><strong className="text-amber-400 light:text-[#6B3A00]">{t("tier_moderate")}</strong> — {t("tier_moderate_desc")}</span>
                  </div>
                </div>
              </div>

              {/* good to know */}
              <div className="space-y-2.5">
                <p className="text-xs font-medium text-slate-500 light:text-[var(--ink-dim)] uppercase tracking-wide">{t("good_to_know_title")}</p>
                <div className="flex items-start gap-2.5">
                  <span className="text-base shrink-0 leading-none">🌐</span>
                  <p className="text-xs text-slate-400 light:text-[var(--ink-dim)] leading-relaxed">
                    <strong className="text-[var(--ink)]">{t("gk_lang_title")}</strong> {t("gk_lang_desc")}
                  </p>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="text-base shrink-0 leading-none">🔢</span>
                  <p className="text-xs text-slate-400 light:text-[var(--ink-dim)] leading-relaxed">
                    <strong className="text-[var(--ink)]">{t("gk_daily_title")}</strong> {t("gk_daily_desc")}
                  </p>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="text-base shrink-0 leading-none">👤</span>
                  <p className="text-xs text-slate-400 light:text-[var(--ink-dim)] leading-relaxed">
                    <strong className="text-[var(--ink)]">{t("gk_signin_title")}</strong> {t("gk_signin_desc")}
                  </p>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="text-base shrink-0 leading-none">💡</span>
                  <p className="text-xs text-slate-400 light:text-[var(--ink-dim)] leading-relaxed">
                    <strong className="text-[var(--ink)]">{t("gk_example_title")}</strong> {t("gk_example_desc")}
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

// ── cancel subscription dialog ───────────────────────────────────────────────

type CancelPreview = {
  eligible_for_refund: boolean;
  days_since_start: number;
  refund_amount_cents: number;
  current_period_end_iso: string;
};

function CancelDialog({
  onClose,
  onCancelled,
}: {
  onClose: () => void;
  onCancelled: () => void;
}) {
  const t = useContext(LangContext);
  const [phase, setPhase] = useState<"loading" | "confirm" | "cancelling" | "done" | "error">("loading");
  const [preview, setPreview] = useState<CancelPreview | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [result, setResult] = useState<{ refunded: boolean; refund_amount_cents: number; cancel_at: string } | null>(null);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);

  useEffect(() => {
    fetch("/api/cancel-subscription")
      .then((r) => r.json())
      .then((data) => {
        if (data.error) { setErrorMsg(data.error); setPhase("error"); }
        else { setPreview(data as CancelPreview); setPhase("confirm"); }
      })
      .catch(() => { setErrorMsg("Failed to load subscription info."); setPhase("error"); });
  }, []);

  const handleConfirm = async () => {
    setPhase("cancelling");
    try {
      const r = await fetch("/api/cancel-subscription", { method: "POST" });
      const data = await r.json();
      if (data.error) { setErrorMsg(data.error); setPhase("error"); return; }
      setResult(data);
      setPhase("done");
      onCancelled();
    } catch {
      setErrorMsg("Something went wrong. Please try again.");
      setPhase("error");
    }
  };

  const periodEndDate = preview
    ? new Date(preview.current_period_end_iso).toLocaleDateString("en-US", {
        month: "long", day: "numeric", year: "numeric",
      })
    : "";
  const refundFormatted = preview
    ? `$${(preview.refund_amount_cents / 100).toFixed(2)}`
    : "";

  return (
    <AnimatePresence>
      <>
        <motion.div
          key="cancel-backdrop"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 bg-black/40 z-50 backdrop-blur-[2px]"
          onClick={phase === "cancelling" ? undefined : onClose}
        />
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
          <motion.div
            key="cancel-modal"
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
            className="pointer-events-auto w-full max-w-sm"
            role="dialog" aria-modal="true"
          >
            <div className="glass-panel rounded-2xl shadow-2xl border overflow-hidden">
              {/* header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--rule)]">
                <h2 className="font-semibold text-[var(--ink)] text-base">
                  {phase === "done" ? t("sub_cancelled_title") : t("cancel_sub_title")}
                </h2>
                {phase !== "cancelling" && (
                  <button onClick={onClose} className="p-1.5 rounded-md text-slate-500 hover:text-[var(--ink)] hover:bg-[var(--paper-deep)] transition-colors" aria-label="Close">
                    <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
                      <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z"/>
                    </svg>
                  </button>
                )}
              </div>

              <div className="px-5 py-5 space-y-4">
                {/* loading */}
                {phase === "loading" && (
                  <div className="flex items-center justify-center py-6">
                    <svg className="animate-spin h-5 w-5 text-slate-400" viewBox="0 0 24 24" fill="none" aria-hidden>
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                    </svg>
                  </div>
                )}

                {/* confirm */}
                {phase === "confirm" && preview && (
                  <>
                    {preview.eligible_for_refund ? (
                      <div className="rounded-lg bg-emerald-500/10 light:bg-emerald-700/[0.08] border border-emerald-500/20 light:border-emerald-700/20 px-4 py-3">
                        <p className="text-sm font-medium text-emerald-300 light:text-emerald-800 mb-1">{t("full_refund_eligible")}</p>
                        <p className="text-xs text-emerald-400/80 light:text-emerald-700/80 leading-relaxed">
                          {preview.refund_amount_cents > 0
                            ? `You subscribed ${preview.days_since_start} day${preview.days_since_start !== 1 ? "s" : ""} ago. You'll receive a full refund of ${refundFormatted} within 5–10 business days.`
                            : t("trial_cancel_msg")}
                        </p>
                      </div>
                    ) : (
                      <div className="rounded-lg bg-amber-500/10 light:bg-amber-700/[0.06] border border-amber-500/20 light:border-amber-700/20 px-4 py-3">
                        <p className="text-sm font-medium text-amber-300 light:text-amber-800 mb-1">{t("no_refund_access_until", { date: periodEndDate })}</p>
                        <p className="text-xs text-amber-400/80 light:text-amber-700/80 leading-relaxed">
                          It&apos;s been {preview.days_since_start} day{preview.days_since_start !== 1 ? "s" : ""} since you subscribed (refunds are available within {7} days). Your Pro access will continue until {periodEndDate}.
                        </p>
                      </div>
                    )}
                    <p className="text-xs text-[var(--ink-dim)]">
                      {t("sure_cancel_sub")}
                    </p>
                    <div className="flex gap-2 pt-1">
                      <button
                        onClick={onClose}
                        className="flex-1 rounded-lg border border-white/[0.12] light:border-[rgba(80,50,20,0.18)] px-3 py-2 text-sm text-[var(--ink-dim)] hover:bg-white/[0.06] light:hover:bg-black/[0.04] transition-colors"
                      >
                        {t("keep_pro")}
                      </button>
                      <button
                        onClick={handleConfirm}
                        className="flex-1 rounded-lg bg-red-500/15 border border-red-500/30 light:bg-red-600/10 light:border-red-600/25 px-3 py-2 text-sm font-medium text-red-400 light:text-red-700 hover:bg-red-500/25 light:hover:bg-red-600/15 transition-colors"
                      >
                        {t("yes_cancel")}
                      </button>
                    </div>
                  </>
                )}

                {/* cancelling */}
                {phase === "cancelling" && (
                  <div className="flex items-center justify-center gap-3 py-6">
                    <svg className="animate-spin h-4 w-4 text-slate-400" viewBox="0 0 24 24" fill="none" aria-hidden>
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                    </svg>
                    <span className="text-sm text-slate-400">{t("cancelling")}</span>
                  </div>
                )}

                {/* done */}
                {phase === "done" && result && (
                  <>
                    <div className="rounded-lg bg-slate-500/10 light:bg-slate-700/[0.06] border border-slate-500/20 px-4 py-3">
                      {result.refunded ? (
                        <p className="text-sm text-[var(--ink)] leading-relaxed">
                          Your subscription has been cancelled and a refund of{" "}
                          <span className="font-semibold">${(result.refund_amount_cents / 100).toFixed(2)}</span>{" "}
                          has been issued. It will appear within 5–10 business days.
                        </p>
                      ) : result.cancel_at === "immediate" ? (
                        <p className="text-sm text-[var(--ink)] leading-relaxed">
                          Your subscription has been cancelled immediately.
                        </p>
                      ) : (
                        <p className="text-sm text-[var(--ink)] leading-relaxed">
                          Your subscription has been cancelled. You&apos;ll retain Pro access until{" "}
                          <span className="font-semibold">
                            {new Date(result.cancel_at).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                          </span>.
                        </p>
                      )}
                    </div>
                    <button
                      onClick={onClose}
                      className="w-full rounded-lg border border-white/[0.12] light:border-[rgba(80,50,20,0.18)] px-3 py-2 text-sm text-[var(--ink-dim)] hover:bg-white/[0.06] light:hover:bg-black/[0.04] transition-colors"
                    >
                      {t("close")}
                    </button>
                  </>
                )}

                {/* error */}
                {phase === "error" && (
                  <>
                    <p className="text-sm text-red-400 light:text-red-700">{errorMsg}</p>
                    <button
                      onClick={onClose}
                      className="w-full rounded-lg border border-white/[0.12] light:border-[rgba(80,50,20,0.18)] px-3 py-2 text-sm text-[var(--ink-dim)] hover:bg-white/[0.06] light:hover:bg-black/[0.04] transition-colors"
                    >
                      {t("close")}
                    </button>
                  </>
                )}
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
  onSuccess,
  hasUsedTrial,
}: {
  onClose: () => void;
  onSuccess: () => void;
  hasUsedTrial: boolean;
}) {
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);

  const t = useContext(LangContext);
  const trialEndDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString(
    "en-US", { month: "long", day: "numeric", year: "numeric" }
  );

  // ── inline card flow ──────────────────────────────────────────────────────
  const [step, setStep] = useState<"plan" | "card">("plan");
  const [selectedPlan, setSelectedPlan] = useState<"monthly" | "yearly">("monthly");
  const [cardError, setCardError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  // Refs for Stripe objects — not state because re-render would remount the element
  const stripeRef = useRef<import("@stripe/stripe-js").Stripe | null>(null);
  const cardElementRef = useRef<import("@stripe/stripe-js").StripeCardElement | null>(null);
  const mountDivRef = useRef<HTMLDivElement | null>(null);

  // Load Stripe and mount the Card Element when the card step becomes visible
  useEffect(() => {
    if (step !== "card") return;

    let cancelled = false;

    (async () => {
      // 1. Get publishable key from server (avoids NEXT_PUBLIC_ prefix requirement)
      const cfgRes = await fetch("/api/stripe-config");
      if (cancelled) return;
      if (!cfgRes.ok) {
        if (!cancelled) setCardError("Payment system is unavailable. Please try again later.");
        return;
      }
      const { publishableKey } = await cfgRes.json();
      if (!publishableKey) {
        if (!cancelled) setCardError("Payment system is not configured. Please contact support.");
        return;
      }

      // 2. Load Stripe.js
      const { loadStripe } = await import("@stripe/stripe-js");
      const stripe = await loadStripe(publishableKey);
      if (cancelled) return;
      if (!stripe) {
        setCardError("Failed to load payment system. Please refresh and try again.");
        return;
      }
      stripeRef.current = stripe;

      // 3. Create and mount the card element
      const elements = stripe.elements({
        fonts: [{ cssSrc: "https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500" }],
      });
      const isDark = !document.documentElement.classList.contains("light");
      const card = elements.create("card", {
        style: {
          base: {
            fontFamily: "'DM Sans', system-ui, sans-serif",
            fontSize: "14px",
            color: isDark ? "oklch(0.93 0.008 80)" : "oklch(0.22 0.015 60)",
            "::placeholder": { color: isDark ? "oklch(0.55 0.008 80)" : "oklch(0.65 0.008 80)" },
            iconColor: isDark ? "oklch(0.72 0.008 80)" : "oklch(0.52 0.012 60)",
          },
          invalid: {
            color: "#e53e3e",
            iconColor: "#e53e3e",
          },
        },
      });

      if (!mountDivRef.current || cancelled) return;
      card.mount(mountDivRef.current);
      cardElementRef.current = card;

      card.on("change", (event) => {
        setCardError(event.error ? event.error.message : null);
      });
    })();

    return () => {
      cancelled = true;
      cardElementRef.current?.destroy();
      cardElementRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  const handleCardSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Capture refs before any state changes — setStep("processing") triggers
    // useEffect cleanup which destroys the card element and nulls the ref.
    const stripe = stripeRef.current;
    const card = cardElementRef.current;
    if (!stripe || !card || processing) return;

    setProcessing(true);
    setCardError(null);

    try {
      // 1. Create a SetupIntent ($0 card validation)
      const siRes = await fetch("/api/setup-intent", { method: "POST" });
      if (!siRes.ok) {
        const { error } = await siRes.json();
        throw new Error(error ?? "Could not start card validation");
      }
      const { clientSecret } = await siRes.json();

      // 2. Confirm the card setup — validates the card without charging
      const { setupIntent, error: setupError } = await stripe.confirmCardSetup(
        clientSecret,
        { payment_method: { card } }
      );

      if (setupError) {
        // Strip raw Stripe SDK messages; show a clean user-facing error instead
        const msg = setupError.message ?? "";
        const isTechnical = /Invalid value|should be an object|element\.|You specified/i.test(msg);
        setCardError(isTechnical ? "Your card details are invalid. Please check them and try again." : msg);
        setStep("card");
        setProcessing(false);
        return;
      }

      const paymentMethodId = setupIntent?.payment_method as string;

      // 3. Create the subscription using the validated payment method
      const subRes = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: selectedPlan, paymentMethodId }),
      });
      const subData = await subRes.json();

      if (!subRes.ok || subData.error) {
        setCardError(subData.error ?? "Subscription failed. Please try again.");
        setStep("card");
        setProcessing(false);
        return;
      }

      // 4. If the first invoice needs 3DS confirmation, handle it
      if (subData.requiresAction && subData.clientSecret) {
        const { error: actionError } = await stripe.confirmCardPayment(
          subData.clientSecret
        );
        if (actionError) {
          setCardError(actionError.message ?? "Payment authentication failed");
          setStep("card");
          setProcessing(false);
          return;
        }
      }

      // Success!
      onSuccess();
    } catch (err) {
      setCardError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
      setStep("card");
      setProcessing(false);
    }
  };

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
          onClick={processing ? undefined : onClose}
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
            <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--rule)] shrink-0">
              <div className="flex items-center gap-2">
                {step === "card" && (
                  <button
                    onClick={() => { setStep("plan"); setCardError(null); }}
                    className="p-1 rounded-md text-[var(--ink-dim)] hover:text-[var(--ink)] transition-colors -ml-1 mr-1"
                    aria-label="Back"
                  >
                    <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
                      <path fillRule="evenodd" d="M17 10a.75.75 0 01-.75.75H5.612l4.158 3.96a.75.75 0 11-1.04 1.08l-5.5-5.25a.75.75 0 010-1.08l5.5-5.25a.75.75 0 111.04 1.08L5.612 9.25H16.25A.75.75 0 0117 10z" clipRule="evenodd"/>
                    </svg>
                  </button>
                )}
                <div>
                  <h2 id="plan-modal-title" className="font-semibold text-[var(--ink)] text-base">
                    {step === "card"
                      ? t("card_step_title")
                      : hasUsedTrial ? t("upgrade_to_pro") : t("start_trial_title")}
                  </h2>
                  <p className="text-xs text-[var(--ink-dim)] mt-0.5">
                    {step === "card"
                      ? hasUsedTrial
                        ? `${selectedPlan === "yearly" ? "$29.99/year" : "$2.99/month"} — ${t("card_step_paid_sub")}`
                        : t("card_step_trial_sub")
                      : hasUsedTrial ? t("upgrade_billing_sub") : t("trial_billing_sub")}
                  </p>
                </div>
              </div>
              <button
                onClick={processing ? undefined : onClose}
                className="p-1.5 rounded-md text-[var(--ink-dim)] hover:text-[var(--ink)] hover:bg-[var(--paper-deep)] transition-colors disabled:opacity-40"
                aria-label="Close"
                disabled={processing}
              >
                <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
                  <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z"/>
                </svg>
              </button>
            </div>

            {/* ── step: plan selection ── */}
            {step === "plan" && (
            <div className="overflow-y-auto">
              {/* trial / paid-subscription banner */}
              {hasUsedTrial ? (
                <div className="mx-6 mt-4 flex items-start gap-2.5 rounded-lg bg-amber-500/10 light:bg-amber-700/[0.06] border border-amber-500/20 light:border-amber-700/20 px-3.5 py-3">
                  <svg className="mt-px h-4 w-4 shrink-0 text-amber-400 light:text-amber-700" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
                    <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd"/>
                  </svg>
                  <p className="text-xs text-amber-300 light:text-amber-800 leading-relaxed">
                    <span className="font-semibold">{t("trial_used_banner_title")}</span> {t("trial_used_banner_sub")}
                  </p>
                </div>
              ) : (
                <div className="mx-6 mt-4 flex items-start gap-2.5 rounded-lg bg-emerald-500/10 light:bg-emerald-700/[0.08] border border-emerald-500/20 light:border-emerald-700/20 px-3.5 py-3">
                  <svg className="mt-px h-4 w-4 shrink-0 text-emerald-400 light:text-emerald-700" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd"/>
                  </svg>
                  <p className="text-xs text-emerald-300 light:text-emerald-800 leading-relaxed">
                    <span className="font-semibold">{t("trial_start_banner_title")}</span>{" "}
                    {t("trial_start_banner_sub", { date: trialEndDate })}
                  </p>
                </div>
              )}

              {/* feature list */}
              <div className="px-6 pt-5 pb-4">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-[var(--ink-dim)] mb-3">
                  {t("what_you_unlock")}
                </p>
                <ul className="grid grid-cols-2 gap-x-4 gap-y-2.5">
                  {([
                    ["feat_unlimited", "feat_unlimited_sub"],
                    ["feat_char_limit", "feat_char_limit_sub"],
                    ["feat_omakase", "feat_omakase_sub"],
                    ["feat_zotero", "feat_zotero_sub"],
                    ["feat_ai_model", "feat_ai_model_sub"],
                    ["feat_date_filter", "feat_date_filter_sub"],
                    ["feat_find_more", "feat_find_more_sub"],
                    ["feat_future", "feat_future_sub"],
                  ] as [string, string][]).map(([titleKey, subKey]) => (
                    <li key={titleKey} className="flex items-start gap-2">
                      <span className="mt-0.5 shrink-0 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500/15 light:bg-emerald-700/10">
                        <svg className="h-2.5 w-2.5 text-emerald-400 light:text-emerald-700" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                          <polyline points="2 6 5 9 10 3"/>
                        </svg>
                      </span>
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-[var(--ink)] leading-tight">{t(titleKey as Parameters<typeof t>[0])}</p>
                        <p className="text-[10px] text-[var(--ink-dim)] leading-tight mt-0.5">{t(subKey as Parameters<typeof t>[0])}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>

              {/* divider */}
              <div className="mx-6 border-t border-[var(--rule-soft)]" />

              {/* plan cards — side by side */}
              <div className="px-6 py-5">
                <div className="grid grid-cols-2 gap-3">

                  {/* Monthly */}
                  <button
                    onClick={() => { setSelectedPlan("monthly"); setStep("card"); }}
                    className="relative flex flex-col rounded-xl border-2 border-[var(--rule)] px-4 pt-4 pb-4 text-left
                               hover:border-[var(--accent)] hover:bg-[var(--paper-deep)]
                               transition-all"
                  >
                    <p className="text-xs font-semibold text-[var(--ink-dim)] uppercase tracking-wide mb-3">{t("plan_monthly")}</p>
                    <div className="mt-auto">
                      <p className="text-2xl font-bold text-[var(--ink)] leading-none">$2.99</p>
                      <p className="text-[11px] text-[var(--ink-dim)] mt-1">{t("plan_per_month")}</p>
                      <p className="text-[10px] text-[var(--ink-dim)] mt-2.5">{t("plan_billed_monthly")}</p>
                    </div>
                  </button>

                  {/* Yearly — highlighted */}
                  <button
                    onClick={() => { setSelectedPlan("yearly"); setStep("card"); }}
                    className="relative flex flex-col rounded-xl border-2 border-amber-500/60 light:border-amber-600/50 bg-amber-500/[0.08] light:bg-amber-700/[0.06] px-4 pt-4 pb-4 text-left
                               hover:border-amber-500/80 light:hover:border-amber-600/70 hover:bg-amber-500/[0.12] light:hover:bg-amber-700/[0.09]
                               shadow-[0_0_20px_rgba(245,158,11,0.12)] light:shadow-[0_0_16px_rgba(161,84,0,0.10)]
                               transition-all"
                  >
                    {/* Save badge */}
                    <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 inline-flex items-center rounded-full bg-amber-500 light:bg-amber-600 px-2.5 py-0.5 text-[10px] font-bold text-white uppercase tracking-wide whitespace-nowrap shadow-sm">
                      {t("plan_save_2mo")}
                    </span>
                    <p className="text-xs font-semibold text-amber-400 light:text-amber-700 uppercase tracking-wide mb-3">{t("plan_yearly")}</p>
                    <div className="mt-auto">
                      <p className="text-2xl font-bold text-amber-300 light:text-amber-800 leading-none">$29.99</p>
                      <p className="text-[11px] text-amber-500/80 light:text-amber-700/70 mt-1">{t("plan_per_year")}</p>
                      <p className="text-[10px] text-amber-600/70 light:text-amber-800/60 mt-2.5">≈ $2.50 / month</p>
                    </div>
                  </button>
                </div>
              </div>
            </div>
            )}

            {/* ── step: card entry ── */}
            {step === "card" && (
            <form onSubmit={handleCardSubmit} className="overflow-y-auto">
              <div className="px-6 py-5 space-y-4">
                {/* plan summary */}
                <div className="flex items-center justify-between rounded-lg px-4 py-3" style={{ background: "var(--paper-deep)", border: "1px solid var(--rule-soft)" }}>
                  <div>
                    <p className="text-xs font-semibold text-[var(--ink)] uppercase tracking-wide">
                      {selectedPlan === "yearly" ? t("card_plan_yearly") : t("card_plan_monthly")}
                    </p>
                    <p className="text-[11px] text-[var(--ink-dim)] mt-0.5">
                      {selectedPlan === "yearly" ? "$29.99 / year  ≈ $2.50 / month" : "$2.99 / month"}
                    </p>
                  </div>
                  {!hasUsedTrial && (
                    <span className="inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-semibold bg-emerald-500/15 text-emerald-400 light:text-emerald-700 border border-emerald-500/20">
                      {t("card_trial_badge")}
                    </span>
                  )}
                </div>

                {/* card element container */}
                <div>
                  <label className="block text-[11px] font-medium text-[var(--ink-dim)] uppercase tracking-wide mb-1.5">
                    {t("card_details_label")}
                  </label>
                  <div
                    ref={mountDivRef}
                    className="rounded-lg px-3 py-3 transition-colors"
                    style={{
                      background: "var(--bg-deep)",
                      border: `1px solid ${cardError ? "#e53e3e" : "var(--rule)"}`,
                      minHeight: 42,
                    }}
                  />
                  {cardError && (
                    <p className="mt-1.5 text-xs text-red-400" role="alert">
                      {cardError}
                    </p>
                  )}
                </div>

                {/* security note */}
                <p className="text-[10px] text-[var(--ink-dim)] flex items-center gap-1.5">
                  <svg className="h-3 w-3 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/>
                  </svg>
                  {t("card_stripe_security")}
                </p>
              </div>

              <div className="px-6 pb-6">
                <button
                  type="submit"
                  disabled={processing}
                  className="w-full rounded-xl py-3 text-sm font-semibold transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                  style={{ background: "var(--ink)", color: "var(--paper)" }}
                >
                  {processing ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden>
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                      </svg>
                      {t("card_processing")}
                    </span>
                  ) : hasUsedTrial ? (
                    `${t("card_subscribe")} · ${selectedPlan === "yearly" ? "$29.99/year" : "$2.99/month"}`
                  ) : (
                    t("card_start_trial")
                  )}
                </button>
              </div>
            </form>
            )}
          </div>
        </motion.div>
        </div>
      </>
    </AnimatePresence>
  );
}

// ── localStorage history ──────────────────────────────────────────────────────

// ── localStorage tabs ────────────────────────────────────────────────────────

const LS_TABS_KEY = "rf_tabs";
const MAX_TAB_ENTRIES = 30;

function lsGetTabs(): SearchTab[] {
  try {
    return JSON.parse(localStorage.getItem(LS_TABS_KEY) ?? "[]") as SearchTab[];
  } catch {
    return [];
  }
}

function lsSaveTabs(tabs: SearchTab[]): void {
  try {
    localStorage.setItem(LS_TABS_KEY, JSON.stringify(tabs.slice(0, MAX_TAB_ENTRIES)));
  } catch {
    // localStorage unavailable
  }
}

function lsAddTab(tab: Omit<SearchTab, "id" | "createdAt" | "updatedAt">): string {
  const id = Date.now().toString();
  const now = new Date().toISOString();
  const newTab: SearchTab = { ...tab, id, createdAt: now, updatedAt: now };
  lsSaveTabs([newTab, ...lsGetTabs()]);
  return id;
}

function lsUpdateTab(id: string, patch: Partial<Omit<SearchTab, "id" | "createdAt">>): void {
  const tabs = lsGetTabs().map((t) =>
    t.id === id ? { ...t, ...patch, updatedAt: new Date().toISOString() } : t
  );
  // Re-sort so the updated tab bubbles to the top
  tabs.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  lsSaveTabs(tabs);
}

function lsDeleteTab(id: string): void {
  lsSaveTabs(lsGetTabs().filter((t) => t.id !== id));
}

function lsStarTab(id: string, starred: boolean): void {
  // Don't change updatedAt — starring shouldn't reorder the tab
  lsSaveTabs(lsGetTabs().map((t) => (t.id === id ? { ...t, starred } : t)));
}

// ── localStorage saved papers ────────────────────────────────────────────────

const LS_SAVED_PAPERS_KEY = "rf_saved_papers";

function lsGetSavedPapers(): SavedPaper[] {
  try {
    return JSON.parse(localStorage.getItem(LS_SAVED_PAPERS_KEY) ?? "[]") as SavedPaper[];
  } catch {
    return [];
  }
}

function lsSaveSavedPapers(papers: SavedPaper[]): void {
  try {
    localStorage.setItem(LS_SAVED_PAPERS_KEY, JSON.stringify(papers));
  } catch {
    // localStorage unavailable
  }
}

function lsAddSavedPaper(paper: Omit<SavedPaper, "id" | "createdAt">): string {
  const id = Date.now().toString();
  const newPaper: SavedPaper = { ...paper, id, createdAt: new Date().toISOString() };
  lsSaveSavedPapers([newPaper, ...lsGetSavedPapers()]);
  return id;
}

function lsRemoveSavedPaper(id: string): void {
  lsSaveSavedPapers(lsGetSavedPapers().filter((p) => p.id !== id));
}

// ── SidebarInner ─────────────────────────────────────────────────────────────
// Renders the full sidebar content. Used by both the desktop push sidebar and
// the mobile drawer overlay so content never has to be duplicated.

function SidebarInner({
  session,
  isPro,
  upgrading,
  tabs,
  activeTabId,
  onClose,
  onNewSearch,
  onLoadTab,
  onStarTab,
  onDeleteTab,
  onHowTo,
  onUpgrade,
  onCancelSubscription,
  onSignOut,
}: {
  session: { user?: { name?: string | null; email?: string | null; image?: string | null } | null } | null;
  isPro: boolean;
  upgrading: boolean;
  tabs: SearchTab[];
  activeTabId: string | null;
  onClose: () => void;
  onNewSearch: () => void;
  onLoadTab: (tab: SearchTab) => void;
  onStarTab: (id: string) => void;
  onDeleteTab: (id: string) => void;
  onHowTo: () => void;
  onUpgrade: () => void;
  onCancelSubscription: () => void;
  onSignOut: () => void;
}) {
  const t = useContext(LangContext);
  const starredTabs = tabs.filter((tab) => tab.starred);
  const recentTabs  = tabs.filter((tab) => !tab.starred);
  const isAdmin = ["sainayaunglinn@gmail.com", "kangfuyanjin@gmail.com"].includes(session?.user?.email ?? "");

  return (
    <div className="flex flex-col h-full">

      {/* ── Header ── */}
      <div className="flex items-center justify-between px-4 pt-4 pb-3 shrink-0">
        <span className="font-[family-name:var(--serif)] text-[14px] font-medium select-none" style={{ color: "var(--ink)" }}>
          Reference Finder
        </span>
        <button
          type="button"
          onClick={onClose}
          aria-label={t("aria_collapse_sidebar")}
          className="flex items-center justify-center w-7 h-7 rounded-lg transition-colors"
          style={{ color: "var(--ink-dim)" }}
          onMouseEnter={e => (e.currentTarget.style.color = "var(--ink)")}
          onMouseLeave={e => (e.currentTarget.style.color = "var(--ink-dim)")}
        >
          <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
            <path fillRule="evenodd" d="M11.78 5.22a.75.75 0 0 1 0 1.06L8.06 10l3.72 3.72a.75.75 0 1 1-1.06 1.06l-4.25-4.25a.75.75 0 0 1 0-1.06l4.25-4.25a.75.75 0 0 1 1.06 0z" clipRule="evenodd" />
          </svg>
        </button>
      </div>

      {/* ── Profile + plan ── */}
      {session && (
        <div className="px-4 pb-4 shrink-0 border-b" style={{ borderColor: "var(--rule)" }}>
          <div className="flex items-center gap-3 mb-3">
            {session.user?.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={session.user.image}
                alt=""
                className="w-9 h-9 rounded-full shrink-0 object-cover ring-1 ring-white/10 light:ring-[rgba(80,50,20,0.12)]"
              />
            ) : (
              <div className="w-9 h-9 rounded-full bg-amber-500/20 flex items-center justify-center shrink-0 ring-1 ring-amber-500/20">
                <span className="text-sm font-semibold text-amber-400 light:text-amber-700">
                  {(session.user?.name ?? session.user?.email ?? "?")[0].toUpperCase()}
                </span>
              </div>
            )}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 min-w-0">
                <p className="text-sm font-medium text-[var(--ink)] truncate leading-snug">
                  {session.user?.name ?? session.user?.email ?? "User"}
                </p>
                {isPro && (
                  <span className="shrink-0 inline-flex items-center gap-0.5 rounded-full border border-amber-500/35 bg-amber-500/[0.12] px-1.5 py-px text-[9px] font-bold uppercase tracking-wider text-amber-400 light:text-amber-700">
                    Pro
                  </span>
                )}
              </div>
              {session.user?.name && session.user?.email && (
                <p className="text-[11px] text-[var(--ink-dim)] truncate mt-0.5">
                  {session.user.email}
                </p>
              )}
            </div>
          </div>

          {/* Upgrade to Pro button — free users only */}
          {!isPro && (
            <button
              type="button"
              onClick={onUpgrade}
              disabled={upgrading}
              className="btn-upgrade w-full flex items-center justify-center gap-2 rounded-lg border border-amber-500/30 light:border-amber-700/35 bg-amber-500/[0.10] light:bg-amber-500/[0.07] px-3 py-2 text-xs font-semibold text-amber-400 light:text-amber-700 hover:bg-amber-500/[0.17] light:hover:bg-amber-500/[0.11] transition-colors disabled:opacity-50"
            >
              <svg className="h-3.5 w-3.5 shrink-0" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
              </svg>
              {upgrading ? t("plan_redirecting") : t("upgrade_to_pro")}
            </button>
          )}

          {/* Manage subscription link — Pro non-admin users */}
          {isPro && !isAdmin && (
            <button
              type="button"
              onClick={onCancelSubscription}
              className="mt-2 w-full text-center text-[10px] text-[var(--ink-dim)] hover:text-slate-400 light:hover:text-[var(--ink-dim)] underline underline-offset-2 transition-colors"
            >
              {t("manage_subscription")}
            </button>
          )}
        </div>
      )}

      {/* ── New Search button ── */}
      <div className="px-3 pt-3 pb-2 shrink-0">
        <button
          type="button"
          onClick={onNewSearch}
          className="flex items-center gap-2 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-[var(--ink)] bg-white/[0.08] light:bg-black/[0.07] hover:bg-white/[0.13] light:hover:bg-black/[0.11] transition-colors text-left"
        >
          <svg className="h-4 w-4 shrink-0" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
            <path d="M10.75 4.75a.75.75 0 0 0-1.5 0v4.5h-4.5a.75.75 0 0 0 0 1.5h4.5v4.5a.75.75 0 0 0 1.5 0v-4.5h4.5a.75.75 0 0 0 0-1.5h-4.5v-4.5z" />
          </svg>
          {t("new_search")}
        </button>
      </div>

      {/* ── Scrollable searches list ── */}
      <div className="flex-1 overflow-y-auto min-h-0 flex flex-col">

        <div className="px-2 py-1 flex flex-col gap-0.5">
          {starredTabs.length > 0 && (
            <>
              <p className="px-3 pt-1 pb-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-amber-500/70 light:text-amber-700/60">
                {t("sidebar_starred")}
              </p>
              {starredTabs.map((tab) => (
                <SidebarTabRow key={tab.id} tab={tab} activeTabId={activeTabId} onLoad={onLoadTab} onStar={onStarTab} onDelete={onDeleteTab} />
              ))}
              {recentTabs.length > 0 && (
                <p className="px-3 pt-2 pb-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--ink-dim)]">
                  {t("sidebar_recent")}
                </p>
              )}
            </>
          )}
          {starredTabs.length === 0 && recentTabs.length === 0 && (
            <p className="px-3 py-3 text-xs text-[var(--ink-dim)]">{t("no_searches_yet")}</p>
          )}
          {recentTabs.map((tab) => (
            <SidebarTabRow key={tab.id} tab={tab} activeTabId={activeTabId} onLoad={onLoadTab} onStar={onStarTab} onDelete={onDeleteTab} />
          ))}
        </div>

        <div className="flex-1" />

        {/* Nav items */}
        <nav className="px-2 py-2 flex flex-col gap-0.5 border-t border-white/[0.06] light:border-[var(--rule-soft)]">
          <button type="button" onClick={onHowTo}
            className="flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-sm text-[var(--ink-dim)] hover:text-[var(--ink)] hover:bg-white/[0.07] light:hover:bg-black/[0.05] transition-colors text-left">
            <svg className="h-4 w-4 shrink-0 text-[var(--ink-dim)]" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM8.94 6.94a.75.75 0 11-1.061-1.061 3 3 0 112.871 5.026v.345a.75.75 0 01-1.5 0v-.5c0-.72.57-1.172 1.081-1.287A1.5 1.5 0 108.94 6.94zM10 15a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd"/>
            </svg>
            {t("how_to_use")}
          </button>
        </nav>
      </div>

      {/* ── Sign out ── */}
      <div className="px-2 pt-2 pb-4 border-t border-white/[0.08] light:border-[var(--rule)] shrink-0">
        <button type="button" onClick={onSignOut}
          className="flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-sm text-[var(--ink-dim)] hover:text-red-400 light:hover:text-red-600 hover:bg-red-500/[0.08] light:hover:bg-red-500/[0.06] transition-colors text-left">
          <svg className="h-4 w-4 shrink-0" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
            <path fillRule="evenodd" d="M3 4.25A2.25 2.25 0 015.25 2h5.5A2.25 2.25 0 0113 4.25v2a.75.75 0 01-1.5 0v-2a.75.75 0 00-.75-.75h-5.5a.75.75 0 00-.75.75v11.5c0 .414.336.75.75.75h5.5a.75.75 0 00.75-.75v-2a.75.75 0 011.5 0v2A2.25 2.25 0 0110.75 18h-5.5A2.25 2.25 0 013 15.75V4.25z" clipRule="evenodd"/>
            <path fillRule="evenodd" d="M19 10a.75.75 0 00-.75-.75H8.704l1.048-.943a.75.75 0 10-1.004-1.114l-2.5 2.25a.75.75 0 000 1.114l2.5 2.25a.75.75 0 101.004-1.114l-1.048-.943h9.546A.75.75 0 0019 10z" clipRule="evenodd"/>
          </svg>
          {t("sign_out")}
        </button>
      </div>
    </div>
  );
}

// ── SidebarTabRow ─────────────────────────────────────────────────────────────

function SidebarTabRow({
  tab,
  activeTabId,
  onLoad,
  onStar,
  onDelete,
}: {
  tab: SearchTab;
  activeTabId: string | null;
  onLoad: (tab: SearchTab) => void;
  onStar: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const t = useContext(LangContext);
  const isActive = activeTabId === tab.id;
  return (
    <div
      className={`group relative flex items-center gap-0.5 w-full rounded-lg transition-colors ${
        isActive
          ? "bg-white/[0.10] light:bg-black/[0.09]"
          : "hover:bg-white/[0.06] light:hover:bg-black/[0.05]"
      }`}
    >
      {/* Star button */}
      <button
        type="button"
        onClick={() => onStar(tab.id)}
        aria-label={tab.starred ? t("aria_unstar") : t("aria_star")}
        className={`shrink-0 ml-1.5 flex items-center justify-center w-5 h-5 rounded transition-colors ${
          tab.starred
            ? "text-amber-400 light:text-amber-600"
            : "text-slate-700 light:text-[var(--ink-dim)] opacity-0 group-hover:opacity-100 hover:text-amber-400 light:hover:text-amber-600"
        }`}
      >
        <svg className="h-3 w-3" viewBox="0 0 20 20" fill={tab.starred ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.6" aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 0 0 .95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 0 0-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 0 0-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 0 0-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 0 0 .951-.69l1.07-3.292z" />
        </svg>
      </button>

      {/* Tab label */}
      <button
        type="button"
        onClick={() => onLoad(tab)}
        className="flex-1 min-w-0 px-2 py-2 text-left"
      >
        <span className={`block text-xs truncate leading-snug ${
          isActive
            ? "text-[var(--ink)]"
            : "text-[var(--ink-dim)]"
        }`}>
          {tab.preview || t("new_search_tab")}
        </span>
      </button>

      {/* Delete button */}
      <button
        type="button"
        onClick={() => onDelete(tab.id)}
        aria-label={t("aria_delete_tab")}
        className="shrink-0 mr-1.5 flex items-center justify-center w-5 h-5 rounded opacity-0 group-hover:opacity-100 transition-opacity text-[var(--ink-dim)] hover:text-red-400 light:hover:text-red-600 hover:bg-red-500/[0.10]"
      >
        <svg className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
          <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22z" />
        </svg>
      </button>
    </div>
  );
}


// ── LibraryView ───────────────────────────────────────────────────────────────

interface LibraryItem { claim: string; paper: RatedPaper; }

/**
 * Format a paper citation according to the specified style.
 *
 * Author truncation rules (per official style guides):
 *  APA 7   – list up to 20 authors; if >20, list first 19, "…", last author.
 *  MLA 9   – list first author (Last, First), then "et al." if ≥3 authors.
 *  Chicago – list all authors up to 10; if >10, first 7 + "et al."
 *  GB/T 7714 – list up to 3 authors; if >3, first 3 + "et al."
 *  SIST 02 – list up to 3 authors; if >3, first 3 + "ほか" (et al. in Japanese).
 *  KCI     – list up to 5 authors; if >5, first 5 + " 외" (et al. in Korean).
 *  BibTeX  – list all authors joined with " and " (LaTeX handles truncation).
 */
function formatCitation(p: RatedPaper, style: string): string {
  const raw = p.authors ?? [];
  const doi = p.doi ? p.doi.replace(/^https?:\/\/doi\.org\//i, "") : "";
  const doiUrl = doi ? `https://doi.org/${doi}` : "";
  const title = p.title ?? "Untitled";
  const journal = p.journal ?? "";
  const year = p.year ?? "";
  const vol = (p as Paper & { volume?: string | null }).volume;
  const issue = (p as Paper & { issue?: string | null }).issue;
  const pages = (p as Paper & { pages?: string | null }).pages;

  // Helper: first surname from a "Last, First" or "First Last" string
  function surname(a: string) { return a.split(",")[0].trim(); }

  if (style === "APA") {
    // APA 7th: ≤20 → all; >20 → first 19 + "..." + last
    let authorStr: string;
    if (raw.length <= 20) {
      authorStr = raw.join(", ");
    } else {
      authorStr = raw.slice(0, 19).join(", ") + ", … " + raw[raw.length - 1];
    }
    const volIssue = vol ? `, ${vol}${issue ? `(${issue})` : ""}` : "";
    const pagesStr = pages ? `, ${pages}` : "";
    return `${authorStr} (${year}). ${title}. ${journal}${volIssue}${pagesStr}.${doiUrl ? ` ${doiUrl}` : ""}`;
  }

  if (style === "MLA") {
    // MLA 9th: 1–2 authors → list all; ≥3 → first author + ", et al."
    let authorStr: string;
    if (raw.length === 0) {
      authorStr = "";
    } else if (raw.length <= 2) {
      authorStr = raw.join(", and ");
    } else {
      authorStr = raw[0] + ", et al.";
    }
    const volIssue = vol ? `, vol. ${vol}${issue ? `, no. ${issue}` : ""}` : "";
    const pagesStr = pages ? `, pp. ${pages}` : "";
    return `${authorStr}. "${title}." ${journal}${volIssue}${pagesStr}, ${year}.${doiUrl ? ` ${doiUrl}` : ""}`;
  }

  if (style === "Chicago") {
    // Chicago 17th bibliography: ≤10 → all; >10 → first 7 + "et al."
    let authorStr: string;
    if (raw.length <= 10) {
      if (raw.length === 1) authorStr = raw[0];
      else authorStr = raw.slice(0, -1).join(", ") + ", and " + raw[raw.length - 1];
    } else {
      authorStr = raw.slice(0, 7).join(", ") + ", et al.";
    }
    const volIssue = vol ? ` ${vol}${issue ? `, no. ${issue}` : ""}` : "";
    const pagesStr = pages ? `: ${pages}` : "";
    return `${authorStr}. "${title}." ${journal}${volIssue} (${year})${pagesStr}.${doiUrl ? ` ${doiUrl}.` : ""}`;
  }

  if (style === "GB/T 7714") {
    // GB/T 7714-2015: ≤3 → all separated by ", "; >3 → first 3 + ", et al."
    const trunc = raw.length > 3 ? raw.slice(0, 3) : raw;
    const authorStr = trunc.join(", ") + (raw.length > 3 ? ", et al." : "");
    const volIssue = vol ? `${vol}${issue ? `(${issue})` : ""}` : issue ? `(${issue})` : "";
    const pagesStr = pages ? `: ${pages}` : "";
    return `${authorStr}. ${title}[J]. ${journal}, ${year}${volIssue ? `, ${volIssue}` : ""}${pagesStr}.${doi ? ` DOI: ${doi}.` : ""}`;
  }

  if (style === "SIST 02") {
    // SIST 02: ≤3 → all; >3 → first 3 + " ほか"
    const trunc = raw.length > 3 ? raw.slice(0, 3) : raw;
    const authorStr = trunc.join(", ") + (raw.length > 3 ? " ほか" : "");
    const volIssue = vol ? `, vol. ${vol}${issue ? `, no. ${issue}` : ""}` : "";
    const pagesStr = pages ? `, p. ${pages}` : "";
    return `${authorStr}. 「${title}」. 『${journal}』. ${year}${volIssue}${pagesStr}.${doiUrl ? ` ${doiUrl}` : ""}`;
  }

  if (style === "KCI") {
    // KCI: ≤5 → all; >5 → first 5 + " 외"
    const trunc = raw.length > 5 ? raw.slice(0, 5) : raw;
    const authorStr = trunc.join(", ") + (raw.length > 5 ? " 외" : "");
    const volIssue = vol ? `, ${vol}${issue ? `(${issue})` : ""}` : "";
    const pagesStr = pages ? `, ${pages}` : "";
    return `${authorStr} (${year}). ${title}. 《${journal}》${volIssue}${pagesStr}.${doiUrl ? ` ${doiUrl}` : ""}`;
  }

  if (style === "BibTeX") {
    // BibTeX: all authors joined with " and " — LaTeX/natbib handles display truncation
    const authorStr = raw.join(" and ");
    const key = surname(raw[0] ?? "anon").toLowerCase().replace(/\s+/g, "") + year;
    const parts = [
      `  author  = {${authorStr}}`,
      `  title   = {${title}}`,
      `  journal = {${journal}}`,
      `  year    = {${year}}`,
      vol   ? `  volume  = {${vol}}` : null,
      issue ? `  number  = {${issue}}` : null,
      pages ? `  pages   = {${pages}}` : null,
      doi   ? `  doi     = {${doi}}` : null,
    ].filter(Boolean).join(",\n");
    return `@article{${key},\n${parts}\n}`;
  }

  // fallback
  return `${raw.join(", ")} (${year}). ${title}.`;
}

const CITE_STYLES = ["APA", "MLA", "Chicago", "GB/T 7714", "SIST 02", "KCI", "BibTeX"];

function bibSortKey(item: LibraryItem): string {
  const authors = item.paper.authors ?? [];
  if (authors.length === 0) return item.paper.title?.toLowerCase() ?? "\uffff";
  const first = authors[0];
  if (first.includes(",")) return first.split(",")[0].trim().toLowerCase();
  const parts = first.trim().split(/\s+/);
  return (parts[parts.length - 1] ?? first).toLowerCase();
}

function LibraryView({ items, onToggleSave }: { items: LibraryItem[]; onToggleSave: (paper: RatedPaper) => void }) {
  const t = useContext(LangContext);
  const [mode, setMode] = useState<"list" | "bibliography">("list");
  const [style, setStyle] = useState("APA");
  const [copiedBib, setCopiedBib] = useState(false);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  // Bibliography view always sorted A→Z by first author's last name
  const sortedItems = useMemo(
    () => mode === "bibliography" ? [...items].sort((a, b) => bibSortKey(a).localeCompare(bibSortKey(b))) : items,
    [items, mode]
  );

  const bibText = sortedItems.map(it => formatCitation(it.paper, style)).join(style === "BibTeX" ? "\n\n" : "\n\n");

  function copyItem(paper: RatedPaper, idx: number) {
    navigator.clipboard?.writeText(formatCitation(paper, style));
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 1800);
  }

  return (
    <div className="flex-1 overflow-y-auto" style={{ background: "var(--bg)" }}>
      <div style={{ maxWidth: 860, margin: "0 auto", padding: "36px 32px 80px" }}>

        {/* header row */}
        <div className="flex items-start justify-between mb-5 gap-4 flex-wrap">
          <div>
            <h1
              className="font-normal tracking-[-0.8px]"
              style={{ fontFamily: "var(--serif)", fontSize: 36, color: "var(--ink)", margin: 0 }}
            >
              {t("library_heading")}
            </h1>
            <p
              className="italic mt-1.5"
              style={{ fontFamily: "var(--serif)", fontSize: 14, color: "var(--ink-dim)", margin: "6px 0 0" }}
            >
              {items.length === 1 ? t("library_papers_saved_one") : t("library_papers_saved_many", { n: items.length })}
            </p>
          </div>

          {/* mode toggle */}
          <div className="flex items-center gap-3 flex-wrap">
            <div
              className="flex items-center rounded-full p-0.5 gap-0.5"
              style={{ border: "1px solid var(--rule)", background: "var(--paper)" }}
            >
              {(["list", "bibliography"] as const).map(m => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMode(m)}
                  className="px-4 py-1.5 rounded-full text-[12px] font-medium transition-all"
                  style={{
                    fontFamily: "var(--sans)",
                    background: mode === m ? "var(--ink)" : "transparent",
                    color: mode === m ? "var(--paper)" : "var(--ink-dim)",
                    border: "none",
                    cursor: "pointer",
                  }}
                >
                  {m === "list" ? t("library_tab_saved") : t("library_tab_bib")}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* citation style selector — always visible so copy works in list mode */}
        <div className="flex items-center gap-2 flex-wrap mb-5">
          <span style={{ fontFamily: "var(--mono)", fontSize: 10, letterSpacing: "0.8px", textTransform: "uppercase", color: "var(--ink-dim)" }}>{t("library_style_label")}</span>
          <div className="flex flex-wrap gap-1">
            {CITE_STYLES.map(s => (
              <button
                key={s}
                type="button"
                onClick={() => setStyle(s)}
                className="px-3 py-1 rounded-full text-[11px] font-medium transition-all"
                style={{
                  fontFamily: "var(--mono)",
                  letterSpacing: "0.3px",
                  background: style === s ? "var(--ink)" : "var(--paper)",
                  color: style === s ? "var(--paper)" : "var(--ink-dim)",
                  border: `1px solid ${style === s ? "var(--ink)" : "var(--rule)"}`,
                  cursor: "pointer",
                }}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* list mode */}
        {mode === "list" && (
          items.length === 0 ? (
            <div
              className="py-16 text-center rounded-2xl"
              style={{ border: "1px dashed var(--rule)", background: "var(--paper)" }}
            >
              <p style={{ fontFamily: "var(--serif)", fontStyle: "italic", color: "var(--ink-dim)", fontSize: 16 }}>
                {t("library_empty_title")}
              </p>
              <p style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--ink-dim)", marginTop: 8, letterSpacing: "0.3px" }}>
                {t("library_empty_sub")}
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {items.map((it, idx) => (
                <div
                  key={`${it.paper.doi ?? it.paper.title}-${idx}`}
                  className="rounded-2xl overflow-hidden"
                  style={{ background: "var(--paper)", border: "1px solid var(--rule)" }}
                >
                  {/* claim context header */}
                  <div
                    className="px-4 py-2.5 border-b"
                    style={{ background: "var(--paper-deep)", borderColor: "var(--rule-soft)" }}
                  >
                    <span
                      className="uppercase tracking-[0.8px] mr-2.5"
                      style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--accent)" }}
                    >
                      {t("library_supports")}
                    </span>
                    <span
                      style={{ fontFamily: "var(--serif)", fontStyle: "italic", fontSize: 13, color: "var(--ink-dim)" }}
                    >
                      &ldquo;{it.claim.length > 110 ? it.claim.slice(0, 110) + "…" : it.claim}&rdquo;
                    </span>
                  </div>

                  {/* compact paper row */}
                  <div className="px-4 py-3 flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <p
                        className="leading-snug mb-1"
                        style={{ fontFamily: "var(--serif)", fontSize: 14, color: "var(--ink)", fontWeight: 500 }}
                      >
                        {it.paper.title ?? "Untitled"}
                      </p>
                      <p
                        className="text-[12px] leading-snug mb-2"
                        style={{ fontFamily: "var(--sans)", color: "var(--ink-dim)" }}
                      >
                        {(it.paper.authors ?? []).slice(0, 3).join(", ")}
                        {(it.paper.authors ?? []).length > 3 && " et al."}
                        {it.paper.year ? ` · ${it.paper.year}` : ""}
                        {it.paper.journal ? ` · ${it.paper.journal}` : ""}
                      </p>
                      {/* inline formatted citation preview */}
                      <p
                        className="text-[12px] leading-relaxed rounded-lg px-3 py-2"
                        style={{
                          fontFamily: style === "BibTeX" ? "var(--mono)" : "var(--serif)",
                          color: "var(--ink-dim)",
                          background: "var(--bg-deep)",
                          whiteSpace: "pre-wrap",
                          wordBreak: "break-word",
                        }}
                      >
                        {formatCitation(it.paper, style)}
                      </p>
                    </div>
                    {/* action buttons */}
                    <div className="flex flex-col gap-1.5 shrink-0 mt-0.5">
                      {/* copy citation */}
                      <button
                        type="button"
                        onClick={() => copyItem(it.paper, idx)}
                        title={t("copy_citation")}
                        className="rounded-lg w-7 h-7 flex items-center justify-center transition-colors"
                        style={{ color: copiedIdx === idx ? "var(--accent)" : "var(--ink-dim)", background: "transparent", border: "none", cursor: "pointer" }}
                        onMouseEnter={e => { if (copiedIdx !== idx) e.currentTarget.style.color = "var(--ink)"; }}
                        onMouseLeave={e => { if (copiedIdx !== idx) e.currentTarget.style.color = "var(--ink-dim)"; }}
                      >
                        {copiedIdx === idx ? (
                          <svg viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5" aria-hidden>
                            <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd"/>
                          </svg>
                        ) : (
                          <svg viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5" aria-hidden>
                            <path d="M7 3.5A1.5 1.5 0 018.5 2h3.879a1.5 1.5 0 011.06.44l3.122 3.12A1.5 1.5 0 0117 6.622V12.5a1.5 1.5 0 01-1.5 1.5h-1v-3.379a3 3 0 00-.879-2.121L10.5 5.379A3 3 0 008.379 4.5H7v-1z"/>
                            <path d="M4.5 6A1.5 1.5 0 003 7.5v9A1.5 1.5 0 004.5 18h7a1.5 1.5 0 001.5-1.5v-5.879a1.5 1.5 0 00-.44-1.06L9.44 6.439A1.5 1.5 0 008.378 6H4.5z"/>
                          </svg>
                        )}
                      </button>
                      {/* unsave button */}
                      <button
                        type="button"
                        onClick={() => onToggleSave(it.paper)}
                        title={t("library_remove")}
                        className="rounded-lg w-7 h-7 flex items-center justify-center transition-colors"
                        style={{ color: "var(--ink-dim)", background: "transparent", border: "none", cursor: "pointer" }}
                        onMouseEnter={e => (e.currentTarget.style.color = "var(--ink)")}
                        onMouseLeave={e => (e.currentTarget.style.color = "var(--ink-dim)")}
                      >
                        <svg viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5" aria-hidden>
                          <path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.52.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4zM8.58 7.72a.75.75 0 00-1.5.06l.3 7.5a.75.75 0 101.5-.06l-.3-7.5zm4.34.06a.75.75 0 10-1.5-.06l-.3 7.5a.75.75 0 101.5.06l.3-7.5z" clipRule="evenodd"/>
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )
        )}

        {/* bibliography mode */}
        {mode === "bibliography" && (
          <div
            className="rounded-2xl overflow-hidden"
            style={{ background: "var(--paper)", border: "1px solid var(--rule)" }}
          >
            {/* toolbar: copy-all only, close to the text */}
            <div
              className="flex items-center justify-end px-4 py-2.5 border-b"
              style={{ background: "var(--paper-deep)", borderColor: "var(--rule-soft)" }}
            >
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard?.writeText(bibText);
                  setCopiedBib(true);
                  setTimeout(() => setCopiedBib(false), 1800);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium transition-colors"
                style={{
                  fontFamily: "var(--sans)",
                  border: "1px solid var(--rule)",
                  background: "transparent",
                  color: "var(--ink-dim)",
                  cursor: "pointer",
                }}
                onMouseEnter={e => (e.currentTarget.style.color = "var(--ink)")}
                onMouseLeave={e => (e.currentTarget.style.color = "var(--ink-dim)")}
              >
                {copiedBib ? (
                  <svg viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5" aria-hidden>
                    <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd"/>
                  </svg>
                ) : (
                  <svg viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5" aria-hidden>
                    <path d="M7 3.5A1.5 1.5 0 018.5 2h3.879a1.5 1.5 0 011.06.44l3.122 3.12A1.5 1.5 0 0117 6.622V12.5a1.5 1.5 0 01-1.5 1.5h-1v-3.379a3 3 0 00-.879-2.121L10.5 5.379A3 3 0 008.379 4.5H7v-1z"/>
                    <path d="M4.5 6A1.5 1.5 0 003 7.5v9A1.5 1.5 0 004.5 18h7a1.5 1.5 0 001.5-1.5v-5.879a1.5 1.5 0 00-.44-1.06L9.44 6.439A1.5 1.5 0 008.378 6H4.5z"/>
                  </svg>
                )}
                <span>{copiedBib ? t("copied") : t("copy_all")}</span>
              </button>
            </div>
            <pre
              className="m-0 leading-relaxed whitespace-pre-wrap break-words"
              style={{
                padding: "24px 28px",
                fontFamily: style === "BibTeX" ? "var(--mono)" : "var(--serif)",
                fontSize: style === "BibTeX" ? 12 : 14,
                color: "var(--ink)",
              }}
            >
              {sortedItems.length === 0 ? t("library_no_citations") : bibText}
            </pre>
          </div>
        )}

      </div>
    </div>
  );
}

// ── Zotero toast ──────────────────────────────────────────────────────────────

type ZoteroToastData = { type: "success" | "error" | "info"; message: string };

function ZoteroToast({
  toast,
  onDismiss,
}: {
  toast: ZoteroToastData | null;
  onDismiss: () => void;
}) {
  return (
    <AnimatePresence>
      {toast && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 8 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-2.5 rounded-xl px-4 py-2.5 text-[13px] font-medium shadow-xl"
          style={{
            background:
              toast.type === "success"
                ? "var(--accent)"
                : toast.type === "error"
                ? "rgb(239,68,68)"
                : "var(--paper)",
            color: toast.type === "info" ? "var(--ink)" : "white",
            border: toast.type === "info" ? "1px solid var(--rule)" : "none",
            fontFamily: "var(--sans)",
            whiteSpace: "nowrap",
          }}
        >
          {toast.type === "success" && (
            <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
              <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
            </svg>
          )}
          {toast.type === "error" && (
            <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
            </svg>
          )}
          {toast.message}
          <button
            type="button"
            onClick={onDismiss}
            className="ml-0.5 opacity-70 hover:opacity-100 transition-opacity"
            aria-label="Dismiss"
          >
            <svg width="12" height="12" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
              <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
            </svg>
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
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
  const [customRange, setCustomRange] = useState<CustomRange>(null);
  const [langFilter, setLangFilter] = useState<LangFilter>("all");
  // Deferred values keep the year filter non-blocking — React renders stale UI first
  // then applies the new filter without janking the thread.
  const deferredYearFilter = useDeferredValue(yearFilter);
  const deferredCustomRange = useDeferredValue(customRange);

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

  // Modals
  const [showHowTo, setShowHowTo] = useState(false);

  // Usage counter — default to full allowance so counter is visible immediately
  const [usage, setUsage] = useState({ count: 0, remaining: 3, limit: 3 });
  const [isPro, setIsPro] = useState(false);
  const [hasUsedTrial, setHasUsedTrial] = useState(false);
const [proSuccess, setProSuccess] = useState(false);
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [upgrading, setUpgrading] = useState(false);
  // Split-screen interaction state
  const [hoveredClaimIdx, setHoveredClaimIdx] = useState<number | null>(null);
  const [expandedClaims, setExpandedClaims] = useState<Set<number>>(new Set());
  const claimCardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const rightPaneRef = useRef<HTMLDivElement>(null);

  const [showOmakaseGate, setShowOmakaseGate] = useState(false);
  const [showOmakasePicker, setShowOmakasePicker] = useState(false);
  const [omakaseLoading, setOmakaseLoading] = useState<{ style: OmakaseStyleId; label: string } | null>(null);
  const [omakaseResult, setOmakaseResult] = useState<OmakaseHistoryData | null>(null);
  const [omakaseError, setOmakaseError] = useState<string | null>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  // Ref attached to the Omakase result card for reliable scroll-into-view
  const omakaseResultRef = useRef<HTMLDivElement>(null);
  // Ref for the left pane's scrollable inner div
  const leftPaneScrollRef = useRef<HTMLDivElement>(null);
  // Cache lang-filter results so switching between languages is instant after first fetch
  const resultsCacheRef = useRef<Map<LangFilter, ClaimResult[]>>(new Map());

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

  // ── Language ────────────────────────────────────────────────────────────────
  const [lang, setLang] = useState<Lang>("en");

  // Load language: saved preference or browser default
  useEffect(() => {
    const saved = localStorage.getItem("rf_lang") as Lang | null;
    if (saved === "en" || saved === "zh" || saved === "ja" || saved === "ko") setLang(saved);
    else setLang(detectLang());
  }, []);

  // Persist language choice
  useEffect(() => { localStorage.setItem("rf_lang", lang); }, [lang]);

  const t = useMemo(() => getT(lang), [lang]);

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
      console.error("[checkout]", err);
      setError("Payments are temporarily unavailable. Please try again later.");
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

  // When the intro hold ends and content expands, snap back to the top.
  // Without this, CSS scroll-anchoring compensates for the title moving
  // upward (centered → pt-20) by scrolling the viewport downward.
  useEffect(() => {
    if (ready) window.scrollTo({ top: 0, behavior: "instant" });
  }, [ready]);

  useEffect(() => {
    if (session) setStage("app");
  }, [session]);

  useEffect(() => {
    if (stage !== "app") return;
    fetchUsage();
    // Check Stripe subscription status on every app load so Pro access survives
    // sign-out / sign-in cycles. The route reads the email from the server-side
    // session and re-sets the Pro cookie if an active subscription is found.
    apiFetch<{ pro: boolean; hasUsedTrial: boolean }>("/api/check-subscription").then(({ data }) => {
      if (data?.pro) setIsPro(true);
      if (data?.hasUsedTrial) setHasUsedTrial(true);
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

  const isSignedIn = !!session?.user;

  // ── Left sidebar ─────────────────────────────────────────────────────────────
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Auto-open when user signs in, close when they sign out
  useEffect(() => {
    setSidebarOpen(!!session);
  }, [!!session]); // eslint-disable-line react-hooks/exhaustive-deps

  // Detect mobile breakpoint: < 1024px → overlay drawer, ≥ 1024px → push sidebar
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 1023px)");
    setIsMobile(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  // ── Zotero ───────────────────────────────────────────────────────────────────
  const [zoteroConnected, setZoteroConnected] = useState<boolean | null>(null);
  const [zoteroToast, setZoteroToast] = useState<ZoteroToastData | null>(null);

  // Check Zotero connection status once Pro is confirmed
  useEffect(() => {
    if (isPro && session) {
      fetch("/api/zotero/status")
        .then((r) => r.json())
        .then((d) => setZoteroConnected(!!d.connected))
        .catch(() => setZoteroConnected(false));
    }
  }, [isPro, session]);

  // Handle ?zotero_connected=1 redirect from OAuth callback
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("zotero_connected") === "1") {
      setZoteroConnected(true);
      setZoteroToast({ type: "success", message: "Connected to Zotero!" });
      window.history.replaceState({}, "", window.location.pathname);
      setTimeout(() => setZoteroToast(null), 4000);
    }
  }, []);

  const handleSaveToZotero = async (paper: Paper): Promise<void> => {
    if (!zoteroConnected) {
      window.location.href = "/api/zotero/connect";
      return;
    }
    try {
      const res = await fetch("/api/zotero/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(paper),
      });
      const data = await res.json();
      if (data.notConnected) {
        setZoteroConnected(false);
        window.location.href = "/api/zotero/connect";
        return;
      }
      if (!res.ok) throw new Error(data.error ?? "Save failed");
      setZoteroToast({ type: "success", message: "Saved to Zotero!" });
    } catch {
      setZoteroToast({ type: "error", message: "Failed to save to Zotero" });
    }
    setTimeout(() => setZoteroToast(null), 4000);
  };

  // ── Tabs ─────────────────────────────────────────────────────────────────────
  const [tabs, setTabs] = useState<SearchTab[]>([]);
  const [activeTabId, setActiveTabId] = useState<string | null>(null);

  // Load tabs on mount (guest) or when session becomes available (signed-in)
  useEffect(() => {
    if (stage !== "app") return;
    if (session) {
      apiFetch<{ tabs: SearchTab[] }>("/api/tabs").then(({ data }) => {
        setTabs(data?.tabs ?? []);
      });
    } else {
      setTabs(lsGetTabs());
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage, !!session]);

  const startNewSearch = async () => {
    // If a blank "New search…" tab already exists, just switch to it
    const existingBlank = tabs.find(t => (!t.preview || t.preview === "New search…") && !t.paragraph);
    if (existingBlank) {
      setActiveTabId(existingBlank.id);
      setText("");
      setResults([]);
      setCurrentClaims([]);
      setOmakaseResult(null);
      setError("");
      return;
    }

    // Clear UI
    setText("");
    setResults([]);
    setCurrentClaims([]);
    setOmakaseResult(null);
    setError("");

    // Create a blank tab
    if (session) {
      const { data } = await apiFetch<{ id: string; createdAt: string; updatedAt: string }>("/api/tabs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ preview: "", paragraph: "", claims: [], results: [] }),
      });
      if (data?.id) {
        const newTab: SearchTab = {
          id: data.id,
          preview: "",
          paragraph: "",
          claims: [],
          results: [],
          omakase: null,
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
        };
        setTabs((prev) => [newTab, ...prev]);
        setActiveTabId(data.id);
      }
    } else {
      const id = lsAddTab({ preview: "", paragraph: "", claims: [], results: [], omakase: null });
      setTabs(lsGetTabs());
      setActiveTabId(id);
    }
  };

  const loadTab = (tab: SearchTab) => {
    setText(tab.paragraph);
    setCurrentClaims(tab.claims);
    setResults(tab.results);
    setOmakaseResult(tab.omakase ?? null);
    setError("");
    setActiveTabId(tab.id);
  };

  const deleteTab = async (tabId: string) => {
    if (session) {
      // Skip the API call for optimistic (temp) tabs that haven't been persisted yet
      if (!tabId.startsWith("temp-")) {
        await apiFetch(`/api/tabs/${tabId}`, { method: "DELETE" });
      }
    } else {
      lsDeleteTab(tabId);
    }
    setTabs((prev) => prev.filter((t) => t.id !== tabId));
    if (activeTabId === tabId) {
      setActiveTabId(null);
      setText("");
      setResults([]);
      setCurrentClaims([]);
      setOmakaseResult(null);
    }
  };

  const starTab = async (tabId: string) => {
    const tab = tabs.find((t) => t.id === tabId);
    if (!tab) return;
    const newStarred = !tab.starred;
    if (session) {
      // Don't try to star optimistic tabs that haven't been persisted yet
      if (!tabId.startsWith("temp-")) {
        apiFetch(`/api/tabs/${tabId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ starred: newStarred }),
        });
      }
    } else {
      lsStarTab(tabId, newStarred);
    }
    setTabs((prev) => prev.map((t) => (t.id === tabId ? { ...t, starred: newStarred } : t)));
  };

  // ── Saved papers ──────────────────────────────────────────────────────────────
  const [savedPapers, setSavedPapers] = useState<SavedPaper[]>([]);
  const [view, setView] = useState<"workspace" | "library">("workspace");

  // Derived: set of keys (doi or lower-cased title) for O(1) lookup in PaperCard
  const savedPaperKeys = useMemo(() => {
    const s = new Set<string>();
    for (const p of savedPapers) {
      if (p.doi) s.add(p.doi.replace(/^https?:\/\/doi\.org\//i, "").toLowerCase());
      if (p.title) s.add(p.title.toLowerCase().trim());
    }
    return s;
  }, [savedPapers]);

  // Library items for the current tab — all saved papers that appear in the active results
  const tabLibraryItems = useMemo(() => {
    const items: { claim: string; paper: RatedPaper }[] = [];
    const normalize = (doi: string | null | undefined) =>
      doi ? doi.replace(/^https?:\/\/doi\.org\//i, "").toLowerCase() : null;
    for (const r of results) {
      for (const p of r.papers) {
        const doi = normalize(p.doi);
        const titleKey = p.title?.toLowerCase().trim() ?? null;
        const isSaved = (doi ? savedPaperKeys.has(doi) : false) || (titleKey ? savedPaperKeys.has(titleKey) : false);
        if (isSaved) {
          items.push({ claim: r.claim, paper: p });
        }
      }
    }
    return items;
  }, [results, savedPaperKeys]);

  // Load saved papers once the app stage is active
  useEffect(() => {
    if (stage !== "app") return;
    if (session) {
      apiFetch<{ papers: SavedPaper[] }>("/api/saved-papers").then(({ data }) => {
        setSavedPapers(data?.papers ?? []);
      });
    } else {
      setSavedPapers(lsGetSavedPapers());
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage, !!session]);

  const toggleSavePaper = (paper: RatedPaper) => {
    const normalize = (doi: string | null | undefined) =>
      doi ? doi.replace(/^https?:\/\/doi\.org\//i, "").toLowerCase() : null;
    const paperDoi = normalize(paper.doi);
    const paperTitle = paper.title?.toLowerCase().trim() ?? null;

    const existing = savedPapers.find((p) => {
      const pDoi = normalize(p.doi);
      return (paperDoi && pDoi === paperDoi) || (paperTitle && p.title.toLowerCase().trim() === paperTitle);
    });

    if (existing) {
      // ── Unsave (optimistic) ──────────────────────────────────────────────────
      setSavedPapers((prev) => prev.filter((p) => p.id !== existing.id));
      if (session) {
        apiFetch(`/api/saved-papers/${existing.id}`, { method: "DELETE" }).then(({ error }) => {
          if (error) {
            // Revert on failure
            setSavedPapers((prev) => [existing, ...prev]);
          }
        });
      } else {
        lsRemoveSavedPaper(existing.id);
      }
    } else {
      // ── Save (optimistic) ────────────────────────────────────────────────────
      const payload = {
        doi: paper.doi ?? null,
        title: paper.title ?? "Untitled",
        authors: paper.authors ?? [],
        year: paper.year ?? null,
        journal: paper.journal ?? null,
      };
      const tempId = `temp_${Date.now()}`;
      const optimistic: SavedPaper = { ...payload, id: tempId, createdAt: new Date().toISOString() };
      // Update state immediately so the icon changes right away
      setSavedPapers((prev) => [optimistic, ...prev]);

      if (session) {
        apiFetch<{ id: string; createdAt: string }>("/api/saved-papers", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }).then(({ data, error }) => {
          if (data?.id) {
            // Replace temp entry with the server-assigned ID
            setSavedPapers((prev) =>
              prev.map((p) => p.id === tempId ? { ...p, id: data.id, createdAt: data.createdAt } : p)
            );
          } else {
            // Revert on API failure
            setSavedPapers((prev) => prev.filter((p) => p.id !== tempId));
            console.error("[saved-papers] save failed:", error);
          }
        });
      } else {
        // Guest: persist to localStorage and swap temp entry for the real ls id
        const realId = lsAddSavedPaper(payload);
        setSavedPapers((prev) =>
          prev.map((p) => p.id === tempId ? { ...p, id: realId } : p)
        );
      }
    }
  };

  // ── Auth-stage email sign-in ────────────────────────────────────────────────
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState("");
  const [showEmailForm, setShowEmailForm] = useState(false);

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError("");
    const result = await signIn("credentials", { email: authEmail, password: authPassword, redirect: false });
    setAuthLoading(false);
    if (result?.error) {
      setAuthError(AUTH_ERROR_KEYS[result.error] ?? AUTH_ERROR_KEYS.Default);
    }
    // On success the session update triggers setStage("app") via the existing useEffect
  };

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
    setLangFilter("all");
    setOmakaseResult(null);
    setCustomRange(null);
    resultsCacheRef.current.clear();

    try {
      setStatus(t("status_extracting"));

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
      setStatus(claims.length === 1 ? t("status_found_one") : t("status_found_many", { n: claims.length }));

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
              body: JSON.stringify({ claim: c.claim, papers: searchData.papers, lang }),
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
      // Seed the cache with the default "all" results so switching language and back is instant
      resultsCacheRef.current.set("all", claimResults);
      setView("workspace");
      setStatus("");
      await fetchUsage();

      // Build the tab preview from the first ~60 chars of the paragraph
      const tabPreview = text.split("\n")[0].slice(0, 60) + (text.length > 60 ? "…" : "");

      // Save/update tab.
      // Rule: if the active tab is a blank "New search…" placeholder, PATCH it with real content.
      // Any other case (no active tab, or active tab already has real content) → POST a new tab.
      // After saving, always reset activeTabId so the NEXT search creates its own new tab.
      const currentActiveTabId = activeTabId;
      const now = new Date().toISOString();

      if (session) {
        // Determine whether to patch the current tab or create a new one
        const currentTab = currentActiveTabId ? tabs.find((t) => t.id === currentActiveTabId) : null;
        const isBlankPlaceholder = currentTab && (!currentTab.preview || currentTab.preview === "New search…") && !currentTab.paragraph;

        if (isBlankPlaceholder && currentActiveTabId) {
          // PATCH: fill in the blank tab created by "New Search"
          const patchPayload = { preview: tabPreview, paragraph: text, claims, results: claimResults };
          apiFetch(`/api/tabs/${currentActiveTabId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(patchPayload),
          });
          setTabs((prev) => {
            const updated = prev.map((t) =>
              t.id === currentActiveTabId
                ? { ...t, ...patchPayload, updatedAt: now }
                : t
            );
            updated.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
            return updated;
          });
          setActiveTabId(null); // next search will create a new tab
        } else {
          // POST: optimistically add a new tab immediately (before API confirms)
          const tempId = `temp-${Date.now()}`;
          const optimisticTab: SearchTab = {
            id: tempId,
            preview: tabPreview,
            paragraph: text,
            claims,
            results: claimResults,
            starred: false,
            omakase: null,
            createdAt: now,
            updatedAt: now,
          };
          setTabs((prev) => [optimisticTab, ...prev]);
          setActiveTabId(null); // next search will create a new tab

          apiFetch<{ id: string; createdAt: string; updatedAt: string }>("/api/tabs", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ preview: tabPreview, paragraph: text, claims, results: claimResults }),
          }).then(({ data, error }) => {
            if (data?.id) {
              // Replace the temp tab with the real DB-backed tab
              setTabs((prev) =>
                prev.map((t) =>
                  t.id === tempId
                    ? { ...t, id: data.id, createdAt: data.createdAt, updatedAt: data.updatedAt }
                    : t
                )
              );
            } else {
              // API failed — remove the optimistic tab so the sidebar doesn't show stale data
              console.error("[tabs] POST failed:", error);
              setTabs((prev) => prev.filter((t) => t.id !== tempId));
            }
          });
        }
      } else {
        // Guest: write to localStorage synchronously — sidebar updates immediately
        if (currentActiveTabId) {
          const currentTab = tabs.find((t) => t.id === currentActiveTabId);
          const isBlankPlaceholder = currentTab && (!currentTab.preview || currentTab.preview === "New search…") && !currentTab.paragraph;
          if (isBlankPlaceholder) {
            lsUpdateTab(currentActiveTabId, { preview: tabPreview, paragraph: text, claims, results: claimResults });
            setTabs(lsGetTabs());
            setActiveTabId(null);
          } else {
            lsAddTab({ preview: tabPreview, paragraph: text, claims, results: claimResults, omakase: null });
            setTabs(lsGetTabs());
            setActiveTabId(null);
          }
        } else {
          lsAddTab({ preview: tabPreview, paragraph: text, claims, results: claimResults, omakase: null });
          setTabs(lsGetTabs());
          setActiveTabId(null);
        }
      }

    } catch {
      setError("An unexpected error occurred. Please try again.");
      setStatus("");
    } finally {
      setLoading(false);
    }
  };

  // Re-fetch papers when langFilter changes (Pro only) — checks cache first for instant switching
  useEffect(() => {
    if (!isPro) return;
    if (currentClaims.length === 0) return;

    // Cache hit → instant, no network
    const cached = resultsCacheRef.current.get(langFilter);
    if (cached) {
      setResults(cached);
      return;
    }

    let cancelled = false;
    (async () => {
      setStatus(t("status_filtering"));
      try {
        const langParam = langFilter !== "all" ? `&language=${langFilter}` : "";
        const claimResults: ClaimResult[] = await Promise.all(
          currentClaims.map(async (c): Promise<ClaimResult> => {
            const { data: searchData } = await apiFetch<{ papers: RatedPaper[] }>(
              `/api/search-papers?query=${encodeURIComponent(c.searchQuery)}${langParam}`
            );
            if (!searchData?.papers?.length) return { claim: c.claim, papers: [] };

            const { data: rateData } = await apiFetch<{ papers: RatedPaper[] }>(
              "/api/rate-relevance",
              {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ claim: c.claim, papers: searchData.papers, lang: langFilter }),
              }
            );
            if (!rateData) return { claim: c.claim, papers: [] };

            return {
              claim: c.claim,
              papers: (rateData.papers ?? []).sort((a, b) => b.relevanceScore - a.relevanceScore),
            };
          })
        );
        if (!cancelled) {
          // Store in cache so the next switch to this language is instant
          resultsCacheRef.current.set(langFilter, claimResults);
          setResults(claimResults);
          setView("workspace");
          setStatus("");
        }
      } catch {
        if (!cancelled) setStatus("");
      }
    })();

    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [langFilter]);

  // Expand all claims and reset hover when new results arrive
  useEffect(() => {
    if (results.length > 0) {
      setExpandedClaims(new Set(results.map((_, i) => i)));
      setHoveredClaimIdx(null);
      claimCardRefs.current = new Array(results.length).fill(null);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [results.length > 0 ? results[0]?.claim : null]);

  // When Omakase result arrives: switch to Workspace, then scroll the left pane to it
  useEffect(() => {
    if (!omakaseResult) return;
    setView("workspace");
    const id = setTimeout(() => {
      const omakaseEl = omakaseResultRef.current;
      const scrollEl = leftPaneScrollRef.current;
      if (omakaseEl && scrollEl) {
        const elTop = omakaseEl.getBoundingClientRect().top;
        const paneTop = scrollEl.getBoundingClientRect().top;
        scrollEl.scrollTo({ top: scrollEl.scrollTop + (elTop - paneTop), behavior: "smooth" });
      }
    }, 100);
    return () => clearTimeout(id);
  }, [omakaseResult]);

  const greeting = useMemo(
    () => session?.user?.name ? pickGreeting(toTitleCase(session.user.name).split(" ")[0], t) : null,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [session?.user?.name, t]
  );

  const hasActivity = loading || error !== "" || results.length > 0;
  const isCentered = !ready && !hasActivity;

  return (
    <LangContext.Provider value={t}>
    <>
      {/* ── how to use modal ── */}
      {showHowTo && <HowToUseModal onClose={() => setShowHowTo(false)} />}

      {/* ── help button — only on landing/auth stage ── */}
      <AnimatePresence>
        {ready && stage !== "app" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed top-4 left-4 z-30"
          >
            <button
              type="button"
              onClick={() => setShowHowTo(true)}
              aria-label="How to use"
              className="parchment-pill flex items-center justify-center w-8 h-8 rounded-xl border border-white/15 light:border-[rgba(80,50,20,0.18)] bg-white/10 light:bg-[rgba(248,246,234,0.92)] backdrop-blur-sm hover:bg-white/15 light:hover:bg-[rgba(240,238,218,0.95)] transition-colors text-[var(--ink-dim)] hover:text-[var(--ink)]"
            >
              <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM8.94 6.94a.75.75 0 11-1.061-1.061 3 3 0 112.871 5.026v.345a.75.75 0 01-1.5 0v-.5c0-.72.57-1.172 1.081-1.287A1.5 1.5 0 108.94 6.94zM10 15a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd"/>
              </svg>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

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
                  const omakaseData = {
                    rewritten_paragraph: json.rewritten_paragraph,
                    reference_list: json.reference_list ?? [],
                    style: style as string,
                    label: entry.label,
                  };
                  setOmakaseResult(omakaseData);
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
          onSuccess={() => {
            setIsPro(true);
            setProSuccess(true);
            setShowPlanModal(false);
          }}
          hasUsedTrial={hasUsedTrial}
        />
      )}

      {/* ── cancel subscription dialog ── */}
      {showCancelDialog && (
        <CancelDialog
          onClose={() => setShowCancelDialog(false)}
          onCancelled={() => {
            setIsPro(false);
            setShowCancelDialog(false);
          }}
        />
      )}

      {/* ── page shell: sidebar + main content pushed side-by-side ── */}
      <div className="flex min-h-screen">

        {/* ── Left sidebar — desktop push (lg+) ── */}
        <motion.aside
          initial={{ width: 0 }}
          animate={{ width: !isMobile && isSignedIn && stage === "app" && ready && sidebarOpen ? 280 : 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 32, mass: 0.9 }}
          className="shrink-0 overflow-hidden border-r sticky top-0 h-screen z-20"
          style={{ background: "var(--paper)", borderColor: "var(--rule)" }}
          aria-hidden={isMobile || !sidebarOpen}
        >
          <div className="w-[280px] h-full">
            <SidebarInner
              session={session} isPro={isPro} upgrading={upgrading}
              tabs={tabs} activeTabId={activeTabId}
              onClose={() => setSidebarOpen(false)}
              onNewSearch={startNewSearch}
              onLoadTab={loadTab}
              onStarTab={starTab}
              onDeleteTab={deleteTab}
              onHowTo={() => setShowHowTo(true)}
              onUpgrade={handleUpgradeClick}
              onCancelSubscription={() => setShowCancelDialog(true)}
              onSignOut={() => signOut()}
            />
          </div>
        </motion.aside>

        {/* ── Left sidebar — mobile overlay drawer (< lg) ── */}
        <AnimatePresence>
          {isMobile && sidebarOpen && isSignedIn && stage === "app" && ready && (
            <>
              <motion.div
                key="mobile-sidebar-backdrop"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.22 }}
                className="fixed inset-0 z-40 bg-black/60 light:bg-[rgba(44,24,16,0.45)]"
                onClick={() => setSidebarOpen(false)}
              />
              <motion.aside
                key="mobile-sidebar"
                initial={{ x: -280 }}
                animate={{ x: 0 }}
                exit={{ x: -280 }}
                transition={{ type: "spring", stiffness: 340, damping: 34, mass: 0.85 }}
                className="fixed left-0 top-0 h-full z-50 w-[280px] border-r"
                style={{ background: "var(--paper)", borderColor: "var(--rule)" }}
              >
                <SidebarInner
                  session={session} isPro={isPro} upgrading={upgrading}
                  tabs={tabs} activeTabId={activeTabId}
                  onClose={() => setSidebarOpen(false)}
                  onNewSearch={() => { startNewSearch(); setSidebarOpen(false); }}
                  onLoadTab={(tab) => { loadTab(tab); setSidebarOpen(false); }}
                  onStarTab={starTab}
                  onDeleteTab={deleteTab}
                  onHowTo={() => { setShowHowTo(true); setSidebarOpen(false); }}
                  onUpgrade={handleUpgradeClick}
                  onCancelSubscription={() => setShowCancelDialog(true)}
                  onSignOut={() => signOut()}
                />
              </motion.aside>
            </>
          )}
        </AnimatePresence>

        {/* ── Main content area (pushed right by sidebar) ── */}
        <div
          className={`relative flex-1 min-w-0 [overflow-anchor:none] ${
            results.length > 0 && stage === "app" && ready
              ? isMobile ? "flex flex-col" : "h-screen overflow-hidden flex flex-col"
              : isCentered
                ? "flex items-center justify-center py-12 px-4 sm:px-6"
                : "flex flex-col"
          }`}
          style={{ background: "var(--bg)" }}
        >

        {/* ── Top bar — app stage only ── */}
        {stage === "app" && ready && (
          <header
            className="sticky top-0 z-20 border-b shrink-0"
            style={{ background: "var(--bg)", borderColor: "var(--rule)" }}
          >
            {/* ── primary row ── */}
            <div className="h-14 flex items-center gap-3 px-5 relative">
              {/* hamburger — when sidebar closed */}
              {isSignedIn && !sidebarOpen && (
                <button
                  type="button"
                  onClick={() => setSidebarOpen(true)}
                  aria-label="Open sidebar"
                  className="flex items-center justify-center w-7 h-7 rounded-lg transition-colors shrink-0"
                  style={{ color: "var(--ink-dim)" }}
                  onMouseEnter={e => (e.currentTarget.style.color = "var(--ink)")}
                  onMouseLeave={e => (e.currentTarget.style.color = "var(--ink-dim)")}
                >
                  <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
                    <path fillRule="evenodd" d="M2 4.75A.75.75 0 012.75 4h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 4.75zm0 5.25a.75.75 0 01.75-.75h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 10zm0 5.25a.75.75 0 01.75-.75h14.5a.75.75 0 010 1.5H2.75a.75.75 0 01-.75-.75z" clipRule="evenodd" />
                  </svg>
                </button>
              )}

              {/* logo mark + name */}
              <div className="flex items-center gap-2.5 shrink-0">
                <div
                  className="w-7 h-7 rounded-[8px] flex items-center justify-center italic font-semibold text-[14px] shrink-0"
                  style={{ background: "var(--ink)", color: "var(--bg)", fontFamily: "var(--serif)" }}
                >
                  R
                </div>
                <span
                  className="text-[15px] font-medium hidden sm:inline"
                  style={{ color: "var(--ink)", fontFamily: "var(--serif)" }}
                >
                  Reference Finder
                </span>
              </div>

              <div className="flex-1" />

              {/* Workspace / Library nav — desktop: absolute center; hidden on mobile (shown in second row) */}
              {results.length > 0 && !isMobile && (
                <div
                  className="absolute left-1/2 -translate-x-1/2 flex items-center rounded-full p-0.5 gap-0.5"
                  style={{ border: "1px solid var(--rule)", background: "var(--paper)" }}
                >
                  {(["workspace", "library"] as const).map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setView(v)}
                      className="relative flex items-center gap-1.5 px-4 py-1.5 rounded-full text-[12px] font-medium transition-all capitalize"
                      style={{
                        fontFamily: "var(--sans)",
                        background: view === v ? "var(--ink)" : "transparent",
                        color: view === v ? "var(--paper)" : "var(--ink-dim)",
                        border: "none",
                        cursor: "pointer",
                      }}
                    >
                      {v === "workspace" ? t("view_workspace") : t("view_library")}
                      {v === "library" && tabLibraryItems.length > 0 && (
                        <span
                          className="inline-flex items-center justify-center rounded-full text-[10px] font-semibold tabular-nums"
                          style={{
                            minWidth: 16,
                            height: 16,
                            padding: "0 4px",
                            background: view === "library" ? "var(--paper)" : "var(--ink)",
                            color: view === "library" ? "var(--ink)" : "var(--paper)",
                            fontFamily: "var(--mono)",
                          }}
                        >
                          {tabLibraryItems.length}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              )}

              {/* right: lang + theme + sign-in */}
              <div className="flex items-center gap-2 shrink-0">

                {/* usage counter pill */}
                {!isPro && (
                  <span
                    className={`hidden sm:inline text-[11px] font-medium tabular-nums px-2 py-1 rounded-full ${
                      usage.remaining === 0
                        ? "bg-red-500/15 text-red-400 light:text-red-600"
                        : usage.remaining <= 1
                        ? "bg-amber-500/15 text-amber-400 light:text-amber-700"
                        : ""
                    }`}
                    style={
                      usage.remaining > 1
                        ? { background: "var(--paper-deep)", color: "var(--ink-dim)", fontFamily: "var(--mono)" }
                        : { fontFamily: "var(--mono)" }
                    }
                  >
                    {usage.remaining}/{usage.limit}
                  </span>
                )}

                <LanguagePicker lang={lang} onChange={setLang} />
                <ThemeToggle theme={theme} onToggle={toggleTheme} />

                {!session && (
                  <button
                    onClick={() => setStage("auth")}
                    className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12px] font-medium transition-colors"
                    style={{ border: "1px solid var(--rule)", color: "var(--ink-dim)", background: "transparent", fontFamily: "var(--sans)" }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = "var(--ink)"; (e.currentTarget as HTMLElement).style.borderColor = "var(--ink-dim)"; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = "var(--ink-dim)"; (e.currentTarget as HTMLElement).style.borderColor = "var(--rule)"; }}
                  >
                    {t("sign_in")}
                  </button>
                )}
              </div>
            </div>

            {/* ── mobile second row: workspace / library toggle ── */}
            {results.length > 0 && isMobile && (
              <div className="flex justify-center pb-2 px-4">
                <div
                  className="flex items-center rounded-full p-0.5 gap-0.5"
                  style={{ border: "1px solid var(--rule)", background: "var(--paper)" }}
                >
                  {(["workspace", "library"] as const).map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setView(v)}
                      className="relative flex items-center gap-1.5 px-4 py-1.5 rounded-full text-[12px] font-medium transition-all capitalize"
                      style={{
                        fontFamily: "var(--sans)",
                        background: view === v ? "var(--ink)" : "transparent",
                        color: view === v ? "var(--paper)" : "var(--ink-dim)",
                        border: "none",
                        cursor: "pointer",
                      }}
                    >
                      {v === "workspace" ? t("view_workspace") : t("view_library")}
                      {v === "library" && tabLibraryItems.length > 0 && (
                        <span
                          className="inline-flex items-center justify-center rounded-full text-[10px] font-semibold tabular-nums"
                          style={{
                            minWidth: 16,
                            height: 16,
                            padding: "0 4px",
                            background: view === "library" ? "var(--paper)" : "var(--ink)",
                            color: view === "library" ? "var(--ink)" : "var(--paper)",
                            fontFamily: "var(--mono)",
                          }}
                        >
                          {tabLibraryItems.length}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </header>
        )}

        <main className={results.length > 0 && stage === "app" && ready ? "flex-1 overflow-hidden flex min-w-0" : `relative z-10 mx-auto w-full max-w-2xl lg:max-w-[min(calc(100vw-12rem),100%)] ${stage === "app" && ready ? "px-4 sm:px-6 pt-10 pb-12" : "px-4 sm:px-6"}`}>
          {!(results.length > 0 && stage === "app" && ready) && <div
            className={`relative ${hasActivity ? "mb-8 text-left" : ready && stage === "app" ? "mb-8 text-center" : "mb-0 text-center"}`}
          >
            <TextAnimate
              as="h1"
              by="word"
              animation="blurInUp"
              startOnView={false}
              once
              className="font-[family-name:var(--serif)] text-4xl font-normal sm:text-5xl leading-tight tracking-[-1.5px]"
              style={{ color: "var(--ink)" }}
            >
              Reference Finder
            </TextAnimate>

            <AnimatePresence>
              {/* Landing tagline — visible only during the initial hold, fades out when ready */}
              {!ready && (
                <motion.p
                  key="tagline"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
                  className="mt-3 text-lg font-[family-name:var(--serif)] italic sm:text-xl"
                  style={{ color: "var(--ink-dim)" }}
                >
                  {t("tagline")}
                </motion.p>
              )}

              {/* App subtitle — fades in after the tagline exits */}
              {ready && stage === "app" && (
                <motion.p
                  key="app-sub"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.15, ease: "easeOut" }}
                  className="mt-4 text-[14px] font-[family-name:var(--serif)] italic"
                  style={{ color: "var(--ink-dim)" }}
                >
                  {greeting ?? t("subtitle_app")}
                </motion.p>
              )}
              {ready && stage === "auth" && (
                <motion.p
                  key="auth-sub"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.15, ease: "easeOut" }}
                  className="mt-4 text-[14px] font-[family-name:var(--serif)] italic"
                  style={{ color: "var(--ink-dim)" }}
                >
                  {t("subtitle_auth")}
                </motion.p>
              )}
            </AnimatePresence>
          </div>}

          <AnimatePresence mode="wait">

            {/* ── auth stage ── */}
            {ready && stage === "auth" && (
              <motion.div
                key="auth"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4 }}
                className="fixed inset-0 z-50 grid grid-cols-1 lg:grid-cols-2"
                style={{ background: "var(--bg)" }}
              >
                {/* ── LEFT: editorial brand panel ── */}
                <section
                  className="hidden lg:flex flex-col justify-between p-14 border-r overflow-hidden relative"
                  style={{ background: "var(--paper)", borderColor: "var(--rule)" }}
                >
                  {/* top-left: logo mark */}
                  <div className="flex items-center gap-3">
                    <div
                      className="w-8 h-8 rounded-[10px] flex items-center justify-center font-[family-name:var(--serif)] italic font-semibold text-lg shrink-0"
                      style={{ background: "var(--ink)", color: "var(--bg)" }}
                    >
                      R
                    </div>
                    <span
                      className="font-[family-name:var(--serif)] text-[17px] font-medium"
                      style={{ color: "var(--ink)" }}
                    >
                      Reference Finder
                    </span>
                    <div className="ml-auto flex items-center gap-2">
                      <LanguagePicker lang={lang} onChange={setLang} />
                      <ThemeToggle theme={theme} onToggle={toggleTheme} />
                    </div>
                  </div>

                  {/* center: editorial headline */}
                  <div>
                    <p
                      className="font-[family-name:var(--font-dm-sans)] text-[11px] font-medium uppercase tracking-[1.2px] mb-5"
                      style={{ color: "var(--accent)" }}
                    >
                      — {t("signin_editorial_label")}
                    </p>
                    <h1
                      className="font-[family-name:var(--serif)] font-normal text-[52px] leading-[1.06] tracking-[-1.5px] mb-5"
                      style={{ color: "var(--ink)" }}
                    >
                      {t("signin_headline_line1")}<br />
                      {t("signin_headline_line2")}<br />
                      <em style={{ color: "var(--accent)" }}>{t("signin_headline_em")}</em>.
                    </h1>
                    <p
                      className="font-[family-name:var(--serif)] italic text-[17px] leading-[1.55] max-w-[420px]"
                      style={{ color: "var(--ink-dim)" }}
                    >
                      {t("signin_description")}
                    </p>
                  </div>

                  {/* bottom: stats */}
                  <div
                    className="flex gap-8 pt-5 border-t font-[family-name:var(--font-dm-sans)] text-[11px] tracking-[0.4px]"
                    style={{ borderColor: "var(--rule)", color: "var(--ink-dim)" }}
                  >
                    {[
                      { num: "240M+", label: t("stat_papers") },
                      { num: "EN · 中 · 日 · 한", label: t("stat_languages") },
                      { num: "7", label: t("stat_formats") },
                    ].map(({ num, label }) => (
                      <div key={label}>
                        <div
                          className="font-[family-name:var(--serif)] text-[22px] font-medium mb-0.5"
                          style={{ color: "var(--ink)" }}
                        >
                          {num}
                        </div>
                        <div>{label}</div>
                      </div>
                    ))}
                  </div>
                </section>

                {/* ── RIGHT: auth form ── */}
                <section
                  className="flex flex-col justify-center px-8 py-12 sm:px-16 overflow-y-auto"
                  style={{ background: "var(--bg)" }}
                >
                  {/* mobile header */}
                  <div className="lg:hidden flex items-center justify-between mb-10">
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-7 h-7 rounded-[8px] flex items-center justify-center font-[family-name:var(--serif)] italic font-semibold text-base"
                        style={{ background: "var(--ink)", color: "var(--bg)" }}
                      >
                        R
                      </div>
                      <span className="font-[family-name:var(--serif)] text-[15px] font-medium" style={{ color: "var(--ink)" }}>
                        Reference Finder
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <LanguagePicker lang={lang} onChange={setLang} />
                      <ThemeToggle theme={theme} onToggle={toggleTheme} />
                    </div>
                  </div>

                  <div className="w-full max-w-[420px] mx-auto">
                    {/* heading */}
                    <p
                      className="font-[family-name:var(--font-dm-sans)] text-[10px] uppercase tracking-[0.8px] mb-3"
                      style={{ color: "var(--ink-dim)" }}
                    >
                      {t("sign_in_or_guest")}
                    </p>
                    <h2
                      className="font-[family-name:var(--serif)] font-normal text-[30px] tracking-[-0.5px] mb-1"
                      style={{ color: "var(--ink)" }}
                    >
                      {t("welcome_back")}
                    </h2>
                    <p
                      className="font-[family-name:var(--serif)] italic text-[14px] mb-8"
                      style={{ color: "var(--ink-dim)" }}
                    >
                      {t("signin_subtitle")}
                    </p>

                    {/* auth error */}
                    {authError && (
                      <div
                        className="mb-4 rounded-xl px-4 py-3 text-[13px] leading-relaxed"
                        style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)", color: "#f87171" }}
                      >
                        {t(authError as TKey)}
                      </div>
                    )}

                    {/* Google */}
                    <button
                      type="button"
                      onClick={() => signIn("google")}
                      disabled={sessionStatus === "loading"}
                      className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl mb-4 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{
                        background: "var(--paper)",
                        border: "1px solid var(--rule)",
                        color: "var(--ink)",
                        fontFamily: "var(--sans)",
                        fontSize: 14,
                        fontWeight: 500,
                      }}
                      onMouseEnter={e => (e.currentTarget.style.borderColor = "var(--ink-dim)")}
                      onMouseLeave={e => (e.currentTarget.style.borderColor = "var(--rule)")}
                    >
                      <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" aria-hidden>
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                      </svg>
                      <span className="flex-1 text-left">{t("sign_in_google")}</span>
                      <svg className="h-3.5 w-3.5 opacity-40" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                        <path d="M3 8h10M9 4l4 4-4 4"/>
                      </svg>
                    </button>

                    {/* or divider */}
                    <div className="flex items-center gap-3 mb-4">
                      <div className="h-px flex-1" style={{ background: "var(--rule)" }} />
                      <span
                        className="font-[family-name:var(--font-dm-sans)] text-[10px] uppercase tracking-[1px]"
                        style={{ color: "var(--ink-dim)" }}
                      >
                        {t("or")}
                      </span>
                      <div className="h-px flex-1" style={{ background: "var(--rule)" }} />
                    </div>

                    {/* Email / password form — always visible */}
                    <form onSubmit={handleEmailSignIn} className="flex flex-col gap-3 mb-4">
                      <div>
                        <label
                          htmlFor="auth-email"
                          className="block mb-1.5 font-[family-name:var(--font-dm-sans)] text-[10px] uppercase tracking-[0.8px]"
                          style={{ color: "var(--ink-dim)" }}
                        >
                          {t("email_label")}
                        </label>
                        <input
                          id="auth-email" type="email" autoComplete="email" required
                          value={authEmail}
                          onChange={(e) => { setAuthEmail(e.target.value); setAuthError(""); }}
                          className="w-full rounded-xl px-4 py-3 text-[14px] outline-none transition-colors"
                          style={{
                            background: "var(--paper)",
                            border: "1px solid var(--rule)",
                            color: "var(--ink)",
                            fontFamily: "var(--sans)",
                          }}
                          placeholder="ada@university.edu"
                          onFocus={e => (e.currentTarget.style.borderColor = "var(--ink-dim)")}
                          onBlur={e => (e.currentTarget.style.borderColor = "var(--rule)")}
                        />
                      </div>
                      <div>
                        <label
                          htmlFor="auth-password"
                          className="block mb-1.5 font-[family-name:var(--font-dm-sans)] text-[10px] uppercase tracking-[0.8px]"
                          style={{ color: "var(--ink-dim)" }}
                        >
                          {t("password_label")}
                        </label>
                        <input
                          id="auth-password" type="password" autoComplete="current-password" required
                          value={authPassword}
                          onChange={(e) => { setAuthPassword(e.target.value); setAuthError(""); }}
                          className="w-full rounded-xl px-4 py-3 text-[14px] outline-none transition-colors"
                          style={{
                            background: "var(--paper)",
                            border: "1px solid var(--rule)",
                            color: "var(--ink)",
                            fontFamily: "var(--sans)",
                          }}
                          placeholder="••••••••"
                          onFocus={e => (e.currentTarget.style.borderColor = "var(--ink-dim)")}
                          onBlur={e => (e.currentTarget.style.borderColor = "var(--rule)")}
                        />
                      </div>
                      <button
                        type="submit" disabled={authLoading}
                        className="w-full rounded-xl py-3 text-[14px] font-medium flex items-center justify-center gap-2 transition-opacity disabled:opacity-60 disabled:cursor-not-allowed"
                        style={{ background: "var(--ink)", color: "var(--bg)", fontFamily: "var(--sans)" }}
                      >
                        {authLoading ? t("signing_in") : t("sign_in_email_btn")}
                        {!authLoading && (
                          <svg className="h-3.5 w-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                            <path d="M3 8h10M9 4l4 4-4 4"/>
                          </svg>
                        )}
                      </button>
                      <div className="flex items-center justify-between">
                        <a
                          href="/register"
                          className="text-[12px] transition-opacity hover:opacity-70"
                          style={{ color: "var(--ink-dim)", fontFamily: "var(--sans)" }}
                        >
                          {t("create_account")}
                        </a>
                        <a
                          href="/forgot-password"
                          className="text-[12px] transition-opacity hover:opacity-70"
                          style={{ color: "var(--ink-dim)", fontFamily: "var(--sans)" }}
                        >
                          {t("forgot_password")}
                        </a>
                      </div>
                    </form>

                    {/* Continue as Guest */}
                    <div className="pt-5 mb-5" style={{ borderTop: "1px solid var(--rule)" }}>
                      <button
                        type="button"
                        onClick={() => setStage("app")}
                        className="w-full rounded-xl px-4 py-3.5 text-[14px] flex items-center justify-between transition-colors"
                        style={{
                          background: "transparent",
                          border: "1px solid var(--rule)",
                          color: "var(--ink)",
                          fontFamily: "var(--serif)",
                          fontStyle: "italic",
                        }}
                        onMouseEnter={e => (e.currentTarget.style.borderColor = "var(--ink-dim)")}
                        onMouseLeave={e => (e.currentTarget.style.borderColor = "var(--rule)")}
                      >
                        <span>{t("continue_guest")}</span>
                        <span
                          className="not-italic text-[9px] uppercase tracking-[1.5px] px-2 py-0.5 rounded"
                          style={{ background: "var(--paper-deep)", color: "var(--ink-dim)", border: "1px solid var(--rule-soft)", fontFamily: "var(--mono)", fontStyle: "normal" }}
                        >
                          3 {t("searches_day")}
                        </span>
                      </button>
                    </div>

                    {/* Terms */}
                    <p className="text-center text-[11px] leading-relaxed" style={{ color: "var(--ink-dim)", fontFamily: "var(--sans)" }}>
                      {t("signin_terms")}{" "}
                      <a href="/terms" className="underline underline-offset-2 transition-opacity hover:opacity-70" style={{ color: "var(--ink-dim)" }}>
                        {t("terms")}
                      </a>
                      {" "}{t("and")}{" "}
                      <a href="/privacy" className="underline underline-offset-2 transition-opacity hover:opacity-70" style={{ color: "var(--ink-dim)" }}>
                        {t("privacy_policy")}
                      </a>
                      .
                    </p>
                  </div>
                </section>
              </motion.div>
            )}

            {/* ── app stage ── */}
            {ready && stage === "app" && results.length === 0 && (
              <motion.div
                key="app"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.15, ease: [0.25, 0.1, 0.25, 1] }}
              >
                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                  <div className="relative">
                    <textarea
                      value={text}
                      onChange={(e) => { setText(e.target.value.slice(0, charLimit)); }}
                      placeholder={t("placeholder")}
                      aria-label="Paragraph input"
                      className={`parchment-textarea w-full h-44 sm:h-48 rounded-xl border px-4 py-3 pb-7 font-[family-name:var(--serif)] text-[15px] leading-[1.65] resize-none focus:outline-none focus:ring-1 transition-colors disabled:opacity-50 ${
                        !isPro && text.length >= FREE_CHAR_LIMIT
                          ? "focus:ring-red-500/40"
                          : "focus:ring-[var(--accent)]"
                      }`}
                      style={{
                        background: "var(--paper)",
                        borderColor: !isPro && text.length >= FREE_CHAR_LIMIT ? "rgba(239,68,68,0.4)" : "var(--rule)",
                        color: "var(--ink)",
                      }}
                      disabled={loading}
                    />
                    <span
                      className={`absolute bottom-2 right-3 text-[11px] tabular-nums font-[family-name:var(--font-dm-sans)] tracking-[0.3px] ${
                        !isPro && text.length >= FREE_CHAR_LIMIT
                          ? "text-red-400"
                          : ""
                      }`}
                      style={
                        isPro || text.length < FREE_CHAR_LIMIT
                          ? { color: charLimit - text.length <= (isPro ? 500 : 100) ? "var(--accent)" : "var(--ink-dim)" }
                          : undefined
                      }
                    >
                      {text.length.toLocaleString()}/{charLimit.toLocaleString()}
                    </span>
                  </div>

                  {/* Free-user limit warning */}
                  {!isPro && text.length >= FREE_CHAR_LIMIT && (
                    <p className="text-xs text-red-400 light:text-red-500">
                      {t("free_limit_msg")}{" "}
                      {session ? (
                        <>
                          <button
                            type="button"
                            onClick={() => setShowPlanModal(true)}
                            className="underline underline-offset-2 hover:text-amber-400 transition-colors"
                          >
                            {t("upgrade_to_pro")}
                          </button>{" "}
                          {t("for_more_chars")}
                        </>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={() => signIn()}
                            className="underline underline-offset-2 hover:text-amber-400 transition-colors"
                          >
                            {t("sign_in")}
                          </button>{" "}
                          {t("to_unlock_pro")}
                        </>
                      )}
                    </p>
                  )}

                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setText(pickExample(text))}
                        disabled={loading}
                        className="link-example text-sm text-[var(--ink-dim)] light:text-[var(--accent)] hover:text-[var(--ink)] light:hover:text-[var(--accent)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                      >
                        {t("try_example")}
                      </button>
                    </div>
                    <div className="flex items-center gap-3">
                      {!isPro && (
                        <span className={`text-xs font-medium tabular-nums px-2 py-1 rounded-md ${
                          usage.remaining === 0
                            ? "bg-red-500/15 text-red-400 light:text-red-600"
                            : usage.remaining <= 1
                            ? "bg-amber-500/15 text-amber-400 light:text-amber-700"
                            : "bg-white/8 light:bg-[rgba(44,24,16,0.05)] text-[var(--ink-dim)]"
                        }`}>
                          {t("searches_left", { n: usage.remaining })}
                        </span>
                      )}
                      <button
                        type="submit"
                        disabled={!text.trim() || loading || (!isPro && usage.remaining === 0)}
                        className="btn-submit flex items-center justify-center px-5 py-2 rounded-lg bg-white light:bg-[#2C1810] text-gray-950 light:text-[rgba(248,246,234,0.95)] text-sm font-semibold hover:bg-slate-100 light:hover:bg-[#3D2214] disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        {loading ? t("analyzing") : t("submit")}
                      </button>
                    </div>
                  </div>
                </form>

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
                    <p className="text-sm text-[var(--ink-dim)]">
                      {t("daily_limit_reached")}{" "}
                      {session ? (
                        <>
                          <button
                            type="button"
                            onClick={() => setShowPlanModal(true)}
                            className="font-semibold text-amber-400 light:text-amber-700 underline underline-offset-2 hover:text-amber-300 light:hover:text-amber-800 transition-colors"
                          >
                            {t("upgrade_to_pro")}
                          </button>{" "}
                          {t("to_unlock_unlimited")}
                        </>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={() => signIn()}
                            className="font-semibold text-amber-400 light:text-amber-700 underline underline-offset-2 hover:text-amber-300 light:hover:text-amber-800 transition-colors"
                          >
                            {t("sign_in")}
                          </button>{" "}
                          {t("to_unlock_unlimited")}
                        </>
                      )}
                    </p>
                  </div>
                )}

                {loading && (
                  <div className="mt-8 flex items-center gap-3 text-[13px] italic" style={{ color: "var(--ink-dim)", fontFamily: "var(--serif)" }}>
                    <svg className="animate-spin h-4 w-4 shrink-0" style={{ color: "var(--accent)" }} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden>
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                    <span>{status}</span>
                  </div>
                )}

                {error && <ErrorBanner message={error} />}
              </motion.div>
            )}

          </AnimatePresence>

          {/* ── library view ── */}
          {ready && stage === "app" && results.length > 0 && view === "library" && (
            <LibraryView items={tabLibraryItems} onToggleSave={toggleSavePaper} />
          )}

          {/* ── split-screen workspace: shown when results exist ── */}
          {ready && stage === "app" && results.length > 0 && view === "workspace" && (
            <div className={`flex ${isMobile ? "flex-col" : "flex-row"} flex-1 ${isMobile ? "" : "overflow-hidden"} min-w-0`}>

              {/* ── LEFT PANE: paragraph input ── */}
              <div
                ref={leftPaneScrollRef}
                className={`flex flex-col ${isMobile ? "" : "overflow-y-auto"}`}
                style={{
                  width: isMobile ? "100%" : "50%",
                  borderRight: isMobile ? "none" : "1px solid var(--rule)",
                  borderBottom: isMobile ? "1px solid var(--rule)" : "none",
                  background: "var(--bg)",
                }}
              >
                <div className="flex flex-col flex-1 p-5 gap-3">
                  <form onSubmit={handleSubmit} className="flex flex-col flex-1 gap-3">
                    {/* textarea — grows to fill available pane height */}
                    <div className="relative flex flex-col flex-1">
                      <textarea
                        value={text}
                        onChange={(e) => { setText(e.target.value.slice(0, charLimit)); }}
                        placeholder={t("placeholder")}
                        aria-label="Paragraph input"
                        className={`parchment-textarea w-full flex-1 rounded-xl border px-4 py-3 pb-6 text-[14px] leading-[1.65] resize-none focus:outline-none focus:ring-1 transition-colors disabled:opacity-50 ${
                          !isPro && text.length >= FREE_CHAR_LIMIT
                            ? "focus:ring-red-500/40"
                            : "focus:ring-[var(--accent)]"
                        }`}
                        style={{
                          minHeight: 260,
                          background: "var(--paper)",
                          borderColor: !isPro && text.length >= FREE_CHAR_LIMIT ? "rgba(239,68,68,0.4)" : "var(--rule)",
                          color: "var(--ink)",
                          fontFamily: "var(--serif)",
                        }}
                        disabled={loading}
                      />
                      <span
                        className="absolute bottom-2 right-3 text-[10px] tabular-nums tracking-[0.3px]"
                        style={{
                          fontFamily: "var(--mono)",
                          color: charLimit - text.length <= (isPro ? 500 : 100) ? "var(--accent)" : "var(--ink-dim)",
                        }}
                      >
                        {text.length.toLocaleString()}/{charLimit.toLocaleString()}
                      </span>
                    </div>

                    {/* action buttons */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => setText(pickExample(text))}
                          disabled={loading}
                          className="text-[12px] transition-colors disabled:opacity-40"
                          style={{ color: "var(--ink-dim)", fontFamily: "var(--sans)" }}
                          onMouseEnter={e => (e.currentTarget.style.color = "var(--ink)")}
                          onMouseLeave={e => (e.currentTarget.style.color = "var(--ink-dim)")}
                        >
                          {t("try_example")}
                        </button>
                        <button
                          type="button"
                          onClick={() => setText("")}
                          disabled={loading || !text}
                          className="text-[12px] transition-colors disabled:opacity-40"
                          style={{ color: "var(--ink-dim)", fontFamily: "var(--sans)" }}
                          onMouseEnter={e => (e.currentTarget.style.color = "var(--ink)")}
                          onMouseLeave={e => (e.currentTarget.style.color = "var(--ink-dim)")}
                        >
                          Clear
                        </button>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="submit"
                          disabled={!text.trim() || loading || (!isPro && usage.remaining === 0)}
                          className="btn-submit flex items-center justify-center px-4 py-1.5 rounded-lg bg-white light:bg-[#2C1810] text-gray-950 light:text-[rgba(248,246,234,0.95)] text-[13px] font-semibold hover:bg-slate-100 light:hover:bg-[#3D2214] disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          {loading ? t("analyzing") : "Re-extract claims"}
                        </button>
                      </div>
                    </div>
                  </form>

                  {/* Omakase button */}
                  <div className="relative">
                    <button
                      type="button"
                      disabled={!!omakaseLoading}
                      onClick={isPro
                        ? () => !omakaseLoading && setShowOmakasePicker(true)
                        : () => setShowOmakaseGate((v) => !v)
                      }
                      className="flex w-full items-center justify-center gap-2 rounded-lg px-3 py-2 transition-all text-[13px] font-medium"
                      style={{
                        border: `1px solid ${isPro ? "rgba(212,165,80,0.35)" : "var(--rule)"}`,
                        background: "transparent",
                        color: isPro ? "var(--accent)" : "var(--ink-dim)",
                        fontFamily: "var(--sans)",
                        opacity: omakaseLoading ? 0.6 : 1,
                        cursor: omakaseLoading ? "default" : "pointer",
                      }}
                    >
                      {isPro ? (
                        omakaseLoading ? (
                          <svg className="spin-star h-3.5 w-3.5 shrink-0" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                            <path d="M12 2l2.09 6.26L20 9.27l-4.91 3.58L16.91 19 12 15.77 7.09 19l1.82-6.15L4 9.27l5.91-1.01z"/>
                          </svg>
                        ) : (
                          <svg className="h-3.5 w-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                            <path d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z"/>
                            <path d="M18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456z"/>
                          </svg>
                        )
                      ) : (
                        <svg className="h-3.5 w-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                          <path d="M7 11V7a5 5 0 0110 0v4"/>
                        </svg>
                      )}
                      <span>Omakase</span>
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

                  {/* omakase result */}
                  <AnimatePresence>
                    {omakaseResult && (
                      <div className="mt-2">
                        <OmakaseResultSection
                          rewrittenParagraph={omakaseResult.rewritten_paragraph}
                          referenceList={omakaseResult.reference_list}
                          styleName={omakaseResult.label}
                          onDismiss={() => setOmakaseResult(null)}
                          containerRef={omakaseResultRef}
                        />
                      </div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* ── RIGHT PANE: citation browser ── */}
              <div
                ref={rightPaneRef}
                className={`flex flex-col ${isMobile ? "" : "overflow-y-auto"}`}
                style={{
                  width: isMobile ? "100%" : "50%",
                  background: "var(--bg-deep)",
                }}
              >
                {/* filters header */}
                <div className="px-5 pt-4 pb-3 border-b flex flex-wrap gap-3" style={{ borderColor: "var(--rule-soft)" }}>
                  <RecencyFilter value={yearFilter} onChange={setYearFilter} customRange={customRange} onCustomRange={setCustomRange} isPro={isPro} isSignedIn={isSignedIn} onUpgrade={handleUpgradeClick} />
                  <LanguageFilter value={langFilter} onChange={setLangFilter} isPro={isPro} isSignedIn={isSignedIn} onUpgrade={handleUpgradeClick} />
                </div>

                {/* claim cards */}
                <div ref={resultsRef} className="flex flex-col gap-3 p-5">
                  {results.map((result, i) => (
                    <ClaimCard
                      key={i}
                      result={result}
                      index={i}
                      knownPaperKeys={knownPaperKeys}
                      yearFilter={deferredYearFilter}
                      customRange={deferredCustomRange}
                      isPro={isPro}
                      isSignedIn={isSignedIn}
                      onUpgrade={handleUpgradeClick}
                      onUsageUpdate={(remaining) =>
                        setUsage((u) => ({ ...u, remaining, count: u.limit - remaining }))
                      }
                      savedPaperKeys={savedPaperKeys}
                      onSaveToggle={toggleSavePaper}
                      zoteroConnected={zoteroConnected}
                      onSaveToZotero={handleSaveToZotero}
                      isExpanded={expandedClaims.has(i)}
                      onToggle={() => setExpandedClaims(prev => {
                        const s = new Set(prev);
                        if (s.has(i)) s.delete(i); else s.add(i);
                        return s;
                      })}
                      isHovered={hoveredClaimIdx === i}
                      cardRef={(el) => { claimCardRefs.current[i] = el; }}
                    />
                  ))}
                </div>
              </div>

            </div>
          )}

        </main>
        </div>
        {/* end flex shell */}
      </div>
      <ZoteroToast toast={zoteroToast} onDismiss={() => setZoteroToast(null)} />
    </>
    </LangContext.Provider>
  );
}
