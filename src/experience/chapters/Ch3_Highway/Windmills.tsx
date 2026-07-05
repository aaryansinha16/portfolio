import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Group } from 'three'
import { getHighwayTurbines } from './highwayField'

/**
 * Wind-farm rotors over the plains (owner feedback: the highway needed
 * more than boards). Towers are instanced in the statics; each rotor is a
 * small group of three blades spinning at its own lazy rate.
 */
export function Windmills() {
  const turbines = useMemo(getHighwayTurbines, [])
  const rotors = useRef<(Group | null)[]>([])

  useFrame((_, dt) => {
    rotors.current.forEach((rotor, i) => {
      if (rotor) rotor.rotation.z += dt * (0.5 + (i % 3) * 0.18)
    })
  })

  return (
    <group>
      {turbines.map((t, i) => (
        <group key={i} position={[t.x, t.y + t.h, t.z]}>
          {/* nacelle */}
          <mesh>
            <boxGeometry args={[1.1, 1.1, 2.4]} />
            <meshStandardMaterial color="#c8cccc" roughness={0.5} metalness={0.2} />
          </mesh>
          <group
            ref={(el) => {
              rotors.current[i] = el
            }}
            position={[0, 0, 1.4]}
            rotation={[0, 0, (i * Math.PI * 2) / 3]}
          >
            {[0, (Math.PI * 2) / 3, (Math.PI * 4) / 3].map((a) => (
              <group key={a} rotation={[0, 0, a]}>
                <mesh position={[0, 4.9, 0]}>
                  <boxGeometry args={[0.5, 9.5, 0.14]} />
                  <meshStandardMaterial color="#e4e8e8" roughness={0.45} metalness={0.15} />
                </mesh>
              </group>
            ))}
          </group>
        </group>
      ))}
    </group>
  )
}
