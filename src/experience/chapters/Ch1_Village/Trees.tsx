import { useMemo } from 'react'
import {
  Color,
  CylinderGeometry,
  Group,
  IcosahedronGeometry,
  InstancedMesh,
  MeshStandardMaterial,
  Object3D,
} from 'three'
import { villageArt } from './config'
import { getVillageLayout, terrainHeightAt } from './villageField'

/**
 * Low-poly trees: 5-sided trunks + faceted icosahedron canopies, two
 * instanced draws with per-instance color/scale jitter. Built once,
 * module-cached — chapter remounts just re-attach the group.
 */

const TRUNK_GEO = new CylinderGeometry(0.55, 0.75, 1, 5)
const CANOPY_GEO = new IcosahedronGeometry(1, 0)
const TRUNK_MAT = new MeshStandardMaterial({ roughness: 0.95, flatShading: true })
const CANOPY_MAT = new MeshStandardMaterial({ roughness: 0.9, flatShading: true })

let cachedGroup: Group | null = null

function getTreesGroup(): Group {
  if (cachedGroup) return cachedGroup

  const layout = getVillageLayout()
  const art = villageArt.trees
  const trunkColor = new Color(art.trunk)
  const a = new Color(art.canopyA)
  const b = new Color(art.canopyB)
  const warm = new Color(art.canopyC)
  const dummy = new Object3D()
  const c = new Color()

  const trunks = new InstancedMesh(TRUNK_GEO, TRUNK_MAT, layout.trees.length)
  const canopies = new InstancedMesh(CANOPY_GEO, CANOPY_MAT, layout.trees.length)
  layout.trees.forEach((t, i) => {
    const y = terrainHeightAt(t.x, t.z)
    dummy.position.set(t.x, y + t.trunkH / 2, t.z)
    dummy.rotation.set(0, t.rotY, 0)
    dummy.scale.set(t.trunkR, t.trunkH, t.trunkR)
    dummy.updateMatrix()
    trunks.setMatrixAt(i, dummy.matrix)
    trunks.setColorAt(i, c.copy(trunkColor).multiplyScalar(t.jitter))

    dummy.position.set(t.x, y + t.trunkH + t.canopyH * 0.42, t.z)
    dummy.scale.set(t.canopyR, t.canopyH, t.canopyR)
    dummy.updateMatrix()
    canopies.setMatrixAt(i, dummy.matrix)
    c.lerpColors(a, b, t.colorMix)
    if (t.colorMix > 0.72) c.lerp(warm, (t.colorMix - 0.72) * 2.4)
    canopies.setColorAt(i, c.multiplyScalar(t.jitter))
  })
  for (const mesh of [trunks, canopies]) {
    mesh.instanceMatrix.needsUpdate = true
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true
    mesh.castShadow = true
    mesh.receiveShadow = true
    mesh.computeBoundingSphere()
  }

  cachedGroup = new Group().add(trunks, canopies)
  return cachedGroup
}

export function Trees() {
  const group = useMemo(getTreesGroup, [])
  return <primitive object={group} dispose={null} />
}
