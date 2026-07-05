import { useMemo } from 'react'
import { CylinderGeometry, Group, Mesh, MeshStandardMaterial, PlaneGeometry, Vector3 } from 'three'
import { getZoneRoad } from '../../world/roadSamples'
import { makeTextPanel } from '../../world/textPanel'
import { terrainHeightAt } from './villageField'
import { VILLAGE_SIGNS } from '../../../content'

/**
 * Hand-painted learning signboards along the village road — the first
 * HTML/CSS/JS days as roadside markers (owner feedback: the village
 * should carry the story too).
 */

const POST_GEO = new CylinderGeometry(0.045, 0.055, 1, 5)
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
    road.place(m, 5.9 * side, pos)
    const y = terrainHeightAt(pos.x, pos.z)
    const yaw = Math.atan2(s.tx, s.tz) + Math.PI + side * 0.18

    const post = new Mesh(POST_GEO, POST_MAT)
    post.position.set(pos.x, y + 0.7, pos.z)
    post.scale.y = 1.4
    post.castShadow = true

    const board = new Mesh(
      new PlaneGeometry(1.7, 0.8),
      new MeshStandardMaterial({
        map: makeTextPanel({
          title: text,
          bg: '#e6ddc4',
          fg: '#4a3b2c',
          border: '#8a7a5c',
          bleach: 0.3,
          w: 384,
          h: 176,
        }),
        roughness: 0.9,
      }),
    )
    board.position.set(pos.x, y + 1.55, pos.z)
    board.rotation.y = yaw
    board.rotation.z = (i % 2 === 0 ? 1 : -1) * 0.025 // hand-hung, never straight
    const back = new Mesh(new PlaneGeometry(1.78, 0.88), BACK_MAT)
    back.position.copy(board.position)
    back.rotation.copy(board.rotation)
    back.translateZ(-0.02)
    group.add(post, back, board)
  })

  cachedGroup = group
  return group
}

export function VillageSigns() {
  const group = useMemo(getSignsGroup, [])
  return <primitive object={group} dispose={null} />
}
