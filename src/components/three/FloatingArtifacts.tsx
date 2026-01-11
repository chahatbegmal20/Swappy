'use client'

import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Float, MeshDistortMaterial, Sphere, Torus, Octahedron, Icosahedron } from '@react-three/drei'
import * as THREE from 'three'

function FloatingSphere({ position, color, speed }: any) {
  const meshRef = useRef<THREE.Mesh>(null!)
  
  useFrame(({ clock }) => {
    meshRef.current.rotation.x = clock.getElapsedTime() * speed
    meshRef.current.rotation.y = clock.getElapsedTime() * speed * 0.5
  })
  
  return (
    <Float speed={2} rotationIntensity={1} floatIntensity={2}>
      <Sphere ref={meshRef} args={[0.5, 32, 32]} position={position}>
        <MeshDistortMaterial
          color={color}
          attach="material"
          distort={0.3}
          speed={2}
          roughness={0.2}
          metalness={0.8}
        />
      </Sphere>
    </Float>
  )
}

function FloatingTorus({ position, color }: any) {
  const meshRef = useRef<THREE.Mesh>(null!)
  
  useFrame(({ clock }) => {
    meshRef.current.rotation.x = clock.getElapsedTime() * 0.3
    meshRef.current.rotation.y = clock.getElapsedTime() * 0.4
    meshRef.current.rotation.z = clock.getElapsedTime() * 0.2
  })
  
  return (
    <Float speed={1.5} rotationIntensity={2} floatIntensity={1.5}>
      <Torus ref={meshRef} args={[0.6, 0.2, 16, 32]} position={position}>
        <meshStandardMaterial
          color={color}
          roughness={0.1}
          metalness={0.9}
          emissive={color}
          emissiveIntensity={0.3}
        />
      </Torus>
    </Float>
  )
}

function FloatingOctahedron({ position, color }: any) {
  const meshRef = useRef<THREE.Mesh>(null!)
  
  useFrame(({ clock }) => {
    meshRef.current.rotation.x = clock.getElapsedTime() * 0.5
    meshRef.current.rotation.y = clock.getElapsedTime() * 0.3
  })
  
  return (
    <Float speed={3} rotationIntensity={1.5} floatIntensity={2}>
      <Octahedron ref={meshRef} args={[0.7]} position={position}>
        <meshStandardMaterial
          color={color}
          roughness={0.2}
          metalness={0.8}
          wireframe
        />
      </Octahedron>
    </Float>
  )
}

function FloatingIcosahedron({ position, color }: any) {
  const meshRef = useRef<THREE.Mesh>(null!)
  
  useFrame(({ clock }) => {
    meshRef.current.rotation.x = clock.getElapsedTime() * 0.2
    meshRef.current.rotation.y = clock.getElapsedTime() * 0.4
    meshRef.current.rotation.z = clock.getElapsedTime() * 0.1
  })
  
  return (
    <Float speed={2.5} rotationIntensity={1} floatIntensity={1.8}>
      <Icosahedron ref={meshRef} args={[0.5]} position={position}>
        <MeshDistortMaterial
          color={color}
          distort={0.4}
          speed={3}
          roughness={0}
          metalness={1}
        />
      </Icosahedron>
    </Float>
  )
}

export default function FloatingArtifacts() {
  return (
    <group>
      {/* Fuchsia artifacts */}
      <FloatingSphere position={[-4, 2, -2]} color="#FF006E" speed={0.2} />
      <FloatingTorus position={[4, -1, -1]} color="#FF006E" />
      <FloatingOctahedron position={[-3, -2, 0]} color="#FF006E" />
      
      {/* Cyan artifacts */}
      <FloatingSphere position={[3, 3, -3]} color="#00F5FF" speed={0.3} />
      <FloatingIcosahedron position={[-2, 1, -2]} color="#00F5FF" />
      <FloatingTorus position={[2, -3, -1]} color="#00F5FF" />
      
      {/* Gold artifacts */}
      <FloatingOctahedron position={[5, 0, -2]} color="#FFB800" />
      <FloatingIcosahedron position={[-5, -1, -1]} color="#FFB800" />
      
      {/* Purple artifacts */}
      <FloatingSphere position={[0, 4, -4]} color="#8B00FF" speed={0.25} />
      <FloatingTorus position={[0, -4, -2]} color="#8B00FF" />
    </group>
  )
}

