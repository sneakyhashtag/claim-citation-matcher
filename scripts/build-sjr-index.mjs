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

function normalizeTitle(t) {
  return t.toLowerCase().replace(/[^a-z0-9]/g, "").trim();
}

const byIssn  = Object.create(null);
const byTitle = Object.create(null);

const rl = createInterface({ input: createReadStream(INPUT), crlfDelay: Infinity });

let isFirst = true;
let issnCol = -1;
let titleCol = -1;
let quartileCol = -1;
let rowCount = 0;
let indexedCount = 0;

for await (const line of rl) {
  // The CSV uses semicolons as delimiters
  const cols = line.split(";");

  if (isFirst) {
    isFirst = false;
    cols.forEach((col, i) => {
      const c = col.trim().toLowerCase().replace(/['"]/g, "");
      if (c === "issn")               issnCol      = i;
      if (c === "title")              titleCol     = i;
      if (c === "sjr best quartile")  quartileCol  = i;
    });
    if (issnCol === -1 || titleCol === -1 || quartileCol === -1) {
      console.error("Could not find required columns in the CSV header.");
      console.error(`Found: ${cols.map((c) => c.trim()).join(", ")}`);
      console.error("Expected columns: Issn, Title, SJR Best Quartile");
      process.exit(1);
    }
    continue;
  }

  rowCount++;
  if (cols.length <= quartileCol) continue;

  const quartile = cols[quartileCol]?.trim().replace(/['"]/g, "");
  if (!quartile || quartile === "-" || !quartile.startsWith("Q")) continue;

  indexedCount++;

  // Index by ISSN (the field may contain multiple ISSNs separated by ", ")
  const issnField = cols[issnCol]?.trim().replace(/['"]/g, "") ?? "";
  for (const raw of issnField.split(",")) {
    const issn = raw.trim();
    if (issn && !/^0+$/.test(issn) && !byIssn[issn]) {
      byIssn[issn] = quartile;
    }
  }

  // Index by normalised title
  const rawTitle = cols[titleCol]?.trim().replace(/^["']|["']$/g, "") ?? "";
  if (rawTitle) {
    const key = normalizeTitle(rawTitle);
    if (key && !byTitle[key]) {
      byTitle[key] = quartile;
    }
  }
}

await writeFile(OUTPUT, JSON.stringify({ issn: byIssn, title: byTitle }));

const issnCount  = Object.keys(byIssn).length;
const titleCount = Object.keys(byTitle).length;
console.log(`Processed ${rowCount} rows, indexed ${indexedCount} ranked journals.`);
console.log(`  ISSN entries : ${issnCount}`);
console.log(`  Title entries: ${titleCount}`);
console.log(`Written to ${OUTPUT}`);
