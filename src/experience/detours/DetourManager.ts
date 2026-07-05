import { CHAPTER_MARKS, totalLength } from '../spline/roadPath'
import { FOCUS_STATIONS } from '../world/focusZones'
import { DETOURS, type DetourDef } from '../../content'

/**
 * ONE piecewise scroll→spline remap owns every change of pace (prime
 * directive #1: no second scroll consumer). Three window kinds share it:
 *
 *   plateau (strip detours) — spline holds still, DOM strip rides scroll
 *   slow-mo (world detours) — the ride rolls at a fraction of cruise
 *   glance (focus zones)    — a short soft slow-down past a story board,
 *                             while CameraRig pans the gaze toward it
 *
 *   spline
 *     1 ┤                                  ╭──
 *       │                       ╭──╌╌──────╯     ← ╌ glance: shallow dips
 *       │            ╭─╌╌───────╯
 *       │      ╭─────╯   ← plateau (span = 0)
 *     0 ┼──────╯
 *       0 ──────────── scroll ─────────────→ 1
 *
 * Everything stays monotonic (plateaus map back to their entry), so the
 * whole journey remains a pure, reversible function of scroll.
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

interface RemapWindow {
  spline: number
  span: number
  scrollLen: number
  scrollStart: number
  def?: DetourDef
}

/* glance windows. Lessons from the owner's tests baked in here:
 * (1) the slow-down must LAST — a window that crosses in ~55px of scroll
 *     is gone before perception. 22m at stretch 3.6 holds ~400px of the
 *     runway at ~18% of cruise speed: an unmistakable cinematic beat.
 * (2) the window is phased in CAMERA coordinates to sit under the tilt's
 *     hold (the vehicle rides ~9m ahead of the camera's spline coordinate,
 *     and the look envelope keys off the VEHICLE).
 * SCROLL_PAGES rises alongside every stretch (18→20→22) so cruise pacing
 * between the boards stays exactly where it was. */
const GLANCE_BACK = 25
const GLANCE_LEN = 22
const GLANCE_STRETCH = 3.6

const ALL_WINDOWS: readonly RemapWindow[] = (() => {
  const entries: RemapWindow[] = []
  for (const def of DETOURS) {
    const zoneStart = CHAPTER_MARKS[def.zone]
    const zoneEnd = CHAPTER_MARKS[def.zone + 1]
    entries.push({
      def,
      spline: zoneStart + def.anchorT * (zoneEnd - zoneStart),
      span: (def.spanMeters ?? 0) / totalLength,
      scrollLen: def.scrollLen,
      scrollStart: 0,
    })
  }
  for (const st of FOCUS_STATIONS) {
    const span = GLANCE_LEN / totalLength
    entries.push({
      spline: CHAPTER_MARKS[st.zone] + (st.m - GLANCE_BACK) / totalLength,
      span,
      scrollLen: span * GLANCE_STRETCH,
      scrollStart: 0,
    })
  }
  entries.sort((a, b) => a.spline - b.spline)

  const totalPause = entries.reduce((sum, w) => sum + w.scrollLen, 0)
  const totalSpan = entries.reduce((sum, w) => sum + w.span, 0)
  const K = (1 - totalSpan) / (1 - totalPause)
  let pauseBefore = 0
  let spanBefore = 0
  for (const w of entries) {
    w.scrollStart = (w.spline - spanBefore) / K + pauseBefore
    pauseBefore += w.scrollLen
    spanBefore += w.span
  }
  return entries
})()

/** drive-rate outside windows (both axes must still reach 1 together) */
const K = (() => {
  const totalPause = ALL_WINDOWS.reduce((sum, w) => sum + w.scrollLen, 0)
  const totalSpan = ALL_WINDOWS.reduce((sum, w) => sum + w.span, 0)
  return (1 - totalSpan) / (1 - totalPause)
})()

/** the REAL detours (with defs) — overlays, billboards and probes use these */
export const DETOUR_WINDOWS: readonly DetourWindow[] = ALL_WINDOWS.filter(
  (w): w is RemapWindow & { def: DetourDef } => w.def != null,
)

/** scroll (0..1) → spline (0..1): the master mapping. */
export function splineOf(scroll: number): number {
  let pauseBefore = 0
  let spanBefore = 0
  for (const w of ALL_WINDOWS) {
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
  for (const w of ALL_WINDOWS) {
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
