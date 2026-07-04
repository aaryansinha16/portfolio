# CLAUDE.md — Operating manual for this repo

You are building a scroll-driven 3D portfolio ("The Road Trip"). Read `DESIGN.md` before any
visual work and `plan.md` before starting any task. Log notable outcomes in `memory.md`.

## Prime directives

1. **The scroll spine is sacred.** One master GSAP timeline maps normalized scroll progress
   (0→1) to everything: camera position on the spline, chapter transitions, vehicle swaps,
   lighting shifts. Never create a second competing scroll listener. Never animate the camera
   outside the master timeline (except dev free-fly mode).
2. **Visual quality bar over feature count.** A half-built chapter that looks cinematic beats
   three chapters that look like a tech demo. Run the DESIGN.md checklist before calling any
   visual task done.
3. **Never use default Three.js materials/lighting.** No `MeshBasicMaterial` for world geometry,
   no un-graded output, no scenes without fog. `ACESFilmicToneMapping` is always on.
4. **Procedural first.** Reach for generated geometry (instancing, merged buffers, simple
   shaders) before importing assets. Import glTF only for vehicles and hero props.
5. **Don't break earlier chapters.** After any change, verify at minimum: prologue load,
   one mid-journey chapter boundary, and the chapter you touched. Use `?chapter=N` to jump.

## Commands

```bash
pnpm dev            # dev server
pnpm build && pnpm preview   # ALWAYS perf-test in preview, not dev
pnpm lint           # eslint + prettier check
pnpm typecheck      # tsc --noEmit
```

## File map

```
src/
  main.tsx, App.tsx
  experience/
    Experience.tsx        # <Canvas>, renderer config, post-processing chain
    CameraRig.tsx         # camera follows spline; look-at logic; shake/lean
    ScrollSpine.ts        # Lenis + ScrollTrigger -> normalized progress -> master timeline
    spline/roadPath.ts    # the CatmullRomCurve3 control points for the entire journey
    chapters/
      ChapterManager.tsx  # mounts/unmounts biomes by scroll range; crossfade logic
      Ch1_Village/  Ch2_Town/  Ch3_Highway/  Ch4_City/  Ch5_Neon/  Ch6_Circuit/
        index.tsx         # biome root: terrain, props, lights, local timeline
        (local components per biome)
    vehicles/
      VehicleManager.tsx  # which vehicle is active; swap transitions
      Bicycle.tsx  Motorcycle.tsx  R15.tsx  Safari.tsx
    atmosphere/
      Sky.tsx  Fog.ts  ColorScript.ts   # per-chapter env values, lerped at boundaries
    detours/
      DetourManager.tsx   # horizontal scroll sections (projects)
  ui/
    Overlay.tsx           # DOM layer: chapter titles, copy, progress bar, scroll hints
    Loader.tsx            # loading experience (see plan Phase 6)
  state/useJourney.ts     # Zustand: progress, chapter, quality tier, detour state
  utils/
```

## Conventions

- **Commits:** conventional commits, micro-commits. One logical change per commit.
  `feat(ch2): town rooftops instancing` / `fix(camera): jitter at chapter boundaries`.
- **TypeScript strict.** No `any` in `src/experience`.
- **Chapter isolation:** a biome may only read global state from `useJourney` and the
  ColorScript. It never mutates renderer/camera/fog directly — it *declares* its values and
  `ChapterManager`/`ColorScript` interpolate.
- **All magic numbers for look/feel live in a per-chapter `config.ts`** (colors, fog density,
  sun position, camera height/FOV offsets) so tuning never means hunting through JSX.
- **Units:** 1 unit = 1 meter. Road width 8 units. Vehicle scale realistic.

## Performance budget (enforced, but generous — visuals win ties)

- 60fps desktop discrete GPU, 30fps+ mid laptop, at 1440p.
- Draw calls < 300 per chapter. Instance everything repeated (trees, poles, buildings, traffic).
- Only the active chapter ± its neighbors are mounted. Dispose geometries/textures on unmount.
- Textures ≤ 2k, KTX2/basis where imported. glTF through gltf-transform (draco/meshopt).
- If FPS tanks, degrade post-processing first (DoF → off, bloom quality down), never geometry
  density of the visible scene.

## Updating docs (do this without being asked)

- Finished a plan phase / milestone → tick it in `plan.md`, one-line summary in `memory.md`.
- Made a non-obvious technical choice → add an ADR entry to `decisions.md`.
- Tried something that failed (approach, library, trick) → record it in `memory.md` under
  "Tried & rejected" so future sessions don't repeat it.

## Things that have burned us before (do not repeat)

- Animating camera with both ScrollTrigger scrub AND lerp-follow → double smoothing = mushy,
  laggy feel. Pick scrub with `scrub: 0.8`-ish on the master timeline only.
- `useFrame` allocations (new Vector3 per frame) → GC stutter. Reuse scratch vectors.
- Testing perf in `pnpm dev` → dev mode post-processing is much slower; judge only in preview.
- Loading all chapters at once "temporarily" → never temporary. Lazy-mount from day one.
