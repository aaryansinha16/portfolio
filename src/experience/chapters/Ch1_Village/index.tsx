import { FarSilhouettes } from '../GreyboxBiome'
import { villageConfig } from './config'
import { VillageTerrain } from './VillageTerrain'
import { Trees } from './Trees'
import { Huts } from './Huts'
import { Crops } from './Crops'
import { Birds } from './Birds'
import { Smoke } from './Smoke'
import { VillageSigns } from './VillageSigns'

/**
 * Chapter 1 — Village Dawn, the Phase 2 vertical slice. Three depth layers:
 * mustard fields + road shoulder (near), huts/trees (mid), fog-faded hills
 * (far). Ambient movers: swaying crops, birds, chimney smoke.
 *
 * Biome contract: declares its world only — env values live in config.env
 * and are applied globally by Atmosphere/ColorScript.
 */
export default function Ch1_Village() {
  return (
    <group>
      <VillageTerrain />
      <Trees />
      <Huts />
      <Crops />
      <Birds />
      <Smoke />
      <VillageSigns />
      <FarSilhouettes zone={1} config={villageConfig} />
    </group>
  )
}
