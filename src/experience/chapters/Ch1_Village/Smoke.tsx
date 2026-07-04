import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { CanvasTexture, InstancedMesh, Object3D } from 'three'
import { villageArt } from './config'
import { getVillageLayout } from './villageField'

/**
 * Chimney smoke (ambient mover #3): soft billboarded puffs rising from the
 * hearth-hut of each cluster. Fade-out is done by scale (per-instance
 * opacity isn't a thing) under a constant low material opacity.
 * MeshBasicMaterial is deliberate here — smoke is unlit media, not world
 * geometry; it still fogs and tone-maps with the scene.
 */

const PUFFS_PER_ANCHOR = 7

function makePuffTexture(): CanvasTexture {
  const size = 64
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')!
  const grad = ctx.createRadialGradient(32, 32, 2, 32, 32, 30)
  grad.addColorStop(0, 'rgba(255,255,255,0.9)')
  grad.addColorStop(0.55, 'rgba(255,255,255,0.35)')
  grad.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, size, size)
  return new CanvasTexture(canvas)
}

export function Smoke() {
  const meshRef = useRef<InstancedMesh>(null)
  const dummy = useMemo(() => new Object3D(), [])
  const texture = useMemo(() => makePuffTexture(), [])
  const anchors = useMemo(() => getVillageLayout().smokeAnchors, [])
  const count = anchors.length * PUFFS_PER_ANCHOR

  useFrame(({ clock, camera }) => {
    const mesh = meshRef.current
    if (!mesh) return
    const t = clock.elapsedTime
    let i = 0
    for (let a = 0; a < anchors.length; a++) {
      const anchor = anchors[a]
      for (let p = 0; p < PUFFS_PER_ANCHOR; p++) {
        // staggered looping lifetime 0→1
        const life = (t * 0.09 + p / PUFFS_PER_ANCHOR + a * 0.37) % 1
        const rise = life * 9
        const drift = Math.sin(life * 4.5 + a * 2.1 + p) * (0.4 + life * 1.6)
        dummy.position.set(anchor.x + drift, anchor.y + 0.3 + rise, anchor.z + drift * 0.4)
        dummy.quaternion.copy(camera.quaternion) // billboard
        // grow, then shrink out at the top instead of fading
        const grow = 0.5 + life * 2.4
        const die = 1 - Math.max(0, (life - 0.8) / 0.2)
        const s = grow * die
        dummy.scale.set(s, s, s)
        dummy.updateMatrix()
        mesh.setMatrixAt(i++, dummy.matrix)
      }
    }
    mesh.instanceMatrix.needsUpdate = true
  })

  if (count === 0) return null
  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]} frustumCulled={false}>
      <planeGeometry args={[1.6, 1.6]} />
      <meshBasicMaterial
        map={texture}
        color={villageArt.smoke.color}
        transparent
        opacity={villageArt.smoke.opacity}
        depthWrite={false}
      />
    </instancedMesh>
  )
}
