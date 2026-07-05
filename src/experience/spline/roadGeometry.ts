import { BufferAttribute, BufferGeometry, Color, Vector3 } from 'three'
import { roadCurve, totalLength } from './roadPath'
import { createRng } from '../../utils/random'
import { zoneFloat } from '../atmosphere/ColorScript'
import { CHAPTERS } from '../chapters/registry'

export const ROAD_WIDTH = 8 // meters (CLAUDE.md units convention)
const ROAD_LIFT = 0.08 // sit clear above terrain — 3cm gaps shimmer at grazing angles

/**
 * Extrudes a flat ribbon along the road curve.
 * - UV v = meters along the road / ROAD_WIDTH (so textures/dashes tile in world units)
 * - Vertex colors carry the per-chapter asphalt tint (config roadTint,
 *   boundary-blended) times subtle per-row variation (DESIGN.md imperfection)
 * - Side vector stays horizontal so the deck keeps a readable surface on the
 *   finale climb (no banking baked into geometry; the camera banks instead).
 */
export function buildRoadGeometry(segments = 1600): BufferGeometry {
  const positions = new Float32Array((segments + 1) * 2 * 3)
  const normals = new Float32Array((segments + 1) * 2 * 3)
  const colors = new Float32Array((segments + 1) * 2 * 3)
  const uvs = new Float32Array((segments + 1) * 2 * 2)
  const indices = new Uint32Array(segments * 6)

  const point = new Vector3()
  const tangent = new Vector3()
  const side = new Vector3()
  const normal = new Vector3()
  const up = new Vector3(0, 1, 0)
  const rng = createRng(1337)
  const tints = CHAPTERS.map((c) => new Color(c.config.env.roadTint))
  const tint = new Color()

  for (let i = 0; i <= segments; i++) {
    const p = i / segments
    roadCurve.getPointAt(p, point)
    roadCurve.getTangentAt(p, tangent)

    side.crossVectors(up, tangent)
    side.y = 0
    if (side.lengthSq() < 1e-6) side.set(1, 0, 0)
    side.normalize()
    normal.crossVectors(tangent, side).normalize()
    if (normal.y < 0) normal.negate()

    const half = ROAD_WIDTH / 2
    const o = i * 6
    positions[o + 0] = point.x + side.x * half
    positions[o + 1] = point.y + ROAD_LIFT
    positions[o + 2] = point.z + side.z * half
    positions[o + 3] = point.x - side.x * half
    positions[o + 4] = point.y + ROAD_LIFT
    positions[o + 5] = point.z - side.z * half

    for (let k = 0; k < 2; k++) {
      normals[o + k * 3 + 0] = normal.x
      normals[o + k * 3 + 1] = normal.y
      normals[o + k * 3 + 2] = normal.z
    }

    // Chapter tint (boundary-blended) × subtle per-row wear variation.
    const zf = zoneFloat(p)
    const zi = Math.min(tints.length - 1, Math.floor(zf))
    const zj = Math.min(tints.length - 1, zi + 1)
    tint.lerpColors(tints[zi], tints[zj], zf - zi)
    const shade = 0.92 + rng() * 0.16
    for (let k = 0; k < 2; k++) {
      colors[o + k * 3 + 0] = tint.r * shade
      colors[o + k * 3 + 1] = tint.g * shade
      colors[o + k * 3 + 2] = tint.b * shade
    }

    const uo = i * 4
    const v = (p * totalLength) / ROAD_WIDTH
    uvs[uo + 0] = 0
    uvs[uo + 1] = v
    uvs[uo + 2] = 1
    uvs[uo + 3] = v

    if (i < segments) {
      const io = i * 6
      const a = i * 2
      indices[io + 0] = a
      indices[io + 1] = a + 1
      indices[io + 2] = a + 2
      indices[io + 3] = a + 1
      indices[io + 4] = a + 3
      indices[io + 5] = a + 2
    }
  }

  const geometry = new BufferGeometry()
  geometry.setAttribute('position', new BufferAttribute(positions, 3))
  geometry.setAttribute('normal', new BufferAttribute(normals, 3))
  geometry.setAttribute('color', new BufferAttribute(colors, 3))
  geometry.setAttribute('uv', new BufferAttribute(uvs, 2))
  geometry.setIndex(new BufferAttribute(indices, 1))
  return geometry
}
