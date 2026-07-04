import { useEffect, useMemo, useRef, type ReactElement } from 'react'
import { useFrame } from '@react-three/fiber'
import { EffectComposer, DepthOfField, Vignette, Noise } from '@react-three/postprocessing'
import type { DepthOfFieldEffect } from 'postprocessing'
import { Vector3 } from 'three'
import { pointAt } from './spline/roadPath'
import { vehicleProgressAt } from './atmosphere/ColorScript'
import { useJourney } from '../state/useJourney'

/**
 * The post chain (DESIGN.md #6), all subtle, tiered by quality
 * (AdaptiveQuality drives the tier; CLAUDE.md: degrade post first):
 *   high   — 4x MSAA + DoF (half-res bokeh) + vignette + grain
 *   medium — 2x MSAA + vignette + grain
 *   low    — vignette + grain
 * Vignette + grain never drop — they are the film grade, and they're free.
 * Bloom joins in Phase 4 for the night chapters.
 */
export function PostFX() {
  const quality = useJourney((s) => s.quality)
  const dofRef = useRef<DepthOfFieldEffect>(null)
  const focus = useMemo(() => new Vector3(0, 1, -10), [])

  useEffect(() => {
    const dof = dofRef.current
    if (!dof) return
    dof.target = focus
    // Half-res bokeh: invisible for an effect this subtle, and it halves
    // the DoF cost at Retina dpr where full-res CoC+blur dominated frames.
    dof.resolution.scale = 0.5
  }, [focus, quality])

  useFrame(() => {
    if (!dofRef.current) return
    const { progress } = useJourney.getState()
    pointAt(vehicleProgressAt(progress), focus)
    focus.y += 0.7
  })

  const effects: ReactElement[] = []
  if (quality === 'high') {
    effects.push(<DepthOfField key="dof" ref={dofRef} worldFocusRange={30} bokehScale={2.2} />)
  }
  effects.push(
    <Vignette key="vignette" eskil={false} offset={0.28} darkness={0.55} />,
    <Noise key="noise" premultiply opacity={0.35} />,
  )

  const multisampling = quality === 'high' ? 4 : quality === 'medium' ? 2 : 0

  return (
    <EffectComposer key={quality} multisampling={multisampling}>
      {effects}
    </EffectComposer>
  )
}
