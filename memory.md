# memory.md — Working Memory

Claude Code: read this at session start; append at session end. Newest first. Keep entries to
1–3 lines. Prune anything stale monthly.

## Current state

- **Phase:** 0 done (minus Vercel connect — owner action). 1–2 done (owner confirmed feel
  after perf fix). 3 BUILT: four procedural vehicles (bicycle/motorcycle/R15/Safari, shared
  parts kit), scroll-scrubbed swap choreography at the three boundaries (ADR-14), shared
  headlight pool, speed dust. Swap stills at shots/s1–s3; 60fps gate green.
- **Next action:** owner scroll-through of the three swap boundaries (Phase 3 accept), then
  Phase 4 remaining biomes (order: highway → town → city → neon → circuit → prologue polish).
- **Known gaps:** whip-pan/silhouette swap flourish deferred to Phase 4 Theatre polish
  (ADR-14). Village terrain seams flat at zone edges by design. Theatre.js still unwired.
- **Deviations from plan:** scroll runway is 1800vh not 700vh (`SCROLL_PAGES`). ColorScript +
  camera framing are config-lerped systems (height/right/fov/chase per chapter). Swap-window
  constants (APPROACH/MERGE/PARK_BACK/START_AHEAD/SHOULDER) live in VehicleManager.tsx.

## Open threads

- Verification: `pnpm build && pnpm preview --port 4173 &` then `pnpm verify` — headless
  system-Chrome drive, screenshots to `shots/`, fails on console errors / GL warnings / min
  fps < 50 measured at deviceScaleFactor 2 + 2x CPU throttle (dpr-1 probes once hid a real
  35fps regression — never trust dpr-1 numbers). Review the screenshots against the DESIGN
  checklist, don't just trust exit 0.

- ~~Vehicle glTF sourcing~~ RESOLVED 2026-07-04: all four vehicles procedural (ADR-11 held
  through Phase 3); no asset pipeline. Revisit only if a chapter art pass demands more detail.
- Boundary marks readable at runtime via `?debug` → `window.__MARKS`
  (currently .0503/.1995/.3605/.5133/.6710/.8228).
- Font licensing: Clash Display & Satoshi via Fontshare (free) — confirm webfont weights needed.
- Domain: reuse existing portfolio domain or new one? (Owner decision, not blocking.)
- Audio: source engine loops + ambiences (freesound/artlist) — Phase 6, park it.

## Tried & rejected

- (2026-07-04) **postprocessing ≥6.38 with any depth-consuming effect** — its stable-depth
  blitFramebuffer path throws GL_INVALID_OPERATION per frame on ANGLE-Metal (macOS Chrome).
  Pinned 6.36.4 via pnpm override. ADR-12. Unpin only after re-running `pnpm verify` clean.
- (2026-07-04) **Spiky cone crops** — read as tiny conifers, not mustard. Squashed
  icosahedron blobs (wider than tall) read as crop mass. Same lesson likely applies to any
  small organic prop.
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

- **2026-07-05** — Phase 4 part 1: Highway + Town art passes. Shared biome kit extracted
  (textPanel canvas signage, BirdFlock, PuffColumn, roadSamples); village movers migrated to
  it. Highway: skill hoardings (readable while driving!), heat-haze post effect (zone-driven),
  scrub, milestones, oncoming traffic, kites. Town: shop street w/ signboards + awnings,
  poles + sagging wires, clutter, laundry sway, pigeons, chai smoke, detour signpost.
  All cached-primitive pattern; verify green (60fps gate, 0 errors). Remaining Phase 4:
  City → Neon → Circuit → Prologue polish.
- **2026-07-04 (e)** — Phase 3 built: shared vehicle parts kit (wheels/tubes/wedge/cached
  materials), commuter motorcycle + R15 + Safari modeled procedurally, swap choreography as
  pure functions of progress (decel→shoulder-park w/ side-stand lean + nose-out; hermite
  launch that catches the follow point C1-smooth), per-chapter chase distances for all
  vehicles, speed dust tinted by chapter air. Perf lesson: per-vehicle point lights cost
  15fps + recompiles → ONE shared headlight pool; ratchet decline bound raised to 52 so a
  ~50fps tier yields to a locked-60 tier. Verify gained swap-zone stops; all green.
- **2026-07-04 (d)** — Perf regression fixed after owner felt frame drops (Retina dpr 2 was
  the blind spot: probes ran dpr 1). Measured 31–38fps + 146ms mount hitch → now 60fps flat,
  worst frame ≤25ms, at dpr 2 even with 2x CPU throttle. Fixes: one-way adaptive quality
  ratchet (dpr/MSAA/DoF tiers, ADR-13), half-res DoF bokeh, module-cached chapter meshes
  (remounts = attach only). verify now gates on min fps at dpr 2. Owner should re-test feel;
  note CLAUDE.md rule — judge perf in `pnpm preview`, not dev.
- **2026-07-04 (c)** — Phase 2 vertical slice built: gradient sky dome (per-chapter
  zenith/horizon/sun-glow, tone-mapped shader), per-chapter camera framing incl. chase
  distance (bicycle 6m vs car 8.5m), procedural bicycle (spin, lean-into-curves, lamp),
  village biome — noise terrain w/ flat road corridor + edge fade, mustard/green fields baked
  into vertex colors, instanced trees/huts (doors, terracotta/thatch roofs), 5k swaying
  crops, bird flock, hearth smoke — and DoF focused on the vehicle. postprocessing pinned
  6.36.4 (ADR-12). Verified: 9 stops, 60fps everywhere, 0 errors/GL warnings; two
  screenshot-review rounds (crops de-spiked, chase tightened, terrain edge fade).
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
