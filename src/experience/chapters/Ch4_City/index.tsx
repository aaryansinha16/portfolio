import { GreyboxBiome } from '../GreyboxBiome'
import { cityConfig } from './config'

/** Biome root — greybox until its Phase 4 art pass. */
export default function Ch4_City() {
  return <GreyboxBiome zone={4} config={cityConfig} />
}
