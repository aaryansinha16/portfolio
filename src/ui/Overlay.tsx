import { useEffect, useRef } from 'react'
import { CHAPTER_COPY } from '../content'
import { useJourney } from '../state/useJourney'
import { CHAPTER_MARKS } from '../experience/spline/roadPath'
import { scrollToChapter } from '../experience/ScrollSpine'
import { clamp01, normRange } from '../utils/math'

/**
 * The DOM layer riding above the canvas. All fades are tied to scroll
 * progress (DESIGN.md: never on timers) via transient store subscriptions
 * that write styles directly — zero React re-renders during scroll.
 */
export function Overlay() {
  return (
    <div className="overlay">
      <TitleCard />
      <ScrollHint />
      <ProgressRail />
    </div>
  )
}

function TitleCard() {
  const chapter = useJourney((s) => s.chapter)
  const ref = useRef<HTMLDivElement>(null)
  const copy = CHAPTER_COPY[chapter]

  useEffect(() => {
    const apply = (p: number) => {
      const el = ref.current
      if (!el) return
      const zoneStart = CHAPTER_MARKS[chapter]
      const zoneEnd = CHAPTER_MARKS[chapter + 1]
      const zt = normRange(p, zoneStart, zoneEnd)
      // Prologue is readable immediately; other titles rise in shortly after
      // the boundary, and every card bows out at ~2/3 of its chapter.
      const fadeIn = chapter === 0 ? 1 : normRange(zt, 0.03, 0.14)
      const fadeOut = 1 - normRange(zt, 0.6, 0.8)
      const o = clamp01(Math.min(fadeIn, fadeOut))
      el.style.opacity = o.toFixed(3)
      el.style.transform = `translateY(${((1 - o) * 14).toFixed(2)}px)`
    }
    apply(useJourney.getState().progress)
    return useJourney.subscribe((s) => s.progress, apply)
  }, [chapter])

  return (
    <div ref={ref} className="title-card">
      <p className="title-card__eyebrow">{copy.eyebrow}</p>
      <h1 className="title-card__title">{copy.title}</h1>
      <p className="title-card__tagline">{copy.tagline}</p>
    </div>
  )
}

function ScrollHint() {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const apply = (p: number) => {
      const el = ref.current
      if (!el) return
      const o = 1 - normRange(p, 0.002, 0.014)
      el.style.opacity = o.toFixed(3)
      el.style.visibility = o <= 0.01 ? 'hidden' : 'visible'
    }
    apply(useJourney.getState().progress)
    return useJourney.subscribe((s) => s.progress, apply)
  }, [])

  return (
    <div ref={ref} className="scroll-hint" aria-hidden>
      <span className="scroll-hint__label">Scroll to drive</span>
      <span className="scroll-hint__chevron" />
    </div>
  )
}

function ProgressRail() {
  const chapter = useJourney((s) => s.chapter)
  const markerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const apply = (p: number) => {
      const el = markerRef.current
      if (el) el.style.top = `${(clamp01(p) * 100).toFixed(3)}%`
    }
    apply(useJourney.getState().progress)
    return useJourney.subscribe((s) => s.progress, apply)
  }, [])

  return (
    <nav className="rail" aria-label="Journey chapters">
      <div className="rail__line" />
      <div ref={markerRef} className="rail__marker" />
      {CHAPTER_COPY.map((c, i) => (
        <button
          key={c.eyebrow}
          className={`rail__dot${i === chapter ? ' is-active' : ''}`}
          style={{ top: `${CHAPTER_MARKS[i] * 100}%` }}
          onClick={() => scrollToChapter(i)}
          aria-label={`Drive to ${c.title}`}
          data-title={c.title}
        />
      ))}
    </nav>
  )
}
