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
      if (!root) return
      const t = normRange(scroll, window_.scrollStart, window_.scrollStart + window_.scrollLen)
      const active = t > 0.0005 && t < 0.9995
      root.style.visibility = active ? 'visible' : 'hidden'
      // world mode is a header only — clicks must reach the canvas below
      root.style.pointerEvents = active && track ? 'auto' : 'none'
      if (!active) return
      // edge fades; panels ride from right to left across the window
      const o = Math.min(smoothstep(clamp01(t / 0.07)), smoothstep(clamp01((1 - t) / 0.07)))
      root.style.opacity = o.toFixed(3)
      if (!track) return
      const overflow = Math.max(0, track.scrollWidth - root.clientWidth)
      const inner = smoothstep(clamp01((t - 0.05) / 0.9))
      const tx = -inner * overflow
      track.style.transform = `translateX(${tx.toFixed(1)}px)`
      // craft pass: boards breathe as they cross the center of the stage
      const vw = root.clientWidth
      for (const child of Array.from(track.children) as HTMLElement[]) {
        const center = child.offsetLeft + tx + child.offsetWidth / 2 - vw / 2
        const k = clamp01(1 - Math.abs(center) / (vw * 0.7))
        child.style.transform = `translateY(${((1 - k) * 16).toFixed(1)}px) rotate(${(
          (center / vw) *
          2.2
        ).toFixed(2)}deg) scale(${(0.96 + k * 0.05).toFixed(3)})`
      }
    }
    apply(useJourney.getState().progress)
    return useJourney.subscribe((s) => s.progress, apply)
  }, [window_])

  const def = window_.def
  const world = def.mode === 'world'
  return (
    <div
      ref={rootRef}
      className={`detour detour--${def.style}${world ? ' detour--world' : ''}`}
      style={{ visibility: 'hidden' }}
    >
      {!world && <div className="detour__scrim" />}
      <header className="detour__header">
        <p className="detour__eyebrow">{def.eyebrow}</p>
        <h2 className="detour__title">{def.title}</h2>
        <p className="detour__hint">{world ? 'click a billboard to open ↗' : 'keep scrolling ⌄'}</p>
      </header>
      {!world && (
        <div className="detour__viewport">
          <div ref={trackRef} className="detour__track">
            {def.panels.map((p) => (
              <Panel key={p.title} panel={p} style={def.style} />
            ))}
          </div>
        </div>
      )}
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
