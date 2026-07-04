import { useMemo } from 'react'
import {
  BoxGeometry,
  Color,
  ConeGeometry,
  Group,
  InstancedMesh,
  MeshStandardMaterial,
  Object3D,
} from 'three'
import {
  CHAPTER_MARKS,
  metersToProgress,
  pointAt,
  tangentAt,
  totalLength,
} from '../spline/roadPath'
import { createRng, rngRange } from '../../utils/random'
import { createScratch } from '../../utils/scratch'
import type { ChapterConfig } from './types'
import { BOARD_Y } from './Ch6_Circuit/config'

/**
 * Phase-1 greybox world (plan.md): untextured blocks per chapter zone so the
 * spine can be felt end-to-end. Placement is deterministic (seeded) and hugs
 * the spline. Real biomes replace these internals from Phase 2 on — the
 * mount/unmount contract with ChapterManager stays identical.
 *
 * Zone meshes are built ONCE and module-cached; mount/unmount only attaches/
 * detaches them from the scene graph (dispose={null}). Rebuilding geometry,
 * materials and shader programs at every chapter boundary was a measured
 * frame hitch — these buffers are a few KB per zone, so keeping them resident
 * is the right trade (ADR-7's memory concern is textures, not this).
 */

interface Instance {
  x: number
  y: number
  z: number
  rotY: number
  sx: number
  sy: number
  sz: number
  color: Color
}

interface BiomeData {
  base: Instance[]
  emissive: Map<string, Instance[]>
  far: Instance[]
}

const scratch = createScratch()

function buildBiome(zone: number, config: ChapterConfig): BiomeData {
  const rng = createRng(config.seed)
  const { greybox: g, far: f } = config
  const pStart = CHAPTER_MARKS[zone]
  const pEnd = CHAPTER_MARKS[zone + 1]
  const zoneMeters = (pEnd - pStart) * totalLength
  const { v1: point, v2: tangent, v3: right } = scratch

  const base: Instance[] = []
  const emissive = new Map<string, Instance[]>()
  const onBoard = zone === 6

  const samples = Math.floor(zoneMeters / g.spacing)
  for (let i = 0; i < samples; i++) {
    const meters = i * g.spacing + rngRange(rng, -0.4, 0.4) * g.spacing
    const p = pStart + metersToProgress(meters)
    pointAt(p, point)
    tangentAt(p, tangent)
    // Bare ramp up to the board — components only appear once the road levels.
    if (onBoard && point.y < 40) continue
    right.set(-tangent.z, 0, tangent.x).normalize() // tangent × up, flattened

    for (const side of [-1, 1]) {
      if (rng() > g.density) continue
      const offset = rngRange(rng, g.offsetMin, g.offsetMax)
      const sx = rngRange(rng, g.sizeMin[0], g.sizeMax[0])
      const sy = rngRange(rng, g.sizeMin[1], g.sizeMax[1])
      const sz = rngRange(rng, g.sizeMin[2], g.sizeMax[2])
      const baseY = onBoard ? BOARD_Y : 0
      const glowIndex = g.emissiveShare && rng() < g.emissiveShare ? Math.floor(rng() * 2) : -1
      const glowColor =
        glowIndex >= 0 ? g.emissiveColors?.[glowIndex % (g.emissiveColors?.length ?? 1)] : undefined

      // Emissives are sign-scale accents facing the road — never glowing
      // building-sized walls (DESIGN.md: emissives only where the story
      // wants your eye).
      let dims: [number, number, number] = [sx, sy, sz]
      let y = baseY + sy / 2
      if (glowColor) {
        dims = [rngRange(rng, 1.8, 4.2), rngRange(rng, 1.1, 2.8), 0.3]
        y = baseY + rngRange(rng, 2.5, Math.max(4.5, sy * 0.55))
      }

      const inst: Instance = {
        x: point.x + right.x * side * offset,
        y,
        z: point.z + right.z * side * offset,
        rotY: Math.atan2(tangent.x, tangent.z) + rngRange(rng, -0.18, 0.18),
        sx: dims[0],
        sy: dims[1],
        sz: dims[2],
        color: new Color(glowColor ?? g.colors[Math.floor(rng() * g.colors.length)]),
      }
      if (glowColor) {
        const list = emissive.get(glowColor) ?? []
        list.push(inst)
        emissive.set(glowColor, list)
      } else {
        // Per-instance value jitter — DESIGN.md imperfection rule.
        inst.color.multiplyScalar(0.9 + rng() * 0.2)
        base.push(inst)
      }
    }
  }

  const far: Instance[] = []
  if (f.kind !== 'none') {
    const farStart = Math.max(0, pStart - 0.012)
    const farEnd = Math.min(1, pEnd + 0.012)
    const farMeters = (farEnd - farStart) * totalLength
    const farSamples = Math.floor(farMeters / f.spacing)
    for (let i = 0; i < farSamples; i++) {
      const p = farStart + metersToProgress(i * f.spacing + rngRange(rng, -0.4, 0.4) * f.spacing)
      pointAt(p, point)
      tangentAt(p, tangent)
      right.set(-tangent.z, 0, tangent.x).normalize()
      for (const side of [-1, 1]) {
        if (rng() > 0.75) continue
        const dist = rngRange(rng, f.distMin, f.distMax)
        const h = rngRange(rng, f.heightMin, f.heightMax)
        const r = f.kind === 'hills' ? h * rngRange(rng, 1.7, 2.6) : rngRange(rng, 9, 18)
        far.push({
          x: point.x + right.x * side * dist,
          y: f.kind === 'hills' ? h / 2 : h / 2,
          z: point.z + right.z * side * dist,
          rotY: rngRange(rng, 0, Math.PI * 2),
          sx: r,
          sy: h,
          sz: r,
          color: new Color(f.color).multiplyScalar(0.94 + rng() * 0.12),
        })
      }
    }
  }

  return { base, emissive, far }
}

/* ---------- shared GPU resources (never disposed, compiled once) ---------- */

const BOX_GEO = new BoxGeometry(1, 1, 1)
const CONE_GEO = new ConeGeometry(1, 1, 6)
const BOX_MAT = new MeshStandardMaterial({ roughness: 0.92 })
const CONE_MAT = new MeshStandardMaterial({ roughness: 0.92, flatShading: true })
const emissiveMats = new Map<string, MeshStandardMaterial>()

function emissiveMat(color: string): MeshStandardMaterial {
  let mat = emissiveMats.get(color)
  if (!mat) {
    mat = new MeshStandardMaterial({
      color,
      emissive: color,
      emissiveIntensity: 1.6,
      roughness: 0.6,
    })
    emissiveMats.set(color, mat)
  }
  return mat
}

const dummy = new Object3D()

function makeInstancedMesh(
  items: Instance[],
  kind: 'box' | 'cone',
  material: MeshStandardMaterial,
  castShadow: boolean,
): InstancedMesh {
  const mesh = new InstancedMesh(kind === 'box' ? BOX_GEO : CONE_GEO, material, items.length)
  items.forEach((it, i) => {
    dummy.position.set(it.x, it.y, it.z)
    dummy.rotation.set(0, it.rotY, 0)
    dummy.scale.set(it.sx, it.sy, it.sz)
    dummy.updateMatrix()
    mesh.setMatrixAt(i, dummy.matrix)
    mesh.setColorAt(i, it.color)
  })
  mesh.instanceMatrix.needsUpdate = true
  if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true
  mesh.castShadow = castShadow
  mesh.receiveShadow = true
  mesh.computeBoundingSphere()
  return mesh
}

/* ---------- zone groups, built once and cached ---------- */

const zoneCache = new Map<string, Group>()

function getZoneGroup(zone: number, config: ChapterConfig, farOnly: boolean): Group {
  const key = `${zone}${farOnly ? '-far' : ''}`
  const hit = zoneCache.get(key)
  if (hit) return hit

  const data = buildBiome(zone, config)
  const group = new Group()
  const farKind = config.far.kind === 'towers' ? 'box' : 'cone'
  if (!farOnly) {
    if (data.base.length > 0) group.add(makeInstancedMesh(data.base, 'box', BOX_MAT, true))
    for (const [color, items] of data.emissive) {
      group.add(makeInstancedMesh(items, 'box', emissiveMat(color), false))
    }
  }
  if (data.far.length > 0) {
    group.add(makeInstancedMesh(data.far, farKind, farKind === 'cone' ? CONE_MAT : BOX_MAT, false))
  }
  zoneCache.set(key, group)
  return group
}

export function GreyboxBiome({ zone, config }: { zone: number; config: ChapterConfig }) {
  const group = useMemo(() => getZoneGroup(zone, config, false), [zone, config])
  return <primitive object={group} dispose={null} />
}

/**
 * Just the fog-faded horizon layer — real biomes keep their depth plane 3
 * (DESIGN.md silhouette layers) while replacing the greybox props.
 */
export function FarSilhouettes({ zone, config }: { zone: number; config: ChapterConfig }) {
  const group = useMemo(() => getZoneGroup(zone, config, true), [zone, config])
  return <primitive object={group} dispose={null} />
}
