export type Lang = "en" | "zh" | "ja" | "ko"

export const SUPPORTED_LANGS: { id: Lang; label: string }[] = [
  { id: "en", label: "English" },
  { id: "zh", label: "中文" },
  { id: "ja", label: "日本語" },
  { id: "ko", label: "한국어" },
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

    // Recency filter label
    published: "Published",
    apply: "Apply",
    from_year: "From",
    to_year: "To",

    // Language filter
    lang_filter_label: "Language",
    lang_all: "All languages",
    lang_en: "English",

    // Relevance tiers (ScoreBadge labels)
    tier_direct: "Direct",
    tier_high: "High",
    tier_moderate: "Moderate",

    // Pro gate
    pro_feature: "Pro feature",
    pro_gate_upgrade_link: "Upgrade to Pro",
    pro_gate_upgrade_suffix: "to unlock this feature.",
    pro_gate_signin_link: "Sign in",
    pro_gate_signin_suffix: "and upgrade to Pro to unlock this feature.",

    // Omakase citation picker
    choose_style: "Choose citation style",
    rewrite_inline_desc: "Your paragraph will be rewritten with inline citations.",

    // Omakase result section
    omakase_rewrite_title: "Omakase rewrite",
    rewritten_paragraph: "Rewritten paragraph",
    references: "References",
    citations_highlighted: "Citations are highlighted in the paragraph above.",

    // Omakase loading overlay
    rewriting_with_style: "Rewriting with {style} citations…",
    inserting_refs: "Inserting references from your matched papers",

    // Citation menu
    cite_btn: "Cite",
    copy_citation_header: "Copy citation",

    // Paper stat badges
    sjr_tooltip: "SJR quartile from Scimago Journal Rankings — the official ranking for this journal.",

    // Paper card
    abstract_match: "Abstract Match",
    topic_match: "Topic Match",
    matching_from_abstract: "Matching sentence from abstract",
    how_paper_relates: "How this paper relates",
    find_more: "Find more like this",
    hide_related: "Hide related",
    searching: "Searching…",
    searching_related: "Searching for related papers…",
    no_related_found: "No related papers found.",
    no_related: "No related papers match the selected date filter.",
    related_papers_section: "Related papers",
    collapse: "Collapse",
    hidden_by_date_one: "1 older paper hidden by date filter.",
    hidden_by_date_many: "{n} older papers hidden by date filter.",
    relevance_tooltip:
      "Relevance is assessed based on the paper\u2019s abstract, not the full text. Click the DOI link to verify against the original paper.",

    // Claim card
    claim_label: "Claim",
    no_relevant_papers: "No relevant papers found for this claim.",
    no_papers_date_filter: "No papers match the selected date filter.",
    papers_hidden_one: "(1 paper hidden)",
    papers_hidden_many: "({n} papers hidden)",
    older_papers_hidden_one: "1 older paper hidden by date filter.",
    older_papers_hidden_many: "{n} older papers hidden by date filter.",

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
    cancel_subscription: "Cancel subscription",

    // History sidebar
    history_title: "Search History",
    no_searches_yet: "No searches yet",
    history_count: "{n} searches",
    history_analyses: "Your analyses will appear here",
    delete_all_confirm: "Delete all history?",
    delete: "Delete",
    cancel_btn: "Cancel",
    clear_all: "Clear all",

    // Cancel subscription dialog
    sub_cancelled_title: "Subscription cancelled",
    cancel_sub_title: "Cancel subscription",
    full_refund_eligible: "Full refund eligible",
    trial_cancel_msg: "You\u2019re still in your free trial. Your subscription will be cancelled immediately with no charge.",
    no_refund_access_until: "No refund \u2014 access until {date}",
    sure_cancel_sub: "Are you sure you want to cancel your Pro subscription?",
    keep_pro: "Keep Pro",
    yes_cancel: "Yes, cancel",
    cancelling: "Cancelling\u2026",
    close: "Close",

    // Plan modal
    start_trial_title: "Start Your Free Trial",
    trial_billing_sub: "7 days free, then choose your plan.",
    upgrade_billing_sub: "Choose your billing cycle below.",
    trial_used_banner_title: "You\u2019ve already used your free trial.",
    trial_used_banner_sub: "This will be a paid subscription from day one.",
    trial_start_banner_title: "Start your 7-day free trial.",
    trial_start_banner_sub: "You won\u2019t be charged until {date}. Cancel anytime before then for free.",
    what_you_unlock: "What you unlock",
    plan_monthly: "Monthly",
    plan_per_month: "per month",
    plan_billed_monthly: "Billed monthly",
    plan_save_2mo: "Save 2 months",
    plan_yearly: "Yearly",
    plan_per_year: "per year",
    plan_redirecting: "Redirecting to checkout\u2026",

    // Feature list (plan modal)
    feat_unlimited: "Unlimited searches",
    feat_unlimited_sub: "3/day on free",
    feat_char_limit: "10,000 char limit",
    feat_char_limit_sub: "1,000 on free",
    feat_upload: "Document upload",
    feat_upload_sub: "PDFs, Word, images",
    feat_omakase: "Omakase mode",
    feat_omakase_sub: "Auto-rewrite with citations",
    feat_export: "Export results",
    feat_export_sub: "BibTeX, RIS, plain text",
    feat_date_filter: "Date filter",
    feat_date_filter_sub: "Narrow by publication year",
    feat_find_more: "Find more like this",
    feat_find_more_sub: "Discover related papers",
    feat_future: "All future features",
    feat_future_sub: "Included automatically",

    // How-to modal
    how_it_works_title: "How it works",
    how_it_works_intro:
      "Paste any academic paragraph and Reference Finder automatically finds citations for it \u2014 no searching required. It identifies each factual claim, queries OpenAlex and Semantic Scholar in parallel, and returns ranked papers with one-click APA citations.",
    how_it_works_steps: "How it works",
    how_step_1: "Paste any paragraph containing factual claims \u2014 research writing, essay drafts, literature reviews, or anything that needs citations.",
    how_step_2: "Claude scans your text and extracts each individual claim that would benefit from academic backing.",
    how_step_3: "Each claim is searched against OpenAlex and Semantic Scholar in parallel, covering 250 million+ real academic works across all fields.",
    how_step_4: "Results are rated for relevance and ranked. Copy any paper\u2019s APA citation with one click.",
    paper_stats_title: "Paper stat badges",
    paper_stats_intro: "Each paper card shows stat badges that help you judge paper quality at a glance. Higher numbers on all of these mean a stronger, more reputable paper.",

    // Badge descriptions
    badge_flame_title: "Flame \u2014 total citations.",
    badge_flame_desc: "How many times this paper has been cited. Glows orange when \u2265 500, signalling a highly cited work.",
    badge_star_title: "Star \u2014 influential citations.",
    badge_star_desc: "Citations that actually mattered \u2014 papers that meaningfully built on this work, as identified by Semantic Scholar.",
    badge_bar_title: "Bar chart \u2014 journal h-index.",
    badge_bar_desc: "Measures journal prestige: a journal with h-index 50 has published at least 50 papers each cited at least 50 times.",
    badge_if_title: "IF \u2014 impact factor proxy.",
    badge_if_desc: "The 2-year mean citedness from OpenAlex: the average number of times recent articles in this journal were cited over the past two years. This is a free, openly computed equivalent of the traditional Impact Factor. Only shown for OpenAlex sources where data is available.",
    badge_q_title: "Q1\u2013Q4 \u2014 SJR journal quartile.",
    badge_q_desc: "The official quartile from Scimago Journal Rankings (SJR), sourced from the public SJR dataset. Q1 is the top 25% of journals in a field by SJR score, Q4 is the bottom 25%. Lookup uses ISSN first, then journal name. Only shown when the journal is found in the SJR index.",
    badge_book_title: "Book \u2014 research field.",
    badge_book_desc: "The subject area or discipline the paper belongs to. Only shown when available.",

    relevance_tiers_title: "Relevance tiers",
    relevance_tiers_intro: "Papers are ranked by relevance with three color-coded tiers.",

    // Tier descriptions (in how-to modal)
    tier_direct_desc: "the paper directly supports the claim.",
    tier_high_desc: "closely related and useful context for the claim.",
    tier_moderate_desc: "touches on the topic but is not a direct match.",

    good_to_know_title: "Good to know",

    // Good to know items
    gk_lang_title: "Any language.",
    gk_lang_desc: "Paste paragraphs in any language \u2014 the app will find English-language papers for your claims.",
    gk_daily_title: "10 free searches per day.",
    gk_daily_desc: "The counter resets at midnight UTC and is tracked by a secure signed cookie.",
    gk_signin_title: "Sign in or continue as guest.",
    gk_signin_desc: "Sign in with Google to save your search history across sessions, or use the app as a guest \u2014 history is still saved in your browser.",
    gk_example_title: "Try an example.",
    gk_example_desc: "Not sure where to start? Click the button below the text box to load a sample paragraph. Click again for a different field.",

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

    // Sign-in step cards
    step_paste_label: "Paste",
    step_paste_desc: "Drop any academic paragraph in any language \u2014 English, \u4e2d\u6587, or \u65e5\u672c\u8a9e.",
    step_extract_label: "Extract",
    step_extract_desc: "AI identifies each factual claim in your writing that needs a citation.",
    step_search_label: "Search",
    step_search_desc: "Real papers pulled from OpenAlex and Semantic Scholar \u2014 never hallucinated.",
    step_rank_label: "Rank",
    step_rank_desc: "Every result shows citation count, h-index, Impact Factor, and Scimago quartile.",
    step_cite_label: "Cite",
    step_cite_desc: "Copy in APA, MLA, Chicago, IEEE, or let Omakase rewrite your paragraph with citations.",

    // Differentiator callout + footer
    differentiator_heading: "What makes Reference Finder different:",
    differentiator_body: "Omakase Mode auto-rewrites your paragraph with proper in-text citations in any style, and every paper is matched claim-by-claim \u2014 not by keyword.",
    free_to_try: "Free to try \u00b7 No card required",

    // Email sign-in form
    email_signin_show: "Sign in with email",
    email_signin_hide: "Hide email sign-in",
    email_label: "Email",
    password_label: "Password",
    signing_in: "Signing in\u2026",

    // Sidebar controls
    new_search: "New Search",
    sidebar_searches: "Searches",
    sidebar_saved: "Saved",
    sidebar_starred: "Starred",
    sidebar_recent: "Recent",
    no_saved_papers: "No saved papers yet \u2014 bookmark papers from your search results.",
    manage_subscription: "Manage subscription",

    // Sidebar tab row
    new_search_tab: "New search\u2026",
    aria_star: "Star",
    aria_unstar: "Unstar",
    aria_delete_tab: "Delete tab",
    aria_remove_paper: "Remove saved paper",
    aria_collapse_sidebar: "Collapse sidebar",

    // Daily limit banner
    daily_limit_reached: "You\u2019ve reached your daily limit of 3 free searches.",

    // Auth error messages
    auth_err_email_not_found: "No account found with this email address.",
    auth_err_google_only: "This email uses Google sign-in. Use \u201cContinue with Google\u201d above.",
    auth_err_wrong_password: "Incorrect password. Please try again.",
    auth_err_credentials: "Incorrect email or password.",
    auth_err_oauth_linked: "This email is already linked to a different sign-in method.",
    auth_err_default: "Something went wrong. Please try again.",

    // Sign-in page editorial copy
    signin_headline_line1: "Find the paper",
    signin_headline_line2: "behind every",
    signin_headline_em: "claim",
    sign_in_or_guest: "Sign in or continue as guest",
    welcome_back: "Welcome back.",
    signin_subtitle: "Sign in to save your history across sessions.",
    stat_papers: "real papers indexed",
    stat_languages: "languages supported",
    stat_formats: "citation formats",
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

    published: "发表时间",
    apply: "应用",
    from_year: "从",
    to_year: "到",

    lang_filter_label: "语言",
    lang_all: "所有语言",
    lang_en: "英语",

    tier_direct: "直接相关",
    tier_high: "高度相关",
    tier_moderate: "中度相关",

    pro_feature: "专业版功能",
    pro_gate_upgrade_link: "升级到专业版",
    pro_gate_upgrade_suffix: "以解锁此功能。",
    pro_gate_signin_link: "登录",
    pro_gate_signin_suffix: "并升级到专业版以解锁此功能。",

    choose_style: "选择引用格式",
    rewrite_inline_desc: "您的段落将被改写为带内联引用的版本。",

    omakase_rewrite_title: "Omakase 改写",
    rewritten_paragraph: "改写后的段落",
    references: "参考文献",
    citations_highlighted: "引用内容已在上方段落中高亮显示。",

    rewriting_with_style: "正在使用 {style} 格式改写…",
    inserting_refs: "正在插入匹配论文的参考文献",

    cite_btn: "引用",
    copy_citation_header: "复制引用",

    sjr_tooltip: "来自 Scimago 期刊排名的 SJR 四分位数——该期刊的官方排名。",

    abstract_match: "摘要匹配",
    topic_match: "主题匹配",
    matching_from_abstract: "摘要中的匹配句子",
    how_paper_relates: "本文的相关性",
    find_more: "查找更多相关",
    hide_related: "隐藏相关",
    searching: "搜索中…",
    searching_related: "正在搜索相关论文…",
    no_related_found: "未找到相关论文。",
    no_related: "没有与所选日期筛选条件匹配的相关论文。",
    related_papers_section: "相关论文",
    collapse: "收起",
    hidden_by_date_one: "1 篇较旧的论文被日期筛选隐藏。",
    hidden_by_date_many: "{n} 篇较旧的论文被日期筛选隐藏。",
    relevance_tooltip:
      "相关性基于论文摘要评估，而非全文。请点击 DOI 链接对照原始论文进行验证。",

    claim_label: "主张",
    no_relevant_papers: "未找到此主张的相关论文。",
    no_papers_date_filter: "没有论文与所选日期筛选条件匹配。",
    papers_hidden_one: "（1 篇论文已隐藏）",
    papers_hidden_many: "（{n} 篇论文已隐藏）",
    older_papers_hidden_one: "1 篇较旧的论文被日期筛选隐藏。",
    older_papers_hidden_many: "{n} 篇较旧的论文被日期筛选隐藏。",

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
    cancel_subscription: "取消订阅",

    history_title: "搜索历史",
    no_searches_yet: "暂无搜索记录",
    history_count: "{n} 次搜索",
    history_analyses: "您的分析将显示在此处",
    delete_all_confirm: "删除所有历史记录？",
    delete: "删除",
    cancel_btn: "取消",
    clear_all: "清除所有",

    sub_cancelled_title: "订阅已取消",
    cancel_sub_title: "取消订阅",
    full_refund_eligible: "可享受全额退款",
    trial_cancel_msg: "您仍在免费试用期内。您的订阅将立即取消，不收取任何费用。",
    no_refund_access_until: "不予退款 — 可访问至 {date}",
    sure_cancel_sub: "您确定要取消专业版订阅吗？",
    keep_pro: "保留专业版",
    yes_cancel: "是，取消",
    cancelling: "正在取消…",
    close: "关闭",

    start_trial_title: "开始免费试用",
    trial_billing_sub: "7 天免费，然后选择套餐。",
    upgrade_billing_sub: "在下方选择账单周期。",
    trial_used_banner_title: "您已使用过免费试用。",
    trial_used_banner_sub: "这将是一个从第一天起就付费的订阅。",
    trial_start_banner_title: "开始您的 7 天免费试用。",
    trial_start_banner_sub: "在 {date} 之前不会向您收费。随时可在此之前免费取消。",
    what_you_unlock: "您将解锁的功能",
    plan_monthly: "月付",
    plan_per_month: "每月",
    plan_billed_monthly: "按月计费",
    plan_save_2mo: "节省 2 个月",
    plan_yearly: "年付",
    plan_per_year: "每年",
    plan_redirecting: "正在跳转到结账页面…",

    feat_unlimited: "无限次搜索",
    feat_unlimited_sub: "免费版每日 3 次",
    feat_char_limit: "10,000 字符限制",
    feat_char_limit_sub: "免费版 1,000 字符",
    feat_upload: "文档上传",
    feat_upload_sub: "PDF、Word、图片",
    feat_omakase: "Omakase 模式",
    feat_omakase_sub: "自动引用改写",
    feat_export: "导出结果",
    feat_export_sub: "BibTeX、RIS、纯文本",
    feat_date_filter: "日期筛选",
    feat_date_filter_sub: "按发表年份筛选",
    feat_find_more: "查找更多相关",
    feat_find_more_sub: "发现相关论文",
    feat_future: "所有未来功能",
    feat_future_sub: "自动包含",

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

    badge_flame_title: "火焰——总引用数。",
    badge_flame_desc: "该论文被引用的次数。引用数 ≥ 500 时呈橙色发光，表示高被引著作。",
    badge_star_title: "星星——影响力引用数。",
    badge_star_desc: "真正有影响力的引用——由 Semantic Scholar 识别的，对该研究有实质性贡献的引用论文。",
    badge_bar_title: "柱状图——期刊 h 指数。",
    badge_bar_desc: "衡量期刊声望：h 指数为 50 的期刊发表了至少 50 篇各被引用至少 50 次的论文。",
    badge_if_title: "IF——影响因子代理。",
    badge_if_desc: "来自 OpenAlex 的 2 年平均被引率：该期刊近期文章在过去两年内被引用的平均次数。这是传统影响因子的免费开放计算等效指标。仅对有数据的 OpenAlex 来源显示。",
    badge_q_title: "Q1–Q4——SJR 期刊四分位。",
    badge_q_desc: "来自 Scimago 期刊排名（SJR）的官方四分位，数据来源于公开 SJR 数据集。Q1 为该领域 SJR 得分前 25% 的期刊，Q4 为后 25%。优先使用 ISSN 查找，其次使用期刊名称。仅在 SJR 索引中找到该期刊时显示。",
    badge_book_title: "书本——研究领域。",
    badge_book_desc: "该论文所属的学科领域。仅在有数据时显示。",

    relevance_tiers_title: "相关性等级",
    relevance_tiers_intro: "论文按相关性排名，分为三个颜色编码的等级。",

    tier_direct_desc: "该论文直接支持此主张。",
    tier_high_desc: "与主张密切相关，提供有用的背景信息。",
    tier_moderate_desc: "涉及相关主题，但并非直接匹配。",

    good_to_know_title: "温馨提示",

    gk_lang_title: "任何语言。",
    gk_lang_desc: "可粘贴任何语言的段落——应用将为您的主张查找英语论文。",
    gk_daily_title: "每天 10 次免费搜索。",
    gk_daily_desc: "计数器每天 UTC 午夜重置，通过安全的签名 Cookie 进行跟踪。",
    gk_signin_title: "登录或以访客身份继续。",
    gk_signin_desc: "使用 Google 登录可跨会话保存搜索历史，也可以访客身份使用——历史仍会保存在浏览器中。",
    gk_example_title: "试试示例。",
    gk_example_desc: "不知从何开始？点击文本框下方的按钮加载示例段落，再次点击可切换不同领域。",

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

    // Sign-in step cards
    step_paste_label: "粘贴",
    step_paste_desc: "粘贴任何语言的学术段落——英文、中文或日本語均可。",
    step_extract_label: "提取",
    step_extract_desc: "AI 识别您写作中每个需要引用的事实性主张。",
    step_search_label: "搜索",
    step_search_desc: "从 OpenAlex 和 Semantic Scholar 获取真实论文——绝无 AI 幻觉。",
    step_rank_label: "排名",
    step_rank_desc: "每条结果显示引用次数、h 指数、影响因子和 Scimago 四分位。",
    step_cite_label: "引用",
    step_cite_desc: "以 APA、MLA、Chicago、IEEE 格式复制，或让 Omakase 为您改写段落并添加引用。",

    // Differentiator callout + footer
    differentiator_heading: "Reference Finder 的独特之处：",
    differentiator_body: "Omakase 模式可自动将您的段落改写为任何格式的内联引用版本，且每篇论文均按主张逐条匹配——而非关键词搜索。",
    free_to_try: "免费试用 · 无需信用卡",

    // Email sign-in form
    email_signin_show: "使用邮箱登录",
    email_signin_hide: "隐藏邮箱登录",
    email_label: "邮箱",
    password_label: "密码",
    signing_in: "登录中…",

    // Sidebar controls
    new_search: "新建搜索",
    sidebar_searches: "搜索记录",
    sidebar_saved: "已保存",
    sidebar_starred: "已加星标",
    sidebar_recent: "最近",
    no_saved_papers: "暂无已保存的论文——从搜索结果中收藏论文。",
    manage_subscription: "管理订阅",

    // Sidebar tab row
    new_search_tab: "新搜索…",
    aria_star: "加星标",
    aria_unstar: "取消星标",
    aria_delete_tab: "删除标签",
    aria_remove_paper: "移除已保存的论文",
    aria_collapse_sidebar: "收起侧边栏",

    // Daily limit banner
    daily_limit_reached: "您已达到今日 3 次免费搜索的上限。",

    // Auth error messages
    auth_err_email_not_found: "未找到此邮箱地址对应的账户。",
    auth_err_google_only: "此邮箱使用 Google 登录。请点击上方的\u300c使用 Google 登录\u300d按钮。",
    auth_err_wrong_password: "密码错误，请重试。",
    auth_err_credentials: "邮箱或密码错误。",
    auth_err_oauth_linked: "此邮箱已与其他登录方式关联。",
    auth_err_default: "出现错误，请重试。",

    // Sign-in page editorial copy
    signin_headline_line1: "找到每个",
    signin_headline_line2: "主张背后的",
    signin_headline_em: "论文",
    sign_in_or_guest: "登录或以访客身份继续",
    welcome_back: "欢迎回来。",
    signin_subtitle: "登录以跨会话保存您的历史记录。",
    stat_papers: "真实收录论文数",
    stat_languages: "支持的语言",
    stat_formats: "引用格式",
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

    published: "掲載年",
    apply: "適用",
    from_year: "開始年",
    to_year: "終了年",

    lang_filter_label: "言語",
    lang_all: "全言語",
    lang_en: "英語",

    tier_direct: "直接",
    tier_high: "高",
    tier_moderate: "中",

    pro_feature: "Pro の機能",
    pro_gate_upgrade_link: "Pro にアップグレード",
    pro_gate_upgrade_suffix: "してこの機能を解除してください。",
    pro_gate_signin_link: "サインイン",
    pro_gate_signin_suffix: "して Pro にアップグレードし、この機能を解除してください。",

    choose_style: "引用スタイルを選択",
    rewrite_inline_desc: "段落がインライン引用付きで書き直されます。",

    omakase_rewrite_title: "おまかせ書き直し",
    rewritten_paragraph: "書き直した段落",
    references: "参考文献",
    citations_highlighted: "引用は上記の段落でハイライトされています。",

    rewriting_with_style: "{style} 引用で書き直し中…",
    inserting_refs: "マッチした論文の参考文献を挿入中",

    cite_btn: "引用",
    copy_citation_header: "引用をコピー",

    sjr_tooltip: "Scimago ジャーナルランキングの SJR 四分位 — このジャーナルの公式ランキング。",

    abstract_match: "要約マッチ",
    topic_match: "トピックマッチ",
    matching_from_abstract: "要約からのマッチする文",
    how_paper_relates: "この論文の関連性",
    find_more: "類似論文を探す",
    hide_related: "関連を非表示",
    searching: "検索中…",
    searching_related: "関連論文を検索中…",
    no_related_found: "関連論文が見つかりませんでした。",
    no_related: "選択された日付フィルターに一致する関連論文がありません。",
    related_papers_section: "関連論文",
    collapse: "折りたたむ",
    hidden_by_date_one: "1 件の古い論文が日付フィルターで非表示。",
    hidden_by_date_many: "{n} 件の古い論文が日付フィルターで非表示。",
    relevance_tooltip:
      "関連性は論文の要約に基づいて評価されており、全文ではありません。DOI リンクをクリックして元の論文で確認してください。",

    claim_label: "主張",
    no_relevant_papers: "この主張に関連する論文が見つかりませんでした。",
    no_papers_date_filter: "選択された日付フィルターに一致する論文がありません。",
    papers_hidden_one: "（1 件の論文が非表示）",
    papers_hidden_many: "（{n} 件の論文が非表示）",
    older_papers_hidden_one: "1 件の古い論文が日付フィルターで非表示。",
    older_papers_hidden_many: "{n} 件の古い論文が日付フィルターで非表示。",

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
    cancel_subscription: "サブスクリプションをキャンセル",

    history_title: "検索履歴",
    no_searches_yet: "まだ検索がありません",
    history_count: "{n} 件の検索",
    history_analyses: "分析結果がここに表示されます",
    delete_all_confirm: "すべての履歴を削除しますか？",
    delete: "削除",
    cancel_btn: "キャンセル",
    clear_all: "すべて消去",

    sub_cancelled_title: "サブスクリプションがキャンセルされました",
    cancel_sub_title: "サブスクリプションをキャンセル",
    full_refund_eligible: "全額返金対象",
    trial_cancel_msg: "まだ無料トライアル中です。サブスクリプションは即時キャンセルされ、費用は発生しません。",
    no_refund_access_until: "返金なし — {date} までアクセス可能",
    sure_cancel_sub: "Pro サブスクリプションをキャンセルしてもよろしいですか？",
    keep_pro: "Pro を維持",
    yes_cancel: "はい、キャンセルします",
    cancelling: "キャンセル中…",
    close: "閉じる",

    start_trial_title: "無料トライアルを開始",
    trial_billing_sub: "7 日間無料、その後プランを選択してください。",
    upgrade_billing_sub: "下記の請求サイクルを選択してください。",
    trial_used_banner_title: "すでに無料トライアルを使用しました。",
    trial_used_banner_sub: "これは初日から有料のサブスクリプションです。",
    trial_start_banner_title: "7 日間の無料トライアルを開始してください。",
    trial_start_banner_sub: "{date} まで課金されません。それ以前にいつでも無料でキャンセルできます。",
    what_you_unlock: "解除される機能",
    plan_monthly: "月額",
    plan_per_month: "月",
    plan_billed_monthly: "月額課金",
    plan_save_2mo: "2ヶ月お得",
    plan_yearly: "年額",
    plan_per_year: "年",
    plan_redirecting: "チェックアウトにリダイレクト中…",

    feat_unlimited: "無制限の検索",
    feat_unlimited_sub: "無料は1日3回",
    feat_char_limit: "10,000 文字制限",
    feat_char_limit_sub: "無料は 1,000 文字",
    feat_upload: "ドキュメントアップロード",
    feat_upload_sub: "PDF・Word・画像",
    feat_omakase: "おまかせモード",
    feat_omakase_sub: "引用付き自動書き直し",
    feat_export: "結果のエクスポート",
    feat_export_sub: "BibTeX・RIS・プレーンテキスト",
    feat_date_filter: "日付フィルター",
    feat_date_filter_sub: "発表年で絞り込み",
    feat_find_more: "類似論文を探す",
    feat_find_more_sub: "関連論文を発見",
    feat_future: "将来のすべての機能",
    feat_future_sub: "自動的に含まれます",

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

    badge_flame_title: "炎 — 総引用数。",
    badge_flame_desc: "この論文が引用された回数。500 以上でオレンジ色に輝き、高被引用論文を示します。",
    badge_star_title: "星 — 影響力のある引用数。",
    badge_star_desc: "真に重要な引用 — Semantic Scholar が識別した、この研究を実質的に発展させた論文からの引用。",
    badge_bar_title: "棒グラフ — ジャーナル h 指数。",
    badge_bar_desc: "ジャーナルの権威性を測定：h 指数 50 のジャーナルは、各 50 回以上引用された論文を 50 本以上発表しています。",
    badge_if_title: "IF — インパクトファクター代替指標。",
    badge_if_desc: "OpenAlex の 2 年間平均被引用率：このジャーナルの最近の論文が過去 2 年間に引用された平均回数。従来のインパクトファクターの無料・公開計算版です。データがある OpenAlex ソースのみ表示。",
    badge_q_title: "Q1–Q4 — SJR ジャーナル四分位。",
    badge_q_desc: "公開 SJR データセットを基にした Scimago ジャーナルランキング（SJR）の公式四分位。Q1 は SJR スコアで上位 25%、Q4 は下位 25%。ISSN 優先、次いでジャーナル名で照合。SJR インデックスで見つかった場合のみ表示。",
    badge_book_title: "本 — 研究分野。",
    badge_book_desc: "この論文が属する学術分野。データがある場合のみ表示。",

    relevance_tiers_title: "関連性ティア",
    relevance_tiers_intro: "論文は関連性でランク付けされ、3 つの色分けされたティアに分類されます。",

    tier_direct_desc: "論文がその主張を直接支持しています。",
    tier_high_desc: "主張と密接に関連し、有用な文脈を提供します。",
    tier_moderate_desc: "トピックに触れていますが、直接の一致ではありません。",

    good_to_know_title: "ご参考に",

    gk_lang_title: "任意の言語。",
    gk_lang_desc: "任意の言語で段落を貼り付けてください — アプリがあなたの主張に対して英語の論文を見つけます。",
    gk_daily_title: "1日10回無料検索。",
    gk_daily_desc: "カウンターは UTC 深夜にリセットされ、安全な署名付き Cookie で追跡されます。",
    gk_signin_title: "サインインまたはゲストとして続ける。",
    gk_signin_desc: "Google でサインインするとセッションをまたいで検索履歴が保存されます。ゲストとして使用することも可能 — 履歴はブラウザに保存されます。",
    gk_example_title: "例を試す。",
    gk_example_desc: "どこから始めればよいかわからない？テキストボックス下のボタンをクリックしてサンプル段落を読み込んでください。もう一度クリックで別の分野に切り替わります。",

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

    // Sign-in step cards
    step_paste_label: "貼り付け",
    step_paste_desc: "英語・中文・日本語など、どの言語の学術段落でも貼り付けられます。",
    step_extract_label: "抽出",
    step_extract_desc: "AI があなたの文章から引用が必要な各事実的主張を識別します。",
    step_search_label: "検索",
    step_search_desc: "OpenAlex と Semantic Scholar から実際の論文を取得——AI の幻覚は一切なし。",
    step_rank_label: "ランク付け",
    step_rank_desc: "各結果には引用数・h 指数・インパクトファクター・Scimago 四分位が表示されます。",
    step_cite_label: "引用",
    step_cite_desc: "APA・MLA・Chicago・IEEE 形式でコピー、またはおまかせで引用付き段落に書き直します。",

    // Differentiator callout + footer
    differentiator_heading: "Reference Finder が他と違う点：",
    differentiator_body: "おまかせモードは段落をあらゆるスタイルの適切なインライン引用付きで自動書き直しし、すべての論文はキーワードではなく主張ごとにマッチングされます。",
    free_to_try: "無料で試せます · カード不要",

    // Email sign-in form
    email_signin_show: "メールでサインイン",
    email_signin_hide: "メールサインインを非表示",
    email_label: "メールアドレス",
    password_label: "パスワード",
    signing_in: "サインイン中…",

    // Sidebar controls
    new_search: "新規検索",
    sidebar_searches: "検索",
    sidebar_saved: "保存済み",
    sidebar_starred: "スター付き",
    sidebar_recent: "最近",
    no_saved_papers: "保存済みの論文はまだありません — 検索結果から論文をブックマークしてください。",
    manage_subscription: "サブスクリプションを管理",

    // Sidebar tab row
    new_search_tab: "新規検索…",
    aria_star: "スターを付ける",
    aria_unstar: "スターを外す",
    aria_delete_tab: "タブを削除",
    aria_remove_paper: "保存済みの論文を削除",
    aria_collapse_sidebar: "サイドバーを折りたたむ",

    // Daily limit banner
    daily_limit_reached: "本日の無料検索 3 回の上限に達しました。",

    // Auth error messages
    auth_err_email_not_found: "このメールアドレスに関連するアカウントが見つかりません。",
    auth_err_google_only: "このメールは Google サインインを使用しています。上の「Google でサインイン」をご利用ください。",
    auth_err_wrong_password: "パスワードが正しくありません。もう一度お試しください。",
    auth_err_credentials: "メールアドレスまたはパスワードが正しくありません。",
    auth_err_oauth_linked: "このメールアドレスは別のサインイン方法にすでに関連付けられています。",
    auth_err_default: "エラーが発生しました。もう一度お試しください。",

    // Sign-in page editorial copy
    signin_headline_line1: "すべての主張の",
    signin_headline_line2: "背後にある",
    signin_headline_em: "論文を探す",
    sign_in_or_guest: "サインインまたはゲストとして続ける",
    welcome_back: "おかえりなさい。",
    signin_subtitle: "サインインしてセッションをまたいで履歴を保存しましょう。",
    stat_papers: "収録論文数",
    stat_languages: "対応言語",
    stat_formats: "引用形式",
  },

  ko: {
    tagline: "AI가 만든 환각이 아닌, 실제 논문.",
    subtitle_app: "단락을 붙여넣으면 각 사실적 주장에 맞는 학술 인용문을 찾아드립니다.",
    subtitle_auth: "글 속의 모든 사실적 주장에 대한 학술 인용문을 찾아보세요.",

    placeholder: "단락을 여기에 붙여넣으세요…",
    try_example: "예시 보기",
    upload: "업로드",
    extracting_file: "추출 중…",
    submit: "제출",
    analyzing: "분석 중…",

    pro_unlimited: "Pro — 무제한 검색",
    searches_left: "오늘 {n}/3회 남음",
    free_limit_msg: "무료 계정은 1,000자로 제한됩니다.",
    upgrade_to_pro: "Pro로 업그레이드",
    for_more_chars: "최대 10,000자를 사용할 수 있습니다.",
    sign_in: "로그인",
    to_unlock_pro: "Pro 기능을 잠금 해제하세요.",
    upload_pro_feature: "문서 업로드는 Pro 기능입니다.",
    to_upload_docs: "PDF, Word, 이미지를 업로드하세요.",
    sign_in_unlock_uploads: "파일 업로드를 포함한 Pro 기능을 잠금 해제하세요.",
    to_unlock_unlimited: "무제한 검색을 포함한 Pro 기능을 잠금 해제하세요.",

    status_extracting: "주장 추출 중…",
    status_found_one: "1개의 주장을 찾았습니다. 논문 검색 중…",
    status_found_many: "{n}개의 주장을 찾았습니다. 논문 검색 중…",
    status_filtering: "언어로 필터링 중…",

    claims_found_one: "주장 1개 발견",
    claims_found_many: "주장 {n}개 발견",

    omakase_cta: "오마카세: 인용문으로 재작성",
    omakase_loading: "단락을 재작성 중…",

    filter_all: "전체 기간",
    filter_5yr: "최근 5년",
    filter_3yr: "최근 3년",
    filter_1yr: "최근 1년",
    filter_custom: "사용자 정의",

    published: "게재 연도",
    apply: "적용",
    from_year: "시작 연도",
    to_year: "종료 연도",

    lang_filter_label: "언어",
    lang_all: "모든 언어",
    lang_en: "영어",

    tier_direct: "직접 관련",
    tier_high: "높은 관련성",
    tier_moderate: "중간 관련성",

    pro_feature: "Pro 기능",
    pro_gate_upgrade_link: "Pro로 업그레이드",
    pro_gate_upgrade_suffix: "하여 이 기능을 잠금 해제하세요.",
    pro_gate_signin_link: "로그인",
    pro_gate_signin_suffix: "하고 Pro로 업그레이드하여 이 기능을 잠금 해제하세요.",

    choose_style: "인용 스타일 선택",
    rewrite_inline_desc: "단락이 인라인 인용문과 함께 재작성됩니다.",

    omakase_rewrite_title: "오마카세 재작성",
    rewritten_paragraph: "재작성된 단락",
    references: "참고문헌",
    citations_highlighted: "인용문이 위 단락에서 강조 표시됩니다.",

    rewriting_with_style: "{style} 인용으로 재작성 중…",
    inserting_refs: "매칭된 논문의 참고문헌 삽입 중",

    cite_btn: "인용",
    copy_citation_header: "인용 복사",

    sjr_tooltip: "Scimago 저널 순위의 SJR 사분위수 — 해당 저널의 공식 순위.",

    abstract_match: "초록 매칭",
    topic_match: "주제 매칭",
    matching_from_abstract: "초록의 매칭 문장",
    how_paper_relates: "이 논문의 관련성",
    find_more: "유사 논문 찾기",
    hide_related: "관련 논문 숨기기",
    searching: "검색 중…",
    searching_related: "관련 논문 검색 중…",
    no_related_found: "관련 논문을 찾을 수 없습니다.",
    no_related: "선택한 날짜 필터와 일치하는 관련 논문이 없습니다.",
    related_papers_section: "관련 논문",
    collapse: "접기",
    hidden_by_date_one: "날짜 필터로 1편의 오래된 논문이 숨겨졌습니다.",
    hidden_by_date_many: "날짜 필터로 {n}편의 오래된 논문이 숨겨졌습니다.",
    relevance_tooltip: "관련성은 전문이 아닌 논문의 초록을 기반으로 평가됩니다. DOI 링크를 클릭하여 원본 논문을 확인하세요.",

    claim_label: "주장",
    no_relevant_papers: "이 주장에 대한 관련 논문을 찾을 수 없습니다.",
    no_papers_date_filter: "선택한 날짜 필터와 일치하는 논문이 없습니다.",
    papers_hidden_one: "(논문 1편 숨김)",
    papers_hidden_many: "(논문 {n}편 숨김)",
    older_papers_hidden_one: "날짜 필터로 1편의 오래된 논문이 숨겨졌습니다.",
    older_papers_hidden_many: "날짜 필터로 {n}편의 오래된 논문이 숨겨졌습니다.",

    copy_citation: "인용 복사",
    copied: "복사됨!",
    copy_paragraph: "단락 복사",
    copy_references: "참고문헌 복사",
    copy_all: "전체 복사",
    export_btn: "내보내기",
    download_as: "다운로드",

    sign_in_google: "Google로 로그인",
    or: "또는",
    continue_guest: "게스트로 계속",
    how_to_use: "사용법",

    sign_out: "로그아웃",
    search_history: "기록",
    cancel_subscription: "구독 취소",

    history_title: "검색 기록",
    no_searches_yet: "아직 검색 기록이 없습니다",
    history_count: "검색 {n}회",
    history_analyses: "분석 결과가 여기에 표시됩니다",
    delete_all_confirm: "모든 기록을 삭제하시겠습니까?",
    delete: "삭제",
    cancel_btn: "취소",
    clear_all: "모두 지우기",

    sub_cancelled_title: "구독이 취소되었습니다",
    cancel_sub_title: "구독 취소",
    full_refund_eligible: "전액 환불 가능",
    trial_cancel_msg: "아직 무료 체험 기간입니다. 구독이 즉시 취소되며 비용이 청구되지 않습니다.",
    no_refund_access_until: "환불 없음 — {date}까지 이용 가능",
    sure_cancel_sub: "Pro 구독을 취소하시겠습니까?",
    keep_pro: "Pro 유지",
    yes_cancel: "예, 취소합니다",
    cancelling: "취소 중…",
    close: "닫기",

    start_trial_title: "무료 체험 시작",
    trial_billing_sub: "7일 무료, 이후 플랜을 선택하세요.",
    upgrade_billing_sub: "아래에서 결제 주기를 선택하세요.",
    trial_used_banner_title: "이미 무료 체험을 사용하셨습니다.",
    trial_used_banner_sub: "첫날부터 유료 구독이 시작됩니다.",
    trial_start_banner_title: "7일 무료 체험을 시작하세요.",
    trial_start_banner_sub: "{date} 전까지 청구되지 않습니다. 언제든지 무료로 취소할 수 있습니다.",
    what_you_unlock: "잠금 해제되는 기능",
    plan_monthly: "월간",
    plan_per_month: "월",
    plan_billed_monthly: "월간 결제",
    plan_save_2mo: "2개월 절약",
    plan_yearly: "연간",
    plan_per_year: "년",
    plan_redirecting: "결제 페이지로 이동 중…",

    feat_unlimited: "무제한 검색",
    feat_unlimited_sub: "무료는 하루 3회",
    feat_char_limit: "10,000자 제한",
    feat_char_limit_sub: "무료는 1,000자",
    feat_upload: "문서 업로드",
    feat_upload_sub: "PDF, Word, 이미지",
    feat_omakase: "오마카세 모드",
    feat_omakase_sub: "인용문으로 자동 재작성",
    feat_export: "결과 내보내기",
    feat_export_sub: "BibTeX, RIS, 일반 텍스트",
    feat_date_filter: "날짜 필터",
    feat_date_filter_sub: "게재 연도로 필터링",
    feat_find_more: "유사 논문 찾기",
    feat_find_more_sub: "관련 논문 발견",
    feat_future: "모든 미래 기능",
    feat_future_sub: "자동으로 포함",

    how_it_works_title: "사용법",
    how_it_works_intro: "학술 단락을 붙여넣으면 Reference Finder가 자동으로 인용문을 찾아드립니다. 각 사실적 주장을 식별하고 OpenAlex와 Semantic Scholar를 병렬로 조회하여 원클릭 APA 인용문과 함께 순위가 매겨진 논문을 반환합니다.",
    how_it_works_steps: "작동 방식",
    how_step_1: "사실적 주장이 포함된 단락을 붙여넣으세요 — 연구 글쓰기, 에세이 초안, 문헌 검토 등 인용이 필요한 모든 것.",
    how_step_2: "Claude가 텍스트를 스캔하고 학술적 뒷받침이 필요한 각 주장을 추출합니다.",
    how_step_3: "각 주장은 OpenAlex와 Semantic Scholar에서 병렬로 검색되며, 모든 분야의 2억 5천만 편 이상의 실제 학술 저작을 포괄합니다.",
    how_step_4: "결과는 관련성으로 평가·순위가 매겨집니다. 원클릭으로 논문의 APA 인용문을 복사할 수 있습니다.",
    paper_stats_title: "논문 통계 배지",
    paper_stats_intro: "각 논문 카드에는 논문 품질을 한눈에 판단할 수 있는 통계 배지가 표시됩니다. 모든 수치가 높을수록 더 신뢰할 수 있는 논문입니다.",

    badge_flame_title: "불꽃 — 총 인용 수.",
    badge_flame_desc: "이 논문이 인용된 횟수. 500 이상이면 주황색으로 빛나며 많이 인용된 논문을 나타냅니다.",
    badge_star_title: "별 — 영향력 있는 인용 수.",
    badge_star_desc: "실제로 중요한 인용 — 이 연구를 실질적으로 발전시킨 논문들로, Semantic Scholar가 식별합니다.",
    badge_bar_title: "막대 그래프 — 저널 h-지수.",
    badge_bar_desc: "저널 권위를 측정: h-지수 50인 저널은 각각 50회 이상 인용된 논문을 50편 이상 게재했습니다.",
    badge_if_title: "IF — 영향 지수 대리 지표.",
    badge_if_desc: "OpenAlex의 2년 평균 피인용률: 이 저널의 최근 논문이 지난 2년간 인용된 평균 횟수. 전통적인 영향 지수의 무료 공개 계산 등가물입니다.",
    badge_q_title: "Q1–Q4 — SJR 저널 사분위수.",
    badge_q_desc: "공개 SJR 데이터셋의 Scimago 저널 순위(SJR) 공식 사분위수. Q1은 SJR 점수 상위 25%, Q4는 하위 25%. ISSN 우선, 그 다음 저널명으로 조회. SJR 색인에서 발견된 경우에만 표시.",
    badge_book_title: "책 — 연구 분야.",
    badge_book_desc: "이 논문이 속한 학문 분야. 데이터가 있을 때만 표시됩니다.",

    relevance_tiers_title: "관련성 등급",
    relevance_tiers_intro: "논문은 관련성으로 순위가 매겨지며 세 가지 색상으로 구분된 등급으로 분류됩니다.",

    tier_direct_desc: "논문이 해당 주장을 직접 뒷받침합니다.",
    tier_high_desc: "주장과 밀접하게 관련되어 유용한 맥락을 제공합니다.",
    tier_moderate_desc: "주제를 다루지만 직접적인 일치는 아닙니다.",

    good_to_know_title: "알아두면 좋은 것",

    gk_lang_title: "어떤 언어든.",
    gk_lang_desc: "어떤 언어로든 단락을 붙여넣으세요 — 앱이 주장에 대한 영어 논문을 찾아드립니다.",
    gk_daily_title: "하루 10회 무료 검색.",
    gk_daily_desc: "카운터는 UTC 자정에 초기화되며 보안 서명 쿠키로 추적됩니다.",
    gk_signin_title: "로그인하거나 게스트로 계속하세요.",
    gk_signin_desc: "Google로 로그인하면 세션 간에 검색 기록이 저장됩니다. 게스트로 사용해도 기록은 브라우저에 저장됩니다.",
    gk_example_title: "예시를 사용해보세요.",
    gk_example_desc: "어디서부터 시작할지 모르겠다면? 텍스트 상자 아래 버튼을 클릭하여 샘플 단락을 불러오세요. 다시 클릭하면 다른 분야로 전환됩니다.",

    greet_welcome: "{name}님, 다시 오셨군요.",
    greet_good_to_see: "{name}님, 반갑습니다.",
    greet_ready: "{name}님, 연구할 준비가 되셨나요?",
    greet_citing: "{name}님, 오늘은 무엇을 인용할까요?",
    greet_more_papers: "{name}님, 논문을 더 찾으러 오셨군요?",
    greet_find_refs: "{name}님, 참고문헌을 찾아봅시다.",
    greet_topic: "{name}님, 오늘의 주제는 무엇인가요?",
    greet_research_time: "{name}님, 연구 시간입니다.",
    greet_get_citing: "{name}님, 인용을 시작해봅시다.",
    greet_working_on: "{name}님, 무엇을 연구하고 계신가요?",
    greet_morning: "{name}님, 좋은 아침입니다.",
    greet_afternoon: "{name}님, 안녕하세요.",
    greet_evening: "{name}님, 좋은 저녁입니다.",
    greet_late: "{name}님, 늦게까지 작업 중이시군요?",

    // Sign-in step cards
    step_paste_label: "붙여넣기",
    step_paste_desc: "영어, 中文, 日本語 등 어떤 언어의 학술 단락이든 붙여넣으세요.",
    step_extract_label: "추출",
    step_extract_desc: "AI가 글쓰기에서 인용이 필요한 각 사실적 주장을 식별합니다.",
    step_search_label: "검색",
    step_search_desc: "OpenAlex와 Semantic Scholar에서 실제 논문을 가져옵니다 — AI 환각 없음.",
    step_rank_label: "순위",
    step_rank_desc: "각 결과에는 인용 수, h-지수, 영향 지수, Scimago 사분위수가 표시됩니다.",
    step_cite_label: "인용",
    step_cite_desc: "APA, MLA, Chicago, IEEE 형식으로 복사하거나 오마카세로 단락을 재작성하세요.",

    // Differentiator callout + footer
    differentiator_heading: "Reference Finder가 다른 점:",
    differentiator_body: "오마카세 모드는 어떤 스타일로든 단락을 적절한 인라인 인용문과 함께 자동으로 재작성하며, 모든 논문은 키워드가 아닌 주장별로 매칭됩니다.",
    free_to_try: "무료 체험 · 카드 불필요",

    // Email sign-in form
    email_signin_show: "이메일로 로그인",
    email_signin_hide: "이메일 로그인 숨기기",
    email_label: "이메일",
    password_label: "비밀번호",
    signing_in: "로그인 중…",

    // Sidebar controls
    new_search: "새 검색",
    sidebar_searches: "검색",
    sidebar_saved: "저장됨",
    sidebar_starred: "별표",
    sidebar_recent: "최근",
    no_saved_papers: "아직 저장된 논문이 없습니다 — 검색 결과에서 논문을 북마크하세요.",
    manage_subscription: "구독 관리",

    // Sidebar tab row
    new_search_tab: "새 검색…",
    aria_star: "별표 추가",
    aria_unstar: "별표 제거",
    aria_delete_tab: "탭 삭제",
    aria_remove_paper: "저장된 논문 제거",
    aria_collapse_sidebar: "사이드바 접기",

    // Daily limit banner
    daily_limit_reached: "오늘의 무료 검색 3회 한도에 도달했습니다.",

    // Auth error messages
    auth_err_email_not_found: "이 이메일 주소로 등록된 계정을 찾을 수 없습니다.",
    auth_err_google_only: "이 이메일은 Google 로그인을 사용합니다. 위의 'Google로 로그인'을 사용하세요.",
    auth_err_wrong_password: "비밀번호가 올바르지 않습니다. 다시 시도해주세요.",
    auth_err_credentials: "이메일 또는 비밀번호가 올바르지 않습니다.",
    auth_err_oauth_linked: "이 이메일은 이미 다른 로그인 방법과 연결되어 있습니다.",
    auth_err_default: "오류가 발생했습니다. 다시 시도해주세요.",

    // Sign-in page editorial copy
    signin_headline_line1: "모든 주장 뒤에",
    signin_headline_line2: "있는",
    signin_headline_em: "논문을 찾다",
    sign_in_or_guest: "로그인 또는 게스트로 계속",
    welcome_back: "다시 오셨군요.",
    signin_subtitle: "로그인하여 세션 간에 기록을 저장하세요.",
    stat_papers: "수록 논문 수",
    stat_languages: "지원 언어",
    stat_formats: "인용 형식",
  },
} as const

type TranslationDict = typeof translations.en
export type TKey = keyof TranslationDict

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
