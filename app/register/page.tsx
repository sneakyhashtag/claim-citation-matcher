"use client";

import { useState, useEffect, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";

function GoogleLogo() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden>
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.35-8.16 2.35-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
      <path fill="none" d="M0 0h48v48H0z" />
    </svg>
  );
}

function RegisterForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/";

  useEffect(() => {
    const theme = localStorage.getItem("rf_theme");
    if (theme === "light") document.documentElement.classList.add("light");
    else document.documentElement.classList.remove("light");
  }, []);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [emailTaken, setEmailTaken] = useState(false);

  const signInHref =
    `/signin` +
    (callbackUrl !== "/" ? `?callbackUrl=${encodeURIComponent(callbackUrl)}` : "");

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setEmailTaken(false);

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });

    const data: { error?: string } = await res.json();

    if (!res.ok) {
      setLoading(false);
      setError(data.error ?? "Registration failed. Please try again.");
      if (res.status === 409) setEmailTaken(true);
      return;
    }

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
      callbackUrl,
    });

    setLoading(false);

    if (result?.error) {
      router.push(signInHref);
    } else if (result?.url) {
      router.push(result.url);
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
            <div>
              <p className="text-[18px] font-semibold leading-none mb-1" style={{ color: "var(--ink)", fontFamily: "var(--mono)" }}>3</p>
              <p className="text-[10px] uppercase tracking-[1.2px]" style={{ color: "var(--ink-dim)", fontFamily: "var(--mono)" }}>free searches / day</p>
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

          <p
            className="text-[10px] uppercase tracking-[2px] mb-3"
            style={{ color: "var(--ink-dim)", fontFamily: "var(--mono)" }}
          >
            create account
          </p>
          <h2
            className="text-[2rem] font-bold leading-tight mb-1"
            style={{ color: "var(--ink)", fontFamily: "var(--serif)", letterSpacing: "-0.02em" }}
          >
            Get started.
          </h2>
          <p className="text-[13px] mb-7" style={{ color: "var(--ink-dim)", fontFamily: "var(--serif)" }}>
            Free account — 3 searches per day, no credit card required.
          </p>

          {/* Error banner */}
          {error && (
            <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2.5 text-[12px] leading-relaxed" style={{ color: "#f87171" }}>
              {error}
              {emailTaken && (
                <>{" "}<Link href={signInHref} className="underline underline-offset-2 hover:opacity-80" style={{ color: "#f87171" }}>Sign in instead →</Link></>
              )}
            </div>
          )}

          {/* Google sign-up */}
          <button
            type="button"
            onClick={() => signIn("google", { callbackUrl })}
            className="flex w-full items-center justify-between rounded-lg border px-4 py-3 text-[13px] font-medium transition-all active:scale-[0.99]"
            style={{
              background: "var(--paper)",
              borderColor: "var(--rule)",
              color: "var(--ink)",
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--ink-dim)"; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--rule)"; }}
          >
            <div className="flex items-center gap-3">
              <GoogleLogo />
              <span style={{ fontFamily: "var(--sans)" }}>Sign up with Google</span>
            </div>
            <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden style={{ color: "var(--ink-dim)" }}>
              <path d="M4 10h12M12 5l5 5-5 5" />
            </svg>
          </button>

          {/* OR divider */}
          <div className="flex items-center gap-3 my-4">
            <div className="h-px flex-1" style={{ background: "var(--rule-soft)" }} />
            <span className="text-[10px] uppercase tracking-widest" style={{ color: "var(--ink-dim)", fontFamily: "var(--mono)" }}>or</span>
            <div className="h-px flex-1" style={{ background: "var(--rule-soft)" }} />
          </div>

          {/* Registration form */}
          <form onSubmit={handleRegister} className="flex flex-col gap-3">
            <div>
              <label
                htmlFor="name"
                className="mb-1.5 block text-[10px] uppercase tracking-[1.5px]"
                style={{ color: "var(--ink-dim)", fontFamily: "var(--mono)" }}
              >
                Name
              </label>
              <input
                id="name"
                type="text"
                autoComplete="name"
                required
                value={name}
                onChange={(e) => { setName(e.target.value); setError(null); }}
                placeholder="Your name"
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
                onChange={(e) => { setEmail(e.target.value); setError(null); setEmailTaken(false); }}
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
            <div>
              <label
                htmlFor="password"
                className="mb-1.5 block text-[10px] uppercase tracking-[1.5px]"
                style={{ color: "var(--ink-dim)", fontFamily: "var(--mono)" }}
              >
                Password{" "}
                <span style={{ color: "var(--ink-dim)", opacity: 0.6 }}>(min. 8 characters)</span>
              </label>
              <input
                id="password"
                type="password"
                autoComplete="new-password"
                required
                minLength={8}
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(null); }}
                placeholder="••••••••"
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
              disabled={loading}
              className="mt-1 flex w-full items-center justify-center gap-2 rounded-lg px-4 py-3 text-[13px] font-semibold transition-all active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
              style={{
                background: "var(--ink)",
                color: "var(--bg-deep)",
                fontFamily: "var(--sans)",
              }}
              onMouseEnter={e => { if (!loading) e.currentTarget.style.opacity = "0.88"; }}
              onMouseLeave={e => { e.currentTarget.style.opacity = "1"; }}
            >
              {loading ? "Creating account…" : (
                <>
                  Create account
                  <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <path d="M4 10h12M12 5l5 5-5 5" />
                  </svg>
                </>
              )}
            </button>
          </form>

          <div className="my-5 h-px" style={{ background: "var(--rule-soft)" }} />

          <p className="text-center text-[12px]" style={{ color: "var(--ink-dim)", fontFamily: "var(--sans)" }}>
            Already have an account?{" "}
            <Link
              href={signInHref}
              className="transition-opacity hover:opacity-70"
              style={{ color: "var(--ink)" }}
            >
              Sign in →
            </Link>
          </p>

          <p className="mt-4 text-center text-[11px] leading-relaxed" style={{ color: "var(--ink-dim)", fontFamily: "var(--sans)" }}>
            By continuing, you agree to our{" "}
            <Link href="/terms" className="underline underline-offset-2 transition-opacity hover:opacity-70" style={{ color: "var(--ink-dim)" }}>Terms</Link>
            {" "}and{" "}
            <Link href="/privacy" className="underline underline-offset-2 transition-opacity hover:opacity-70" style={{ color: "var(--ink-dim)" }}>Privacy Policy</Link>
            .
          </p>

        </div>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={null}>
      <RegisterForm />
    </Suspense>
  );
}
