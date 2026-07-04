import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { BoxGeometry, Color, InstancedMesh, MeshStandardMaterial, Object3D } from 'three'
import { getZoneRoad } from '../../world/roadSamples'
import { createRng, rngRange } from '../../../utils/random'

/**
 * Oncoming traffic in the opposite lane — the cheapest possible highway
 * life (ambient mover + speed cue). Time-driven, loops through the zone;
 * simple boxes at distance, dusty Indian truck/car palette.
 */

const ZONE = 3
const COUNT = 9
const LANE = -2.3 // oncoming lane (left-hand traffic)

const BODY_GEO = new BoxGeometry(1, 1, 1)
const BODY_MAT = new MeshStandardMaterial({ roughness: 0.6, metalness: 0.25 })
const DARK_MAT = new MeshStandardMaterial({ color: '#2a2a2c', roughness: 0.9 })

interface Unit {
  truck: boolean
  speed: number
  phase: number
  color: Color
  w: number
  h: number
  l: number
  cabH: number
}

const dummy = new Object3D()

export function Traffic() {
  const bodiesRef = useRef<InstancedMesh | null>(null)
  const cabsRef = useRef<InstancedMesh | null>(null)
  const chassisRef = useRef<InstancedMesh>(null)

  const units = useMemo<Unit[]>(() => {
    const rng = createRng(4370)
    const palette = ['#c9c2b2', '#a34e3a', '#5b7a8c', '#b8973e', '#7d8a70', '#c9c2b2']
    return Array.from({ length: COUNT }, (_, i) => {
      const truck = rng() < 0.4
      return {
        truck,
        speed: rngRange(rng, 14, 24),
        phase: (i / COUNT) * 1 + rngRange(rng, -0.04, 0.04),
        color: new Color(palette[i % palette.length]).multiplyScalar(0.85 + rng() * 0.3),
        w: truck ? 2.2 : 1.7,
        h: truck ? rngRange(rng, 2.2, 2.7) : 1.15,
        l: truck ? rngRange(rng, 5.5, 7) : 4.1,
        cabH: truck ? 1.9 : 0.62,
      }
    })
  }, [])

  useFrame(({ clock }) => {
    const bodies = bodiesRef.current
    const cabs = cabsRef.current
    const chassis = chassisRef.current
    if (!bodies || !cabs || !chassis) return
    const road = getZoneRoad(ZONE)
    const t = clock.elapsedTime

    units.forEach((u, i) => {
      // oncoming: marches from zone end toward zone start
      const cycle = ((t * u.speed) / road.zoneMeters + u.phase) % 1
      const m = road.zoneMeters * (1 - cycle)
      const s = road.at(m)
      const yaw = Math.atan2(-s.tx, -s.tz) // facing back down the road
      const x = s.x + s.rx * LANE
      const z = s.z + s.rz * LANE

      dummy.position.set(x, s.y + 0.55 + u.h / 2, z)
      dummy.rotation.set(0, yaw, 0)
      dummy.scale.set(u.w, u.h, u.l)
      dummy.updateMatrix()
      bodies.setMatrixAt(i, dummy.matrix)

      // truck cab in front / car cabin on top
      dummy.position.set(x, s.y + 0.55 + (u.truck ? u.cabH / 2 : u.h + u.cabH / 2 - 0.1), z)
      dummy.rotation.set(0, yaw, 0)
      dummy.scale.set(u.w * 0.92, u.cabH, u.truck ? 1.6 : u.l * 0.5)
      dummy.updateMatrix()
      if (u.truck) dummy.position.y = s.y + 0.55 + u.cabH / 2
      dummy.updateMatrix()
      cabs.setMatrixAt(i, dummy.matrix)
      if (u.truck) {
        // nudge the cab out past the cargo box
        const fwdX = -s.tx
        const fwdZ = -s.tz
        dummy.position.set(
          x + fwdX * (u.l / 2 + 0.7),
          s.y + 0.5 + u.cabH / 2,
          z + fwdZ * (u.l / 2 + 0.7),
        )
        dummy.updateMatrix()
        cabs.setMatrixAt(i, dummy.matrix)
      }

      dummy.position.set(x, s.y + 0.3, z)
      dummy.rotation.set(0, yaw, 0)
      dummy.scale.set(u.w * 0.9, 0.5, u.l * 0.94)
      dummy.updateMatrix()
      chassis.setMatrixAt(i, dummy.matrix)
    })
    bodies.instanceMatrix.needsUpdate = true
    cabs.instanceMatrix.needsUpdate = true
    chassis.instanceMatrix.needsUpdate = true
  })

  // colors set once
  const setColors = (mesh: InstancedMesh | null) => {
    if (!mesh) return
    units.forEach((u, i) => mesh.setColorAt(i, u.color))
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true
  }

  return (
    <group>
      <instancedMesh
        ref={(m) => {
          bodiesRef.current = m
          setColors(m)
        }}
        args={[BODY_GEO, BODY_MAT, COUNT]}
        castShadow
      />
      <instancedMesh
        ref={(m) => {
          cabsRef.current = m
          setColors(m)
        }}
        args={[BODY_GEO, BODY_MAT, COUNT]}
      />
      <instancedMesh ref={chassisRef} args={[BODY_GEO, DARK_MAT, COUNT]} />
    </group>
  )
}
