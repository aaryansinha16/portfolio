import { useMemo } from 'react'
import { FarSilhouettes } from '../GreyboxBiome'
import { highwayConfig } from './config'
import { getHighwayBirdAnchors, getHighwayStatics } from './highwayField'
import { Traffic } from './Traffic'
import { Windmills } from './Windmills'
import { BannerPlane } from './BannerPlane'
import { NightSky } from './NightSky'
import { BirdFlock } from '../../world/BirdFlock'

/**
 * Chapter 3 — Highway Night. Moonlit plains under a starry vault (stars,
 * galaxies, shooting stars), lit hoardings, oncoming headlights, turbines
 * blinking their beacons. Movers: traffic, the night sky, the plane.
 */
export default function Ch3_Highway() {
  const statics = useMemo(getHighwayStatics, [])
  const birdAnchors = useMemo(getHighwayBirdAnchors, [])
  return (
    <group>
      <primitive object={statics} dispose={null} />
      <NightSky />
      <Traffic />
      <Windmills />
      <BannerPlane />
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
