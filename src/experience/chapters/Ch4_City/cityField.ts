import {
  BoxGeometry,
  CylinderGeometry,
  Group,
  InstancedMesh,
  MeshStandardMaterial,
  Object3D,
  Vector3,
} from 'three'
import { getZoneRoad } from '../../world/roadSamples'
import { buildTowerMesh, buildWindowMesh, genTowers } from '../../world/towers'
import { createRng, rngRange } from '../../../utils/random'

/**
 * Ch4 City statics: dusk towers with lit window grids, sodium streetlights,
 * and the tunnel at the zone's end — the boundary blend into neon night
 * happens INSIDE it, so you dive in at dusk and emerge into night.
 */

const ZONE = 4
const SEED = 4404
export const TUNNEL_LEN = 78 // road covered by the tunnel, ending past the boundary

const BOX = new BoxGeometry(1, 1, 1)
const POLE_GEO = new CylinderGeometry(0.08, 0.1, 1, 6)
const POLE_MAT = new MeshStandardMaterial({ color: '#2f2f38', metalness: 0.4, roughness: 0.6 })
const SODIUM_MAT = new MeshStandardMaterial({
  color: '#ffb46b',
  emissive: '#ffb46b',
  emissiveIntensity: 2.4,
  toneMapped: false,
})
const CONCRETE_MAT = new MeshStandardMaterial({ color: '#2e2c34', roughness: 0.95 })
const TUNNEL_LIGHT_MAT = new MeshStandardMaterial({
  color: '#ffc27d',
  emissive: '#ffc27d',
  emissiveIntensity: 2.8,
  toneMapped: false,
})
const BEACON_MAT = new MeshStandardMaterial({
  color: '#ff3b30',
  emissive: '#ff3b30',
  emissiveIntensity: 3,
  toneMapped: false,
})

const dummy = new Object3D()
let cachedGroup: Group | null = null
let cachedBeacons: InstancedMesh | null = null
let cachedBirdAnchors: Vector3[] | null = null

export function getCityBeacons(): InstancedMesh {
  getCityStatics()
  return cachedBeacons!
}

export function getCityBirdAnchors(): Vector3[] {
  getCityStatics()
  return cachedBirdAnchors!
}

export function getCityStatics(): Group {
  if (cachedGroup) return cachedGroup
  const road = getZoneRoad(ZONE)
  const rng = createRng(SEED)
  const group = new Group()
  const pos = new Vector3()

  /* towers with lit windows — dusk offices coming alive */
  const towers = genTowers({
    zone: ZONE,
    seed: SEED,
    spacing: 14,
    offMin: 11,
    offMax: 34,
    wMin: 9,
    wMax: 16,
    hMin: 16,
    hMax: 52,
    density: 0.85,
    endClear: TUNNEL_LEN + 12,
  })
  group.add(buildTowerMesh(towers, ['#3a3f5c', '#464b6b', '#6b4e71', '#333850']))
  group.add(
    buildWindowMesh(towers, {
      seed: SEED + 1,
      litChance: 0.3,
      colors: ['#ff8c42', '#ffd9a0', '#ffb46b', '#d8e0ff'],
    }),
  )

  /* sodium streetlights, alternating sides */
  const poles: { m: number; side: number }[] = []
  for (let m = 16; m < road.zoneMeters - TUNNEL_LEN - 10; m += 32) {
    poles.push({ m, side: poles.length % 2 === 0 ? -1 : 1 })
  }
  const poleMesh = new InstancedMesh(POLE_GEO, POLE_MAT, poles.length)
  const armMesh = new InstancedMesh(BOX, POLE_MAT, poles.length)
  const headMesh = new InstancedMesh(BOX, SODIUM_MAT, poles.length)
  poles.forEach((p, i) => {
    const s = road.at(p.m)
    road.place(p.m, 5.8 * p.side, pos)
    const yaw = Math.atan2(s.tx, s.tz)
    dummy.position.set(pos.x, pos.y + 3.1, pos.z)
    dummy.rotation.set(0, yaw, 0)
    dummy.scale.set(1, 6.2, 1)
    dummy.updateMatrix()
    poleMesh.setMatrixAt(i, dummy.matrix)
    // arm reaches over the road
    road.place(p.m, 4.6 * p.side, pos)
    dummy.position.set(pos.x, pos.y + 6.1, pos.z)
    dummy.scale.set(0.09, 0.09, 2.6)
    dummy.rotation.set(0, yaw + (p.side === 1 ? Math.PI / 2 : -Math.PI / 2), 0)
    dummy.updateMatrix()
    armMesh.setMatrixAt(i, dummy.matrix)
    road.place(p.m, 3.6 * p.side, pos)
    dummy.position.set(pos.x, pos.y + 6.0, pos.z)
    dummy.rotation.set(0, yaw, 0)
    dummy.scale.set(0.5, 0.14, 0.9)
    dummy.updateMatrix()
    headMesh.setMatrixAt(i, dummy.matrix)
  })
  poleMesh.instanceMatrix.needsUpdate = true
  armMesh.instanceMatrix.needsUpdate = true
  headMesh.instanceMatrix.needsUpdate = true
  poleMesh.castShadow = true
  group.add(poleMesh, armMesh, headMesh)

  /* the tunnel — swallows the city→neon boundary */
  const t0 = road.zoneMeters - TUNNEL_LEN
  const segStep = 4
  const segs: { m: number }[] = []
  for (let m = t0; m < road.zoneMeters + 26; m += segStep) segs.push({ m })
  const wallMesh = new InstancedMesh(BOX, CONCRETE_MAT, segs.length * 2)
  const roofMesh = new InstancedMesh(BOX, CONCRETE_MAT, segs.length)
  segs.forEach((seg, i) => {
    const s = road.at(seg.m)
    const yaw = Math.atan2(s.tx, s.tz)
    for (const side of [-1, 1]) {
      road.place(seg.m, 5.4 * side, pos)
      dummy.position.set(pos.x, pos.y + 3.4, pos.z)
      dummy.rotation.set(0, yaw, 0)
      dummy.scale.set(1.2, 6.8, segStep + 0.4)
      dummy.updateMatrix()
      wallMesh.setMatrixAt(i * 2 + (side + 1) / 2, dummy.matrix)
    }
    road.place(seg.m, 0, pos)
    dummy.position.set(pos.x, pos.y + 7.0, pos.z)
    dummy.rotation.set(0, yaw, 0)
    dummy.scale.set(12.2, 0.9, segStep + 0.4)
    dummy.updateMatrix()
    roofMesh.setMatrixAt(i, dummy.matrix)
  })
  wallMesh.instanceMatrix.needsUpdate = true
  roofMesh.instanceMatrix.needsUpdate = true
  wallMesh.receiveShadow = true
  group.add(wallMesh, roofMesh)

  // portal header — a taller face so the entrance reads from afar
  {
    const s = road.at(t0)
    road.place(t0, 0, pos)
    const yaw = Math.atan2(s.tx, s.tz)
    const header = new InstancedMesh(BOX, CONCRETE_MAT, 1)
    dummy.position.set(pos.x, pos.y + 8.4, pos.z)
    dummy.rotation.set(0, yaw, 0)
    dummy.scale.set(14, 3.4, 1.6)
    dummy.updateMatrix()
    header.setMatrixAt(0, dummy.matrix)
    header.instanceMatrix.needsUpdate = true
    group.add(header)
  }

  // ceiling strip lights through the tunnel
  const lightCount = Math.floor((TUNNEL_LEN + 26) / 8)
  const lights = new InstancedMesh(BOX, TUNNEL_LIGHT_MAT, lightCount)
  for (let i = 0; i < lightCount; i++) {
    const m = t0 + 4 + i * 8
    road.place(m, 0, pos)
    const s = road.at(m)
    dummy.position.set(pos.x, pos.y + 6.4, pos.z)
    dummy.rotation.set(0, Math.atan2(s.tx, s.tz), 0)
    dummy.scale.set(0.3, 0.08, 2.2)
    dummy.updateMatrix()
    lights.setMatrixAt(i, dummy.matrix)
  }
  lights.instanceMatrix.needsUpdate = true
  group.add(lights)

  /* aircraft-warning beacons on the five tallest towers (blinked per frame) */
  const tallest = [...towers].sort((a, b) => b.h - a.h).slice(0, 5)
  const beacons = new InstancedMesh(BOX, BEACON_MAT, tallest.length)
  tallest.forEach((t, i) => {
    dummy.position.set(t.x, t.y + t.h + 0.4, t.z)
    dummy.rotation.set(0, 0, 0)
    dummy.scale.setScalar(0.5)
    dummy.updateMatrix()
    beacons.setMatrixAt(i, dummy.matrix)
  })
  beacons.instanceMatrix.needsUpdate = true
  cachedBeacons = beacons
  group.add(beacons)

  cachedBirdAnchors = [0.25, 0.6].map((f) => {
    road.place(road.zoneMeters * f, rngRange(rng, -15, 15), pos)
    return new Vector3(pos.x, rngRange(rng, 24, 34), pos.z)
  })

  cachedGroup = group
  return group
}
