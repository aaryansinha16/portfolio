import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { BackSide, Color, Mesh, ShaderMaterial, Vector3 } from 'three'
import { frameEnv } from './ColorScript'

/**
 * Gradient sky dome (DESIGN.md color script: "peach→lavender", "orange→purple"
 * skies). A camera-following inverted sphere with a horizon→zenith gradient
 * plus a sun-direction glow, all driven per frame from the ColorScript.
 * Includes three's tonemapping/colorspace chunks so it grades with the scene.
 */

const VERT = /* glsl */ `
varying vec3 vDir;
void main() {
  vDir = position;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`

const FRAG = /* glsl */ `
uniform vec3 uZenith;
uniform vec3 uHorizon;
uniform vec3 uSunColor;
uniform vec3 uSunDir;
uniform float uSunGlow;
varying vec3 vDir;

void main() {
  vec3 d = normalize(vDir);
  float h = d.y;
  vec3 col = mix(uHorizon, uZenith, smoothstep(0.02, 0.5, h));
  // below the horizon line: settle into a darker haze
  col = mix(col, uHorizon * 0.6, smoothstep(0.0, -0.2, h));
  // sun glow: a wide atmospheric halo + a tighter hot core
  float s = max(dot(d, uSunDir), 0.0);
  col += uSunColor * uSunGlow * (pow(s, 6.0) * 0.35 + pow(s, 48.0) * 0.9);
  gl_FragColor = vec4(col, 1.0);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
`

export function Sky() {
  const meshRef = useRef<Mesh>(null)

  const material = useMemo(
    () =>
      new ShaderMaterial({
        vertexShader: VERT,
        fragmentShader: FRAG,
        uniforms: {
          uZenith: { value: new Color('#0a0d1f') },
          uHorizon: { value: new Color('#313a66') },
          uSunColor: { value: new Color('#e8b04b') },
          uSunDir: { value: new Vector3(0, 0.2, 1) },
          uSunGlow: { value: 0.5 },
        },
        side: BackSide,
        depthWrite: false,
        fog: false,
      }),
    [],
  )

  useFrame(({ camera }) => {
    const mesh = meshRef.current
    if (!mesh) return
    // Ride with the camera so the dome never clips or parallaxes.
    mesh.position.copy(camera.position)
    const u = material.uniforms
    ;(u.uZenith.value as Color).copy(frameEnv.skyZenith)
    ;(u.uHorizon.value as Color).copy(frameEnv.skyHorizon)
    ;(u.uSunColor.value as Color).copy(frameEnv.sunColor)
    ;(u.uSunDir.value as Vector3).copy(frameEnv.sunDir)
    u.uSunGlow.value = frameEnv.sunGlow
  })

  return (
    <mesh ref={meshRef} material={material} renderOrder={-1} frustumCulled={false}>
      <sphereGeometry args={[600, 32, 16]} />
    </mesh>
  )
}
