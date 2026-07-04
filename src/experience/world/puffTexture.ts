import { CanvasTexture } from 'three'

/**
 * Soft radial puff — ONE shared texture for smoke, steam and dust.
 * Singleton on purpose: per-mount CanvasTextures leaked GPU memory across
 * chapter roundtrips (material.dispose() never disposes .map).
 */
let cached: CanvasTexture | null = null

export function makePuffTexture(): CanvasTexture {
  if (cached) return cached
  const size = 64
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')!
  const grad = ctx.createRadialGradient(32, 32, 2, 32, 32, 30)
  grad.addColorStop(0, 'rgba(255,255,255,0.9)')
  grad.addColorStop(0.55, 'rgba(255,255,255,0.35)')
  grad.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, size, size)
  cached = new CanvasTexture(canvas)
  return cached
}
