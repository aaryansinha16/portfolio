import { CHAPTER_MARKS, totalLength } from '../spline/roadPath'

/**
 * Story-board STATIONS — pure positions (meters along a zone) shared by
 * three consumers that must agree without importing each other:
 *   · townField / cityField mount the physical boards at (near) them,
 *   · DetourManager carves a slow-motion window around each one,
 *   · CameraRig pans the gaze toward the registered board while inside it.
 * Keeping them here (data only, no three.js) breaks the import cycle.
 */

/** road covered by the ch4 tunnel — lives here so layout math stays pure */
export const TUNNEL_LEN = 78

/** ch2 rooftop-hoarding stations, alternating sides along the street */
export const CH2_BOARD_STATIONS: readonly { m: number; side: number }[] = [
  { m: 60, side: -1 },
  { m: 150, side: 1 },
  { m: 240, side: -1 },
  { m: 330, side: 1 },
  { m: 420, side: -1 },
  { m: 500, side: 1 },
]

/**
 * ch4: SEVEN career-board stations spread across the whole usable zone
 * (~64m apart — owner: "keep more distance between content"), with the two
 * gantries at midpoints BETWEEN boards. Gantries hang overhead, so they
 * don't crowd the roadside rhythm, and nothing ever shares a sight-line.
 */
export function cityStations(zoneMeters: number): { boards: number[]; gantries: number[] } {
  const start = 22
  const end = zoneMeters - TUNNEL_LEN - 48
  const boards = Array.from({ length: 7 }, (_, i) => start + (i * (end - start)) / 6)
  return {
    boards,
    // THE CLIMB after AcadBoost, 7 ROLES after OpenAI/Meta (narrative order)
    gantries: [(boards[1] + boards[2]) / 2, (boards[4] + boards[5]) / 2],
  }
}

export interface FocusStation {
  zone: number
  /** meters along the zone */
  m: number
}

/** every station that earns a slow-motion glance (boards only — gantries
 * face the driver head-on and need no side-look) */
export const FOCUS_STATIONS: readonly FocusStation[] = (() => {
  const list: FocusStation[] = []
  for (const s of CH2_BOARD_STATIONS) list.push({ zone: 2, m: s.m })
  const zone4Meters = (CHAPTER_MARKS[5] - CHAPTER_MARKS[4]) * totalLength
  for (const m of cityStations(zone4Meters).boards) list.push({ zone: 4, m })
  return list
})()
