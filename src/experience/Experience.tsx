import { lazy, Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { ACESFilmicToneMapping, SRGBColorSpace } from 'three'
import { Atmosphere } from './atmosphere/Atmosphere'
import { Sky } from './atmosphere/Sky'
import { CameraRig } from './CameraRig'
import { ChapterManager } from './chapters/ChapterManager'
import { Ground } from './world/Ground'
import { Road, Dashes } from './world/Road'
import { VehicleManager } from './vehicles/VehicleManager'
import { PostFX } from './PostFX'
import { useJourney } from '../state/useJourney'

const DebugTools = lazy(() => import('./debug/DebugTools'))

/**
 * The 3D scene IS the website. Renderer config here enforces the prime
 * directives: ACES filmic tone mapping always on, sRGB output, soft
 * shadows, dpr capped at 2. Post chain lives in PostFX.
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
        <Sky />
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
        <PostFX />
      </Canvas>
    </div>
  )
}
