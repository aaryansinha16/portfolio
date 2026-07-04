import { useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Color, DirectionalLight, FogExp2, HemisphereLight, Object3D } from 'three'
import { frameEnv, sampleEnv, vehicleProgressAt } from './ColorScript'
import { pointAt } from '../spline/roadPath'
import { useJourney } from '../../state/useJourney'
import { createScratch } from '../../utils/scratch'

const SUN_DISTANCE = 150
const scratch = createScratch()

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
    const { splineProgress } = useJourney.getState()
    sampleEnv(splineProgress, env)

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
        shadow-normalBias={0.03}
      />
    </group>
  )
}
