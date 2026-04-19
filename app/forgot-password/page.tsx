"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

function ForgotPasswordForm() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/";

  const signInHref =
    `/signin` +
    (callbackUrl !== "/" ? `?callbackUrl=${encodeURIComponent(callbackUrl)}` : "");

  useEffect(() => {
    const theme = localStorage.getItem("rf_theme");
    if (theme === "light") document.documentElement.classList.add("light");
    else document.documentElement.classList.remove("light");
  }, []);

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      // Always show the success state — never disclose whether the email exists.
      setSent(true);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="noise-overlay min-h-screen flex flex-col sm:flex-row"
      style={{ background: "var(--bg-deep)" }}
    >
      {/* ── LEFT PANE ── */}
      <div
        className="relative flex flex-col justify-between sm:w-1/2 px-10 pt-10 pb-10 sm:min-h-screen"
        style={{ background: "var(--bg-deep)", borderRight: "1px solid var(--rule-soft)" }}
      >
        {/* Logo */}
        <div className="flex items-center gap-2.5">
          <div
            className="flex h-8 w-8 items-center justify-center rounded-lg text-sm font-bold tracking-tight"
            style={{ background: "var(--ink)", color: "var(--bg-deep)" }}
          >
            R
          </div>
          <span className="text-[14px] font-medium" style={{ color: "var(--ink)", fontFamily: "var(--serif)" }}>
            Reference Finder
          </span>
        </div>

        {/* Editorial copy */}
        <div className="py-16 sm:py-0 sm:flex-1 sm:flex sm:flex-col sm:justify-center">
          <p
            className="text-[10px] uppercase tracking-[2.5px] mb-6"
            style={{ color: "var(--ink-dim)", fontFamily: "var(--mono)" }}
          >
            — an editorial tool for researchers
          </p>
          <h1
            className="text-[clamp(2.6rem,5vw,3.6rem)] leading-[1.08] font-bold mb-5"
            style={{ color: "var(--ink)", fontFamily: "var(--serif)", letterSpacing: "-0.02em" }}
          >
            Find the right{" "}
            <em className="not-italic" style={{ color: "var(--accent)" }}>
              citation.
            </em>
          </h1>
          <p
            className="text-[14px] leading-[1.7] italic max-w-[380px]"
            style={{ color: "var(--ink-dim)", fontFamily: "var(--serif)" }}
          >
            Paste a paragraph of your draft. We surface supporting papers from OpenAlex and Semantic Scholar — ranked by relevance, matched to the exact sentence.
          </p>
        </div>

        {/* Stats bar */}
        <div>
          <div className="mb-5 h-px" style={{ background: "var(--rule-soft)" }} />
          <div className="flex items-end gap-8 flex-wrap">
            <div>
              <p className="text-[18px] font-semibold leading-none mb-1" style={{ color: "var(--ink)", fontFamily: "var(--mono)" }}>240M+</p>
              <p className="text-[10px] uppercase tracking-[1.2px]" style={{ color: "var(--ink-dim)", fontFamily: "var(--mono)" }}>indexed papers</p>
            </div>
            <div>
              <p className="text-[15px] font-semibold leading-none mb-1" style={{ color: "var(--ink)", fontFamily: "var(--sans)" }}>EN · 中 · 日 · 한</p>
              <p className="text-[10px] uppercase tracking-[1.2px]" style={{ color: "var(--ink-dim)", fontFamily: "var(--mono)" }}>languages</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── RIGHT PANE ── */}
      <div
        className="flex flex-col justify-center sm:w-1/2 px-8 sm:px-16 py-12 sm:min-h-screen"
        style={{ background: "var(--bg)" }}
      >
        <div className="w-full max-w-[380px] mx-auto">

          {sent ? (
            /* ── Success state ── */
            <div>
              <div
                className="mb-6 flex h-11 w-11 items-center justify-center rounded-full"
                style={{ background: "var(--paper)", border: "1px solid var(--rule)" }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden style={{ color: "var(--accent)" }}>
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                  <polyline points="22,6 12,13 2,6" />
                </svg>
              </div>
              <h2
                className="text-[2rem] font-bold leading-tight mb-2"
                style={{ color: "var(--ink)", fontFamily: "var(--serif)", letterSpacing: "-0.02em" }}
              >
                Check your inbox.
              </h2>
              <p className="text-[13px] mb-8 leading-relaxed" style={{ color: "var(--ink-dim)", fontFamily: "var(--serif)" }}>
                If <span style={{ color: "var(--ink)" }}>{email}</span> is associated with an account, you&rsquo;ll receive a password reset link shortly.
              </p>
              <Link
                href={signInHref}
                className="flex w-full items-center justify-center gap-2 rounded-lg px-4 py-3 text-[13px] font-semibold transition-all"
                style={{ background: "var(--ink)", color: "var(--bg-deep)", fontFamily: "var(--sans)" }}
              >
                Back to sign in
              </Link>
              <p className="mt-4 text-center text-[11px]" style={{ color: "var(--ink-dim)", fontFamily: "var(--sans)" }}>
                Didn&rsquo;t receive it?{" "}
                <button
                  type="button"
                  onClick={() => { setSent(false); setEmail(""); }}
                  className="underline underline-offset-2 transition-opacity hover:opacity-70"
                  style={{ color: "var(--ink-dim)" }}
                >
                  Try again
                </button>
              </p>
            </div>
          ) : (
            /* ── Email form ── */
            <>
              <p
                className="text-[10px] uppercase tracking-[2px] mb-3"
                style={{ color: "var(--ink-dim)", fontFamily: "var(--mono)" }}
              >
                account recovery
              </p>
              <h2
                className="text-[2rem] font-bold leading-tight mb-1"
                style={{ color: "var(--ink)", fontFamily: "var(--serif)", letterSpacing: "-0.02em" }}
              >
                Forgot password?
              </h2>
              <p className="text-[13px] mb-7" style={{ color: "var(--ink-dim)", fontFamily: "var(--serif)" }}>
                Enter your email and we&rsquo;ll send you a reset link.
              </p>

              {error && (
                <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2.5 text-[12px]" style={{ color: "#f87171" }}>
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div>
                  <label
                    htmlFor="email"
                    className="mb-1.5 block text-[10px] uppercase tracking-[1.5px]"
                    style={{ color: "var(--ink-dim)", fontFamily: "var(--mono)" }}
                  >
                    Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setError(""); }}
                    placeholder="ada@university.edu"
                    className="w-full rounded-lg border px-3.5 py-2.5 text-[13px] outline-none transition-all"
                    style={{
                      background: "var(--paper)",
                      borderColor: "var(--rule)",
                      color: "var(--ink)",
                      fontFamily: "var(--sans)",
                    }}
                    onFocus={e => { e.currentTarget.style.borderColor = "var(--ink-dim)"; }}
                    onBlur={e => { e.currentTarget.style.borderColor = "var(--rule)"; }}
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading || !email.trim()}
                  className="flex w-full items-center justify-center gap-2 rounded-lg px-4 py-3 text-[13px] font-semibold transition-all active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
                  style={{
                    background: "var(--ink)",
                    color: "var(--bg-deep)",
                    fontFamily: "var(--sans)",
                  }}
                  onMouseEnter={e => { if (!loading) e.currentTarget.style.opacity = "0.88"; }}
                  onMouseLeave={e => { e.currentTarget.style.opacity = "1"; }}
                >
                  {loading ? "Sending…" : (
                    <>
                      Send reset link
                      <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                        <path d="M4 10h12M12 5l5 5-5 5" />
                      </svg>
                    </>
                  )}
                </button>
              </form>

              <div className="my-5 h-px" style={{ background: "var(--rule-soft)" }} />

              <p className="text-center text-[12px]" style={{ color: "var(--ink-dim)", fontFamily: "var(--sans)" }}>
                Remembered it?{" "}
                <Link
                  href={signInHref}
                  className="transition-opacity hover:opacity-70"
                  style={{ color: "var(--ink)" }}
                >
                  Back to sign in →
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ForgotPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ForgotPasswordForm />
    </Suspense>
  );
}
