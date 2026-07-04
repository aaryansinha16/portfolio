import { useMemo } from 'react'
import { BirdFlock } from '../../world/BirdFlock'
import { getVillageLayout } from './villageField'

/** Dawn sparrows over the fields (village ambient mover #2). */
export function Birds() {
  const anchors = useMemo(() => getVillageLayout().birdAnchors, [])
  return <BirdFlock anchors={anchors} count={12} />
}
