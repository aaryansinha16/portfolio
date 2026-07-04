import { useMemo, type ComponentType } from 'react'
import { useJourney } from '../../state/useJourney'
import { ZONE_COUNT } from '../spline/roadPath'
import Ch0_Prologue from './Ch0_Prologue'
import Ch1_Village from './Ch1_Village'
import Ch2_Town from './Ch2_Town'
import Ch3_Highway from './Ch3_Highway'
import Ch4_City from './Ch4_City'
import Ch5_Neon from './Ch5_Neon'
import Ch6_Circuit from './Ch6_Circuit'

const ZONE_COMPONENTS: readonly ComponentType[] = [
  Ch0_Prologue,
  Ch1_Village,
  Ch2_Town,
  Ch3_Highway,
  Ch4_City,
  Ch5_Neon,
  Ch6_Circuit,
]

/**
 * Streams biomes: only the active chapter ± 1 neighbor is mounted (ADR-7).
 * Geometry/material disposal happens automatically on unmount (R3F-managed
 * JSX resources). Env values are NOT handled here — ColorScript lerps those
 * continuously so boundaries never cut.
 */
export function ChapterManager() {
  const chapter = useJourney((s) => s.chapter)

  const active = useMemo(() => {
    const zones: number[] = []
    for (let z = Math.max(0, chapter - 1); z <= Math.min(ZONE_COUNT - 1, chapter + 1); z++) {
      zones.push(z)
    }
    return zones
  }, [chapter])

  return (
    <>
      {active.map((z) => {
        const Zone = ZONE_COMPONENTS[z]
        return <Zone key={z} />
      })}
    </>
  )
}
