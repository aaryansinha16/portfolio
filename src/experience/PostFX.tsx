import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { EffectComposer, DepthOfField, Vignette, Noise } from '@react-three/postprocessing'
import type { DepthOfFieldEffect } from 'postprocessing'
import { Vector3 } from 'three'
import { pointAt } from './spline/roadPath'
import { vehicleProgressAt } from './atmosphere/ColorScript'
import { useJourney } from '../state/useJourney'

/**
 * The post chain (DESIGN.md #6), all subtle: 4x MSAA on the composer input
 * (ADR-9), depth of field focused on the vehicle, vignette, film grain.
 * Bloom joins in Phase 4 for the night chapters.
 */
export function PostFX() {
  const dofRef = useRef<DepthOfFieldEffect>(null)
  const focus = useMemo(() => new Vector3(0, 1, -10), [])

  useEffect(() => {
    const dof = dofRef.current
    if (dof) dof.target = focus
  }, [focus])

  useFrame(() => {
    const { progress } = useJourney.getState()
    pointAt(vehicleProgressAt(progress), focus)
    focus.y += 0.7
  })

  return (
    <EffectComposer multisampling={4}>
      <DepthOfField ref={dofRef} worldFocusRange={30} bokehScale={2.2} />
      <Vignette eskil={false} offset={0.28} darkness={0.55} />
      <Noise premultiply opacity={0.35} />
    </EffectComposer>
  )
}
