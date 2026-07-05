import { CHAPTER_MARKS, totalLength } from '../spline/roadPath'
import { DETOURS, type DetourDef } from '../../content'

/**
 * Detours re-shape the scroll→spline mapping (DESIGN: "the journey pauses
 * and a strip takes over"). Each window either PLATEAUS the spline (strip
 * detours: the rider pulls over and DOM panels ride the scroll) or rolls it
 * in SLOW MOTION (world detours: the ride keeps moving past in-world
 * exhibits at a fraction of cruise speed):
 *
 *   spline
 *     1 ┤                                    ╭──
 *       │                        ╭───────────╯      ← slope K outside windows
 *       │             ╭ ─ ─ ─ ──╯       ← slow-mo: shallow slope through
 *       │      ╭──────╯                    the showroom (span > 0)
 *     0 ┼──────╯   ← plateau: rider pulled over (span = 0)
 *       0 ──────────── scroll ──────────────→ 1
 *
 * Both directions stay monotonic-ish (plateaus map back to their entry), so
 * everything remains a pure, reversible function of scroll (prime directive
 * #1 intact — this IS the master timeline's mapping, just not the identity).
 */

export interface DetourWindow {
  def: DetourDef
  /** spline progress where the window begins */
  spline: number
  /** spline progress covered inside the window (0 = plateau) */
  span: number
  /** scroll progress where the window begins */
  scrollStart: number
  /** scroll length of the window */
  scrollLen: number
}

const totalPause = DETOURS.reduce((sum, d) => sum + d.scrollLen, 0)
const totalSpan = DETOURS.reduce((sum, d) => sum + (d.spanMeters ?? 0) / totalLength, 0)
/** drive-rate outside windows (both axes must still reach 1 together) */
const K = (1 - totalSpan) / (1 - totalPause)

export const DETOUR_WINDOWS: readonly DetourWindow[] = (() => {
  const windows: DetourWindow[] = []
  let pauseBefore = 0
  let spanBefore = 0
  for (const def of DETOURS) {
    const zoneStart = CHAPTER_MARKS[def.zone]
    const zoneEnd = CHAPTER_MARKS[def.zone + 1]
    const spline = zoneStart + def.anchorT * (zoneEnd - zoneStart)
    const span = (def.spanMeters ?? 0) / totalLength
    windows.push({
      def,
      spline,
      span,
      scrollStart: (spline - spanBefore) / K + pauseBefore,
      scrollLen: def.scrollLen,
    })
    pauseBefore += def.scrollLen
    spanBefore += span
  }
  return windows
})()

/** scroll (0..1) → spline (0..1): the master mapping. */
export function splineOf(scroll: number): number {
  let pauseBefore = 0
  let spanBefore = 0
  for (const w of DETOUR_WINDOWS) {
    if (scroll < w.scrollStart) break
    if (scroll <= w.scrollStart + w.scrollLen) {
      return w.spline + ((scroll - w.scrollStart) / w.scrollLen) * w.span
    }
    pauseBefore += w.scrollLen
    spanBefore += w.span
  }
  return Math.min(1, (scroll - pauseBefore) * K + spanBefore)
}

/** spline (0..1) → scroll (0..1); plateaus map to their entry point. */
export function scrollOf(spline: number): number {
  let pauseBefore = 0
  let spanBefore = 0
  for (const w of DETOUR_WINDOWS) {
    if (spline >= w.spline && w.span > 0 && spline <= w.spline + w.span) {
      return w.scrollStart + ((spline - w.spline) / w.span) * w.scrollLen
    }
    if (spline > w.spline + w.span) {
      pauseBefore += w.scrollLen
      spanBefore += w.span
    }
  }
  return Math.min(1, (spline - spanBefore) / K + pauseBefore)
}

/** Which detour window covers this scroll position, with its local 0..1 t. */
export function detourAt(scroll: number): { window: DetourWindow; t: number } | null {
  for (const w of DETOUR_WINDOWS) {
    const t = (scroll - w.scrollStart) / w.scrollLen
    if (t >= 0 && t <= 1) return { window: w, t }
  }
  return null
}
