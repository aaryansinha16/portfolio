import { MATS, paint, Tube, Wheel, type VehicleMotion } from './parts'

/**
 * Chapter 0–1 protagonist: a modeled low-poly bicycle (ADR-11). Realistic
 * scale: 0.34m wheels, ~1.05m wheelbase. +Z forward, y=0 at ground contact.
 * Wheels spin from the choreographed motion; the warm headlamp (#ffd9a0) is
 * the signature light every vehicle in the journey shares.
 */

const WHEEL_R = 0.34
const FRAME = () => paint('#2f4a3e', 0.55, 0.42) // dusty bottle-green

export function Bicycle({ motion }: { motion: VehicleMotion }) {
  const frameMat = FRAME()
  // Key joints (x=0 plane): rear axle, bottom bracket, seat, head tube, front axle.
  const rearAxle: [number, number, number] = [0, WHEEL_R, -0.52]
  const bb: [number, number, number] = [0, 0.29, -0.09]
  const seatTop: [number, number, number] = [0, 0.92, -0.38]
  const headTop: [number, number, number] = [0, 0.98, 0.33]
  const headLow: [number, number, number] = [0, 0.55, 0.42]
  const frontAxle: [number, number, number] = [0, WHEEL_R, 0.53]

  return (
    <group>
      <Wheel z={rearAxle[2]} radius={WHEEL_R} tire={0.021} style="spoke" motion={motion} />
      <Wheel z={frontAxle[2]} radius={WHEEL_R} tire={0.021} style="spoke" motion={motion} />
      {/* diamond frame */}
      <Tube a={rearAxle} b={bb} material={frameMat} />
      <Tube a={rearAxle} b={seatTop} material={frameMat} />
      <Tube a={bb} b={seatTop} r={0.024} material={frameMat} />
      <Tube a={seatTop} b={headTop} r={0.024} material={frameMat} />
      <Tube a={bb} b={headLow} r={0.024} material={frameMat} />
      <Tube a={headLow} b={headTop} r={0.026} material={frameMat} />
      {/* fork */}
      <Tube a={headLow} b={frontAxle} r={0.018} material={frameMat} />
      {/* handlebar */}
      <Tube a={[-0.22, 1.02, 0.3]} b={[0.22, 1.02, 0.3]} r={0.018} material={frameMat} />
      {/* saddle */}
      <mesh position={[0, 0.96, -0.38]} material={MATS.seat} castShadow>
        <boxGeometry args={[0.14, 0.05, 0.26]} />
      </mesh>
      {/* crank */}
      <mesh position={[0, 0.29, -0.09]} rotation={[0, 0, Math.PI / 2]} material={MATS.darkMetal}>
        <cylinderGeometry args={[0.028, 0.028, 0.12, 8]} />
      </mesh>
      {/* carrier rack — every village bicycle has one */}
      <mesh position={[0, 0.72, -0.62]} material={frameMat} castShadow>
        <boxGeometry args={[0.13, 0.02, 0.3]} />
      </mesh>
      <Tube a={[0, 0.71, -0.75]} b={rearAxle} r={0.012} material={frameMat} />
      {/* headlamp — the signature warm light */}
      <mesh position={[0, 0.95, 0.42]} material={MATS.lampGlow}>
        <sphereGeometry args={[0.045, 8, 6]} />
      </mesh>
      {/* rear reflector */}
      <mesh position={[0, 0.7, -0.79]} material={MATS.tailGlow}>
        <boxGeometry args={[0.05, 0.05, 0.02]} />
      </mesh>
    </group>
  )
}
