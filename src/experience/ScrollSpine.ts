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
   * over — the ride drives itself to the road's end (and off it).
   *
   * v1 died silently on real hardware: it cancelled on ANY wheel event,
   * and a trackpad's momentum tail fires wheel events for 1–2s after the
   * fingers lift — the very scroll that ENTERS ch6 killed it every time
   * (headless probes send no wheel events, so the gate stayed green).
   * v2 waits for a QUIET PERIOD instead: once no input has arrived for
   * 0.8s inside ch6, the wheel turns itself; any new input pauses it and
   * restarts the quiet timer; leaving ch6 disarms and re-arms fresh. */
  let apState: 'disarmed' | 'waiting' | 'driving' | 'done' = 'disarmed'
  let apQuiet = 0 // seconds since the last user input
  let apSpeed = 0 // scroll px/s
  let apRamp = 0 // seconds since engage (eases in)
  const onApInput = () => {
    apQuiet = 0
    if (apState === 'driving') apState = 'waiting'
  }
  const AP_INPUT_EVENTS: readonly (keyof WindowEventMap)[] = [
    'wheel',
    'touchstart',
    'pointerdown',
    'keydown',
  ]
  AP_INPUT_EVENTS.forEach((e) => window.addEventListener(e, onApInput, { passive: true }))
  const unsubAutopilot = useJourney.subscribe(
    (s) => s.chapter,
    (chapter) => {
      if (chapter < 6) {
        apState = 'disarmed'
      } else if (apState === 'disarmed' && !PREFERS_REDUCED_MOTION) {
        apState = 'waiting'
        apQuiet = 0
      }
    },
  )

  const tick = (time: number, deltaMs: number) => {
    lenis?.raf(time * 1000)
    if (!lenis) return
    const dt = deltaMs / 1000
    if (apState === 'waiting') {
      apQuiet += dt
      if (apQuiet >= 0.8) {
        if (lenis.scroll >= lenis.limit - 2) {
          apState = 'done'
        } else {
          apState = 'driving'
          apRamp = 0
          // flat out (owner, twice) — the rest of ch6 in ~4s
          apSpeed = Math.max(200, (lenis.limit - lenis.scroll) / 4)
        }
      }
    } else if (apState === 'driving') {
      apRamp += dt
      const ease = Math.min(1, apRamp / 1.0) // quick pull-away
      const next = Math.min(lenis.scroll + apSpeed * ease * dt, lenis.limit)
      lenis.scrollTo(next, { immediate: true })
      if (next >= lenis.limit - 1) apState = 'done'
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
    AP_INPUT_EVENTS.forEach((e) => window.removeEventListener(e, onApInput))
    master?.scrollTrigger?.kill()
    master?.kill()
    master = null
    gsap.ticker.remove(tick)
    lenis?.destroy()
    lenis = null
  }
}
