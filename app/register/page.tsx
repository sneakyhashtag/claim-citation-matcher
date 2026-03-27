"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";

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

export default function RegisterPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/";

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // true when the server said the email already exists
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
      const msg = data.error ?? "Registration failed. Please try again.";
      setError(msg);
      // 409 = duplicate email
      if (res.status === 409) setEmailTaken(true);
      return;
    }

    // Account created — sign in automatically with the new credentials.
    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
      callbackUrl,
    });

    setLoading(false);
    if (result?.error) {
      // Shouldn't normally happen right after registration.
      router.push(signInHref);
    } else if (result?.url) {
      router.push(result.url);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#080a12] px-4">
      <div className="w-full max-w-sm rounded-xl border border-slate-700/50 bg-slate-900/80 px-8 py-9 shadow-2xl">

        {/* header */}
        <div className="mb-7 text-center">
          <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full border border-amber-500/30 bg-amber-500/15">
            <BookIcon />
          </div>
          <h1 className="text-lg font-semibold text-slate-100">Create an account</h1>
          <p className="mt-1 text-xs text-slate-500">Free · 3 searches per day</p>
        </div>

        {/* error banner */}
        {error && (
          <div className="mb-4 rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2.5 text-xs text-red-400 leading-relaxed">
            {error}
            {emailTaken && (
              <>
                {" "}
                <Link
                  href={signInHref}
                  className="underline underline-offset-2 hover:text-red-300"
                >
                  Sign in instead
                </Link>
              </>
            )}
          </div>
        )}

        {/* form */}
        <form onSubmit={handleRegister} className="space-y-3">
          <div>
            <label htmlFor="name" className="mb-1 block text-xs font-medium text-slate-400">
              Name
            </label>
            <input
              id="name"
              type="text"
              autoComplete="name"
              required
              value={name}
              onChange={(e) => { setName(e.target.value); setError(null); }}
              className="w-full rounded-lg border border-slate-600/60 bg-slate-800/60 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 outline-none transition focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/30"
              placeholder="Your name"
            />
          </div>

          <div>
            <label htmlFor="email" className="mb-1 block text-xs font-medium text-slate-400">
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => { setEmail(e.target.value); setError(null); setEmailTaken(false); }}
              className="w-full rounded-lg border border-slate-600/60 bg-slate-800/60 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 outline-none transition focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/30"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="mb-1 block text-xs font-medium text-slate-400">
              Password{" "}
              <span className="text-slate-600">(min. 8 characters)</span>
            </label>
            <input
              id="password"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(null); }}
              className="w-full rounded-lg border border-slate-600/60 bg-slate-800/60 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 outline-none transition focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/30"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-1 w-full rounded-lg bg-amber-500 px-4 py-2.5 text-sm font-semibold text-slate-900 transition hover:bg-amber-400 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Creating account…" : "Create account"}
          </button>
        </form>

        {/* divider */}
        <div className="my-4 flex items-center gap-3">
          <div className="h-px flex-1 bg-slate-700/60" />
          <span className="text-[11px] uppercase tracking-widest text-slate-500">or</span>
          <div className="h-px flex-1 bg-slate-700/60" />
        </div>

        {/* Google sign-up */}
        <button
          type="button"
          onClick={() => signIn("google", { callbackUrl })}
          className="flex w-full items-center justify-center gap-3 rounded-lg border border-slate-600/60 bg-slate-800/60 px-4 py-2.5 text-sm font-medium text-slate-200 transition hover:border-slate-500/80 hover:bg-slate-800 active:scale-[0.98]"
        >
          <GoogleLogo />
          Sign up with Google
        </button>

        <p className="mt-5 text-center text-xs text-slate-500">
          Already have an account?{" "}
          <Link
            href={signInHref}
            className="font-medium text-amber-400 transition-colors hover:text-amber-300"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
