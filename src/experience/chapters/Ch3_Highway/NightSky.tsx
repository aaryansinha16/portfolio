import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  CanvasTexture,
  Group,
  Mesh,
  MeshBasicMaterial,
  ShaderMaterial,
  SRGBColorSpace,
  Uniform,
  Vector3,
} from 'three'
import { getZoneRoad } from '../../world/roadSamples'
import { zoneFloat } from '../../atmosphere/ColorScript'
import { useJourney } from '../../../state/useJourney'
import { clamp01 } from '../../../utils/math'
import { createRng, rngRange } from '../../../utils/random'

/**
 * The highway's starry vault: ~900 twinkling stars on a dome, a milky-way
 * band, a few soft galaxies, and shooting stars streaking on their own
 * clocks. Everything fades with distance from zone 3 (zoneFloat), so the
 * sky assembles as you leave town and dissolves into the city dusk.
 */

const ZONE = 3
const DOME_R = 780

/* ---------------- stars (one Points draw call, shader twinkle) -------- */

const STAR_VERT = /* glsl */ `
attribute float aSize;
attribute float aPhase;
attribute vec3 aColor;
uniform float uTime;
varying float vTwinkle;
varying vec3 vColor;
void main() {
  vColor = aColor;
  vTwinkle = 0.72 + 0.28 * sin(uTime * (0.6 + aPhase * 2.2) + aPhase * 40.0);
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  gl_PointSize = aSize * 2.2; // device px — hold size at Retina dpr
  gl_Position = projectionMatrix * mv;
}
`

const STAR_FRAG = /* glsl */ `
uniform float uFade;
varying float vTwinkle;
varying vec3 vColor;
void main() {
  vec2 c = gl_PointCoord - 0.5;
  float d = length(c);
  float disc = smoothstep(0.5, 0.12, d);
  gl_FragColor = vec4(vColor * vTwinkle, disc * uFade);
}
`

/* soft nebula blob painted once — tinted per galaxy via material color */
let nebulaTex: CanvasTexture | null = null
function getNebulaTexture(): CanvasTexture {
  if (nebulaTex) return nebulaTex
  const c = document.createElement('canvas')
  c.width = 256
  c.height = 256
  const ctx = c.getContext('2d')!
  const g = ctx.createRadialGradient(128, 128, 8, 128, 128, 128)
  g.addColorStop(0, 'rgba(255,255,255,0.85)')
  g.addColorStop(0.28, 'rgba(255,255,255,0.32)')
  g.addColorStop(0.62, 'rgba(255,255,255,0.09)')
  g.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, 256, 256)
  const tex = new CanvasTexture(c)
  tex.colorSpace = SRGBColorSpace
  nebulaTex = tex
  return tex
}

/* shooting-star streak: bright head fading down the tail */
let streakTex: CanvasTexture | null = null
function getStreakTexture(): CanvasTexture {
  if (streakTex) return streakTex
  const c = document.createElement('canvas')
  c.width = 256
  c.height = 32
  const ctx = c.getContext('2d')!
  const g = ctx.createLinearGradient(0, 0, 256, 0)
  g.addColorStop(0, 'rgba(255,255,255,0)')
  g.addColorStop(0.75, 'rgba(210,225,255,0.55)')
  g.addColorStop(0.94, 'rgba(255,255,255,1)')
  g.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, 256, 32)
  const tex = new CanvasTexture(c)
  tex.colorSpace = SRGBColorSpace
  streakTex = tex
  return tex
}

interface ShootingStar {
  from: Vector3
  to: Vector3
  period: number
  offset: number
  mesh: Mesh | null
}

/* everything below is built ONCE and reused across chapter remounts —
 * per-mount geometry leaked one star buffer per journey roundtrip */
let starMatCached: ShaderMaterial | null = null
function getStarMaterial(): ShaderMaterial {
  if (starMatCached) return starMatCached
  starMatCached = new ShaderMaterial({
    vertexShader: STAR_VERT,
    fragmentShader: STAR_FRAG,
    uniforms: { uTime: new Uniform(0), uFade: new Uniform(0) },
    transparent: true,
    depthWrite: false,
  })
  return starMatCached
}

interface SkyBundle {
  center: Vector3
  starGeo: BufferGeometry
  galaxies: {
    pos: Vector3
    scale: readonly [number, number]
    tint: string
    opacity: number
    roll: number
  }[]
  streaks: ShootingStar[]
}

let skyCached: SkyBundle | null = null
function buildSky(): SkyBundle {
  if (skyCached) return skyCached
  const road = getZoneRoad(ZONE)
  const mid = new Vector3()
  road.place(road.zoneMeters * 0.5, 0, mid)
  const rng = createRng(4390)

  // stars on the upper dome
  const N = 900
  const pos = new Float32Array(N * 3)
  const size = new Float32Array(N)
  const phase = new Float32Array(N)
  const color = new Float32Array(N * 3)
  for (let i = 0; i < N; i++) {
    const az = rngRange(rng, 0, Math.PI * 2)
    const el = Math.asin(rngRange(rng, 0.06, 1)) // bias toward zenith
    pos[i * 3] = mid.x + Math.cos(az) * Math.cos(el) * DOME_R
    pos[i * 3 + 1] = Math.sin(el) * DOME_R
    pos[i * 3 + 2] = mid.z + Math.sin(az) * Math.cos(el) * DOME_R
    size[i] = rng() < 0.08 ? rngRange(rng, 3.2, 4.6) : rngRange(rng, 1.1, 2.6)
    phase[i] = rng()
    // white / blue-white / rare warm
    const t = rng()
    const [r, g, b] = t < 0.68 ? [0.92, 0.95, 1] : t < 0.92 ? [0.72, 0.82, 1] : [1, 0.85, 0.62]
    color[i * 3] = r
    color[i * 3 + 1] = g
    color[i * 3 + 2] = b
  }
  const geo = new BufferGeometry()
  geo.setAttribute('position', new BufferAttribute(pos, 3))
  geo.setAttribute('aSize', new BufferAttribute(size, 1))
  geo.setAttribute('aPhase', new BufferAttribute(phase, 1))
  geo.setAttribute('aColor', new BufferAttribute(color, 3))

  // galaxies + the milky-way band
  const mkGalaxy = (az: number, el: number, s: number, sy: number, tint: string, o: number) => ({
    pos: new Vector3(
      mid.x + Math.cos(az) * Math.cos(el) * (DOME_R - 40),
      Math.sin(el) * (DOME_R - 40),
      mid.z + Math.sin(az) * Math.cos(el) * (DOME_R - 40),
    ),
    scale: [s, sy] as const,
    tint,
    opacity: o,
    roll: rngRange(rng, 0, Math.PI),
  })
  const galaxies = [
    // the milky way — one long band across the vault
    mkGalaxy(2.4, 0.9, 1500, 340, '#8fa3d8', 0.16),
    mkGalaxy(0.7, 0.55, 300, 210, '#b98aff', 0.2),
    mkGalaxy(3.6, 0.38, 240, 170, '#7de8ff', 0.16),
    mkGalaxy(5.2, 0.7, 340, 220, '#ff9ec6', 0.13),
  ]

  // shooting stars: deterministic paths, staggered clocks
  const streaks: ShootingStar[] = Array.from({ length: 3 }, (_, i) => {
    const az = rngRange(rng, 0, Math.PI * 2)
    const el = rngRange(rng, 0.5, 1.1)
    const from = new Vector3(
      mid.x + Math.cos(az) * Math.cos(el) * (DOME_R - 90),
      Math.sin(el) * (DOME_R - 90),
      mid.z + Math.sin(az) * Math.cos(el) * (DOME_R - 90),
    )
    const dir = new Vector3(rngRange(rng, -1, 1), rngRange(rng, -0.55, -0.25), rngRange(rng, -1, 1))
      .normalize()
      .multiplyScalar(rngRange(rng, 260, 380))
    return {
      from,
      to: from.clone().add(dir),
      period: 4.6 + i * 2.3,
      offset: i * 1.7,
      mesh: null,
    }
  })

  skyCached = { center: mid.clone(), starGeo: geo, galaxies, streaks }
  return skyCached
}

export function NightSky() {
  const starMat = useMemo(getStarMaterial, [])
  const { center, starGeo, galaxies, streaks } = useMemo(buildSky, [])
  const groupRef = useRef<Group>(null)

  useFrame(({ clock, camera }) => {
    const t = clock.elapsedTime
    starMat.uniforms.uTime.value = t
    // the vault belongs to zone 3 — fade in/out at the boundaries
    const fade = clamp01(1 - Math.abs(zoneFloat(useJourney.getState().splineProgress) - 3) * 1.3)
    starMat.uniforms.uFade.value = fade
    const group = groupRef.current
    if (!group) return
    group.visible = fade > 0.02
    if (!group.visible) return
    group.traverse((o) => {
      const m = (o as Mesh).material as MeshBasicMaterial | undefined
      if (m && 'opacity' in m && o.userData.baseOpacity != null) {
        m.opacity = o.userData.baseOpacity * fade
      }
    })
    // shooting stars: each rides its own clock; visible for the first 14%
    for (const s of streaks) {
      const mesh = s.mesh
      if (!mesh) continue
      const cyc = ((t + s.offset) / s.period) % 1
      const active = cyc < 0.14
      mesh.visible = active && fade > 0.05
      if (!mesh.visible) continue
      const k = cyc / 0.14
      mesh.position.lerpVectors(s.from, s.to, k)
      const m = mesh.material as MeshBasicMaterial
      m.opacity = fade * Math.sin(Math.PI * k) * 0.9
      mesh.lookAt(camera.position)
    }
  })

  return (
    <group ref={groupRef}>
      <points geometry={starGeo} material={starMat} frustumCulled={false} dispose={null} />
      {galaxies.map((g, i) => (
        <mesh
          key={i}
          position={g.pos}
          scale={[g.scale[0], g.scale[1], 1]}
          onUpdate={(m) => {
            m.lookAt(center.x, 0, center.z)
            m.rotateZ(g.roll)
          }}
          userData={{ baseOpacity: g.opacity }}
        >
          <planeGeometry args={[1, 1]} />
          <meshBasicMaterial
            map={getNebulaTexture()}
            color={g.tint}
            transparent
            opacity={g.opacity}
            blending={AdditiveBlending}
            depthWrite={false}
            fog={false}
          />
        </mesh>
      ))}
      {streaks.map((s, i) => (
        <mesh
          key={`streak-${i}`}
          ref={(m) => {
            s.mesh = m
          }}
          visible={false}
          userData={{ baseOpacity: 0.9 }}
        >
          <planeGeometry args={[46, 1.6]} />
          <meshBasicMaterial
            map={getStreakTexture()}
            color="#dbe8ff"
            transparent
            opacity={0}
            blending={AdditiveBlending}
            depthWrite={false}
            fog={false}
          />
        </mesh>
      ))}
    </group>
  )
}
