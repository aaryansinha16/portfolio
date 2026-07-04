import { MATS, paint, Tube, Wheel, WEDGE_GEO, type VehicleMotion } from './parts'

/**
 * Chapters 4–6 protagonist: the Tata Safari — the heavy machine. What must
 * read at chase distance: tall boxy stance, the signature stepped rear roof,
 * big dark glasshouse, flared arches, roof rails, vertical taillights.
 * Pearl-white paint so dusk windows and neon paint it. +Z forward, y=0 ground.
 */

const PEARL = () => paint('#dcd9d0', 0.4, 0.42)
const TRIM = () => paint('#2c2c2e', 0.3, 0.7)
const WHEEL_R = 0.38

export function Safari({ motion }: { motion: VehicleMotion }) {
  return (
    <group>
      <Wheel z={1.32} x={-0.78} radius={WHEEL_R} tire={0.28} style="car" motion={motion} />
      <Wheel z={1.32} x={0.78} radius={WHEEL_R} tire={0.28} style="car" motion={motion} />
      <Wheel z={-1.32} x={-0.78} radius={WHEEL_R} tire={0.28} style="car" motion={motion} />
      <Wheel z={-1.32} x={0.78} radius={WHEEL_R} tire={0.28} style="car" motion={motion} />

      {/* lower body — tall slab to the belt line */}
      <mesh position={[0, 0.88, -0.1]} material={PEARL()} castShadow>
        <boxGeometry args={[1.84, 0.72, 4.3]} />
      </mesh>

      {/* hood, slightly lower than the belt line */}
      <mesh position={[0, 1.14, 1.62]} material={PEARL()} castShadow>
        <boxGeometry args={[1.7, 0.2, 1.06]} />
      </mesh>
      {/* windshield rake */}
      <mesh
        geometry={WEDGE_GEO}
        position={[0, 1.24, 0.92]}
        scale={[1.66, 0.5, 0.5]}
        material={MATS.glass}
      />

      {/* glasshouse — front cabin */}
      <mesh position={[0, 1.5, -0.06]} material={MATS.glass} castShadow>
        <boxGeometry args={[1.7, 0.52, 1.9]} />
      </mesh>
      {/* the Safari stepped rear roof — taller glasshouse over the boot */}
      <mesh position={[0, 1.58, -1.44]} material={MATS.glass} castShadow>
        <boxGeometry args={[1.72, 0.68, 1.4]} />
      </mesh>
      {/* pillars + roof skin */}
      <mesh position={[0, 1.78, -0.06]} material={PEARL()}>
        <boxGeometry args={[1.74, 0.06, 1.94]} />
      </mesh>
      <mesh position={[0, 1.94, -1.44]} material={PEARL()}>
        <boxGeometry args={[1.76, 0.06, 1.44]} />
      </mesh>
      {/* roof rails riding the step */}
      <Tube a={[-0.7, 1.84, 0.86]} b={[-0.7, 2.0, -2.1]} r={0.03} material={MATS.darkMetal} />
      <Tube a={[0.7, 1.84, 0.86]} b={[0.7, 2.0, -2.1]} r={0.03} material={MATS.darkMetal} />

      {/* flared wheel arches */}
      <mesh position={[0, 0.62, 1.32]} material={TRIM()}>
        <boxGeometry args={[1.96, 0.34, 1.06]} />
      </mesh>
      <mesh position={[0, 0.62, -1.32]} material={TRIM()}>
        <boxGeometry args={[1.96, 0.34, 1.06]} />
      </mesh>
      {/* side steps */}
      <Tube a={[-0.94, 0.42, 0.7]} b={[-0.94, 0.42, -0.7]} r={0.04} material={MATS.darkMetal} />
      <Tube a={[0.94, 0.42, 0.7]} b={[0.94, 0.42, -0.7]} r={0.04} material={MATS.darkMetal} />

      {/* face: grille, chrome slats, bumper, lamps */}
      <mesh position={[0, 0.95, 2.16]} material={TRIM()}>
        <boxGeometry args={[1.6, 0.44, 0.1]} />
      </mesh>
      <mesh position={[0, 1.02, 2.22]} material={MATS.chrome}>
        <boxGeometry args={[1.0, 0.05, 0.03]} />
      </mesh>
      <mesh position={[0, 0.9, 2.22]} material={MATS.chrome}>
        <boxGeometry args={[1.0, 0.05, 0.03]} />
      </mesh>
      <mesh position={[0, 0.58, 2.2]} material={MATS.darkMetal}>
        <boxGeometry args={[1.8, 0.3, 0.16]} />
      </mesh>
      <mesh position={[-0.66, 1.06, 2.18]} material={MATS.lampGlow}>
        <boxGeometry args={[0.34, 0.14, 0.06]} />
      </mesh>
      <mesh position={[0.66, 1.06, 2.18]} material={MATS.lampGlow}>
        <boxGeometry args={[0.34, 0.14, 0.06]} />
      </mesh>
      {/* fog lamps */}
      <mesh position={[-0.6, 0.58, 2.29]} material={MATS.lampGlow}>
        <boxGeometry args={[0.12, 0.08, 0.03]} />
      </mesh>
      <mesh position={[0.6, 0.58, 2.29]} material={MATS.lampGlow}>
        <boxGeometry args={[0.12, 0.08, 0.03]} />
      </mesh>

      {/* tail: vertical lights + chrome strip + bumper */}
      <mesh position={[-0.78, 1.06, -2.26]} material={MATS.tailGlow}>
        <boxGeometry args={[0.16, 0.5, 0.05]} />
      </mesh>
      <mesh position={[0.78, 1.06, -2.26]} material={MATS.tailGlow}>
        <boxGeometry args={[0.16, 0.5, 0.05]} />
      </mesh>
      <mesh position={[0, 1.2, -2.27]} material={MATS.chrome}>
        <boxGeometry args={[1.2, 0.05, 0.03]} />
      </mesh>
      <mesh position={[0, 0.58, -2.24]} material={MATS.darkMetal}>
        <boxGeometry args={[1.8, 0.3, 0.14]} />
      </mesh>
    </group>
  )
}
