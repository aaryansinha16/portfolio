import { useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Color, DirectionalLight, FogExp2, HemisphereLight, Object3D, Vector3 } from 'three'
import { frameEnv, sampleEnv, vehicleProgressAt } from './ColorScript'
import { pointAt } from '../spline/roadPath'
import { flightOf } from '../detours/DetourManager'
import { useJourney } from '../../state/useJourney'
import { lerp, smoothstep } from '../../utils/math'
import { createScratch } from '../../utils/scratch'

const SUN_DISTANCE = 150
const scratch = createScratch()

/* the epilogue's weather: the circuit night dissolves into a bright,
 * hopeful morning as the plane climbs (owner: the future reads positive) */
const FLIGHT_DAY = {
  fogColor: new Color('#cfe6f4'),
  fogDensity: 0.0032,
  skyColor: new Color('#8fc8ef'),
  skyZenith: new Color('#4f9fe4'),
  skyHorizon: new Color('#eef8ff'),
  sunColor: new Color('#fff6e0'),
  sunIntensity: 1.55,
  sunGlow: 0.55,
  hemiSky: new Color('#d8ecf8'),
  hemiGround: new Color('#9aa6a0'),
  hemiIntensity: 0.7,
  toneExposure: 1.14,
}
const FLIGHT_SUN_DIR = new Vector3(0.35, 0.6, -0.72).normalize()

/**
 * Owns global light + air: fog, background, hemisphere fill, the one key
 * light (sun/moon), and tone-mapping exposure — all driven per frame from
 * the ColorScript. The sun rides along with the vehicle so its shadow
 * frustum always covers the visible slice of world.
 */
export function Atmosphere() {
  const scene = useThree((s) => s.scene)
  const gl = useThree((s) => s.gl)
  const sunRef = useRef<DirectionalLight>(null)
  const hemiRef = useRef<HemisphereLight>(null)
  const target = useMemo(() => new Object3D(), [])
  // Samples into the shared frameEnv — Sky and other lighting-aware systems
  // read the same snapshot this frame (Atmosphere mounts first, samples first).
  const env = frameEnv
  const fog = useMemo(() => new FogExp2(new Color('#171b2c'), 0.015), [])

  useFrame(() => {
    const { splineProgress, progress } = useJourney.getState()
    sampleEnv(splineProgress, env)

    // the flight epilogue re-grades the whole frame toward daylight
    const day = smoothstep(flightOf(progress))
    if (day > 0) {
      env.fogColor.lerp(FLIGHT_DAY.fogColor, day)
      env.fogDensity = lerp(env.fogDensity, FLIGHT_DAY.fogDensity, day)
      env.skyColor.lerp(FLIGHT_DAY.skyColor, day)
      env.skyZenith.lerp(FLIGHT_DAY.skyZenith, day)
      env.skyHorizon.lerp(FLIGHT_DAY.skyHorizon, day)
      env.sunColor.lerp(FLIGHT_DAY.sunColor, day)
      env.sunIntensity = lerp(env.sunIntensity, FLIGHT_DAY.sunIntensity, day)
      env.sunGlow = lerp(env.sunGlow, FLIGHT_DAY.sunGlow, day)
      env.hemiSky.lerp(FLIGHT_DAY.hemiSky, day)
      env.hemiGround.lerp(FLIGHT_DAY.hemiGround, day)
      env.hemiIntensity = lerp(env.hemiIntensity, FLIGHT_DAY.hemiIntensity, day)
      env.toneExposure = lerp(env.toneExposure, FLIGHT_DAY.toneExposure, day)
      // lift the morning sun off the horizon and slightly ahead
      env.sunDir.lerp(FLIGHT_SUN_DIR, day).normalize()
    }

    if (scene.fog !== fog) scene.fog = fog
    fog.color.copy(env.fogColor)
    fog.density = env.fogDensity
    if (scene.background instanceof Color) {
      scene.background.copy(env.skyColor)
    } else {
      scene.background = env.skyColor.clone()
    }
    gl.toneMappingExposure = env.toneExposure

    const hemi = hemiRef.current
    if (hemi) {
      hemi.color.copy(env.hemiSky)
      hemi.groundColor.copy(env.hemiGround)
      hemi.intensity = env.hemiIntensity
    }

    const sun = sunRef.current
    if (sun) {
      const vehiclePos = pointAt(vehicleProgressAt(splineProgress), scratch.v1)
      // snap the shadow frustum to a coarse world grid — a continuously
      // sliding light makes shadow texels crawl (reads as edge flicker)
      vehiclePos.x = Math.round(vehiclePos.x * 2) / 2
      vehiclePos.y = Math.round(vehiclePos.y * 2) / 2
      vehiclePos.z = Math.round(vehiclePos.z * 2) / 2
      sun.color.copy(env.sunColor)
      sun.intensity = env.sunIntensity
      sun.position.copy(vehiclePos).addScaledVector(env.sunDir, SUN_DISTANCE)
      target.position.copy(vehiclePos)
    }
  })

  return (
    <group>
      <hemisphereLight ref={hemiRef} intensity={0.35} />
      <primitive object={target} />
      <directionalLight
        ref={sunRef}
        castShadow
        target={target}
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-55}
        shadow-camera-right={55}
        shadow-camera-top={55}
        shadow-camera-bottom={-55}
        shadow-camera-near={1}
        shadow-camera-far={420}
        shadow-bias={-0.0004}
        shadow-normalBias={0.05}
      />
    </group>
  )
}
