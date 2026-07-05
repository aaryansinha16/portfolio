import { useEffect, useRef } from 'react'
import { FUTURE_PLANS } from '../content'
import { flightOf } from '../experience/detours/DetourManager'
import { useJourney } from '../state/useJourney'
import { roadAudio } from './AudioEngine'

/**
 * The epilogue's readout: future plans and goals, stamped in one at a time
 * as the plane climbs into the morning. Robotic framing, mono type, a
 * top-to-bottom reveal and a little UI click per block (owner spec).
 * Driven from scroll like everything else — scrubbing back retracts them.
 */

const THRESHOLDS = [0.22, 0.46, 0.7]

export function FlightPlans() {
  const rootRef = useRef<HTMLDivElement>(null)
  const blockRefs = useRef<(HTMLDivElement | null)[]>([])
  const shown = useRef<boolean[]>(FUTURE_PLANS.map(() => false))

  useEffect(() => {
    const apply = (scroll: number) => {
      const root = rootRef.current
      if (!root) return
      const t = flightOf(scroll)
      root.style.visibility = t > 0.04 ? 'visible' : 'hidden'
      FUTURE_PLANS.forEach((_, i) => {
        const el = blockRefs.current[i]
        if (!el) return
        const on = t >= THRESHOLDS[i]
        if (on && !shown.current[i]) {
          shown.current[i] = true
          el.classList.add('is-on')
          roadAudio.uiClick()
        } else if (!on && shown.current[i]) {
          shown.current[i] = false
          el.classList.remove('is-on')
        }
      })
    }
    apply(useJourney.getState().progress)
    return useJourney.subscribe((s) => s.progress, apply)
  }, [])

  return (
    <div ref={rootRef} className="flight-plans" style={{ visibility: 'hidden' }} aria-hidden>
      {FUTURE_PLANS.map((plan, i) => (
        <div
          key={plan.tag}
          ref={(el) => {
            blockRefs.current[i] = el
          }}
          className="flight-plans__block"
        >
          <p className="flight-plans__tag">
            [{String(i + 1).padStart(2, '0')}] {plan.tag}_
          </p>
          <p className="flight-plans__text">{plan.text}</p>
        </div>
      ))}
    </div>
  )
}
