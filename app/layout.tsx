import type { Metadata } from "next";
import { DM_Sans, Playfair_Display } from "next/font/google";
import Link from "next/link";
import Providers from "./providers";
import "./globals.css";

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  weight: ["700", "800"],
});

const BASE_URL = "https://claim-citation-matcher.vercel.app";
const TITLE = "Reference Finder — AI-Powered Academic Citation Tool | Real Papers, Not Hallucinated";
const DESCRIPTION =
  "Paste any academic paragraph and instantly find real, verified research papers for every claim. AI-powered claim extraction, relevance ranking, journal quality stats, and Omakase mode. Free to use, Pro from $2.99/month.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  metadataBase: new URL(BASE_URL),
  verification: {
    google: "v4GUZl9aYCoCzR09ubk-5o5et9cBEbbqgz4cG8Z4A8I",
  },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: BASE_URL,
    siteName: "Reference Finder",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
  },
  alternates: {
    canonical: BASE_URL,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${dmSans.variable} ${playfair.variable} font-[family-name:var(--font-dm-sans)] antialiased`}
      >
        <Providers>
          {children}
          <footer className="border-t border-white/[0.05] light:border-[rgba(80,50,20,0.08)] py-4 px-6 text-center">
            <Link
              href="/legal"
              className="text-[11px] text-slate-600 light:text-[#A67856] transition-colors hover:text-slate-400 light:hover:text-[#6B3A22]"
            >
              特定商取引法に基づく表記 / Commercial Disclosure
            </Link>
          </footer>
        </Providers>
      </body>
    </html>
  );
}
