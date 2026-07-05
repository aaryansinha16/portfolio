import { useMemo, useRef, type ComponentType } from 'react'
import { useFrame } from '@react-three/fiber'
import { Group, PointLight } from 'three'
import { CHAPTER_MARKS, pointAt, tangentAt, totalLength } from '../spline/roadPath'
import { vehicleProgressAt } from '../atmosphere/ColorScript'
import { useJourney } from '../../state/useJourney'
import { clamp, clamp01, damp, smoothstep } from '../../utils/math'
import { createScratch } from '../../utils/scratch'
import { Bicycle } from './Bicycle'
import { Motorcycle } from './Motorcycle'
import { R15 } from './R15'
import { Safari } from './Safari'
import { DustTrail } from './DustTrail'
import type { VehicleMotion } from './parts'

/**
 * Vehicle choreography. The journey hands the protagonist role across four
 * rides; every handoff is a PURE FUNCTION of scroll progress, so scrubbing
 * backward replays the swap in reverse (no timeline cuts, no state):
 *
 *   old ride: eases onto the left shoulder (India drives left), brakes to
 *   a stop just before the boundary and stays parked in the world;
 *   new ride: waits parked past the boundary, launches as the follow point
 *   reaches it, and catches the follow point with matched velocity
 *   (cubic hermite — C1-continuous into the cruising regime).
 *
 * Feel stays procedural (ADR-6): bob, curve lean (bikes bank in, the
 * Safari's body rolls faintly out), side-stand lean when parked.
 */

/* handoff geometry, in meters along the spline */
const APPROACH = 40 // old ride's deceleration run
const MERGE = 44 // new ride's launch run
const PARK_BACK = 12 // old ride parks this far before the boundary
const START_AHEAD = 5 // new ride waits this far past the boundary
const SHOULDER = 6.2 // lateral park offset (left of travel, clear of the 4m half-road)

const B = (zone: number) => CHAPTER_MARKS[zone] * totalLength

interface VehicleDef {
  key: string
  Comp: ComponentType<{ motion: VehicleMotion }>
  /** chapters during which this vehicle is mounted (incl. parked ghost) */
  chapters: readonly number[]
  intro: number | null
  outro: number | null
  bike: boolean
  leanScale: number
  leanMax: number
}

const DEFS: readonly VehicleDef[] = [
  {
    key: 'bicycle',
    Comp: Bicycle,
    chapters: [0, 1, 2],
    intro: null,
    outro: B(2),
    bike: true,
    leanScale: 5.5,
    leanMax: 0.32,
  },
  {
    key: 'motorcycle',
    Comp: Motorcycle,
    chapters: [1, 2, 3],
    intro: B(2),
    outro: B(3),
    bike: true,
    leanScale: 5.5,
    leanMax: 0.3,
  },
  {
    key: 'r15',
    Comp: R15,
    chapters: [2, 3, 4],
    intro: B(3),
    outro: B(4),
    bike: true,
    leanScale: 6.5,
    leanMax: 0.38,
  },
  {
    key: 'safari',
    Comp: Safari,
    chapters: [3, 4, 5, 6],
    intro: B(4),
    outro: null,
    bike: false,
    leanScale: -0.6,
    leanMax: 0.05,
  },
]

interface VState {
  along: number // meters
  lateral: number // signed; + is right of travel
  speedScale: number
  parkedT: number
}

/** Everything below is dimensioned so state is continuous AND C1 at seams. */
function stateFor(def: VehicleDef, m: number, out: VState): VState {
  if (def.outro != null) {
    const park = def.outro - PARK_BACK
    const start = park - APPROACH
    if (m >= start) {
      const t = clamp01((m - start) / APPROACH)
      // f(0)=0, f(1)=1, f'(0)=1 (enters at road speed), f'(1)=0 (stops)
      const f = -t * t * t + t * t + t
      out.along = start + f * APPROACH
      out.lateral = -SHOULDER * smoothstep(clamp01(t * 1.35))
      out.speedScale = -3 * t * t + 2 * t + 1
      out.parkedT = smoothstep(clamp01((t - 0.82) / 0.15))
      return out
    }
  }
  if (def.intro != null) {
    const start = def.intro + START_AHEAD
    const end = start + MERGE
    if (m <= start) {
      out.along = start
      out.lateral = -SHOULDER
      out.speedScale = 0
      out.parkedT = 1
      return out
    }
    if (m < end) {
      const t = (m - start) / MERGE
      // g(0)=0, g'(0)=0 (launch from rest), g(1)=1, g'(1)=1 (catches follow point)
      const g = 2 * t * t - t * t * t
      out.along = start + g * MERGE
      out.lateral = -SHOULDER * (1 - smoothstep(clamp01(t / 0.7)))
      out.speedScale = 4 * t - 3 * t * t
      out.parkedT = 1 - smoothstep(clamp01(t * 5))
      return out
    }
  }
  // stop a hair short of the spline's end — at the exact endpoint the
  // look-ahead degenerates (lookAt of its own position flips the vehicle)
  out.along = Math.min(m, totalLength - 4.5)
  out.lateral = 0
  out.speedScale = 1
  out.parkedT = 0
  return out
}

const scratch = createScratch()
const sNow: VState = { along: 0, lateral: 0, speedScale: 0, parkedT: 0 }
const sAhead: VState = { along: 0, lateral: 0, speedScale: 0, parkedT: 0 }

function ChoreoVehicle({ def }: { def: VehicleDef }) {
  const groupRef = useRef<Group>(null)
  const bodyRef = useRef<Group>(null)
  const lean = useRef(0)
  const motion = useMemo<VehicleMotion>(() => ({ speed: 0 }), [])

  useFrame(({ clock }, rawDt) => {
    const group = groupRef.current
    if (!group) return
    const dt = clamp(rawDt, 1e-4, 0.1)
    const { splineProgress, velocity, reducedMotion } = useJourney.getState()
    const m = vehicleProgressAt(splineProgress) * totalLength

    stateFor(def, m, sNow)
    stateFor(def, m + 3, sAhead)
    motion.speed = velocity * sNow.speedScale

    const { v1: pos, v2: ahead, v3: right, v4: tangent } = scratch

    pointAt(sNow.along / totalLength, pos)
    tangentAt(sNow.along / totalLength, tangent)
    right.set(-tangent.z, 0, tangent.x).normalize()
    pos.addScaledVector(right, sNow.lateral)
    pos.y += 0.08
    group.position.copy(pos)

    // Heading: 3m ahead along the choreography (lateral from the ahead
    // state so merges/pull-offs angle the nose; parked stays road-parallel).
    pointAt((sNow.along + 3) / totalLength, ahead)
    tangentAt((sNow.along + 3) / totalLength, tangent)
    right.set(-tangent.z, 0, tangent.x).normalize()
    ahead.addScaledVector(right, sAhead.lateral)
    ahead.y += 0.08
    group.lookAt(ahead)
    // Parked rides sit nosed slightly into the shoulder, not lane-parallel.
    if (sNow.parkedT > 0.01) group.rotateY(0.12 * sNow.parkedT)

    const body = bodyRef.current
    if (!body || reducedMotion) return
    const t = clock.elapsedTime
    const speedFactor = clamp01(motion.speed / 80)

    // Lean into the curve — bikes bank in, the Safari rolls faintly out.
    tangentAt(sNow.along / totalLength, tangent)
    tangentAt((sNow.along + 8) / totalLength, scratch.v5)
    const turn = tangent.x * scratch.v5.z - tangent.z * scratch.v5.x
    const curveLean =
      clamp(turn * def.leanScale, -def.leanMax, def.leanMax) * clamp01(motion.speed / 30)
    // Side-stand lean for parked bikes (kickstand on the left).
    const parkLean = def.bike ? sNow.parkedT * -0.13 : 0
    lean.current = damp(lean.current, curveLean + parkLean, 4, dt)

    body.position.y = 0.02 * Math.sin(t * 9) * speedFactor + 0.006 * Math.sin(t * 1.8)
    body.rotation.z = 0.015 * Math.sin(t * 7.3) * speedFactor + lean.current
  })

  return (
    <group ref={groupRef}>
      <group ref={bodyRef}>
        <def.Comp motion={motion} />
      </group>
    </group>
  )
}

/**
 * ONE shared headlight pool for the whole garage, riding ahead of the
 * protagonist. Per-vehicle point lights would mean 2–3 dynamic lights while
 * ghosts are mounted — measurably slower AND every mount/unmount would
 * change the scene's light count, forcing three.js to recompile programs.
 * The emissive lamp meshes stay per vehicle; only the light pool is shared.
 */
function HeadlightPool() {
  const lightRef = useRef<PointLight>(null)

  useFrame(() => {
    const light = lightRef.current
    if (!light) return
    const { progress, splineProgress } = useJourney.getState()
    const p = vehicleProgressAt(splineProgress)
    pointAt(p + 3 / totalLength, scratch.v1)
    scratch.v1.y += 1.0
    light.position.copy(scratch.v1)
    // The ignition beat: dark at rest, the lamp turns ON with the first
    // scroll (pure function of progress — reverses back to dark at the top).
    light.intensity = 8 * smoothstep(clamp01((progress - 0.0004) / 0.005))
  })

  return <pointLight ref={lightRef} color="#ffd9a0" intensity={0} distance={26} decay={2} />
}

export function VehicleManager() {
  const chapter = useJourney((s) => s.chapter)
  return (
    <>
      {DEFS.filter((d) => d.chapters.includes(chapter)).map((d) => (
        <ChoreoVehicle key={d.key} def={d} />
      ))}
      <HeadlightPool />
      <DustTrail />
    </>
  )
}
