import { Vector3 } from 'three'
import {
  CHAPTER_MARKS,
  metersToProgress,
  pointAt,
  tangentAt,
  totalLength,
} from '../../spline/roadPath'
import { createRng, rngRange } from '../../../utils/random'
import { clamp01, lerp, smoothstep } from '../../../utils/math'

/**
 * Deterministic layout brain for the Village Dawn biome: road-relative
 * coordinates (meters along the zone, signed lateral offset), value-noise
 * terrain heights with a flat corridor around the road, field rectangles,
 * hut clusters, tree scatter. Everything is computed once and cached —
 * remounts get byte-identical geometry.
 */

const ZONE = 1
const SEED = 4101
/** Terrain rect extends this far beyond the zone along the road. */
const END_MARGIN = 45
const LATERAL = 150 // half-width of the village terrain rect
export const TERRAIN_BASE_Y = 0.035

/* ---------------- road frame ---------------- */

export interface RoadSample {
  x: number
  z: number
  /** unit tangent (flattened) */
  tx: number
  tz: number
  /** unit right vector */
  rx: number
  rz: number
  meters: number
}

interface Layout {
  samples: RoadSample[]
  zoneMeters: number
  bounds: { minX: number; maxX: number; minZ: number; maxZ: number }
  fields: FieldRect[]
  huts: HutInstance[]
  trees: TreeInstance[]
  crops: CropInstance[]
  smokeAnchors: Vector3[]
  birdAnchors: Vector3[]
}

export interface FieldRect {
  m0: number
  m1: number
  side: -1 | 1
  off0: number
  off1: number
  kind: 'mustard' | 'green'
}

export interface HutInstance {
  x: number
  z: number
  rotY: number
  w: number
  d: number
  wallH: number
  roofH: number
  colorJitter: number
  roofKind: 0 | 1 // terracotta | thatch
}

export interface TreeInstance {
  x: number
  z: number
  trunkH: number
  trunkR: number
  canopyR: number
  canopyH: number
  rotY: number
  colorMix: number
  jitter: number
}

export interface CropInstance {
  x: number
  z: number
  h: number
  rotY: number
  colorMix: number
  kind: 'mustard' | 'green'
}

/* ---------------- value noise ---------------- */

function hash2(ix: number, iz: number, seed: number): number {
  let h = (ix * 374761393 + iz * 668265263 + seed * 1442695041) | 0
  h = (h ^ (h >>> 13)) | 0
  h = Math.imul(h, 1274126177)
  h = (h ^ (h >>> 16)) >>> 0
  return h / 4294967295
}

function valueNoise(x: number, z: number, seed: number): number {
  const ix = Math.floor(x)
  const iz = Math.floor(z)
  const fx = x - ix
  const fz = z - iz
  const sx = fx * fx * (3 - 2 * fx)
  const sz = fz * fz * (3 - 2 * fz)
  const a = hash2(ix, iz, seed)
  const b = hash2(ix + 1, iz, seed)
  const c = hash2(ix, iz + 1, seed)
  const d = hash2(ix + 1, iz + 1, seed)
  return lerp(lerp(a, b, sx), lerp(c, d, sx), sz)
}

export function fbm(x: number, z: number, seed: number, octaves = 3): number {
  let sum = 0
  let amp = 0.5
  let freq = 1
  for (let o = 0; o < octaves; o++) {
    sum += valueNoise(x * freq, z * freq, seed + o * 101) * amp
    amp *= 0.5
    freq *= 2.05
  }
  return sum / (1 - Math.pow(0.5, octaves)) // normalize ≈ [0,1]
}

/* ---------------- layout build (lazy, cached) ---------------- */

let cached: Layout | null = null

export function getVillageLayout(): Layout {
  if (cached) return cached

  const pStart = CHAPTER_MARKS[ZONE]
  const pEnd = CHAPTER_MARKS[ZONE + 1]
  const zoneMeters = (pEnd - pStart) * totalLength

  // Road polyline through the zone plus margins, every 4m.
  const samples: RoadSample[] = []
  const point = new Vector3()
  const tangent = new Vector3()
  const step = 4
  const mStart = -END_MARGIN
  const mEnd = zoneMeters + END_MARGIN
  for (let m = mStart; m <= mEnd; m += step) {
    const p = pStart + metersToProgress(m)
    pointAt(p, point)
    tangentAt(p, tangent)
    const tl = Math.hypot(tangent.x, tangent.z) || 1
    const tx = tangent.x / tl
    const tz = tangent.z / tl
    samples.push({ x: point.x, z: point.z, tx, tz, rx: -tz, rz: tx, meters: m })
  }

  const bounds = samples.reduce(
    (b, s) => ({
      minX: Math.min(b.minX, s.x - LATERAL),
      maxX: Math.max(b.maxX, s.x + LATERAL),
      minZ: Math.min(b.minZ, s.z - LATERAL),
      maxZ: Math.max(b.maxZ, s.z + LATERAL),
    }),
    { minX: Infinity, maxX: -Infinity, minZ: Infinity, maxZ: -Infinity },
  )

  // Fields alternate sides between the hut clusters.
  const fields: FieldRect[] = [
    { m0: 30, m1: 105, side: -1, off0: 7, off1: 32, kind: 'mustard' },
    { m0: 60, m1: 150, side: 1, off0: 8, off1: 30, kind: 'green' },
    { m0: 165, m1: 250, side: 1, off0: 7, off1: 36, kind: 'mustard' },
    { m0: 210, m1: 290, side: -1, off0: 8, off1: 28, kind: 'green' },
    { m0: 320, m1: 405, side: -1, off0: 7, off1: 33, kind: 'mustard' },
    { m0: 360, m1: 440, side: 1, off0: 9, off1: 30, kind: 'mustard' },
  ]

  const rng = createRng(SEED)
  cached = {
    samples,
    zoneMeters,
    bounds,
    fields,
    huts: [],
    trees: [],
    crops: [],
    smokeAnchors: [],
    birdAnchors: [],
  }

  /* huts: three clusters + stragglers, doors facing the road */
  const clusters: Array<{ m: number; side: -1 | 1; count: number }> = [
    { m: 125, side: 1, count: 5 },
    { m: 265, side: 1, count: 4 },
    { m: 300, side: -1, count: 3 },
    { m: 430, side: -1, count: 5 },
  ]
  for (const c of clusters) {
    for (let i = 0; i < c.count; i++) {
      const m = c.m + rngRange(rng, -26, 26)
      const off = rngRange(rng, 9, 24) * c.side
      const s = sampleAt(m)
      const x = s.x + s.rx * off
      const z = s.z + s.rz * off
      // face roughly back toward the road, with jitter
      const rotY = Math.atan2(-s.rx * c.side, -s.rz * c.side) + rngRange(rng, -0.35, 0.35)
      cached.huts.push({
        x,
        z,
        rotY,
        w: rngRange(rng, 2.8, 4.2),
        d: rngRange(rng, 2.8, 4.4),
        wallH: rngRange(rng, 2.1, 2.7),
        roofH: rngRange(rng, 1.0, 1.5),
        colorJitter: rng(),
        roofKind: rng() < 0.55 ? 1 : 0,
      })
    }
  }

  // smoke rises from the hut in each cluster nearest the road
  for (const c of clusters) {
    let best: HutInstance | null = null
    let bestD = Infinity
    for (const h of cached.huts) {
      const s = sampleAt(c.m)
      const d = Math.hypot(h.x - s.x, h.z - s.z)
      if (d < bestD) {
        bestD = d
        best = h
      }
    }
    if (best) {
      cached.smokeAnchors.push(
        new Vector3(
          best.x,
          TERRAIN_BASE_Y + heightAtRaw(best.x, best.z) + best.wallH + best.roofH,
          best.z,
        ),
      )
    }
  }

  /* trees: noise groves + sparse scatter, never in fields or on the road.
     The close band (6.5–15m) matters most — trees whipping past the camera
     are the cheapest speed cue there is. */
  for (let m = mStart + 6; m < mEnd - 6; m += 5) {
    const s = sampleAt(m)
    for (const side of [-1, 1] as const) {
      const off = rngRange(rng, 6.5, 130) * side
      const x = s.x + s.rx * off
      const z = s.z + s.rz * off
      const grove = fbm(x * 0.016, z * 0.016, 77, 2)
      if (grove < 0.54 && rng() > 0.13) continue
      if (fieldAt(x, z)) continue
      if (nearHut(x, z, 4.5)) continue
      cached.trees.push({
        x,
        z,
        trunkH: rngRange(rng, 1.3, 2.3),
        trunkR: rngRange(rng, 0.11, 0.18),
        canopyR: rngRange(rng, 1.3, 2.5),
        canopyH: rngRange(rng, 1.1, 1.9),
        rotY: rngRange(rng, 0, Math.PI * 2),
        colorMix: rng(),
        jitter: 0.9 + rng() * 0.2,
      })
    }
  }

  /* crops fill the field rects in road-parallel rows */
  for (const f of fields) {
    const rowSpacing = f.kind === 'mustard' ? 1.0 : 1.25
    for (let m = f.m0; m <= f.m1; m += rowSpacing) {
      const s = sampleAt(m)
      for (let off = f.off0; off <= f.off1; off += rowSpacing) {
        if (rng() < 0.12) continue // gaps read as hand-planted
        const jx = rngRange(rng, -0.3, 0.3)
        const jz = rngRange(rng, -0.3, 0.3)
        const x = s.x + s.rx * off * f.side + jx
        const z = s.z + s.rz * off * f.side + jz
        cached.crops.push({
          x,
          z,
          h: f.kind === 'mustard' ? rngRange(rng, 0.38, 0.6) : rngRange(rng, 0.22, 0.36),
          rotY: rngRange(rng, 0, Math.PI * 2),
          colorMix: rng(),
          kind: f.kind,
        })
      }
    }
  }

  /* bird flock anchors above the road */
  for (const m of [95, 260, 420]) {
    const s = sampleAt(m)
    cached.birdAnchors.push(new Vector3(s.x, rngRange(rng, 26, 40), s.z))
  }

  return cached
}

/* ---------------- queries (usable before/after cache exists) ---------------- */

function sampleAt(m: number): RoadSample {
  const layout = cached
  const samples = layout ? layout.samples : buildTempSamples()
  const step = 4
  const idx = Math.round((m - samples[0].meters) / step)
  return samples[Math.max(0, Math.min(samples.length - 1, idx))]
}

let tempSamples: RoadSample[] | null = null
function buildTempSamples(): RoadSample[] {
  if (tempSamples) return tempSamples
  // getVillageLayout builds the real one; this only exists to avoid
  // accidental infinite recursion if a query runs first.
  getVillageLayout()
  tempSamples = cached!.samples
  return tempSamples
}

/** Nearest road point: distance and meters-along-zone. */
export function nearestRoad(x: number, z: number): { d: number; m: number } {
  const { samples } = getVillageLayout()
  let best = Infinity
  // coarse-to-fine: every 4th sample, then refine around the winner
  let bestI = 0
  for (let i = 0; i < samples.length; i += 4) {
    const dx = samples[i].x - x
    const dz = samples[i].z - z
    const d = dx * dx + dz * dz
    if (d < best) {
      best = d
      bestI = i
    }
  }
  let finalI = bestI
  for (let i = Math.max(0, bestI - 4); i < Math.min(samples.length, bestI + 5); i++) {
    const dx = samples[i].x - x
    const dz = samples[i].z - z
    const d = dx * dx + dz * dz
    if (d < best) {
      best = d
      finalI = i
    }
  }
  return { d: Math.sqrt(best), m: samples[finalI].meters }
}

export function roadDistanceAt(x: number, z: number): number {
  return nearestRoad(x, z).d
}

function heightAtRaw(x: number, z: number): number {
  const { d, m } = nearestRoad(x, z)
  const corridor = smoothstep(clamp01((d - 7) / 20)) // flat within 7m of center
  const rolling = (fbm(x * 0.022, z * 0.022, SEED, 3) - 0.38) * 5.0
  const swell = (fbm(x * 0.006, z * 0.006, SEED + 900, 2) - 0.4) * 7.0
  const far = smoothstep(clamp01((d - 26) / 60))
  // settle back to flat at the zone ends so neighbor chapters sit cleanly
  const layout = cached
  const zoneEnd = layout ? layout.zoneMeters : 500
  const edge = smoothstep(clamp01((m + 38) / 38)) * (1 - smoothstep(clamp01((m - zoneEnd) / 38)))
  return Math.max(0, (rolling * corridor + swell * far) * edge)
}

/** Terrain surface height (world y) at a village-rect point. */
export function terrainHeightAt(x: number, z: number): number {
  return TERRAIN_BASE_Y + heightAtRaw(x, z)
}

/** Which field rect (if any) covers this point, plus its local offset in meters. */
export function fieldAt(x: number, z: number): { field: FieldRect; off: number } | null {
  const layout = getVillageLayout()
  // find nearest sample (coarse) to get road-local coords
  const { samples } = layout
  let bestI = 0
  let best = Infinity
  for (let i = 0; i < samples.length; i += 2) {
    const dx = samples[i].x - x
    const dz = samples[i].z - z
    const d = dx * dx + dz * dz
    if (d < best) {
      best = d
      bestI = i
    }
  }
  const s = samples[bestI]
  const m = s.meters
  const dx = x - s.x
  const dz = z - s.z
  const lateral = dx * s.rx + dz * s.rz // signed: + is right of travel
  for (const f of layout.fields) {
    if (m < f.m0 || m > f.m1) continue
    const off = lateral * f.side // positive if on the field's side
    if (off >= f.off0 && off <= f.off1) return { field: f, off }
  }
  return null
}

function nearHut(x: number, z: number, r: number): boolean {
  const layout = cached
  if (!layout) return false
  for (const h of layout.huts) {
    if (Math.hypot(h.x - x, h.z - z) < r + Math.max(h.w, h.d)) return true
  }
  return false
}
