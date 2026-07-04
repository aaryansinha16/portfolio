import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { InstancedMesh, MeshBasicMaterial, Object3D, Vector3 } from 'three'
import { pointAt, tangentAt, totalLength } from '../spline/roadPath'
import { frameEnv, vehicleProgressAt } from '../atmosphere/ColorScript'
import { useJourney } from '../../state/useJourney'
import { clamp01, smoothstep } from '../../utils/math'
import { makePuffTexture } from '../world/puffTexture'

/**
 * Dust kicked up behind the protagonist at speed (plan Phase 3: vehicle
 * feel). Billboarded puffs, amplitude tied to scroll velocity, tinted by
 * the chapter's air (fog color) so it grades with the ColorScript.
 * Unlit media — basic material is deliberate; it still fogs + tone-maps.
 */

const COUNT = 14
const dummy = new Object3D()
const _tangent = new Vector3()

export function DustTrail() {
  const meshRef = useRef<InstancedMesh>(null)
  const wasLive = useRef(true)
  const material = useMemo(
    () =>
      new MeshBasicMaterial({
        map: makePuffTexture(),
        transparent: true,
        opacity: 0.2,
        depthWrite: false,
      }),
    [],
  )

  useFrame(({ clock, camera }) => {
    const mesh = meshRef.current
    if (!mesh) return
    const { splineProgress, velocity } = useJourney.getState()
    const intensity = clamp01((velocity - 25) / 90)

    if (intensity <= 0.01) {
      // collapse once, then skip the work entirely while idle
      if (wasLive.current) {
        for (let i = 0; i < COUNT; i++) {
          dummy.position.set(0, -50, 0)
          dummy.scale.setScalar(0.0001)
          dummy.updateMatrix()
          mesh.setMatrixAt(i, dummy.matrix)
        }
        mesh.instanceMatrix.needsUpdate = true
        wasLive.current = false
      }
      return
    }
    wasLive.current = true

    material.color.copy(frameEnv.fogColor).multiplyScalar(1.08)

    const p = vehicleProgressAt(splineProgress)
    const t = clock.elapsedTime
    for (let i = 0; i < COUNT; i++) {
      const life = (t * 0.85 + i / COUNT) % 1
      const back = 1.6 + life * 8
      const pBack = p - back / totalLength
      pointAt(pBack, dummy.position)
      tangentAt(pBack, _tangent)
      const sway = Math.sin(i * 7.31) * (0.35 + life * 1.3)
      dummy.position.x += -_tangent.z * sway
      dummy.position.z += _tangent.x * sway
      dummy.position.y += 0.12 + life * 1.15 * intensity
      const die = 1 - smoothstep((life - 0.7) / 0.3)
      const s = (0.5 + life * 2.1) * intensity * die
      dummy.quaternion.copy(camera.quaternion)
      dummy.scale.setScalar(Math.max(s, 0.0001))
      dummy.updateMatrix()
      mesh.setMatrixAt(i, dummy.matrix)
    }
    mesh.instanceMatrix.needsUpdate = true
  })

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, COUNT]} frustumCulled={false}>
      <planeGeometry args={[1.4, 1.4]} />
      <primitive object={material} attach="material" />
    </instancedMesh>
  )
}
