import { useLayoutEffect, useRef, type ReactNode } from 'react'
import { Color, InstancedMesh, Material, Object3D } from 'three'

/**
 * Generic static instanced props: give it placed items and a geometry +
 * material as children; it fills matrices/colors once. Biomes build their
 * repeated props with this (instance everything repeated — perf budget).
 */

export interface PropInstance {
  x: number
  y: number
  z: number
  rotY: number
  /** Optional pitch/roll for props that don't stand upright. */
  rotX?: number
  rotZ?: number
  sx: number
  sy: number
  sz: number
  color?: Color
}

const dummy = new Object3D()

interface InstancedPropsProps {
  items: readonly PropInstance[]
  castShadow?: boolean
  receiveShadow?: boolean
  material?: Material
  children: ReactNode
}

export function InstancedProps({
  items,
  castShadow = false,
  receiveShadow = true,
  material,
  children,
}: InstancedPropsProps) {
  const ref = useRef<InstancedMesh>(null)

  useLayoutEffect(() => {
    const mesh = ref.current
    if (!mesh) return
    items.forEach((it, i) => {
      dummy.position.set(it.x, it.y, it.z)
      dummy.rotation.set(it.rotX ?? 0, it.rotY, it.rotZ ?? 0)
      dummy.scale.set(it.sx, it.sy, it.sz)
      dummy.updateMatrix()
      mesh.setMatrixAt(i, dummy.matrix)
      if (it.color) mesh.setColorAt(i, it.color)
    })
    mesh.instanceMatrix.needsUpdate = true
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true
    mesh.computeBoundingSphere()
  }, [items])

  if (items.length === 0) return null
  return (
    <instancedMesh
      ref={ref}
      args={[undefined, undefined, items.length]}
      castShadow={castShadow}
      receiveShadow={receiveShadow}
      material={material}
    >
      {children}
    </instancedMesh>
  )
}
