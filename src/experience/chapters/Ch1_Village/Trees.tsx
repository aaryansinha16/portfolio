import { useMemo } from 'react'
import { Color } from 'three'
import { InstancedProps, type PropInstance } from '../../world/Instanced'
import { villageArt } from './config'
import { getVillageLayout, terrainHeightAt } from './villageField'

/**
 * Low-poly trees: 5-sided trunks + faceted icosahedron canopies, two
 * instanced draws. Grove placement comes from villageField; every instance
 * carries scale/rotation/color jitter (imperfection rule).
 */
export function Trees() {
  const { trunks, canopies } = useMemo(() => {
    const layout = getVillageLayout()
    const art = villageArt.trees
    const trunkColor = new Color(art.trunk)
    const a = new Color(art.canopyA)
    const b = new Color(art.canopyB)
    const warm = new Color(art.canopyC)

    const trunks: PropInstance[] = []
    const canopies: PropInstance[] = []
    for (const t of layout.trees) {
      const y = terrainHeightAt(t.x, t.z)
      trunks.push({
        x: t.x,
        y: y + t.trunkH / 2,
        z: t.z,
        rotY: t.rotY,
        sx: t.trunkR,
        sy: t.trunkH,
        sz: t.trunkR,
        color: trunkColor.clone().multiplyScalar(t.jitter),
      })
      const canopy = new Color().lerpColors(a, b, t.colorMix)
      if (t.colorMix > 0.72) canopy.lerp(warm, (t.colorMix - 0.72) * 2.4)
      canopies.push({
        x: t.x,
        y: y + t.trunkH + t.canopyH * 0.42,
        z: t.z,
        rotY: t.rotY,
        sx: t.canopyR,
        sy: t.canopyH,
        sz: t.canopyR,
        color: canopy.multiplyScalar(t.jitter),
      })
    }
    return { trunks, canopies }
  }, [])

  return (
    <group>
      <InstancedProps items={trunks} castShadow>
        <cylinderGeometry args={[0.55, 0.75, 1, 5]} />
        <meshStandardMaterial roughness={0.95} flatShading />
      </InstancedProps>
      <InstancedProps items={canopies} castShadow>
        <icosahedronGeometry args={[1, 0]} />
        <meshStandardMaterial roughness={0.9} flatShading />
      </InstancedProps>
    </group>
  )
}
