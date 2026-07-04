import { useLayoutEffect, useMemo, useRef } from 'react'
import { Color, InstancedMesh, Object3D } from 'three'
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
          y: f.kind === 'hills' ? 0 : h / 2,
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

const dummy = new Object3D()

interface InstancedBlocksProps {
  items: Instance[]
  kind: 'box' | 'cone'
  /** Cone base sits at y (hills); boxes are centered already. */
  emissiveColor?: string
  castShadow?: boolean
}

function InstancedBlocks({ items, kind, emissiveColor, castShadow = false }: InstancedBlocksProps) {
  const ref = useRef<InstancedMesh>(null)

  useLayoutEffect(() => {
    const mesh = ref.current
    if (!mesh) return
    items.forEach((it, i) => {
      dummy.position.set(it.x, kind === 'cone' ? it.y + it.sy / 2 : it.y, it.z)
      dummy.rotation.set(0, it.rotY, 0)
      dummy.scale.set(it.sx, it.sy, it.sz)
      dummy.updateMatrix()
      mesh.setMatrixAt(i, dummy.matrix)
      mesh.setColorAt(i, it.color)
    })
    mesh.instanceMatrix.needsUpdate = true
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true
    mesh.computeBoundingSphere()
  }, [items, kind])

  if (items.length === 0) return null
  return (
    <instancedMesh
      ref={ref}
      args={[undefined, undefined, items.length]}
      castShadow={castShadow}
      receiveShadow
    >
      {kind === 'box' ? <boxGeometry args={[1, 1, 1]} /> : <coneGeometry args={[1, 1, 6]} />}
      {emissiveColor ? (
        <meshStandardMaterial
          color={emissiveColor}
          emissive={emissiveColor}
          emissiveIntensity={1.6}
          roughness={0.6}
        />
      ) : (
        <meshStandardMaterial roughness={0.92} flatShading={kind === 'cone'} />
      )}
    </instancedMesh>
  )
}

export function GreyboxBiome({ zone, config }: { zone: number; config: ChapterConfig }) {
  const data = useMemo(() => buildBiome(zone, config), [zone, config])
  return (
    <group>
      <InstancedBlocks items={data.base} kind="box" castShadow />
      {[...data.emissive.entries()].map(([color, items]) => (
        <InstancedBlocks key={color} items={items} kind="box" emissiveColor={color} />
      ))}
      <InstancedBlocks items={data.far} kind={config.far.kind === 'towers' ? 'box' : 'cone'} />
    </group>
  )
}

/**
 * Just the fog-faded horizon layer — real biomes keep their depth plane 3
 * (DESIGN.md silhouette layers) while replacing the greybox props.
 */
export function FarSilhouettes({ zone, config }: { zone: number; config: ChapterConfig }) {
  const data = useMemo(() => buildBiome(zone, config), [zone, config])
  return <InstancedBlocks items={data.far} kind={config.far.kind === 'towers' ? 'box' : 'cone'} />
}
