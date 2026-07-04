import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import {
  BufferAttribute,
  BufferGeometry,
  DoubleSide,
  InstancedMesh,
  Object3D,
  Vector3,
} from 'three'

/**
 * Instanced "V" silhouettes riding slow elliptical paths — the shared
 * ambient flock (village sparrows, highway kites, town pigeons). Wing-beat
 * faked by squashing the instance vertically. A few matrix writes a frame.
 */

interface BirdFlockProps {
  anchors: readonly Vector3[]
  count?: number
  color?: string
  /** wing span multiplier — kites soar bigger than sparrows */
  scale?: number
  /** path speed multiplier — raptors circle lazily */
  speed?: number
  /** wing-beat rate multiplier */
  flapRate?: number
}

let sharedGeo: BufferGeometry | null = null
function getBirdGeometry(): BufferGeometry {
  if (sharedGeo) return sharedGeo
  const geo = new BufferGeometry()
  // prettier-ignore
  const verts = new Float32Array([
    0, 0, 0.14,   -0.45, 0.1, -0.06,   0, 0.02, -0.1,
    0, 0, 0.14,    0, 0.02, -0.1,      0.45, 0.1, -0.06,
  ])
  geo.setAttribute('position', new BufferAttribute(verts, 3))
  geo.computeVertexNormals()
  sharedGeo = geo
  return geo
}

export function BirdFlock({
  anchors,
  count = 12,
  color = '#241f1a',
  scale = 1,
  speed = 1,
  flapRate = 1,
}: BirdFlockProps) {
  const meshRef = useRef<InstancedMesh>(null)
  const dummy = useMemo(() => new Object3D(), [])

  const paths = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => {
        const anchor = anchors[i % anchors.length]
        return {
          cx: anchor.x + (i % 5) * 6 - 12,
          cy: anchor.y + (i % 3) * 4,
          cz: anchor.z + (i % 4) * 7 - 14,
          radius: (14 + (i % 4) * 7) * scale,
          speed: (0.14 + (i % 3) * 0.05) * speed,
          phase: i * 1.7,
          bob: 2 + (i % 3),
        }
      }),
    [anchors, count, scale, speed],
  )

  useFrame(({ clock }) => {
    const mesh = meshRef.current
    if (!mesh) return
    const t = clock.elapsedTime
    for (let i = 0; i < count; i++) {
      const b = paths[i]
      const a = t * b.speed + b.phase
      dummy.position.set(
        b.cx + Math.cos(a) * b.radius,
        b.cy + Math.sin(a * 0.7) * b.bob,
        b.cz + Math.sin(a) * b.radius,
      )
      dummy.rotation.set(0, Math.atan2(-Math.sin(a), Math.cos(a)) + Math.PI / 2, 0)
      const flap = 0.55 + 0.45 * Math.sin(t * 9 * flapRate + b.phase * 3)
      dummy.scale.set(scale, flap * scale, scale)
      dummy.updateMatrix()
      mesh.setMatrixAt(i, dummy.matrix)
    }
    mesh.instanceMatrix.needsUpdate = true
  })

  return (
    <instancedMesh ref={meshRef} args={[getBirdGeometry(), undefined, count]} frustumCulled={false}>
      <meshStandardMaterial color={color} roughness={1} side={DoubleSide} />
    </instancedMesh>
  )
}
