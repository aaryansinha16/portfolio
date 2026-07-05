import {
  BoxGeometry,
  Group,
  InstancedMesh,
  Mesh,
  MeshStandardMaterial,
  Object3D,
  PlaneGeometry,
  Vector3,
} from 'three'
import { getZoneRoad } from '../../world/roadSamples'
import { buildTowerMesh, buildWindowMesh, genTowers } from '../../world/towers'
import { makeTextPanel } from '../../world/textPanel'
import { createRng, rngRange } from '../../../utils/random'
import { AI_PROJECTS } from '../../../content'

/**
 * Ch5 Neon statics: dark towers with sparse cool windows, neon strips on
 * tower faces (a subset wired to flicker materials), and the four
 * AI-project signs in actual neon. The moving light belongs to
 * NeonRoadFlow — pulses running the road's edges.
 */

const ZONE = 5
const SEED = 4505

const BOX = new BoxGeometry(1, 1, 1)
const dummy = new Object3D()

/* neon strip materials — two of them flicker (driven from index.tsx) */
const stripMat = (color: string) =>
  new MeshStandardMaterial({
    color: '#05060d',
    emissive: color,
    emissiveIntensity: 2.0,
    roughness: 0.5,
    toneMapped: false,
  })
export const FLICKER_MATS = [stripMat('#00e5ff'), stripMat('#ff2e88')]
const STATIC_MATS = [stripMat('#00e5ff'), stripMat('#ff2e88'), stripMat('#b98aff')]

let cachedGroup: Group | null = null
let cachedSteam: Vector3[] | null = null

export function getNeonSteamAnchors(): Vector3[] {
  getNeonStatics()
  return cachedSteam!
}

export function getNeonStatics(): Group {
  if (cachedGroup) return cachedGroup
  const road = getZoneRoad(ZONE)
  const rng = createRng(SEED)
  const group = new Group()
  const pos = new Vector3()

  /* dark towers, sparse cool windows */
  const towers = genTowers({
    zone: ZONE,
    seed: SEED,
    spacing: 12,
    offMin: 10,
    offMax: 30,
    wMin: 8,
    wMax: 14,
    hMin: 14,
    hMax: 44,
    density: 0.9,
  })
  group.add(buildTowerMesh(towers, ['#1a2140', '#212a4e', '#161c38'], 0.7))
  group.add(
    buildWindowMesh(towers, {
      seed: SEED + 1,
      litChance: 0.14,
      colors: ['#7de8ff', '#d8e0ff', '#8a9dff'],
      brightness: 0.85,
    }),
  )

  /* neon strips on road-facing tower faces; ~1/4 flicker */
  interface Strip {
    x: number
    y: number
    z: number
    yaw: number
    sx: number
    sy: number
    mat: number // index into STATIC_MATS, or -1/-2 for flicker mats
  }
  const strips: Strip[] = []
  for (const t of towers) {
    const n = Math.floor(rngRange(rng, 0, 2.0))
    for (let k = 0; k < n; k++) {
      const vertical = rng() < 0.6
      const face = rng() < 0.5 ? 0 : Math.PI
      const yaw = t.yaw + face
      const nx = Math.sin(yaw)
      const nz = Math.cos(yaw)
      const off = rngRange(rng, -t.w * 0.32, t.w * 0.32)
      const matPick = rng()
      strips.push({
        x: t.x + nx * (t.d / 2 + 0.1) + Math.cos(yaw) * off,
        y: rngRange(rng, 3, Math.max(6, t.h * 0.7)),
        z: t.z + nz * (t.d / 2 + 0.1) - Math.sin(yaw) * off,
        yaw,
        sx: vertical ? rngRange(rng, 0.25, 0.45) : rngRange(rng, 2.2, 4.5),
        sy: vertical ? rngRange(rng, 2.5, 6) : rngRange(rng, 0.3, 0.5),
        mat: matPick < 0.13 ? -1 : matPick < 0.26 ? -2 : Math.floor(rng() * STATIC_MATS.length),
      })
    }
  }
  const byMat = new Map<number, Strip[]>()
  strips.forEach((s) => {
    const list = byMat.get(s.mat) ?? []
    list.push(s)
    byMat.set(s.mat, list)
  })
  const BACKING_MAT = new MeshStandardMaterial({ color: '#0b0e1e', roughness: 0.85 })
  const backings = new InstancedMesh(BOX, BACKING_MAT, strips.length)
  strips.forEach((st, i) => {
    dummy.position.set(st.x - Math.sin(st.yaw) * 0.08, st.y, st.z - Math.cos(st.yaw) * 0.08)
    dummy.rotation.set(0, st.yaw, 0)
    dummy.scale.set(st.sx + 0.5, st.sy + 0.5, 0.08)
    dummy.updateMatrix()
    backings.setMatrixAt(i, dummy.matrix)
  })
  backings.instanceMatrix.needsUpdate = true
  group.add(backings)
  for (const [matIdx, list] of byMat) {
    const mat =
      matIdx === -1 ? FLICKER_MATS[0] : matIdx === -2 ? FLICKER_MATS[1] : STATIC_MATS[matIdx]
    const mesh = new InstancedMesh(BOX, mat, list.length)
    list.forEach((s, i) => {
      dummy.position.set(s.x, s.y, s.z)
      dummy.rotation.set(0, s.yaw, 0)
      dummy.scale.set(s.sx, s.sy, 0.12)
      dummy.updateMatrix()
      mesh.setMatrixAt(i, dummy.matrix)
    })
    mesh.instanceMatrix.needsUpdate = true
    group.add(mesh)
  }

  /* the four AI-project neon signs */
  const steamAnchors: Vector3[] = []
  AI_PROJECTS.forEach((project, i) => {
    const m = road.zoneMeters * (0.16 + i * 0.22)
    const side = i % 2 === 0 ? -1 : 1
    const s = road.at(m)
    road.place(m, 11.5 * side, pos)
    // face BACK down the road toward the approaching camera (single-sided
    // plane!), angled slightly toward the road center
    const yaw = Math.atan2(s.tx, s.tz) + Math.PI + side * 0.15

    const tex = makeTextPanel({
      title: project.name,
      bg: '#070914',
      fg: project.color,
      glow: true,
      w: 768,
      h: 224,
    })
    const sign = new Mesh(
      new PlaneGeometry(7.4, 2.2),
      new MeshStandardMaterial({
        color: '#000000',
        emissive: '#ffffff',
        emissiveMap: tex,
        map: tex,
        emissiveIntensity: 1.9,
        roughness: 0.6,
        toneMapped: false,
      }),
    )
    sign.position.set(pos.x, pos.y + rngRange(rng, 8, 12), pos.z)
    sign.rotation.y = yaw
    const back = new Mesh(BOX, new MeshStandardMaterial({ color: '#0a0d1a', roughness: 0.9 }))
    back.position.copy(sign.position)
    back.rotation.y = yaw
    back.scale.set(7.7, 2.5, 0.18)
    back.translateZ(-0.12)
    group.add(back, sign)

    if (i % 2 === 0) {
      road.place(m + 8, 7.5 * side, pos)
      steamAnchors.push(new Vector3(pos.x, pos.y + 1.2, pos.z))
    }
  })

  /* the detour signpost — a small cyan neon marker where the rider pulls
     over for the AI-flagship strip (window anchors at 0.55 of the zone) */
  {
    const m = road.zoneMeters * 0.53
    const sD = road.at(m)
    road.place(m, 7.2, pos)
    const yaw = Math.atan2(sD.tx, sD.tz) + Math.PI - 0.15
    const sign = new Mesh(
      new PlaneGeometry(3.4, 1.1),
      new MeshStandardMaterial({
        color: '#000000',
        emissive: '#ffffff',
        emissiveMap: makeTextPanel({
          title: '◂ PROJECTS',
          bg: '#070914',
          fg: '#00e5ff',
          glow: true,
          w: 512,
          h: 160,
        }),
        emissiveIntensity: 1.8,
        roughness: 0.6,
        toneMapped: false,
      }),
    )
    sign.position.set(pos.x, pos.y + 2.6, pos.z)
    sign.rotation.y = yaw
    const post = new Mesh(BOX, new MeshStandardMaterial({ color: '#12162c', roughness: 0.8 }))
    post.position.set(pos.x, pos.y + 1.0, pos.z)
    post.scale.set(0.12, 2.0, 0.12)
    group.add(post, sign)
  }

  cachedSteam = steamAnchors
  cachedGroup = group
  return group
}
