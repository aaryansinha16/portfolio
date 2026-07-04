import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Group } from 'three'
import { metersToProgress, pointAt, tangentAt } from '../spline/roadPath'
import { vehicleProgressAt } from '../atmosphere/ColorScript'
import { useJourney } from '../../state/useJourney'
import { clamp, clamp01, damp } from '../../utils/math'
import { createScratch } from '../../utils/scratch'
import { Bicycle } from './Bicycle'

/**
 * Which vehicle is on the road, and how it sits on the spline. The bicycle
 * carries chapters 0–1; the placeholder box holds the later chapters until
 * Phase 3 brings the motorcycle/R15/Safari + swap set-pieces (the hard cut
 * at the town boundary is a known Phase 3 gap).
 *
 * Feel is procedural, no physics (ADR-6): suspension bob, speed lean into
 * curves (strong for the bicycle, faint chassis roll for the car).
 */

const scratch = createScratch()

function PlaceholderCar() {
  return (
    <group>
      {/* body */}
      <mesh position={[0, 0.75, 0]} castShadow>
        <boxGeometry args={[1.75, 0.85, 4.1]} />
        <meshStandardMaterial color="#b8afa4" roughness={0.5} metalness={0.35} />
      </mesh>
      {/* cabin */}
      <mesh position={[0, 1.42, -0.3]} castShadow>
        <boxGeometry args={[1.55, 0.6, 2.0]} />
        <meshStandardMaterial color="#8f877c" roughness={0.4} metalness={0.4} />
      </mesh>
      {/* headlamps — the warm signature light */}
      <mesh position={[-0.55, 0.72, 2.06]}>
        <boxGeometry args={[0.28, 0.14, 0.06]} />
        <meshStandardMaterial
          color="#ffd9a0"
          emissive="#ffd9a0"
          emissiveIntensity={3.2}
          toneMapped={false}
        />
      </mesh>
      <mesh position={[0.55, 0.72, 2.06]}>
        <boxGeometry args={[0.28, 0.14, 0.06]} />
        <meshStandardMaterial
          color="#ffd9a0"
          emissive="#ffd9a0"
          emissiveIntensity={3.2}
          toneMapped={false}
        />
      </mesh>
      {/* taillights — the chase cam always sees the rear */}
      <mesh position={[-0.62, 0.78, -2.07]}>
        <boxGeometry args={[0.34, 0.1, 0.05]} />
        <meshStandardMaterial
          color="#ff4a2e"
          emissive="#ff4a2e"
          emissiveIntensity={2.6}
          toneMapped={false}
        />
      </mesh>
      <mesh position={[0.62, 0.78, -2.07]}>
        <boxGeometry args={[0.34, 0.1, 0.05]} />
        <meshStandardMaterial
          color="#ff4a2e"
          emissive="#ff4a2e"
          emissiveIntensity={2.6}
          toneMapped={false}
        />
      </mesh>
      {/* headlight pool on the road ahead */}
      <pointLight position={[0, 1.1, 3.2]} color="#ffd9a0" intensity={9} distance={26} decay={2} />
    </group>
  )
}

export function VehicleManager() {
  const groupRef = useRef<Group>(null)
  const bodyRef = useRef<Group>(null)
  const lean = useRef(0)
  const chapter = useJourney((s) => s.chapter)
  const isBicycle = chapter <= 1

  useFrame(({ clock }, rawDt) => {
    const group = groupRef.current
    if (!group) return
    const dt = clamp(rawDt, 1e-4, 0.1)
    const { progress, velocity, reducedMotion } = useJourney.getState()
    const { v1: pos, v2: ahead, v3: tangent, v4: tangentAhead } = scratch

    const pVehicle = vehicleProgressAt(progress)
    pointAt(pVehicle, pos)
    pos.y += 0.05
    group.position.copy(pos)
    // Face along the travel direction (+Z of the group looks at `ahead`).
    pointAt(pVehicle + metersToProgress(3), ahead)
    ahead.y += 0.05
    group.lookAt(ahead)

    const body = bodyRef.current
    if (body && !reducedMotion) {
      const t = clock.elapsedTime
      const speedFactor = clamp01(velocity / 80)

      // Lean into the curve — a cyclist banks hard, a chassis barely rolls.
      tangentAt(pVehicle, tangent)
      tangentAt(pVehicle + metersToProgress(8), tangentAhead)
      const turn = tangent.x * tangentAhead.z - tangent.z * tangentAhead.x
      const leanScale = isBicycle ? 5.5 : -0.6 // car body rolls OUT of the turn
      const leanMax = isBicycle ? 0.32 : 0.04
      const target = clamp(turn * leanScale, -leanMax, leanMax) * clamp01(velocity / 30)
      lean.current = damp(lean.current, target, 4, dt)

      body.position.y = 0.02 * Math.sin(t * 9) * speedFactor + 0.008 * Math.sin(t * 1.8)
      body.rotation.z = 0.015 * Math.sin(t * 7.3) * speedFactor + lean.current
    }
  })

  return (
    <group ref={groupRef}>
      <group ref={bodyRef}>{isBicycle ? <Bicycle /> : <PlaceholderCar />}</group>
    </group>
  )
}
