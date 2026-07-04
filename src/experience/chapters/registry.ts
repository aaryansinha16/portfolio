import type { ChapterConfig } from './types'
import { prologueConfig } from './Ch0_Prologue/config'
import { villageConfig } from './Ch1_Village/config'
import { townConfig } from './Ch2_Town/config'
import { highwayConfig } from './Ch3_Highway/config'
import { cityConfig } from './Ch4_City/config'
import { neonConfig } from './Ch5_Neon/config'
import { circuitConfig } from './Ch6_Circuit/config'

export interface ChapterEntry {
  key: string
  config: ChapterConfig
}

/** Ordered zone list; index === chapter number everywhere in the app. */
export const CHAPTERS: readonly ChapterEntry[] = [
  { key: 'prologue', config: prologueConfig },
  { key: 'village', config: villageConfig },
  { key: 'town', config: townConfig },
  { key: 'highway', config: highwayConfig },
  { key: 'city', config: cityConfig },
  { key: 'neon', config: neonConfig },
  { key: 'circuit', config: circuitConfig },
]
