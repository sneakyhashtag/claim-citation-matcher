import { createHmac, randomBytes } from "crypto";

function pct(s: string): string {
  return encodeURIComponent(s)
    .replace(/!/g, "%21").replace(/'/g, "%27")
    .replace(/\(/g, "%28").replace(/\)/g, "%29")
    .replace(/\*/g, "%2A");
}

export interface OAuth1Options {
  method: "POST" | "GET";
  url: string;
  consumerKey: string;
  consumerSecret: string;
  tokenKey?: string;
  tokenSecret?: string;
  extra?: Record<string, string>;
}

/** Build an OAuth 1.0a Authorization header with HMAC-SHA1. */
export function buildOAuth1Header(opts: OAuth1Options): string {
  const params: Record<string, string> = {
    oauth_consumer_key: opts.consumerKey,
    oauth_nonce: randomBytes(16).toString("hex"),
    oauth_signature_method: "HMAC-SHA1",
    oauth_timestamp: String(Math.floor(Date.now() / 1000)),
    oauth_version: "1.0",
    ...(opts.extra ?? {}),
  };
  if (opts.tokenKey) params.oauth_token = opts.tokenKey;

  const normalized = Object.keys(params)
    .sort()
    .map((k) => `${pct(k)}=${pct(params[k])}`)
    .join("&");

  const baseString = [opts.method, pct(opts.url), pct(normalized)].join("&");
  const signingKey = `${pct(opts.consumerSecret)}&${pct(opts.tokenSecret ?? "")}`;
  params.oauth_signature = createHmac("sha1", signingKey).update(baseString).digest("base64");

  return (
    "OAuth " +
    Object.keys(params)
      .filter((k) => k.startsWith("oauth_"))
      .sort()
      .map((k) => `${pct(k)}="${pct(params[k])}"`)
      .join(", ")
  );
}

const cookieSecret = () =>
  process.env.COOKIE_SECRET ?? "dev-fallback-please-set-COOKIE_SECRET-in-production";

/** Sign a plain string value into a tamper-evident cookie payload. */
export function signCookieValue(value: string): string {
  const data = Buffer.from(value).toString("base64url");
  const sig = createHmac("sha256", cookieSecret()).update(data).digest("base64url");
  return `${data}.${sig}`;
}

/** Verify and decode a cookie payload produced by signCookieValue. Returns null if invalid. */
export function verifyCookieValue(cookie: string): string | null {
  const dot = cookie.lastIndexOf(".");
  if (dot === -1) return null;
  const data = cookie.slice(0, dot);
  const sig = cookie.slice(dot + 1);
  const expected = createHmac("sha256", cookieSecret()).update(data).digest("base64url");
  if (sig !== expected) return null;
  try {
    return Buffer.from(data, "base64url").toString();
  } catch {
    return null;
  }
}
