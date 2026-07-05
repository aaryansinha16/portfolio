import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import {
  DoubleSide,
  Group,
  MeshStandardMaterial,
  PlaneGeometry,
  Vector3,
  type WebGLProgramParametersWithUniforms,
} from 'three'
import { getZoneRoad } from '../../world/roadSamples'
import { makeTextPanel } from '../../world/textPanel'
import { PLANE_BANNER } from '../../../content'

/**
 * A little prop plane towing the banner over the highway (owner request) —
 * time-driven elliptical circuit, banner cloth waves via the same vertex
 * trick as the crops.
 */

let bannerShader: WebGLProgramParametersWithUniforms | null = null

// module singletons — per-mount materials leaked their CanvasTexture on
// chapter remounts (material.dispose never disposes .map)
let bannerMatCached: MeshStandardMaterial | null = null
function getBannerMaterial(): MeshStandardMaterial {
  if (bannerMatCached) return bannerMatCached
  const mat = new MeshStandardMaterial({
    map: makeTextPanel({
      title: PLANE_BANNER,
      bg: '#f2eddc',
      fg: '#26241f',
      border: '#c1442e',
      w: 1024,
      h: 128,
    }),
    side: DoubleSide,
    roughness: 0.9,
  })
  mat.onBeforeCompile = (shader) => {
    shader.uniforms.uTime = { value: 0 }
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nuniform float uTime;')
      .replace(
        '#include <begin_vertex>',
        `#include <begin_vertex>
        float tail = smoothstep(-7.0, 7.0, position.x);
        transformed.y += sin(uTime * 3.2 + position.x * 0.7) * 0.35 * tail;
        transformed.z += cos(uTime * 2.3 + position.x * 0.5) * 0.2 * tail;`,
      )
    bannerShader = shader
  }
  mat.customProgramCacheKey = () => 'banner-wave'
  bannerMatCached = mat
  return mat
}

export function BannerPlane() {
  const groupRef = useRef<Group>(null)

  const { center, bannerMat } = useMemo(() => {
    const road = getZoneRoad(3)
    const p = new Vector3()
    road.place(road.zoneMeters * 0.5, 0, p)
    return { center: p.clone(), bannerMat: getBannerMaterial() }
  }, [])

  useFrame(({ clock }) => {
    const group = groupRef.current
    if (!group) return
    const t = clock.elapsedTime
    if (bannerShader) bannerShader.uniforms.uTime.value = t
    const a = t * 0.055
    const rx = 210
    const rz = 150
    const x = center.x + Math.cos(a) * rx
    const z = center.z + Math.sin(a) * rz
    const y = 44 + Math.sin(a * 2.3) * 3
    group.position.set(x, y, z)
    // heading = path tangent
    const dx = -Math.sin(a) * rx
    const dz = Math.cos(a) * rz
    group.rotation.set(0, Math.atan2(dx, dz), Math.sin(a * 2.3) * 0.08)
  })

  return (
    <group ref={groupRef}>
      {/* fuselage */}
      <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
        <cylinderGeometry args={[0.5, 0.34, 4.6, 8]} />
        <meshStandardMaterial color="#c1442e" roughness={0.5} metalness={0.2} />
      </mesh>
      {/* nose */}
      <mesh position={[0, 0, 2.6]} rotation={[Math.PI / 2, 0, 0]}>
        <coneGeometry args={[0.34, 0.8, 8]} />
        <meshStandardMaterial color="#8a8f94" metalness={0.6} roughness={0.35} />
      </mesh>
      {/* wings + tail */}
      <mesh position={[0, 0.15, 0.6]}>
        <boxGeometry args={[8.2, 0.14, 1.5]} />
        <meshStandardMaterial color="#ece5d0" roughness={0.6} />
      </mesh>
      <mesh position={[0, 0.7, -2.1]}>
        <boxGeometry args={[0.12, 1.3, 1.0]} />
        <meshStandardMaterial color="#ece5d0" roughness={0.6} />
      </mesh>
      <mesh position={[0, 0.2, -2.1]}>
        <boxGeometry args={[3.0, 0.12, 0.9]} />
        <meshStandardMaterial color="#ece5d0" roughness={0.6} />
      </mesh>
      {/* tow line + banner trailing behind */}
      <mesh position={[0, -0.1, -5.4]}>
        <boxGeometry args={[0.03, 0.03, 5.6]} />
        <meshStandardMaterial color="#3a362e" roughness={1} />
      </mesh>
      <BannerCloth material={bannerMat} />
    </group>
  )
}

function BannerCloth({ material }: { material: MeshStandardMaterial }) {
  const geo = useMemo(() => new PlaneGeometry(14, 1.9, 24, 1), [])
  return (
    <mesh
      geometry={geo}
      material={material}
      position={[0, -0.1, -15.4]}
      rotation={[0, Math.PI / 2, 0]}
      dispose={null}
    />
  )
}
