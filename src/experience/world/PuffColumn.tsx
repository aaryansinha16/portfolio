import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { InstancedMesh, Object3D, Vector3 } from 'three'
import { makePuffTexture } from './puffTexture'

/**
 * Soft billboarded puffs rising from anchor points — chimney smoke, chai
 * stalls, exhaust stacks. Fade-out is done by scale under a constant low
 * material opacity (per-instance opacity isn't a thing). Unlit media —
 * basic material is deliberate; it still fogs and tone-maps.
 */

interface PuffColumnProps {
  anchors: readonly Vector3[]
  puffsPerAnchor?: number
  color?: string
  opacity?: number
  /** climb height in meters over one loop */
  rise?: number
  /** loop rate — higher = livelier column */
  rate?: number
  size?: number
}

const dummy = new Object3D()

export function PuffColumn({
  anchors,
  puffsPerAnchor = 7,
  color = '#c4b09a',
  opacity = 0.32,
  rise = 9,
  rate = 0.09,
  size = 1.6,
}: PuffColumnProps) {
  const meshRef = useRef<InstancedMesh>(null)
  const texture = useMemo(() => makePuffTexture(), [])
  const count = anchors.length * puffsPerAnchor

  useFrame(({ clock, camera }) => {
    const mesh = meshRef.current
    if (!mesh) return
    const t = clock.elapsedTime
    let i = 0
    for (let a = 0; a < anchors.length; a++) {
      const anchor = anchors[a]
      for (let p = 0; p < puffsPerAnchor; p++) {
        const life = (t * rate + p / puffsPerAnchor + a * 0.37) % 1
        const drift = Math.sin(life * 4.5 + a * 2.1 + p) * (0.4 + life * 1.6)
        dummy.position.set(anchor.x + drift, anchor.y + 0.3 + life * rise, anchor.z + drift * 0.4)
        dummy.quaternion.copy(camera.quaternion)
        const grow = 0.5 + life * 2.4
        const die = 1 - Math.max(0, (life - 0.8) / 0.2)
        dummy.scale.setScalar(Math.max(grow * die, 0.0001))
        dummy.updateMatrix()
        mesh.setMatrixAt(i++, dummy.matrix)
      }
    }
    mesh.instanceMatrix.needsUpdate = true
  })

  if (count === 0) return null
  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]} frustumCulled={false}>
      <planeGeometry args={[size, size]} />
      <meshBasicMaterial
        map={texture}
        color={color}
        transparent
        opacity={opacity}
        depthWrite={false}
      />
    </instancedMesh>
  )
}
