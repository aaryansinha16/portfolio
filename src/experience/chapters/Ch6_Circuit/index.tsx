import { GreyboxBiome } from '../GreyboxBiome'
import { circuitConfig, BOARD_Y } from './config'

/**
 * Biome root — greybox until its Phase 4 art pass.
 * The circuit board itself: a giant plane under the elevated final road run,
 * floating in the void (no ground plane out here).
 */
export default function Ch6_Circuit() {
  return (
    <group>
      <mesh position={[0, BOARD_Y - 0.02, -3060]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[520, 720]} />
        <meshStandardMaterial
          color="#04150d"
          emissive="#0f3d2e"
          emissiveIntensity={0.22}
          roughness={0.85}
          metalness={0.1}
        />
      </mesh>
      <GreyboxBiome zone={6} config={circuitConfig} />
    </group>
  )
}
