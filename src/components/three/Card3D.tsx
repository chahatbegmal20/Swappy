'use client'

import { useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { RoundedBox, Text3D, Float } from '@react-three/drei'
import * as THREE from 'three'

interface Card3DProps {
  position: [number, number, number]
  title: string
  color: string
  icon: string
}

export default function Card3D({ position, title, color, icon }: Card3DProps) {
  const groupRef = useRef<THREE.Group>(null!)
  const [hovered, setHovered] = useState(false)
  
  useFrame(({ clock }) => {
    if (hovered) {
      groupRef.current.rotation.y = Math.sin(clock.getElapsedTime() * 2) * 0.1
      groupRef.current.position.z = position[2] + Math.sin(clock.getElapsedTime() * 3) * 0.1
    } else {
      groupRef.current.rotation.y = THREE.MathUtils.lerp(
        groupRef.current.rotation.y,
        0,
        0.1
      )
      groupRef.current.position.z = THREE.MathUtils.lerp(
        groupRef.current.position.z,
        position[2],
        0.1
      )
    }
  })
  
  return (
    <Float speed={1.5} rotationIntensity={0.3} floatIntensity={0.5}>
      <group
        ref={groupRef}
        position={position}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        {/* Card background */}
        <RoundedBox args={[2, 2.5, 0.2]} radius={0.1} smoothness={4}>
          <meshStandardMaterial
            color={hovered ? color : '#1A1A1A'}
            roughness={0.3}
            metalness={0.8}
            emissive={color}
            emissiveIntensity={hovered ? 0.5 : 0.1}
          />
        </RoundedBox>
        
        {/* Icon/Emoji */}
        <mesh position={[0, 0.5, 0.15]}>
          <planeGeometry args={[1, 1]} />
          <meshBasicMaterial transparent opacity={hovered ? 1 : 0.7} />
        </mesh>
        
        {/* Decorative border */}
        <mesh position={[0, 0, 0.11]}>
          <boxGeometry args={[2.1, 2.6, 0.05]} />
          <meshStandardMaterial
            color={color}
            emissive={color}
            emissiveIntensity={hovered ? 0.8 : 0.3}
            transparent
            opacity={0.5}
          />
        </mesh>
      </group>
    </Float>
  )
}

