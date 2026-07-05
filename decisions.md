# decisions.md — Architecture Decision Records

Format: `ADR-N · date · decision · why · rejected alternatives`. Append-only; supersede, don't edit.

---

**ADR-1 · 2026-07-04 · Vite + React over Next.js**
This is one immersive canvas experience, not a content site. SSR/RSC add zero value to WebGL
and complicate three.js (window/context assumptions). SEO handled via DOM overlay content +
meta on a single route, plus a static fallback page.
*Rejected:* Next.js (SSR fights the canvas), vanilla three.js (R3F's ecosystem — drei,
postprocessing, lazy mounting — outweighs the abstraction cost).

**ADR-2 · 2026-07-04 · GSAP ScrollTrigger + Lenis for the scroll spine**
One master scrubbed timeline is the industry-proven pattern for scroll-choreographed 3D; Lenis
provides the momentum feel. drei `<ScrollControls>` is simpler but too limited for set-pieces,
pinned detours and horizontal sections.
*Rejected:* drei ScrollControls (ceiling too low), Theatre.js as the runtime driver (great
authoring, but runtime = another dependency in the hot path — we use Studio in dev to tune
keyframes, then bake values).

**ADR-3 · 2026-07-04 · Vehicle-growth narrative instead of character-growth**
Original concept: boy grows into a man walking through village→city. Rigged character + outfit
swaps + scroll-synced walk cycles = the single highest-risk asset/animation burden, and the most
likely source of "childish/incomplete" results. Vehicles (bicycle→motorcycle→R15→Safari) carry
the identical growth arc, need no rigging, and are more personally authentic (road-trip identity).
Human presence via silhouettes in swap set-pieces only.

**ADR-4 · 2026-07-04 · Stylized-cinematic low-poly as the art direction**
Photoreal is unreachable solo and ages badly; naive low-poly looks like a toy. The middle path —
low-poly geometry + filmic lighting/fog/grading (DESIGN.md) — is achievable procedurally, is
distinctive, and its quality lives in code (lighting/post), which is iterable with Claude Code.

**ADR-5 · 2026-07-04 · One day of light as the color script**
Career arc mapped to dawn→noon→dusk→night→beyond. Gives the journey a cinematic through-line,
makes chapter boundaries natural lighting transitions, and prevents palette chaos across biomes.

**ADR-6 · 2026-07-04 · No physics engine**
Vehicle follows the spline; "feel" is procedural (suspension bob, banking, FOV kicks, shake).
Physics (rapier) adds nondeterminism to a fully authored experience for zero visible benefit.

**ADR-7 · 2026-07-04 · Chapter streaming, ±1 mounted**
Whole journey in memory would blow mobile GPU memory and load time. ChapterManager mounts
active ±1, disposes on unmount. Costs: boundary-lerp complexity, strict biome isolation rules
(see CLAUDE.md). Accepted.

**ADR-8 · 2026-07-04 · Content as typed TS config, no CMS**
Portfolio content changes a few times a year; a CMS is overhead. `content.ts` with typed
chapter/project/detour schemas keeps copy reviewable in PRs.

**ADR-9 · 2026-07-04 · 4x MSAA (composer multisampling) instead of SMAA**
SMAA from postprocessing spams `glBlitFramebuffer: Read and write depth stencil attachments
cannot be the same image` every frame on Chrome's ANGLE-Metal backend (macOS) — a failing GL
op in user-facing browsers, isolated empirically with the composer A/B'd pass by pass.
`<EffectComposer multisampling={4}>` renders clean, has equal/better edge quality on this
geometry, and cuts ~57KB gzip (SMAA lookup textures).
*Rejected:* SMAA (the bug), FXAA (softer than MSAA for hard low-poly edges), canvas-level
antialias (does nothing once the composer renders offscreen).

**ADR-10 · 2026-07-04 · React 18 + R3F v8 line (fiber 8 / drei 9 / postprocessing 2)**
README pins React 18; fiber 9/drei 10 require React 19 and would force the whole ecosystem
forward mid-build for zero visual gain. Locked: three 0.169, fiber 8.17, drei 9.122,
postprocessing 2.16, zustand 5, lenis 1.1, gsap 3.12. Revisit only as its own migration task.

**ADR-11 · 2026-07-04 · Vehicles modeled procedurally, not sourced (v1)**
Phase 2 allowed "source glTF or model simple one" for the bicycle. Modeled it from primitives
(~20 meshes: tube helper + torus wheels + emissive lamp). Wins: zero asset pipeline, zero
licensing risk, style-locked to the world by construction, headless-verifiable. The Phase 3
decision point stands for R15/Safari — if primitives can't hit "reads as THAT vehicle,"
source CC glTFs then (memory.md open thread).
*Rejected for now:* downloading Sketchfab/Quaternius assets (license vetting + gltf pipeline
before the visual formula was proven).

**ADR-12 · 2026-07-04 · postprocessing pinned to 6.36.4 (pnpm override)**
6.38+ introduced a "stable depth texture" that's re-populated every frame via
gl.blitFramebuffer — that blit throws GL_INVALID_OPERATION per frame on Chrome's ANGLE-Metal
backend (macOS) whenever any effect consumes depth (DoF; SMAA's depth path too). 6.36.4 uses
the older attach-depth-texture-directly architecture: verified 0 GL warnings with
4x MSAA + DepthOfField. Supersedes the "MSAA works around it" half of ADR-9 (SMAA→MSAA choice
stands on quality/size regardless). Unpin when postprocessing fixes the Metal blit upstream.

**ADR-13 · 2026-07-04 · One-way adaptive quality ratchet (no promotion)**
Real-device testing (Retina dpr 2) showed ~35fps sustained + a 146ms chapter-mount hitch —
the earlier headless verification ran at dpr 1 and hid it. Fixes: (a) quality tiers driven by
drei PerformanceMonitor stepping DOWN only — dpr 2→1.5→1.2, composer MSAA 4→2→0, DoF high-only;
(b) DoF bokeh at half resolution; (c) chapter zone meshes module-cached and re-attached
instead of rebuilt (remounts were re-uploading geometry and recompiling programs).
Promotion is deliberately absent: vsync caps a comfortable medium at 60fps, which is
indistinguishable from a struggling 60, so inclining flip-flops the composer (each rebuild
≈ one 100ms+ frame). Result: 60fps flat at dpr 2 even with 2x CPU throttle. Verification now
measures at deviceScaleFactor 2. Manual quality toggle + real device detection stay Phase 6.
*Rejected:* incline/decline with fallback (measured flip-flop rebuild spikes), static
medium-start (punishes strong machines' first impression for nothing).

**ADR-14 · 2026-07-04 · Vehicle swaps are continuous scroll functions, not camera cuts**
DESIGN.md sketched swaps as whip-pan cuts with silhouettes. Implemented instead as pure
functions of scroll progress: the old ride eases onto the left shoulder with a C1-continuous
deceleration profile and parks (side-stand lean, nosed-out); the new ride waits past the
boundary and launches on a hermite curve that catches the follow point with matched velocity.
Why: scrub-reversibility (scrolling backward replays the swap in reverse — timeline cuts
can't do that gracefully), zero authored-state, and the parked old ride stays in the world
as narrative set dressing. The whip-pan + silhouette figure remains a possible Phase 4
flourish (Theatre.js authored camera on the master timeline), layered ON TOP of this.
Also: ONE shared headlight pool instead of per-vehicle point lights — 2–3 dynamic lights
cost ~15fps at dpr 2 AND changing light counts at swap boundaries forced three.js to
recompile every program.

**ADR-15 · 2026-07-05 · Detours pause the world via a scroll→spline plateau remap**
DESIGN says "the journey pauses and a horizontal strip takes over." Implemented as a
piecewise-monotonic remap: scroll progress keeps advancing; SPLINE progress (the world's one
coordinate) plateaus inside detour windows while the DOM strip translates horizontally as a
function of the same scroll. The store now carries both (progress = scroll/UI, splineProgress
= world); the master timeline's mapping is no longer identity but remains one pure reversible
function — scrubbing back re-drives the strip and un-pauses in reverse. Vehicle velocity
derives from spline deltas, so the rider genuinely stops at each detour (wheels, bob, dust
all idle). Verify stops are spline-space, converted at runtime via window.__toScroll.
*Rejected:* pinned ScrollTrigger sections (a second scroll consumer — violates prime
directive #1), slow-rolling background under the strip (weaker beat, and the DESIGN brief
explicitly says pause).

**ADR-16 · 2026-07-05 · World detours roll in slow motion (spanMeters), strips still plateau**
Owner: the ch5 showroom shouldn't park the rider — "make the vehicle move but in slow
motion". DetourDef gained spanMeters: inside a window the spline now advances linearly by
that many meters over the window's scrollLen (0 = the old plateau). The scroll→spline remap
stays piecewise and reversible; K becomes (1-Σspan)/(1-Σpause) so both axes still land on 1
together. The four clickable boards spread along the 96m run (~27m apart), and vehicle
speed falls out of spline deltas automatically (~30% cruise through the showroom).
*Rejected:* time-based slow-mo (breaks scrub purity), camera-only slowdown (vehicle
visibly parks, which is the exact complaint).

**ADR-17 · 2026-07-05 · The finale is a cliff; the fall is spline extrapolation, not physics**
The road, dashes and PCB all stop at CLIFF_START_M (spline end − 10m): torn-lip slabs,
glowing trace stubs, warning LEDs, a silkscreen "END OF ROAD". pointPastEnd(m) continues
past the edge along the end tangent with a parabolic drop (y −= 0.048·over²); the vehicle
caps at +14m and takes a slow roll, the camera keeps its deck position but rises 6.5m with
the dive (from chase height the lip occludes everything below the edge — found via
screenshot review), and its look target rides the same extrapolation. Everything is a pure
function of scroll, so scrolling up rewinds the fall mid-air. Autopilot (per-tick lenis
steps, input-cancellable, re-armed on chapter exit) drives you off the edge hands-free.
*Rejected:* time-driven fall animation (not reversible), physics impulse (same), ending the
scroll runway at the edge (loses the beat the owner asked for).
