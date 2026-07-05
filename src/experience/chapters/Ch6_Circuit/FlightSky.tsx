import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import {
  AdditiveBlending,
  CanvasTexture,
  Group,
  Mesh,
  MeshBasicMaterial,
  SRGBColorSpace,
  Vector3,
} from 'three'
import { CLIFF_START_M, pointPastEnd } from '../../spline/roadPath'
import { flightOf } from '../../detours/DetourManager'
import { useJourney } from '../../../state/useJourney'
import { smoothstep } from '../../../utils/math'
import { createRng, rngRange } from '../../../utils/random'

/**
 * The epilogue's weather set: soft clouds scattered along the climb path
 * and a warm morning sun ahead of it — everything fades in with the flight
 * (owner: after the plane takes over, the world turns bright and hopeful).
 */

let cloudTex: CanvasTexture | null = null
function getCloudTexture(): CanvasTexture {
  if (cloudTex) return cloudTex
  const c = document.createElement('canvas')
  c.width = 256
  c.height = 128
  const ctx = c.getContext('2d')!
  // three overlapping soft blobs — a cartoon cumulus without geometry
  for (const [cx, cy, r] of [
    [78, 78, 52],
    [128, 58, 62],
    [182, 80, 50],
  ]) {
    const g = ctx.createRadialGradient(cx, cy, 4, cx, cy, r)
    g.addColorStop(0, 'rgba(255,255,255,0.85)')
    g.addColorStop(0.6, 'rgba(255,255,255,0.4)')
    g.addColorStop(1, 'rgba(255,255,255,0)')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, 256, 128)
  }
  const tex = new CanvasTexture(c)
  tex.colorSpace = SRGBColorSpace
  cloudTex = tex
  return tex
}

let sunTex: CanvasTexture | null = null
function getSunTexture(): CanvasTexture {
  if (sunTex) return sunTex
  const c = document.createElement('canvas')
  c.width = 256
  c.height = 256
  const ctx = c.getContext('2d')!
  const g = ctx.createRadialGradient(128, 128, 6, 128, 128, 128)
  g.addColorStop(0, 'rgba(255,252,238,1)')
  g.addColorStop(0.18, 'rgba(255,244,208,0.95)')
  g.addColorStop(0.42, 'rgba(255,228,160,0.38)')
  g.addColorStop(1, 'rgba(255,220,140,0)')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, 256, 256)
  const tex = new CanvasTexture(c)
  tex.colorSpace = SRGBColorSpace
  sunTex = tex
  return tex
}

interface Puff {
  pos: Vector3
  w: number
  h: number
  o: number
  drift: number
}

export function FlightSky() {
  const groupRef = useRef<Group>(null)

  const { clouds, sunPos } = useMemo(() => {
    const rng = createRng(4690)
    const anchor = new Vector3()
    const clouds: Puff[] = []
    for (let i = 0; i < 9; i++) {
      const along = rngRange(rng, 26, 130)
      pointPastEnd(CLIFF_START_M + along, anchor)
      clouds.push({
        pos: new Vector3(
          anchor.x + rngRange(rng, -70, 70),
          anchor.y + rngRange(rng, -14, 26),
          anchor.z + rngRange(rng, -55, 25),
        ),
        w: rngRange(rng, 26, 58),
        h: rngRange(rng, 10, 20),
        o: rngRange(rng, 0.5, 0.85),
        drift: rngRange(rng, 0.3, 0.9),
      })
    }
    pointPastEnd(CLIFF_START_M + 165, anchor)
    const sunPos = new Vector3(anchor.x + 42, anchor.y + 48, anchor.z - 20)
    return { clouds, sunPos }
  }, [])

  useFrame(({ clock, camera }) => {
    const group = groupRef.current
    if (!group) return
    const fade = smoothstep(flightOf(useJourney.getState().progress))
    group.visible = fade > 0.02
    if (!group.visible) return
    const t = clock.elapsedTime
    group.children.forEach((child, i) => {
      const mesh = child as Mesh
      const mat = mesh.material as MeshBasicMaterial
      const base = mesh.userData.baseOpacity as number
      mat.opacity = base * fade
      // clouds breathe sideways a little; the sun stays put
      if (mesh.userData.drift) {
        mesh.position.x = mesh.userData.baseX + Math.sin(t * 0.1 + i) * mesh.userData.drift
      }
      mesh.lookAt(camera.position)
    })
  })

  return (
    <group ref={groupRef} visible={false}>
      {clouds.map((cl, i) => (
        <mesh
          key={i}
          position={cl.pos}
          scale={[cl.w, cl.h, 1]}
          userData={{ baseOpacity: cl.o, drift: cl.drift, baseX: cl.pos.x }}
        >
          <planeGeometry args={[1, 1]} />
          <meshBasicMaterial
            map={getCloudTexture()}
            transparent
            opacity={0}
            depthWrite={false}
            fog={false}
          />
        </mesh>
      ))}
      <mesh position={sunPos} scale={[90, 90, 1]} userData={{ baseOpacity: 0.95 }}>
        <planeGeometry args={[1, 1]} />
        <meshBasicMaterial
          map={getSunTexture()}
          transparent
          opacity={0}
          blending={AdditiveBlending}
          depthWrite={false}
          fog={false}
        />
      </mesh>
    </group>
  )
}
