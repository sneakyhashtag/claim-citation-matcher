export type Lang = "en" | "zh" | "ja"

export const SUPPORTED_LANGS: { id: Lang; label: string }[] = [
  { id: "en", label: "English" },
  { id: "zh", label: "中文" },
  { id: "ja", label: "日本語" },
]

const translations = {
  en: {
    // Hero
    tagline: "Real papers, not hallucinated ones.",
    subtitle_app: "Paste a paragraph to find academic citations for each factual claim.",
    subtitle_auth: "Find academic citations for every factual claim in your writing.",

    // Form controls
    placeholder: "Paste your paragraph here…",
    try_example: "Try an example",
    upload: "Upload",
    extracting_file: "Extracting…",
    submit: "Submit",
    analyzing: "Analyzing…",

    // Limits & pro
    pro_unlimited: "Pro — unlimited searches",
    searches_left: "{n}/3 searches left today",
    free_limit_msg: "Free accounts are limited to 1,000 characters.",
    upgrade_to_pro: "Upgrade to Pro",
    for_more_chars: "for up to 10,000 characters.",
    sign_in: "Sign in",
    to_unlock_pro: "to unlock Pro features.",
    upload_pro_feature: "Uploading documents is a Pro feature.",
    to_upload_docs: "to upload PDFs, Word docs, and images.",
    sign_in_unlock_uploads: "to unlock Pro features including file uploads.",
    to_unlock_unlimited: "to unlock Pro features with unlimited searches.",

    // Status
    status_extracting: "Extracting claims…",
    status_found_one: "Found 1 claim. Searching for papers…",
    status_found_many: "Found {n} claims. Searching for papers…",
    status_filtering: "Filtering by language…",

    // Results header
    claims_found_one: "1 claim found",
    claims_found_many: "{n} claims found",

    // Omakase
    omakase_cta: "Omakase: rewrite with citations",
    omakase_loading: "Rewriting your paragraph…",

    // Year filters
    filter_all: "All time",
    filter_5yr: "Last 5 years",
    filter_3yr: "Last 3 years",
    filter_1yr: "Last year",
    filter_custom: "Custom",

    // Language filter
    lang_filter_label: "Language",
    lang_all: "All languages",
    lang_en: "English",

    // Paper card
    abstract_match: "Abstract Match",
    topic_match: "Topic Match",
    find_more: "Find more like this",
    hide_related: "Hide related",
    searching: "Searching…",
    no_related: "No related papers match the selected date filter.",
    relevance_tooltip:
      "Relevance is assessed based on the paper\u2019s abstract, not the full text. Click the DOI link to verify against the original paper.",

    // Copy / export
    copy_citation: "Copy citation",
    copied: "Copied!",
    copy_paragraph: "Copy paragraph",
    copy_references: "Copy references",
    copy_all: "Copy all",
    export_btn: "Export",
    download_as: "Download as",

    // Auth
    sign_in_google: "Sign in with Google",
    or: "or",
    continue_guest: "Continue as Guest",
    how_to_use: "How to use",

    // Navigation / menus
    sign_out: "Sign out",
    search_history: "History",

    // How-to modal
    how_it_works_title: "How it works",
    how_it_works_intro:
      "Paste any academic paragraph and Reference Finder automatically finds citations for it — no searching required. It identifies each factual claim, queries OpenAlex and Semantic Scholar in parallel, and returns ranked papers with one-click APA citations.",
    how_it_works_steps: "How it works",
    how_step_1: "Paste any paragraph containing factual claims — research writing, essay drafts, literature reviews, or anything that needs citations.",
    how_step_2: "Claude scans your text and extracts each individual claim that would benefit from academic backing.",
    how_step_3: "Each claim is searched against OpenAlex and Semantic Scholar in parallel, covering 250 million+ real academic works across all fields.",
    how_step_4: "Results are rated for relevance and ranked. Copy any paper's APA citation with one click.",
    paper_stats_title: "Paper stat badges",
    paper_stats_intro: "Each paper card shows stat badges that help you judge paper quality at a glance. Higher numbers on all of these mean a stronger, more reputable paper.",
    relevance_tiers_title: "Relevance tiers",
    relevance_tiers_intro: "Papers are ranked by relevance with three color-coded tiers.",
    good_to_know_title: "Good to know",

    // Greetings
    greet_welcome: "Welcome back, {name}.",
    greet_good_to_see: "Good to see you, {name}.",
    greet_ready: "Hey {name}, ready to research?",
    greet_citing: "What are we citing today, {name}?",
    greet_more_papers: "Back for more papers, {name}?",
    greet_find_refs: "Let\u2019s find some references, {name}.",
    greet_topic: "Hi {name}, what\u2019s the topic today?",
    greet_research_time: "Research time, {name}.",
    greet_get_citing: "{name}, let\u2019s get citing.",
    greet_working_on: "What are we working on, {name}?",
    greet_morning: "Good morning, {name}.",
    greet_afternoon: "Good afternoon, {name}.",
    greet_evening: "Good evening, {name}.",
    greet_late: "Working late, {name}?",
  },

  zh: {
    tagline: "真实论文，非 AI 幻觉。",
    subtitle_app: "粘贴段落，为每个事实性主张找到学术引用。",
    subtitle_auth: "为您写作中的每个事实性主张找到学术引用。",

    placeholder: "在此粘贴您的段落…",
    try_example: "试试示例",
    upload: "上传",
    extracting_file: "提取中…",
    submit: "提交",
    analyzing: "分析中…",

    pro_unlimited: "专业版 — 无限次搜索",
    searches_left: "今日还剩 {n}/3 次搜索",
    free_limit_msg: "免费账户限制为 1,000 个字符。",
    upgrade_to_pro: "升级到专业版",
    for_more_chars: "可使用最多 10,000 个字符。",
    sign_in: "登录",
    to_unlock_pro: "以解锁专业版功能。",
    upload_pro_feature: "上传文档是专业版功能。",
    to_upload_docs: "以上传 PDF、Word 文档和图片。",
    sign_in_unlock_uploads: "以解锁包括文件上传在内的专业版功能。",
    to_unlock_unlimited: "以解锁包含无限次搜索的专业版功能。",

    status_extracting: "正在提取主张…",
    status_found_one: "找到 1 个主张，正在搜索论文…",
    status_found_many: "找到 {n} 个主张，正在搜索论文…",
    status_filtering: "按语言筛选中…",

    claims_found_one: "找到 1 个主张",
    claims_found_many: "找到 {n} 个主张",

    omakase_cta: "Omakase：引用改写",
    omakase_loading: "正在改写您的段落…",

    filter_all: "所有时间",
    filter_5yr: "最近 5 年",
    filter_3yr: "最近 3 年",
    filter_1yr: "最近 1 年",
    filter_custom: "自定义",

    lang_filter_label: "语言",
    lang_all: "所有语言",
    lang_en: "英语",

    abstract_match: "摘要匹配",
    topic_match: "主题匹配",
    find_more: "查找更多相关",
    hide_related: "隐藏相关",
    searching: "搜索中…",
    no_related: "没有与所选日期筛选条件匹配的相关论文。",
    relevance_tooltip:
      "相关性基于论文摘要评估，而非全文。请点击 DOI 链接对照原始论文进行验证。",

    copy_citation: "复制引用",
    copied: "已复制！",
    copy_paragraph: "复制段落",
    copy_references: "复制参考文献",
    copy_all: "全部复制",
    export_btn: "导出",
    download_as: "下载为",

    sign_in_google: "使用 Google 登录",
    or: "或",
    continue_guest: "以访客身份继续",
    how_to_use: "使用方法",

    sign_out: "退出登录",
    search_history: "历史记录",

    how_it_works_title: "使用方法",
    how_it_works_intro:
      "粘贴任意学术段落，Reference Finder 将自动为其查找引用——无需手动搜索。它会识别每个事实性主张，并行查询 OpenAlex 和 Semantic Scholar，返回排名后的论文及一键 APA 引用。",
    how_it_works_steps: "工作原理",
    how_step_1: "粘贴包含事实性主张的段落——研究写作、论文草稿、文献综述或任何需要引用的内容。",
    how_step_2: "Claude 扫描您的文本并提取每个需要学术支撑的独立主张。",
    how_step_3: "每个主张将并行在 OpenAlex 和 Semantic Scholar 中搜索，覆盖 2.5 亿余篇各领域真实学术著作。",
    how_step_4: "结果按相关性评分并排名。一键复制任意论文的 APA 引用。",
    paper_stats_title: "论文统计标签",
    paper_stats_intro: "每张论文卡片显示统计标签，帮助您快速判断论文质量。所有指标数值越高，论文越权威。",
    relevance_tiers_title: "相关性等级",
    relevance_tiers_intro: "论文按相关性排名，分为三个颜色编码的等级。",
    good_to_know_title: "温馨提示",

    greet_welcome: "欢迎回来，{name}。",
    greet_good_to_see: "很高兴见到你，{name}。",
    greet_ready: "嗨，{name}，准备好研究了吗？",
    greet_citing: "今天引用什么，{name}？",
    greet_more_papers: "回来找更多论文了，{name}？",
    greet_find_refs: "来找参考文献吧，{name}。",
    greet_topic: "嗨，{name}，今天研究什么主题？",
    greet_research_time: "研究时间到，{name}。",
    greet_get_citing: "{name}，开始引用吧。",
    greet_working_on: "在研究什么，{name}？",
    greet_morning: "早上好，{name}。",
    greet_afternoon: "下午好，{name}。",
    greet_evening: "晚上好，{name}。",
    greet_late: "工作到这么晚，{name}？",
  },

  ja: {
    tagline: "本物の論文、AI の幻覚ではなく。",
    subtitle_app: "段落を貼り付けると、各事実的主張に対する学術引用を見つけます。",
    subtitle_auth: "あなたの文章の各事実的主張に対する学術引用を見つけます。",

    placeholder: "段落をここに貼り付けてください…",
    try_example: "例を試す",
    upload: "アップロード",
    extracting_file: "抽出中…",
    submit: "送信",
    analyzing: "分析中…",

    pro_unlimited: "Pro — 無制限の検索",
    searches_left: "今日残り {n}/3 回",
    free_limit_msg: "無料アカウントは 1,000 文字に制限されています。",
    upgrade_to_pro: "Pro にアップグレード",
    for_more_chars: "最大 10,000 文字まで使用できます。",
    sign_in: "サインイン",
    to_unlock_pro: "で Pro の機能を解除します。",
    upload_pro_feature: "ドキュメントのアップロードは Pro の機能です。",
    to_upload_docs: "で PDF・Word 文書・画像をアップロードできます。",
    sign_in_unlock_uploads: "でファイルアップロードを含む Pro の機能を解除します。",
    to_unlock_unlimited: "で無制限検索を含む Pro の機能を解除します。",

    status_extracting: "主張を抽出中…",
    status_found_one: "1 件の主張を見つけました。論文を検索中…",
    status_found_many: "{n} 件の主張を見つけました。論文を検索中…",
    status_filtering: "言語でフィルタリング中…",

    claims_found_one: "1 件の主張が見つかりました",
    claims_found_many: "{n} 件の主張が見つかりました",

    omakase_cta: "おまかせ：引用付きで書き直す",
    omakase_loading: "段落を書き直し中…",

    filter_all: "全期間",
    filter_5yr: "過去 5 年",
    filter_3yr: "過去 3 年",
    filter_1yr: "過去 1 年",
    filter_custom: "カスタム",

    lang_filter_label: "言語",
    lang_all: "全言語",
    lang_en: "英語",

    abstract_match: "要約マッチ",
    topic_match: "トピックマッチ",
    find_more: "類似論文を探す",
    hide_related: "関連を非表示",
    searching: "検索中…",
    no_related: "選択された日付フィルターに一致する関連論文がありません。",
    relevance_tooltip:
      "関連性は論文の要約に基づいて評価されており、全文ではありません。DOI リンクをクリックして元の論文で確認してください。",

    copy_citation: "引用をコピー",
    copied: "コピーしました！",
    copy_paragraph: "段落をコピー",
    copy_references: "参考文献をコピー",
    copy_all: "すべてコピー",
    export_btn: "エクスポート",
    download_as: "ダウンロード",

    sign_in_google: "Google でサインイン",
    or: "または",
    continue_guest: "ゲストとして続ける",
    how_to_use: "使い方",

    sign_out: "サインアウト",
    search_history: "履歴",

    how_it_works_title: "使い方",
    how_it_works_intro:
      "任意の学術段落を貼り付けると、Reference Finder が自動的に引用を見つけます。各事実的主張を識別し、OpenAlex と Semantic Scholar を並行して照会し、ワンクリック APA 引用付きのランク付き論文を返します。",
    how_it_works_steps: "仕組み",
    how_step_1: "事実的主張を含む段落を貼り付けてください——研究論文、エッセイの下書き、文献レビュー、引用が必要なものなら何でも。",
    how_step_2: "Claude がテキストをスキャンし、学術的裏付けが必要な各主張を抽出します。",
    how_step_3: "各主張は OpenAlex と Semantic Scholar で並行検索され、全分野の 2 億 5,000 万以上の実際の学術著作をカバーします。",
    how_step_4: "結果は関連性で評価・ランク付けされます。ワンクリックで任意の論文の APA 引用をコピーできます。",
    paper_stats_title: "論文統計バッジ",
    paper_stats_intro: "各論文カードには、論文の品質を一目で判断できる統計バッジが表示されます。数値が高いほど、より信頼性の高い論文です。",
    relevance_tiers_title: "関連性ティア",
    relevance_tiers_intro: "論文は関連性でランク付けされ、3 つの色分けされたティアに分類されます。",
    good_to_know_title: "ご参考に",

    greet_welcome: "おかえりなさい、{name} さん。",
    greet_good_to_see: "また会えて嬉しいです、{name} さん。",
    greet_ready: "こんにちは {name} さん、調査の準備はできましたか？",
    greet_citing: "今日は何を引用しますか、{name} さん？",
    greet_more_papers: "また論文を探しに来たのですね、{name} さん？",
    greet_find_refs: "参考文献を見つけましょう、{name} さん。",
    greet_topic: "{name} さん、今日のトピックは？",
    greet_research_time: "調査の時間ですよ、{name} さん。",
    greet_get_citing: "{name} さん、引用を始めましょう。",
    greet_working_on: "何に取り組んでいますか、{name} さん？",
    greet_morning: "おはようございます、{name} さん。",
    greet_afternoon: "こんにちは、{name} さん。",
    greet_evening: "こんばんは、{name} さん。",
    greet_late: "遅くまで働いていますね、{name} さん？",
  },
} as const

type TranslationDict = typeof translations.en
type TKey = keyof TranslationDict

export type TFunction = (key: TKey, params?: Record<string, string | number>) => string

export function getT(lang: Lang): TFunction {
  const dict = translations[lang] as Record<string, string>
  const base = translations.en as Record<string, string>
  return function t(key: TKey, params?: Record<string, string | number>): string {
    let str = dict[key] ?? base[key] ?? key
    if (params) {
      for (const [k, v] of Object.entries(params)) {
        str = str.replace(`{${k}}`, String(v))
      }
    }
    return str
  }
}

/** Returns the best supported language for the user's browser, defaulting to "en". */
export function detectLang(): Lang {
  if (typeof navigator === "undefined") return "en"
  const l = navigator.language.toLowerCase()
  if (l.startsWith("zh")) return "zh"
  if (l.startsWith("ja")) return "ja"
  return "en"
}
