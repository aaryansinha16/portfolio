import { CHAPTER_MARKS } from '../spline/roadPath'
import { DETOURS, type DetourDef } from '../../content'

/**
 * Detours pause the journey (DESIGN: "the journey pauses and a horizontal
 * strip takes over"): scroll progress keeps advancing, SPLINE progress
 * plateaus. This module owns the piecewise scroll→spline remap:
 *
 *   spline
 *     1 ┤                                    ╭──
 *       │                        ╭───────────╯      ← slope k everywhere
 *       │             ╭──────────╯                    outside plateaus
 *       │      ╭──────╯      ← plateau: rider pulled over,
 *     0 ┼──────╯               strip scrolls instead
 *       0 ──────────── scroll ──────────────→ 1
 *
 * Both directions stay monotonic, so everything remains a pure, reversible
 * function of scroll (prime directive #1 intact — this IS the master
 * timeline's mapping, just no longer the identity).
 */

export interface DetourWindow {
  def: DetourDef
  /** spline progress where the world holds still */
  spline: number
  /** scroll progress where the plateau begins */
  scrollStart: number
  /** scroll length of the plateau */
  scrollLen: number
}

const totalPause = DETOURS.reduce((sum, d) => sum + d.scrollLen, 0)
/** drive-rate outside plateaus (scroll is 1; spline must also reach 1) */
const K = 1 / (1 - totalPause)

export const DETOUR_WINDOWS: readonly DetourWindow[] = (() => {
  const windows: DetourWindow[] = []
  let pauseBefore = 0
  for (const def of DETOURS) {
    const zoneStart = CHAPTER_MARKS[def.zone]
    const zoneEnd = CHAPTER_MARKS[def.zone + 1]
    const spline = zoneStart + def.anchorT * (zoneEnd - zoneStart)
    windows.push({
      def,
      spline,
      scrollStart: spline / K + pauseBefore,
      scrollLen: def.scrollLen,
    })
    pauseBefore += def.scrollLen
  }
  return windows
})()

/** scroll (0..1) → spline (0..1): the master mapping. */
export function splineOf(scroll: number): number {
  let pauseBefore = 0
  for (const w of DETOUR_WINDOWS) {
    if (scroll < w.scrollStart) break
    if (scroll <= w.scrollStart + w.scrollLen) return w.spline
    pauseBefore += w.scrollLen
  }
  return Math.min(1, (scroll - pauseBefore) * K)
}

/** spline (0..1) → scroll (0..1); plateaus map to their entry point. */
export function scrollOf(spline: number): number {
  let pauseBefore = 0
  for (const w of DETOUR_WINDOWS) {
    if (spline > w.spline) pauseBefore += w.scrollLen
  }
  return Math.min(1, spline / K + pauseBefore)
}

/** Which detour window covers this scroll position, with its local 0..1 t. */
export function detourAt(scroll: number): { window: DetourWindow; t: number } | null {
  for (const w of DETOUR_WINDOWS) {
    const t = (scroll - w.scrollStart) / w.scrollLen
    if (t >= 0 && t <= 1) return { window: w, t }
  }
  return null
}
