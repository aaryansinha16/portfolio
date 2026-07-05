import { useMemo } from 'react'
import { CylinderGeometry, Group, Mesh, MeshStandardMaterial, PlaneGeometry, Vector3 } from 'three'
import { getZoneRoad } from '../../world/roadSamples'
import { makeTextPanel } from '../../world/textPanel'
import { terrainHeightAt } from './villageField'
import { VILLAGE_SIGNS } from '../../../content'

/**
 * The village tells the origin story: small rural hoardings carry real
 * journey lines ("it all started with no-code gigs…") and little
 * hand-painted markers keep the quirk between them. Posts stand BEHIND
 * the panels (owner: they poked out over the face) and every board gets
 * an emissive lift so the dawn shade never swallows the paint.
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

  VILLAGE_SIGNS.forEach((sign, i) => {
    const m = 35 + (i * (road.zoneMeters - 80)) / (VILLAGE_SIGNS.length - 1)
    const side = i % 2 === 0 ? -1 : 1
    const s = road.at(m)
    const big = sign.big === true
    road.place(m, (big ? 7.0 : 5.35) * side, pos)
    const y = terrainHeightAt(pos.x, pos.z)
    const yaw = Math.atan2(s.tx, s.tz) + Math.PI + side * (big ? 0.26 : 0.18)
    // the board's facing direction — posts hide a step behind it
    const fx = Math.sin(yaw)
    const fz = Math.cos(yaw)

    const panelW = big ? 5.6 : 2.3
    const panelH = big ? 2.35 : 1.06
    const panelY = big ? 3.0 : 1.72

    const tex = makeTextPanel({
      title: sign.text,
      sub: sign.sub,
      bg: big ? '#ecdfbe' : '#f2ead2',
      fg: '#241c12',
      border: big ? '#b0492e' : '#6b5a40',
      bleach: big ? 0.18 : 0.12,
      w: big ? 1024 : 512,
      h: big ? 430 : 236,
    })
    const board = new Mesh(
      new PlaneGeometry(panelW, panelH),
      new MeshStandardMaterial({
        map: tex,
        // dawn shade swallowed the paint — let the board carry its own light
        emissive: '#ffffff',
        emissiveMap: tex,
        emissiveIntensity: 0.42,
        roughness: 0.88,
      }),
    )
    board.position.set(pos.x, y + panelY, pos.z)
    board.rotation.y = yaw
    board.rotation.z = (i % 2 === 0 ? 1 : -1) * (big ? 0.012 : 0.025) // hand-hung
    board.castShadow = big
    const back = new Mesh(new PlaneGeometry(panelW + 0.1, panelH + 0.1), BACK_MAT)
    back.position.copy(board.position)
    back.rotation.copy(board.rotation)
    back.translateZ(-0.03)

    // twin posts BEHIND the panel (plane local X is horizontal), their tops
    // tucked under the board's upper edge
    const postTop = y + panelY + panelH * 0.28
    for (const off of [-panelW * 0.38, panelW * 0.38]) {
      const post = new Mesh(POST_GEO, POST_MAT)
      const h = postTop - y
      post.position.set(
        pos.x + Math.cos(yaw) * off - fx * 0.12,
        y + h / 2,
        pos.z - Math.sin(yaw) * off - fz * 0.12,
      )
      post.scale.set(big ? 1.6 : 1, h, big ? 1.6 : 1)
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
