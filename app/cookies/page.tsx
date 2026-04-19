import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Cookie Policy | Reference Finder",
  description: "Cookie Policy for Reference Finder.",
};

const BackArrow = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M19 12H5M12 5l-7 7 7 7" />
  </svg>
);

export default function CookiesPage() {
  return (
    <div className="min-h-screen bg-[var(--page-bg)] px-4 py-14 sm:px-6">
      <div className="mx-auto max-w-2xl">

        <Link href="/" className="mb-10 inline-flex items-center gap-1.5 text-xs text-slate-500 light:text-[#A67856] transition-colors hover:text-slate-300 light:hover:text-[#6B3A22]">
          <BackArrow /> Reference Finder
        </Link>

        <div className="mb-8 border-b border-white/[0.07] light:border-[rgba(80,50,20,0.10)] pb-6">
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-amber-500/70 light:text-amber-800/60">Legal</p>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-100 light:text-[#2C1810]">Cookie Policy</h1>
          <p className="mt-1 text-sm text-slate-400 light:text-[#7A5C44]">Last updated: April 12, 2026</p>
        </div>

        {/* Intro */}
        <div className="mb-6 rounded-xl border border-white/[0.08] light:border-[rgba(80,50,20,0.14)] bg-white/[0.025] light:bg-[rgba(248,246,234,0.7)] px-6 py-5">
          <P>This Cookie Policy explains how <strong className="text-slate-200 light:text-[#2C1810]">Reference Finder</strong> (&ldquo;we,&rdquo; &ldquo;us,&rdquo; or &ldquo;our&rdquo;) uses cookies and similar technologies when you visit <a href="https://claim-citation-matcher.vercel.app" className="text-amber-400 light:text-amber-700 underline underline-offset-2 hover:opacity-80">claim-citation-matcher.vercel.app</a>. It explains what these technologies are, why we use them, and your rights to control them.</P>
        </div>

        <div className="rounded-xl border border-white/[0.08] light:border-[rgba(80,50,20,0.14)] overflow-hidden bg-white/[0.025] light:bg-[rgba(248,246,234,0.7)]">

          <SectionItem n="1" title="What Are Cookies?">
            <P>Cookies are small data files placed on your device when you visit a website. <strong className="text-slate-300 light:text-[#3D2214]">First-party cookies</strong> are set by us. <strong className="text-slate-300 light:text-[#3D2214]">Third-party cookies</strong> are set by third parties and may track your activity across websites.</P>
          </SectionItem>

          <SectionItem n="2" title="Why Do We Use Cookies?">
            <P>We use cookies to:</P>
            <List items={[
              "Keep you signed in and maintain your session securely",
              "Remember your preferences (theme: dark or light, display language)",
              "Understand how the site is used so we can improve it (analytics)",
              "Prevent abuse and enforce rate limits",
            ]} />
          </SectionItem>

          <SectionItem n="3" title="Cookies We Use">
            <div className="mt-2 space-y-4">
              <CookieEntry
                name="Session / auth cookies"
                purpose="Maintains your signed-in session via NextAuth."
                type="HTTP cookie"
                expires="Session / 30 days"
              />
              <CookieEntry
                name="rf_theme"
                purpose="Stores your preferred colour scheme (dark or light)."
                type="localStorage"
                expires="Persistent"
              />
              <CookieEntry
                name="rf_lang"
                purpose="Stores your preferred display language."
                type="localStorage"
                expires="Persistent"
              />
              <CookieEntry
                name="_rf_pro"
                purpose="Signed cookie confirming active Pro subscription status."
                type="HTTP cookie (httpOnly)"
                expires="31 days"
              />
              <CookieEntry
                name="_rf_usage"
                purpose="Tracks daily search count for the free usage limit."
                type="HTTP cookie (httpOnly)"
                expires="24 hours"
              />
            </div>
          </SectionItem>

          <SectionItem n="4" title="How Can I Control Cookies?">
            <P>You can control and delete cookies through your browser settings. Disabling cookies may affect certain features such as staying signed in. Useful links:</P>
            <List items={[
              "Chrome: Settings → Privacy and security → Cookies",
              "Firefox: Settings → Privacy & Security → Cookies and Site Data",
              "Safari: Preferences → Privacy → Cookies and website data",
              "Edge: Settings → Cookies and site permissions",
            ]} />
          </SectionItem>

          <SectionItem n="5" title="Other Tracking Technologies">
            <P>We may use web beacons or similar technologies in emails to determine whether they have been opened. These are typically reliant on cookies and can be blocked by disabling images in your email client or rejecting cookies.</P>
          </SectionItem>

          <SectionItem n="6" title="Do We Serve Targeted Advertising?">
            <P>No. We do not serve targeted advertising and do not use cookies for advertising purposes. We do not share your data with advertising networks.</P>
          </SectionItem>

          <SectionItem n="7" title="Updates to This Policy">
            <P>We may update this Cookie Policy from time to time to reflect changes in the cookies we use or for regulatory reasons. The &ldquo;Last updated&rdquo; date at the top of this page indicates when it was last revised.</P>
          </SectionItem>

          <SectionItem n="8" title="Contact" last>
            <P>If you have questions about our use of cookies, please contact:</P>
            <div className="mt-3 space-y-0.5">
              <p className="text-sm text-slate-200 light:text-[#2C1810] font-medium">Sai Nay Aung Linn</p>
              <p className="text-sm text-slate-400 light:text-[#7A5C44]">Address: Disclosed promptly upon request</p>
              <a href="mailto:sainayaunglinn@gmail.com" className="text-sm text-amber-400 light:text-amber-700 underline underline-offset-2 hover:opacity-80 transition-opacity block">sainayaunglinn@gmail.com</a>
            </div>
          </SectionItem>

        </div>

        <p className="mt-8 text-center text-[11px] text-slate-600 light:text-[#B08060]">
          &copy; {new Date().getFullYear()} Sai Nay Aung Linn. All rights reserved.
        </p>
      </div>
    </div>
  );
}

// ── Layout helpers ─────────────────────────────────────────────────────────────

function SectionItem({ n, title, children, last }: { n: string; title: string; children: React.ReactNode; last?: boolean }) {
  return (
    <div className={`px-6 py-5${last ? "" : " border-b border-white/[0.06] light:border-[rgba(80,50,20,0.09)]"}`}>
      <h2 className="mb-3 text-sm font-semibold text-slate-100 light:text-[#2C1810]">
        {n}. {title}
      </h2>
      {children}
    </div>
  );
}

function P({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <p className={`text-sm leading-relaxed text-slate-400 light:text-[#7A5C44] ${className}`}>{children}</p>;
}

function List({ items }: { items: string[] }) {
  return (
    <ul className="mt-2 space-y-1.5 pl-1">
      {items.map((item) => (
        <li key={item} className="flex items-start gap-2 text-sm text-slate-400 light:text-[#7A5C44]">
          <span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-amber-500/50" aria-hidden />
          {item}
        </li>
      ))}
    </ul>
  );
}

function CookieEntry({ name, purpose, type, expires }: { name: string; purpose: string; type: string; expires: string }) {
  return (
    <div className="rounded-lg border border-white/[0.05] light:border-[rgba(80,50,20,0.09)] bg-white/[0.02] light:bg-[rgba(44,24,16,0.03)] px-4 py-3">
      <p className="text-[12px] font-semibold text-slate-200 light:text-[#2C1810] font-mono mb-1">{name}</p>
      <p className="text-sm text-slate-400 light:text-[#7A5C44] mb-2">{purpose}</p>
      <div className="flex flex-wrap gap-3 text-[11px] text-slate-500 light:text-[#9B7055]">
        <span><span className="uppercase tracking-wide opacity-60">Type</span> · {type}</span>
        <span><span className="uppercase tracking-wide opacity-60">Expires</span> · {expires}</span>
      </div>
    </div>
  );
}
