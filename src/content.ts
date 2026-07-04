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
    tagline: 'AI-Trader, AIFlowo, Parambhakti, Devovia — shipping intelligence, not demos.',
  },
  {
    eyebrow: 'CHAPTER 06 — THE CIRCUIT',
    title: 'Beyond the Map',
    tagline: 'The road becomes the board. Let’s build the next thing — get in touch.',
  },
] as const

export const CONTACT = {
  email: 'aaryansinha16@gmail.com',
  // TODO(owner): fill real profile URLs before Phase 5 contact section ships.
  github: '',
  linkedin: '',
} as const
