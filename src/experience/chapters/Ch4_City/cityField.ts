import {
  BoxGeometry,
  CanvasTexture,
  CylinderGeometry,
  Group,
  InstancedMesh,
  MeshStandardMaterial,
  Object3D,
  SRGBColorSpace,
  Vector3,
} from 'three'
import { Mesh, PlaneGeometry } from 'three'
import { getZoneRoad } from '../../world/roadSamples'
import { buildTowerMesh, buildWindowMesh, genTowers, type TowerSpec } from '../../world/towers'
import { makeTextPanel } from '../../world/textPanel'
import { cityStations, TUNNEL_LEN } from '../../world/focusZones'
import { registerFocusTarget } from '../../world/focusTargets'
import { CHAPTER_MARKS, totalLength } from '../../spline/roadPath'
import { createRng, rngRange } from '../../../utils/random'
import { CITY_BILLBOARDS, CITY_GANTRIES } from '../../../content'

export { TUNNEL_LEN }

/**
 * A career-chapter billboard: era chip, huge glowing title, payoff line, and
 * a timeline bar showing where this stop sits in the whole arc — denser than
 * a bare title+sub panel, and it reads at a glance while driving.
 */
function drawCareerBoard(
  bb: { era: string; title: string; sub: string; color: string },
  index: number,
  total: number,
): CanvasTexture {
  const w = 1024
  const h = 512
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')!

  ctx.fillStyle = '#0d1126'
  ctx.fillRect(0, 0, w, h)
  // faint scanlines — these screens glitch, they should look like screens
  ctx.fillStyle = 'rgba(255,255,255,0.028)'
  for (let y = 0; y < h; y += 7) ctx.fillRect(0, y, w, 2)
  ctx.strokeStyle = `${bb.color}55`
  ctx.lineWidth = 6
  ctx.strokeRect(10, 10, w - 20, h - 20)

  // era chip
  ctx.fillStyle = bb.color
  ctx.font = "900 44px 'Courier New', monospace"
  const eraW = ctx.measureText(bb.era).width + 48
  ctx.fillRect(48, 46, eraW, 72)
  ctx.fillStyle = '#0d1126'
  ctx.textAlign = 'left'
  ctx.textBaseline = 'middle'
  ctx.fillText(bb.era, 72, 86)

  // title — glowing, auto-fit
  let size = 128
  ctx.font = `900 ${size}px 'Arial Narrow', 'Arial Black', sans-serif`
  while (size > 56 && ctx.measureText(bb.title).width > w - 110) {
    size -= 4
    ctx.font = `900 ${size}px 'Arial Narrow', 'Arial Black', sans-serif`
  }
  ctx.fillStyle = bb.color
  ctx.shadowColor = bb.color
  ctx.shadowBlur = 42
  ctx.fillText(bb.title, 52, 232)
  ctx.shadowBlur = 14
  ctx.fillText(bb.title, 52, 232)
  ctx.shadowBlur = 0

  // payoff line
  ctx.fillStyle = '#c9d2e4'
  let subSize = 46
  ctx.font = `500 ${subSize}px 'Helvetica Neue', Arial, sans-serif`
  while (subSize > 26 && ctx.measureText(bb.sub).width > w - 110) {
    subSize -= 2
    ctx.font = `500 ${subSize}px 'Helvetica Neue', Arial, sans-serif`
  }
  ctx.fillText(bb.sub, 54, 330)

  // the arc so far — timeline bar + position label
  const barY = h - 88
  ctx.fillStyle = 'rgba(201,210,228,0.18)'
  ctx.fillRect(54, barY, w - 300, 10)
  ctx.fillStyle = bb.color
  ctx.fillRect(54, barY, (w - 300) * ((index + 1) / total), 10)
  ctx.font = "700 40px 'Courier New', monospace"
  ctx.textAlign = 'right'
  ctx.fillText(`${index + 1} / ${total}`, w - 54, barY + 6)

  const texture = new CanvasTexture(canvas)
  texture.colorSpace = SRGBColorSpace
  texture.anisotropy = 4
  return texture
}

/**
 * Ch4 City statics: dusk towers with lit window grids, sodium streetlights,
 * and the tunnel at the zone's end — the boundary blend into neon night
 * happens INSIDE it, so you dive in at dusk and emerge into night.
 */

const ZONE = 4
const SEED = 4404
// TUNNEL_LEN lives in focusZones (pure layout math) and is re-exported above

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

  /* the career arc — big billboards hung LOW on road-facing tower faces
     (owner: eye level, not rooftops), plus two gantries spanning the road.
     Every mount picks the face by dot(normal, toRoad) and uses THAT face's
     half-extent — max(w,d)/2 left boards floating off the narrow faces. */
  {
    const usable = towers.filter((t) => t.h > 17)
    // boards and gantries share one evenly spaced station rhythm — nothing
    // ever sits in another sign's sight-line (owner: Masai hid THE CLIMB,
    // Paisaeasy hid 7 ROLES, Freelance hid behind a nearer tower)
    const stations = cityStations(road.zoneMeters)
    const gantryMs = stations.gantries

    // a board is USELESS if a nearer tower blocks its approach sight-line:
    // walk the ray from the mount toward the oncoming driver at board
    // height and reject mounts whose ray clips another tower's footprint
    const rayBlocked = (from: TowerSpec, py: number, dirX: number, dirZ: number) => {
      for (let k = 10; k <= 72; k += 7) {
        const sx = from.x + dirX * k
        const sz = from.z + dirZ * k
        for (const t of usable) {
          if (t === from || t.y + t.h + 1 < py) continue
          const dx = sx - t.x
          const dz = sz - t.z
          const c = Math.cos(t.yaw)
          const s = Math.sin(t.yaw)
          const lx = dx * c - dz * s
          const lz = dx * s + dz * c
          if (Math.abs(lx) < t.w / 2 + 1 && Math.abs(lz) < t.d / 2 + 1) return true
        }
      }
      return false
    }

    // each usable tower's position ALONG the road — separation and glance
    // timing both need it
    const alongOf = new Map<TowerSpec, number>()
    for (const t of usable) {
      let bestD2 = Infinity
      let m = 0
      for (const smp of road.samples) {
        const d2 = (t.x - smp.x) ** 2 + (t.z - smp.z) ** 2
        if (d2 < bestD2) {
          bestD2 = d2
          m = smp.meters
        }
      }
      alongOf.set(t, m)
    }
    // mounts already spoken for — stations kept boards apart on paper, but
    // tower-snapping (±25m) collapsed neighbors into each other (owner's
    // screenshot: Masai's panel slicing through Brainerhub's)
    const usedTowers = new Set<TowerSpec>()
    const usedAlong: number[] = [...gantryMs]
    const clearOf = (m: number, gap: number) => usedAlong.every((u) => Math.abs(u - m) >= gap)

    CITY_BILLBOARDS.forEach((bb, i) => {
      const targetM = stations.boards[i]
      const sT = road.at(targetM)
      road.place(targetM, 0, pos)
      const rx = pos.x
      const rz = pos.z
      // candidate mounts by distance; prefer the nearest that is unused,
      // ≥45m along the road from every other sign, AND has a clear
      // approach sight-line — degrading gracefully if the block is dense
      const cands = usable
        .map((t) => ({ t, d: Math.hypot(t.x - rx, t.z - rz) }))
        .filter((c) => c.d < 48 && !usedTowers.has(c.t))
        .sort((a, b) => a.d - b.d)
      if (cands.length === 0) return
      const boardYTest = 11
      const best = (
        cands.find(
          (c) =>
            clearOf(alongOf.get(c.t)!, 45) && !rayBlocked(c.t, c.t.y + boardYTest, -sT.tx, -sT.tz),
        ) ??
        cands.find((c) => clearOf(alongOf.get(c.t)!, 38)) ??
        cands[0]
      ).t
      usedTowers.add(best)
      usedAlong.push(alongOf.get(best)!)
      const toRoadLen = Math.hypot(rx - best.x, rz - best.z) || 1
      const toRoadX = (rx - best.x) / toRoadLen
      const toRoadZ = (rz - best.z) / toRoadLen
      // candidate faces carry their normal, half-extent AND width. Score
      // blends "faces the road" with "faces the APPROACHING driver" — pure
      // toRoad hung the last boards on side walls you only saw when past.
      const candidates: Array<[number, number, number]> = [
        [best.yaw, best.d / 2, best.w],
        [best.yaw + Math.PI, best.d / 2, best.w],
        [best.yaw + Math.PI / 2, best.w / 2, best.d],
        [best.yaw - Math.PI / 2, best.w / 2, best.d],
      ]
      let faceYaw = candidates[0][0]
      let halfDepth = candidates[0][1]
      let faceW = candidates[0][2]
      let bestScore = -Infinity
      for (const [cy, half, fw] of candidates) {
        const nxC = Math.sin(cy)
        const nzC = Math.cos(cy)
        const score = nxC * toRoadX + nzC * toRoadZ + 0.9 * (nxC * -sT.tx + nzC * -sT.tz)
        if (score > bestScore) {
          bestScore = score
          faceYaw = cy
          halfDepth = half
          faceW = fw
        }
      }
      const nx = Math.sin(faceYaw)
      const nz = Math.cos(faceYaw)

      const tex = drawCareerBoard(bb, i, CITY_BILLBOARDS.length)
      const mat = new MeshStandardMaterial({
        color: '#000000',
        emissive: '#ffffff',
        emissiveMap: tex,
        map: tex,
        emissiveIntensity: 1.6,
        roughness: 0.7,
        toneMapped: false,
      })
      if (i % 2 === 1) BILLBOARD_FLICKER_MATS.push(mat)
      // a 15m panel on a 10m face wraps past the corner into the neighbor —
      // fit the board to its wall (a slight hoarding overhang is fine)
      const boardW = Math.max(10, Math.min(15, faceW + 1.5))
      const boardH = boardW * 0.49
      const boardY = Math.min(best.h - boardH / 2 - 1.2, 9.6 + (i % 2) * 3.4)
      const face = new Mesh(new PlaneGeometry(boardW, boardH), mat)
      face.position.set(
        best.x + nx * (halfDepth + 0.3),
        best.y + boardY,
        best.z + nz * (halfDepth + 0.3),
      )
      face.rotation.y = faceYaw
      // the camera glances at THIS board — timed to where the tower stands
      registerFocusTarget(CHAPTER_MARKS[4] * totalLength + alongOf.get(best)!, face.position)
      const backing = new Mesh(new PlaneGeometry(boardW + 0.8, boardH + 0.8), CONCRETE_MAT)
      backing.position.copy(face.position)
      backing.rotation.y = faceYaw
      backing.translateZ(-0.08)
      group.add(backing, face)
    })

    /* gantries — you drive right under these; unmissable career copy */
    CITY_GANTRIES.forEach((g, gi) => {
      const m = gantryMs[gi]
      const s = road.at(m)
      const yaw = Math.atan2(s.tx, s.tz)
      const steel = new MeshStandardMaterial({ color: '#23232c', metalness: 0.5, roughness: 0.5 })
      for (const side of [-1, 1]) {
        road.place(m, 6.8 * side, pos)
        const post = new Mesh(BOX, steel)
        post.position.set(pos.x, pos.y + 3.9, pos.z)
        post.rotation.y = yaw
        post.scale.set(0.5, 7.8, 0.5)
        post.castShadow = true
        group.add(post)
      }
      road.place(m, 0, pos)
      const beam = new Mesh(BOX, steel)
      beam.position.set(pos.x, pos.y + 7.7, pos.z)
      beam.rotation.y = yaw
      beam.scale.set(14.4, 0.75, 0.75)
      group.add(beam)

      const tex = makeTextPanel({
        title: g.title,
        sub: g.sub,
        bg: '#10142a',
        fg: g.color,
        glow: true,
        border: `${g.color}44`,
        w: 1024,
        h: 232,
      })
      const panelMat = new MeshStandardMaterial({
        color: '#000000',
        emissive: '#ffffff',
        emissiveMap: tex,
        map: tex,
        emissiveIntensity: 1.8,
        roughness: 0.6,
        toneMapped: false,
      })
      if (gi === 1) BILLBOARD_FLICKER_MATS.push(panelMat)
      const panel = new Mesh(new PlaneGeometry(12.6, 2.85), panelMat)
      // face BACK toward the approaching driver (single-sided plane)
      panel.position.set(pos.x, pos.y + 5.9, pos.z)
      panel.rotation.y = yaw + Math.PI
      const panelBack = new Mesh(BOX, CONCRETE_MAT)
      panelBack.position.copy(panel.position)
      panelBack.rotation.y = panel.rotation.y
      panelBack.scale.set(12.9, 3.1, 0.16)
      panelBack.translateZ(-0.12)
      group.add(panelBack, panel)
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
