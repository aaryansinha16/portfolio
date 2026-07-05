import { useMemo } from 'react'
import { CylinderGeometry, Group, Mesh, MeshStandardMaterial, PlaneGeometry, Vector3 } from 'three'
import { getZoneRoad } from '../../world/roadSamples'
import { makeTextPanel } from '../../world/textPanel'
import { terrainHeightAt } from './villageField'
import { VILLAGE_SIGNS } from '../../../content'

/**
 * Hand-painted learning signboards along the village road — the first
 * HTML/CSS/JS days as roadside markers. They sit in the low dawn light, so
 * the paint gets a gentle emissive lift (owner: the text only resolved at
 * arm's length before) and the boards are big enough to read on approach.
 */

const POST_GEO = new CylinderGeometry(0.05, 0.06, 1, 5)
const POST_MAT = new MeshStandardMaterial({ color: '#5f4a36', roughness: 0.95 })
const BACK_MAT = new MeshStandardMaterial({ color: '#4a3b2c', roughness: 0.95 })

let cachedGroup: Group | null = null

function getSignsGroup(): Group {
  if (cachedGroup) return cachedGroup
  const road = getZoneRoad(1)
  const group = new Group()
  const pos = new Vector3()

  VILLAGE_SIGNS.forEach((text, i) => {
    const m = 35 + (i * (road.zoneMeters - 80)) / (VILLAGE_SIGNS.length - 1)
    const side = i % 2 === 0 ? -1 : 1
    const s = road.at(m)
    road.place(m, 5.35 * side, pos)
    const y = terrainHeightAt(pos.x, pos.z)
    const yaw = Math.atan2(s.tx, s.tz) + Math.PI + side * 0.18

    const tex = makeTextPanel({
      title: text,
      bg: '#f2ead2',
      fg: '#241c12',
      border: '#6b5a40',
      bleach: 0.12,
      w: 512,
      h: 236,
    })
    const board = new Mesh(
      new PlaneGeometry(2.3, 1.06),
      new MeshStandardMaterial({
        map: tex,
        // dawn shade swallowed the paint — let the board carry its own light
        emissive: '#ffffff',
        emissiveMap: tex,
        emissiveIntensity: 0.42,
        roughness: 0.88,
      }),
    )
    board.position.set(pos.x, y + 1.72, pos.z)
    board.rotation.y = yaw
    board.rotation.z = (i % 2 === 0 ? 1 : -1) * 0.025 // hand-hung, never straight
    const back = new Mesh(new PlaneGeometry(2.4, 1.16), BACK_MAT)
    back.position.copy(board.position)
    back.rotation.copy(board.rotation)
    back.translateZ(-0.02)

    // twin posts under the board's ends (plane local X is horizontal)
    for (const off of [-0.92, 0.92]) {
      const post = new Mesh(POST_GEO, POST_MAT)
      post.position.set(pos.x + Math.cos(yaw) * off, y + 0.85, pos.z - Math.sin(yaw) * off)
      post.scale.y = 1.7
      post.castShadow = true
      group.add(post)
    }
    group.add(back, board)
  })

  cachedGroup = group
  return group
}

export function VillageSigns() {
  const group = useMemo(getSignsGroup, [])
  return <primitive object={group} dispose={null} />
}
