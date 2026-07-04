import { useRef } from 'react'
import { useThree } from '@react-three/fiber'
import { PerformanceMonitor } from '@react-three/drei'
import { useJourney, type QualityTier } from '../state/useJourney'

/**
 * Minimal adaptive quality (pulled forward from Phase 6 after real-device
 * frame drops): watches sustained fps and steps the tier DOWN only — a
 * one-way ratchet. Promotion is deliberately absent: a vsync-capped 60 at
 * medium is indistinguishable from "barely holding 60", so inclining just
 * flip-flops the composer (each tier change rebuilds it ≈ one long frame).
 * Strong machines stay at high untouched; weak ones settle within seconds.
 * Tier drives renderer dpr here and the post chain in PostFX — post
 * degrades first, never geometry density (CLAUDE.md perf budget). Full
 * device detection + a manual toggle remain Phase 6 work.
 */

const TIERS: readonly QualityTier[] = ['low', 'medium', 'high']
const DPR_CAP: Record<QualityTier, number> = { high: 2, medium: 1.5, low: 1.2 }

export function AdaptiveQuality() {
  const setDpr = useThree((s) => s.setDpr)
  const tierIndex = useRef(2)

  const apply = (index: number) => {
    tierIndex.current = index
    const tier = TIERS[index]
    useJourney.getState().setQuality(tier)
    setDpr(Math.min(window.devicePixelRatio || 1, DPR_CAP[tier]))
  }

  return (
    <PerformanceMonitor
      ms={280}
      iterations={6}
      // Decline while sustained fps < 52: a tier that can only hold ~50
      // should yield to the next one's locked 60 — smoothness beats effects.
      bounds={() => [52, 240]}
      onDecline={() => tierIndex.current > 0 && apply(tierIndex.current - 1)}
    />
  )
}
