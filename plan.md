# plan.md — Build Plan

Strategy: **spine first, beauty second, scale third.** The riskiest part is scroll→camera feel;
the second riskiest is proving the visual bar. Both are de-risked before building all six
chapters. Phase 2 is the go/no-go gate: if the village slice doesn't look premium, we fix the
formula there — not after five more biomes exist.

Statuses: `[ ]` todo · `[~]` in progress · `[x]` done

---

## Phase 0 — Scaffold & quality gates

- [ ] Vite + React + TS scaffold, pnpm, eslint/prettier, strict tsconfig
- [ ] Deps: three, @react-three/fiber, @react-three/drei, @react-three/postprocessing, gsap,
      lenis, zustand, @theatre/core + @theatre/studio (dev only), r3f-perf (dev only)
- [ ] `Experience.tsx`: Canvas with ACESFilmicToneMapping, SRGBColorSpace, shadows, dpr [1, 2]
- [ ] Post chain mounted (SMAA + Vignette to start)
- [ ] `?debug` flag: r3f-perf, axes/grid helpers, free-fly camera toggle
- [ ] Vercel project connected, deploys on push to main

**Accept:** empty graded scene deploys to a URL, 60fps, debug tooling works.

## Phase 1 — The Spine (scroll → spline → camera) ← highest risk, do carefully

- [ ] `roadPath.ts`: CatmullRomCurve3 for the FULL journey (~2,500–3,500 units), with named
      progress marks per chapter boundary and set-piece
- [ ] Procedural road ribbon extruded along the spline (custom geometry, UVs for dashes)
- [ ] Greybox world: untextured terrain blocks + box "buildings" per chapter zone, fog on
- [ ] `ScrollSpine.ts`: Lenis + one ScrollTrigger, page height ≈ 700vh, normalized progress in
      Zustand, master GSAP timeline scrubbed ~0.8
- [ ] `CameraRig`: position = curve.getPointAt(p) + offset; look-at leads by ~6 units; banking
      on curves; FOV kick with scroll velocity
- [ ] Placeholder vehicle (box) driving the spline
- [ ] `ChapterManager`: mount active ±1 chapters, dispose on unmount; `?chapter=N` jump
- [ ] Progress rail UI (right edge) with clickable chapter dots

**Accept:** scrolling drives the greybox journey end-to-end with buttery momentum, zero jank at
chapter boundaries, and it already *feels* like driving. Get Shreya to scroll it — if her
reaction is meh at the feel level, tune before Phase 2.

## Phase 2 — Vertical slice: Village Dawn at full quality ← the visual go/no-go gate

- [ ] ColorScript system: per-chapter env config (fog, sun, sky gradient, grade) with boundary
      lerps
- [ ] Village biome: low-poly terrain w/ vertex-color variation, instanced trees/huts/fields,
      3-layer depth (fields → huts/trees → fog-faded hills)
- [ ] Dawn lighting: warm key sun low on horizon, long soft shadows, sky gradient shader
- [ ] Ambient movers: birds (instanced, simple sine paths), smoke wisps from chimneys, swaying
      crops (vertex shader)
- [ ] Bicycle model (source glTF or model simple one), wheel rotation + lean tied to speed
- [ ] Full post chain tuned for this chapter; DoF focused on bicycle
- [ ] Chapter title overlay + first copy pass
- [ ] Run the DESIGN.md quality checklist; screenshot poster test

**Accept:** three screenshots from this chapter that could pass as an indie-game press kit.
This locks the visual formula every other chapter copies.

## Phase 3 — Vehicles & swap set-pieces

- [ ] Source/optimize all four vehicles (gltf-transform: draco, texture resize). Safari and R15
      should read as *those* vehicles — spend asset budget here
- [ ] `VehicleManager` + swap set-pieces at boundaries 1→2, 2→3, 3→4 (silhouette + whip-pan
      technique from DESIGN.md — no rigged character)
- [ ] Vehicle feel: suspension bob, wheel spin, headlight glow, dust/exhaust particles

**Accept:** each swap is a "wait, that was cool" moment; vehicles never feel like static props.

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
- [ ] Quality tiers: auto-detect (GPU/devicePixelRatio) + manual toggle; mobile gets reduced
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
