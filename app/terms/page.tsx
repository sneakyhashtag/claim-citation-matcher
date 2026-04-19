import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service | Reference Finder",
  description: "Terms of Service for Reference Finder.",
};

const sections = [
  {
    n: "1",
    title: "Service Description",
    body: "Reference Finder is a web-based tool that helps users match claims to academic citations using AI and academic database APIs including OpenAlex and Semantic Scholar. The Service is provided on an \"as is\" basis and may be updated, modified, or discontinued at our discretion.",
  },
  {
    n: "2",
    title: "Account Registration",
    body: "To access certain features, you may need to create an account. You agree to provide accurate information and to keep your credentials secure. You are responsible for all activity under your account.",
  },
  {
    n: "3",
    title: "Acceptable Use",
    body: null,
    list: [
      "Use the Service for any unlawful purpose",
      "Attempt to reverse-engineer, scrape, or overload the Service",
      "Submit content that infringes intellectual property, violates privacy, or contains malicious code",
      "Resell, sublicense, or redistribute the Service without written permission",
      "Use the Service to generate fraudulent citations or academic misconduct",
    ],
    listPrefix: "You agree not to:",
  },
  {
    n: "4",
    title: "Payment and Subscriptions",
    body: "Paid plans are billed through Stripe. Prices are displayed at checkout and include applicable taxes. Subscriptions renew automatically unless cancelled before the next billing cycle. You can cancel at any time through your account settings.",
  },
  {
    n: "5",
    title: "Refunds",
    body: "Due to the digital nature of the Service, refunds are generally not provided. If you experience a technical issue that prevents you from using the Service, contact us and we will address it on a case-by-case basis.",
  },
  {
    n: "6",
    title: "Intellectual Property",
    body: "All content, code, and design of the Service are owned by the Operator or its licensors. You retain ownership of any content you submit, but grant us a limited license to process it solely for the purpose of providing the Service.",
  },
  {
    n: "7",
    title: "Third-Party Services",
    body: "The Service relies on third-party APIs (Anthropic, OpenAlex, Semantic Scholar, Stripe, Neon). We are not responsible for their availability, accuracy, or policies. Your use of the Service is also subject to their respective terms.",
  },
  {
    n: "8",
    title: "AI-Generated Output Disclaimer",
    body: "Reference Finder uses AI to suggest citations. Suggestions may be inaccurate, incomplete, or outdated. Users are solely responsible for verifying citations before using them in any academic or professional work. We make no warranty regarding the accuracy of AI-generated output.",
  },
  {
    n: "9",
    title: "Disclaimer of Warranties",
    body: "The Service is provided \"as is\" without warranties of any kind, express or implied, including merchantability, fitness for a particular purpose, or non-infringement.",
  },
  {
    n: "10",
    title: "Limitation of Liability",
    body: "To the maximum extent permitted by law, the Operator shall not be liable for any indirect, incidental, consequential, or punitive damages arising from your use of the Service. Total liability in any case shall not exceed the amount you paid to us in the preceding three (3) months.",
  },
  {
    n: "11",
    title: "Termination",
    body: "We may suspend or terminate your access at any time if you violate these Terms or if required by law. You may stop using the Service and cancel your account at any time.",
  },
  {
    n: "12",
    title: "Changes to These Terms",
    body: "We may update these Terms from time to time. Material changes will be announced via the Service or by email. Continued use after changes constitutes acceptance.",
  },
  {
    n: "13",
    title: "Governing Law and Jurisdiction",
    body: "These Terms are governed by the laws of Japan. Any disputes shall be submitted to the exclusive jurisdiction of the Kyoto District Court (京都地方裁判所) as the court of first instance.",
  },
  {
    n: "14",
    title: "Contact",
    body: null,
    contact: true,
  },
];

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[var(--page-bg)] px-4 py-14 sm:px-6">
      <div className="mx-auto max-w-2xl">

        {/* Back link */}
        <Link
          href="/"
          className="mb-10 inline-flex items-center gap-1.5 text-xs text-slate-500 light:text-[#A67856] transition-colors hover:text-slate-300 light:hover:text-[#6B3A22]"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M19 12H5M12 5l-7 7 7 7" />
          </svg>
          Reference Finder
        </Link>

        {/* Page heading */}
        <div className="mb-8 border-b border-white/[0.07] light:border-[rgba(80,50,20,0.10)] pb-6">
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-amber-500/70 light:text-amber-800/60">
            Legal
          </p>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-100 light:text-[#2C1810]">
            Terms of Service
          </h1>
          <p className="mt-1 text-sm text-slate-400 light:text-[#7A5C44]">
            Last updated: April 20, 2026
          </p>
        </div>

        {/* Intro */}
        <div className="mb-8 rounded-xl border border-white/[0.08] light:border-[rgba(80,50,20,0.14)] bg-white/[0.025] light:bg-[rgba(248,246,234,0.7)] px-6 py-5">
          <p className="text-sm leading-relaxed text-slate-300 light:text-[#3D2214]">
            Welcome to Reference Finder (&ldquo;the Service&rdquo;), operated by{" "}
            <span className="font-medium text-slate-100 light:text-[#2C1810]">Sai Nay Aung Linn</span>{" "}
            (&ldquo;we,&rdquo; &ldquo;us,&rdquo; or &ldquo;the Operator&rdquo;). By accessing or using the Service,
            you agree to these Terms of Service (&ldquo;Terms&rdquo;). If you do not agree, please do not use the Service.
          </p>
        </div>

        {/* Sections */}
        <div className="rounded-xl border border-white/[0.08] light:border-[rgba(80,50,20,0.14)] overflow-hidden bg-white/[0.025] light:bg-[rgba(248,246,234,0.7)]">
          {sections.map((sec, i) => (
            <div
              key={sec.n}
              className={`px-6 py-5${i !== sections.length - 1 ? " border-b border-white/[0.06] light:border-[rgba(80,50,20,0.09)]" : ""}`}
            >
              <h2 className="mb-2 text-sm font-semibold text-slate-100 light:text-[#2C1810]">
                {sec.n}. {sec.title}
              </h2>

              {sec.body && (
                <p className="text-sm leading-relaxed text-slate-400 light:text-[#7A5C44]">
                  {sec.body}
                </p>
              )}

              {sec.list && (
                <>
                  <p className="mb-2 text-sm leading-relaxed text-slate-400 light:text-[#7A5C44]">
                    {sec.listPrefix}
                  </p>
                  <ul className="space-y-1.5 pl-1">
                    {sec.list.map((item) => (
                      <li key={item} className="flex items-start gap-2 text-sm text-slate-400 light:text-[#7A5C44]">
                        <span className="mt-[5px] h-1 w-1 shrink-0 rounded-full bg-amber-500/50" aria-hidden />
                        {item}
                      </li>
                    ))}
                  </ul>
                </>
              )}

              {sec.contact && (
                <p className="text-sm leading-relaxed text-slate-400 light:text-[#7A5C44]">
                  For questions regarding these Terms, please contact:{" "}
                  <a
                    href="mailto:sainayaunglinn@gmail.com"
                    className="text-amber-400 light:text-amber-700 underline underline-offset-2 hover:text-amber-300 light:hover:text-amber-800 transition-colors"
                  >
                    sainayaunglinn@gmail.com
                  </a>
                </p>
              )}
            </div>
          ))}
        </div>

        {/* Footer */}
        <p className="mt-8 text-center text-[11px] text-slate-600 light:text-[#B08060]">
          &copy; {new Date().getFullYear()} Sai Nay Aung Linn. All rights reserved.
        </p>

      </div>
    </div>
  );
}
