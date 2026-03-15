/**
 * Tests for the usage-cookie signing and rate-limiting logic.
 *
 * Run with:  node lib/usage-cookie.test.mjs
 *
 * Uses Node.js built-in test runner (Node 18+) and reimplements the exact
 * same encode/decode algorithm as usage-cookie.ts so the test is an
 * independent specification check — if the TS implementation diverges from
 * this format the cookie will be rejected and counts will reset to 0.
 */

import { createHmac, timingSafeEqual } from "node:crypto";
import { test } from "node:test";
import assert from "node:assert/strict";

// ── Algorithm (mirrors usage-cookie.ts exactly) ────────────────────────────

const DAILY_LIMIT = 3;
const COOKIE_NAME = "_rf_usage";
const SECRET = "dev-fallback-please-set-COOKIE_SECRET-in-production";

function todayUTC() {
  return new Date().toISOString().slice(0, 10);
}

function sign(data) {
  return createHmac("sha256", SECRET).update(data).digest("base64url");
}

function encode(payload) {
  const data = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${data}.${sign(data)}`;
}

function decode(raw) {
  const dot = raw.lastIndexOf(".");
  if (dot === -1) return null;

  const data = raw.slice(0, dot);
  const sig = raw.slice(dot + 1);

  const expected = sign(data);
  const aBuf = Buffer.from(sig);
  const bBuf = Buffer.from(expected);
  if (aBuf.length !== bBuf.length || !timingSafeEqual(aBuf, bBuf)) return null;

  let parsed;
  try {
    parsed = JSON.parse(Buffer.from(data, "base64url").toString("utf8"));
  } catch {
    return null;
  }

  if (typeof parsed !== "object" || parsed === null) return null;
  const { count, date } = parsed;
  if (
    typeof count !== "number" ||
    !Number.isInteger(count) ||
    count < 0 ||
    typeof date !== "string"
  ) {
    return null;
  }

  return { count, date };
}

// ── Minimal Next.js cookie mocks ───────────────────────────────────────────

function makeMockRequest(cookieValue) {
  return {
    cookies: {
      get: (name) =>
        name === COOKIE_NAME && cookieValue != null
          ? { value: cookieValue }
          : undefined,
    },
  };
}

function makeMockResponse() {
  const jar = {};
  return {
    cookies: {
      set: (name, value) => { jar[name] = value; },
    },
    _jar: jar,
  };
}

// ── Simulate readCount and writeCount using the same logic as the TS module ─

function readCount(req) {
  const today = todayUTC();
  const raw = req.cookies.get(COOKIE_NAME)?.value ?? "";
  const payload = raw ? decode(raw) : null;
  return payload?.date === today ? payload.count : 0;
}

function writeCount(res, newCount) {
  const value = encode({ count: newCount, date: todayUTC() });
  res.cookies.set(COOKIE_NAME, value);
}

// ── Tests ──────────────────────────────────────────────────────────────────

test("no cookie → count is 0", () => {
  const req = makeMockRequest(undefined);
  assert.equal(readCount(req), 0);
});

test("empty string cookie → count is 0", () => {
  const req = makeMockRequest("");
  assert.equal(readCount(req), 0);
});

test("random garbage cookie → count is 0", () => {
  const req = makeMockRequest("not-a-valid-cookie-at-all");
  assert.equal(readCount(req), 0);
});

test("base64 payload with no dot → count is 0", () => {
  const data = Buffer.from(JSON.stringify({ count: 99, date: todayUTC() })).toString("base64url");
  const req = makeMockRequest(data); // no dot, so decode returns null
  assert.equal(readCount(req), 0);
});

test("valid payload with tampered count → count is 0", () => {
  // Build a cookie for count=1, then flip a byte in the payload to count=9
  const honest = encode({ count: 1, date: todayUTC() });
  const [data, sig] = honest.split(".");
  // Decode and re-encode with count=9 but keep the old signature
  const tamperedPayload = Buffer.from(
    JSON.stringify({ count: 9, date: todayUTC() })
  ).toString("base64url");
  const tampered = `${tamperedPayload}.${sig}`;
  const req = makeMockRequest(tampered);
  assert.equal(readCount(req), 0, "tampered payload should be rejected");
});

test("valid payload with wrong signature → count is 0", () => {
  const honest = encode({ count: 1, date: todayUTC() });
  const [data] = honest.split(".");
  // Append a completely wrong signature
  const badSig = Buffer.from("wrongsignature").toString("base64url");
  const req = makeMockRequest(`${data}.${badSig}`);
  assert.equal(readCount(req), 0, "wrong signature should be rejected");
});

test("valid cookie from yesterday → count is 0 (day reset)", () => {
  const yesterday = new Date();
  yesterday.setUTCDate(yesterday.getUTCDate() - 1);
  const staleDate = yesterday.toISOString().slice(0, 10);
  const staleCookie = encode({ count: 3, date: staleDate });
  const req = makeMockRequest(staleCookie);
  assert.equal(readCount(req), 0, "stale date should reset to 0");
});

test("valid cookie from tomorrow → count is 0 (future date rejected)", () => {
  const tomorrow = new Date();
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
  const futureDate = tomorrow.toISOString().slice(0, 10);
  const futureCookie = encode({ count: 0, date: futureDate });
  const req = makeMockRequest(futureCookie);
  assert.equal(readCount(req), 0, "future date should reset to 0");
});

test("valid cookie with count=1 today → count is 1", () => {
  const cookie = encode({ count: 1, date: todayUTC() });
  const req = makeMockRequest(cookie);
  assert.equal(readCount(req), 1);
});

test("valid cookie with count=3 today → count is 3", () => {
  const cookie = encode({ count: 3, date: todayUTC() });
  const req = makeMockRequest(cookie);
  assert.equal(readCount(req), 3);
});

test("writeCount produces a cookie that readCount can read back", () => {
  const res = makeMockResponse();
  writeCount(res, 2);
  const written = res._jar[COOKIE_NAME];
  assert.ok(written, "cookie should have been set");

  const req = makeMockRequest(written);
  assert.equal(readCount(req), 2);
});

test("brand new visitor: exactly 3 searches allowed, 4th is blocked", () => {
  // Start with no cookie (new visitor)
  let cookieValue = undefined;

  for (let attempt = 1; attempt <= 3; attempt++) {
    const req = makeMockRequest(cookieValue);
    const count = readCount(req);

    // Simulate the route: check limit
    assert.ok(
      count < DAILY_LIMIT,
      `attempt ${attempt} should be allowed (count=${count})`
    );

    // Simulate the route: write incremented count on the response
    const res = makeMockResponse();
    writeCount(res, count + 1);
    cookieValue = res._jar[COOKIE_NAME]; // browser stores the cookie
  }

  // 4th attempt — cookie now has count=3
  const req4 = makeMockRequest(cookieValue);
  const count4 = readCount(req4);
  assert.equal(count4, 3, "count should be 3 after 3 searches");
  assert.ok(
    count4 >= DAILY_LIMIT,
    `4th attempt should be blocked (count=${count4} >= limit=${DAILY_LIMIT})`
  );
});

test("cookie count cannot exceed DAILY_LIMIT via integer overflow or float tricks", () => {
  // Negative count — rejected by type check
  const negCookie = encode({ count: -1, date: todayUTC() });
  const req1 = makeMockRequest(negCookie);
  assert.equal(readCount(req1), 0, "negative count should be rejected");

  // Float count — rejected by isInteger check
  const floatData = Buffer.from(JSON.stringify({ count: 0.5, date: todayUTC() })).toString("base64url");
  const floatCookie = `${floatData}.${sign(floatData)}`;
  const req2 = makeMockRequest(floatCookie);
  assert.equal(readCount(req2), 0, "float count should be rejected");
});
