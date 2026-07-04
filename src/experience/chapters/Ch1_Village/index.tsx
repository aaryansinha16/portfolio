import { GreyboxBiome } from '../GreyboxBiome'
import { villageConfig } from './config'

/** Biome root — greybox until the Phase 2 vertical-slice art pass. */
export default function Ch1_Village() {
  return <GreyboxBiome zone={1} config={villageConfig} />
}
