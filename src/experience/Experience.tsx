import { lazy, Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { ACESFilmicToneMapping, SRGBColorSpace } from 'three'
import { EffectComposer, Vignette, Noise } from '@react-three/postprocessing'
import { Atmosphere } from './atmosphere/Atmosphere'
import { CameraRig } from './CameraRig'
import { ChapterManager } from './chapters/ChapterManager'
import { Ground } from './world/Ground'
import { Road, Dashes } from './world/Road'
import { VehicleManager } from './vehicles/VehicleManager'
import { useJourney } from '../state/useJourney'

const DebugTools = lazy(() => import('./debug/DebugTools'))

/**
 * The 3D scene IS the website. Renderer config here enforces the prime
 * directives: ACES filmic tone mapping always on, sRGB output, soft shadows,
 * dpr capped at 2. Post chain (DESIGN.md #6): 4x MSAA on the composer's
 * input buffer (SMAA hits an ANGLE-Metal blit bug — see decisions.md) →
 * Vignette → grain, all subtle. Bloom/DoF join in Phase 2+ where needed.
 */
export function Experience() {
  const debug = useJourney((s) => s.debug)

  return (
    <div className="canvas-wrap">
      <Canvas
        dpr={[1, 2]}
        shadows="soft"
        camera={{ fov: 45, near: 0.1, far: 900, position: [1.2, 2.15, 8.5] }}
        gl={{
          antialias: false,
          stencil: false,
          powerPreference: 'high-performance',
        }}
        onCreated={({ gl }) => {
          gl.toneMapping = ACESFilmicToneMapping
          gl.outputColorSpace = SRGBColorSpace
          useJourney.getState().setReady()
        }}
      >
        <Atmosphere />
        <Ground />
        <Road />
        <Dashes />
        <ChapterManager />
        <VehicleManager />
        <CameraRig />
        {debug && (
          <Suspense fallback={null}>
            <DebugTools />
          </Suspense>
        )}
        <EffectComposer multisampling={4}>
          <Vignette eskil={false} offset={0.28} darkness={0.55} />
          <Noise premultiply opacity={0.35} />
        </EffectComposer>
      </Canvas>
    </div>
  )
}
