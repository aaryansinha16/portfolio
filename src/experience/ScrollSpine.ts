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

  /* Ch6 autopilot (owner request): entering the circuit hands the wheel
   * over — the ride drives itself to the road's end (and off it). Driven
   * per-tick with immediate scrollTo steps: a single long lenis tween dies
   * to any trackpad inertia, which is why v1 "never happened". Any real
   * input hands control back; leaving ch6 re-arms it for the next visit. */
  let apState: 'armed' | 'running' | 'done' = 'armed'
  let apSpeed = 0 // scroll px/s
  let apRamp = 0 // seconds since engage (eases in)
  const cancelAutopilot = () => {
    if (apState === 'running') apState = 'done'
  }
  const AP_CANCEL_EVENTS: readonly (keyof WindowEventMap)[] = [
    'wheel',
    'touchstart',
    'pointerdown',
    'keydown',
  ]
  AP_CANCEL_EVENTS.forEach((e) => window.addEventListener(e, cancelAutopilot, { passive: true }))
  const unsubAutopilot = useJourney.subscribe(
    (s) => s.chapter,
    (chapter) => {
      if (chapter < 6) {
        apState = 'armed'
      } else if (chapter === 6 && apState === 'armed' && !PREFERS_REDUCED_MOTION && lenis) {
        apState = 'running'
        apRamp = -0.7 // a short beat before the wheel turns itself
        apSpeed = Math.max(60, (lenis.limit - lenis.scroll) / 15)
      }
    },
  )

  const tick = (time: number, deltaMs: number) => {
    lenis?.raf(time * 1000)
    if (apState === 'running' && lenis) {
      if (lenis.scroll >= lenis.limit - 1) {
        apState = 'done'
      } else {
        apRamp += deltaMs / 1000
        if (apRamp > 0) {
          const ease = Math.min(1, apRamp / 2.2) // gentle pull-away
          const next = Math.min(lenis.scroll + apSpeed * ease * (deltaMs / 1000), lenis.limit)
          lenis.scrollTo(next, { immediate: true })
        }
      }
    }
  }
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
    AP_CANCEL_EVENTS.forEach((e) => window.removeEventListener(e, cancelAutopilot))
    master?.scrollTrigger?.kill()
    master?.kill()
    master = null
    gsap.ticker.remove(tick)
    lenis?.destroy()
    lenis = null
  }
}
