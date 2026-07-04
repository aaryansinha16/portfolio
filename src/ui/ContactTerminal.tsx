import { useEffect, useRef, useState } from 'react'
import { CONTACT } from '../content'
import { useJourney } from '../state/useJourney'
import { clamp01, normRange, smoothstep } from '../utils/math'

/**
 * The contact section at the end of the circuit board — terminal-styled
 * direct links (plan Phase 5). Fades in over the final stretch of the
 * journey, tied to spline progress like every other fade.
 */
export function ContactTerminal() {
  const rootRef = useRef<HTMLDivElement>(null)
  const [hasResume, setHasResume] = useState(false)

  useEffect(() => {
    // show the résumé button only if the file actually exists — SPA
    // fallbacks answer 200 with text/html, so check the content type too
    fetch('/resume.pdf', { method: 'HEAD' })
      .then((r) => setHasResume(r.ok && (r.headers.get('content-type') ?? '').includes('pdf')))
      .catch(() => {})
  }, [])

  useEffect(() => {
    const apply = (p: number) => {
      const el = rootRef.current
      if (!el) return
      const o = smoothstep(normRange(p, 0.955, 0.985))
      el.style.opacity = o.toFixed(3)
      el.style.visibility = o < 0.01 ? 'hidden' : 'visible'
      el.style.pointerEvents = o > 0.5 ? 'auto' : 'none'
      el.style.transform = `translateY(${((1 - clamp01(o)) * 18).toFixed(1)}px)`
    }
    apply(useJourney.getState().splineProgress)
    return useJourney.subscribe((s) => s.splineProgress, apply)
  }, [])

  return (
    <div ref={rootRef} className="contact" style={{ visibility: 'hidden' }}>
      <div className="contact__bar">
        <span className="contact__dot" />
        <span className="contact__dot" />
        <span className="contact__dot" />
        <span className="contact__path">~/the-road-trip</span>
      </div>
      <div className="contact__body">
        <p>
          <span className="contact__prompt">$</span> whoami
        </p>
        <p className="contact__out">AI Engineer &amp; Full-Stack Architect — 5+ yrs production</p>
        <p>
          <span className="contact__prompt">$</span> ls ./flagships
        </p>
        <p className="contact__out">ai-trader/ aiflowo/ maestro/ devovia.com</p>
        <p>
          <span className="contact__prompt">$</span> contact --now
          <span className="contact__cursor" />
        </p>
        <nav className="contact__links">
          <a href={`mailto:${CONTACT.email}`}>EMAIL</a>
          <a href={CONTACT.github} target="_blank" rel="noopener noreferrer">
            GITHUB
          </a>
          <a href={CONTACT.linkedin} target="_blank" rel="noopener noreferrer">
            LINKEDIN
          </a>
          <a href={CONTACT.medium} target="_blank" rel="noopener noreferrer">
            MEDIUM
          </a>
          {hasResume && (
            <a href="/resume.pdf" download>
              RÉSUMÉ ↓
            </a>
          )}
        </nav>
      </div>
    </div>
  )
}
