/**
 * Build the SJR quartile lookup index from the raw Scimago CSV.
 *
 * Usage:
 *   node scripts/build-sjr-index.mjs
 *
 * Prerequisites:
 *   1. Go to https://www.scimagojr.com/journalrank.php
 *   2. Click "Download data" (bottom of the page)
 *   3. Save the file as  data/sjr.csv  in the project root
 *   4. Run this script — it writes data/sjr-quartiles.json
 *
 * Stored value format: "Q2|Environmental Science"  (quartile|category)
 * ISSN keys are normalised to no-hyphen form, e.g. "00280836",
 * so the lookup code can strip hyphens from OpenAlex ISSNs before matching.
 */

import { createReadStream } from "fs";
import { writeFile, access } from "fs/promises";
import { createInterface } from "readline";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const INPUT = join(ROOT, "data", "sjr.csv");
const OUTPUT = join(ROOT, "data", "sjr-quartiles.json");

try {
  await access(INPUT);
} catch {
  console.error("ERROR: data/sjr.csv not found.\n");
  console.error("1. Visit https://www.scimagojr.com/journalrank.php");
  console.error('2. Click "Download data" at the bottom of the page');
  console.error("3. Save the file as  data/sjr.csv  in the project root");
  console.error("4. Re-run this script");
  process.exit(1);
}

// ── helpers ──────────────────────────────────────────────────────────────────

function normalizeTitle(t) {
  return t.toLowerCase().replace(/[^a-z0-9]/g, "").trim();
}

/** Strip hyphens so "1542-4863" and "15424863" are the same key. */
function normalizeISSN(issn) {
  return issn.replace(/-/g, "").trim();
}

/**
 * Parse "Category Name (Q2); Other Category (Q1)" into
 * [{name, q}, ...].
 *
 * Splits on ";" first so that category names containing parentheses
 * (e.g. "Medicine (miscellaneous) (Q1)") are handled correctly.
 * The quartile is always the last parenthesised token on each item.
 */
function parseCategories(field) {
  const results = [];
  for (const item of field.split(";")) {
    const trimmed = item.trim();
    const m = trimmed.match(/^(.*?)\s*\((Q[1-4])\)\s*$/);
    if (m) results.push({ name: m[1].trim(), q: m[2] });
  }
  return results;
}

/**
 * Return the most common quartile across categories.
 * Tie-breaks toward the worse quartile (more conservative).
 */
function modalQuartile(cats) {
  if (!cats.length) return null;
  const counts = { Q1: 0, Q2: 0, Q3: 0, Q4: 0 };
  for (const { q } of cats) counts[q]++;
  // Sort by count desc, then by quartile asc (Q4 < Q3 < Q2 < Q1 → worse wins tie)
  return Object.entries(counts)
    .filter(([, v]) => v > 0)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    [0][0];
}

/**
 * Pick the first category whose quartile equals the modal quartile.
 * Falls back to the first category overall.
 */
function dominantCategory(cats, modal) {
  return (cats.find((c) => c.q === modal) ?? cats[0])?.name ?? null;
}

// ── naive CSV line parser that handles quoted fields containing semicolons ──

/**
 * Split a semicolon-delimited line respecting double-quoted fields.
 * Does NOT handle escaped quotes ("") inside fields — not needed for SJR data.
 */
function splitCSVLine(line) {
  const cols = [];
  let cur = "";
  let inQuote = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      inQuote = !inQuote;
    } else if (ch === ";" && !inQuote) {
      cols.push(cur.trim());
      cur = "";
    } else {
      cur += ch;
    }
  }
  cols.push(cur.trim());
  return cols;
}

// ── main ─────────────────────────────────────────────────────────────────────

const byIssn  = Object.create(null);
const byTitle = Object.create(null);

const rl = createInterface({ input: createReadStream(INPUT), crlfDelay: Infinity });

let isFirst = true;
let issnCol = -1, titleCol = -1, quartileCol = -1, catCol = -1;
let rowCount = 0, indexedCount = 0, modalFixCount = 0;

for await (const line of rl) {
  const cols = splitCSVLine(line);

  if (isFirst) {
    isFirst = false;
    cols.forEach((col, i) => {
      const c = col.toLowerCase().replace(/['"]/g, "");
      if (c === "issn")               issnCol      = i;
      if (c === "title")              titleCol     = i;
      if (c === "sjr best quartile")  quartileCol  = i;
      if (c === "categories")         catCol       = i;
    });
    if (issnCol === -1 || titleCol === -1 || quartileCol === -1) {
      console.error("Could not find required columns. Expected: Issn, Title, SJR Best Quartile");
      console.error(`Found columns: ${cols.slice(0, 15).join(", ")}`);
      process.exit(1);
    }
    continue;
  }

  rowCount++;
  if (cols.length <= quartileCol) continue;

  const bestQ = cols[quartileCol];
  if (!bestQ || bestQ === "-" || !bestQ.startsWith("Q")) continue;

  // Compute modal quartile from per-category data (more honest than SJR Best)
  let quartile = bestQ;
  let category = null;
  if (catCol !== -1 && cols[catCol]) {
    const cats = parseCategories(cols[catCol]);
    if (cats.length > 0) {
      const mq = modalQuartile(cats);
      if (mq) {
        if (mq !== bestQ) modalFixCount++;
        quartile = mq;
        category = dominantCategory(cats, mq);
      }
    }
  }

  const value = category ? `${quartile}|${category}` : quartile;
  indexedCount++;

  // Index by ISSN — normalised to no-hyphen form
  const issnField = cols[issnCol] ?? "";
  for (const raw of issnField.split(",")) {
    const issn = normalizeISSN(raw);
    if (issn && !/^0+$/.test(issn) && !byIssn[issn]) {
      byIssn[issn] = value;
    }
  }

  // Index by normalised title
  const rawTitle = cols[titleCol] ?? "";
  if (rawTitle) {
    const key = normalizeTitle(rawTitle);
    if (key && !byTitle[key]) {
      byTitle[key] = value;
    }
  }
}

await writeFile(OUTPUT, JSON.stringify({ issn: byIssn, title: byTitle }));

const issnCount  = Object.keys(byIssn).length;
const titleCount = Object.keys(byTitle).length;
console.log(`Processed ${rowCount} rows, indexed ${indexedCount} ranked journals.`);
console.log(`  ISSN entries  : ${issnCount}`);
console.log(`  Title entries : ${titleCount}`);
console.log(`  Modal Q != Best Q (corrected): ${modalFixCount}`);
console.log(`Written to ${OUTPUT}`);
