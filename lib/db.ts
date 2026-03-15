import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

// /tmp is the only writable directory on Vercel serverless functions.
// NOTE: /tmp is ephemeral — data resets on cold starts. Usage tracking has
// been moved to an encrypted HTTP-only cookie (lib/usage-cookie.ts).
const DATA_DIR = "/tmp/data";
const DB_PATH = path.join(DATA_DIR, "searches.db");

let _db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (_db) return _db;

  fs.mkdirSync(DATA_DIR, { recursive: true });

  _db = new Database(DB_PATH);
  _db.exec(`
    CREATE TABLE IF NOT EXISTS searches (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      user_email   TEXT    NOT NULL,
      paragraph    TEXT    NOT NULL,
      claims_json  TEXT    NOT NULL,
      results_json TEXT    NOT NULL,
      created_at   TEXT    NOT NULL DEFAULT (datetime('now'))
    );
  `);

  return _db;
}

export interface SearchRow {
  id: number;
  user_email: string;
  paragraph: string;
  claims_json: string;
  results_json: string;
  created_at: string;
}
