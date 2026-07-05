import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { PerspectiveCamera, Vector3 } from 'three'
import {
  CLIFF_MAX_OVER,
  CLIFF_START_M,
  metersToProgress,
  pointAt,
  pointPastEnd,
  tangentAt,
  totalLength,
} from './spline/roadPath'
import { useJourney } from '../state/useJourney'
import { sampleCamera, vehicleProgressAt, type RuntimeCam } from './atmosphere/ColorScript'
import { focusLookAt } from './world/focusTargets'
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

// Height/right/fov live in per-chapter configs (sampleCamera lerps them);
// these are the framing constants that never change per chapter.
const CAM = {
  lookAheadMeters: 6, // look-at leads the VEHICLE by this much
  lookHeight: 1.1,
  fovKickMax: 7,
  bankScale: 2.2,
  bankMax: 0.05, // radians
}

const scratch = createScratch()
const camFrame: RuntimeCam = { height: 2.1, right: 1.2, fov: 45, chase: 8.5 }
const focusPos = new Vector3()
/** how far the gaze commits to a story board (1 = stare straight at it) */
const FOCUS_MIX = 0.85

export function CameraRig() {
  const prevP = useRef(-1)
  const smoothedSpeed = useRef(0)
  const bank = useRef(0)

  useFrame(({ camera, clock }, rawDt) => {
    const state = useJourney.getState()
    if (state.freeFly) return
    if (!(camera instanceof PerspectiveCamera)) return

    const dt = clamp(rawDt, 1e-4, 0.1)
    // never let the camera catch the vehicle at the road's end — the ride
    // stops at 1, the camera holds a car-length behind
    const p = Math.min(state.splineProgress, 1 - 15.5 / totalLength)

    // Velocity in m/s from progress deltas, exp-smoothed; store it for the
    // vehicle bob / debug HUD. First frame after a jump: treat as stationary.
    if (prevP.current < 0) prevP.current = p
    const instSpeed = (Math.abs(p - prevP.current) / dt) * totalLength
    prevP.current = p
    smoothedSpeed.current = damp(smoothedSpeed.current, Math.min(instSpeed, 400), 5, dt)
    const speed = smoothedSpeed.current
    if (Math.abs(speed - state.velocity) > 0.1) useJourney.setState({ velocity: speed })

    const { v1: camPos, v2: look, v3: right, v4: tangent, v5: tangentAhead } = scratch
    sampleCamera(p, camFrame)

    // The dive: how far the ride is past the cliff edge (0 before it).
    // The camera holds its spot on the deck but RISES with the fall —
    // from chase height the lip itself would hide anything below the edge.
    const overVehicle = clamp01(
      (vehicleProgressAt(state.splineProgress) * totalLength - CLIFF_START_M) / CLIFF_MAX_OVER,
    )
    const dive = overVehicle * overVehicle * (3 - 2 * overVehicle) // smoothstep

    // Position: on the spline at p, lifted and offset slightly right.
    pointAt(p, camPos)
    tangentAt(p, tangent)
    right.set(-tangent.z, 0, tangent.x).normalize()
    camPos.y += camFrame.height + dive * 6.5
    camPos.addScaledVector(right, camFrame.right)

    // Subtle speed shake (never at rest, never in reduced motion).
    if (!state.reducedMotion) {
      const t = clock.elapsedTime
      const amp = 0.05 * clamp01(speed / 140)
      camPos.addScaledVector(right, Math.sin(t * 31.0) * amp)
      camPos.y += Math.sin(t * 47.0 + 1.3) * amp * 0.6
    }

    camera.position.copy(camPos)

    // Look-at leads the vehicle so turns feel anticipated. Near the cliff
    // the target follows the SAME dive extrapolation the vehicle rides, so
    // the camera tilts down and watches the fall (capped just past the
    // vehicle's own hang point to keep it framed).
    const pVehicle = vehicleProgressAt(p)
    const lookM = Math.min(
      pVehicle * totalLength + CAM.lookAheadMeters,
      CLIFF_START_M + CLIFF_MAX_OVER + 2,
    )
    pointPastEnd(lookM, look)
    look.y += CAM.lookHeight
    // The glance: passing a story board (ch2 rooftops, ch4 career signs)
    // eases the gaze toward it and back while the remap slows the ride —
    // same pure-function-of-scroll rule as everything else. Boards mounted
    // close to the shoulder get a SOFTER turn: committing 55% to a sign
    // 10m away whips the camera; the same commit 35m out is a glance.
    const focusW = focusLookAt(pVehicle * totalLength, focusPos)
    if (focusW > 0) {
      const dH = Math.hypot(focusPos.x - camPos.x, focusPos.z - camPos.z)
      const proximity = 0.5 + 0.5 * clamp01((dH - 6) / 26)
      look.lerp(focusPos, focusW * FOCUS_MIX * proximity)
    }
    camera.up.set(0, 1, 0)
    camera.lookAt(look)

    // Banking: signed curvature from tangent change ahead, speed-weighted.
    tangentAt(pVehicle + metersToProgress(CAM.lookAheadMeters), tangentAhead)
    const turn = tangent.x * tangentAhead.z - tangent.z * tangentAhead.x // cross().y
    const targetBank = clamp(turn * CAM.bankScale, -CAM.bankMax, CAM.bankMax) * clamp01(speed / 50)
    bank.current = damp(bank.current, targetBank, 4, dt)
    camera.rotateZ(bank.current)

    // FOV kick with velocity — acceleration reads as widening, not speed-up.
    const fovTarget = camFrame.fov + CAM.fovKickMax * clamp01((speed - 12) / 130)
    const fov = damp(camera.fov, fovTarget, 3, dt)
    if (Math.abs(fov - camera.fov) > 0.005) {
      camera.fov = fov
      camera.updateProjectionMatrix()
    }
  })

  return null
}
