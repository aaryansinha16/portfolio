import { useEffect, useMemo, useRef, type ComponentRef } from 'react'
import { Line, OrbitControls } from '@react-three/drei'
import { Perf } from 'r3f-perf'
import { Vector3 } from 'three'
import { CHAPTER_MARKS, pointAt, roadCurve } from '../spline/roadPath'
import { useJourney } from '../../state/useJourney'

/**
 * ?debug tooling: perf HUD, spline visualizer, chapter boundary poles,
 * free-fly camera (press F). Never ships in the default bundle — lazy-loaded
 * behind the flag.
 */
export default function DebugTools() {
  const freeFly = useJourney((s) => s.freeFly)
  const controlsRef = useRef<ComponentRef<typeof OrbitControls>>(null)

  const splinePoints = useMemo(() => roadCurve.getSpacedPoints(800), [])
  const boundaryMarkers = useMemo(
    () =>
      CHAPTER_MARKS.slice(0, -1).map((mark, i) => {
        const pos = pointAt(mark, new Vector3())
        return { key: i, position: [pos.x, pos.y + 6, pos.z] as const }
      }),
    [],
  )

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.repeat || e.target instanceof HTMLInputElement) return
      const state = useJourney.getState()
      if (e.key === 'f' || e.key === 'F') {
        state.toggleFreeFly()
      } else if (e.key === 'g' || e.key === 'G') {
        console.log(
          `progress=${state.progress.toFixed(4)} chapter=${state.chapter} v=${state.velocity.toFixed(1)}m/s`,
        )
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  // When free-fly engages, park the orbit target where the vehicle is.
  useEffect(() => {
    if (freeFly && controlsRef.current) {
      const target = pointAt(useJourney.getState().progress, new Vector3())
      controlsRef.current.target.copy(target)
      controlsRef.current.update()
    }
  }, [freeFly])

  return (
    <group>
      <Perf position="top-left" />
      <Line points={splinePoints} color="#00e5ff" lineWidth={1} transparent opacity={0.55} />
      {boundaryMarkers.map((m) => (
        <mesh key={m.key} position={[m.position[0], m.position[1], m.position[2]]}>
          <boxGeometry args={[0.5, 12, 0.5]} />
          <meshStandardMaterial
            color="#ff2e88"
            emissive="#ff2e88"
            emissiveIntensity={1.5}
            toneMapped={false}
          />
        </mesh>
      ))}
      {freeFly && <OrbitControls ref={controlsRef} makeDefault />}
    </group>
  )
}
