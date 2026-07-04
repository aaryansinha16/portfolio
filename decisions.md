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
