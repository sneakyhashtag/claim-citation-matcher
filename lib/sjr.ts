/**
 * Scimago Journal Rankings (SJR) quartile lookup.
 *
 * The index is generated from the official SJR CSV by running:
 *   node scripts/build-sjr-index.mjs
 *
 * Lookup priority: ISSN (exact) → normalised journal title.
 * Returns "Q1" | "Q2" | "Q3" | "Q4" | null.
 */

import { readFileSync } from "fs";
import { join } from "path";

interface SJRIndex {
  issn: Record<string, string>;
  title: Record<string, string>;
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

/**
 * Look up the SJR quartile for a journal.
 *
 * @param journal  Display name of the journal (may be null).
 * @param issns    One or more ISSNs associated with the journal (optional).
 * @returns "Q1" | "Q2" | "Q3" | "Q4" | null
 */
export function lookupSJRQuartile(
  journal: string | null,
  issns?: string[]
): string | null {
  const idx = getIndex();

  // 1. ISSN lookup — most reliable
  if (issns && issns.length > 0) {
    for (const issn of issns) {
      const q = idx.issn[issn.trim()];
      if (q) return q;
    }
  }

  // 2. Normalised title lookup
  if (journal) {
    const q = idx.title[normalizeTitle(journal)];
    if (q) return q;
  }

  return null;
}
