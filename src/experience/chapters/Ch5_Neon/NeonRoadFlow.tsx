import { useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  Color,
  DoubleSide,
  Mesh,
  ShaderMaterial,
  Uniform,
} from 'three'
import { getZoneRoad } from '../../world/roadSamples'

/**
 * The district's moving light: two neon lines hugging the road edges with
 * pulses that stream FORWARD along the travel direction (owner: "a following
 * neon light along with the road movement" instead of random strips).
 * One ribbon mesh, one additive shader, cyan left / magenta right.
 */

const ZONE = 5
const LATERAL = 4.55 // just off the 4m half-road
const WIDTH = 0.3
const LIFT = 0.1 // above the 0.08 road deck

const VERT = /* glsl */ `
attribute float aDist;
attribute float aSide;
varying float vDist;
varying float vSide;
void main() {
  vDist = aDist;
  vSide = aSide;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`

const FRAG = /* glsl */ `
uniform float uTime;
uniform vec3 uColorA;
uniform vec3 uColorB;
varying float vDist;
varying float vSide;
void main() {
  // pulses stream toward +dist (the direction of travel)
  float flow = fract(vDist * 26.0 - uTime * 0.5);
  float pulse = smoothstep(0.0, 0.22, flow) * smoothstep(0.55, 0.22, flow);
  float slow = 0.75 + 0.25 * sin(uTime * 1.7 + vDist * 40.0);
  float glow = 0.45 + pulse * 2.2 * slow;
  vec3 col = mix(uColorA, uColorB, vSide) * glow;
  gl_FragColor = vec4(col, 1.0);
}
`

let cachedGeo: BufferGeometry | null = null

function getFlowGeometry(): BufferGeometry {
  if (cachedGeo) return cachedGeo
  const road = getZoneRoad(ZONE)
  const positions: number[] = []
  const dists: number[] = []
  const sides: number[] = []
  const indices: number[] = []
  let vtx = 0

  for (const side of [-1, 1]) {
    const lat = LATERAL * side
    let first = true
    for (let m = 2; m <= road.zoneMeters - 2; m += 4) {
      const s = road.at(m)
      const cx = s.x + s.rx * lat
      const cz = s.z + s.rz * lat
      positions.push(
        cx + s.rx * (WIDTH / 2),
        s.y + LIFT,
        cz + s.rz * (WIDTH / 2),
        cx - s.rx * (WIDTH / 2),
        s.y + LIFT,
        cz - s.rz * (WIDTH / 2),
      )
      const d = m / road.zoneMeters
      dists.push(d, d)
      const sv = side === -1 ? 0 : 1
      sides.push(sv, sv)
      if (!first) {
        // CCW seen from above (pairs are [+right, -right], like the road)
        indices.push(vtx - 2, vtx - 1, vtx, vtx - 1, vtx + 1, vtx)
      }
      first = false
      vtx += 2
    }
  }

  const geo = new BufferGeometry()
  geo.setAttribute('position', new BufferAttribute(new Float32Array(positions), 3))
  geo.setAttribute('aDist', new BufferAttribute(new Float32Array(dists), 1))
  geo.setAttribute('aSide', new BufferAttribute(new Float32Array(sides), 1))
  geo.setIndex(indices)
  cachedGeo = geo
  return geo
}

const flowMaterial = new ShaderMaterial({
  vertexShader: VERT,
  fragmentShader: FRAG,
  uniforms: {
    uTime: new Uniform(0),
    uColorA: new Uniform(new Color('#00e5ff')),
    uColorB: new Uniform(new Color('#ff2e88')),
  },
  blending: AdditiveBlending,
  transparent: true,
  depthWrite: false,
  side: DoubleSide,
  toneMapped: false,
})

export function NeonRoadFlow() {
  const mesh = useMemo(() => {
    const m = new Mesh(getFlowGeometry(), flowMaterial)
    m.frustumCulled = false
    return m
  }, [])

  useFrame(({ clock }) => {
    flowMaterial.uniforms.uTime.value = clock.elapsedTime
  })

  return <primitive object={mesh} dispose={null} />
}
