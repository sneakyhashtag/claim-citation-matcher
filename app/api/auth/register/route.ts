import { NextRequest, NextResponse } from "next/server";
import { createPool } from "@vercel/postgres";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { name, email, password } = body as {
    name?: string;
    email?: string;
    password?: string;
  };

  if (!name?.trim() || !email?.trim() || !password) {
    return NextResponse.json(
      { error: "Name, email, and password are required" },
      { status: 400 }
    );
  }
  if (password.length < 8) {
    return NextResponse.json(
      { error: "Password must be at least 8 characters" },
      { status: 400 }
    );
  }

  const normalizedEmail = email.trim().toLowerCase();
  const pool = createPool({ connectionString: process.env.POSTGRES_URL });
  const client = await pool.connect();

  try {
    const existing = await client.query(
      "SELECT id FROM users WHERE email = $1",
      [normalizedEmail]
    );
    if (existing.rows.length > 0) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);
    await client.query(
      `INSERT INTO users (email, name, password_hash, pro_status, created_at)
       VALUES ($1, $2, $3, false, NOW())`,
      [normalizedEmail, name.trim(), passwordHash]
    );

    return NextResponse.json({ success: true });
  } finally {
    client.release();
    await pool.end();
  }
}
