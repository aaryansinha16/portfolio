import {
  BoxGeometry,
  CylinderGeometry,
  Group,
  InstancedMesh,
  MeshStandardMaterial,
  Object3D,
  Vector3,
} from 'three'
import { Mesh, PlaneGeometry } from 'three'
import { getZoneRoad } from '../../world/roadSamples'
import { buildTowerMesh, buildWindowMesh, genTowers } from '../../world/towers'
import { makeTextPanel } from '../../world/textPanel'
import { createRng, rngRange } from '../../../utils/random'
import { CITY_BILLBOARDS } from '../../../content'

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

/** career-billboard materials — index.tsx drives flicker on a subset */
export const BILLBOARD_FLICKER_MATS: MeshStandardMaterial[] = []

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

  /* the career arc — big billboards mounted on road-facing tower faces,
     spread through the zone (owner: ch4 is the experience chapter) */
  {
    const usable = towers.filter((t) => {
      const s2 = road.at(0)
      void s2
      return t.h > 22
    })
    CITY_BILLBOARDS.forEach((bb, i) => {
      const targetM = 28 + (i * (road.zoneMeters - TUNNEL_LEN - 70)) / (CITY_BILLBOARDS.length - 1)
      // nearest tall tower to the target position
      let best = usable[0]
      let bestD = Infinity
      road.place(targetM, 0, pos)
      const rx = pos.x
      const rz = pos.z
      for (const t of usable) {
        const d = Math.hypot(t.x - rx, t.z - rz)
        if (d < bestD && d < 55) {
          bestD = d
          best = t
        }
      }
      if (!best) return
      // face whose normal points back toward the road
      const toRoadX = rx - best.x
      const toRoadZ = rz - best.z
      const candidates = [
        best.yaw + Math.PI / 2,
        best.yaw - Math.PI / 2,
        best.yaw,
        best.yaw + Math.PI,
      ]
      let faceYaw = candidates[0]
      let bestDot = -Infinity
      for (const cy of candidates) {
        const dot = Math.sin(cy) * toRoadX + Math.cos(cy) * toRoadZ
        if (dot > bestDot) {
          bestDot = dot
          faceYaw = cy
        }
      }
      const nx = Math.sin(faceYaw)
      const nz = Math.cos(faceYaw)
      const halfDepth = Math.max(best.w, best.d) / 2

      const tex = makeTextPanel({
        title: bb.title,
        sub: `${bb.era} · ${bb.sub}`,
        bg: '#12162a',
        fg: bb.color,
        glow: true,
        border: `${bb.color}55`,
        w: 896,
        h: 384,
      })
      const mat = new MeshStandardMaterial({
        color: '#000000',
        emissive: '#ffffff',
        emissiveMap: tex,
        map: tex,
        emissiveIntensity: 1.5,
        roughness: 0.7,
        toneMapped: false,
      })
      if (i % 2 === 1) BILLBOARD_FLICKER_MATS.push(mat)
      const boardW = 12
      const boardH = 5.6
      const boardY = Math.min(best.h - 4, 16 + (i % 3) * 4)
      const face = new Mesh(new PlaneGeometry(boardW, boardH), mat)
      face.position.set(
        best.x + nx * (halfDepth + 0.25),
        best.y + boardY,
        best.z + nz * (halfDepth + 0.25),
      )
      face.rotation.y = faceYaw
      const backing = new Mesh(new PlaneGeometry(boardW + 0.7, boardH + 0.7), CONCRETE_MAT)
      backing.position.copy(face.position)
      backing.rotation.y = faceYaw
      backing.translateZ(-0.08)
      group.add(backing, face)
    })
  }

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
