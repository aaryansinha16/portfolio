import { useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { Object3D } from 'three'
import { CHAPTER_MARKS, totalLength } from '../../spline/roadPath'
import { vehicleProgressAt } from '../../atmosphere/ColorScript'
import { useJourney } from '../../../state/useJourney'
import { clamp, clamp01 } from '../../../utils/math'
import {
  getBoardFrame,
  getCircuitComponents,
  getCircuitLeds,
  getCircuitStatics,
  pulseFrontAt,
  traceMaterial,
} from './circuitField'

const dummy = new Object3D()

/** Drives the trace pulse front + rises components as the front passes. */
function CircuitPulse() {
  const { components, chips, caps } = useMemo(getCircuitComponents, [])

  useFrame(({ clock }) => {
    const { progress } = useJourney.getState()
    const bf = getBoardFrame()
    // vehicle position in zone-6 meters → normalized pulse front. Negative
    // range covers the ramp feeder traces climbing toward the board.
    const mInZone = (vehicleProgressAt(progress) - CHAPTER_MARKS[6]) * totalLength
    const front = clamp(pulseFrontAt(mInZone), -0.9, 1.1)
    traceMaterial.uniforms.uFront.value = front
    traceMaterial.uniforms.uTime.value = clock.elapsedTime

    // components rise as the front passes (fully scrub-reversible)
    let chipI = 0
    let capI = 0
    for (const c of components) {
      const t = clamp01(((front - c.dist) * bf.length) / 22)
      const ease = 1 - (1 - t) * (1 - t)
      const y = c.y0 + (c.y1 - c.y0) * ease
      dummy.position.set(c.x, y, c.z)
      dummy.rotation.set(0, c.yaw, 0)
      dummy.scale.set(c.sx, c.sy, c.sz)
      dummy.updateMatrix()
      if (c.kind === 'chip') chips.setMatrixAt(chipI++, dummy.matrix)
      else caps.setMatrixAt(capI++, dummy.matrix)
    }
    chips.instanceMatrix.needsUpdate = true
    caps.instanceMatrix.needsUpdate = true
  })

  return null
}

/** Status LEDs blink in three phase groups (circuit ambient mover). */
function StatusLeds() {
  const leds = useMemo(getCircuitLeds, [])
  const base = useMemo(() => {
    const arr = new Float32Array(leds.count * 3)
    for (let i = 0; i < leds.count; i++) {
      leds.getMatrixAt(i, dummy.matrix)
      dummy.matrix.decompose(dummy.position, dummy.quaternion, dummy.scale)
      arr[i * 3] = dummy.position.x
      arr[i * 3 + 1] = dummy.position.y
      arr[i * 3 + 2] = dummy.position.z
    }
    return arr
  }, [leds])

  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    for (let i = 0; i < leds.count; i++) {
      const on = Math.sin(t * (1.6 + (i % 3) * 0.9) + i * 1.31) > -0.2
      dummy.position.set(base[i * 3], base[i * 3 + 1], base[i * 3 + 2])
      dummy.rotation.set(0, 0, 0)
      dummy.scale.setScalar(on ? 1 : 0.001)
      dummy.updateMatrix()
      leds.setMatrixAt(i, dummy.matrix)
    }
    leds.instanceMatrix.needsUpdate = true
  })

  return null
}

/**
 * Chapter 6 — The Circuit Board. The road runs onto a giant PCB; copper
 * traces light up ahead of the vehicle, components rise from the board as
 * the pulse passes, gold pads catch the key light, status LEDs blink.
 * Ends at the silkscreen nameplate — the Phase 5 contact section's stage.
 */
export default function Ch6_Circuit() {
  const statics = useMemo(getCircuitStatics, [])
  return (
    <group>
      <primitive object={statics} dispose={null} />
      <CircuitPulse />
      <StatusLeds />
    </group>
  )
}
