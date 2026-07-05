import { CatmullRomCurve3, Vector3 } from 'three'

/**
 * The single spline for the entire journey. Everything — camera, vehicle,
 * chapter boundaries, prop placement — derives from this curve, addressed by
 * arc-length progress p ∈ [0, 1] (curve.getPointAt, not getPoint, so scroll
 * speed is uniform regardless of control-point spacing).
 *
 * Authoring notes:
 * - 1 unit = 1 meter. The journey heads broadly -Z with meanders in X.
 * - y stays 0 until the finale, where the road ramps up onto the circuit
 *   board (~40m elevation) — see ADR-5 / README chapter 6.
 * - Chapter character lives in the curvature: village = gentle S, town =
 *   tight zigzag, highway = long sweepers, city = hard chicane blocks,
 *   neon = medium weave, circuit = dead-straight climb.
 */

type Pt = [number, number, number]

/** Control points grouped per chapter zone; zone i starts at its first point. */
const ZONE_POINTS: readonly Pt[][] = [
  // 0 Prologue — pre-dawn straight, barely drifting
  [
    [0, 0, 0],
    [0, 0, -60],
    [-2, 0, -120],
  ],
  // 1 Village — dawn, gentle S through fields
  [
    [-4, 0, -170],
    [-9, 0, -240],
    [-14, 0, -310],
    [-8, 0, -390],
    [6, 0, -460],
    [17, 0, -540],
    [13, 0, -610],
  ],
  // 2 Town — morning, tighter zigzag between blocks
  [
    [4, 0, -670],
    [-14, 0, -730],
    [-24, 0, -800],
    [-9, 0, -865],
    [14, 0, -920],
    [27, 0, -990],
    [16, 0, -1060],
    [2, 0, -1115],
  ],
  // 3 Highway — noon, long sweepers
  [
    [-5, 0, -1200],
    [-10, 0, -1320],
    [1, 0, -1440],
    [15, 0, -1550],
    [19, 0, -1635],
  ],
  // 4 City — dusk, blocky turns and one hard chicane
  [
    [14, 0, -1715],
    [-8, 0, -1770],
    [-32, 0, -1800],
    [-46, 0, -1850],
    [-38, 0, -1905],
    [-12, 0, -1950],
    [4, 0, -2015],
    [-1, 0, -2085],
    [-9, 0, -2150],
  ],
  // 5 Neon — night, medium weave through the district
  [
    [-21, 0, -2220],
    [-28, 0, -2300],
    [-13, 0, -2380],
    [7, 0, -2450],
    [19, 0, -2530],
    [9, 0, -2610],
    [-5, 0, -2665],
  ],
  // 6 Circuit — straighten, ramp onto the board, level run to the finale
  [
    [-8, 0, -2725],
    [-6, 0, -2790],
    [-2, 3, -2855],
    [0, 13, -2925],
    [0, 27, -2995],
    [0, 38, -3060],
    [0, 41, -3130],
    [0, 41, -3220],
    [0, 41, -3320],
  ],
]

export const ZONE_COUNT = ZONE_POINTS.length

const allPoints: Vector3[] = ZONE_POINTS.flat().map(([x, y, z]) => new Vector3(x, y, z))

export const roadCurve = new CatmullRomCurve3(allPoints, false, 'centripetal')
roadCurve.arcLengthDivisions = 2400

export const totalLength = roadCurve.getLength()

/**
 * Chapter boundary marks as arc-length progress. marks[i] = start of zone i;
 * a final 1 is appended, so zone i spans [marks[i], marks[i + 1]).
 * Computed from the real arc length at each zone's first control point.
 */
export const CHAPTER_MARKS: readonly number[] = (() => {
  const lengths = roadCurve.getLengths(roadCurve.arcLengthDivisions)
  const last = lengths[lengths.length - 1]
  const marks: number[] = []
  let index = 0
  for (const zone of ZONE_POINTS) {
    // Curve passes through control point k at t = k / (n - 1).
    const t = index / (allPoints.length - 1)
    const li = Math.min(lengths.length - 1, Math.round(t * (lengths.length - 1)))
    marks.push(lengths[li] / last)
    index += zone.length
  }
  marks[0] = 0
  marks.push(1)
  return marks
})()

/** Zone index 0..6 for a given progress. */
export function chapterAtProgress(p: number): number {
  for (let i = ZONE_COUNT - 1; i >= 0; i--) {
    if (p >= CHAPTER_MARKS[i]) return i
  }
  return 0
}

/** Convert a distance in meters to a progress delta. */
export function metersToProgress(m: number): number {
  return m / totalLength
}

// NOTE: scroll progress p is the CAMERA's spline coordinate; the vehicle
// rides ahead by a per-chapter chase distance — see ColorScript's
// vehicleProgressAt (lives there because chase is chapter config).

const _clamped = (p: number) => (p < 0 ? 0 : p > 1 ? 1 : p)

/** Arc-length sample of the road position. Writes into target, no allocation. */
export function pointAt(p: number, target: Vector3): Vector3 {
  return roadCurve.getPointAt(_clamped(p), target)
}

/** Arc-length tangent (normalized). Writes into target, no allocation. */
export function tangentAt(p: number, target: Vector3): Vector3 {
  return roadCurve.getTangentAt(_clamped(p), target)
}

/* ---------------- the cliff (the finale's LIFT-OFF) ----------------
 * The board is TORN OFF this many meters before the spline's end; the road
 * deck, dashes and PCB all stop at the edge. Past it the path DIVES, pulls
 * out, and CLIMBS — the ride leaves the board flying, not crashing (owner:
 * the ending must read positive). All a pure function of meters, so
 * scrolling back up rewinds the flight into the dive into the drive. */

export const CLIFF_START_M = totalLength - 10
/** meters past the edge where the ride hands over to the plane */
export const FLIGHT_SWAP_OVER = 7
/** how far past the edge the flight is allowed before it holds */
export const CLIFF_MAX_OVER = 20

const _edgePoint = new Vector3()
const _edgeDir = new Vector3()
roadCurve.getPointAt(CLIFF_START_M / totalLength, _edgePoint)
roadCurve.getTangentAt(CLIFF_START_M / totalLength, _edgeDir)

/** Like pointAt (in METERS), but continues past the cliff edge into the
 * dive-and-climb. C1 at the seam (o = 6): dive slope 0.72 continues into
 * the pull-out, levels ~o 11, and climbs back above the lip by o ≈ 18.
 * No cap here — callers clamp their own travel. */
export function pointPastEnd(m: number, target: Vector3): Vector3 {
  if (m <= CLIFF_START_M) return pointAt(m / totalLength, target)
  const over = m - CLIFF_START_M
  target.copy(_edgePoint).addScaledVector(_edgeDir, over)
  if (over <= 6) {
    target.y -= 0.06 * over * over
  } else {
    const q = over - 6
    target.y -= 2.16 + 0.72 * q - 0.07 * q * q
  }
  return target
}
