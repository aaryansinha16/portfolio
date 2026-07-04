import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { BufferAttribute, BufferGeometry, DoubleSide, InstancedMesh, Object3D } from 'three'
import { villageArt } from './config'
import { getVillageLayout } from './villageField'

/**
 * Dawn birds (ambient mover #2): a dozen instanced "V" silhouettes riding
 * slow elliptical paths over the fields, wing-beat faked by squashing the
 * instance vertically. Cheap: 12 matrix writes a frame.
 */

const COUNT = 12

interface BirdPath {
  cx: number
  cy: number
  cz: number
  radius: number
  speed: number
  phase: number
  bob: number
}

export function Birds() {
  const meshRef = useRef<InstancedMesh>(null)
  const dummy = useMemo(() => new Object3D(), [])

  const geometry = useMemo(() => {
    // shallow V: two triangles, ~0.9m span
    const geo = new BufferGeometry()
    // prettier-ignore
    const verts = new Float32Array([
      // left wing
      0, 0, 0.14,   -0.45, 0.1, -0.06,   0, 0.02, -0.1,
      // right wing
      0, 0, 0.14,   0, 0.02, -0.1,   0.45, 0.1, -0.06,
    ])
    geo.setAttribute('position', new BufferAttribute(verts, 3))
    geo.computeVertexNormals()
    return geo
  }, [])

  const paths = useMemo<BirdPath[]>(() => {
    const { birdAnchors } = getVillageLayout()
    const paths: BirdPath[] = []
    for (let i = 0; i < COUNT; i++) {
      const anchor = birdAnchors[i % birdAnchors.length]
      paths.push({
        cx: anchor.x + (i % 5) * 6 - 12,
        cy: anchor.y + (i % 3) * 4,
        cz: anchor.z + (i % 4) * 7 - 14,
        radius: 14 + (i % 4) * 7,
        speed: 0.14 + (i % 3) * 0.05,
        phase: i * 1.7,
        bob: 2 + (i % 3),
      })
    }
    return paths
  }, [])

  useFrame(({ clock }) => {
    const mesh = meshRef.current
    if (!mesh) return
    const t = clock.elapsedTime
    for (let i = 0; i < COUNT; i++) {
      const b = paths[i]
      const a = t * b.speed + b.phase
      const x = b.cx + Math.cos(a) * b.radius
      const z = b.cz + Math.sin(a) * b.radius
      const y = b.cy + Math.sin(a * 0.7) * b.bob
      dummy.position.set(x, y, z)
      // heading = path tangent
      dummy.rotation.set(0, Math.atan2(-Math.sin(a), Math.cos(a)) + Math.PI / 2, 0)
      const flap = 0.55 + 0.45 * Math.sin(t * 9 + b.phase * 3)
      dummy.scale.set(1, flap, 1)
      dummy.updateMatrix()
      mesh.setMatrixAt(i, dummy.matrix)
    }
    mesh.instanceMatrix.needsUpdate = true
  })

  return (
    <instancedMesh ref={meshRef} args={[geometry, undefined, COUNT]} frustumCulled={false}>
      <meshStandardMaterial color={villageArt.birds.color} roughness={1} side={DoubleSide} />
    </instancedMesh>
  )
}
