import { useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import {
  Color,
  DoubleSide,
  Group,
  InstancedMesh,
  Mesh,
  MeshStandardMaterial,
  Object3D,
  PlaneGeometry,
  BoxGeometry,
  type WebGLProgramParametersWithUniforms,
} from 'three'
import { getTownAnchors } from './townField'

/**
 * Laundry lines strung across facades (town ambient mover): cloth quads
 * with a top-pinned vertex sway — same onBeforeCompile trick as the crops,
 * so the street breathes without a single per-frame matrix write.
 */

let swayShader: WebGLProgramParametersWithUniforms | null = null

const clothMat = new MeshStandardMaterial({ roughness: 0.95, side: DoubleSide })
clothMat.onBeforeCompile = (shader) => {
  shader.uniforms.uTime = { value: 0 }
  shader.vertexShader = shader.vertexShader
    .replace('#include <common>', '#include <common>\nuniform float uTime;')
    .replace(
      '#include <begin_vertex>',
      `#include <begin_vertex>
      #ifdef USE_INSTANCING
        vec2 clothWorld = vec2(instanceMatrix[3].x, instanceMatrix[3].z);
      #else
        vec2 clothWorld = vec2(0.0);
      #endif
      float hang = smoothstep(0.5, -0.5, position.y); // pinned at the line
      transformed.x += sin(uTime * 2.1 + clothWorld.x * 0.8 + clothWorld.y) * 0.12 * hang;
      transformed.z += cos(uTime * 1.6 + clothWorld.y * 0.7) * 0.1 * hang;`,
    )
  swayShader = shader
}
clothMat.customProgramCacheKey = () => 'town-cloth-sway'

const CLOTH_GEO = new PlaneGeometry(0.72, 0.92)
const LINE_GEO = new BoxGeometry(1, 0.015, 0.015)
const LINE_MAT = new MeshStandardMaterial({ color: '#2a2521', roughness: 1 })
const CLOTH_COLORS = ['#a34e3a', '#3f6b6b', '#c9a23a', '#d8d2c2', '#5a4a6b'].map(
  (h) => new Color(h),
)

let cachedGroup: Group | null = null

function getLaundryGroup(): Group {
  if (cachedGroup) return cachedGroup
  const { laundry } = getTownAnchors()
  const group = new Group()
  const dummy = new Object3D()

  const cloths: { x: number; y: number; z: number; yaw: number; color: Color }[] = []
  laundry.forEach((line, li) => {
    // the line itself
    const mid = line.a.clone().add(line.b).multiplyScalar(0.5)
    const len = line.a.distanceTo(line.b)
    const lineMesh = new Mesh(LINE_GEO, LINE_MAT)
    lineMesh.position.copy(mid)
    lineMesh.scale.x = len
    lineMesh.rotation.y = Math.atan2(line.b.x - line.a.x, line.b.z - line.a.z) - Math.PI / 2
    group.add(lineMesh)

    const n = 3 + (li % 2)
    for (let i = 0; i < n; i++) {
      const t = (i + 1) / (n + 1)
      cloths.push({
        x: line.a.x + (line.b.x - line.a.x) * t,
        y: line.a.y + (line.b.y - line.a.y) * t - 0.48,
        z: line.a.z + (line.b.z - line.a.z) * t,
        yaw: Math.atan2(line.b.x - line.a.x, line.b.z - line.a.z) - Math.PI / 2 + (i % 3) * 0.08,
        color: CLOTH_COLORS[(li * 3 + i) % CLOTH_COLORS.length],
      })
    }
  })

  const mesh = new InstancedMesh(CLOTH_GEO, clothMat, cloths.length)
  cloths.forEach((cl, i) => {
    dummy.position.set(cl.x, cl.y, cl.z)
    dummy.rotation.set(0, cl.yaw, 0)
    dummy.scale.setScalar(1)
    dummy.updateMatrix()
    mesh.setMatrixAt(i, dummy.matrix)
    mesh.setColorAt(i, cl.color)
  })
  mesh.instanceMatrix.needsUpdate = true
  if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true
  group.add(mesh)

  cachedGroup = group
  return group
}

export function Laundry() {
  const group = useMemo(getLaundryGroup, [])
  useFrame(({ clock }) => {
    if (swayShader) swayShader.uniforms.uTime.value = clock.elapsedTime
  })
  return <primitive object={group} dispose={null} />
}
