import {
  Color,
  InstancedMesh,
  BoxGeometry,
  MeshBasicMaterial,
  MeshStandardMaterial,
  Object3D,
  PlaneGeometry,
} from 'three'
import { getZoneRoad } from './roadSamples'
import { createRng, rngRange } from '../../utils/random'

/**
 * Tower + lit-window machinery shared by the city and neon chapters.
 * Windows are unlit quads (MeshBasicMaterial is deliberate — they ARE the
 * light sources, like smoke is unlit media); per-instance color carries the
 * warm/cool mix and bloom picks up the bright ones at night.
 */

export interface TowerSpec {
  x: number
  y: number
  z: number
  yaw: number
  w: number
  h: number
  d: number
  mix: number
}

const BOX = new BoxGeometry(1, 1, 1)
const WINDOW_GEO = new PlaneGeometry(0.92, 1.3)
const dummy = new Object3D()
const c = new Color()

export interface TowerGenOpts {
  zone: number
  seed: number
  spacing: number
  offMin: number
  offMax: number
  wMin: number
  wMax: number
  hMin: number
  hMax: number
  density: number
  /** keep this many meters clear at the zone end (e.g. for the tunnel) */
  endClear?: number
}

export function genTowers(opts: TowerGenOpts): TowerSpec[] {
  const road = getZoneRoad(opts.zone)
  const rng = createRng(opts.seed)
  const towers: TowerSpec[] = []
  const end = road.zoneMeters - (opts.endClear ?? 0)
  for (let m = 12; m < end; m += opts.spacing) {
    for (const side of [-1, 1]) {
      if (rng() > opts.density) continue
      const s = road.at(m + rngRange(rng, -3, 3))
      const w = rngRange(rng, opts.wMin, opts.wMax)
      const d = rngRange(rng, opts.wMin, opts.wMax)
      const lateral = (opts.offMin + rngRange(rng, 0, opts.offMax - opts.offMin) + w / 2) * side
      towers.push({
        x: s.x + s.rx * lateral,
        y: s.y,
        z: s.z + s.rz * lateral,
        yaw: Math.atan2(s.tx, s.tz) + rngRange(rng, -0.06, 0.06),
        w,
        h: rngRange(rng, opts.hMin, opts.hMax),
        d,
        mix: rng(),
      })
    }
  }
  return towers
}

export function buildTowerMesh(
  towers: TowerSpec[],
  palette: string[],
  roughness = 0.85,
): InstancedMesh {
  const mat = new MeshStandardMaterial({ roughness })
  const mesh = new InstancedMesh(BOX, mat, towers.length)
  const colors = palette.map((h) => new Color(h))
  towers.forEach((t, i) => {
    dummy.position.set(t.x, t.y + t.h / 2, t.z)
    dummy.rotation.set(0, t.yaw, 0)
    dummy.scale.set(t.w, t.h, t.d)
    dummy.updateMatrix()
    mesh.setMatrixAt(i, dummy.matrix)
    mesh.setColorAt(
      i,
      c
        .copy(colors[Math.floor(t.mix * colors.length) % colors.length])
        .multiplyScalar(0.9 + t.mix * 0.2),
    )
  })
  mesh.instanceMatrix.needsUpdate = true
  if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true
  mesh.castShadow = true
  mesh.receiveShadow = true
  mesh.computeBoundingSphere()
  return mesh
}

export interface WindowOpts {
  seed: number
  litChance: number
  /** window colors, weighted by occurrence */
  colors: string[]
  /** vertical rows start above this height */
  sillStart?: number
  colStep?: number
  rowStep?: number
  brightness?: number
}

/** One instanced mesh of LIT windows across all four faces of every tower. */
export function buildWindowMesh(towers: TowerSpec[], opts: WindowOpts): InstancedMesh {
  const rng = createRng(opts.seed)
  const colStep = opts.colStep ?? 1.9
  const rowStep = opts.rowStep ?? 2.7
  const sill = opts.sillStart ?? 2.5
  const colors = opts.colors.map((h) => new Color(h))

  interface Win {
    x: number
    y: number
    z: number
    yaw: number
    color: Color
  }
  const wins: Win[] = []
  for (const t of towers) {
    // faces: [normal yaw offset, half-depth along that normal, face width]
    const faces: Array<[number, number, number]> = [
      [0, t.d / 2, t.w],
      [Math.PI, t.d / 2, t.w],
      [Math.PI / 2, t.w / 2, t.d],
      [-Math.PI / 2, t.w / 2, t.d],
    ]
    for (const [dYaw, halfDepth, faceW] of faces) {
      const yaw = t.yaw + dYaw
      const nx = Math.sin(yaw)
      const nz = Math.cos(yaw)
      const txv = Math.cos(yaw)
      const tzv = -Math.sin(yaw)
      const cols = Math.max(1, Math.floor(faceW / colStep) - 1)
      const rows = Math.max(1, Math.floor((t.h - sill) / rowStep))
      for (let r = 0; r < rows; r++) {
        for (let col = 0; col < cols; col++) {
          if (rng() > opts.litChance) continue
          const off = (col - (cols - 1) / 2) * colStep
          wins.push({
            x: t.x + nx * (halfDepth + 0.06) + txv * off,
            y: t.y + sill + r * rowStep,
            z: t.z + nz * (halfDepth + 0.06) + tzv * off,
            yaw,
            color: colors[Math.floor(rng() * colors.length)]
              .clone()
              .multiplyScalar((0.7 + rng() * 0.5) * (opts.brightness ?? 1)),
          })
        }
      }
    }
  }

  const mat = new MeshBasicMaterial()
  const mesh = new InstancedMesh(WINDOW_GEO, mat, wins.length)
  wins.forEach((w, i) => {
    dummy.position.set(w.x, w.y, w.z)
    dummy.rotation.set(0, w.yaw, 0)
    dummy.scale.setScalar(1)
    dummy.updateMatrix()
    mesh.setMatrixAt(i, dummy.matrix)
    mesh.setColorAt(i, w.color)
  })
  mesh.instanceMatrix.needsUpdate = true
  if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true
  mesh.computeBoundingSphere()
  return mesh
}
