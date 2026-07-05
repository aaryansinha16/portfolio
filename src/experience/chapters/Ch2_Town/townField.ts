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
import { WEDGE_GEO } from '../../vehicles/parts'
import { createRng, rngRange } from '../../../utils/random'
import { DETOUR_SIGN, TOWN_GRAFFITI, TOWN_SHOPS } from '../../../content'

/**
 * Ch2 Town statics, built once and module-cached: a dense shop street —
 * plaster buildings with awnings and painted signboards, power poles with
 * sagging wires, market clutter, and the first "detour" signpost (the
 * horizontal project strip lands here in Phase 5).
 */

const ZONE = 2
const SEED = 4202

const BOX = new BoxGeometry(1, 1, 1)
const WALL_MAT = new MeshStandardMaterial({ roughness: 0.92 })
const DARK_INSET_MAT = new MeshStandardMaterial({ color: '#241f1c', roughness: 0.95 })
const AWNING_MAT = new MeshStandardMaterial({ roughness: 0.9 })
const POLE_MAT = new MeshStandardMaterial({ color: '#3d3a36', roughness: 0.85 })
const WIRE_MAT = new MeshStandardMaterial({ color: '#1c1a18', roughness: 1 })
const CRATE_MAT = new MeshStandardMaterial({ roughness: 0.95 })
const SACK_MAT = new MeshStandardMaterial({ roughness: 1 })
const POLE_GEO = new CylinderGeometry(0.09, 0.12, 1, 6)
const SACK_GEO = new IcosahedronGeometry(1, 0)
const SIGN_GEO = new PlaneGeometry(1, 1)

const dummy = new Object3D()
const c = new Color()

export interface LaundryLine {
  a: Vector3
  b: Vector3
}

interface TownAnchors {
  laundry: LaundryLine[]
  smoke: Vector3[]
  birds: Vector3[]
}

let cachedGroup: Group | null = null
let cachedAnchors: TownAnchors | null = null

export function getTownAnchors(): TownAnchors {
  getTownStatics()
  return cachedAnchors!
}

interface Inst {
  x: number
  y: number
  z: number
  yaw: number
  sx: number
  sy: number
  sz: number
  color?: Color
}

function fill(mesh: InstancedMesh, items: Inst[], jitterColor = false, rng?: () => number) {
  items.forEach((it, i) => {
    dummy.position.set(it.x, it.y, it.z)
    dummy.rotation.set(0, it.yaw, 0)
    dummy.scale.set(it.sx, it.sy, it.sz)
    dummy.updateMatrix()
    mesh.setMatrixAt(i, dummy.matrix)
    if (it.color) {
      mesh.setColorAt(
        i,
        jitterColor && rng ? c.copy(it.color).multiplyScalar(0.9 + rng() * 0.2) : it.color,
      )
    }
  })
  mesh.instanceMatrix.needsUpdate = true
  if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true
  mesh.computeBoundingSphere()
}

export function getTownStatics(): Group {
  if (cachedGroup) return cachedGroup
  const road = getZoneRoad(ZONE)
  const rng = createRng(SEED)
  const group = new Group()
  const pos = new Vector3()

  const plaster = ['#c9b79c', '#b3a184', '#4e6e81', '#c1442e', '#8a97a3', '#bfae8f'].map(
    (h) => new Color(h),
  )
  const awningColors = ['#a34e3a', '#42618a', '#6e7a3a', '#8a5a2e'].map((h) => new Color(h))
  const crateColors = ['#8a6a3e', '#a37c48', '#6e5433', '#9a4e3a'].map((h) => new Color(h))

  const walls: Inst[] = []
  const insets: Inst[] = []
  const windows: Inst[] = []
  const frames: Inst[] = []
  const parapets: Inst[] = []
  const plinths: Inst[] = []
  const awnings: Inst[] = []
  const crates: Inst[] = []
  const sacks: Inst[] = []
  const graffitiSpots: { x: number; y: number; z: number; yaw: number; w: number }[] = []
  const signSpots: { x: number; y: number; z: number; yaw: number; w: number; shop: number }[] = []
  const smoke: Vector3[] = []
  const laundry: LaundryLine[] = []

  /* the street: building slots every ~11.5m, both sides */
  let shopCounter = 0
  for (const side of [-1, 1]) {
    for (let m = 14; m < road.zoneMeters - 14; m += 11.5) {
      if (rng() < 0.16) continue // side-street gap
      const s = road.at(m)
      const width = rngRange(rng, 8, 11)
      const depth = rngRange(rng, 6, 9)
      const floors = rng() < 0.45 ? 3 : 2
      const height = floors * rngRange(rng, 3.0, 3.5)
      const lateral = (8.2 + depth / 2) * side
      road.place(m, lateral, pos)
      const yaw = Math.atan2(s.tx, s.tz)
      const color = plaster[Math.floor(rng() * plaster.length)]

      walls.push({
        x: pos.x,
        y: pos.y + height / 2,
        z: pos.z,
        yaw,
        sx: width,
        sy: height,
        sz: depth,
        color,
      })
      // parapet cap + plinth band ground the slab (owner: houses read bland)
      parapets.push({
        x: pos.x,
        y: pos.y + height + 0.14,
        z: pos.z,
        yaw,
        sx: width + 0.35,
        sy: 0.28,
        sz: depth + 0.35,
        color: c.copy(color).multiplyScalar(0.72).clone(),
      })
      plinths.push({
        x: pos.x,
        y: pos.y + 0.35,
        z: pos.z,
        yaw,
        sx: width + 0.2,
        sy: 0.7,
        sz: depth + 0.2,
        color: c.copy(color).multiplyScalar(0.55).clone(),
      })

      // front face center, toward the road
      const fx = pos.x - s.rx * side * (depth / 2 + 0.03)
      const fz = pos.z - s.rz * side * (depth / 2 + 0.03)
      const faceYaw = yaw + (side === 1 ? Math.PI : 0)

      const isShop = rng() < 0.62
      if (isShop) {
        insets.push({
          x: fx,
          y: pos.y + 1.15,
          z: fz,
          yaw,
          sx: width * 0.66,
          sy: 2.3,
          sz: 0.12,
        })
        awnings.push({
          x: fx - s.rx * side * 0.7,
          y: pos.y + 2.5,
          z: fz - s.rz * side * 0.7,
          yaw: faceYaw + Math.PI, // wedge slopes down toward the street
          sx: width * 0.7,
          sy: 0.45,
          sz: 1.5,
          color: awningColors[Math.floor(rng() * awningColors.length)],
        })
        signSpots.push({
          x: fx - s.rx * side * 0.1,
          y: pos.y + 3.35,
          z: fz - s.rz * side * 0.1,
          yaw: faceYaw,
          w: width * 0.55,
          shop: shopCounter % TOWN_SHOPS.length,
        })
        // market clutter in front
        const clutterN = Math.floor(rngRange(rng, 1, 4))
        for (let k = 0; k < clutterN; k++) {
          const cm = m + rngRange(rng, -width * 0.35, width * 0.35)
          road.place(cm, (7.2 + rngRange(rng, 0, 1.2)) * side, pos)
          if (rng() < 0.6) {
            const sSize = rngRange(rng, 0.45, 0.75)
            crates.push({
              x: pos.x,
              y: pos.y + sSize / 2,
              z: pos.z,
              yaw: rngRange(rng, 0, Math.PI),
              sx: sSize,
              sy: sSize,
              sz: sSize,
              color: crateColors[Math.floor(rng() * crateColors.length)],
            })
          } else {
            sacks.push({
              x: pos.x,
              y: pos.y + 0.28,
              z: pos.z,
              yaw: rngRange(rng, 0, Math.PI),
              sx: 0.5,
              sy: 0.42,
              sz: 0.5,
              color: c
                .set('#b8a37c')
                .clone()
                .multiplyScalar(0.85 + rng() * 0.3),
            })
          }
        }
        // one in ~8 shops is a chai stall — smoke rises behind the roofline
        if (shopCounter % 8 === 2) {
          smoke.push(new Vector3(pos.x, height + 0.5, pos.z))
        }
        shopCounter++
      }

      if (!isShop && rng() < 0.32 && graffitiSpots.length < TOWN_GRAFFITI.length) {
        graffitiSpots.push({
          x: fx - s.rx * side * 0.02,
          y: pos.y + 1.7,
          z: fz - s.rz * side * 0.02,
          yaw: faceYaw,
          w: Math.min(width * 0.5, 4.2),
        })
      }

      // upper-floor windows
      for (let f = 1; f < floors; f++) {
        const n = Math.max(1, Math.floor(width / 2.4))
        for (let w = 0; w < n; w++) {
          const off = (w - (n - 1) / 2) * (width / n)
          // frame proud of the wall, glass inset just behind its face —
          // a bright surround grounds dark windows against pale walls/sky
          const nx2 = -s.rx * side
          const nz2 = -s.rz * side
          const wx = fx + Math.cos(yaw) * off
          const wz = fz - Math.sin(yaw) * off
          const wy = pos.y + f * (height / floors) + 1.2
          // windows hugging the roofline read as floating slabs against sky
          if (wy > pos.y + height - 1.7) continue
          frames.push({
            x: wx + nx2 * 0.08,
            y: wy,
            z: wz + nz2 * 0.08,
            yaw,
            sx: 0.98,
            sy: 1.38,
            sz: 0.08,
            color: c.copy(color).multiplyScalar(1.35).clone(),
          })
          windows.push({
            x: wx + nx2 * 0.14,
            y: wy,
            z: wz + nz2 * 0.14,
            yaw,
            sx: 0.72,
            sy: 1.1,
            sz: 0.05,
          })
        }
      }

      // laundry strung high across occasional facades
      if (rng() < 0.18 && laundry.length < 5) {
        const y = pos.y + height - rngRange(rng, 0.6, 1.4)
        const a = new Vector3(
          fx + Math.cos(yaw) * (width * 0.38),
          y,
          fz - Math.sin(yaw) * (width * 0.38),
        )
        const b = new Vector3(
          fx - Math.cos(yaw) * (width * 0.38),
          y - 0.2,
          fz + Math.sin(yaw) * (width * 0.38),
        )
        laundry.push({ a, b })
      }
    }
  }

  const wallsMesh = new InstancedMesh(BOX, WALL_MAT, walls.length)
  fill(wallsMesh, walls, true, rng)
  wallsMesh.castShadow = true
  wallsMesh.receiveShadow = true
  const insetMesh = new InstancedMesh(BOX, DARK_INSET_MAT, insets.length)
  fill(insetMesh, insets)
  const windowMesh = new InstancedMesh(BOX, DARK_INSET_MAT, windows.length)
  fill(windowMesh, windows)
  const frameMesh = new InstancedMesh(BOX, WALL_MAT, frames.length)
  fill(frameMesh, frames)
  const parapetMesh = new InstancedMesh(BOX, WALL_MAT, parapets.length)
  fill(parapetMesh, parapets)
  parapetMesh.castShadow = true
  const plinthMesh = new InstancedMesh(BOX, WALL_MAT, plinths.length)
  fill(plinthMesh, plinths)
  group.add(frameMesh, parapetMesh, plinthMesh)

  /* graffiti — sprayed planes on a few plain facades */
  graffitiSpots.forEach((spot, i) => {
    const g = TOWN_GRAFFITI[i % TOWN_GRAFFITI.length]
    const tag = new Mesh(
      SIGN_GEO,
      new MeshStandardMaterial({
        map: makeTextPanel({
          title: g.text,
          bg: '#000000',
          fg: g.color,
          transparent: true,
          w: 512,
          h: 160,
        }),
        transparent: true,
        roughness: 0.95,
      }),
    )
    tag.position.set(spot.x, spot.y, spot.z)
    tag.rotation.y = spot.yaw
    tag.rotation.z = (i % 2 === 0 ? 1 : -1) * 0.03
    tag.scale.set(spot.w, spot.w * 0.3, 1)
    group.add(tag)
  })

  const awningMesh = new InstancedMesh(WEDGE_GEO, AWNING_MAT, awnings.length)
  fill(awningMesh, awnings, true, rng)
  const crateMesh = new InstancedMesh(BOX, CRATE_MAT, crates.length)
  fill(crateMesh, crates, true, rng)
  crateMesh.castShadow = true
  const sackMesh = new InstancedMesh(SACK_GEO, SACK_MAT, sacks.length)
  fill(sackMesh, sacks)
  group.add(wallsMesh, insetMesh, windowMesh, awningMesh, crateMesh, sackMesh)

  /* painted signboards — one material per shop name, planes + dark backing */
  const signMats = TOWN_SHOPS.map(
    (shop) =>
      new MeshStandardMaterial({
        map: makeTextPanel({
          title: shop.name,
          bg: shop.bg,
          fg: '#e8e2d0',
          border: '#e8e2d066',
          w: 384,
          h: 96,
          bleach: 0.2,
        }),
        roughness: 0.85,
      }),
  )
  const signBacks: Inst[] = []
  for (const spot of signSpots) {
    const sign = new Mesh(SIGN_GEO, signMats[spot.shop])
    sign.position.set(spot.x, spot.y, spot.z)
    sign.rotation.y = spot.yaw
    sign.scale.set(spot.w, 0.85, 1)
    group.add(sign)
    signBacks.push({
      x: spot.x,
      y: spot.y,
      z: spot.z,
      yaw: spot.yaw,
      sx: spot.w + 0.15,
      sy: 1.0,
      sz: 0.1,
    })
  }
  const signBackMesh = new InstancedMesh(BOX, DARK_INSET_MAT, signBacks.length)
  fill(signBackMesh, signBacks)
  group.add(signBackMesh)

  /* power poles (right side) + sagging wires */
  const poles: Inst[] = []
  const arms: Inst[] = []
  const wireSegs: Inst[] = []
  for (let m = 8; m < road.zoneMeters; m += 26) {
    const s = road.at(m)
    road.place(m, 6.4, pos)
    const yaw = Math.atan2(s.tx, s.tz)
    poles.push({ x: pos.x, y: pos.y + 3.5, z: pos.z, yaw, sx: 1, sy: 7, sz: 1 })
    arms.push({ x: pos.x, y: pos.y + 6.6, z: pos.z, yaw, sx: 1.4, sy: 0.08, sz: 0.08 })
  }
  // wires: 2 lines per span, 4 sagging segments each. Boxes can't pitch via
  // yaw-only Inst, so each segment is placed level at its midpoint height —
  // at 3cm thickness the stepping is invisible from the road.
  for (let i = 0; i < poles.length - 1; i++) {
    const a = poles[i]
    const b = poles[i + 1]
    const wireYA = a.y + 3.1 // pole center +3.5 → arm at +6.6 above ground
    const wireYB = b.y + 3.1
    for (const armOff of [-0.55, 0.55]) {
      const ax = a.x + Math.cos(a.yaw) * armOff
      const az = a.z - Math.sin(a.yaw) * armOff
      const bx = b.x + Math.cos(b.yaw) * armOff
      const bz = b.z - Math.sin(b.yaw) * armOff
      const segs = 4
      for (let k = 0; k < segs; k++) {
        const t0 = k / segs
        const t1 = (k + 1) / segs
        const tm = (t0 + t1) / 2
        const x0 = ax + (bx - ax) * t0
        const z0 = az + (bz - az) * t0
        const x1 = ax + (bx - ax) * t1
        const z1 = az + (bz - az) * t1
        const yMid = wireYA + (wireYB - wireYA) * tm - Math.sin(Math.PI * tm) * 0.55
        const len = Math.hypot(x1 - x0, z1 - z0) + 0.12
        wireSegs.push({
          x: (x0 + x1) / 2,
          y: yMid,
          z: (z0 + z1) / 2,
          yaw: Math.atan2(x1 - x0, z1 - z0),
          sx: 0.03,
          sy: 0.03,
          sz: len,
        })
      }
    }
  }
  const poleMesh = new InstancedMesh(POLE_GEO, POLE_MAT, poles.length)
  fill(poleMesh, poles)
  poleMesh.castShadow = true
  const armMesh = new InstancedMesh(BOX, POLE_MAT, arms.length)
  fill(armMesh, arms)
  const wireMesh = new InstancedMesh(BOX, WIRE_MAT, wireSegs.length)
  fill(wireMesh, wireSegs)
  group.add(poleMesh, armMesh, wireMesh)

  /* the first detour signpost — Phase 5's horizontal strip lands here */
  {
    const m = road.zoneMeters * 0.62
    const s = road.at(m)
    road.place(m, 6.8, pos)
    const yaw = Math.atan2(s.tx, s.tz) + Math.PI + 0.35
    const post = new Mesh(POLE_GEO, POLE_MAT)
    post.position.set(pos.x, pos.y + 1.6, pos.z)
    post.scale.set(0.8, 3.2, 0.8)
    post.castShadow = true
    const board = new Mesh(
      SIGN_GEO,
      new MeshStandardMaterial({
        map: makeTextPanel({
          title: DETOUR_SIGN.title,
          sub: DETOUR_SIGN.sub,
          bg: '#1f4d3a',
          fg: '#e8e2d0',
          border: '#e8e2d0aa',
          w: 512,
          h: 192,
        }),
        roughness: 0.8,
      }),
    )
    board.position.set(pos.x, pos.y + 3.0, pos.z)
    board.rotation.y = yaw
    board.scale.set(2.6, 1.0, 1)
    const boardBack = new Mesh(BOX, DARK_INSET_MAT)
    boardBack.position.copy(board.position)
    boardBack.rotation.y = yaw
    boardBack.scale.set(2.7, 1.1, 0.08)
    boardBack.translateZ(-0.05)
    group.add(post, boardBack, board)
  }

  cachedAnchors = {
    laundry,
    smoke,
    birds: [0.3, 0.7].map((f) => {
      road.place(road.zoneMeters * f, rngRange(rng, -12, 12), pos)
      return new Vector3(pos.x, rngRange(rng, 13, 19), pos.z)
    }),
  }
  cachedGroup = group
  return group
}
