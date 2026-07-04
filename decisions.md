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
