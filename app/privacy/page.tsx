import Link from "next/link";
import type { Metadata } from "next";
import { termlyStyles } from "@/lib/termly-styles";
import { privacyHtml } from "./content";

export const metadata: Metadata = {
  title: "Privacy Policy | Reference Finder",
  description: "Privacy Policy for Reference Finder.",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[var(--page-bg)] px-4 py-14 sm:px-6">
      <style dangerouslySetInnerHTML={{ __html: termlyStyles }} />
      <div className="mx-auto max-w-4xl">

        {/* Back link */}
        <Link
          href="/"
          className="mb-10 inline-flex items-center gap-1.5 text-xs text-slate-500 light:text-[#A67856] transition-colors hover:text-slate-300 light:hover:text-[#6B3A22]"
        >
          <svg
            width="13"
            height="13"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            <path d="M19 12H5M12 5l-7 7 7 7" />
          </svg>
          Reference Finder
        </Link>

        {/* Termly content */}
        <div className="termly-content rounded-xl border border-black/[0.08] bg-white px-8 py-10 sm:px-10">
          <div dangerouslySetInnerHTML={{ __html: privacyHtml }} />
        </div>

        {/* Footer note */}
        <p className="mt-8 text-center text-[11px] text-slate-600 light:text-[#B08060]">
          &copy; {new Date().getFullYear()} Sai Nay Aung Linn. All rights reserved.
        </p>
      </div>
    </div>
  );
}
