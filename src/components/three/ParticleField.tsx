'use client'

import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

export default function ParticleField() {
  const particlesRef = useRef<THREE.Points>(null!)
  
  const particlesCount = 5000
  
  const positions = useMemo(() => {
    const positions = new Float32Array(particlesCount * 3)
    
    for (let i = 0; i < particlesCount; i++) {
      const i3 = i * 3
      positions[i3] = (Math.random() - 0.5) * 50
      positions[i3 + 1] = (Math.random() - 0.5) * 50
      positions[i3 + 2] = (Math.random() - 0.5) * 50
    }
    
    return positions
  }, [])
  
  const colors = useMemo(() => {
    const colors = new Float32Array(particlesCount * 3)
    const colorChoices = [
      new THREE.Color('#FF006E'),
      new THREE.Color('#00F5FF'),
      new THREE.Color('#FFB800'),
      new THREE.Color('#8B00FF'),
    ]
    
    for (let i = 0; i < particlesCount; i++) {
      const i3 = i * 3
      const color = colorChoices[Math.floor(Math.random() * colorChoices.length)]
      colors[i3] = color.r
      colors[i3 + 1] = color.g
      colors[i3 + 2] = color.b
    }
    
    return colors
  }, [])
  
  useFrame(({ clock }) => {
    particlesRef.current.rotation.y = clock.getElapsedTime() * 0.05
    particlesRef.current.rotation.x = Math.sin(clock.getElapsedTime() * 0.1) * 0.1
  })
  
  return (
    <points ref={particlesRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={particlesCount}
          array={positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-color"
          count={particlesCount}
          array={colors}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.05}
        vertexColors
        transparent
        opacity={0.6}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
      />
    </points>
  )
}

