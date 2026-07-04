import { useMemo } from 'react'
import { FarSilhouettes } from '../GreyboxBiome'
import { highwayConfig } from './config'
import { getHighwayBirdAnchors, getHighwayStatics } from './highwayField'
import { Traffic } from './Traffic'
import { BirdFlock } from '../../world/BirdFlock'

/**
 * Chapter 3 — Highway Noon. Bleached scrub plains, milestone stones, the
 * skill hoardings, oncoming traffic, kites soaring in the white sky.
 * Movers: traffic, kites, heat shimmer (PostFX, zone-driven).
 */
export default function Ch3_Highway() {
  const statics = useMemo(getHighwayStatics, [])
  const birdAnchors = useMemo(getHighwayBirdAnchors, [])
  return (
    <group>
      <primitive object={statics} dispose={null} />
      <Traffic />
      <BirdFlock
        anchors={birdAnchors}
        count={6}
        scale={2.2}
        speed={0.5}
        flapRate={0.25}
        color="#3a332c"
      />
      <FarSilhouettes zone={3} config={highwayConfig} />
    </group>
  )
}
