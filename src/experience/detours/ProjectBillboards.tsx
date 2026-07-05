import { useEffect, useMemo, useState } from 'react'
import { CanvasTexture, SRGBColorSpace, Vector3 } from 'three'
import { CHAPTER_MARKS, totalLength } from '../spline/roadPath'
import { getZoneRoad } from '../world/roadSamples'
import { DETOUR_WINDOWS } from './DetourManager'
import { DETOURS, type DetourPanel } from '../../content'

/**
 * The AI-flagship showroom (owner feedback: no DOM cards at night — the
 * projects ARE the billboards). Four big clickable neon boards arranged
 * around the ch5 pause point: hover glows, click opens the project.
 * Star counts get painted onto the canvas once GitHub answers.
 */

function drawBillboard(panel: DetourPanel, stars: number | null): CanvasTexture {
  const w = 1024
  const h = 640
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')!
  const accent = panel.color ?? '#00e5ff'

  ctx.fillStyle = '#070914'
  ctx.fillRect(0, 0, w, h)
  ctx.strokeStyle = accent
  ctx.lineWidth = 10
  ctx.strokeRect(14, 14, w - 28, h - 28)

  // title in neon
  ctx.textAlign = 'left'
  ctx.textBaseline = 'top'
  ctx.fillStyle = accent
  ctx.font = "900 96px 'Arial Narrow', 'Arial Black', sans-serif"
  ctx.shadowColor = accent
  ctx.shadowBlur = 34
  ctx.fillText(panel.title.toUpperCase(), 56, 52, w - 112)
  ctx.shadowBlur = 12
  ctx.fillText(panel.title.toUpperCase(), 56, 52, w - 112)
  ctx.shadowBlur = 0

  // body, wrapped
  ctx.fillStyle = '#c9d2e4'
  ctx.font = "400 34px 'Helvetica Neue', Arial, sans-serif"
  const words = panel.body.split(' ')
  let line = ''
  let y = 196
  for (const word of words) {
    const test = line ? `${line} ${word}` : word
    if (ctx.measureText(test).width > w - 130 && line) {
      ctx.fillText(line, 58, y)
      line = word
      y += 46
      if (y > 420) break
    } else {
      line = test
    }
  }
  if (line && y <= 420) ctx.fillText(line, 58, y)

  // stack meta
  ctx.fillStyle = 'rgba(201, 210, 228, 0.55)'
  ctx.font = "500 26px 'Courier New', monospace"
  if (panel.meta?.[0]) ctx.fillText(panel.meta[0], 58, 486)

  // footer: open + stars
  ctx.fillStyle = accent
  ctx.font = "700 34px 'Courier New', monospace"
  const footer = `OPEN ${panel.link?.label ?? ''} ↗${stars != null ? `   ★ ${stars}` : ''}`
  ctx.fillText(footer, 58, 556)

  const tex = new CanvasTexture(canvas)
  tex.colorSpace = SRGBColorSpace
  tex.anisotropy = 4
  return tex
}

interface BoardSpot {
  panel: DetourPanel
  pos: Vector3
  yaw: number
}

const texCache = new Map<string, CanvasTexture>()

function getBillboardTexture(panel: DetourPanel, stars: number | null): CanvasTexture {
  const key = `${panel.title}:${stars ?? 'x'}`
  const hit = texCache.get(key)
  if (hit) return hit
  const tex = drawBillboard(panel, stars)
  if (stars != null) {
    // the starless first paint is obsolete now — free it
    const old = texCache.get(`${panel.title}:x`)
    if (old) {
      old.dispose()
      texCache.delete(`${panel.title}:x`)
    }
  }
  texCache.set(key, tex)
  return tex
}

export function ProjectBillboards() {
  const [hovered, setHovered] = useState<string | null>(null)
  const [stars, setStars] = useState<Record<string, number>>({})

  // fetch stars once; textures repaint when they land
  useEffect(() => {
    const def = DETOURS.find((d) => d.id === 'ai-flagships')
    if (!def) return
    let alive = true
    def.panels.forEach((p) => {
      if (!p.repo) return
      const key = `gh-stars:${p.repo}`
      const cached = sessionStorage.getItem(key)
      if (cached != null) {
        setStars((s) => ({ ...s, [p.title]: Number(cached) }))
        return
      }
      fetch(`https://api.github.com/repos/aaryansinha16/${p.repo}`)
        .then((r) => (r.ok ? r.json() : null))
        .then((data: { stargazers_count?: number } | null) => {
          if (!alive || typeof data?.stargazers_count !== 'number') return
          sessionStorage.setItem(key, String(data.stargazers_count))
          setStars((s) => ({ ...s, [p.title]: data.stargazers_count! }))
        })
        .catch(() => {})
    })
    return () => {
      alive = false
    }
  }, [])

  const spots = useMemo<BoardSpot[]>(() => {
    const window_ = DETOUR_WINDOWS.find((w) => w.def.id === 'ai-flagships')
    if (!window_) return []
    const road = getZoneRoad(5)
    const startM = (window_.spline - CHAPTER_MARKS[5]) * totalLength
    const spanM = window_.span * totalLength
    const panels = window_.def.panels.filter((p) => p.kind === 'card')
    const pos = new Vector3()
    // spread along the whole slow-motion run, alternating sides — the ride
    // rolls past one board at a time instead of parking in a cluster
    // (neonField clears the towers out of this corridor)
    return panels.map((panel, i) => {
      const side = i % 2 === 0 ? -1 : 1
      const m = startM + 14 + (i * (spanM - 26)) / Math.max(1, panels.length - 1)
      const s = road.at(m)
      road.place(m, 13.5 * side, pos)
      return {
        panel,
        pos: new Vector3(pos.x, pos.y + 5.6, pos.z),
        yaw: Math.atan2(s.tx, s.tz) + Math.PI + side * 0.22,
      }
    })
  }, [])

  useEffect(() => {
    document.body.style.cursor = hovered ? 'pointer' : ''
    return () => {
      document.body.style.cursor = ''
    }
  }, [hovered])

  return (
    <group>
      {spots.map(({ panel, pos, yaw }) => {
        const starCount = stars[panel.title] ?? null
        const texture = getBillboardTexture(panel, starCount)
        const hot = hovered === panel.title
        return (
          <group key={`${panel.title}-${starCount ?? 'x'}`} position={pos} rotation={[0, yaw, 0]}>
            {/* backing + legs */}
            <mesh position={[0, 0, -0.14]}>
              <boxGeometry args={[10.6, 6.6, 0.2]} />
              <meshStandardMaterial color="#0a0d1a" roughness={0.9} />
            </mesh>
            <mesh position={[-3.4, -5.2, -0.2]}>
              <boxGeometry args={[0.24, 4.4, 0.24]} />
              <meshStandardMaterial color="#12162c" roughness={0.8} />
            </mesh>
            <mesh position={[3.4, -5.2, -0.2]}>
              <boxGeometry args={[0.24, 4.4, 0.24]} />
              <meshStandardMaterial color="#12162c" roughness={0.8} />
            </mesh>
            <mesh
              scale={hot ? 1.04 : 1}
              onClick={(e) => {
                e.stopPropagation()
                if (panel.link) window.open(panel.link.href, '_blank', 'noopener')
              }}
              onPointerOver={(e) => {
                e.stopPropagation()
                setHovered(panel.title)
              }}
              onPointerOut={() => setHovered((h) => (h === panel.title ? null : h))}
            >
              <planeGeometry args={[10.2, 6.2]} />
              <meshStandardMaterial
                color="#000000"
                emissive="#ffffff"
                emissiveMap={texture}
                map={texture}
                emissiveIntensity={hot ? 2.1 : 1.45}
                roughness={0.65}
                toneMapped={false}
              />
            </mesh>
          </group>
        )
      })}
    </group>
  )
}
