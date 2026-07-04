export function clamp(v: number, min: number, max: number): number {
  return v < min ? min : v > max ? max : v
}

export function clamp01(v: number): number {
  return v < 0 ? 0 : v > 1 ? 1 : v
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t
}

/** Map v from [inMin, inMax] to [0, 1], clamped. */
export function normRange(v: number, inMin: number, inMax: number): number {
  return clamp01((v - inMin) / (inMax - inMin))
}

/** Frame-rate independent exponential smoothing (Freya Holmér's damp). */
export function damp(current: number, target: number, lambda: number, dt: number): number {
  return lerp(current, target, 1 - Math.exp(-lambda * dt))
}

export function smoothstep(t: number): number {
  const x = clamp01(t)
  return x * x * (3 - 2 * x)
}
