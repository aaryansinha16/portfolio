/**
 * Deterministic PRNG (mulberry32). Instanced prop jitter must be stable across
 * chapter mount/unmount cycles, so world generation never uses Math.random.
 */
export function createRng(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Random in [min, max). */
export function rngRange(rng: () => number, min: number, max: number): number {
  return min + rng() * (max - min)
}
