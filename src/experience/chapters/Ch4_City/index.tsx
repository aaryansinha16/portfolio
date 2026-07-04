import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Object3D } from 'three'
import { FarSilhouettes } from '../GreyboxBiome'
import { cityConfig } from './config'
import { getCityBeacons, getCityBirdAnchors, getCityStatics } from './cityField'
import { BirdFlock } from '../../world/BirdFlock'

const dummy = new Object3D()

/** Blinks the rooftop aircraft-warning beacons (city ambient mover). */
function Beacons() {
  const mesh = useMemo(getCityBeacons, [])
  const basePositions = useRef<Float32Array | null>(null)

  useFrame(({ clock }) => {
    if (!basePositions.current) {
      // capture spawn positions once from the built matrices
      const arr = new Float32Array(mesh.count * 3)
      for (let i = 0; i < mesh.count; i++) {
        mesh.getMatrixAt(i, dummy.matrix)
        dummy.matrix.decompose(dummy.position, dummy.quaternion, dummy.scale)
        arr[i * 3] = dummy.position.x
        arr[i * 3 + 1] = dummy.position.y
        arr[i * 3 + 2] = dummy.position.z
      }
      basePositions.current = arr
    }
    const t = clock.elapsedTime
    for (let i = 0; i < mesh.count; i++) {
      const on = Math.sin(t * 1.4 + i * 2.3) > 0.55
      dummy.position.set(
        basePositions.current[i * 3],
        basePositions.current[i * 3 + 1],
        basePositions.current[i * 3 + 2],
      )
      dummy.rotation.set(0, 0, 0)
      dummy.scale.setScalar(on ? 0.5 : 0.001)
      dummy.updateMatrix()
      mesh.setMatrixAt(i, dummy.matrix)
    }
    mesh.instanceMatrix.needsUpdate = true
  })

  return null
}

/**
 * Chapter 4 — City Dusk. Window-lit towers, sodium streetlights, blinking
 * rooftop beacons, bats over the road — and the tunnel at the end that
 * swallows the boundary into neon night.
 */
export default function Ch4_City() {
  const statics = useMemo(getCityStatics, [])
  const birdAnchors = useMemo(getCityBirdAnchors, [])
  return (
    <group>
      <primitive object={statics} dispose={null} />
      <Beacons />
      <BirdFlock
        anchors={birdAnchors}
        count={8}
        scale={0.6}
        speed={2.2}
        flapRate={2}
        color="#14110e"
      />
      <FarSilhouettes zone={4} config={cityConfig} />
    </group>
  )
}
