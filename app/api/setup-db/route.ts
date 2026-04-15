import { NextResponse } from "next/server";
import { sql } from "@/lib/db";

export async function GET() {
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id             SERIAL PRIMARY KEY,
        email          TEXT UNIQUE NOT NULL,
        name           TEXT,
        pro_status     BOOLEAN NOT NULL DEFAULT FALSE,
        stripe_customer_id TEXT,
        created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS searches (
        id              SERIAL PRIMARY KEY,
        user_id         INTEGER REFERENCES users(id) ON DELETE SET NULL,
        paragraph       TEXT,
        claims          JSONB,
        results         JSONB,
        omakase_result  JSONB,
        citation_style  TEXT,
        created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS usage (
        id           SERIAL PRIMARY KEY,
        identifier   TEXT NOT NULL,
        search_count INTEGER NOT NULL DEFAULT 0,
        date         DATE NOT NULL DEFAULT CURRENT_DATE,
        UNIQUE (identifier, date)
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS rate_limits (
        id            BIGSERIAL PRIMARY KEY,
        identifier    TEXT NOT NULL,
        route         TEXT NOT NULL,
        window_start  TIMESTAMPTZ NOT NULL,
        request_count INTEGER NOT NULL DEFAULT 1,
        UNIQUE (identifier, route, window_start)
      )
    `;

    await sql`
      CREATE INDEX IF NOT EXISTS idx_rate_limits_lookup
        ON rate_limits (identifier, route, window_start)
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS search_tabs (
        id          BIGSERIAL PRIMARY KEY,
        user_id     INTEGER REFERENCES users(id) ON DELETE CASCADE,
        preview     TEXT,
        paragraph   TEXT,
        claims      JSONB,
        results     JSONB,
        omakase_result JSONB,
        created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `;

    await sql`
      CREATE INDEX IF NOT EXISTS idx_search_tabs_user
        ON search_tabs (user_id, updated_at DESC)
    `;

    // Idempotent column additions — safe to run on an existing database.
    await sql`
      ALTER TABLE users
        ADD COLUMN IF NOT EXISTS has_used_trial BOOLEAN NOT NULL DEFAULT FALSE
    `;

    return NextResponse.json({ ok: true, message: "Tables created successfully." });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
