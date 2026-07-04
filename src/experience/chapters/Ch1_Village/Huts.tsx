import { useMemo } from 'react'
import {
  BoxGeometry,
  Color,
  ConeGeometry,
  Group,
  InstancedMesh,
  MeshStandardMaterial,
  Object3D,
} from 'three'
import { villageArt } from './config'
import { getVillageLayout, terrainHeightAt } from './villageField'

/**
 * Village huts: instanced mud-plaster walls, pyramid roofs (terracotta or
 * thatch), and a dark door quad facing the road. Three instanced draws,
 * built once and module-cached.
 */

const WALL_GEO = new BoxGeometry(1, 1, 1)
// radius chosen so the square footprint circumscribes the walls
const ROOF_GEO = new ConeGeometry(0.85, 1, 4)
const WALL_MAT = new MeshStandardMaterial({ roughness: 0.92 })
const ROOF_MAT = new MeshStandardMaterial({ roughness: 0.95, flatShading: true })
const DOOR_MAT = new MeshStandardMaterial({ roughness: 0.9 })

let cachedGroup: Group | null = null

function getHutsGroup(): Group {
  if (cachedGroup) return cachedGroup

  const layout = getVillageLayout()
  const art = villageArt.huts
  const wallColors = [new Color(art.wallA), new Color(art.wallB), new Color(art.wallC)]
  const roofColors = [new Color(art.roofTerracotta), new Color(art.roofThatch)]
  const doorColor = new Color(art.door)
  const dummy = new Object3D()
  const c = new Color()
  const n = layout.huts.length

  const walls = new InstancedMesh(WALL_GEO, WALL_MAT, n)
  const roofs = new InstancedMesh(ROOF_GEO, ROOF_MAT, n)
  const doors = new InstancedMesh(WALL_GEO, DOOR_MAT, n)

  layout.huts.forEach((h, i) => {
    const y = terrainHeightAt(h.x, h.z)
    const jitter = 0.92 + h.colorJitter * 0.16

    dummy.position.set(h.x, y + h.wallH / 2, h.z)
    dummy.rotation.set(0, h.rotY, 0)
    dummy.scale.set(h.w, h.wallH, h.d)
    dummy.updateMatrix()
    walls.setMatrixAt(i, dummy.matrix)
    walls.setColorAt(
      i,
      c
        .copy(wallColors[Math.floor(h.colorJitter * wallColors.length) % wallColors.length])
        .multiplyScalar(jitter),
    )

    dummy.position.set(h.x, y + h.wallH + h.roofH / 2, h.z)
    dummy.rotation.set(0, h.rotY + Math.PI / 4, 0) // 4-sided cone → pyramid aligned to walls
    dummy.scale.set(h.w * 0.82, h.roofH, h.d * 0.82)
    dummy.updateMatrix()
    roofs.setMatrixAt(i, dummy.matrix)
    roofs.setColorAt(i, c.copy(roofColors[h.roofKind]).multiplyScalar(jitter))

    // door on the +Z face (the face rotY points toward the road)
    const doorH = Math.min(1.7, h.wallH * 0.72)
    dummy.position.set(
      h.x + Math.sin(h.rotY) * (h.d / 2 + 0.02),
      y + doorH / 2,
      h.z + Math.cos(h.rotY) * (h.d / 2 + 0.02),
    )
    dummy.rotation.set(0, h.rotY, 0)
    dummy.scale.set(0.72, doorH, 0.06)
    dummy.updateMatrix()
    doors.setMatrixAt(i, dummy.matrix)
    doors.setColorAt(i, doorColor)
  })

  walls.castShadow = true
  roofs.castShadow = true
  for (const mesh of [walls, roofs, doors]) {
    mesh.instanceMatrix.needsUpdate = true
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true
    mesh.receiveShadow = true
    mesh.computeBoundingSphere()
  }

  cachedGroup = new Group().add(walls, roofs, doors)
  return cachedGroup
}

export function Huts() {
  const group = useMemo(getHutsGroup, [])
  return <primitive object={group} dispose={null} />
}
