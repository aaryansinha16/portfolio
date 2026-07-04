import { useEffect, useRef, useState } from 'react'
import { useJourney } from '../state/useJourney'

/**
 * The ignition loader: a fuel-gauge needle sweeps as real startup signals
 * land (mount → fonts → WebGL context → first frames), then the cover
 * lifts. Everything is procedural so there are no asset bytes to track —
 * the gauge measures the boot, not a download.
 */
export function Loader() {
  const ready = useJourney((s) => s.ready)
  const [gone, setGone] = useState(false)
  const [pct, setPct] = useState(0.08)
  const [done, setDone] = useState(false)
  const mountedAt = useRef(performance.now())

  useEffect(() => {
    let alive = true
    document.fonts?.ready.then(() => alive && setPct((p) => Math.max(p, 0.45)))
    return () => {
      alive = false
    }
  }, [])

  useEffect(() => {
    if (!ready) return
    setPct((p) => Math.max(p, 0.8))
    let alive = true
    // a couple of painted frames = the world is actually on screen
    requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        if (!alive) return
        setPct(1)
        // hold long enough that the sweep reads as intentional
        const elapsed = performance.now() - mountedAt.current
        const wait = Math.max(250, 850 - elapsed)
        window.setTimeout(() => {
          if (!alive) return
          setDone(true)
          window.setTimeout(() => alive && setGone(true), 700)
        }, wait)
      }),
    )
    return () => {
      alive = false
    }
  }, [ready])

  if (gone) return null
  const angle = -80 + pct * 160
  return (
    <div className={`loader${done ? ' is-done' : ''}`}>
      <p className="loader__mark">THE ROAD TRIP</p>
      <svg className="loader__gauge" viewBox="0 0 120 70" aria-hidden>
        {/* dial */}
        <path
          d="M 14 62 A 52 52 0 0 1 106 62"
          fill="none"
          stroke="rgba(201,207,221,0.22)"
          strokeWidth="3"
          strokeLinecap="round"
        />
        {/* ticks */}
        {[-80, -40, 0, 40, 80].map((a) => (
          <line
            key={a}
            x1="60"
            y1="14"
            x2="60"
            y2="20"
            stroke="rgba(201,207,221,0.5)"
            strokeWidth="2"
            transform={`rotate(${a} 60 62)`}
          />
        ))}
        <text x="22" y="58" className="loader__gauge-label">
          E
        </text>
        <text x="93" y="58" className="loader__gauge-label">
          F
        </text>
        {/* needle */}
        <g style={{ transform: `rotate(${angle}deg)`, transformOrigin: '60px 62px' }}>
          <line
            x1="60"
            y1="62"
            x2="60"
            y2="20"
            stroke="#e8b04b"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
        </g>
        <circle cx="60" cy="62" r="4" fill="#e8b04b" />
      </svg>
      <p className="loader__sub">{done ? 'ready — scroll to drive' : 'starting engine…'}</p>
    </div>
  )
}
