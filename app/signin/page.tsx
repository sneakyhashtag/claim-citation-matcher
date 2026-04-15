"use client";

import { useState, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";

const ERROR_MESSAGES: Record<string, string> = {
  EmailNotFound:
    "No account found with this email address. Would you like to create one?",
  GoogleOnly:
    'This email is linked to Google sign-in. Use the "Continue with Google" button above.',
  WrongPassword: "Incorrect password. Please try again.",
  CredentialsSignin: "Incorrect email or password.",
  OAuthAccountNotLinked:
    "This email is already linked to a different sign-in method.",
  Default: "Something went wrong. Please try again.",
};

function errorMessage(code: string | null | undefined): string {
  if (!code) return "";
  return ERROR_MESSAGES[code] ?? ERROR_MESSAGES.Default;
}

// ── Icons ─────────────────────────────────────────────────────────────────────

function BookIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
      stroke="#f59e0b" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
    </svg>
  );
}

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

function FileTextIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
    </svg>
  );
}

function BrainIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96-.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 1.44-4.66z" />
      <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96-.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.44-4.66z" />
    </svg>
  );
}

function DatabaseIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <ellipse cx="12" cy="5" rx="9" ry="3" />
      <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
      <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
    </svg>
  );
}

function BarChartIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  );
}

function QuoteIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 2v7c0 1.25.75 2 2 2h3c1.25 0 2 .75 2 2" />
      <path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 2v7c0 1.25.75 2 2 2h3c1.25 0 2 .75 2 2" />
    </svg>
  );
}

// ── Steps data ────────────────────────────────────────────────────────────────

const STEPS = [
  {
    Icon: FileTextIcon,
    label: "Paste",
    desc: "Drop any academic paragraph in any language — English, 中文, or 日本語.",
  },
  {
    Icon: BrainIcon,
    label: "Extract",
    desc: "AI identifies each factual claim in your writing that needs a citation.",
  },
  {
    Icon: DatabaseIcon,
    label: "Search",
    desc: "Real papers pulled from OpenAlex and Semantic Scholar — never hallucinated.",
  },
  {
    Icon: BarChartIcon,
    label: "Rank",
    desc: "Every result shows citation count, h-index, Impact Factor, and Scimago quartile.",
  },
  {
    Icon: QuoteIcon,
    label: "Cite",
    desc: "Copy in APA, MLA, Chicago, IEEE, or let Omakase rewrite your paragraph with citations.",
  },
] as const;

// ── Sign-in form ──────────────────────────────────────────────────────────────

function SignInForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/";
  const urlError = searchParams.get("error");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>(() => errorMessage(urlError));
  const [showEmail, setShowEmail] = useState(false);

  async function handleCredentials(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const result = await signIn("credentials", { email, password, redirect: false, callbackUrl });
    setLoading(false);
    if (result?.error) {
      setError(errorMessage(result.error));
    } else if (result?.url) {
      router.push(result.url);
    }
  }

  const registerHref =
    `/register` +
    (callbackUrl !== "/" ? `?callbackUrl=${encodeURIComponent(callbackUrl)}` : "");

  return (
    <div className="min-h-screen flex items-start justify-center px-4 pt-10 pb-16 bg-[#0a0a0a] light:bg-[#EDEDD3]">
      <div className="w-full max-w-4xl flex flex-col items-center gap-8">

        {/* ── 1. Header ── */}
        <div className="text-center">
          <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-full border border-amber-500/30 bg-amber-500/10">
            <BookIcon />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-100 light:text-[#2C1810]">
            Reference Finder
          </h1>
          <p className="mt-2 text-sm text-slate-400 light:text-[#2C1810]/55 max-w-xs mx-auto leading-relaxed">
            Find academic citations for every factual claim in your writing
          </p>
        </div>

        {/* ── 2. Step cards ── */}
        <div className="w-full grid grid-cols-1 sm:grid-cols-5 gap-3">
          {STEPS.map((step) => (
            <div
              key={step.label}
              className="flex flex-col gap-2.5 rounded-xl border border-[#252525] light:border-[#2C1810]/10 bg-[#111111] light:bg-[#F8F6EA]/80 px-4 py-4"
            >
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-amber-500/30 light:border-amber-600/20 bg-amber-500/10 light:bg-amber-500/[0.08] text-amber-400 light:text-amber-700">
                  <step.Icon />
                </div>
                <p className="text-[12px] font-semibold text-slate-100 light:text-[#2C1810] leading-none">
                  {step.label}
                </p>
              </div>
              <p className="text-[11.5px] leading-relaxed text-slate-400 light:text-[#2C1810]/58">
                {step.desc}
              </p>
            </div>
          ))}
        </div>

        {/* ── 3. Sign-in buttons + form ── */}
        <div className="w-full max-w-sm flex flex-col gap-3">

          {/* error banner */}
          {error && (
            <div className="rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2.5 text-xs text-red-400 leading-relaxed">
              {error}
              {error.includes("create one") && (
                <> <Link href={registerHref} className="underline underline-offset-2 hover:text-red-300">Create an account</Link></>
              )}
            </div>
          )}

          {/* Google */}
          <button
            type="button"
            onClick={() => signIn("google", { callbackUrl })}
            className="flex w-full items-center justify-center gap-3 rounded-lg border border-[#333] light:border-[#2C1810]/15 bg-[#1a1a1a] light:bg-white/60 px-4 py-2.5 text-sm font-medium text-slate-200 light:text-[#2C1810] transition hover:border-[#444] light:hover:border-[#2C1810]/25 hover:bg-[#222] light:hover:bg-white/80 active:scale-[0.98]"
          >
            <GoogleLogo />
            Continue with Google
          </button>

          {/* email toggle */}
          <button
            type="button"
            onClick={() => setShowEmail((v) => !v)}
            className="w-full rounded-lg border border-[#2a2a2a] light:border-[#2C1810]/12 bg-transparent px-4 py-2.5 text-sm font-medium text-slate-400 light:text-[#2C1810]/60 transition hover:border-[#383838] light:hover:border-[#2C1810]/20 hover:text-slate-300 light:hover:text-[#2C1810]/80 active:scale-[0.98]"
          >
            {showEmail ? "Hide email sign-in" : "Sign in with email"}
          </button>

          {/* collapsible email / password form */}
          {showEmail && (
            <form onSubmit={handleCredentials} className="flex flex-col gap-3">
              <div>
                <label htmlFor="email" className="mb-1 block text-xs font-medium text-slate-400 light:text-[#2C1810]/60">
                  Email
                </label>
                <input
                  id="email" type="email" autoComplete="email" required
                  value={email} onChange={(e) => { setEmail(e.target.value); setError(""); }}
                  className="w-full rounded-lg border border-[#2a2a2a] light:border-[#2C1810]/15 bg-[#1a1a1a] light:bg-white/50 px-3 py-2 text-sm text-slate-100 light:text-[#2C1810] placeholder-slate-600 light:placeholder-[#2C1810]/30 outline-none transition focus:border-amber-500/50 light:focus:border-amber-600/40 focus:ring-1 focus:ring-amber-500/25 light:focus:ring-amber-600/20"
                  placeholder="you@example.com"
                />
              </div>
              <div>
                <label htmlFor="password" className="mb-1 block text-xs font-medium text-slate-400 light:text-[#2C1810]/60">
                  Password
                </label>
                <input
                  id="password" type="password" autoComplete="current-password" required
                  value={password} onChange={(e) => { setPassword(e.target.value); setError(""); }}
                  className="w-full rounded-lg border border-[#2a2a2a] light:border-[#2C1810]/15 bg-[#1a1a1a] light:bg-white/50 px-3 py-2 text-sm text-slate-100 light:text-[#2C1810] placeholder-slate-600 light:placeholder-[#2C1810]/30 outline-none transition focus:border-amber-500/50 light:focus:border-amber-600/40 focus:ring-1 focus:ring-amber-500/25 light:focus:ring-amber-600/20"
                  placeholder="••••••••"
                />
              </div>
              <button
                type="submit" disabled={loading}
                className="w-full rounded-lg bg-amber-500 light:bg-amber-600 px-4 py-2.5 text-sm font-semibold text-slate-900 light:text-white transition hover:bg-amber-400 light:hover:bg-amber-500 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Signing in…" : "Sign in"}
              </button>
              <p className="text-center text-xs text-slate-500 light:text-[#2C1810]/50">
                Don&apos;t have an account?{" "}
                <Link href={registerHref} className="font-medium text-amber-400 light:text-amber-700 transition-colors hover:text-amber-300 light:hover:text-amber-600">
                  Create one
                </Link>
              </p>
            </form>
          )}

          {/* divider */}
          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-[#222] light:bg-[#2C1810]/10" />
            <span className="text-[11px] uppercase tracking-widest text-slate-600 light:text-[#2C1810]/35">or</span>
            <div className="h-px flex-1 bg-[#222] light:bg-[#2C1810]/10" />
          </div>

          {/* Continue as Guest */}
          <Link
            href={callbackUrl}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-[#2a2a2a] light:border-[#2C1810]/10 bg-transparent px-4 py-2.5 text-sm font-medium text-slate-400 light:text-[#2C1810]/60 transition hover:border-[#383838] light:hover:border-[#2C1810]/20 hover:text-slate-300 light:hover:text-[#2C1810]/80 active:scale-[0.98]"
          >
            Continue as Guest
          </Link>

          {/* How to use — scrolls to top where the step cards are */}
          <div className="flex justify-center">
            <button
              type="button"
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
              className="flex items-center gap-1.5 text-xs text-slate-500 light:text-[#6B4226] hover:text-slate-300 light:hover:text-[#2C1810] transition-colors"
            >
              <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM8.94 6.94a.75.75 0 11-1.061-1.061 3 3 0 112.871 5.026v.345a.75.75 0 01-1.5 0v-.5c0-.72.57-1.172 1.081-1.287A1.5 1.5 0 108.94 6.94zM10 15a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
              </svg>
              How to use
            </button>
          </div>
        </div>

        {/* ── 4. Differentiator callout ── */}
        <div className="w-full max-w-sm rounded-xl border border-amber-500/20 light:border-amber-600/18 bg-amber-500/[0.06] light:bg-amber-600/[0.06] px-4 py-3">
          <p className="text-[11.5px] leading-relaxed text-slate-300 light:text-[#2C1810]/68">
            <span className="font-semibold text-amber-400 light:text-amber-700">
              What makes Reference Finder different:{" "}
            </span>
            Omakase Mode auto-rewrites your paragraph with proper in-text citations in any style,
            and every paper is matched claim-by-claim — not by keyword.
          </p>
        </div>

        <p className="text-[11px] text-slate-600 light:text-[#2C1810]/30">
          Free to try · No card required
        </p>

      </div>
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SignInForm />
    </Suspense>
  );
}
