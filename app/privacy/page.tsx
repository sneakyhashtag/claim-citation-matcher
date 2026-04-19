import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy | Reference Finder",
  description: "Privacy Policy for Reference Finder.",
};

const BackArrow = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M19 12H5M12 5l-7 7 7 7" />
  </svg>
);

const Dot = () => (
  <span className="mt-[5px] h-1 w-1 shrink-0 rounded-full bg-amber-500/50 inline-block" aria-hidden />
);

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[var(--page-bg)] px-4 py-14 sm:px-6">
      <div className="mx-auto max-w-2xl">

        <Link href="/" className="mb-10 inline-flex items-center gap-1.5 text-xs text-slate-500 light:text-[#A67856] transition-colors hover:text-slate-300 light:hover:text-[#6B3A22]">
          <BackArrow /> Reference Finder
        </Link>

        <div className="mb-8 border-b border-white/[0.07] light:border-[rgba(80,50,20,0.10)] pb-6">
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-amber-500/70 light:text-amber-800/60">Legal</p>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-100 light:text-[#2C1810]">Privacy Policy</h1>
          <p className="mt-1 text-sm text-slate-400 light:text-[#7A5C44]">Last updated: April 12, 2026</p>
        </div>

        {/* Intro */}
        <Section>
          <P>This Privacy Policy for <strong>Sai Nay Aung Linn</strong> (&ldquo;we,&rdquo; &ldquo;us,&rdquo; or &ldquo;our&rdquo;) describes how and why we might access, collect, store, use, and/or share (&ldquo;process&rdquo;) your personal information when you use our services (&ldquo;Services&rdquo;), including when you visit our website at <a href="https://claim-citation-matcher.vercel.app" className="text-amber-400 light:text-amber-700 underline underline-offset-2 hover:opacity-80 transition-opacity">claim-citation-matcher.vercel.app</a> or use Reference Finder.</P>
          <P>Questions or concerns? Reading this Privacy Policy will help you understand your privacy rights and choices. If you do not agree with our policies and practices, please do not use our Services.</P>
        </Section>

        <div className="rounded-xl border border-white/[0.08] light:border-[rgba(80,50,20,0.14)] overflow-hidden bg-white/[0.025] light:bg-[rgba(248,246,234,0.7)]">

          <SectionItem n="1" title="What Information Do We Collect?">
            <P>We collect personal information that you voluntarily provide when you register on the Services or contact us. This may include:</P>
            <List items={["Names", "Email addresses", "Passwords", "Billing addresses", "Debit/credit card numbers (handled by Stripe — we do not store raw card data)"]} />
            <P className="mt-3">We also automatically collect certain technical information when you visit our site, including IP address, browser type, device characteristics, operating system, language preferences, and usage data (pages viewed, timestamps, feature interactions).</P>
            <P>We do not process sensitive personal information. All payment data is handled by Stripe. You can review their privacy policy at <a href="https://stripe.com/privacy" className="text-amber-400 light:text-amber-700 underline underline-offset-2 hover:opacity-80">stripe.com/privacy</a>.</P>
          </SectionItem>

          <SectionItem n="2" title="How Do We Process Your Information?">
            <P>We process your personal information for the following reasons:</P>
            <List items={[
              "To create and manage your account",
              "To deliver the Services you request",
              "To respond to your inquiries and provide support",
              "To fulfill and manage payments and subscriptions",
              "To maintain the security and operation of the Services",
              "To comply with legal obligations",
            ]} />
          </SectionItem>

          <SectionItem n="3" title="What Legal Bases Do We Rely On?">
            <P>We only process your personal information when we have a valid legal reason to do so:</P>
            <List items={[
              "Consent — when you have given us permission for a specific purpose",
              "Performance of a contract — to fulfil our obligations to you",
              "Legal obligations — to comply with applicable law",
              "Vital interests — to protect your safety or that of others",
            ]} />
            <P className="mt-3">If you are located in the EU, UK, or Canada, you may withdraw consent at any time by contacting us. Withdrawal does not affect the lawfulness of processing that occurred before withdrawal.</P>
          </SectionItem>

          <SectionItem n="4" title="When and With Whom Do We Share Your Information?">
            <P>We do not sell or share your personal information for advertising purposes. We may share information in these limited situations:</P>
            <List items={[
              "With service providers (Anthropic, OpenAlex, Semantic Scholar, Stripe, Neon, Vercel) under written agreements, solely to provide the Services",
              "In connection with a merger, acquisition, or sale of assets — you will be notified in advance",
              "When required by law or to protect rights",
            ]} />
          </SectionItem>

          <SectionItem n="5" title="Third-Party Websites">
            <P>The Services may contain links to third-party websites. We are not responsible for the safety or privacy practices of those sites. We recommend reviewing their privacy policies independently.</P>
          </SectionItem>

          <SectionItem n="6" title="Cookies and Tracking Technologies">
            <P>We use cookies and similar technologies to maintain security, save your preferences (theme, language), and collect basic usage analytics. You can control cookies through your browser settings. See our <Link href="/cookies" className="text-amber-400 light:text-amber-700 underline underline-offset-2 hover:opacity-80">Cookie Policy</Link> for details.</P>
          </SectionItem>

          <SectionItem n="7" title="AI-Based Products">
            <P>Reference Finder uses AI provided by Anthropic to extract claims and suggest citations. Your input text is processed by Anthropic&rsquo;s API in accordance with their <a href="https://www.anthropic.com/legal/privacy" className="text-amber-400 light:text-amber-700 underline underline-offset-2 hover:opacity-80">privacy policy</a>. We use your input solely to provide the Services.</P>
          </SectionItem>

          <SectionItem n="8" title="Social Logins">
            <P>You may register or sign in using your Google account. When you do, we receive your name and email address from Google. We use this information only to create and manage your account. See <a href="https://policies.google.com/privacy" className="text-amber-400 light:text-amber-700 underline underline-offset-2 hover:opacity-80">Google&rsquo;s privacy policy</a> for details on how they handle your data.</P>
          </SectionItem>

          <SectionItem n="9" title="How Long Do We Keep Your Information?">
            <P>We retain your personal information for as long as your account is active or as required by law. When your account is deleted and we have no further legitimate need to process your information, we will delete or anonymise it.</P>
          </SectionItem>

          <SectionItem n="10" title="How Do We Keep Your Information Safe?">
            <P>We implement appropriate technical and organisational security measures to protect your data, including HTTPS, bcrypt password hashing, signed cookies, and rate limiting. However, no transmission over the internet can be guaranteed 100% secure. You access the Services at your own risk.</P>
          </SectionItem>

          <SectionItem n="11" title="Do We Collect Information from Minors?">
            <P>We do not knowingly collect data from or market to children under 18. By using the Services, you confirm you are at least 18 years old. If you believe we have inadvertently collected data from a minor, please contact us at <a href="mailto:sainayaunglinn@gmail.com" className="text-amber-400 light:text-amber-700 underline underline-offset-2 hover:opacity-80">sainayaunglinn@gmail.com</a> and we will promptly delete it.</P>
          </SectionItem>

          <SectionItem n="12" title="What Are Your Privacy Rights?">
            <P>Depending on your location (EEA, UK, Switzerland, Canada, or certain US states), you may have the right to:</P>
            <List items={[
              "Access and obtain a copy of your personal information",
              "Request correction of inaccurate data",
              "Request deletion of your personal information",
              "Restrict or object to processing",
              "Data portability",
              "Withdraw consent at any time",
            ]} />
            <P className="mt-3">To exercise these rights, contact us at <a href="mailto:sainayaunglinn@gmail.com" className="text-amber-400 light:text-amber-700 underline underline-offset-2 hover:opacity-80">sainayaunglinn@gmail.com</a>. We will respond in accordance with applicable data protection law. You may also log into your account settings to review or delete your information directly.</P>
          </SectionItem>

          <SectionItem n="13" title="Do-Not-Track Features">
            <P>Most browsers include a Do-Not-Track (&ldquo;DNT&rdquo;) setting. We do not currently respond to DNT signals because no uniform technical standard has been adopted. If a standard is established that we are required to follow, we will update this policy accordingly.</P>
          </SectionItem>

          <SectionItem n="14" title="US Residents — Specific Privacy Rights">
            <P>If you are a resident of California, Colorado, Connecticut, Texas, Virginia, or other states with applicable privacy laws, you may have additional rights including:</P>
            <List items={[
              "Right to know what personal data we process",
              "Right to access, correct, or delete your personal data",
              "Right to opt out of the sale or sharing of personal data",
              "Right to non-discrimination for exercising your rights",
            ]} />
            <P className="mt-3">We do not sell or share personal information with third parties for advertising purposes. To submit a request, email us at <a href="mailto:sainayaunglinn@gmail.com" className="text-amber-400 light:text-amber-700 underline underline-offset-2 hover:opacity-80">sainayaunglinn@gmail.com</a>.</P>
          </SectionItem>

          <SectionItem n="15" title="Updates to This Policy">
            <P>We may update this Privacy Policy from time to time. Material changes will be communicated via the Service or by email. The &ldquo;Last updated&rdquo; date at the top indicates when it was last revised. We encourage you to review this policy periodically.</P>
          </SectionItem>

          <SectionItem n="16" title="Contact">
            <P>If you have questions about this Privacy Policy, please contact:</P>
            <div className="mt-3 space-y-0.5">
              <p className="text-sm text-slate-200 light:text-[#2C1810] font-medium">Sai Nay Aung Linn</p>
              <p className="text-sm text-slate-400 light:text-[#7A5C44]">Address: Disclosed promptly upon request</p>
              <a href="mailto:sainayaunglinn@gmail.com" className="text-sm text-amber-400 light:text-amber-700 underline underline-offset-2 hover:opacity-80 transition-opacity block">sainayaunglinn@gmail.com</a>
            </div>
          </SectionItem>

          <SectionItem n="17" title="Review, Update, or Delete Your Data" last>
            <P>You may review, update, or request deletion of your personal data at any time by logging into your account settings or by contacting us at <a href="mailto:sainayaunglinn@gmail.com" className="text-amber-400 light:text-amber-700 underline underline-offset-2 hover:opacity-80">sainayaunglinn@gmail.com</a>. We will action your request in accordance with applicable law.</P>
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

function Section({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-6 rounded-xl border border-white/[0.08] light:border-[rgba(80,50,20,0.14)] bg-white/[0.025] light:bg-[rgba(248,246,234,0.7)] px-6 py-5">
      {children}
    </div>
  );
}

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
