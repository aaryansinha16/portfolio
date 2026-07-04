import { useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import {
  Color,
  IcosahedronGeometry,
  InstancedMesh,
  MeshStandardMaterial,
  Object3D,
  type WebGLProgramParametersWithUniforms,
} from 'three'
import { villageArt } from './config'
import { getVillageLayout, terrainHeightAt } from './villageField'

/**
 * The mustard fields — thousands of instanced crop blobs with a wind sway
 * injected into the standard material's vertex stage (ambient mover #1,
 * DESIGN.md "nothing is static"). Tips sway, roots stay planted; phase
 * varies with world position so the field ripples instead of marching.
 * Mesh + shader built once, module-cached; only uTime updates per frame.
 */

const CROP_GEO = new IcosahedronGeometry(1, 0)

let swayShader: WebGLProgramParametersWithUniforms | null = null

const cropMat = new MeshStandardMaterial({ roughness: 0.85, flatShading: true })
cropMat.onBeforeCompile = (shader) => {
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
  swayShader = shader
}
cropMat.customProgramCacheKey = () => 'village-crops-sway'

let cachedMesh: InstancedMesh | null = null

function getCropsMesh(): InstancedMesh {
  if (cachedMesh) return cachedMesh

  const layout = getVillageLayout()
  const art = villageArt.crops
  const bloom = new Color(art.mustardBloom)
  const stem = new Color(art.mustardStem)
  const green = new Color(art.green)
  const dummy = new Object3D()
  const c = new Color()

  const mesh = new InstancedMesh(CROP_GEO, cropMat, layout.crops.length)
  layout.crops.forEach((cr, i) => {
    // Blobby clumps, wider than tall — spiky cones read as tiny conifers.
    const r = (cr.kind === 'mustard' ? 0.3 : 0.38) + cr.colorMix * 0.12
    dummy.position.set(cr.x, terrainHeightAt(cr.x, cr.z) + cr.h * 0.42, cr.z)
    dummy.rotation.set(0, cr.rotY, 0)
    dummy.scale.set(r, cr.h, r)
    dummy.updateMatrix()
    mesh.setMatrixAt(i, dummy.matrix)
    if (cr.kind === 'mustard') {
      c.lerpColors(stem, bloom, 0.45 + cr.colorMix * 0.55)
    } else {
      c.copy(green).multiplyScalar(0.85 + cr.colorMix * 0.3)
    }
    mesh.setColorAt(i, c)
  })
  mesh.instanceMatrix.needsUpdate = true
  if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true
  mesh.receiveShadow = true
  mesh.computeBoundingSphere()

  cachedMesh = mesh
  return mesh
}

export function Crops() {
  const mesh = useMemo(getCropsMesh, [])

  useFrame(({ clock }) => {
    if (swayShader) swayShader.uniforms.uTime.value = clock.elapsedTime
  })

  return <primitive object={mesh} dispose={null} />
}
