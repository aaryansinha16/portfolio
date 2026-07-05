import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { InstancedMesh, MeshBasicMaterial, Object3D, SphereGeometry, Vector3 } from 'three'
import { FarSilhouettes } from '../GreyboxBiome'
import { neonConfig } from './config'
import { FLICKER_MATS, getNeonStatics, getNeonSteamAnchors } from './neonField'
import { PuffColumn } from '../../world/PuffColumn'
import { getZoneRoad } from '../../world/roadSamples'
import { ProjectBillboards } from '../../detours/ProjectBillboards'

/** Random-telegraph flicker for the two designated neon materials. */
function NeonFlicker() {
  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    // buzzy tube: mostly on, drops out in bursts
    const a = Math.sin(t * 31) * Math.sin(t * 7.3) > -0.82 ? 2.0 : 0.25
    // dying tube: struggles, pops
    const b = Math.sin(t * 17 + 2) * Math.sin(t * 3.1) * Math.sin(t * 53) > -0.5 ? 1.8 : 0.1
    FLICKER_MATS[0].emissiveIntensity = a
    FLICKER_MATS[1].emissiveIntensity = b
  })
  return null
}

const DRONE_GEO = new SphereGeometry(0.16, 6, 5)
const DRONE_MAT = new MeshBasicMaterial({ color: '#ff4a5e' })
const droneDummy = new Object3D()

/** Slow blinking lights crossing the sky — the AI era has traffic up there too. */
function Drones() {
  const meshRef = useRef<InstancedMesh>(null)
  const paths = useMemo(() => {
    const road = getZoneRoad(5)
    const p = new Vector3()
    return [0.25, 0.5, 0.75].map((f, i) => {
      road.place(road.zoneMeters * f, 0, p)
      return {
        ax: p.x - 90,
        az: p.z - 30 + i * 25,
        bx: p.x + 90,
        bz: p.z + 20 - i * 18,
        y: 34 + i * 7,
        speed: 0.02 + i * 0.008,
        phase: i * 0.4,
      }
    })
  }, [])

  useFrame(({ clock }) => {
    const mesh = meshRef.current
    if (!mesh) return
    const t = clock.elapsedTime
    paths.forEach((p, i) => {
      const k = (t * p.speed + p.phase) % 1
      const x = p.ax + (p.bx - p.ax) * k
      const z = p.az + (p.bz - p.az) * k
      const blink = Math.sin(t * 6 + i * 2) > 0 ? 1 : 0.25
      droneDummy.position.set(x, p.y, z)
      droneDummy.scale.setScalar(blink)
      droneDummy.updateMatrix()
      mesh.setMatrixAt(i, droneDummy.matrix)
    })
    mesh.instanceMatrix.needsUpdate = true
  })

  return (
    <instancedMesh
      ref={meshRef}
      args={[DRONE_GEO, DRONE_MAT, paths.length]}
      frustumCulled={false}
    />
  )
}

/**
 * Chapter 5 — Neon Night. Dark towers with sparse cool windows, neon strips
 * (some flickering), the four AI-project signs in glowing tube text, wet-road
 * streaks, street steam, drones crossing the sky.
 */
export default function Ch5_Neon() {
  const statics = useMemo(getNeonStatics, [])
  const steam = useMemo(getNeonSteamAnchors, [])
  return (
    <group>
      <primitive object={statics} dispose={null} />
      <NeonFlicker />
      <Drones />
      <ProjectBillboards />
      {steam.length > 0 && (
        <PuffColumn anchors={steam} color="#5a6a8a" opacity={0.2} rise={5} rate={0.14} size={1.4} />
      )}
      <FarSilhouettes zone={5} config={neonConfig} />
    </group>
  )
}
