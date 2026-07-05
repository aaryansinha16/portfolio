import { Vector3 } from 'three'
import {
  CHAPTER_MARKS,
  metersToProgress,
  pointAt,
  tangentAt,
  totalLength,
} from '../spline/roadPath'

/**
 * Generic road-relative sampling for biome layouts: a polyline through a
 * zone with tangent/right frames, addressed in meters. (The village grew
 * its own richer version first — new biomes use this.)
 */

export interface ZoneSample {
  x: number
  y: number
  z: number
  tx: number
  tz: number
  rx: number
  rz: number
  meters: number
}

export interface ZoneRoad {
  samples: ZoneSample[]
  zoneMeters: number
  step: number
  /** nearest sample by meters along the zone — fine for STATIC placement */
  at: (m: number) => ZoneSample
  /**
   * Interpolated sample for MOVERS. `at()` snaps to the 4m grid — anything
   * animated with it visibly teleports (the traffic "skipping frames" bug).
   */
  sample: (m: number, out: ZoneSample) => ZoneSample
  /** world position offset laterally from the road at m meters */
  place: (m: number, lateral: number, out: Vector3) => Vector3
}

const cache = new Map<string, ZoneRoad>()

export function getZoneRoad(zone: number, step = 4, margin = 30): ZoneRoad {
  const key = `${zone}/${step}/${margin}`
  const hit = cache.get(key)
  if (hit) return hit

  const pStart = CHAPTER_MARKS[zone]
  const pEnd = CHAPTER_MARKS[zone + 1]
  const zoneMeters = (pEnd - pStart) * totalLength
  const point = new Vector3()
  const tangent = new Vector3()
  const samples: ZoneSample[] = []
  for (let m = -margin; m <= zoneMeters + margin; m += step) {
    pointAt(pStart + metersToProgress(m), point)
    tangentAt(pStart + metersToProgress(m), tangent)
    const tl = Math.hypot(tangent.x, tangent.z) || 1
    const tx = tangent.x / tl
    const tz = tangent.z / tl
    samples.push({ x: point.x, y: point.y, z: point.z, tx, tz, rx: -tz, rz: tx, meters: m })
  }

  const road: ZoneRoad = {
    samples,
    zoneMeters,
    step,
    at(m: number): ZoneSample {
      const idx = Math.round((m - samples[0].meters) / step)
      return samples[Math.max(0, Math.min(samples.length - 1, idx))]
    },
    sample(m: number, out: ZoneSample): ZoneSample {
      const f = (m - samples[0].meters) / step
      const i0 = Math.max(0, Math.min(samples.length - 2, Math.floor(f)))
      const t = Math.max(0, Math.min(1, f - i0))
      const a = samples[i0]
      const b = samples[i0 + 1]
      out.x = a.x + (b.x - a.x) * t
      out.y = a.y + (b.y - a.y) * t
      out.z = a.z + (b.z - a.z) * t
      const tx = a.tx + (b.tx - a.tx) * t
      const tz = a.tz + (b.tz - a.tz) * t
      const tl = Math.hypot(tx, tz) || 1
      out.tx = tx / tl
      out.tz = tz / tl
      out.rx = -out.tz
      out.rz = out.tx
      out.meters = m
      return out
    },
    place(m: number, lateral: number, out: Vector3): Vector3 {
      const s = road.at(m)
      return out.set(s.x + s.rx * lateral, s.y, s.z + s.rz * lateral)
    },
  }
  cache.set(key, road)
  return road
}
