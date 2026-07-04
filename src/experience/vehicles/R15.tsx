import { MATS, paint, Tube, Wheel, WEDGE_GEO, type VehicleMotion } from './parts'

/**
 * Chapter 3 protagonist: the R15 — racing-blue sport bike (#1e6fb8 straight
 * from the DESIGN palette). What must read at chase distance: the blue
 * fairing wedge nose-down, tail cowl kicked up, dark belly, twin headlight
 * slits, rider-less clip-on stance. +Z forward, y=0 at ground.
 */

const BLUE = () => paint('#1e6fb8', 0.55, 0.3)
const BLUE_DARK = () => paint('#154d80', 0.55, 0.35)
const WHEEL_R = 0.3

export function R15({ motion }: { motion: VehicleMotion }) {
  return (
    <group>
      <Wheel z={-0.66} radius={WHEEL_R} tire={0.06} style="moto" motion={motion} />
      <Wheel z={0.69} radius={WHEEL_R} tire={0.052} style="moto" motion={motion} />

      {/* engine + frame mass, blacked out */}
      <mesh position={[0, 0.44, 0.0]} material={MATS.darkMetal} castShadow>
        <boxGeometry args={[0.3, 0.32, 0.56]} />
      </mesh>

      {/* belly pan — wedge under the engine */}
      <mesh
        geometry={WEDGE_GEO}
        position={[0, 0.2, 0.32]}
        rotation={[0, Math.PI, 0]}
        scale={[0.3, 0.18, 0.5]}
        material={BLUE_DARK()}
      />

      {/* main side fairing — big blue wedge sloping to the nose */}
      <mesh
        geometry={WEDGE_GEO}
        position={[0, 0.52, 0.42]}
        scale={[0.36, 0.42, 0.62]}
        material={BLUE()}
        castShadow
      />
      {/* tank block above it */}
      <mesh position={[0, 0.86, 0.1]} material={BLUE()} castShadow>
        <boxGeometry args={[0.34, 0.2, 0.5]} />
      </mesh>
      <mesh position={[0, 0.94, 0.08]} material={MATS.seat}>
        <boxGeometry args={[0.22, 0.05, 0.34]} />
      </mesh>

      {/* nose cowl + twin headlight slits */}
      <mesh
        geometry={WEDGE_GEO}
        position={[0, 0.68, 0.62]}
        scale={[0.3, 0.3, 0.34]}
        material={BLUE()}
      />
      <mesh position={[-0.08, 0.78, 0.74]} rotation={[0.35, 0, -0.18]} material={MATS.lampGlow}>
        <boxGeometry args={[0.07, 0.028, 0.02]} />
      </mesh>
      <mesh position={[0.08, 0.78, 0.74]} rotation={[0.35, 0, 0.18]} material={MATS.lampGlow}>
        <boxGeometry args={[0.07, 0.028, 0.02]} />
      </mesh>

      {/* low smoked windscreen */}
      <mesh position={[0, 0.94, 0.52]} rotation={[-0.62, 0, 0]} material={MATS.glass}>
        <boxGeometry args={[0.24, 0.2, 0.02]} />
      </mesh>

      {/* rider seat, then the kicked-up tail cowl */}
      <mesh position={[0, 0.82, -0.28]} material={MATS.seat}>
        <boxGeometry args={[0.28, 0.07, 0.4]} />
      </mesh>
      <mesh
        geometry={WEDGE_GEO}
        position={[0, 0.84, -0.62]}
        rotation={[0, Math.PI, 0]}
        scale={[0.26, 0.22, 0.5]}
        material={BLUE()}
        castShadow
      />
      <mesh position={[0, 0.86, -0.84]} material={MATS.tailGlow}>
        <boxGeometry args={[0.12, 0.035, 0.03]} />
      </mesh>

      {/* clip-on bars, low and wide */}
      <Tube a={[-0.28, 0.92, 0.5]} b={[-0.1, 0.96, 0.46]} r={0.014} />
      <Tube a={[0.28, 0.92, 0.5]} b={[0.1, 0.96, 0.46]} r={0.014} />

      {/* front forks — steep sport rake */}
      <Tube a={[-0.07, 0.3, 0.69]} b={[-0.09, 0.84, 0.56]} r={0.022} material={MATS.chrome} />
      <Tube a={[0.07, 0.3, 0.69]} b={[0.09, 0.84, 0.56]} r={0.022} material={MATS.chrome} />

      {/* swingarm + underslung exhaust can */}
      <Tube a={[0.06, 0.3, -0.1]} b={[0.08, 0.3, -0.62]} r={0.024} />
      <mesh
        position={[0.13, 0.34, -0.42]}
        rotation={[Math.PI / 2.15, 0, 0]}
        material={MATS.darkMetal}
      >
        <cylinderGeometry args={[0.055, 0.045, 0.34, 8]} />
      </mesh>
    </group>
  )
}
