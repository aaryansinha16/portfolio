import { CanvasTexture, SRGBColorSpace } from 'three'

/**
 * Painted text panels for in-world signage (hoardings, shop boards,
 * signposts). Deliberately uses stocky system faces — road signage isn't
 * set in the UI's display type, and it avoids webfont-loading races.
 */

export interface TextPanelSpec {
  w?: number
  h?: number
  bg: string
  fg: string
  /** main line, drawn big */
  title: string
  /** optional smaller second line */
  sub?: string
  /** optional thin inset border color */
  border?: string
  /** 0..1 — fades the paint like years of sun (highway hoardings) */
  bleach?: number
}

export function makeTextPanel(spec: TextPanelSpec): CanvasTexture {
  const w = spec.w ?? 512
  const h = spec.h ?? 256
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')!

  ctx.fillStyle = spec.bg
  ctx.fillRect(0, 0, w, h)

  if (spec.border) {
    ctx.strokeStyle = spec.border
    ctx.lineWidth = Math.max(3, h * 0.02)
    const m = h * 0.06
    ctx.strokeRect(m, m, w - m * 2, h - m * 2)
  }

  ctx.fillStyle = spec.fg
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  const titleSize = spec.sub ? h * 0.3 : h * 0.36
  ctx.font = `900 ${titleSize}px 'Arial Narrow', 'Arial Black', sans-serif`
  ctx.fillText(spec.title, w / 2, spec.sub ? h * 0.42 : h * 0.5, w * 0.86)
  if (spec.sub) {
    ctx.font = `700 ${h * 0.14}px 'Arial Narrow', Arial, sans-serif`
    ctx.fillText(spec.sub, w / 2, h * 0.72, w * 0.8)
  }

  // sun-bleach: wash the whole panel toward the sky
  if (spec.bleach) {
    ctx.fillStyle = `rgba(232, 226, 208, ${spec.bleach * 0.45})`
    ctx.fillRect(0, 0, w, h)
    // a few grime streaks so it reads weathered, not clean
    ctx.fillStyle = 'rgba(60, 52, 40, 0.08)'
    for (let i = 0; i < 5; i++) {
      const x = ((i * 97) % w) + 8
      ctx.fillRect(x, 0, 6 + ((i * 31) % 14), h)
    }
  }

  const texture = new CanvasTexture(canvas)
  texture.colorSpace = SRGBColorSpace
  texture.anisotropy = 4
  return texture
}
