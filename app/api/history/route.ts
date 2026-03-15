// History is now stored in the browser via localStorage.
// These server-side endpoints are intentionally disabled.
import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ error: "Not found" }, { status: 404 });
}
export async function POST() {
  return NextResponse.json({ error: "Not found" }, { status: 404 });
}
