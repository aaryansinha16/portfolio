import { Vector3 } from 'three'
import { smoothstep, clamp01 } from '../../utils/math'

/**
 * The camera's glance registry. Biome builders register each story board's
 * ACTUAL world position keyed to its station (world meters along the
 * spline); CameraRig samples a 0..1 glance weight per frame and eases the
 * look toward the board while the remap window (DetourManager) slows the
 * ride past it. Pure function of vehicle position — fully scrub-reversible.
 */

interface FocusTarget {
  /** world meters along the spline (the STATION, so timing matches the
   * slow-motion window even when the board snapped to a nearby mount) */
  m: number
  pos: Vector3
}

const targets: FocusTarget[] = []

export function registerFocusTarget(m: number, pos: Vector3): void {
  targets.push({ m, pos: pos.clone() })
  targets.sort((a, b) => a.m - b.m)
}

/* the glance envelope, in meters relative to the station:
 *   -26 … -16  ease the gaze onto the board
 *   -16 … +2   hold
 *    +2 … +8   ease back to the road            */
const RISE_START = -26
const RISE_LEN = 10
const FALL_START = 2
const FALL_LEN = 6
const FALL_END = FALL_START + FALL_LEN

/**
 * Writes the active board position into out and returns the glance weight
 * (0 = eyes on the road). Targets never overlap (stations are ≥45m apart).
 */
export function focusLookAt(vehicleM: number, out: Vector3): number {
  for (const t of targets) {
    const local = vehicleM - t.m
    if (local < RISE_START) break // sorted — nothing further can match
    if (local > FALL_END) continue
    const rise = smoothstep(clamp01((local - RISE_START) / RISE_LEN))
    const fall = 1 - smoothstep(clamp01((local - FALL_START) / FALL_LEN))
    out.copy(t.pos)
    return Math.min(rise, fall)
  }
  return 0
}
