import { useMemo } from 'react'
import { BufferAttribute, Color, MeshStandardMaterial, PlaneGeometry } from 'three'
import { villageArt } from './config'
import { fbm, fieldFromFrame, getVillageLayout, heightFromFrame, nearestRoad } from './villageField'
import { clamp01, smoothstep } from '../../../utils/math'

/**
 * Rolling flat-shaded terrain for the village: displaced by the shared
 * height field (flat corridor around the road), vertex-colored with
 * earth/sage patches, worn road shoulders, and the mustard/green field
 * rectangles baked straight into the colors — rows and all. One draw call.
 *
 * Built once and module-cached (one nearestRoad scan per vertex serves
 * height + field + shoulder) — remounting the chapter costs nothing.
 */

let terrainGeo: PlaneGeometry | null = null
const terrainMat = new MeshStandardMaterial({
  vertexColors: true,
  flatShading: true,
  roughness: 1,
  metalness: 0,
})

function getTerrainGeometry(): PlaneGeometry {
  if (terrainGeo) return terrainGeo

  const { bounds } = getVillageLayout()
  const w = bounds.maxX - bounds.minX
  const l = bounds.maxZ - bounds.minZ
  const cx = (bounds.minX + bounds.maxX) / 2
  const cz = (bounds.minZ + bounds.maxZ) / 2
  const segX = Math.min(200, Math.round(w / 3.2))
  const segZ = Math.min(260, Math.round(l / 3.2))

  const geo = new PlaneGeometry(w, l, segX, segZ)
  geo.rotateX(-Math.PI / 2)
  geo.translate(cx, 0, cz)

  const art = villageArt.terrain
  const earth = new Color(art.earth)
  const sage = new Color(art.sage)
  const shoulder = new Color(art.shoulder)
  const palette = {
    mustard: { base: new Color(art.mustardField), row: new Color(art.mustardRow) },
    green: { base: new Color(art.greenField), row: new Color(art.greenRow) },
  }

  const pos = geo.getAttribute('position')
  const colors = new Float32Array(pos.count * 3)
  const c = new Color()

  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i)
    const z = pos.getZ(i)
    const frame = nearestRoad(x, z)
    pos.setY(i, heightFromFrame(frame, x, z))

    // base: earth↔sage patches on coarse noise
    const patch = smoothstep(clamp01((fbm(x * 0.012, z * 0.012, 505, 2) - 0.42) * 3.2))
    c.lerpColors(earth, sage, patch)

    // fields override, with plough rows running parallel to the road
    const hit = fieldFromFrame(frame)
    if (hit) {
      const p = palette[hit.field.kind]
      const row = 0.5 + 0.5 * Math.sin((hit.off * (Math.PI * 2)) / 2.3)
      c.lerpColors(p.base, p.row, row * 0.55)
    }

    // worn dusty shoulder hugging the asphalt
    const shoulderT = 1 - smoothstep(clamp01((frame.d - 4.4) / 4.5))
    if (shoulderT > 0) c.lerp(shoulder, shoulderT * 0.85)

    // per-vertex value jitter (imperfection rule)
    const j = 0.94 + fbm(x * 0.35, z * 0.35, 909, 1) * 0.12
    colors[i * 3] = c.r * j
    colors[i * 3 + 1] = c.g * j
    colors[i * 3 + 2] = c.b * j
  }

  geo.setAttribute('color', new BufferAttribute(colors, 3))
  geo.computeVertexNormals()
  terrainGeo = geo
  return geo
}

export function VillageTerrain() {
  const geometry = useMemo(getTerrainGeometry, [])
  return <mesh geometry={geometry} material={terrainMat} receiveShadow dispose={null} />
}
