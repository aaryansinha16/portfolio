import { MATS, paint, Tube, Wheel, type VehicleMotion } from './parts'

/**
 * Chapter 2 protagonist: the first motorcycle — an honest Indian commuter
 * (Splendor-class). Maroon tank, long flat seat, round headlamp, chrome
 * exhaust, mirrors. +Z forward, y=0 at ground.
 */

const MAROON = () => paint('#6b1f24', 0.45, 0.42)
const WHEEL_R = 0.3

export function Motorcycle({ motion }: { motion: VehicleMotion }) {
  return (
    <group>
      <Wheel z={-0.62} radius={WHEEL_R} tire={0.05} style="moto" motion={motion} />
      <Wheel z={0.68} radius={WHEEL_R} tire={0.05} style="moto" motion={motion} />

      {/* frame spine + rear subframe */}
      <Tube a={[0, 0.32, -0.62]} b={[0, 0.55, -0.05]} r={0.024} />
      <Tube a={[0, 0.55, -0.05]} b={[0, 0.86, 0.42]} r={0.026} />
      <Tube a={[0, 0.32, -0.62]} b={[0, 0.74, -0.5]} r={0.02} />

      {/* engine block + crankcase */}
      <mesh position={[0, 0.42, 0.02]} material={MATS.darkMetal} castShadow>
        <boxGeometry args={[0.3, 0.3, 0.4]} />
      </mesh>
      <mesh position={[0, 0.3, -0.08]} material={MATS.chrome}>
        <boxGeometry args={[0.34, 0.14, 0.26]} />
      </mesh>

      {/* fuel tank — the maroon signature */}
      <mesh position={[0, 0.8, 0.22]} material={MAROON()} castShadow>
        <boxGeometry args={[0.34, 0.22, 0.52]} />
      </mesh>
      <mesh position={[0, 0.9, 0.22]} material={MAROON()}>
        <boxGeometry args={[0.24, 0.05, 0.4]} />
      </mesh>

      {/* long flat seat + rear cowl */}
      <mesh position={[0, 0.78, -0.35]} material={MATS.seat} castShadow>
        <boxGeometry args={[0.32, 0.09, 0.66]} />
      </mesh>
      <mesh position={[0, 0.72, -0.72]} material={MAROON()}>
        <boxGeometry args={[0.3, 0.12, 0.24]} />
      </mesh>

      {/* rear fender + carrier */}
      <mesh position={[0, 0.62, -0.82]} material={MATS.darkMetal}>
        <boxGeometry args={[0.26, 0.05, 0.28]} />
      </mesh>
      <Tube a={[-0.12, 0.78, -0.7]} b={[-0.12, 0.66, -0.9]} r={0.012} material={MATS.chrome} />
      <Tube a={[0.12, 0.78, -0.7]} b={[0.12, 0.66, -0.9]} r={0.012} material={MATS.chrome} />

      {/* front fork + fender */}
      <Tube a={[-0.07, 0.3, 0.68]} b={[-0.1, 0.92, 0.5]} r={0.02} material={MATS.chrome} />
      <Tube a={[0.07, 0.3, 0.68]} b={[0.1, 0.92, 0.5]} r={0.02} material={MATS.chrome} />
      <mesh position={[0, 0.62, 0.72]} rotation={[0.5, 0, 0]} material={MAROON()}>
        <boxGeometry args={[0.24, 0.04, 0.34]} />
      </mesh>

      {/* handlebar + mirrors */}
      <Tube a={[-0.3, 1.0, 0.44]} b={[0.3, 1.0, 0.44]} r={0.018} />
      <Tube a={[-0.22, 1.0, 0.44]} b={[-0.3, 1.14, 0.4]} r={0.008} material={MATS.chrome} />
      <Tube a={[0.22, 1.0, 0.44]} b={[0.3, 1.14, 0.4]} r={0.008} material={MATS.chrome} />
      <mesh position={[-0.31, 1.16, 0.4]} material={MATS.darkMetal}>
        <boxGeometry args={[0.09, 0.06, 0.02]} />
      </mesh>
      <mesh position={[0.31, 1.16, 0.4]} material={MATS.darkMetal}>
        <boxGeometry args={[0.09, 0.06, 0.02]} />
      </mesh>

      {/* round headlamp — the signature warm light */}
      <mesh position={[0, 0.94, 0.56]} material={MATS.lampGlow}>
        <sphereGeometry args={[0.075, 10, 8]} />
      </mesh>
      <mesh position={[0, 0.94, 0.52]} material={MATS.chrome}>
        <cylinderGeometry args={[0.09, 0.09, 0.08, 10]} />
      </mesh>

      {/* taillight */}
      <mesh position={[0, 0.68, -0.92]} material={MATS.tailGlow}>
        <boxGeometry args={[0.1, 0.07, 0.03]} />
      </mesh>

      {/* exhaust — chrome, right side */}
      <Tube a={[0.1, 0.34, 0.18]} b={[0.14, 0.3, -0.55]} r={0.036} material={MATS.chrome} />
      <mesh position={[0.14, 0.3, -0.62]} rotation={[Math.PI / 2, 0, 0]} material={MATS.darkMetal}>
        <cylinderGeometry args={[0.042, 0.042, 0.14, 8]} />
      </mesh>
    </group>
  )
}
