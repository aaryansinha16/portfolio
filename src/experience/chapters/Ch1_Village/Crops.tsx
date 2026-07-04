import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Color, MeshStandardMaterial, type WebGLProgramParametersWithUniforms } from 'three'
import { InstancedProps, type PropInstance } from '../../world/Instanced'
import { villageArt } from './config'
import { getVillageLayout, terrainHeightAt } from './villageField'

/**
 * The mustard fields — thousands of instanced crop cones with a wind sway
 * injected into the standard material's vertex stage (ambient mover #1,
 * DESIGN.md "nothing is static"). Tips sway, roots stay planted; phase
 * varies with world position so the field ripples instead of marching.
 */
export function Crops() {
  const shaderRef = useRef<WebGLProgramParametersWithUniforms | null>(null)

  const material = useMemo(() => {
    const mat = new MeshStandardMaterial({ roughness: 0.85, flatShading: true })
    mat.onBeforeCompile = (shader) => {
      shader.uniforms.uTime = { value: 0 }
      shader.vertexShader = shader.vertexShader
        .replace('#include <common>', '#include <common>\nuniform float uTime;')
        .replace(
          '#include <begin_vertex>',
          `#include <begin_vertex>
          #ifdef USE_INSTANCING
            vec2 cropWorld = vec2(instanceMatrix[3].x, instanceMatrix[3].z);
          #else
            vec2 cropWorld = vec2(0.0);
          #endif
          float swayWeight = smoothstep(-0.5, 0.5, position.y);
          transformed.x += sin(uTime * 1.7 + cropWorld.x * 0.55 + cropWorld.y * 0.4) * 0.16 * swayWeight;
          transformed.z += cos(uTime * 1.25 + cropWorld.x * 0.35) * 0.09 * swayWeight;`,
        )
      shaderRef.current = shader
    }
    mat.customProgramCacheKey = () => 'village-crops-sway'
    return mat
  }, [])

  useFrame(({ clock }) => {
    const shader = shaderRef.current
    if (shader) shader.uniforms.uTime.value = clock.elapsedTime
  })

  const items = useMemo(() => {
    const layout = getVillageLayout()
    const art = villageArt.crops
    const bloom = new Color(art.mustardBloom)
    const stem = new Color(art.mustardStem)
    const green = new Color(art.green)

    const items: PropInstance[] = []
    for (const cr of layout.crops) {
      const color =
        cr.kind === 'mustard'
          ? new Color().lerpColors(stem, bloom, 0.45 + cr.colorMix * 0.55)
          : green.clone().multiplyScalar(0.85 + cr.colorMix * 0.3)
      // Blobby clumps, wider than tall — spiky cones read as tiny conifers.
      const r = (cr.kind === 'mustard' ? 0.3 : 0.38) + cr.colorMix * 0.12
      items.push({
        x: cr.x,
        y: terrainHeightAt(cr.x, cr.z) + cr.h * 0.42,
        z: cr.z,
        rotY: cr.rotY,
        sx: r,
        sy: cr.h,
        sz: r,
        color,
      })
    }
    return items
  }, [])

  return (
    <InstancedProps items={items} material={material}>
      <icosahedronGeometry args={[1, 0]} />
    </InstancedProps>
  )
}
