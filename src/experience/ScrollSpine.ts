import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Lenis from 'lenis'
import { useJourney } from '../state/useJourney'
import { CHAPTER_MARKS, chapterAtProgress } from './spline/roadPath'
import { PREFERS_REDUCED_MOTION, START_CHAPTER } from '../utils/query'

/**
 * THE scroll spine (prime directive #1). Lenis provides momentum, one
 * ScrollTrigger scrubs one master timeline, and normalized progress lands in
 * the Zustand store. Nothing else in the app may listen to scroll or animate
 * the camera. Set-pieces in later phases are added as labeled tweens on the
 * master timeline (position === progress, since its duration is 1).
 */

/** Page height in viewports. Tune for pacing: higher = slower, calmer drive. */
export const SCROLL_PAGES = 18
/** Scrub smoothing — the ONLY camera smoothing in the app (see CLAUDE.md burns). */
export const SCRUB = 0.8

let lenis: Lenis | null = null
let master: gsap.core.Timeline | null = null

export function getMasterTimeline(): gsap.core.Timeline | null {
  return master
}

export function scrollToChapter(chapter: number, immediate = false): void {
  const mark = CHAPTER_MARKS[Math.max(0, Math.min(CHAPTER_MARKS.length - 2, chapter))]
  scrollToProgress(chapter === 0 ? 0 : mark + 0.004, immediate)
}

export function scrollToProgress(p: number, immediate = false): void {
  if (!lenis) return
  lenis.scrollTo(p * lenis.limit, {
    immediate,
    duration: 1.6,
    lock: immediate,
  })
}

export function initScrollSpine(): () => void {
  gsap.registerPlugin(ScrollTrigger)

  lenis = new Lenis({
    duration: 1.15,
    smoothWheel: !PREFERS_REDUCED_MOTION,
    touchMultiplier: 1.4,
  })
  lenis.on('scroll', ScrollTrigger.update)

  const tick = (time: number) => lenis?.raf(time * 1000)
  gsap.ticker.add(tick)
  gsap.ticker.lagSmoothing(0)

  const proxy = { p: 0 }
  master = gsap.timeline({
    defaults: { ease: 'none' },
    scrollTrigger: {
      trigger: document.body,
      start: 'top top',
      end: 'bottom bottom',
      scrub: SCRUB,
    },
  })
  master.to(proxy, {
    p: 1,
    duration: 1,
    onUpdate: () => {
      const state = useJourney.getState()
      state.setProgress(proxy.p, state.velocity)
      const chapter = chapterAtProgress(proxy.p)
      if (chapter !== state.chapter) state.setChapter(chapter)
    },
  })

  // ?chapter=N — jump once layout/measurements exist.
  const startChapter = START_CHAPTER
  if (startChapter != null) {
    requestAnimationFrame(() => {
      ScrollTrigger.refresh()
      scrollToChapter(startChapter, true)
    })
  }

  return () => {
    master?.scrollTrigger?.kill()
    master?.kill()
    master = null
    gsap.ticker.remove(tick)
    lenis?.destroy()
    lenis = null
  }
}
