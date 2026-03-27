/**
 * Scimago Journal Rankings (SJR) quartile lookup.
 *
 * The index is generated from the official SJR CSV by running:
 *   node scripts/build-sjr-index.mjs
 *
 * Stored value format: "Q2|Environmental Science" (quartile|category).
 * Lookup priority: ISSN (exact) → normalised journal title.
 */

import { readFileSync } from "fs";
import { join } from "path";

interface SJRIndex {
  issn: Record<string, string>;
  title: Record<string, string>;
}

export interface SJRResult {
  quartile: string;
  category: string | null;
}

let _index: SJRIndex | null = null;

function getIndex(): SJRIndex {
  if (_index) return _index;
  try {
    const raw = readFileSync(
      join(process.cwd(), "data", "sjr-quartiles.json"),
      "utf-8"
    );
    _index = JSON.parse(raw) as SJRIndex;
  } catch {
    // File missing or empty — return empty maps so the app still works
    _index = { issn: {}, title: {} };
  }
  return _index;
}

function normalizeTitle(t: string): string {
  return t.toLowerCase().replace(/[^a-z0-9]/g, "").trim();
}

/** Parse the stored "Q2|Environmental Science" or plain "Q2" value. */
function parseValue(raw: string): SJRResult {
  const pipe = raw.indexOf("|");
  if (pipe === -1) return { quartile: raw, category: null };
  return { quartile: raw.slice(0, pipe), category: raw.slice(pipe + 1) || null };
}

/**
 * Look up the SJR quartile for a journal.
 *
 * @param journal  Display name of the journal (may be null).
 * @param issns    One or more ISSNs associated with the journal (optional).
 * @returns { quartile, category } or null
 */
export function lookupSJRQuartile(
  journal: string | null,
  issns?: string[]
): SJRResult | null {
  const idx = getIndex();

  // 1. ISSN lookup — most reliable (strip hyphens to match stored format)
  if (issns && issns.length > 0) {
    for (const issn of issns) {
      const normalized = issn.replace(/-/g, "").trim();
      const raw = idx.issn[normalized];
      if (raw) return parseValue(raw);
    }
  }

  // 2. Normalised title lookup
  if (journal) {
    const raw = idx.title[normalizeTitle(journal)];
    if (raw) return parseValue(raw);
  }

  return null;
}
