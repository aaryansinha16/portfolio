import {
  BoxGeometry,
  BufferAttribute,
  BufferGeometry,
  Color,
  CylinderGeometry,
  Group,
  InstancedMesh,
  Mesh,
  MeshStandardMaterial,
  Object3D,
  PlaneGeometry,
  ShaderMaterial,
  Uniform,
  Vector3,
} from 'three'
import { getZoneRoad, type ZoneRoad } from '../../world/roadSamples'
import { makeTextPanel } from '../../world/textPanel'
import { createRng, rngRange } from '../../../utils/random'
import { BOARD_Y } from './config'

/**
 * Ch6 — the circuit board finale. The road runs across a giant PCB: copper
 * traces light up ahead of the vehicle (scroll-driven pulse front), gold
 * pads and vias, silkscreen print, and components that rise out of the
 * board as the front passes them. Trace-green + gold from the DESIGN
 * palette; the pulse front is the chapter's "one authored moment".
 */

const ZONE = 6
const SEED = 4606
const TRACE_LIFT = 0.04
const TRACE_W = 0.5

const dummy = new Object3D()

/* board extents (meters along the zone where the road runs level on it) */
interface BoardFrame {
  road: ZoneRoad
  startM: number
  endM: number
  length: number
}

let boardFrame: BoardFrame | null = null

export function getBoardFrame(): BoardFrame {
  if (boardFrame) return boardFrame
  const road = getZoneRoad(ZONE)
  let startM = 0
  for (const s of road.samples) {
    if (s.y > BOARD_Y + 0.4) {
      startM = s.meters
      break
    }
  }
  // the board is TORN OFF at the cliff (roadPath.CLIFF_START_M, which is
  // totalLength - 10 — the same line in zone meters). Everything on the
  // board stays behind this edge.
  const endM = road.zoneMeters - 10
  boardFrame = { road, startM: startM + 6, endM, length: endM - startM - 6 }
  return boardFrame
}

/** Normalized pulse-front position for a given journey progress (0..1+). */
export function pulseFrontAt(vehicleM: number): number {
  const bf = getBoardFrame()
  // the front races ~22m ahead of the vehicle, clamped to the board
  return (vehicleM - bf.startM + 22) / bf.length
}

/* ---------------- trace shader ---------------- */

const TRACE_VERT = /* glsl */ `
attribute float aDist;
varying float vDist;
void main() {
  vDist = aDist;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`

const TRACE_FRAG = /* glsl */ `
uniform float uFront;
uniform float uTime;
varying float vDist;
void main() {
  vec3 dark = vec3(0.016, 0.10, 0.055);
  vec3 lit = vec3(0.07, 0.95, 0.34);
  float behind = 1.0 - smoothstep(uFront - 0.004, uFront + 0.004, vDist);
  float shimmer = 0.82 + 0.18 * sin(uTime * 2.4 + vDist * 55.0);
  // hot head right at the front line
  float head = exp(-abs(vDist - uFront) * 220.0) * 1.7;
  vec3 col = mix(dark, lit * shimmer, behind) + vec3(0.5, 1.1, 0.7) * head;
  gl_FragColor = vec4(col, 1.0);
}
`

export const traceMaterial = new ShaderMaterial({
  vertexShader: TRACE_VERT,
  fragmentShader: TRACE_FRAG,
  uniforms: { uFront: new Uniform(0), uTime: new Uniform(0) },
})

/* ---------------- component data (for the rise animation) ---------------- */

export interface BoardComponent {
  x: number
  y0: number // sunk center y
  y1: number // proud center y
  z: number
  yaw: number
  sx: number
  sy: number
  sz: number
  /** normalized board distance — rises when the pulse front passes */
  dist: number
  kind: 'chip' | 'cap'
}

let cachedComponents: BoardComponent[] | null = null
let cachedLeds: InstancedMesh | null = null
let cachedChips: InstancedMesh | null = null
let cachedCaps: InstancedMesh | null = null
let cachedGroup: Group | null = null

export function getCircuitComponents(): {
  components: BoardComponent[]
  chips: InstancedMesh
  caps: InstancedMesh
} {
  getCircuitStatics()
  return { components: cachedComponents!, chips: cachedChips!, caps: cachedCaps! }
}

export function getCircuitLeds(): InstancedMesh {
  getCircuitStatics()
  return cachedLeds!
}

/* ---------------- statics ---------------- */

export function getCircuitStatics(): Group {
  if (cachedGroup) return cachedGroup
  const bf = getBoardFrame()
  const { road } = bf
  const rng = createRng(SEED)
  const group = new Group()
  const pos = new Vector3()

  /* the board itself — runs from behind the ramp crest and STOPS at the
     cliff edge; past it there is only the void */
  const boardFrom = bf.startM - 60
  const midM = (boardFrom + bf.endM) / 2
  const s = road.at(midM)
  const board = new Mesh(
    new PlaneGeometry(300, bf.endM - boardFrom),
    new MeshStandardMaterial({
      color: '#04150d',
      emissive: '#0f3d2e',
      emissiveIntensity: 0.18,
      roughness: 0.82,
      metalness: 0.15,
    }),
  )
  road.place(midM, 0, pos)
  board.position.set(pos.x, BOARD_Y - 0.02, pos.z)
  board.rotation.set(-Math.PI / 2, 0, Math.atan2(s.tx, s.tz))
  board.receiveShadow = true
  group.add(board)

  /* the cliff — the board's torn edge and the drop below it */
  {
    const sE = road.at(bf.endM)
    const yawE = Math.atan2(sE.tx, sE.tz)
    // the sheared face below the lip
    const face = new Mesh(
      new BoxGeometry(300, 44, 2.4),
      new MeshStandardMaterial({ color: '#03100a', roughness: 0.95 }),
    )
    road.place(bf.endM - 1.2, 0, pos)
    face.position.set(pos.x, BOARD_Y - 22, pos.z)
    face.rotation.y = yawE
    group.add(face)

    // torn-substrate lip: ragged slabs along the break line
    const LIP_MAT = new MeshStandardMaterial({ color: '#062015', roughness: 0.85 })
    const lipCount = 16
    const lips = new InstancedMesh(new BoxGeometry(1, 1, 1), LIP_MAT, lipCount)
    for (let i = 0; i < lipCount; i++) {
      const lat = -45 + (i / (lipCount - 1)) * 90 + rngRange(rng, -2, 2)
      road.place(bf.endM + rngRange(rng, -0.4, 1.3), lat, pos)
      dummy.position.set(pos.x, BOARD_Y + 0.02, pos.z)
      dummy.rotation.set(0, yawE + rngRange(rng, -0.3, 0.3), 0)
      dummy.scale.set(rngRange(rng, 2, 4.5), 0.16, rngRange(rng, 0.8, 2.2))
      dummy.updateMatrix()
      lips.setMatrixAt(i, dummy.matrix)
    }
    lips.instanceMatrix.needsUpdate = true
    group.add(lips)

    // torn traces glowing at the break, poking over the void
    const STUB_MAT = new MeshStandardMaterial({
      color: '#0a2a1f',
      emissive: '#39ff88',
      emissiveIntensity: 1.9,
      toneMapped: false,
    })
    const stubs = new InstancedMesh(new BoxGeometry(1, 1, 1), STUB_MAT, 8)
    for (let i = 0; i < 8; i++) {
      const lat = rngRange(rng, -40, 40)
      road.place(bf.endM + rngRange(rng, 0.3, 1.6), lat, pos)
      dummy.position.set(pos.x, BOARD_Y + 0.06, pos.z)
      dummy.rotation.set(0, yawE + rngRange(rng, -0.12, 0.12), 0)
      dummy.scale.set(0.5, 0.07, rngRange(rng, 1.2, 2.6))
      dummy.updateMatrix()
      stubs.setMatrixAt(i, dummy.matrix)
    }
    stubs.instanceMatrix.needsUpdate = true
    group.add(stubs)

    // the lip's live edge + a row of warning LEDs
    const edgeGlow = new Mesh(new BoxGeometry(120, 0.07, 0.18), STUB_MAT)
    road.place(bf.endM, 0, pos)
    edgeGlow.position.set(pos.x, BOARD_Y + 0.05, pos.z)
    edgeGlow.rotation.y = yawE
    group.add(edgeGlow)
    const WARN_MAT = new MeshStandardMaterial({
      color: '#ff3b30',
      emissive: '#ff3b30',
      emissiveIntensity: 2.6,
      toneMapped: false,
    })
    const warns = new InstancedMesh(new BoxGeometry(0.4, 0.16, 0.4), WARN_MAT, 6)
    ;[-38, -24, -10, 10, 24, 38].forEach((lat, i) => {
      road.place(bf.endM - 0.8, lat, pos)
      dummy.position.set(pos.x, BOARD_Y + 0.12, pos.z)
      dummy.rotation.set(0, yawE, 0)
      dummy.scale.setScalar(1)
      dummy.updateMatrix()
      warns.setMatrixAt(i, dummy.matrix)
    })
    warns.instanceMatrix.needsUpdate = true
    group.add(warns)

    // silkscreen warning printed across the road before the drop
    const warnPlate = new Mesh(
      new PlaneGeometry(11, 3),
      new MeshStandardMaterial({
        map: makeTextPanel({
          title: '⚠ END OF ROAD',
          sub: 'THE STORY CONTINUES OFF THE MAP',
          bg: '#04150d',
          fg: '#ffd23e',
          border: '#ffd23e88',
          w: 768,
          h: 224,
        }),
        emissive: '#ffffff',
        emissiveMap: makeTextPanel({
          title: '⚠ END OF ROAD',
          sub: 'THE STORY CONTINUES OFF THE MAP',
          bg: '#000000',
          fg: '#7a6420',
          w: 768,
          h: 224,
        }),
        emissiveIntensity: 0.8,
        roughness: 0.9,
      }),
    )
    const sW = road.at(bf.endM - 9)
    road.place(bf.endM - 9, 0, pos)
    warnPlate.position.set(pos.x, BOARD_Y + 0.16, pos.z)
    warnPlate.rotation.set(-Math.PI / 2, 0, Math.atan2(sW.tx, sW.tz))
    group.add(warnPlate)
  }

  /* traces: Manhattan-routed ribbons, merged into ONE geometry */
  const positions: number[] = []
  const dists: number[] = []
  const indices: number[] = []
  let vtx = 0
  const padSpots: { x: number; z: number; yaw: number }[] = []

  const quad = (
    ax: number,
    ay: number,
    az: number,
    bx: number,
    by: number,
    bz: number,
    dist: number,
    width = TRACE_W,
  ) => {
    // ribbon segment from a→b, width across the segment direction
    const dx = bx - ax
    const dz = bz - az
    const len = Math.hypot(dx, dz) || 1
    const px = (-dz / len) * (width / 2)
    const pz = (dx / len) * (width / 2)
    positions.push(
      ax + px,
      ay,
      az + pz,
      ax - px,
      ay,
      az - pz,
      bx + px,
      by,
      bz + pz,
      bx - px,
      by,
      bz - pz,
    )
    dists.push(dist, dist, dist, dist)
    indices.push(vtx, vtx + 2, vtx + 1, vtx + 1, vtx + 2, vtx + 3)
    vtx += 4
  }

  /* thin feeder traces climb the ramp ON the road deck — the road literally
     becomes the board. Short segments so they hug the curved ramp. */
  for (const lane of [-2.4, 0, 2.4]) {
    let prev: { x: number; y: number; z: number } | null = null
    for (let m = 8; m <= bf.startM + 6; m += 11) {
      road.place(m, lane, pos)
      const pt = { x: pos.x, y: pos.y + 0.12, z: pos.z }
      if (prev) {
        quad(prev.x, prev.y, prev.z, pt.x, pt.y, pt.z, (m - bf.startM) / bf.length, 0.3)
      }
      prev = pt
    }
  }

  const traceCount = 26
  for (let t = 0; t < traceCount; t++) {
    const side = t % 2 === 0 ? -1 : 1
    let lateral = rngRange(rng, 6, 44) * side
    let m = bf.startM + rngRange(rng, 0, 40)
    const endTarget = bf.endM - rngRange(rng, 10, 60)
    road.place(m, lateral, pos)
    let px = pos.x
    let pz = pos.z
    while (m < endTarget) {
      const run = Math.min(rngRange(rng, 35, 85), endTarget - m)
      const m2 = m + run
      road.place(m2, lateral, pos)
      // along-board run (aDist keyed to the segment START so the front
      // sweeps segment-by-segment — reads as current hopping the net)
      quad(
        px,
        BOARD_Y + TRACE_LIFT,
        pz,
        pos.x,
        BOARD_Y + TRACE_LIFT,
        pos.z,
        (m - bf.startM) / bf.length,
      )
      px = pos.x
      pz = pos.z
      m = m2
      if (m < endTarget - 20 && rng() < 0.75) {
        const jog = rngRange(rng, 4, 14) * (rng() < 0.5 ? -1 : 1)
        const newLateral = Math.max(-46, Math.min(46, lateral + jog))
        road.place(m, newLateral, pos)
        quad(
          px,
          BOARD_Y + TRACE_LIFT,
          pz,
          pos.x,
          BOARD_Y + TRACE_LIFT,
          pos.z,
          (m - bf.startM) / bf.length,
        )
        px = pos.x
        pz = pos.z
        lateral = newLateral
      }
    }
    const sEnd = road.at(m)
    padSpots.push({ x: px, z: pz, yaw: Math.atan2(sEnd.tx, sEnd.tz) })
  }

  const traceGeo = new BufferGeometry()
  traceGeo.setAttribute('position', new BufferAttribute(new Float32Array(positions), 3))
  traceGeo.setAttribute('aDist', new BufferAttribute(new Float32Array(dists), 1))
  traceGeo.setIndex(indices)
  const traces = new Mesh(traceGeo, traceMaterial)
  traces.frustumCulled = false
  group.add(traces)

  /* gold pads at trace ends + scattered vias (DESIGN: gold pads accent) */
  const GOLD = new MeshStandardMaterial({
    color: '#e8b04b',
    metalness: 0.75,
    roughness: 0.35,
    emissive: '#e8b04b',
    emissiveIntensity: 0.25,
  })
  const pads = new InstancedMesh(new BoxGeometry(1.1, 0.08, 1.1), GOLD, padSpots.length)
  padSpots.forEach((p, i) => {
    dummy.position.set(p.x, BOARD_Y + 0.05, p.z)
    dummy.rotation.set(0, p.yaw, 0)
    dummy.scale.setScalar(1)
    dummy.updateMatrix()
    pads.setMatrixAt(i, dummy.matrix)
  })
  pads.instanceMatrix.needsUpdate = true
  group.add(pads)

  const viaCount = 220
  const vias = new InstancedMesh(new CylinderGeometry(0.14, 0.14, 0.06, 8), GOLD, viaCount)
  for (let i = 0; i < viaCount; i++) {
    const m = rngRange(rng, bf.startM, bf.endM)
    road.place(m, rngRange(rng, -48, 48), pos)
    dummy.position.set(pos.x, BOARD_Y + 0.03, pos.z)
    dummy.rotation.set(0, 0, 0)
    dummy.scale.setScalar(1)
    dummy.updateMatrix()
    vias.setMatrixAt(i, dummy.matrix)
  }
  vias.instanceMatrix.needsUpdate = true
  group.add(vias)

  /* components — chips + capacitors, positioned but ANIMATED by index.tsx */
  const components: BoardComponent[] = []
  for (let i = 0; i < 46; i++) {
    const m = rngRange(rng, bf.startM + 15, bf.endM - 15)
    const lateral = rngRange(rng, 7, 42) * (rng() < 0.5 ? -1 : 1)
    const sC = road.at(m)
    road.place(m, lateral, pos)
    const chip = rng() < 0.68
    const sx = chip ? rngRange(rng, 2.2, 7) : rngRange(rng, 0.9, 1.8)
    const sy = chip ? rngRange(rng, 0.7, 2.6) : rngRange(rng, 1.4, 3)
    components.push({
      x: pos.x,
      z: pos.z,
      y1: BOARD_Y + sy / 2,
      y0: BOARD_Y - sy / 2 - 0.3,
      yaw: Math.atan2(sC.tx, sC.tz) + (rng() < 0.5 ? 0 : Math.PI / 2),
      sx,
      sy,
      sz: chip ? rngRange(rng, 2.2, 7) : sx,
      dist: (m - bf.startM) / bf.length,
      kind: chip ? 'chip' : 'cap',
    })
  }
  cachedComponents = components
  const chipItems = components.filter((c) => c.kind === 'chip')
  const capItems = components.filter((c) => c.kind === 'cap')
  const CHIP_MAT = new MeshStandardMaterial({ color: '#0d211a', roughness: 0.6, metalness: 0.2 })
  const CAP_MAT = new MeshStandardMaterial({ color: '#16302a', roughness: 0.5, metalness: 0.45 })
  cachedChips = new InstancedMesh(new BoxGeometry(1, 1, 1), CHIP_MAT, chipItems.length)
  cachedCaps = new InstancedMesh(new CylinderGeometry(0.5, 0.5, 1, 10), CAP_MAT, capItems.length)
  cachedChips.castShadow = true
  cachedCaps.castShadow = true
  // start fully sunk; the rise animation owns the matrices
  group.add(cachedChips, cachedCaps)

  /* status LEDs — blinked from index.tsx */
  const ledColors = ['#39ff88', '#e8b04b', '#ff4a2e']
  const LED_MATS = ledColors.map(
    (c) =>
      new MeshStandardMaterial({
        color: c,
        emissive: c,
        emissiveIntensity: 2.6,
        toneMapped: false,
      }),
  )
  const ledCount = 24
  cachedLeds = new InstancedMesh(new BoxGeometry(0.3, 0.12, 0.3), LED_MATS[0], ledCount)
  // one material per mesh — vary via instance color instead
  const ledColor = new Color()
  for (let i = 0; i < ledCount; i++) {
    const m = rngRange(rng, bf.startM + 10, bf.endM - 10)
    road.place(m, rngRange(rng, -40, 40), pos)
    dummy.position.set(pos.x, BOARD_Y + 0.08, pos.z)
    dummy.rotation.set(0, 0, 0)
    dummy.scale.setScalar(1)
    dummy.updateMatrix()
    cachedLeds.setMatrixAt(i, dummy.matrix)
    cachedLeds.setColorAt(i, ledColor.set(ledColors[i % ledColors.length]))
  }
  cachedLeds.instanceMatrix.needsUpdate = true
  if (cachedLeds.instanceColor) cachedLeds.instanceColor.needsUpdate = true
  group.add(cachedLeds)

  /* silkscreen nameplate near the finale — the contact section's anchor */
  {
    const m = bf.endM - 55
    const sN = road.at(m)
    road.place(m, -16, pos)
    const plate = new Mesh(
      new PlaneGeometry(26, 7.6),
      new MeshStandardMaterial({
        map: makeTextPanel({
          title: 'AARYAN SINHA',
          sub: 'AI ENGINEER · FULL-STACK ARCHITECT · EST. 2018',
          bg: '#04150d',
          fg: '#d8e6da',
          border: '#39ff8877',
          w: 1024,
          h: 300,
        }),
        roughness: 0.9,
        emissive: '#ffffff',
        emissiveMap: makeTextPanel({
          title: 'AARYAN SINHA',
          sub: 'AI ENGINEER · FULL-STACK ARCHITECT · EST. 2018',
          bg: '#000000',
          fg: '#2a4736',
          w: 1024,
          h: 300,
        }),
        emissiveIntensity: 0.9,
      }),
    )
    road.place(m, -16, pos)
    plate.position.set(pos.x, BOARD_Y + 0.05, pos.z)
    plate.rotation.set(-Math.PI / 2, 0, Math.atan2(sN.tx, sN.tz))
    group.add(plate)
  }

  cachedGroup = group
  return group
}
