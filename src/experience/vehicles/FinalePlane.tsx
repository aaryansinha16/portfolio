import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Group, Mesh } from 'three'
import {
  CLIFF_MAX_OVER,
  CLIFF_START_M,
  FLIGHT_EXTRA_M,
  FLIGHT_SWAP_OVER,
  pointPastEnd,
  totalLength,
} from '../spline/roadPath'
import { vehicleProgressAt } from '../atmosphere/ColorScript'
import { flightOf } from '../detours/DetourManager'
import { useJourney } from '../../state/useJourney'
import { clamp01 } from '../../utils/math'
import { createScratch } from '../../utils/scratch'

/**
 * The redemption beat (owner: the drop read as a crash). As the Safari
 * dips below the cliff lip it hands over to the little red prop plane,
 * which pulls out of the dive and CLIMBS off the map — the journey ends
 * flying, not falling. Pure function of scroll: rewinding lands the plane
 * back into the dive and re-materializes the car.
 */

const scratch = createScratch()

export function FinalePlane() {
  const groupRef = useRef<Group>(null)
  const propRef = useRef<Mesh>(null)

  useFrame(({ clock }) => {
    const group = groupRef.current
    if (!group) return
    const state = useJourney.getState()
    // scroll-driven overshoot (≤ CLIFF_MAX_OVER) + the epilogue's extra run
    const m =
      Math.min(
        vehicleProgressAt(state.splineProgress) * totalLength,
        CLIFF_START_M + CLIFF_MAX_OVER,
      ) +
      flightOf(state.progress) * FLIGHT_EXTRA_M
    const over = m - CLIFF_START_M
    const born = clamp01((over - (FLIGHT_SWAP_OVER - 1.4)) / 1.4)
    group.visible = born > 0.01
    if (!group.visible) return

    const { v1: pos, v2: ahead } = scratch
    pointPastEnd(m, pos)
    pos.y += 0.6 // wings ride a touch above where the roof was
    group.position.copy(pos)
    pointPastEnd(m + 3, ahead)
    ahead.y += 0.6
    group.lookAt(ahead)
    // a gentle victory bank as it climbs out
    group.rotateZ(0.16 * clamp01((over - FLIGHT_SWAP_OVER) / 9))
    group.scale.setScalar(0.62 * born)

    if (propRef.current) propRef.current.rotation.z = clock.elapsedTime * 40
  })

  return (
    <group ref={groupRef} visible={false}>
      {/* fuselage + nose (the ch3 banner plane's little sibling) */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.5, 0.34, 4.6, 8]} />
        <meshStandardMaterial color="#c1442e" roughness={0.5} metalness={0.2} />
      </mesh>
      <mesh position={[0, 0, 2.6]} rotation={[Math.PI / 2, 0, 0]}>
        <coneGeometry args={[0.34, 0.8, 8]} />
        <meshStandardMaterial color="#8a8f94" metalness={0.6} roughness={0.35} />
      </mesh>
      {/* spinning prop disc */}
      <mesh ref={propRef} position={[0, 0, 3.05]}>
        <boxGeometry args={[3.0, 0.16, 0.06]} />
        <meshStandardMaterial color="#1d1a16" roughness={0.6} />
      </mesh>
      {/* wings + tail */}
      <mesh position={[0, 0.15, 0.6]}>
        <boxGeometry args={[8.2, 0.14, 1.5]} />
        <meshStandardMaterial color="#ece5d0" roughness={0.6} />
      </mesh>
      <mesh position={[0, 0.7, -2.1]}>
        <boxGeometry args={[0.12, 1.3, 1.0]} />
        <meshStandardMaterial color="#ece5d0" roughness={0.6} />
      </mesh>
      <mesh position={[0, 0.2, -2.1]}>
        <boxGeometry args={[3.0, 0.12, 0.9]} />
        <meshStandardMaterial color="#ece5d0" roughness={0.6} />
      </mesh>
      {/* nav lights — it flies off INTO the night */}
      <mesh position={[-4.15, 0.15, 0.6]}>
        <boxGeometry args={[0.16, 0.1, 0.16]} />
        <meshStandardMaterial
          color="#ff3b30"
          emissive="#ff3b30"
          emissiveIntensity={2.4}
          toneMapped={false}
        />
      </mesh>
      <mesh position={[4.15, 0.15, 0.6]}>
        <boxGeometry args={[0.16, 0.1, 0.16]} />
        <meshStandardMaterial
          color="#39ff88"
          emissive="#39ff88"
          emissiveIntensity={2.4}
          toneMapped={false}
        />
      </mesh>
    </group>
  )
}
