# THE ROAD TRIP — Aaryan's Portfolio

An interactive 3D journey. The visitor drives through Aaryan's career: a bicycle in a dawn-lit
village, a motorcycle through a growing town, an R15 on the open highway, a Tata Safari into a
neon city — and a finale where the road lifts onto a glowing circuit board. Scroll is the
accelerator. Horizontal detours are side projects.

**This is not a website with 3D decoration. The 3D scene IS the website.**

## Visual bar

Stylized-cinematic. Think *Alto's Odyssey*, *Firewatch* posters, Monument Valley — low-poly
geometry elevated by cinematic lighting, fog, color grading and post-processing. Never flat,
never plasticky, never "school project". The quality bar is defined in `DESIGN.md` and enforced
by the checklist there. If a scene looks childish, the lighting/grading is wrong — not the theme.

## Stack

| Layer | Choice |
|---|---|
| Build | Vite + React 18 + TypeScript |
| 3D | three.js via @react-three/fiber + @react-three/drei |
| Post | @react-three/postprocessing (Bloom, DoF, Vignette, SMAA, ACES) |
| Scroll | Lenis (smooth scroll) + GSAP ScrollTrigger (master timeline) |
| Camera authoring | CatmullRomCurve3 spline + Theatre.js Studio (dev-only, for tuning) |
| State | Zustand |
| Assets | Procedural geometry first; glTF (Quaternius/Kenney/Sketchfab CC) for vehicles & hero props |
| Deploy | Vercel |

## Quickstart

```bash
pnpm install
pnpm dev        # http://localhost:5173
pnpm build      # production build
pnpm preview    # test the production build (post-processing perf differs in dev!)
```

Dev flags (querystring):
- `?debug` — FPS meter, spline visualizer, chapter boundaries, free-fly camera toggle
- `?chapter=3` — jump directly to a chapter's scroll position
- `?theatre` — open Theatre.js studio for camera keyframe tuning

## Repo docs

| File | Purpose |
|---|---|
| `CLAUDE.md` | Rules & conventions for Claude Code working in this repo |
| `DESIGN.md` | Art direction bible — palette, lighting, camera language, quality checklist |
| `plan.md` | Phased build plan with acceptance criteria |
| `decisions.md` | ADR log — why we chose what we chose |
| `memory.md` | Working memory — current state, what was tried, open threads |

## The journey (chapters)

0. **Prologue** — title card, engine start, scroll hint
1. **Village Dawn** — origins, curiosity, the bicycle
2. **Town Morning** — learning to build, freelance years (12+ projects), first motorcycle
3. **Highway Noon** — full-stack mastery, Brainerhub, the R15
4. **City Dusk** — Eigenlytics × Luxia, engineering lead, the Safari
5. **Neon Night** — AI engineering era; detours: AI-Trader, AIFlowo, Parambhakti, Devovia
6. **The Circuit Board** — road lifts onto a giant PCB, traces light up, contact section
