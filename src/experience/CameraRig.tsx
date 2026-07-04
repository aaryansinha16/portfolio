import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { PerspectiveCamera } from 'three'
import {
  metersToProgress,
  pointAt,
  tangentAt,
  totalLength,
  vehicleProgressAt,
} from './spline/roadPath'
import { useJourney } from '../state/useJourney'
import { clamp, clamp01, damp } from '../utils/math'
import { createScratch } from '../utils/scratch'

/**
 * Chase cam on the spline. Reads the scrub-smoothed progress directly —
 * NO additional position smoothing (CLAUDE.md: scrub + lerp-follow double
 * smoothing = mushy). Speed illusion comes from FOV kicks + subtle shake
 * (DESIGN.md camera language), both derived from scroll velocity.
 *
 * progress p = camera spline coordinate; the vehicle rides CHASE_METERS
 * ahead (see roadPath.vehicleProgressAt).
 */

const CAM = {
  height: 2.1, // above the road surface
  right: 1.2, // lateral offset — DESIGN: slightly right of vehicle
  lookAheadMeters: 6, // look-at leads the VEHICLE by this much
  lookHeight: 1.1,
  fovBase: 45,
  fovKickMax: 7,
  bankScale: 2.2,
  bankMax: 0.05, // radians
}

const scratch = createScratch()

export function CameraRig() {
  const prevP = useRef(-1)
  const smoothedSpeed = useRef(0)
  const bank = useRef(0)

  useFrame(({ camera, clock }, rawDt) => {
    const state = useJourney.getState()
    if (state.freeFly) return
    if (!(camera instanceof PerspectiveCamera)) return

    const dt = clamp(rawDt, 1e-4, 0.1)
    const p = state.progress

    // Velocity in m/s from progress deltas, exp-smoothed; store it for the
    // vehicle bob / debug HUD. First frame after a jump: treat as stationary.
    if (prevP.current < 0) prevP.current = p
    const instSpeed = (Math.abs(p - prevP.current) / dt) * totalLength
    prevP.current = p
    smoothedSpeed.current = damp(smoothedSpeed.current, Math.min(instSpeed, 400), 5, dt)
    const speed = smoothedSpeed.current
    if (Math.abs(speed - state.velocity) > 0.1) useJourney.setState({ velocity: speed })

    const { v1: camPos, v2: look, v3: right, v4: tangent, v5: tangentAhead } = scratch

    // Position: on the spline at p, lifted and offset slightly right.
    pointAt(p, camPos)
    tangentAt(p, tangent)
    right.set(-tangent.z, 0, tangent.x).normalize()
    camPos.y += CAM.height
    camPos.addScaledVector(right, CAM.right)

    // Subtle speed shake (never at rest, never in reduced motion).
    if (!state.reducedMotion) {
      const t = clock.elapsedTime
      const amp = 0.05 * clamp01(speed / 140)
      camPos.addScaledVector(right, Math.sin(t * 31.0) * amp)
      camPos.y += Math.sin(t * 47.0 + 1.3) * amp * 0.6
    }

    camera.position.copy(camPos)

    // Look-at leads the vehicle so turns feel anticipated.
    const pVehicle = vehicleProgressAt(p)
    pointAt(pVehicle + metersToProgress(CAM.lookAheadMeters), look)
    look.y += CAM.lookHeight
    camera.up.set(0, 1, 0)
    camera.lookAt(look)

    // Banking: signed curvature from tangent change ahead, speed-weighted.
    tangentAt(pVehicle + metersToProgress(CAM.lookAheadMeters), tangentAhead)
    const turn = tangent.x * tangentAhead.z - tangent.z * tangentAhead.x // cross().y
    const targetBank = clamp(turn * CAM.bankScale, -CAM.bankMax, CAM.bankMax) * clamp01(speed / 50)
    bank.current = damp(bank.current, targetBank, 4, dt)
    camera.rotateZ(bank.current)

    // FOV kick with velocity — acceleration reads as widening, not speed-up.
    const fovTarget = CAM.fovBase + CAM.fovKickMax * clamp01((speed - 12) / 130)
    const fov = damp(camera.fov, fovTarget, 3, dt)
    if (Math.abs(fov - camera.fov) > 0.005) {
      camera.fov = fov
      camera.updateProjectionMatrix()
    }
  })

  return null
}
