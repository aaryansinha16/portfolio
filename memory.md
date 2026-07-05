# memory.md — Working Memory

Claude Code: read this at session start; append at session end. Newest first. Keep entries to
1–3 lines. Prune anything stale monthly.

## Current state

- **Phases 0–6 COMPLETE** (Phase 6 minus manual cross-browser pass + domain decision).
  Next: the owner's improvement list as a polish round.
- **Phases 0–5 COMPLETE.** All seven chapters at art quality, four procedural vehicles with
  scrub-reversible swaps, two horizontal detours (plateau remap, ADR-15), contact terminal,
  resume-aligned content. Deployed: push to main → Vercel (repo aaryansinha16/portfolio).
- **Next action:** Phase 6 (loader, audio, quality toggle, reduced-motion fallback, SEO/OG,
  cross-browser, perf/memory pass). Then the owner's improvement list as a polish round.
- **Owner TODOs:** drop resume PDF at public/resume.pdf AND set CONTACT.resumeUrl in
  content.ts; full human scroll-through; manual cross-browser pass; domain + absolute
  og:image URL.
- **Known gaps:** whip-pan/silhouette swap flourish still optional flourish (ADR-14).
  Theatre.js unwired. Audio not started (Phase 6).
- **Deviations from plan:** scroll runway 1800vh not 700vh (`SCROLL_PAGES`). ColorScript +
  camera framing are config-lerped systems (height/right/fov/chase per chapter). Swap-window
  constants live in VehicleManager.tsx; detour windows in content.ts DETOURS.

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

- **2026-07-06 (a)** — ROUND 11. Ch4 boards: after 4 rounds of tower-mount fixes, the
  structural answer was NO tower mounts — freestanding at stations + clearing tower
  corridors AT GENERATION time (filter in genTowers result). When a placement system
  fights the content 3+ times, remove the degree of freedom. Sound gate: lenis.stop()
  blocks wheel/touch but NOT native key/scrollbar scrolling — block scroll keys while
  modal is up; verify must click through ('.sound-gate__mute') on every page it opens.
  Flying ending: pointPastEnd became dive→pull-out→climb (C1 at the seam), Safari
  scale-swaps to a FinalePlane at over=7 — swap-by-scale masked by motion, fully
  scrub-reversible. Owner arc complete: crash read negative → now it ends airborne.

- **2026-07-05 (o)** — ROUND 10: ch3 noon → midnight (config re-grade + NightSky:
  shader-twinkle star dome, nebula sprites, shooting stars on deterministic clocks,
  everything faded by zoneFloat proximity). Lit-hoarding kit: floodlight bar + emissive
  face bump — any night chapter needs signage to carry its own light. LESSON: NightSky
  first built its BufferGeometry in useMemo per mount → +1 geometry per chapter
  roundtrip (mem probe caught it); biome-scale buffers must be module-cached like every
  field. Fonts: Fraunces (Google Fonts) for ch0–3 DOM titles via .title-card--vintage
  (chapter <= 3 in Overlay); canvas boards stay on system faces (webfont race). Day
  narrative is now dawn→morning→midnight→dusk→night→circuit — stylized, owner-approved.

- **2026-07-05 (n)** — ROUND 9: SoundPrompt (callout above HUD; CTA click IS the audio
  activation gesture; dismisses on any interaction incl. wheel so verify shots stay
  clean). GitHub Pages: aaryansinha16.github.io repo now holds BUILT output only (old
  portfolio lives in its history); deploy via scripts/deploy-pages.sh (`pnpm
  deploy:pages`) — clone pages repo, wipe all but .git, copy dist + .nojekyll + README,
  commit, push. Site verified live. NOTE: Pages deploys are MANUAL from this machine;
  Vercel stays auto-on-push. Two prod URLs now exist — deploy Pages after each approved
  round or the root domain drifts behind vercel.

- **2026-07-05 (m)** — ROUND 8, ch4 final. Root cause of "slow-mo doesn't work when
  tilted": the LOOK keyed to actual mounts, the SLOW WINDOW to stations — ±25m tower
  snap put them out of phase (ch2 worked because buildings snap ≤6m). Rule: any paired
  scroll-window + camera-behavior feature must key BOTH to the same coordinate; if
  mounts can drift, constrain the drift (≤10m) or mount at the station (freestanding).
  Verified numerically via window.__toScroll: probe (Δspline/Δscroll) in-window vs
  cruise = 12.7%. Station split: overhead gantries don't count against roadside rhythm —
  7 boards over the full zone (~64m) + gantries at midpoints.

- **2026-07-05 (l)** — ROUND 7. When a procedural mount keeps failing an aesthetic bar
  after two geometric-test hardenings, STOP hardening and switch mount types: content-level
  `freestanding: true` puts a board on roadside poles at its exact station — guaranteed
  visibility, keeps the rhythm, one line to apply to any future problem board. Fallback
  chains must never drop constraints silently (`?? cands[0]` re-broke separation AND
  occlusion in one expression). Glance economics: stretch 3.6 ≈ 18% of cruise; every
  deepening pairs with a SCROLL_PAGES bump (18→20→22) to hold cruise pacing constant.

- **2026-07-05 (k)** — ROUND 6. THE AUDIO BUG: 'wheel' is NOT a user-activation gesture —
  an AudioContext created/resumed in a wheel handler stays suspended ("not allowed to
  start") and if the arming listener is one-shot, sound is silent FOREVER on deploy while
  working in every headless probe (they never assert audibility). Arm audio only on
  pointerdown/keydown/touchstart and RETRY resume() per gesture until state==='running'.
  Perception lesson: a slow-mo window must hold a meaningful share of scroll (~2% runway
  here ≈ 300px) — 55px of half-speed is imperceptible no matter how mathematically real;
  when adding pause-budget, raise SCROLL_PAGES to keep cruise pacing constant. Occlusion
  checks must use REAL approach sight-lines (board → road points behind the station);
  straight tangent rays miss curve corners. Ch4 mounts: sort candidates by |lateral| for
  street-front towers; glance timing keys to the mount's projected along-m.

- **2026-07-05 (j)** — ROUND 5: glance dialed up (mix .85, half-rate windows), autopilot
  limit/4, ch4 mounts constrained (unused tower + ≥45m along-road separation + sight-line
  + board width fitted to its wall — 15m panels on 10m faces wrapped corners into
  neighbors). LESSON: any verify probe that references a SCROLL fraction breaks whenever
  the scroll→spline remap gains windows — always express probe positions in spline space
  and convert via window.__toScroll at runtime (the autopilot probe "failed" purely
  because ch6's scroll start moved from .843 to .861).

- **2026-07-05 (i)** — ROUND 4: the glance choreography. Architecture that keeps prime
  directive #1: story-board STATIONS live in a pure module (focusZones — data only, owns
  TUNNEL_LEN now); DetourManager folds them into the ONE piecewise scroll→spline remap as
  soft slow-mo windows (24m @ ~74% rate, scrollLen = span·1.35); biomes register ACTUAL
  board positions (focusTargets) and CameraRig lerps the look toward the active target
  with a trapezoid envelope (-26m rise, hold, +8m fall) × distance-scaled mix (0.55 max,
  floors at 0.35 — full commit at point-blank whips the camera). Register the board's
  REAL along-m (towers snap ±25m from station), keep slow windows on stations. ch4 boards
  + gantries now share one 9-station rhythm + a ray-walk occlusion check (reject mounts a
  nearer tower blocks). Verify: filter api.github.com 403s from the error gate (star
  fetches rate-limit under repeated runs; app handles it). Autopilot at limit/6 px/s.

- **2026-07-05 (h)** — POLISH ROUND 3. Autopilot lesson: NEVER cancel-on-input for
  handover features — trackpad momentum tails fire wheel events 1-2s after fingers lift,
  so "any input cancels" means "never runs" on real hardware while headless probes stay
  green. Quiet-period engage (0.8s silence) + pause-and-resume is the right shape; verify
  must SIMULATE the momentum tail. Text "duplication" on gantries was two stacked causes:
  DoF half-res bokeh ghosts mid-distance emissive text (keep signage inside worldFocusRange),
  and canvas fillText(maxWidth) condenses each glow pass differently → measure-fit ONE font
  size for all passes, never pass maxWidth to multi-pass text. Verify-harness lesson: the
  fps gate shared the screenshot marathon's browser — its GPU process reads ~10fps low
  afterward; perf now gets a fresh browser (and re-probe isolated before chasing "regressions").
  Banner plane: world-axis ellipses drift out of view — ambient flyers should orbit in the
  ROAD frame (along/lateral), low and tight. Ch5 ambient project signs removed: never show
  the same names twice (ambient + interactive) — reads as a render bug.

- **2026-07-05 (g)** — POLISH ROUND 2 (owner re-review: "still broken" items). Real root
  causes this time: (1) traffic jerk was ZoneRoad.at() NEAREST-SAMPLE snapping (4m grid) —
  movers need road.sample() lerp, statics can keep at(); (2) town floaters were an AXIS
  SWAP — box rotation.y=atan2(tx,tz) puts local X PERPENDICULAR to the street, the code
  spread windows "along the facade" down local X → slabs hung in air; rebuilt the loop on
  explicit (tangent, outward-normal) basis vectors. (3) autopilot died to trackpad inertia
  (single lenis tween + once-per-session arm) → per-tick immediate scrollTo from the gsap
  ticker, cancel on input, re-arm on leaving ch6; verify cancels it with a zero-delta
  WheelEvent nudge. (4) cliff dive: pointPastEnd() extrapolation; camera must RISE (+6.5m)
  during the dive or the lip occludes everything below the edge. (5) additive ribbon was
  invisible: winding mirrored vs the road builder → DoubleSide on thin FX ribbons, always.
  Also: hoardings/city boards got real canvas painters (ribbon+numeral+chip / era+progress
  bar), gantries over the road, showroom is a 96m slow-mo drive-through (detour spanMeters,
  ADR-16). Verify green: 60.2×3 fps, textures 79→79, autopilot probe asserts self-drive.
  NOTE: fps gate flaked once (49.3 @ village) purely from host load — re-probe before
  chasing ghosts.

- **2026-07-05 (f)** — POLISH ROUND (owner's 10 points) COMPLETE. Bugs: traffic frame-skip
  was stale instanced bounding spheres (frustumCulled=false); roadside flicker was road/
  terrain z-fight (deck→8cm) + shadow texel crawl (snap light target to 0.5m grid); vehicle
  flipped at spline end (lookAt degenerate — clamp along to end-4.5, camera to end-15.5).
  Audio: per-vehicle voices (bike ticks/moto lope/R15 rev/Safari sub) crossfaded at swap
  marks; sound ON by default via first-gesture arming. Content: village learning signs, town
  graffiti+house detail, highway ad-boards+windmills+banner plane+traffic detail, city career
  billboards w/ flicker, neon clickable in-world billboards (stars painted onto canvas),
  detour board craft pass, ch6 autopilot + interactive terminal. Leak lesson repeated:
  ANY per-mount material with a CanvasTexture map leaks on remount (banner) — singleton it.
  resume.pdf live (public/) + CONTACT.resumeUrl set. All gates green, 60fps, textures flat.

- **2026-07-05 (e)** — PHASE 6 COMPLETE (minus manual cross-browser + domain). Fuel-gauge
  loader on real boot signals; SYNTHESIZED audio (engine saws + wind noise, velocity-driven,
  night-darkened; starter ignition; off by default, HUD toggle); GFX pin in HUD (auto ratchet
  respects manual mode); StaticJourney chapter-card fallback for prefers-reduced-motion AND
  no-WebGL (zero canvas, confirmed); SEO (og.jpg from city shot, twitter meta, JSON-LD,
  sr-only content block); Vercel Analytics (hostname-guarded). Verify gained a memory probe
  (journey roundtrips + renderer.info diff) — caught PuffColumn CanvasTexture leak → puff
  texture is a singleton now; resources flat (93/51/37) across roundtrips. Owner TODOs:
  set CONTACT.resumeUrl='/resume.pdf' + drop file in public/; absolute og:image after domain;
  manual Firefox/Safari/mobile pass; Lighthouse on fallback path unmeasured (static cards,
  expected well ≥80).
- **2026-07-05 (d)** — PHASE 5 COMPLETE. Detour system: scroll→spline plateau remap (ADR-15)
  — store carries progress (scroll/UI) + splineProgress (world); world readers refactored.
  Ch2 painted-board strip (freelance years) + Ch5 neon holo strip (4 flagships w/ live
  GitHub stars, real links); in-world neon "◂ PROJECTS" signpost added at the Ch5 anchor.
  Contact terminal at the board's end (email/github/linkedin/medium; résumé button
  auto-appears when public/resume.pdf exists — owner: drop the file in). Verify stops are
  now spline-space via window.__toScroll. Repo pushed to github (aaryansinha16/portfolio)
  → Vercel auto-deploy. Flaky local preview-server restarts noted (kill+restart races);
  re-run verify if goto times out.
- **2026-07-05 (c)** — PHASE 4 COMPLETE. Resume became content source of truth: Parambhakti
  removed everywhere (owner request) — neon sign lineup is now AI-Trader/AIFlowo/MAESTRO/
  Devovia; real contact URLs (github/linkedin/medium/devovia.com); skill boards aligned to
  resume stack. Ch6 finale: feeder traces climb the ramp on the road deck → Manhattan board
  traces light up ahead of the vehicle (merged geometry + pulse-front shader), components
  rise as the front passes, gold pads/vias, blinking LEDs, silkscreen nameplate (contact
  stage). Ch0: ignition beat (headlight off at rest, on with first scroll) + fireflies.
  Tuning round: 5 wide feeders read as laser lanes → 3 thin ones. All verify green.
- **2026-07-05 (b)** — Phase 4 part 2: City + Neon art passes. Shared tower/window-grid
  machinery (world/towers.ts). City: window-lit towers, sodium streetlights, blinking rooftop
  beacons, bats, and the TUNNEL that swallows the city→neon boundary (dive in at dusk, emerge
  at night). Neon: AI-project signs in glowing tube text (canvas shadowBlur), neon strips w/
  two flicker materials, wet-road additive streaks, steam, sky drones. Bloom added with
  zone-driven intensity + update-skip while idle (bloom's mip chain at intensity 0 cost the
  DAY chapters ~9fps — patched bloom.update to no-op when idle). Bug caught by probe shots:
  left-side neon signs faced away (single-sided planes need the π flip both sides).
  Remaining Phase 4: Circuit finale + Prologue polish.
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
