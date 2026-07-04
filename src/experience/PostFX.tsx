import { useEffect, useMemo, useRef, type ReactElement } from 'react'
import { useFrame } from '@react-three/fiber'
import { EffectComposer, Bloom, DepthOfField, Vignette, Noise } from '@react-three/postprocessing'
import type { BloomEffect, DepthOfFieldEffect } from 'postprocessing'
import { Vector3 } from 'three'
import { pointAt } from './spline/roadPath'
import { vehicleProgressAt, zoneFloat } from './atmosphere/ColorScript'
import { HeatHazeEffect } from './effects/HeatHazeEffect'
import { useJourney } from '../state/useJourney'

/**
 * The post chain (DESIGN.md #6), all subtle, tiered by quality
 * (AdaptiveQuality drives the tier; CLAUDE.md: degrade post first):
 *   high   — 4x MSAA + DoF (half-res bokeh) + bloom + haze + vignette + grain
 *   medium — 2x MSAA + bloom + haze + vignette + grain
 *   low    — haze + vignette + grain
 * Vignette + grain never drop — they are the film grade, and they're
 * near-free (heat haze merges into the same pass). Bloom's INTENSITY is
 * zone-driven per frame (night chapters only, per DESIGN) — toggling the
 * pass itself would rebuild the composer mid-drive.
 */
export function PostFX() {
  const quality = useJourney((s) => s.quality)
  const dofRef = useRef<DepthOfFieldEffect>(null)
  const bloomRef = useRef<BloomEffect>(null)
  const focus = useMemo(() => new Vector3(0, 1, -10), [])
  const haze = useMemo(() => new HeatHazeEffect(), [])

  useEffect(() => {
    const dof = dofRef.current
    if (dof) {
      dof.target = focus
      // Half-res bokeh: invisible for an effect this subtle, and it halves
      // the DoF cost at Retina dpr where full-res CoC+blur dominated frames.
      dof.resolution.scale = 0.5
    }
    const bloom = bloomRef.current
    if (bloom) {
      // Bloom's luminance+mip chain renders even at intensity 0 — skip its
      // update entirely while idle so the day chapters don't pay for night.
      const originalUpdate = bloom.update.bind(bloom)
      bloom.update = (...args: Parameters<typeof originalUpdate>) => {
        if (bloom.intensity > 0.01) originalUpdate(...args)
      }
    }
  }, [focus, quality])

  useFrame(() => {
    const { splineProgress } = useJourney.getState()
    const zf = zoneFloat(splineProgress)
    // Heat shimmer peaks mid-highway (zone 3), gone by the neighbors.
    haze.setIntensity(Math.max(0, 1 - Math.abs(zf - 3) * 1.4) * 0.9)
    // Bloom rises through dusk (4), peaks at neon night (5), eases on the
    // circuit (6): piecewise around the night zones.
    if (bloomRef.current) {
      const night =
        Math.max(0, 1 - Math.abs(zf - 5) * 0.75) * 0.9 +
        Math.max(0, 1 - Math.abs(zf - 6) * 1) * 0.35
      bloomRef.current.intensity = Math.min(1, night)
    }
    if (!dofRef.current) return
    pointAt(vehicleProgressAt(splineProgress), focus)
    focus.y += 0.7
  })

  const effects: ReactElement[] = [<primitive key="haze" object={haze} />]
  if (quality === 'high') {
    effects.push(<DepthOfField key="dof" ref={dofRef} worldFocusRange={30} bokehScale={2.2} />)
  }
  if (quality !== 'low') {
    effects.push(
      <Bloom
        key="bloom"
        // upstream types the ref as the class, not the instance — cast past it
        ref={bloomRef as never}
        intensity={0}
        luminanceThreshold={0.55}
        luminanceSmoothing={0.25}
        mipmapBlur
      />,
    )
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
