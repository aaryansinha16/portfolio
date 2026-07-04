# memory.md — Working Memory

Claude Code: read this at session start; append at session end. Newest first. Keep entries to
1–3 lines. Prune anything stale monthly.

## Current state

- **Phase:** 0 done (minus Vercel connect — owner action); 1 done pending the human feel-test.
  Full greybox journey drives end-to-end at 60fps, 0 console errors (verified headless Chrome).
- **Next action:** owner scroll-feel test (plan.md Phase 1 accept), connect Vercel; then
  Phase 2 village vertical slice.
- **Go/no-go gate ahead:** Phase 2 village slice must pass the poster test before scaling.
- **Deviations from plan:** scroll runway is 1800vh not 700vh (`SCROLL_PAGES` in ScrollSpine.ts)
  — 700vh crossed a whole chapter per wheel-flick. ColorScript pulled forward from Phase 2
  (greybox needed per-zone fog/sun/sky anyway). Theatre.js installed but not wired (?theatre
  is a no-op until Phase 2 camera set-pieces).

## Open threads

- Verification: `pnpm build && pnpm preview --port 4173 &` then `pnpm verify` — headless
  system-Chrome drive, screenshots to `shots/`, fails on any console error / GL warning.
  Review the screenshots against the DESIGN checklist, don't just trust exit 0.

- Vehicle glTF sourcing: shortlist Quaternius (free, cohesive style), Sketchfab CC-BY low-poly
  R15-alike + Safari-alike. Decision by Phase 3; a stand-in box is fine until then.
- Font licensing: Clash Display & Satoshi via Fontshare (free) — confirm webfont weights needed.
- Domain: reuse existing portfolio domain or new one? (Owner decision, not blocking.)
- Audio: source engine loops + ambiences (freesound/artlist) — Phase 6, park it.

## Tried & rejected

- (2026-07-04) **SMAA effect** — postprocessing's SMAA triggers per-frame
  `glBlitFramebuffer: Read and write depth stencil attachments cannot be the same image` on
  Chrome/ANGLE-Metal (macOS), including real user-facing Chrome. Isolated empirically
  (composer alone = clean, +SMAA = 249 warnings/4s). Replaced with 4x MSAA on the composer
  (`multisampling={4}`) — zero warnings, better edges, and dropped ~57KB gzip. ADR-9.
- (2026-07-04) **Full-size emissive greybox props** — building-sized glowing walls read as
  blinding slabs (city/neon). Emissives must be sign-scale accents; GreyboxBiome shrinks any
  glow-selected instance to ~2–4m sign dims.
- (2026-07-04) **Camera and vehicle on the same progress point** — at p=0 both clamp to spline
  start and the camera sits inside the vehicle. Vehicle now rides `CHASE_METERS` (8.5m) ahead
  of camera progress (roadPath.vehicleProgressAt).
- (2026-07-04) Character-growth concept rejected pre-build — rigging/outfit burden. ADR-3.

## Session log

- **2026-07-04 (b)** — Phases 0+1 built: scaffold, spline (~3.4km, 7 zones, computed
  CHAPTER_MARKS), road ribbon w/ per-zone tint, scroll spine (Lenis+ScrollTrigger master
  timeline), chase cam (bank/FOV-kick/shake), greybox biomes + far silhouettes, ColorScript
  env lerps, overlay (title cards, rail, hint, loader), ?debug/?chapter flags. Verified in
  headless Chrome: all 7 chapters, 60fps, 0 console errors; screenshots reviewed against
  DESIGN bar twice (fix round: chase offset, sign-scale emissives, neon lift, road tints,
  taillights). Remaining greybox nits: ground zone-blend seams on diagonals, neon signs float
  free (both fine until Phase 4 art passes).
- **2026-07-04** — Project conceived. Theme locked: Road Trip with vehicle-growth arc,
  village→circuit-board finale. Doc set created (README, CLAUDE, DESIGN, plan, decisions,
  memory). Stack: Vite/R3F/GSAP+Lenis/Zustand, Theatre.js dev-only. Visual bar defined in
  DESIGN.md with quality checklist + color script.
