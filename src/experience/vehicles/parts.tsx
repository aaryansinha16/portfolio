import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import {
  BufferAttribute,
  BufferGeometry,
  Group,
  MeshStandardMaterial,
  Quaternion,
  Vector3,
} from 'three'
import { clamp } from '../../utils/math'

/**
 * Shared vehicle construction kit (ADR-11: everything modeled from
 * primitives). Materials are module singletons — one program set for the
 * whole garage, zero recompiles at vehicle swaps.
 */

/* ---------------- motion ---------------- */

/**
 * Mutable per-vehicle motion state, written by the VehicleManager
 * choreographer each frame and read by wheels/effects. Object identity is
 * stable for the app's lifetime — never re-created.
 */
export interface VehicleMotion {
  /** ground speed in m/s (already includes handoff choreography scaling) */
  speed: number
}

/* ---------------- materials ---------------- */

export const MATS = {
  rubber: new MeshStandardMaterial({ color: '#1d1b18', roughness: 0.9 }),
  darkMetal: new MeshStandardMaterial({ color: '#3a3a3c', metalness: 0.6, roughness: 0.45 }),
  chrome: new MeshStandardMaterial({ color: '#9a9ca0', metalness: 0.85, roughness: 0.25 }),
  glass: new MeshStandardMaterial({ color: '#1a2430', metalness: 0.8, roughness: 0.15 }),
  seat: new MeshStandardMaterial({ color: '#2a2622', roughness: 0.9 }),
  lampGlow: new MeshStandardMaterial({
    color: '#ffd9a0',
    emissive: '#ffd9a0',
    emissiveIntensity: 3.0,
    toneMapped: false,
  }),
  tailGlow: new MeshStandardMaterial({
    color: '#ff4a2e',
    emissive: '#ff4a2e',
    emissiveIntensity: 2.4,
    toneMapped: false,
  }),
} as const

/** Paint materials are per-vehicle but cached here so swaps never recompile. */
const paints = new Map<string, MeshStandardMaterial>()
export function paint(color: string, metalness = 0.5, roughness = 0.38): MeshStandardMaterial {
  const key = `${color}/${metalness}/${roughness}`
  let mat = paints.get(key)
  if (!mat) {
    mat = new MeshStandardMaterial({ color, metalness, roughness })
    paints.set(key, mat)
  }
  return mat
}

/* ---------------- wedge geometry ---------------- */

/**
 * Unit wedge: 1×1×1 footprint, full height at the back (-z), sloping to
 * zero at the front (+z). Scale + rotate for fairings, hoods, tail cowls.
 */
export function createWedgeGeometry(): BufferGeometry {
  // prettier-ignore
  const v = [
    // bottom (y=0)
    -0.5, 0, -0.5,  0.5, 0, 0.5,  0.5, 0, -0.5,
    -0.5, 0, -0.5, -0.5, 0, 0.5,  0.5, 0, 0.5,
    // back (z=-0.5)
    -0.5, 0, -0.5,  0.5, 0, -0.5,  0.5, 1, -0.5,
    -0.5, 0, -0.5,  0.5, 1, -0.5, -0.5, 1, -0.5,
    // slope (back-top edge → front-bottom edge)
    -0.5, 1, -0.5,  0.5, 1, -0.5,  0.5, 0, 0.5,
    -0.5, 1, -0.5,  0.5, 0, 0.5, -0.5, 0, 0.5,
    // left side triangle
    -0.5, 0, -0.5, -0.5, 1, -0.5, -0.5, 0, 0.5,
    // right side triangle
    0.5, 0, -0.5,  0.5, 0, 0.5,  0.5, 1, -0.5,
  ]
  const geo = new BufferGeometry()
  geo.setAttribute('position', new BufferAttribute(new Float32Array(v), 3))
  geo.computeVertexNormals()
  return geo
}

export const WEDGE_GEO = createWedgeGeometry()

/* ---------------- struts ---------------- */

interface TubeProps {
  a: [number, number, number]
  b: [number, number, number]
  r?: number
  material?: MeshStandardMaterial
}

/** A cylinder strut between two points — frames, forks, rails, guards. */
export function Tube({ a, b, r = 0.021, material = MATS.darkMetal }: TubeProps) {
  const { position, quaternion, length } = useMemo(() => {
    const va = new Vector3(...a)
    const vb = new Vector3(...b)
    const dir = vb.clone().sub(va)
    const len = dir.length()
    const q = new Quaternion().setFromUnitVectors(new Vector3(0, 1, 0), dir.normalize())
    return { position: va.add(vb).multiplyScalar(0.5), quaternion: q, length: len }
  }, [a, b])
  return (
    <mesh position={position} quaternion={quaternion} material={material} castShadow>
      <cylinderGeometry args={[r, r, length, 6]} />
    </mesh>
  )
}

/* ---------------- wheels ---------------- */

interface WheelProps {
  z: number
  x?: number
  radius: number
  /** tire thickness (torus tube) for bikes; tire width for cars */
  tire: number
  style: 'spoke' | 'moto' | 'car'
  motion: VehicleMotion
}

/** A spinning wheel; speed comes from the vehicle's motion object. */
export function Wheel({ z, x = 0, radius, tire, style, motion }: WheelProps) {
  const spinRef = useRef<Group>(null)

  useFrame((_, dt) => {
    const wheel = spinRef.current
    if (!wheel) return
    // Cap the visual spin rate — beyond ~45 rad/s it's aliasing soup.
    wheel.rotation.x -= clamp(motion.speed / radius, 0, 45) * dt
  })

  return (
    <group position={[x, radius, z]}>
      <group ref={spinRef}>
        {style === 'car' ? (
          <>
            <mesh rotation={[0, 0, Math.PI / 2]} material={MATS.rubber} castShadow>
              <cylinderGeometry args={[radius, radius, tire, 16]} />
            </mesh>
            <mesh rotation={[0, 0, Math.PI / 2]} material={MATS.chrome}>
              <cylinderGeometry args={[radius * 0.55, radius * 0.55, tire + 0.02, 8]} />
            </mesh>
          </>
        ) : (
          <>
            <mesh rotation={[0, Math.PI / 2, 0]} material={MATS.rubber} castShadow>
              <torusGeometry args={[radius - tire * 0.6, tire, 7, 20]} />
            </mesh>
            {style === 'moto' ? (
              <mesh rotation={[0, 0, Math.PI / 2]} material={MATS.darkMetal}>
                <cylinderGeometry args={[radius * 0.62, radius * 0.62, 0.05, 10]} />
              </mesh>
            ) : (
              <>
                {[0, Math.PI / 3, (2 * Math.PI) / 3].map((rot) => (
                  <mesh key={rot} rotation={[rot, 0, 0]} material={MATS.chrome}>
                    <boxGeometry args={[0.012, (radius - tire) * 2, 0.02]} />
                  </mesh>
                ))}
              </>
            )}
            <mesh rotation={[0, 0, Math.PI / 2]} material={MATS.darkMetal}>
              <cylinderGeometry args={[0.035, 0.035, 0.09, 8]} />
            </mesh>
          </>
        )}
      </group>
    </group>
  )
}
