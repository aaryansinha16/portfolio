import { GreyboxBiome } from '../GreyboxBiome'
import { prologueConfig } from './config'

/** Biome root — greybox until its Phase 2/4 art pass. */
export default function Ch0_Prologue() {
  return <GreyboxBiome zone={0} config={prologueConfig} />
}
