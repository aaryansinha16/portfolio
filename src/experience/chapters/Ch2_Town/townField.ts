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
import { DETOUR_SIGN, TOWN_GRAFFITI, TOWN_ROOF_BOARDS, TOWN_SHOPS } from '../../../content'

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
const BACK_PANEL_MAT = new MeshStandardMaterial({ color: '#2b2620', roughness: 0.9 })
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
  /** local-Z roll applied after yaw (awnings slope toward the street) */
  tiltZ?: number
  color?: Color
}

function fill(mesh: InstancedMesh, items: Inst[], jitterColor = false, rng?: () => number) {
  items.forEach((it, i) => {
    dummy.position.set(it.x, it.y, it.z)
    dummy.rotation.set(0, it.yaw, 0)
    if (it.tiltZ) dummy.rotateZ(it.tiltZ)
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
  const sills: Inst[] = []
  const lintels: Inst[] = []
  const parapets: Inst[] = []
  const plinths: Inst[] = []
  const awnings: Inst[] = []
  const crates: Inst[] = []
  const sacks: Inst[] = []
  const graffitiSpots: { x: number; y: number; z: number; yaw: number; w: number }[] = []
  const signSpots: {
    x: number
    y: number
    z: number
    yaw: number
    ox: number
    oz: number
    w: number
    shop: number
  }[] = []
  const smoke: Vector3[] = []
  const laundry: LaundryLine[] = []
  // every building's roof-front, so the rooftop hoardings can pick spread-out
  // mounts after the street exists
  const roofCandidates: {
    m: number
    side: number
    x: number
    y: number
    z: number
    ox: number
    oz: number
    faceYaw: number
  }[] = []

  /* the street: building slots every ~11.5m, both sides.
   *
   * BASIS (the old code mixed these up and every facade prop floated):
   * a box with rotation.y = atan2(tx, tz) has its local Z along the street
   * TANGENT and its local X perpendicular to it. So sz carries the width
   * ALONG the street, sx the depth TOWARD the road, and (ox, oz) — the unit
   * normal from the front facade toward the road — is where "proud of the
   * wall" lives. Facade props offset along (tx, tz), never cos/sin(yaw). */
  let shopCounter = 0
  for (const side of [-1, 1]) {
    for (let m = 14; m < road.zoneMeters - 14; m += 11.5) {
      if (rng() < 0.16) continue // side-street gap
      const s = road.at(m)
      const width = rngRange(rng, 8, 11) // along the street
      const depth = rngRange(rng, 6, 9) // toward/away from the road
      const floors = rng() < 0.45 ? 3 : 2
      const height = floors * rngRange(rng, 3.0, 3.5)
      const lateral = (8.2 + depth / 2) * side
      road.place(m, lateral, pos)
      const yaw = Math.atan2(s.tx, s.tz)
      const ox = -s.rx * side // facade normal, toward the road
      const oz = -s.rz * side
      const faceYaw = Math.atan2(ox, oz) // planes' +Z faces the road
      const color = plaster[Math.floor(rng() * plaster.length)]

      walls.push({
        x: pos.x,
        y: pos.y + height / 2,
        z: pos.z,
        yaw,
        sx: depth,
        sy: height,
        sz: width,
        color,
      })
      // parapet cap + plinth band ground the slab (owner: houses read bland)
      parapets.push({
        x: pos.x,
        y: pos.y + height + 0.14,
        z: pos.z,
        yaw,
        sx: depth + 0.35,
        sy: 0.28,
        sz: width + 0.35,
        color: c.copy(color).multiplyScalar(0.72).clone(),
      })
      plinths.push({
        x: pos.x,
        y: pos.y + 0.35,
        z: pos.z,
        yaw,
        sx: depth + 0.2,
        sy: 0.7,
        sz: width + 0.2,
        color: c.copy(color).multiplyScalar(0.55).clone(),
      })

      // front face center, on the road side of the slab
      const fx = pos.x + ox * (depth / 2 + 0.03)
      const fz = pos.z + oz * (depth / 2 + 0.03)

      if (height >= 6) {
        roofCandidates.push({ m, side, x: fx, y: pos.y + height, z: fz, ox, oz, faceYaw })
      }

      const isShop = rng() < 0.62
      if (isShop) {
        // dark shopfront opening, sunk just proud of the wall
        insets.push({
          x: fx + ox * 0.05,
          y: pos.y + 1.15,
          z: fz + oz * 0.05,
          yaw,
          sx: 0.24,
          sy: 2.3,
          sz: width * 0.66,
        })
        // canvas awning: a thin slab sloping down toward the street.
        // o = side * localX, so rolling around local Z by -side*θ drops
        // the street edge.
        awnings.push({
          x: fx + ox * 0.72,
          y: pos.y + 2.62,
          z: fz + oz * 0.72,
          yaw,
          tiltZ: -side * 0.3,
          sx: 1.5,
          sy: 0.07,
          sz: width * 0.7,
          color: awningColors[Math.floor(rng() * awningColors.length)],
        })
        signSpots.push({
          x: fx + ox * 0.12,
          y: pos.y + 3.35,
          z: fz + oz * 0.12,
          yaw: faceYaw,
          ox,
          oz,
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
          x: fx + ox * 0.04,
          y: pos.y + 1.7,
          z: fz + oz * 0.04,
          yaw: faceYaw,
          w: Math.min(width * 0.5, 4.2),
        })
      }

      // upper-floor windows: dark glass proud of the wall, with a bright
      // sill below and a shadowed lintel above — reads as a real opening
      for (let f = 1; f < floors; f++) {
        const n = Math.max(1, Math.floor(width / 2.6))
        for (let w = 0; w < n; w++) {
          const off = (w - (n - 1) / 2) * (width / n)
          const wx = fx + s.tx * off
          const wz = fz + s.tz * off
          const wy = pos.y + f * (height / floors) + 1.2
          // windows hugging the roofline read as floating slabs against sky
          if (wy > pos.y + height - 1.7) continue
          windows.push({
            x: wx + ox * 0.05,
            y: wy,
            z: wz + oz * 0.05,
            yaw,
            sx: 0.1,
            sy: 1.12,
            sz: 0.78,
          })
          sills.push({
            x: wx + ox * 0.1,
            y: wy - 0.62,
            z: wz + oz * 0.1,
            yaw,
            sx: 0.24,
            sy: 0.09,
            sz: 0.96,
            color: c.copy(color).multiplyScalar(1.28).clone(),
          })
          lintels.push({
            x: wx + ox * 0.08,
            y: wy + 0.63,
            z: wz + oz * 0.08,
            yaw,
            sx: 0.18,
            sy: 0.12,
            sz: 0.96,
            color: c.copy(color).multiplyScalar(0.6).clone(),
          })
        }
      }

      // laundry strung high across occasional facades, just off the wall
      if (rng() < 0.18 && laundry.length < 5) {
        const y = pos.y + height - rngRange(rng, 0.6, 1.4)
        const a = new Vector3(
          fx + ox * 0.5 + s.tx * (width * 0.38),
          y,
          fz + oz * 0.5 + s.tz * (width * 0.38),
        )
        const b = new Vector3(
          fx + ox * 0.5 - s.tx * (width * 0.38),
          y - 0.2,
          fz + oz * 0.5 - s.tz * (width * 0.38),
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
  const sillMesh = new InstancedMesh(BOX, WALL_MAT, sills.length)
  fill(sillMesh, sills)
  const lintelMesh = new InstancedMesh(BOX, WALL_MAT, lintels.length)
  fill(lintelMesh, lintels)
  const parapetMesh = new InstancedMesh(BOX, WALL_MAT, parapets.length)
  fill(parapetMesh, parapets)
  parapetMesh.castShadow = true
  const plinthMesh = new InstancedMesh(BOX, WALL_MAT, plinths.length)
  fill(plinthMesh, plinths)
  group.add(sillMesh, lintelMesh, parapetMesh, plinthMesh)

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

  const awningMesh = new InstancedMesh(BOX, AWNING_MAT, awnings.length)
  fill(awningMesh, awnings, true, rng)
  awningMesh.castShadow = true
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
    // backing board sits half a step INTO the wall behind the painted face
    signBacks.push({
      x: spot.x - spot.ox * 0.06,
      y: spot.y,
      z: spot.z - spot.oz * 0.06,
      yaw: spot.yaw,
      sx: spot.w + 0.15,
      sy: 1.0,
      sz: 0.08,
    })
  }
  const signBackMesh = new InstancedMesh(BOX, DARK_INSET_MAT, signBacks.length)
  fill(signBackMesh, signBacks)
  group.add(signBackMesh)

  /* rooftop hoardings — the freelance years told from the skyline (owner:
     the town looked right but said nothing). Six boards spread along the
     street with real gaps, alternating sides, mounted at each house's
     roof-front on twin posts. */
  {
    const targets = [60, 150, 240, 330, 420, 500]
    const used = new Set<number>()
    TOWN_ROOF_BOARDS.forEach((entry, bi) => {
      const wantSide = bi % 2 === 0 ? -1 : 1
      let best = -1
      let bestD = Infinity
      roofCandidates.forEach((cand, ci) => {
        if (cand.side !== wantSide || used.has(ci)) return
        const d = Math.abs(cand.m - targets[bi])
        if (d < bestD) {
          bestD = d
          best = ci
        }
      })
      if (best < 0) return
      used.add(best)
      const spot = roofCandidates[best]

      const panelW = 7.2
      const panelH = 2.7
      const panelY = spot.y + 2.15
      const tex = makeTextPanel({
        title: entry.title,
        sub: entry.sub,
        bg: entry.bg,
        fg: '#e8e2d0',
        border: '#e8e2d066',
        bleach: 0.15,
        w: 1024,
        h: 384,
      })
      const panel = new Mesh(
        new PlaneGeometry(panelW, panelH),
        new MeshStandardMaterial({
          map: tex,
          emissive: '#ffffff',
          emissiveMap: tex,
          emissiveIntensity: 0.24,
          roughness: 0.85,
        }),
      )
      panel.position.set(spot.x, panelY, spot.z)
      panel.rotation.y = spot.faceYaw
      panel.castShadow = true
      const backing = new Mesh(new PlaneGeometry(panelW + 0.2, panelH + 0.2), BACK_PANEL_MAT)
      backing.position.copy(panel.position)
      backing.rotation.y = spot.faceYaw
      backing.translateZ(-0.05)
      group.add(backing, panel)

      // twin posts from the roof to the panel, tucked behind its face
      for (const off of [-panelW * 0.36, panelW * 0.36]) {
        const post = new Mesh(POLE_GEO, POLE_MAT)
        const h = panelY - spot.y + panelH * 0.2
        post.position.set(
          spot.x + Math.cos(spot.faceYaw) * off - spot.ox * 0.14,
          spot.y + h / 2,
          spot.z - Math.sin(spot.faceYaw) * off - spot.oz * 0.14,
        )
        post.scale.set(0.9, h, 0.9)
        group.add(post)
      }
    })
  }

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
