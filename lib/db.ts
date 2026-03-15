import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

const DATA_DIR = path.join(process.cwd(), "data");
const DB_PATH = path.join(DATA_DIR, "searches.db");

let _db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (_db) return _db;

  fs.mkdirSync(DATA_DIR, { recursive: true });

  _db = new Database(DB_PATH);
  _db.exec(`
    CREATE TABLE IF NOT EXISTS searches (
      id        INTEGER PRIMARY KEY AUTOINCREMENT,
      user_email TEXT    NOT NULL,
      paragraph  TEXT    NOT NULL,
      claims_json TEXT   NOT NULL,
      results_json TEXT  NOT NULL,
      created_at TEXT    NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS usage_limits (
      key   TEXT PRIMARY KEY,
      count INTEGER NOT NULL DEFAULT 0,
      date  TEXT    NOT NULL DEFAULT ''
    );
  `);

  return _db;
}

// ── usage limit helpers ───────────────────────────────────────────────────────

export const DAILY_LIMIT = 3;

function todayUTC(): string {
  return new Date().toISOString().slice(0, 10); // YYYY-MM-DD
}

export interface UsageInfo {
  count: number;
  remaining: number;
  limit: number;
}

export function getUsage(key: string): UsageInfo {
  const db = getDb();
  const today = todayUTC();
  const row = db
    .prepare("SELECT count, date FROM usage_limits WHERE key = ?")
    .get(key) as { count: number; date: string } | undefined;

  if (!row || row.date !== today) {
    return { count: 0, remaining: DAILY_LIMIT, limit: DAILY_LIMIT };
  }
  return {
    count: row.count,
    remaining: Math.max(0, DAILY_LIMIT - row.count),
    limit: DAILY_LIMIT,
  };
}

export function checkAndIncrementUsage(key: string): UsageInfo & { allowed: boolean } {
  const db = getDb();
  const today = todayUTC();
  const row = db
    .prepare("SELECT count, date FROM usage_limits WHERE key = ?")
    .get(key) as { count: number; date: string } | undefined;

  if (!row || row.date !== today) {
    db.prepare(
      "INSERT OR REPLACE INTO usage_limits (key, count, date) VALUES (?, 1, ?)"
    ).run(key, today);
    return { allowed: true, count: 1, remaining: DAILY_LIMIT - 1, limit: DAILY_LIMIT };
  }

  if (row.count >= DAILY_LIMIT) {
    return { allowed: false, count: row.count, remaining: 0, limit: DAILY_LIMIT };
  }

  const newCount = row.count + 1;
  db.prepare("UPDATE usage_limits SET count = ? WHERE key = ?").run(newCount, key);
  return {
    allowed: true,
    count: newCount,
    remaining: DAILY_LIMIT - newCount,
    limit: DAILY_LIMIT,
  };
}

export interface SearchRow {
  id: number;
  user_email: string;
  paragraph: string;
  claims_json: string;
  results_json: string;
  created_at: string;
}
