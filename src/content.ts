/**
 * All portfolio copy lives here as typed config (ADR-8: no CMS).
 * Voice rules (DESIGN.md): first person, plain, specific, numbers over
 * adjectives. No "passionate developer" filler. Ever.
 */

export interface ChapterCopy {
  /** Small mono eyebrow line, e.g. "CHAPTER 03 — NH-48". */
  eyebrow: string
  title: string
  tagline: string
}

export const CHAPTER_COPY: readonly ChapterCopy[] = [
  {
    eyebrow: 'PROLOGUE — 04:50',
    title: 'The Road Trip',
    tagline: 'The story of what I build, told as one long drive. Scroll is the accelerator.',
  },
  {
    eyebrow: 'CHAPTER 01 — VILLAGE DAWN',
    title: 'Where It Starts',
    tagline:
      'A hand-me-down laptop and borrowed internet: first HTML, first CSS, first "hello world" — self-taught long before it was a job.',
  },
  {
    eyebrow: 'CHAPTER 02 — TOWN MORNING',
    title: 'Learning to Build',
    tagline: '12+ freelance projects shipped before "developer" was a job title. First motorcycle.',
  },
  {
    eyebrow: 'CHAPTER 03 — NH-48, MIDNIGHT',
    title: 'Highway Speed',
    tagline:
      'Night shift on the open road — full-stack years at Brainerhub: production systems, real deadlines, the R15.',
  },
  {
    eyebrow: 'CHAPTER 04 — CITY DUSK',
    title: 'Heavier Machine',
    tagline:
      'The whole climb on one skyline: freelance → Brainerhub → OpenAI/Meta contract → engineering lead at Eigenlytics × Luxia.',
  },
  {
    eyebrow: 'CHAPTER 05 — NEON NIGHT',
    title: 'The AI Era',
    tagline: 'AI-Trader, AIFlowo, Maestro, Devovia — shipping intelligence, not demos.',
  },
  {
    eyebrow: 'CHAPTER 06 — THE CIRCUIT',
    title: 'Beyond the Map',
    tagline: 'The road becomes the board. Let’s build the next thing — get in touch.',
  },
] as const

export const CONTACT = {
  email: 'aaryansinha16@gmail.com',
  github: 'https://github.com/aaryansinha16',
  linkedin: 'https://www.linkedin.com/in/aaryansinha16',
  medium: 'https://medium.com/@aaryansinha16',
  site: 'https://devovia.com',
  resumeUrl: '/resume.pdf',
} as const

/** Highway hoardings — skills + Brainerhub-era facts as roadside ads. */
export const SKILL_BOARDS: readonly { title: string; sub: string; accent: string }[] = [
  {
    title: 'REACT · NEXT.JS · TS',
    sub: 'production UI since the freelance years',
    accent: '#1e6fb8',
  },
  { title: 'NESTJS · NODE · POSTGRES', sub: 'APIs that survive real traffic', accent: '#c1442e' },
  {
    title: '3+ CLIENT PROJECTS SOLO',
    sub: 'owned end to end at Brainerhub — zero handoffs',
    accent: '#8a5a2e',
  },
  {
    title: 'AD-ANALYTICS × 4 PLATFORMS',
    sub: 'Google · Meta · TikTok · Snapchat, real-time',
    accent: '#42618a',
  },
  { title: 'THREE.JS · WEBGL', sub: 'you are driving through one right now', accent: '#1e6fb8' },
  {
    title: "'RISING STAR' — YEAR ONE",
    sub: 'team-lead duties + cross-team PR reviews',
    accent: '#c9a23a',
  },
  {
    title: 'REAL-TIME · YJS · SOCKETS',
    sub: 'collaborative editing, live everything',
    accent: '#42618a',
  },
  { title: 'AWS · DOCKER · CI/CD', sub: 'deploys on push, sleeps at night', accent: '#6e7a3a' },
]

/** The banner the little plane tows over the highway. */
export const PLANE_BANNER = '5+ YRS · 12+ APPS · AI-NATIVE — AARYAN SINHA'

/** Village signboards — the self-taught beginnings, hand-painted. `big`
 * ones are small rural hoardings with a real journey line; the rest stay
 * quirky roadside markers. */
export const VILLAGE_SIGNS: readonly { text: string; sub?: string; big?: boolean }[] = [
  {
    text: 'IT ALL STARTED WITH NO-CODE GIGS',
    sub: 'tiny builds for real people — 2018',
    big: true,
  },
  { text: 'hello, world' },
  {
    text: 'SELF-TAUGHT: HTML → CSS → JS',
    sub: 'view-source was my first teacher',
    big: true,
  },
  { text: 'css till 3am { }' },
  {
    text: 'FIRST FREELANCE ₹ BEFORE ANY JOB TITLE',
    sub: 'low-code sites → custom code',
    big: true,
  },
  { text: 'console.log("dreams")' },
]

/** Town wall graffiti — attention to detail, not wallpaper. */
export const TOWN_GRAFFITI: readonly { text: string; color: string }[] = [
  { text: '</> ship it', color: '#c1442e' },
  { text: 'chai + code', color: '#42618a' },
  { text: 'localhost:3000', color: '#5a6631' },
  { text: '12+ apps', color: '#8a5a2e' },
  { text: 'git commit -m "life"', color: '#623253' },
]

/** City dusk — the career arc as glitchy tower billboards (resume-sourced). */
export const CITY_BILLBOARDS: readonly {
  era: string
  title: string
  sub: string
  color: string
}[] = [
  {
    era: '2018–2023',
    title: 'FREELANCE',
    sub: '12+ apps for international clients',
    color: '#ff8c42',
  },
  { era: '2021', title: 'ACADBOOST', sub: 'taught personal finance & markets', color: '#ffd9a0' },
  { era: '2022', title: 'MASAI SCHOOL', sub: 'full-time engineering program', color: '#d8e0ff' },
  {
    era: '2023–2026',
    title: 'BRAINERHUB',
    sub: "3+ solo client projects · 'Rising Star'",
    color: '#ff8c42',
  },
  {
    era: '2025',
    title: 'OPENAI / META',
    sub: 'JS/TS expert — LLM training contract',
    color: '#7de8ff',
  },
  {
    era: '2025–2026',
    title: 'PAISAEASY',
    sub: 'compliance-grade fintech, real money',
    color: '#ffd9a0',
  },
  {
    era: '2026–NOW',
    title: 'EIGENLYTICS × LUXIA',
    sub: 'engineering lead — LLM & RAG live',
    color: '#ff8c42',
  },
]

/** City gantries — signs spanning the road itself; you drive under the arc. */
export const CITY_GANTRIES: readonly { title: string; sub: string; color: string }[] = [
  {
    title: 'THE CLIMB · 2018 → 2026',
    sub: 'freelance kid to engineering lead',
    color: '#ffd9a0',
  },
  { title: '7 ROLES · 1 ROAD', sub: 'every billboard on this skyline is real', color: '#7de8ff' },
]

/** Town rooftop hoardings — what the learning years were actually made of.
 * Mounted on houses with decent gaps; the street tells the freelance story. */
export const TOWN_ROOF_BOARDS: readonly { title: string; sub: string; bg: string }[] = [
  { title: 'WORDPRESS → CUSTOM CODE', sub: 'when templates stopped being enough', bg: '#274e63' },
  { title: 'FIRST REACT APP — 2019', sub: 'rebuilt a client site, never went back', bg: '#7a3327' },
  { title: '12+ FREELANCE BUILDS', sub: 'clients across 4 countries', bg: '#4e5a2e' },
  { title: 'REAL-TIME CHAT FOR A CLIENT', sub: 'socket.io before it was my job', bg: '#31456b' },
  { title: 'PAYMENTS THAT CLEAR', sub: 'razorpay · stripe · mollie', bg: '#6b3f27' },
  { title: 'SHOPIFY STOREFRONTS', sub: 'graphql APIs, live to this day', bg: '#623253' },
]

/** Town shopfront signboards — the learning-years street. */
export const TOWN_SHOPS: readonly { name: string; bg: string }[] = [
  { name: 'CYBER CAFÉ', bg: '#274e63' },
  { name: 'BOOK DEPOT', bg: '#7a3327' },
  { name: 'CHAI POINT', bg: '#5a6631' },
  { name: 'MOBILE REPAIR', bg: '#31456b' },
  { name: 'ELECTRICALS', bg: '#6b3f27' },
  { name: 'GENERAL STORE', bg: '#4e5a2e' },
  { name: 'TAILORS', bg: '#623253' },
  { name: 'STATIONERY', bg: '#2e5a50' },
]

export const DETOUR_SIGN = { title: 'PROJECTS →', sub: '12+ builds, this way' } as const

/** Neon Night — the AI-era flagships, in actual neon. */
export const AI_PROJECTS: readonly { name: string; color: string }[] = [
  { name: 'AI-TRADER', color: '#00e5ff' },
  { name: 'AIFLOWO', color: '#ff2e88' },
  { name: 'MAESTRO', color: '#b98aff' },
  { name: 'DEVOVIA', color: '#39ff88' },
]

/* ---------------- detours (horizontal strips) ---------------- */

export interface DetourPanel {
  kind: 'intro' | 'card'
  title: string
  body: string
  /** short mono footer lines (stack, stats) */
  meta?: string[]
  link?: { label: string; href: string }
  /** github repo (owner fixed) for the live star count */
  repo?: string
  /** accent (neon holo panels) */
  color?: string
}

export interface DetourDef {
  id: string
  eyebrow: string
  title: string
  style: 'board' | 'holo'
  /** strip = DOM panel row; world = clickable in-world billboards */
  mode?: 'strip' | 'world'
  /** which chapter zone the stop belongs to */
  zone: number
  /** where along the zone the stop begins (0..1 of the zone) */
  anchorT: number
  /** how much scroll the stop consumes (fraction of total scroll) */
  scrollLen: number
  /**
   * road covered DURING the stop. 0 (strips) = full plateau, the rider pulls
   * over; >0 (world stops) = the ride keeps rolling in slow motion past the
   * in-world exhibits for this many meters.
   */
  spanMeters?: number
  panels: DetourPanel[]
}

export const DETOURS: readonly DetourDef[] = [
  {
    id: 'freelance',
    eyebrow: 'DETOUR — THE FREELANCE YEARS',
    title: 'Twelve-plus apps before the job title',
    style: 'board',
    zone: 2,
    anchorT: 0.62,
    scrollLen: 0.062,
    panels: [
      {
        kind: 'intro',
        title: '2018–2023',
        body: '12+ production web apps for international clients. Requirements to architecture to deployment to post-launch — owned end to end, alone.',
      },
      {
        kind: 'card',
        title: 'Real-time everything',
        body: 'Live features with Socket.IO for client products — the obsession that later became Yjs CRDT collaborative editing in Devovia.',
        meta: ['SOCKET.IO · WEBSOCKETS', 'later: YJS · TIPTAP · WEBRTC'],
      },
      {
        kind: 'card',
        title: 'Payments that clear',
        body: 'Razorpay, Stripe and Mollie integrations across client builds — money flows people actually trusted.',
        meta: ['RAZORPAY · STRIPE · MOLLIE'],
      },
      {
        kind: 'card',
        title: 'Storefronts & Shopify',
        body: 'Shopify GraphQL APIs and long-lived client sites — krislineconsulting.com still maintained live.',
        meta: ['SHOPIFY · GRAPHQL', 'KRISLINECONSULTING.COM'],
      },
      {
        kind: 'card',
        title: 'Then the job title',
        body: "Masai School, then Brainerhub: 3+ concurrent client projects solo-owned, team-lead duties and a 'Rising Star' award in year one.",
        meta: ['2023 → NH-48, NEXT CHAPTER'],
      },
    ],
  },
  {
    id: 'ai-flagships',
    eyebrow: 'DETOUR — THE AI FLAGSHIPS',
    title: 'Shipping intelligence, not demos',
    style: 'holo',
    mode: 'world',
    zone: 5,
    anchorT: 0.4,
    scrollLen: 0.085,
    spanMeters: 190,
    panels: [
      {
        kind: 'intro',
        title: 'AI-native products',
        body: 'Not CRUD with a chatbot bolted on. Agents that act, models that trade, orchestrators that ship code.',
      },
      {
        kind: 'card',
        title: 'AI-Trader',
        color: '#00e5ff',
        body: 'Dual-model ML for NSE F&O intraday options: macro regime detection + tick-level order flow. Walk-forward validated; risk caps enforced at the execution layer.',
        meta: [
          'PYTHON · XGBOOST · TIMESCALEDB · FASTAPI',
          '1% MAX LOSS/TRADE · 5% DAILY CAP · ZERODHA KITE',
        ],
        link: { label: 'github/AI-trader', href: 'https://github.com/aaryansinha16/AI-trader' },
        repo: 'AI-trader',
      },
      {
        kind: 'card',
        title: 'AIFlowo',
        color: '#ff2e88',
        body: 'An agent that does things: intent parser → task planner → tool selection → real browser execution with permission layers. Forms, job applications, flights, social.',
        meta: ['NEXT.JS · NESTJS · PLAYWRIGHT · REDIS', 'OTP-AWARE FLOWS · CONTAINERISED WORKERS'],
        link: { label: 'github/aiflowo', href: 'https://github.com/aaryansinha16/aiflowo' },
        repo: 'aiflowo',
      },
      {
        kind: 'card',
        title: 'Maestro',
        color: '#b98aff',
        body: 'Turns Claude Code into an autonomous workforce: scheduled sessions across repos in parallel, PR-first, quality-gated — tests, lint and types before any PR opens.',
        meta: [
          'TYPESCRIPT · HONO · SQLITE · OCTOKIT',
          '6 SKIP RULES · 5-STRIKE AUTO-PAUSE · COST BUDGETS',
        ],
        link: { label: 'github/Maestro', href: 'https://github.com/aaryansinha16/Maestro' },
        repo: 'Maestro',
      },
      {
        kind: 'card',
        title: 'Devovia',
        color: '#39ff88',
        body: 'Developer command center: Yjs CRDT collaborative sessions, drag-drop runbooks with live logs, and a natural-language command interface. Phase 1 shipped solo in two weeks.',
        meta: ['NEXT.JS 15 · NESTJS · YJS · TIPTAP', 'RAILWAY · VERCEL · GITHUB ACTIONS'],
        link: { label: 'devovia.com', href: 'https://devovia.com' },
      },
    ],
  },
]
