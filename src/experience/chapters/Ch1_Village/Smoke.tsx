import { useMemo } from 'react'
import { PuffColumn } from '../../world/PuffColumn'
import { villageArt } from './config'
import { getVillageLayout } from './villageField'

/** Hearth smoke from each cluster's road-nearest hut (ambient mover #3). */
export function Smoke() {
  const anchors = useMemo(() => getVillageLayout().smokeAnchors, [])
  return (
    <PuffColumn
      anchors={anchors}
      color={villageArt.smoke.color}
      opacity={villageArt.smoke.opacity}
    />
  )
}
