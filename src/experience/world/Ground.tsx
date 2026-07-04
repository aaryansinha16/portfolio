import { useMemo } from 'react'
import { BufferAttribute, Color, PlaneGeometry, Vector3 } from 'three'
import { CHAPTER_MARKS, ZONE_COUNT, pointAt } from '../spline/roadPath'
import { CHAPTERS } from '../chapters/registry'
import { smoothstep, normRange } from '../../utils/math'

/**
 * One shared terrain plane under chapters 0–5, vertex-colored so the ground
 * tint belongs to each chapter's palette and blends across boundaries.
 * It ends before the finale climb — the circuit board floats in the void.
 */

const GROUND_END_Z = -2770 // just before the ramp; Ch6 brings its own board
const BLEND_METERS = 90

export function Ground() {
  const geometry = useMemo(() => {
    const width = 800
    const startZ = 80
    const length = startZ - GROUND_END_Z
    const rows = 160
    const geo = new PlaneGeometry(width, length, 2, rows)
    geo.rotateX(-Math.PI / 2)
    geo.translate(0, 0, startZ - length / 2)

    // World z where each zone starts, for mapping vertices to zone colors.
    const zoneStartZ: number[] = []
    const probe = new Vector3()
    for (let i = 0; i < ZONE_COUNT; i++) {
      zoneStartZ.push(pointAt(CHAPTER_MARKS[i], probe).z)
    }

    const zoneColors = CHAPTERS.map((c) => new Color(c.config.env.groundColor))
    const pos = geo.getAttribute('position')
    const colors = new Float32Array(pos.count * 3)
    const c = new Color()

    for (let i = 0; i < pos.count; i++) {
      const z = pos.getZ(i)
      // Zones run toward -z; find the zone this vertex sits in.
      let zone = 0
      for (let k = ZONE_COUNT - 1; k >= 1; k--) {
        if (z <= zoneStartZ[k]) {
          zone = k
          break
        }
      }
      c.copy(zoneColors[zone])
      // Blend toward the next zone near its start line.
      if (zone < ZONE_COUNT - 1) {
        const nextStart = zoneStartZ[zone + 1]
        const t = smoothstep(normRange(z, nextStart + BLEND_METERS, nextStart))
        if (t > 0) c.lerp(zoneColors[zone + 1], t * 0.5)
      }
      // And from the previous zone just after crossing.
      if (zone > 0) {
        const start = zoneStartZ[zone]
        const t = smoothstep(normRange(z, start - BLEND_METERS, start))
        if (t > 0) c.lerp(zoneColors[zone - 1], t * 0.5)
      }
      colors[i * 3] = c.r
      colors[i * 3 + 1] = c.g
      colors[i * 3 + 2] = c.b
    }
    geo.setAttribute('color', new BufferAttribute(colors, 3))
    return geo
  }, [])

  return (
    <mesh geometry={geometry} receiveShadow>
      <meshStandardMaterial vertexColors roughness={1} metalness={0} />
    </mesh>
  )
}
