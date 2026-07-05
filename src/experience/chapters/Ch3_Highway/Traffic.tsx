import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import {
  BoxGeometry,
  BufferAttribute,
  BufferGeometry,
  Color,
  CylinderGeometry,
  DynamicDrawUsage,
  InstancedMesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  Object3D,
} from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { getZoneRoad, type ZoneSample } from '../../world/roadSamples'
import { createRng, rngRange } from '../../../utils/random'

/**
 * Oncoming traffic in the opposite lane. Each vehicle CLASS (sedan, hatch,
 * lorry, bus) is one merged vertex-colored geometry — real silhouettes with
 * hoods, cabins, glass, bumpers and wheels at one draw call per class, plus
 * one shared basic-material pass for head/tail lights. Motion uses the
 * INTERPOLATED road sampler; the nearest-sample lookup snapped positions to
 * the 4m grid and read as frame-skipping.
 */

const ZONE = 3
const LANE = -2.3 // oncoming lane (left-hand traffic)

const c = new Color()

/** clone a primitive, scale/rotate/translate it, stamp a vertex color */
function part(
  geo: BufferGeometry,
  color: string,
  x: number,
  y: number,
  z: number,
  sx = 1,
  sy = 1,
  sz = 1,
  rx = 0,
): BufferGeometry {
  const g = geo.clone()
  g.scale(sx, sy, sz)
  if (rx) g.rotateX(rx)
  g.translate(x, y, z)
  const n = g.attributes.position.count
  const colors = new Float32Array(n * 3)
  c.set(color)
  for (let i = 0; i < n; i++) {
    colors[i * 3] = c.r
    colors[i * 3 + 1] = c.g
    colors[i * 3 + 2] = c.b
  }
  g.setAttribute('color', new BufferAttribute(colors, 3))
  return g
}

const BOX = new BoxGeometry(1, 1, 1)
const WHEEL = new CylinderGeometry(1, 1, 1, 10).rotateZ(Math.PI / 2)

// tintable panels are painted WHITE — the per-instance color multiplies in.
const TINT = '#ffffff'
const GLASS = '#0d141f'
const DARK = '#1d2025'
const TYRE = '#101010'
const HEAD = '#ffdba6'
const TAIL = '#ff2617'

function wheels(list: BufferGeometry[], r: number, halfW: number, zs: number[]) {
  for (const z of zs) {
    for (const x of [-halfW, halfW]) {
      list.push(part(WHEEL, TYRE, x, r, z, r, 0.26, r))
    }
  }
}

/* every class is built in local space with +Z = its direction of travel */

function sedanBody(): BufferGeometry {
  const p: BufferGeometry[] = [
    part(BOX, TINT, 0, 0.62, 0, 1.68, 0.5, 4.25),
    part(BOX, TINT, 0, 0.94, 1.4, 1.6, 0.16, 1.15),
    part(BOX, TINT, 0, 1.28, -0.3, 1.52, 0.52, 2.0),
    part(BOX, GLASS, 0, 1.26, 0.78, 1.44, 0.52, 0.07, -0.45),
    part(BOX, GLASS, 0, 1.26, -1.36, 1.44, 0.46, 0.07, 0.5),
    part(BOX, GLASS, 0, 1.32, -0.3, 1.56, 0.3, 1.5),
    part(BOX, DARK, 0, 0.45, 2.2, 1.72, 0.2, 0.24),
    part(BOX, DARK, 0, 0.45, -2.2, 1.72, 0.2, 0.24),
    part(BOX, DARK, 0, 0.78, 2.15, 1.1, 0.16, 0.06),
  ]
  wheels(p, 0.35, 0.78, [1.35, -1.35])
  return mergeGeometries(p)!
}

function sedanLights(): BufferGeometry {
  return mergeGeometries([
    part(BOX, HEAD, -0.55, 0.8, 2.16, 0.3, 0.13, 0.07),
    part(BOX, HEAD, 0.55, 0.8, 2.16, 0.3, 0.13, 0.07),
    part(BOX, TAIL, -0.6, 0.82, -2.21, 0.28, 0.12, 0.07),
    part(BOX, TAIL, 0.6, 0.82, -2.21, 0.28, 0.12, 0.07),
  ])!
}

function hatchBody(): BufferGeometry {
  const p: BufferGeometry[] = [
    part(BOX, TINT, 0, 0.6, 0, 1.62, 0.5, 3.55),
    part(BOX, TINT, 0, 1.24, -0.45, 1.5, 0.56, 1.9),
    part(BOX, TINT, 0, 0.92, 0.95, 1.54, 0.14, 0.95),
    part(BOX, GLASS, 0, 1.22, 0.52, 1.42, 0.5, 0.07, -0.5),
    part(BOX, GLASS, 0, 1.3, -1.42, 1.42, 0.5, 0.07, 0.3),
    part(BOX, GLASS, 0, 1.28, -0.45, 1.54, 0.3, 1.45),
    part(BOX, DARK, 0, 0.44, 1.85, 1.66, 0.2, 0.22),
    part(BOX, DARK, 0, 0.44, -1.85, 1.66, 0.2, 0.22),
  ]
  wheels(p, 0.33, 0.75, [1.1, -1.1])
  return mergeGeometries(p)!
}

function hatchLights(): BufferGeometry {
  return mergeGeometries([
    part(BOX, HEAD, -0.52, 0.76, 1.82, 0.28, 0.13, 0.07),
    part(BOX, HEAD, 0.52, 0.76, 1.82, 0.28, 0.13, 0.07),
    part(BOX, TAIL, -0.56, 0.98, -1.86, 0.24, 0.2, 0.07),
    part(BOX, TAIL, 0.56, 0.98, -1.86, 0.24, 0.2, 0.07),
  ])!
}

function truckBody(): BufferGeometry {
  const p: BufferGeometry[] = [
    part(BOX, DARK, 0, 0.6, 0, 1.9, 0.4, 6.4),
    part(BOX, TINT, 0, 1.5, 2.5, 2.05, 1.35, 1.7),
    part(BOX, GLASS, 0, 1.78, 3.32, 1.85, 0.55, 0.07, -0.18),
    // the cargo box — near-white so the instance tint paints it
    part(BOX, '#e9e4d6', 0, 1.75, -0.85, 2.25, 2.0, 4.3),
    part(BOX, DARK, 0, 0.5, 3.42, 2.1, 0.3, 0.24),
    part(BOX, DARK, 0, 0.72, -3.05, 2.1, 0.24, 0.2),
  ]
  wheels(p, 0.45, 0.88, [2.55, -0.3, -1.9])
  return mergeGeometries(p)!
}

function truckLights(): BufferGeometry {
  return mergeGeometries([
    part(BOX, HEAD, -0.72, 0.88, 3.44, 0.32, 0.16, 0.07),
    part(BOX, HEAD, 0.72, 0.88, 3.44, 0.32, 0.16, 0.07),
    part(BOX, TAIL, -0.85, 0.95, -3.06, 0.26, 0.14, 0.07),
    part(BOX, TAIL, 0.85, 0.95, -3.06, 0.26, 0.14, 0.07),
  ])!
}

function busBody(): BufferGeometry {
  const p: BufferGeometry[] = [
    part(BOX, TINT, 0, 1.5, 0, 2.3, 1.95, 7.5),
    part(BOX, GLASS, 0, 2.02, 0.1, 2.34, 0.55, 6.2),
    part(BOX, GLASS, 0, 1.95, 3.72, 2.1, 0.8, 0.07, -0.08),
    part(BOX, '#dcd6c8', 0, 2.53, 0, 2.1, 0.14, 7.0),
    part(BOX, DARK, 0, 0.5, 3.8, 2.2, 0.3, 0.22),
    part(BOX, DARK, 0, 0.5, -3.8, 2.2, 0.3, 0.22),
  ]
  wheels(p, 0.45, 0.92, [2.6, -2.4])
  return mergeGeometries(p)!
}

function busLights(): BufferGeometry {
  return mergeGeometries([
    part(BOX, HEAD, -0.75, 0.9, 3.86, 0.34, 0.18, 0.07),
    part(BOX, HEAD, 0.75, 0.9, 3.86, 0.34, 0.18, 0.07),
    part(BOX, TAIL, -0.9, 1.1, -3.86, 0.26, 0.2, 0.07),
    part(BOX, TAIL, 0.9, 1.1, -3.86, 0.26, 0.2, 0.07),
  ])!
}

interface TrafficClass {
  body: BufferGeometry
  lights: BufferGeometry
  count: number
}

let classCache: TrafficClass[] | null = null
function getClasses(): TrafficClass[] {
  if (classCache) return classCache
  classCache = [
    { body: sedanBody(), lights: sedanLights(), count: 4 },
    { body: hatchBody(), lights: hatchLights(), count: 3 },
    { body: truckBody(), lights: truckLights(), count: 2 },
    { body: busBody(), lights: busLights(), count: 1 },
  ]
  return classCache
}

const BODY_MAT = new MeshStandardMaterial({ vertexColors: true, roughness: 0.55, metalness: 0.2 })
const LIGHT_MAT = new MeshBasicMaterial({ vertexColors: true, toneMapped: false })

interface Unit {
  cls: number
  idx: number // instance index within its class meshes
  speed: number
  phase: number
  color: Color
}

const dummy = new Object3D()
const sampleScratch: ZoneSample = { x: 0, y: 0, z: 0, tx: 0, tz: 1, rx: 1, rz: 0, meters: 0 }

export function Traffic() {
  const classes = useMemo(getClasses, [])
  const bodyRefs = useRef<(InstancedMesh | null)[]>([])
  const lightRefs = useRef<(InstancedMesh | null)[]>([])

  const units = useMemo<Unit[]>(() => {
    const rng = createRng(4370)
    const palette = ['#c9c2b2', '#a34e3a', '#5b7a8c', '#b8973e', '#7d8a70', '#b0562f', '#8a6e9c']
    const list: Unit[] = []
    const perClass = classes.map(() => 0)
    classes.forEach((cl, ci) => {
      for (let k = 0; k < cl.count; k++) {
        list.push({
          cls: ci,
          idx: perClass[ci]++,
          speed: rngRange(rng, 13, 21),
          phase: rngRange(rng, 0, 1),
          color: new Color(palette[list.length % palette.length]).multiplyScalar(
            0.85 + rng() * 0.3,
          ),
        })
      }
    })
    // spread them evenly along the loop, phases jittered
    list.forEach((u, i) => {
      u.phase = (i / list.length + u.phase * 0.06) % 1
    })
    return list
  }, [classes])

  useFrame(({ clock }) => {
    const road = getZoneRoad(ZONE)
    const t = clock.elapsedTime
    for (const u of units) {
      const mesh = bodyRefs.current[u.cls]
      const lights = lightRefs.current[u.cls]
      if (!mesh || !lights) continue
      // oncoming: marches from zone end toward zone start, smooth-sampled
      const cycle = ((t * u.speed) / road.zoneMeters + u.phase) % 1
      const m = road.zoneMeters * (1 - cycle)
      const s = road.sample(m, sampleScratch)
      dummy.position.set(s.x + s.rx * LANE, s.y + 0.09, s.z + s.rz * LANE)
      dummy.rotation.set(0, Math.atan2(-s.tx, -s.tz), 0)
      dummy.scale.setScalar(1)
      dummy.updateMatrix()
      mesh.setMatrixAt(u.idx, dummy.matrix)
      lights.setMatrixAt(u.idx, dummy.matrix)
    }
    for (let i = 0; i < classes.length; i++) {
      const b = bodyRefs.current[i]
      const l = lightRefs.current[i]
      if (b) b.instanceMatrix.needsUpdate = true
      if (l) l.instanceMatrix.needsUpdate = true
    }
  })

  return (
    <group>
      {classes.map((cl, ci) => (
        <group key={ci}>
          <instancedMesh
            ref={(mesh) => {
              bodyRefs.current[ci] = mesh
              if (mesh) {
                mesh.instanceMatrix.setUsage(DynamicDrawUsage)
                for (const u of units) if (u.cls === ci) mesh.setColorAt(u.idx, u.color)
                if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true
              }
            }}
            args={[cl.body, BODY_MAT, cl.count]}
            castShadow
            frustumCulled={false}
          />
          <instancedMesh
            ref={(mesh) => {
              lightRefs.current[ci] = mesh
              if (mesh) mesh.instanceMatrix.setUsage(DynamicDrawUsage)
            }}
            args={[cl.lights, LIGHT_MAT, cl.count]}
            frustumCulled={false}
          />
        </group>
      ))}
    </group>
  )
}
