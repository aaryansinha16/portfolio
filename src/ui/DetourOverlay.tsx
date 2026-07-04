import { useEffect, useRef, useState } from 'react'
import { DETOURS, type DetourDef, type DetourPanel } from '../content'
import { DETOUR_WINDOWS } from '../experience/detours/DetourManager'
import { useJourney } from '../state/useJourney'
import { clamp01, normRange, smoothstep } from '../utils/math'

/**
 * The horizontal detour strips (DESIGN: the journey pauses, a strip takes
 * over). While scroll is inside a detour window the world holds still
 * (spline plateau) and vertical scroll translates the panel row instead.
 * Direct-DOM transforms via store subscription — no re-renders per frame.
 */

function useGithubStars(repo?: string): number | null {
  const [stars, setStars] = useState<number | null>(null)
  useEffect(() => {
    if (!repo) return
    const key = `gh-stars:${repo}`
    const cached = sessionStorage.getItem(key)
    if (cached != null) {
      const n = Number(cached)
      if (Number.isFinite(n)) setStars(n)
      return
    }
    let alive = true
    fetch(`https://api.github.com/repos/aaryansinha16/${repo}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data: { stargazers_count?: number } | null) => {
        if (!alive || !data || typeof data.stargazers_count !== 'number') return
        sessionStorage.setItem(key, String(data.stargazers_count))
        setStars(data.stargazers_count)
      })
      .catch(() => {})
    return () => {
      alive = false
    }
  }, [repo])
  return stars
}

function Panel({ panel, style }: { panel: DetourPanel; style: DetourDef['style'] }) {
  const stars = useGithubStars(panel.repo)
  const accent = panel.color
  return (
    <article
      className={`detour-panel detour-panel--${style} detour-panel--${panel.kind}`}
      style={accent ? ({ '--accent': accent } as React.CSSProperties) : undefined}
    >
      <h3 className="detour-panel__title">{panel.title}</h3>
      <p className="detour-panel__body">{panel.body}</p>
      {panel.meta && (
        <div className="detour-panel__meta">
          {panel.meta.map((line) => (
            <span key={line}>{line}</span>
          ))}
        </div>
      )}
      {(panel.link || stars != null) && (
        <div className="detour-panel__footer">
          {panel.link && (
            <a href={panel.link.href} target="_blank" rel="noopener noreferrer">
              {panel.link.label} ↗
            </a>
          )}
          {stars != null && <span className="detour-panel__stars">★ {stars}</span>}
        </div>
      )}
    </article>
  )
}

function DetourStrip({ index }: { index: number }) {
  const window_ = DETOUR_WINDOWS[index]
  const rootRef = useRef<HTMLDivElement>(null)
  const trackRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const apply = (scroll: number) => {
      const root = rootRef.current
      const track = trackRef.current
      if (!root || !track) return
      const t = normRange(scroll, window_.scrollStart, window_.scrollStart + window_.scrollLen)
      const active = t > 0.0005 && t < 0.9995
      root.style.visibility = active ? 'visible' : 'hidden'
      root.style.pointerEvents = active ? 'auto' : 'none'
      if (!active) return
      // edge fades; panels ride from right to left across the window
      const o = Math.min(smoothstep(clamp01(t / 0.07)), smoothstep(clamp01((1 - t) / 0.07)))
      root.style.opacity = o.toFixed(3)
      const overflow = Math.max(0, track.scrollWidth - root.clientWidth)
      const inner = smoothstep(clamp01((t - 0.05) / 0.9))
      track.style.transform = `translateX(${(-inner * overflow).toFixed(1)}px)`
    }
    apply(useJourney.getState().progress)
    return useJourney.subscribe((s) => s.progress, apply)
  }, [window_])

  const def = window_.def
  return (
    <div ref={rootRef} className={`detour detour--${def.style}`} style={{ visibility: 'hidden' }}>
      <div className="detour__scrim" />
      <header className="detour__header">
        <p className="detour__eyebrow">{def.eyebrow}</p>
        <h2 className="detour__title">{def.title}</h2>
        <p className="detour__hint">keep scrolling ⌄</p>
      </header>
      <div className="detour__viewport">
        <div ref={trackRef} className="detour__track">
          {def.panels.map((p) => (
            <Panel key={p.title} panel={p} style={def.style} />
          ))}
        </div>
      </div>
    </div>
  )
}

export function DetourOverlay() {
  return (
    <>
      {DETOURS.map((d, i) => (
        <DetourStrip key={d.id} index={i} />
      ))}
    </>
  )
}
