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

    return NextResponse.json({ ok: true, message: "Tables created successfully." });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
