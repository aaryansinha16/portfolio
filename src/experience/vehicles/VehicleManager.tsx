import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Group } from 'three'
import { metersToProgress, pointAt, vehicleProgressAt } from '../spline/roadPath'
import { useJourney } from '../../state/useJourney'
import { clamp01 } from '../../utils/math'
import { createScratch } from '../../utils/scratch'

/**
 * Phase 1: one placeholder box "vehicle" driving the spline. Phase 3 swaps
 * this for the bicycle/motorcycle/R15/Safari glTFs + set-piece transitions —
 * the positioning/orientation contract here stays.
 *
 * The warm headlamp glow (#ffd9a0) is the one constant thread across all
 * vehicles (DESIGN.md) — the eye always finds the protagonist.
 */

const scratch = createScratch()

export function VehicleManager() {
  const groupRef = useRef<Group>(null)
  const bodyRef = useRef<Group>(null)

  useFrame(({ clock }) => {
    const group = groupRef.current
    if (!group) return
    const { progress, velocity, reducedMotion } = useJourney.getState()
    const { v1: pos, v2: ahead } = scratch

    const pVehicle = vehicleProgressAt(progress)
    pointAt(pVehicle, pos)
    pos.y += 0.05
    group.position.copy(pos)
    // Face along the travel direction (+Z of the group looks at `ahead`).
    pointAt(pVehicle + metersToProgress(3), ahead)
    ahead.y += 0.05
    group.lookAt(ahead)

    // Suspension bob + idle breathing — procedural feel, no physics (ADR-6).
    const body = bodyRef.current
    if (body && !reducedMotion) {
      const t = clock.elapsedTime
      const speedFactor = clamp01(velocity / 80)
      body.position.y = 0.02 * Math.sin(t * 9) * speedFactor + 0.008 * Math.sin(t * 1.8)
      body.rotation.z = 0.015 * Math.sin(t * 7.3) * speedFactor
    }
  })

  return (
    <group ref={groupRef}>
      <group ref={bodyRef}>
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
        {/* taillights — the chase cam always sees the rear; without these the
            protagonist reads as a black box at dusk/night */}
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
        <pointLight
          position={[0, 1.1, 3.2]}
          color="#ffd9a0"
          intensity={9}
          distance={26}
          decay={2}
        />
      </group>
    </group>
  )
}
