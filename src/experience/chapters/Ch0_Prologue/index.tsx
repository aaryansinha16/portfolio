import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { InstancedMesh, MeshBasicMaterial, Object3D, SphereGeometry, Vector3 } from 'three'
import { GreyboxBiome } from '../GreyboxBiome'
import { prologueConfig } from './config'
import { getZoneRoad } from '../../world/roadSamples'
import { createRng, rngRange } from '../../../utils/random'

/**
 * Chapter 0 — Prologue, pre-dawn. The sleeping village greybox stays as
 * silhouettes; fireflies drift over the roadside grass (ambient mover),
 * and the first scroll is the ignition beat — the headlight pool turns on
 * (see HeadlightPool). Audio ignition lands with Phase 6.
 */

const FIREFLY_COUNT = 22
const FIREFLY_GEO = new SphereGeometry(0.05, 5, 4)
// unlit media — they ARE the light
const FIREFLY_MAT = new MeshBasicMaterial({ color: '#ffd9a0' })
const dummy = new Object3D()

function Fireflies() {
  const meshRef = useRef<InstancedMesh>(null)
  const seeds = useMemo(() => {
    const road = getZoneRoad(0)
    const rng = createRng(4000)
    const p = new Vector3()
    return Array.from({ length: FIREFLY_COUNT }, (_, i) => {
      const m = rngRange(rng, 10, road.zoneMeters + 60)
      road.place(m, rngRange(rng, 5, 26) * (i % 2 === 0 ? -1 : 1), p)
      return {
        x: p.x,
        y: p.y + rngRange(rng, 0.4, 1.6),
        z: p.z,
        r: rngRange(rng, 0.5, 2.2),
        speed: rngRange(rng, 0.3, 0.9),
        phase: rng() * Math.PI * 2,
      }
    })
  }, [])

  useFrame(({ clock }) => {
    const mesh = meshRef.current
    if (!mesh) return
    const t = clock.elapsedTime
    seeds.forEach((f, i) => {
      const a = t * f.speed + f.phase
      // slow wander + soft on/off pulse
      dummy.position.set(
        f.x + Math.sin(a) * f.r + Math.sin(a * 2.7) * 0.3,
        f.y + Math.sin(a * 1.7) * 0.5,
        f.z + Math.cos(a * 0.8) * f.r,
      )
      const pulse = Math.max(0.001, 0.4 + 0.6 * Math.sin(a * 2.2 + f.phase))
      dummy.scale.setScalar(pulse)
      dummy.updateMatrix()
      mesh.setMatrixAt(i, dummy.matrix)
    })
    mesh.instanceMatrix.needsUpdate = true
  })

  return (
    <instancedMesh
      ref={meshRef}
      args={[FIREFLY_GEO, FIREFLY_MAT, FIREFLY_COUNT]}
      frustumCulled={false}
    />
  )
}

export default function Ch0_Prologue() {
  return (
    <group>
      <GreyboxBiome zone={0} config={prologueConfig} />
      <Fireflies />
    </group>
  )
}
