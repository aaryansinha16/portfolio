import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import {
  DoubleSide,
  Group,
  MeshStandardMaterial,
  PlaneGeometry,
  type WebGLProgramParametersWithUniforms,
} from 'three'
import { getZoneRoad, type ZoneSample } from '../../world/roadSamples'
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
  const tex = makeTextPanel({
    title: PLANE_BANNER,
    bg: '#f2eddc',
    fg: '#26241f',
    border: '#c1442e',
    w: 1280,
    h: 160,
  })
  const mat = new MeshStandardMaterial({
    map: tex,
    // readable against the bright sky from below
    emissive: '#ffffff',
    emissiveMap: tex,
    emissiveIntensity: 0.3,
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
        float tail = smoothstep(-9.0, 9.0, position.x);
        transformed.y += sin(uTime * 3.2 + position.x * 0.7) * 0.4 * tail;
        transformed.z += cos(uTime * 2.3 + position.x * 0.5) * 0.22 * tail;`,
      )
    bannerShader = shader
  }
  mat.customProgramCacheKey = () => 'banner-wave'
  bannerMatCached = mat
  return mat
}

const planeSample: ZoneSample = { x: 0, y: 0, z: 0, tx: 0, tz: 1, rx: 1, rz: 0, meters: 0 }

export function BannerPlane() {
  const groupRef = useRef<Group>(null)
  const bannerMat = useMemo(getBannerMaterial, [])

  useFrame(({ clock }) => {
    const group = groupRef.current
    if (!group) return
    const t = clock.elapsedTime
    if (bannerShader) bannerShader.uniforms.uTime.value = t
    // a LOW, ROAD-ALIGNED circuit: the plane sweeps up and down the highway
    // just off the lanes, so it crosses the driver's forward view every
    // pass. (The old world-axis ellipse at y=44 lived out of frame and
    // inside the haze — the owner only ever saw its shadow.)
    const road = getZoneRoad(3)
    const a = t * 0.14 // ~45s per circuit
    const along = road.zoneMeters * 0.5 + Math.cos(a) * road.zoneMeters * 0.34
    const lat = Math.sin(a) * 42
    const s = road.sample(along, planeSample)
    const y = s.y + 21.5 + Math.sin(a * 2.3) * 2
    group.position.set(s.x + s.rx * lat, y, s.z + s.rz * lat)
    // heading = velocity direction in the road frame
    const dAlong = -Math.sin(a) * road.zoneMeters * 0.34
    const dLat = Math.cos(a) * 42
    const vx = s.tx * dAlong + s.rx * dLat
    const vz = s.tz * dAlong + s.rz * dLat
    group.rotation.set(0, Math.atan2(vx, vz), Math.sin(a * 2.3) * 0.09)
  })

  return (
    <group ref={groupRef} scale={1.45}>
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
      <mesh position={[0, -0.1, -6.2]}>
        <boxGeometry args={[0.03, 0.03, 7.2]} />
        <meshStandardMaterial color="#3a362e" roughness={1} />
      </mesh>
      <BannerCloth material={bannerMat} />
    </group>
  )
}

function BannerCloth({ material }: { material: MeshStandardMaterial }) {
  const geo = useMemo(() => new PlaneGeometry(18, 2.4, 30, 1), [])
  return (
    <mesh
      geometry={geo}
      material={material}
      position={[0, -0.1, -18.8]}
      rotation={[0, Math.PI / 2, 0]}
      dispose={null}
    />
  )
}
