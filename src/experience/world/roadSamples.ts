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
  /** nearest sample by meters along the zone */
  at: (m: number) => ZoneSample
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
    place(m: number, lateral: number, out: Vector3): Vector3 {
      const s = road.at(m)
      return out.set(s.x + s.rx * lateral, s.y, s.z + s.rz * lateral)
    },
  }
  cache.set(key, road)
  return road
}
