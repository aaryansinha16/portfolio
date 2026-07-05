# plan.md — Build Plan

Strategy: **spine first, beauty second, scale third.** The riskiest part is scroll→camera feel;
the second riskiest is proving the visual bar. Both are de-risked before building all six
chapters. Phase 2 is the go/no-go gate: if the village slice doesn't look premium, we fix the
formula there — not after five more biomes exist.

Statuses: `[ ]` todo · `[~]` in progress · `[x]` done

---

## Phase 0 — Scaffold & quality gates

- [x] Vite + React + TS scaffold, pnpm, eslint/prettier, strict tsconfig
- [x] Deps: three, @react-three/fiber, @react-three/drei, @react-three/postprocessing, gsap,
      lenis, zustand, @theatre/core + @theatre/studio (dev only), r3f-perf (dev only)
- [x] `Experience.tsx`: Canvas with ACESFilmicToneMapping, SRGBColorSpace, shadows, dpr [1, 2]
- [x] Post chain mounted (4x MSAA + Vignette + grain — SMAA rejected, see ADR-9)
- [x] `?debug` flag: r3f-perf, spline visualizer, boundary markers, free-fly camera (F)
- [x] Vercel project connected (github.com/aaryansinha16/portfolio), deploys on push to main

**Accept:** empty graded scene deploys to a URL, 60fps, debug tooling works.

## Phase 1 — The Spine (scroll → spline → camera) ← highest risk, do carefully

- [x] `roadPath.ts`: CatmullRomCurve3 for the FULL journey (~3,400 units), with computed
      progress marks per chapter boundary (`CHAPTER_MARKS`)
- [x] Procedural road ribbon extruded along the spline (vertex-tinted per chapter, instanced
      centerline dashes)
- [x] Greybox world: vertex-colored ground + instanced box props + far silhouettes per zone,
      fog + full color script lerping across all 7 zones (pulled forward from Phase 2)
- [x] `ScrollSpine.ts`: Lenis + one ScrollTrigger, normalized progress in Zustand, master GSAP
      timeline scrubbed 0.8 — page height 1800vh, not 700vh (700 made a chapter one wheel-flick;
      tune via `SCROLL_PAGES`)
- [x] `CameraRig`: position = curve.getPointAt(p) + offset; look-at leads vehicle by ~6 units;
      banking on curves; FOV kick + speed shake from scroll velocity
- [x] Placeholder vehicle (box) driving the spline 8.5m ahead of camera, headlamp + taillight
      signature glow, suspension bob
- [x] `ChapterManager`: mount active ±1 chapters, dispose on unmount; `?chapter=N` jump
- [x] Progress rail UI (right edge) with clickable chapter dots + hover titles

**Accept:** scrolling drives the greybox journey end-to-end with buttery momentum, zero jank at
chapter boundaries, and it already *feels* like driving. Get Shreya to scroll it — if her
reaction is meh at the feel level, tune before Phase 2.

## Phase 2 — Vertical slice: Village Dawn at full quality ← the visual go/no-go gate

- [x] ColorScript system: per-chapter env config (fog, sun, sky gradient dome w/ sun glow,
      exposure-as-grade) with boundary lerps; per-chapter camera framing (height/right/fov/chase)
      lerped the same way
- [x] Village biome: rolling flat-shaded terrain w/ vertex-color variation + baked field rows,
      instanced trees/huts/crops, 3-layer depth (fields → huts/trees → fog-faded hills)
- [x] Dawn lighting: warm key sun low on horizon, long soft shadows, sky gradient shader
      (peach→lavender dome + sun glow)
- [x] Ambient movers: birds (instanced V-flock, sine paths), smoke wisps from hearth huts,
      swaying crops (vertex-stage sway injected via onBeforeCompile)
- [x] Bicycle modeled procedurally (ADR-11), wheel spin + lean into curves tied to speed
- [x] Full post chain tuned: 4x MSAA, DoF focused on the vehicle (postprocessing pinned — ADR-12),
      vignette, grain
- [x] Chapter title overlay + first copy pass (from Phase 1)
- [x] DESIGN.md quality checklist run; poster test: shots/01a–01c

**Accept:** three screenshots from this chapter that could pass as an indie-game press kit.
This locks the visual formula every other chapter copies. ← formula locked; owner eyeball
on shots/01a–01c.png is the final sign-off

## Phase 3 — Vehicles & swap set-pieces

- [x] All four vehicles modeled procedurally from a shared parts kit (ADR-11 held — no glTF
      pipeline needed): commuter motorcycle (maroon tank, mirrors, chrome exhaust), R15
      (racing-blue wedge fairings, tail-up stance, twin headlight slits), Safari (stepped
      rear roof, roof rails, vertical taillights, flared arches). Screenshot-verified reads.
- [x] `VehicleManager` swap choreography at boundaries 1→2, 2→3, 3→4: pure function of scroll
      progress — old ride decelerates onto the left shoulder and parks (side-stand lean,
      nosed-out), new ride waits past the boundary and launches to catch the follow point
      with matched velocity. Fully scrub-reversible (ADR-14; whip-pan cut variant deferred
      to Phase 4 Theatre set-piece polish)
- [x] Vehicle feel: suspension bob, wheel spin (velocity-capped), curve lean per vehicle
      (bikes bank in, Safari rolls faintly out), ONE shared headlight pool (per-vehicle
      lights cost 15fps + forced recompiles), speed-driven dust trail tinted by chapter air

**Accept:** each swap is a "wait, that was cool" moment; vehicles never feel like static props.
← owner scroll-through of the three boundaries is the sign-off; shots/s1–s3 for stills

## Phase 4 — Remaining biomes (formula scaling)

Order: 3 Highway (simplest) → 2 Town → 4 City → 5 Neon → 6 Circuit → 0 Prologue polish.

- [x] Ch3 Highway: heat haze shader (zone-driven UV wobble in the merged post pass), skill
      hoardings (sun-bleached canvas-text boards — the stack as roadside ads), scrub plains,
      milestone stones, oncoming traffic (instanced, opposite lane), soaring kites
- [x] Ch2 Town: dense shop street (plaster facades, awnings, painted signboards incl. the
      cyber café), power poles + sagging wires, market clutter, laundry-line sway, pigeons,
      chai smoke, first "detour" signpost (Phase 5 strip lands there)
- [x] Ch4 City: window-lit towers (shared window-grid machinery), sodium streetlights,
      blinking rooftop beacons, bats — and the tunnel that swallows the boundary into night
- [x] Ch5 Neon: wet-road streak trick (additive gradient smears under lights), AI-project
      signs in glowing tube text, flickering strips, steam, sky drones; Bloom joins the post
      chain (zone-driven intensity, update skipped while idle so day chapters pay nothing)
- [x] Ch6 Circuit: feeder traces climb the ramp ON the road deck ("the road becomes the
      board", literally), then Manhattan-routed board traces light up ahead of the vehicle
      (merged geometry + pulse-front shader, scrub-reversible); components rise as the front
      passes; gold pads/vias, blinking status LEDs, silkscreen nameplate = contact stage
- [x] Ch0 Prologue: title card ✓; visual ignition beat (headlight pool off at rest, turns on
      with the first scroll — pure progress function), fireflies over the pre-dawn grass;
      ignition SOUND lands with Phase 6 audio

**Accept:** full journey at quality bar; checklist passes per chapter; chapter-boundary lerps
seamless.

## Phase 5 — Content & detours

- [x] `DetourManager`: the journey PAUSES via a scroll→spline plateau remap (ADR-15) while a
      horizontal strip takes over — Ch2 painted-board panels (freelance years), Ch5 neon
      hologram panels (AI-Trader, AIFlowo, Maestro, Devovia) w/ live links + GitHub star
      counts; in-world signposts anchor both stops
- [x] About/skills content woven into world objects (skill hoardings, shop signboards,
      silkscreen nameplate) + chapter copy
- [x] Contact section on the circuit board: terminal-styled direct links (email, GitHub,
      LinkedIn, Medium); résumé button appears automatically once public/resume.pdf exists
- [x] Copywriting pass per DESIGN.md voice rules — resume is the content source of truth

**Accept:** a recruiter can extract role, stack, 4 flagship projects, and contact within the
experience without friction — the experience never hides the information.

## Phase 6 — Polish, resilience, ship

- [x] Loading experience: fuel-gauge loader sweeping on REAL boot signals (mount → fonts →
      WebGL context → first painted frames) — everything is procedural, so there are no asset
      bytes to track; chapters already stream ±1 by design
- [x] Audio (off by default, HUD toggle): SYNTHESIZED engine (detuned saws, pitch/gain ride
      scroll velocity) + wind bed (noise, opens with speed, darkens at night = the ambience
      crossfade), starter-whirr ignition; zero asset downloads
- [x] Quality tiers: auto ratchet (ADR-13) + manual GFX pin in the HUD (persisted); mobile
      gets reduced dpr/post via the same tiers, same journey
- [x] `prefers-reduced-motion` fallback: chapter-card mode (StaticJourney — palette-gradient
      cards, full copy, detour content, contact links; zero canvas)
- [x] WebGL-unavailable fallback: same StaticJourney; SEO: OG/twitter meta + og.jpg (city
      poster shot), JSON-LD Person, sr-only full-content block on the 3D path
- [x] Perf/memory pass: verify now runs journey roundtrips and diffs renderer resources —
      caught + fixed a CanvasTexture leak (PuffColumn per-mount textures); geometries/
      textures/programs now flat across roundtrips
- [~] Cross-browser: Chrome (desktop) automated in verify; CSS compat fallbacks added
      (color-mix border fallback) + mobile media queries — Firefox/Safari/iOS/Android are a
      manual owner pass
- [~] Analytics: Vercel Analytics wired (hostname-guarded locally). OG image ✓. Domain +
      absolute og:image URL = owner decision

**Accept:** Lighthouse perf ≥ 80 on the fallback path, smooth on a mid phone, share-card looks
great, zero console errors.

---

## Polish round 7 — deeper slow-mo, Masai freestanding, station rhythm (2026-07-05) — ALL DONE

- [x] 1: glance slow-mo deepened to ~18% of cruise (stretch 3.6, 22m windows ≈ 400px of
      scroll each); SCROLL_PAGES 20 → 22 keeps cruise pacing identical
- [x] 2: Masai School is a FREESTANDING roadside billboard now (content flag) — its
      stretch of the street is dense and tower mounts kept reading cramped at glance
      angles; roadside mounts are guaranteed unoccluded. Sight test also hardened:
      rays from the board's edges, not just its center
- [x] 3: board spacing restored — the `?? cands[0]` fallback was silently dropping BOTH
      the separation and sight rules; now strict tower picks only, with the freestanding
      roadside mount as the guaranteed fallback exactly AT the station (45.8m rhythm)
- [x] 4: autopilot +40% again — rest of ch6 in ~2s

## Polish round 6 — perceivable slow-mo, road-side mounts, LIVE AUDIO (2026-07-05) — ALL DONE

- [x] 1: Masai/Brainerhub kept on ROAD-SIDE first-row walls — candidates sort by
      |lateral| (street-front towers first) and the occlusion test now walks the
      driver's ACTUAL approach sight-lines (mount → road positions 14–56m back) instead
      of a straight station-tangent ray that missed curve geometry
- [x] 2+3: the glance slow-down is now FELT — the old 24m window crossed in ~55px of
      scroll, gone before perception. Windows are 26m at stretch 2.6 (~38% of cruise,
      ~2% of the runway each) and phased in camera coordinates to sit under the tilt's
      hold; SCROLL_PAGES 18 → 20 keeps cruise pacing unchanged. Tilt raised again
      (mix 0.92, proximity floor 0.68) so ch2's close rooftop boards get the full turn
- [x] 4: autopilot +40% again — the rest of ch6 in ~3s
- [x] 5: DEPLOYED AUDIO WAS SILENT — 'wheel' is not a browser user-activation gesture,
      so arming sound on scroll built an AudioContext the browser refused to start, and
      the one-shot listener never retried. Sound now arms on pointerdown/keydown/
      touchstart only, and enable() keeps retrying resume() on every real gesture until
      the context is actually running (ignition beat fires once audible)

## Polish round 5 — glance strength + ch4 mount constraints (2026-07-05) — ALL DONE

- [x] 1: glance tilt strengthened — FOCUS_MIX 0.55 → 0.85, proximity floor 0.5 (the
      camera now commits to the board)
- [x] 2: glance slow-down deepened — windows run at HALF the nominal rate (stretch 2.0)
- [x] 3: ch6 autopilot +50% again — rest of the chapter in ~4s (probe: 1452px/3.5s)
- [x] 4: Masai/Brainerhub panels intersected — stations kept them apart on paper but
      tower-snapping (±25m) collapsed the mounts into neighbors, and 15m panels overflow
      narrow faces past corners. Mount picking now enforces: unused tower + ≥45m
      along-road separation from every other sign + clear sight-line; board width fits
      its wall (min(15, faceW + 1.5))
- [x] 5: Paisaeasy gap — same separation constraint covers it (verified: gantry →
      Paisaeasy → Eigenlytics each alone on approach)
- [x] verify: autopilot probe entry is spline-space now — hardcoded scroll fractions
      broke the moment new remap windows moved ch6's scroll start

## Polish round 4 — pace + the glance choreography (2026-07-05) — ALL DONE

- [x] 1: ch6 autopilot pace — ~2.5× faster (rest of the chapter in ~6s, quick 1.3s
      pull-away); verified 1150px of self-drive in the 3.5s probe window
- [x] 2: ch4 stacking for real this time — boards AND gantries share one evenly spaced
      9-station rhythm (no two signs in one sight-line), plus a ray-walk occlusion check
      so a mount is rejected if a nearer tower blocks its approach view (the FREELANCE
      board hid behind one)
- [x] 3: THE GLANCE — passing any story board (6 town rooftops, 7 city career signs)
      now slows the ride ~26% for 24m while the camera eases its gaze toward the board
      and back to the road. Built as: pure shared stations (focusZones), extra windows
      in the ONE scroll→spline remap (DetourManager — same machinery as the showroom
      slow-mo), and a focus-target registry the biomes fill with actual board positions
      (CameraRig blends the look, distance-scaled so near boards get a soft turn, far
      boards a committed one). Fully scrub-reversible.

## Polish round 3 — owner re-review (2026-07-05) — ALL DONE

- [x] 1: village sign posts poked over the panel → twin posts now sit BEHIND the board,
      tops tucked under its upper edge. Content is real journey copy: three rural
      hoardings ("IT ALL STARTED WITH NO-CODE GIGS", "SELF-TAUGHT: HTML → CSS → JS",
      "FIRST FREELANCE ₹ BEFORE ANY JOB TITLE") between the quirky small markers
- [x] 2: town says something now — six rooftop hoardings on houses with real gaps
      (~90m apart, alternating sides): WordPress→custom code, first React app, 12+
      freelance builds, socket.io chat, payments, Shopify
- [x] 3: highway fog 0.0052 → 0.0034 (clear noon); the banner plane flies a LOW,
      ROAD-ALIGNED circuit (y≈22, ±42m of the lanes, 45s loop) at 1.45× scale with a
      bigger brighter banner — it crosses the driver's view every pass
- [x] 4: gantry text "duplicated above each other" = TWO stacked causes: DoF half-res
      bokeh ghosting mid-distance emissives (focusRange 30→70, bokehScale 2.2→1.5) AND
      the glow painter's per-pass maxWidth condensation misregistering long titles
      (now one measured-to-fit font for all passes + subs render in glow mode).
      Career boards keep 34m clear of gantries; face choice blends road-facing with
      APPROACH-facing (Eigenlytics × Luxia now fronts the driver)
- [x] 5: showroom span 96m → 190m (~55m between boards), boards out at 13.5m lateral,
      and neon towers are CLEARED out of the showroom corridor (road-projection filter)
      — no more half-swallowed Maestro/Devovia. Ambient AI-name neon signs removed
      (they duplicated the clickable boards' content)
- [x] 6: autopilot never engaged on real hardware — v2 cancelled on the trackpad's own
      momentum tail. v3 engages after 0.8s of input SILENCE, pauses on any input,
      re-engages when quiet, re-arms on leaving ch6. Verify now simulates a momentum
      tail before asserting self-drive

## Polish round 2 — owner feedback on the first pass (2026-07-05) — ALL DONE

- [x] 1: town elements STILL floating — root cause found: the facade code treated a
      yaw-rotated box's local X as "along the street" when it is perpendicular. Whole
      building loop rebuilt on explicit basis vectors (tangent + outward normal); windows
      became glass + sill + lintel; signs/graffiti planes now face the road on both sides
- [x] 2a: oncoming traffic STILL skipped frames — real cause: ZoneRoad.at() snaps to the
      4m sample grid, so movers teleported in 4m steps. Added road.sample() (lerped
      position + tangent); traffic now glides
- [x] 2b: traffic vehicles = 2 blocks — rebuilt as merged vertex-colored classes
      (sedan/hatch/lorry/bus) with hoods, cabins, glass, bumpers, wheels + a basic-material
      light pass; 1 body + 1 light draw call per class, DynamicDrawUsage
- [x] 2c: ch3 hoardings boring — vintage AD-SPACE posters: diagonal accent ribbon, giant
      numeral, auto-fit headline, payoff chip, weathering; 13×5.7m, tipped toward the road,
      slight self-light
- [x] 3: ch1 sign text invisible in dawn shade — boards enlarged (2.3m), brighter paint,
      emissiveMap lift 0.42, twin posts, pulled closer to the shoulder
- [x] 4: ch4 boards too high / too sparse — hung at 9.6–12.4m on the road-facing face
      (per-face half-extent fixed: max(w,d)/2 floated boards off narrow faces), 15×7.4m,
      denser painter (era chip, glow title, payoff, career progress bar i/7) + two gantries
      spanning the road you drive under
- [x] 5: neon strips on the road made no sense — the wet-road streak planes deleted;
      NeonRoadFlow added: cyan/magenta lines hugging both road edges with pulses streaming
      in the travel direction
- [x] 6: ch5 boards too close together + vehicle stopped — detours now support spanMeters:
      the showroom window covers 96m of road in slow motion (~30% cruise speed); the four
      clickable boards spread ~27m apart along the run
- [x] 7: autopilot "not implemented" — v1 was one long lenis tween: any trackpad inertia
      cancelled it, and it armed once per session. Now per-tick immediate scrollTo steps
      driven from the gsap ticker, eased ramp-in, cancelled by real input, re-armed on
      leaving ch6
- [x] 8: cliff ending — the road/board/dashes stop 10m short of the spline end (torn-lip
      slabs, glowing trace stubs, warning LEDs, silkscreen "END OF ROAD"); past the edge
      pointPastEnd() extrapolates along the end tangent with a parabolic drop, the ride
      sails off nose-down with a slow roll, and the camera rises 6.5m during the dive to
      watch over the lip. All of it a pure function of scroll — scrolling up reverses the
      fall

## Polish round — owner feedback (2026-07-05) — ALL DONE

- [x] 1+9+10: per-vehicle audio voices crossfaded at swap boundaries (bicycle = freewheel
      ticks + wind + bell, NO engine; moto lope / R15 rev / Safari sub); sound ON by default,
      armed on first gesture (explicit mute persists)
- [x] 2: roadside flicker — road deck lifted to 8cm, terrain polygonOffset, shadow frustum
      snapped to a world grid (texel crawl), normalBias up
- [x] 3: ch1 tagline → self-taught HTML/CSS/JS days; 6 hand-painted learning signboards
- [x] 4a: town parapets + plinths + proud window frames (glass inset), roofline margin so
      windows never float against sky; sprayed graffiti on plain facades
- [x] 4b: ch2 detour boards — paper grain, tape strips, marker underlines, SHIPPED×12 stamp,
      coffee ring, per-board motion as they cross the stage
- [x] 5a: traffic frame-skipping = stale instanced bounding spheres → frustumCulled off
- [x] 5b: traffic wheels ×4, windshields, truck cabs
- [x] 5c: hoardings 9.6×4.4 vintage-ad style w/ accent bars + the banner plane circling
      overhead ("5+ YRS · 12+ APPS · AI-NATIVE")
- [x] 5d: nine wind turbines with spinning rotors along the highway
- [x] 5e: Brainerhub facts on the boards (3+ solo projects, ad-analytics ×4, Rising Star)
- [x] 6: ch4 = the career chapter — 7 glitch-flickering tower billboards (freelance →
      AcadBoost → Masai → Brainerhub → OpenAI/Meta → Paisaeasy → Eigenlytics×Luxia) + arc tagline
- [x] 7a: puddle strips cut; every neon strip now mounted on a dark backing panel
- [x] 7b: ch5 = clickable in-world billboards (hover glow, live GitHub stars painted into
      the canvas, click opens) — DOM cards removed for this stop
- [x] 8a: ch6 autopilot — entering the circuit eases the ride to the road's end (user
      scroll takes back control)
- [x] 8b: interactive terminal — Enter on `contact --now` opens email; help / whoami /
      projects / open <name> / resume / github / linkedin / medium / clear

## Deliberate scope cuts (v1)

- No rigged/animated human character (silhouette tricks only) — see decisions.md ADR-4
- No physics engine — vehicle motion is spline-following + procedural bob (ADR-6)
- No CMS — content in typed TS config; it changes rarely
- No i18n, no dark/light toggle (the film has one grade)
