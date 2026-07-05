import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Lenis from 'lenis'
import { useJourney } from '../state/useJourney'
import { CHAPTER_MARKS, chapterAtProgress } from './spline/roadPath'
import { DETOUR_WINDOWS, scrollOf, splineOf } from './detours/DetourManager'
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
  // marks are spline-space; the scroll runway includes detour plateaus
  scrollToProgress(chapter === 0 ? 0 : scrollOf(mark + 0.004), immediate)
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

  // Expose the journey mapping for tuning/verify scripts (inert data —
  // the verify harness converts spline-space stops to scroll positions).
  {
    const w = window as unknown as {
      __MARKS: readonly number[]
      __toScroll: (spline: number) => number
      __DETOURS: { start: number; len: number }[]
    }
    w.__MARKS = CHAPTER_MARKS
    w.__toScroll = scrollOf
    w.__DETOURS = DETOUR_WINDOWS.map((d) => ({ start: d.scrollStart, len: d.scrollLen }))
  }

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
      const spline = splineOf(proxy.p)
      state.setProgress(proxy.p, spline)
      const chapter = chapterAtProgress(spline)
      if (chapter !== state.chapter) state.setChapter(chapter)
    },
  })

  // Ch6 autopilot (owner request): entering the circuit hands the wheel
  // over — the vehicle drives itself to the road's end. Any user scroll
  // input takes back control (lenis folds user deltas into the animation).
  let autopilotDone = false
  const unsubAutopilot = useJourney.subscribe(
    (s) => s.chapter,
    (chapter) => {
      if (chapter !== 6 || autopilotDone) return
      autopilotDone = true
      window.setTimeout(() => {
        if (!lenis || useJourney.getState().chapter !== 6) return
        lenis.scrollTo(lenis.limit, { duration: 9, easing: (t: number) => 1 - Math.pow(1 - t, 2) })
      }, 900)
    },
  )

  // ?chapter=N — jump once layout/measurements exist.
  const startChapter = START_CHAPTER
  if (startChapter != null) {
    requestAnimationFrame(() => {
      ScrollTrigger.refresh()
      scrollToChapter(startChapter, true)
    })
  }

  return () => {
    unsubAutopilot()
    master?.scrollTrigger?.kill()
    master?.kill()
    master = null
    gsap.ticker.remove(tick)
    lenis?.destroy()
    lenis = null
  }
}
