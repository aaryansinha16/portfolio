import { useMemo } from 'react'
import { FarSilhouettes } from '../GreyboxBiome'
import { townConfig } from './config'
import { getTownAnchors, getTownStatics } from './townField'
import { Laundry } from './Laundry'
import { BirdFlock } from '../../world/BirdFlock'
import { PuffColumn } from '../../world/PuffColumn'

/**
 * Chapter 2 — Town Morning. The learning-years shop street: plaster
 * facades, painted signboards (the cyber café years), awnings, power
 * poles + sagging wires, market clutter, the first detour signpost.
 * Movers: laundry sway, pigeons, chai-stall smoke.
 */
export default function Ch2_Town() {
  const statics = useMemo(getTownStatics, [])
  const anchors = useMemo(getTownAnchors, [])
  return (
    <group>
      <primitive object={statics} dispose={null} />
      <Laundry />
      <BirdFlock
        anchors={anchors.birds}
        count={9}
        scale={0.75}
        speed={1.6}
        flapRate={1.4}
        color="#4a453e"
      />
      {anchors.smoke.length > 0 && (
        <PuffColumn
          anchors={anchors.smoke}
          color="#b9b2a4"
          opacity={0.25}
          rise={6}
          rate={0.12}
          size={1.1}
        />
      )}
      <FarSilhouettes zone={2} config={townConfig} />
    </group>
  )
}
