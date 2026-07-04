import { useLayoutEffect, useMemo, useRef } from 'react'
import { InstancedMesh, Object3D } from 'three'
import { buildRoadGeometry } from '../spline/roadGeometry'
import { metersToProgress, pointAt, tangentAt, totalLength } from '../spline/roadPath'
import { createScratch } from '../../utils/scratch'

/** The asphalt ribbon for the whole journey — one draw call. */
export function Road() {
  const geometry = useMemo(() => buildRoadGeometry(), [])
  return (
    <mesh geometry={geometry} receiveShadow>
      {/* white base — the per-chapter tint lives in the vertex colors */}
      <meshStandardMaterial color="#ffffff" vertexColors roughness={0.95} metalness={0} />
    </mesh>
  )
}

const DASH_EVERY = 9 // meters
const scratch = createScratch()
const dummy = new Object3D()

/** Instanced centerline dashes — cheap world-scale motion cue. */
export function Dashes() {
  const ref = useRef<InstancedMesh>(null)
  const count = Math.floor(totalLength / DASH_EVERY)

  useLayoutEffect(() => {
    const mesh = ref.current
    if (!mesh) return
    const { v1: point, v2: tangent } = scratch
    for (let i = 0; i < count; i++) {
      const p = metersToProgress(i * DASH_EVERY + DASH_EVERY / 2)
      pointAt(p, point)
      tangentAt(p, tangent)
      dummy.position.set(point.x, point.y + 0.07, point.z)
      dummy.rotation.set(0, Math.atan2(tangent.x, tangent.z), 0)
      // Tilt the dash to lie on the climb's slope.
      const pitch = Math.asin(Math.max(-1, Math.min(1, tangent.y)))
      dummy.rotation.x = -pitch
      dummy.scale.set(1, 1, 1)
      dummy.updateMatrix()
      mesh.setMatrixAt(i, dummy.matrix)
    }
    mesh.instanceMatrix.needsUpdate = true
    mesh.computeBoundingSphere()
  }, [count])

  return (
    <instancedMesh ref={ref} args={[undefined, undefined, count]}>
      <boxGeometry args={[0.18, 0.012, 2.6]} />
      <meshStandardMaterial color="#cfcabb" roughness={0.7} metalness={0} />
    </instancedMesh>
  )
}
