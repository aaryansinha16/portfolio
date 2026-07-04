# DESIGN.md — Art Direction Bible

**One sentence:** a cinematic road movie about a builder's life, told in stylized low-poly,
graded like a film — never like a toy.

The reference cluster: *Alto's Odyssey* (gradients, silhouettes), *Firewatch* posters (layered
atmospheric depth), Monument Valley (deliberate palettes), the Sable trailer (line + flat color
with mood). The anti-reference: default Kenney-asset scenes with white ambient light, saturated
primary colors, and no fog. Same geometry, completely different result — **lighting, fog and
grading carry 70% of the quality**, geometry carries 30%.

## Why low-poly won't look childish here (the rules that prevent it)

1. **ACES filmic tone mapping + color grading, always.** Raw sRGB output is what makes 3D look
   like a demo.
2. **Fog in every chapter.** Atmospheric depth = perceived production value. Fog color belongs
   to the chapter palette (never gray).
3. **One key light with real shadows** (sun/moon, PCFSoft, tuned bias), one colored fill from
   the sky, and emissives only where the story wants your eye. Never uniform ambient.
4. **Constrained palettes.** 4–5 colors per chapter (below). Desaturated bases, one accent.
   Saturation is a spice, not a base coat.
5. **Silhouette layers.** 3+ depth planes in every shot: road/foreground detail → midground
   props → far silhouette ridge/skyline fading into fog. Empty horizons read cheap.
6. **Post-processing chain:** SMAA → Bloom (low threshold at night chapters only) → subtle
   Depth of Field (focus on vehicle) → Vignette (0.25) → slight film grain. Subtle. If a
   visitor can name the effect, it's too strong.
7. **Nothing is static.** Grass/flag shader sway, dust motes, birds, drifting clouds, flickering
   signs, heat haze on the highway. Two or three ambient movers per chapter minimum.
8. **Imperfection:** slight rotation/scale jitter on every instanced prop, vertex-color
   variation on repeated meshes. Perfect grids scream "generated".

## The color script (the film's emotional arc = the day's light arc)

The whole journey is one day, dawn → night → transcendence. Chapter boundaries lerp all values
(fog color/density, sun position/color, sky gradient, grade tint) over the transition zone.

| Ch | Time | Palette (base / mid / accent) | Sky | Mood |
|---|---|---|---|---|
| 0 Prologue | pre-dawn | #1A1E2E / #2E3450 / #E8B04B | deep indigo, first light on horizon | anticipation |
| 1 Village | dawn | #D9A066 warm earth / #7A8B6F sage / #F2C14E marigold | peach→lavender gradient, long soft shadows | innocence, warmth |
| 2 Town | morning | #C9B79C plaster / #4E6E81 / #C1442E brick+rust | clear pale blue, crisp light | energy, learning |
| 3 Highway | noon | #B8A88A asphalt-bleached / #9AA3A8 / #1E6FB8 R15 blue | white-hot sky, heat haze, hard shadows | speed, mastery |
| 4 City | dusk | #3A3F5C / #6B4E71 / #FF8C42 window glow | orange→purple gradient, sun between towers | arrival, weight |
| 5 Neon | night | #0D1021 / #1B2340 / #00E5FF + #FF2E88 neon | starless glow, wet-road reflections | the AI era, electric |
| 6 Circuit | beyond | #04150D pcb-dark / #0F3D2E / #39FF88 trace-green + #E8B04B gold pads | void with faint grid | transcendence |

Vehicle accent colors are the one constant thread: each vehicle carries a warm signature light
(headlamp glow #FFD9A0) so the eye always finds the protagonist.

## Camera language

- Default: chase cam, low (1.6–2.2m), slightly offset right of the vehicle, FOV 45. Low +
  long-ish lens = cinematic; high + wide = video-game-y.
- Per chapter, ONE authored camera set-piece (drone rise over the village, tunnel dive into the
  city, slow orbit at the circuit-board reveal). These are keyframed on the master timeline —
  Theatre.js used in dev to tune them, values baked to code after.
- Speed illusion comes from FOV kicks (45→52 on "acceleration"), subtle camera shake at speed,
  and roadside prop density — not from actually moving faster.
- Look-at leads the vehicle by ~6 units so turns feel anticipated, not reactive.

## Scroll & motion grammar

- Vertical scroll = forward motion. Scrub smoothing ~0.8s so it feels like momentum, not a
  slider. Lenis handles inertia; a stopped scroll coasts briefly (engine-off drift).
- **Detours (horizontal):** at project stops, the journey pauses and a horizontal-scroll strip
  takes over (roadside billboards / dhaba signboards / neon holograms present each project).
  Enter/exit via a clear visual affordance — a signpost the camera turns toward.
- Vehicle swaps happen inside set-pieces, never mid-straightaway: bicycle leans against a wall
  as the boy (silhouette only, no rigged character) walks toward the motorcycle; camera whip-pans;
  new vehicle pulls out. Silhouettes + smart cuts, zero rigging.
- Respect `prefers-reduced-motion`: static-camera chapter cards with crossfades instead of the
  drive.

## Typography & UI overlay

- Display: **Clash Display** (or Cabinet Grotesk) — wide, confident, set in caps for chapter
  titles with generous tracking. Body: **Satoshi**. Code/metadata accents: **JetBrains Mono**
  (continuity with his tooling identity).
- Chapter titles appear as *in-world-adjacent* DOM overlays: bottom-left, small eyebrow
  ("CHAPTER 03 — NH-48"), big title, one line of copy. Fade tied to scroll, never on timers.
- Progress indicator: a thin road-map line on the right edge with chapter dots (mile markers),
  current position as the vehicle icon. This doubles as navigation (click = drive there).
- Copy voice: first person, plain, specific, numbers over adjectives ("12+ freelance projects
  shipped", "71–78% backtested win rate"). No "passionate developer" filler. Ever.

## Quality checklist (run before any visual milestone is "done")

- [ ] ACES tone mapping on; exposure tuned per chapter
- [ ] Fog present, colored to palette; 3 depth layers visible in every framing
- [ ] Key light casts soft shadows; no uniform ambient; accent emissives intentional
- [ ] Palette ≤ 5 colors + neutrals; nothing fully saturated except night neon
- [ ] Post chain on and subtle (bloom/DoF/vignette/grain)
- [ ] ≥ 2 ambient movers in frame; instanced props have jitter
- [ ] Screenshot the chapter at 3 scroll points → would each work as a poster? If any frame
      wouldn't, fix that framing before adding features
