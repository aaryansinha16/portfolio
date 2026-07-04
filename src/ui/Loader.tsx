import { useEffect, useState } from 'react'
import { useJourney } from '../state/useJourney'

/**
 * Minimal ignition cover: hides the first-frame pop, fades once the WebGL
 * context is live. Phase 6 replaces this with the fuel-gauge/odometer
 * loading experience streaming real asset progress.
 */
export function Loader() {
  const ready = useJourney((s) => s.ready)
  const [gone, setGone] = useState(false)

  useEffect(() => {
    if (!ready) return
    const t = window.setTimeout(() => setGone(true), 700)
    return () => window.clearTimeout(t)
  }, [ready])

  if (gone) return null
  return (
    <div className={`loader${ready ? ' is-done' : ''}`}>
      <p className="loader__mark">THE ROAD TRIP</p>
      <p className="loader__sub">starting engine…</p>
    </div>
  )
}
