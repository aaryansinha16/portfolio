import { GreyboxBiome } from '../GreyboxBiome'
import { townConfig } from './config'

/** Biome root — greybox until its Phase 4 art pass. */
export default function Ch2_Town() {
  return <GreyboxBiome zone={2} config={townConfig} />
}
