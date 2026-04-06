import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "特定商取引法に基づく表記 | Commercial Disclosure | Reference Finder",
  description:
    "Specified Commercial Transactions Act disclosure for Reference Finder Pro.",
};

const rows: { ja: string; en: string; value: string }[] = [
  {
    ja: "販売者名",
    en: "Seller name",
    value: "Sai Nay Aung Linn",
  },
  {
    ja: "所在地",
    en: "Address",
    value:
      "〒606-8246 京都府京都市左京区北白川西平井町10番地 アミティ北白川105号室",
  },
  {
    ja: "メールアドレス",
    en: "Email",
    value: "sainayaunglinn@gmail.com",
  },
  {
    ja: "電話番号",
    en: "Phone",
    value: "070-3323-0224",
  },
  {
    ja: "商品・サービス内容",
    en: "Product / Service",
    value:
      "Reference Finder Pro サブスクリプション（デジタルサービス）\nReference Finder Pro subscription (digital service)",
  },
  {
    ja: "販売価格",
    en: "Price",
    value:
      "月額プラン：$2.99／月\n年額プラン：$29.99／年\nMonthly plan: $2.99/month\nAnnual plan: $29.99/year",
  },
  {
    ja: "支払い方法",
    en: "Payment method",
    value:
      "クレジットカード（Stripe 経由）\nCredit card via Stripe",
  },
  {
    ja: "サービス提供時期",
    en: "Service delivery",
    value:
      "お支払い完了後、即時ご利用いただけます。\nInstant access upon payment.",
  },
  {
    ja: "キャンセル・返金ポリシー",
    en: "Cancellation & Refund",
    value:
      "アカウント設定からいつでもキャンセルできます。購入後7日以内かつサービス未利用の場合は返金いたします。7日経過後またはサービス利用済みの場合は返金できません。\nYou may cancel anytime from your account settings. Refunds are available within 7 days of purchase if the service has not been used. No refund after 7 days or if the service has been used.",
  },
  {
    ja: "追加手数料",
    en: "Additional fees",
    value: "なし\nNone",
  },
];

export default function LegalPage() {
  return (
    <div className="min-h-screen bg-[var(--page-bg)] px-4 py-14 sm:px-6">
      <div className="mx-auto max-w-2xl">

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

        {/* Page heading */}
        <div className="mb-8 border-b border-white/[0.07] light:border-[rgba(80,50,20,0.10)] pb-6">
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-amber-500/70 light:text-amber-800/60">
            Legal
          </p>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-100 light:text-[#2C1810]">
            特定商取引法に基づく表記
          </h1>
          <p className="mt-1 text-sm text-slate-400 light:text-[#7A5C44]">
            Specified Commercial Transactions Act Disclosure
          </p>
        </div>

        {/* Disclosure table */}
        <div className="rounded-xl border border-white/[0.08] light:border-[rgba(80,50,20,0.14)] overflow-hidden
                        bg-white/[0.025] light:bg-[rgba(248,246,234,0.7)]">
          {rows.map((row, i) => (
            <div
              key={row.ja}
              className={`flex flex-col sm:flex-row${i !== rows.length - 1 ? " border-b border-white/[0.06] light:border-[rgba(80,50,20,0.09)]" : ""}`}
            >
              {/* Label */}
              <div className="w-full sm:w-44 shrink-0 px-5 py-4
                              bg-white/[0.03] light:bg-[rgba(44,24,16,0.04)]
                              sm:border-r border-white/[0.06] light:border-[rgba(80,50,20,0.09)]">
                <p className="text-xs font-semibold text-slate-200 light:text-[#2C1810]">
                  {row.ja}
                </p>
                <p className="mt-0.5 text-[10px] text-slate-500 light:text-[#9B7055]">
                  {row.en}
                </p>
              </div>

              {/* Value */}
              <div className="flex-1 px-5 py-4">
                {row.value.split("\n").map((line, j) => {
                  const isEnglish = j % 2 !== 0;
                  return (
                    <p
                      key={j}
                      className={`text-sm leading-relaxed${j > 0 ? " mt-1" : ""}${
                        isEnglish
                          ? " text-slate-400 light:text-[#7A5C44]"
                          : " text-slate-200 light:text-[#2C1810]"
                      }`}
                    >
                      {row.ja === "メールアドレス" ? (
                        <a
                          href="mailto:sainayaunglinn@gmail.com"
                          className="text-amber-400 light:text-amber-700 underline underline-offset-2 hover:text-amber-300 light:hover:text-amber-800 transition-colors"
                        >
                          {line}
                        </a>
                      ) : (
                        line
                      )}
                    </p>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Footer note */}
        <p className="mt-8 text-center text-[11px] text-slate-600 light:text-[#B08060]">
          &copy; {new Date().getFullYear()} Sai Nay Aung Linn. All rights reserved.
        </p>
      </div>
    </div>
  );
}
