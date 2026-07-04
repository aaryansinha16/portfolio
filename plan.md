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
- [ ] Vercel project connected, deploys on push to main ← needs owner's Vercel account

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

- [ ] Ch3 Highway: heat haze shader, hoardings (double as skill boards), distant hills, traffic
      (instanced, simple lane logic)
- [ ] Ch2 Town: denser props, market street, wires/poles, first "detour" signpost
- [ ] Ch4 City: tower silhouettes with emissive window grids (instanced planes), dusk gradient,
      tunnel dive set-piece into Ch5
- [ ] Ch5 Neon: wet-road reflection (planar or SSR-cheap trick), neon signage for AI projects,
      rain streaks optional
- [ ] Ch6 Circuit: road ramps onto giant PCB; traces animate with scroll (shader on merged
      trace geometry); components rise from the board; ends at contact section
- [ ] Ch0 Prologue: title card, engine-start interaction ("press to start" → ignition sound +
      first scroll hint)

**Accept:** full journey at quality bar; checklist passes per chapter; chapter-boundary lerps
seamless.

## Phase 5 — Content & detours

- [ ] `DetourManager`: horizontal scroll strips at Ch2 (freelance work), Ch5 (AI-Trader, AIFlowo,
      Parambhakti, Devovia — each a neon hologram panel w/ live links + GitHub stats)
- [ ] About/skills content woven into world objects (hoardings, signboards) + overlay copy
- [ ] Contact section on the circuit board: terminal-styled form or direct links (email,
      GitHub, LinkedIn), résumé download
- [ ] Full copywriting pass per DESIGN.md voice rules

**Accept:** a recruiter can extract role, stack, 4 flagship projects, and contact within the
experience without friction — the experience never hides the information.

## Phase 6 — Polish, resilience, ship

- [ ] Loading experience: fuel-gauge/odometer loader with asset progress (drei useProgress);
      chapters 2+ stream in behind the prologue
- [ ] Audio (off by default, tasteful toggle): engine layer tied to scroll velocity, per-chapter
      ambience crossfades
- [~] Quality tiers: auto tier ratchet shipped early (ADR-13); manual toggle + real device detect remain; mobile gets reduced
      post + density but the SAME journey
- [ ] `prefers-reduced-motion` fallback: chapter-card mode
- [ ] Fallback static page for WebGL-unavailable + SEO: meta/OG tags, prerendered content in
      DOM for crawlers (the overlay copy already lives in DOM — verify it's indexable)
- [ ] Perf pass in `pnpm preview`: budget check per chapter, memory profile across full journey
      (leak check on chapter mount/unmount cycles)
- [ ] Cross-browser: Chrome/Firefox/Safari desktop, iOS Safari, Android Chrome
- [ ] Domain, analytics (Plausible or Vercel), OG image (a Phase-2 poster shot)

**Accept:** Lighthouse perf ≥ 80 on the fallback path, smooth on a mid phone, share-card looks
great, zero console errors.

---

## Deliberate scope cuts (v1)

- No rigged/animated human character (silhouette tricks only) — see decisions.md ADR-4
- No physics engine — vehicle motion is spline-following + procedural bob (ADR-6)
- No CMS — content in typed TS config; it changes rarely
- No i18n, no dark/light toggle (the film has one grade)
