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
    tagline: 'A bicycle, a dirt road, and the first time I asked how software actually works.',
  },
  {
    eyebrow: 'CHAPTER 02 — TOWN MORNING',
    title: 'Learning to Build',
    tagline: '12+ freelance projects shipped before "developer" was a job title. First motorcycle.',
  },
  {
    eyebrow: 'CHAPTER 03 — NH-48, NOON',
    title: 'Highway Speed',
    tagline: 'Full-stack years at Brainerhub: production systems, real deadlines, the R15.',
  },
  {
    eyebrow: 'CHAPTER 04 — CITY DUSK',
    title: 'Heavier Machine',
    tagline: 'Engineering lead at Eigenlytics × Luxia. Bigger systems, bigger calls, the Safari.',
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
} as const

/** Highway hoardings — skills as sun-bleached roadside ads (DESIGN: hoardings double as skill boards). */
export const SKILL_BOARDS: readonly { title: string; sub: string }[] = [
  { title: 'REACT · NEXT.JS · TS', sub: 'production UI since the freelance years' },
  { title: 'NESTJS · NODE · POSTGRES', sub: 'APIs that survive real traffic' },
  { title: 'THREE.JS · WEBGL', sub: 'you are driving through one right now' },
  { title: 'REAL-TIME · YJS · SOCKETS', sub: 'collaborative editing, live everything' },
  { title: '12+ PROJECTS SHIPPED', sub: 'before "developer" was a job title' },
  { title: 'AWS · DOCKER · CI/CD', sub: 'deploys on push, sleeps at night' },
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
