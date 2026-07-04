import { useMemo } from 'react'
import { Color } from 'three'
import { InstancedProps, type PropInstance } from '../../world/Instanced'
import { villageArt } from './config'
import { getVillageLayout, terrainHeightAt } from './villageField'

/**
 * Village huts: instanced mud-plaster walls, pyramid roofs (terracotta or
 * thatch), and a dark door quad facing the road. Three instanced draws.
 */
export function Huts() {
  const { walls, roofs, doors } = useMemo(() => {
    const layout = getVillageLayout()
    const art = villageArt.huts
    const wallColors = [new Color(art.wallA), new Color(art.wallB), new Color(art.wallC)]
    const roofColors = [new Color(art.roofTerracotta), new Color(art.roofThatch)]
    const doorColor = new Color(art.door)

    const walls: PropInstance[] = []
    const roofs: PropInstance[] = []
    const doors: PropInstance[] = []
    for (const h of layout.huts) {
      const y = terrainHeightAt(h.x, h.z)
      const jitter = 0.92 + h.colorJitter * 0.16
      walls.push({
        x: h.x,
        y: y + h.wallH / 2,
        z: h.z,
        rotY: h.rotY,
        sx: h.w,
        sy: h.wallH,
        sz: h.d,
        color: wallColors[Math.floor(h.colorJitter * wallColors.length) % wallColors.length]
          .clone()
          .multiplyScalar(jitter),
      })
      roofs.push({
        x: h.x,
        y: y + h.wallH + h.roofH / 2,
        z: h.z,
        rotY: h.rotY + Math.PI / 4, // 4-sided cone → pyramid aligned to walls
        sx: h.w * 0.82,
        sy: h.roofH,
        sz: h.d * 0.82,
        color: roofColors[h.roofKind].clone().multiplyScalar(jitter),
      })
      // door on the +Z face (the face rotY points toward the road)
      const doorH = Math.min(1.7, h.wallH * 0.72)
      const dx = Math.sin(h.rotY) * (h.d / 2 + 0.02)
      const dz = Math.cos(h.rotY) * (h.d / 2 + 0.02)
      doors.push({
        x: h.x + dx,
        y: y + doorH / 2,
        z: h.z + dz,
        rotY: h.rotY,
        sx: 0.72,
        sy: doorH,
        sz: 0.06,
        color: doorColor,
      })
    }
    return { walls, roofs, doors }
  }, [])

  return (
    <group>
      <InstancedProps items={walls} castShadow>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial roughness={0.92} />
      </InstancedProps>
      <InstancedProps items={roofs} castShadow>
        {/* radius chosen so the square footprint circumscribes the walls */}
        <coneGeometry args={[0.85, 1, 4]} />
        <meshStandardMaterial roughness={0.95} flatShading />
      </InstancedProps>
      <InstancedProps items={doors}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial roughness={0.9} />
      </InstancedProps>
    </group>
  )
}
