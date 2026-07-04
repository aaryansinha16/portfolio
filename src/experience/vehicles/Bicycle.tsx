import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Group, Quaternion, Vector3 } from 'three'
import { useJourney } from '../../state/useJourney'
import { clamp } from '../../utils/math'

/**
 * Chapter 0–1 protagonist: a modeled low-poly bicycle (plan.md allows
 * "source glTF or model simple one" — modeling keeps the zero-download,
 * everything-procedural budget; see ADR-11). Realistic scale: 0.34m wheels,
 * ~1.05m wheelbase. Group convention: +Z is forward, y=0 at ground contact.
 *
 * Wheels spin with scroll velocity; the frame carries the warm headlamp
 * (#ffd9a0) — the signature light every vehicle in the journey shares.
 */

const WHEEL_R = 0.34
const FRAME_COLOR = '#2f4a3e' // dusty bottle-green, catches dawn rim light
const METAL = { metalness: 0.55, roughness: 0.42 }

/** A cylinder strut between two points — the whole frame is built from these. */
function Tube({
  a,
  b,
  r = 0.021,
}: {
  a: [number, number, number]
  b: [number, number, number]
  r?: number
}) {
  const { position, quaternion, length } = useMemo(() => {
    const va = new Vector3(...a)
    const vb = new Vector3(...b)
    const dir = vb.clone().sub(va)
    const len = dir.length()
    const q = new Quaternion().setFromUnitVectors(new Vector3(0, 1, 0), dir.normalize())
    return { position: va.add(vb).multiplyScalar(0.5), quaternion: q, length: len }
  }, [a, b, r])
  return (
    <mesh position={position} quaternion={quaternion} castShadow>
      <cylinderGeometry args={[r, r, length, 6]} />
      <meshStandardMaterial color={FRAME_COLOR} {...METAL} />
    </mesh>
  )
}

function Wheel({ z }: { z: number }) {
  const spinRef = useRef<Group>(null)

  useFrame((_, dt) => {
    const wheel = spinRef.current
    if (!wheel) return
    const { velocity } = useJourney.getState()
    // Cap the visual spin rate — beyond ~40 rad/s it's just aliasing soup.
    wheel.rotation.x -= clamp(velocity / WHEEL_R, 0, 40) * dt
  })

  return (
    <group position={[0, WHEEL_R, z]}>
      <group ref={spinRef}>
        {/* tire */}
        <mesh rotation={[0, Math.PI / 2, 0]} castShadow>
          <torusGeometry args={[WHEEL_R - 0.02, 0.021, 6, 20]} />
          <meshStandardMaterial color="#1d1b18" roughness={0.9} />
        </mesh>
        {/* spokes read as a spinning disc */}
        {[0, Math.PI / 3, (2 * Math.PI) / 3].map((rot) => (
          <mesh key={rot} rotation={[rot, 0, 0]}>
            <boxGeometry args={[0.012, 0.6, 0.02]} />
            <meshStandardMaterial color="#8f9490" metalness={0.7} roughness={0.35} />
          </mesh>
        ))}
        {/* hub */}
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.035, 0.035, 0.08, 8]} />
          <meshStandardMaterial color="#6f746f" metalness={0.7} roughness={0.4} />
        </mesh>
      </group>
    </group>
  )
}

export function Bicycle() {
  // Key joints (x=0 plane): rear axle, bottom bracket, seat, head tube, front axle.
  const rearAxle: [number, number, number] = [0, WHEEL_R, -0.52]
  const bb: [number, number, number] = [0, 0.29, -0.09]
  const seatTop: [number, number, number] = [0, 0.92, -0.38]
  const headTop: [number, number, number] = [0, 0.98, 0.33]
  const headLow: [number, number, number] = [0, 0.55, 0.42]
  const frontAxle: [number, number, number] = [0, WHEEL_R, 0.53]

  return (
    <group>
      <Wheel z={rearAxle[2]} />
      <Wheel z={frontAxle[2]} />
      {/* diamond frame */}
      <Tube a={rearAxle} b={bb} />
      <Tube a={rearAxle} b={seatTop} />
      <Tube a={bb} b={seatTop} r={0.024} />
      <Tube a={seatTop} b={headTop} r={0.024} />
      <Tube a={bb} b={headLow} r={0.024} />
      <Tube a={headLow} b={headTop} r={0.026} />
      {/* fork */}
      <Tube a={headLow} b={frontAxle} r={0.018} />
      {/* handlebar */}
      <Tube a={[-0.22, 1.02, 0.3]} b={[0.22, 1.02, 0.3]} r={0.018} />
      {/* saddle */}
      <mesh position={[0, 0.96, -0.38]} castShadow>
        <boxGeometry args={[0.14, 0.05, 0.26]} />
        <meshStandardMaterial color="#3a2e24" roughness={0.85} />
      </mesh>
      {/* crank + pedals */}
      <mesh position={[0, 0.29, -0.09]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.028, 0.028, 0.12, 8]} />
        <meshStandardMaterial color="#55524c" metalness={0.6} roughness={0.4} />
      </mesh>
      {/* carrier rack — every village bicycle has one */}
      <mesh position={[0, 0.72, -0.62]} castShadow>
        <boxGeometry args={[0.13, 0.02, 0.3]} />
        <meshStandardMaterial color={FRAME_COLOR} {...METAL} />
      </mesh>
      <Tube a={[0, 0.71, -0.75]} b={rearAxle} r={0.012} />
      {/* headlamp — the signature warm light */}
      <mesh position={[0, 0.95, 0.42]}>
        <sphereGeometry args={[0.045, 8, 6]} />
        <meshStandardMaterial
          color="#ffd9a0"
          emissive="#ffd9a0"
          emissiveIntensity={2.8}
          toneMapped={false}
        />
      </mesh>
      {/* rear reflector */}
      <mesh position={[0, 0.7, -0.79]}>
        <boxGeometry args={[0.05, 0.05, 0.02]} />
        <meshStandardMaterial
          color="#ff4a2e"
          emissive="#ff4a2e"
          emissiveIntensity={1.6}
          toneMapped={false}
        />
      </mesh>
      {/* modest lamp pool on the road */}
      <pointLight position={[0, 0.9, 1.6]} color="#ffd9a0" intensity={3} distance={14} decay={2} />
    </group>
  )
}
