"use client";

import { useState, useEffect, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";

// Maps NextAuth error codes (URL ?error= param or result.error) to UI copy.
// EmailNotFound / GoogleOnly / WrongPassword come from our custom CredentialsSignin
// subclasses in auth.ts.
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

// ── Inline Lucide-style icons ──────────────────────────────────────────────────

function FileTextIcon({ className }: { className?: string }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.75" strokeLinecap="round"
      strokeLinejoin="round" className={className} aria-hidden>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <polyline points="10 9 9 9 8 9" />
    </svg>
  );
}

function BrainIcon({ className }: { className?: string }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.75" strokeLinecap="round"
      strokeLinejoin="round" className={className} aria-hidden>
      <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96-.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 1.44-4.66z" />
      <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96-.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.44-4.66z" />
    </svg>
  );
}

function DatabaseIcon({ className }: { className?: string }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.75" strokeLinecap="round"
      strokeLinejoin="round" className={className} aria-hidden>
      <ellipse cx="12" cy="5" rx="9" ry="3" />
      <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
      <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
    </svg>
  );
}

function BarChartIcon({ className }: { className?: string }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.75" strokeLinecap="round"
      strokeLinejoin="round" className={className} aria-hidden>
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  );
}

function QuoteIcon({ className }: { className?: string }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.75" strokeLinecap="round"
      strokeLinejoin="round" className={className} aria-hidden>
      <path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 2v7c0 1.25.75 2 2 2h3c1.25 0 2 .75 2 2" />
      <path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 2v7c0 1.25.75 2 2 2h3c1.25 0 2 .75 2 2" />
    </svg>
  );
}

function BookIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#f59e0b"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
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

// ── How-it-works steps ─────────────────────────────────────────────────────────

type Step = {
  Icon: React.ComponentType<{ className?: string }>;
  label: string;
  desc: string;
};

const STEPS: Step[] = [
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
];

function HowItWorks() {
  return (
    <div className="mt-6 w-full max-w-sm">
      {/* section heading */}
      <p className="mb-4 text-center text-[11px] uppercase tracking-[0.14em] text-slate-400 light:text-[#2C1810]/45 font-medium">
        How it works
      </p>

      {/* steps */}
      <div className="rounded-xl border border-[#2a2a2a] light:border-[#2C1810]/10 bg-[#111111] light:bg-[#F8F6EA]/70 px-5 py-4">
        {STEPS.map((step, i) => (
          <div key={step.label} className="flex gap-3.5">
            {/* icon + connector */}
            <div className="flex flex-col items-center">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-amber-500/[0.12] light:bg-amber-500/10 border border-amber-500/30 light:border-amber-600/20 text-amber-400 light:text-amber-700">
                <step.Icon />
              </div>
              {i < STEPS.length - 1 && (
                <div className="my-1 w-px flex-1 bg-[#2a2a2a] light:bg-[#2C1810]/10" style={{ minHeight: "14px" }} />
              )}
            </div>

            {/* text */}
            <div className={i < STEPS.length - 1 ? "pb-4" : ""}>
              <p className="text-[12px] font-semibold text-slate-100 light:text-[#2C1810] leading-none mb-1">
                {step.label}
              </p>
              <p className="text-[12px] text-slate-400 light:text-[#2C1810]/60 leading-relaxed">
                {step.desc}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* callout */}
      <div className="mt-3 rounded-xl border border-amber-500/25 light:border-amber-600/20 bg-amber-500/[0.07] light:bg-amber-500/[0.07] px-4 py-3">
        <p className="text-[12px] leading-relaxed text-slate-300 light:text-[#2C1810]/70">
          <span className="font-semibold text-amber-400 light:text-amber-700">
            What makes Reference Finder different:{" "}
          </span>
          Omakase Mode auto-rewrites your paragraph with proper in-text citations
          in any style, and every paper is matched claim-by-claim — not by keyword.
        </p>
      </div>

      <p className="mt-5 mb-1 text-center text-[11px] text-slate-600 light:text-[#2C1810]/30">
        Free to try · No card required
      </p>
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────

function SignInForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/";

  // NextAuth sets ?error= on redirect back to the sign-in page (e.g. OAuth errors).
  const urlError = searchParams.get("error");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>(() => errorMessage(urlError));

  // Clear form error while the user is actively editing fields.
  useEffect(() => {
    setError("");
  }, [email, password]);

  async function handleCredentials(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
      callbackUrl,
    });

    setLoading(false);

    if (result?.error) {
      // result.error carries the CredentialsSignin subclass `code` value.
      setError(errorMessage(result.error));
    } else if (result?.url) {
      router.push(result.url);
    }
  }

  const registerHref =
    `/register` +
    (callbackUrl !== "/" ? `?callbackUrl=${encodeURIComponent(callbackUrl)}` : "");

  return (
    <div className="min-h-screen flex flex-col items-center justify-start px-4 pt-10 pb-16 bg-[#0a0a0a] light:bg-[#EDEDD3]">
      <div className="w-full max-w-sm rounded-xl border border-slate-700/50 light:border-[#2C1810]/12 bg-slate-900/80 light:bg-[#F8F6EA] px-8 py-9 shadow-2xl light:shadow-[0_4px_24px_rgba(44,24,16,0.10)]">

        {/* header */}
        <div className="mb-7 text-center">
          <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full border border-amber-500/30 bg-amber-500/15">
            <BookIcon />
          </div>
          <h1 className="text-lg font-semibold text-slate-100 light:text-[#2C1810]">
            Sign in to Reference Finder
          </h1>
          <p className="mt-1 text-xs text-slate-500 light:text-[#2C1810]/50">
            Find citations for any academic claim
          </p>
        </div>

        {/* error banner */}
        {error && (
          <div className="mb-4 rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2.5 text-xs text-red-400 leading-relaxed">
            {error}
            {/* Offer register link when email doesn't exist */}
            {error.includes("create one") && (
              <>
                {" "}
                <Link href={registerHref} className="underline underline-offset-2 hover:text-red-300">
                  Create an account
                </Link>
              </>
            )}
          </div>
        )}

        {/* Google */}
        <button
          type="button"
          onClick={() => signIn("google", { callbackUrl })}
          className="flex w-full items-center justify-center gap-3 rounded-lg border border-slate-600/60 light:border-[#2C1810]/15 bg-slate-800/60 light:bg-white/60 px-4 py-2.5 text-sm font-medium text-slate-200 light:text-[#2C1810] transition hover:border-slate-500/80 light:hover:border-[#2C1810]/25 hover:bg-slate-800 light:hover:bg-white/80 active:scale-[0.98]"
        >
          <GoogleLogo />
          Continue with Google
        </button>

        {/* divider */}
        <div className="my-5 flex items-center gap-3">
          <div className="h-px flex-1 bg-slate-700/60 light:bg-[#2C1810]/10" />
          <span className="text-[11px] uppercase tracking-widest text-slate-500 light:text-[#2C1810]/35">or</span>
          <div className="h-px flex-1 bg-slate-700/60 light:bg-[#2C1810]/10" />
        </div>

        {/* email / password form */}
        <form onSubmit={handleCredentials} className="space-y-3">
          <div>
            <label
              htmlFor="email"
              className="mb-1 block text-xs font-medium text-slate-400 light:text-[#2C1810]/60"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-slate-600/60 light:border-[#2C1810]/15 bg-slate-800/60 light:bg-white/50 px-3 py-2 text-sm text-slate-100 light:text-[#2C1810] placeholder-slate-500 light:placeholder-[#2C1810]/30 outline-none transition focus:border-amber-500/50 light:focus:border-amber-600/40 focus:ring-1 focus:ring-amber-500/30 light:focus:ring-amber-600/20"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="mb-1 block text-xs font-medium text-slate-400 light:text-[#2C1810]/60"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-slate-600/60 light:border-[#2C1810]/15 bg-slate-800/60 light:bg-white/50 px-3 py-2 text-sm text-slate-100 light:text-[#2C1810] placeholder-slate-500 light:placeholder-[#2C1810]/30 outline-none transition focus:border-amber-500/50 light:focus:border-amber-600/40 focus:ring-1 focus:ring-amber-500/30 light:focus:ring-amber-600/20"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-1 w-full rounded-lg bg-amber-500 light:bg-amber-600 px-4 py-2.5 text-sm font-semibold text-slate-900 light:text-white transition hover:bg-amber-400 light:hover:bg-amber-500 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>

        {/* register link */}
        <p className="mt-5 text-center text-xs text-slate-500 light:text-[#2C1810]/50">
          Don&apos;t have an account?{" "}
          <Link
            href={registerHref}
            className="font-medium text-amber-400 light:text-amber-700 transition-colors hover:text-amber-300 light:hover:text-amber-600"
          >
            Create one
          </Link>
        </p>
      </div>

      {/* how-it-works explainer */}
      <HowItWorks />
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
