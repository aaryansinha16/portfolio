import {
  BoxGeometry,
  Color,
  CylinderGeometry,
  Group,
  IcosahedronGeometry,
  InstancedMesh,
  Mesh,
  MeshStandardMaterial,
  Object3D,
  PlaneGeometry,
  Vector3,
} from 'three'
import { getZoneRoad } from '../../world/roadSamples'
import { makeTextPanel } from '../../world/textPanel'
import { createRng, rngRange } from '../../../utils/random'
import { SKILL_BOARDS } from '../../../content'

/**
 * Ch3 Highway statics, built once and module-cached: dry scrub plains,
 * milestone stones, and the skill hoardings — big sun-bleached roadside
 * boards carrying the stack (DESIGN: hoardings double as skill boards).
 */

const ZONE = 3
const SEED = 4303

const SCRUB_GEO = new IcosahedronGeometry(1, 0)
const SCRUB_MAT = new MeshStandardMaterial({ roughness: 0.95, flatShading: true })
const POLE_GEO = new CylinderGeometry(0.09, 0.11, 1, 6)
const POLE_MAT = new MeshStandardMaterial({ color: '#4a4a4c', metalness: 0.4, roughness: 0.6 })
const STONE_GEO = new BoxGeometry(0.4, 0.55, 0.16)
const STONE_MAT = new MeshStandardMaterial({ color: '#ddd8c8', roughness: 0.85 })
const STONE_TOP_GEO = new BoxGeometry(0.42, 0.2, 0.18)
const STONE_TOP_MAT = new MeshStandardMaterial({ color: '#c9a23a', roughness: 0.8 })
const BOARD_BACK_MAT = new MeshStandardMaterial({ color: '#5a544a', roughness: 0.8 })

const dummy = new Object3D()
let cachedGroup: Group | null = null
let cachedBirdAnchors: Vector3[] | null = null

export function getHighwayBirdAnchors(): Vector3[] {
  getHighwayStatics()
  return cachedBirdAnchors!
}

export function getHighwayStatics(): Group {
  if (cachedGroup) return cachedGroup
  const road = getZoneRoad(ZONE)
  const rng = createRng(SEED)
  const group = new Group()
  const c = new Color()
  const pos = new Vector3()

  /* dry scrub, denser away from the shoulder */
  const scrubItems: { x: number; y: number; z: number; r: number; h: number; shade: number }[] = []
  for (let m = 0; m < road.zoneMeters; m += 6) {
    for (const side of [-1, 1]) {
      if (rng() > 0.62) continue
      const lateral = rngRange(rng, 7, 120) * side
      road.place(m + rngRange(rng, -2, 2), lateral, pos)
      scrubItems.push({
        x: pos.x,
        y: pos.y,
        z: pos.z,
        r: rngRange(rng, 0.5, 1.5),
        h: rngRange(rng, 0.3, 0.8),
        shade: rng(),
      })
    }
  }
  const scrub = new InstancedMesh(SCRUB_GEO, SCRUB_MAT, scrubItems.length)
  const dryA = new Color('#8a8556')
  const dryB = new Color('#a39a68')
  scrubItems.forEach((s, i) => {
    dummy.position.set(s.x, s.y + s.h * 0.35, s.z)
    dummy.rotation.set(0, s.shade * Math.PI * 2, 0)
    dummy.scale.set(s.r, s.h, s.r)
    dummy.updateMatrix()
    scrub.setMatrixAt(i, dummy.matrix)
    scrub.setColorAt(i, c.lerpColors(dryA, dryB, s.shade).multiplyScalar(0.9 + s.shade * 0.2))
  })
  scrub.instanceMatrix.needsUpdate = true
  if (scrub.instanceColor) scrub.instanceColor.needsUpdate = true
  scrub.receiveShadow = true
  scrub.computeBoundingSphere()
  group.add(scrub)

  /* milestone stones every ~90m on the left shoulder */
  const stoneCount = Math.floor(road.zoneMeters / 90)
  const stones = new InstancedMesh(STONE_GEO, STONE_MAT, stoneCount)
  const stoneTops = new InstancedMesh(STONE_TOP_GEO, STONE_TOP_MAT, stoneCount)
  for (let i = 0; i < stoneCount; i++) {
    const m = 40 + i * 90
    const s = road.at(m)
    road.place(m, -5.4, pos)
    const yaw = Math.atan2(s.tx, s.tz)
    dummy.position.set(pos.x, pos.y + 0.275, pos.z)
    dummy.rotation.set(0, yaw, 0)
    dummy.scale.setScalar(1)
    dummy.updateMatrix()
    stones.setMatrixAt(i, dummy.matrix)
    dummy.position.y = pos.y + 0.62
    dummy.updateMatrix()
    stoneTops.setMatrixAt(i, dummy.matrix)
  }
  stones.instanceMatrix.needsUpdate = true
  stoneTops.instanceMatrix.needsUpdate = true
  stones.castShadow = true
  group.add(stones, stoneTops)

  /* skill hoardings — alternating sides, angled a touch toward the road */
  const poleTransforms: { x: number; y: number; z: number; h: number; yaw: number }[] = []
  SKILL_BOARDS.forEach((board, i) => {
    const m = 55 + (i * (road.zoneMeters - 110)) / (SKILL_BOARDS.length - 1)
    const side = i % 2 === 0 ? -1 : 1
    const lateral = rngRange(rng, 10.5, 12.5) * side
    const s = road.at(m)
    road.place(m, lateral, pos)
    const yaw = Math.atan2(s.tx, s.tz) + Math.PI + side * -0.22 // face oncoming viewers

    const boardW = 7.2
    const boardH = 3.4
    const boardY = 5.0

    const texture = makeTextPanel({
      title: board.title,
      sub: board.sub,
      bg: '#e8e2d0',
      fg: '#2e2c28',
      border: '#8a8272',
      bleach: 0.55,
      w: 640,
      h: 300,
    })
    const face = new Mesh(
      new PlaneGeometry(boardW, boardH),
      new MeshStandardMaterial({ map: texture, roughness: 0.85 }),
    )
    face.position.set(pos.x, pos.y + boardY, pos.z)
    face.rotation.y = yaw
    face.castShadow = true
    const back = new Mesh(new BoxGeometry(boardW, boardH, 0.12), BOARD_BACK_MAT)
    back.position.copy(face.position)
    back.rotation.y = yaw
    back.translateZ(-0.08)
    group.add(back, face)

    // twin legs
    for (const off of [-boardW * 0.32, boardW * 0.32]) {
      const leg = new Vector3(pos.x, pos.y, pos.z)
      leg.x += Math.cos(yaw) * off
      leg.z -= Math.sin(yaw) * off
      poleTransforms.push({ x: leg.x, y: pos.y, z: leg.z, h: boardY - boardH / 2 + 0.2, yaw })
    }
  })
  const poles = new InstancedMesh(POLE_GEO, POLE_MAT, poleTransforms.length)
  poleTransforms.forEach((p, i) => {
    dummy.position.set(p.x, p.y + p.h / 2, p.z)
    dummy.rotation.set(0, p.yaw, 0)
    dummy.scale.set(1, p.h, 1)
    dummy.updateMatrix()
    poles.setMatrixAt(i, dummy.matrix)
  })
  poles.instanceMatrix.needsUpdate = true
  poles.castShadow = true
  group.add(poles)

  /* kites soar high over the plains */
  cachedBirdAnchors = [120, 300].map((m) => {
    road.place(m, rngRange(rng, -30, 30), pos)
    return new Vector3(pos.x, rngRange(rng, 45, 60), pos.z)
  })

  cachedGroup = group
  return group
}
