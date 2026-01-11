'use client'

import { Suspense, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Float, MeshDistortMaterial, Sphere, Environment, Stars } from '@react-three/drei'
import * as THREE from 'three'
import FloatingArtifacts from './FloatingArtifacts'
import ParticleField from './ParticleField'

function AnimatedSphere() {
  const meshRef = useRef<THREE.Mesh>(null!)
  
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime()
    meshRef.current.rotation.x = t * 0.1
    meshRef.current.rotation.y = t * 0.15
    
    // Pulsating effect
    const scale = 2.5 + Math.sin(t * 0.5) * 0.2
    meshRef.current.scale.set(scale, scale, scale)
  })
  
  return (
    <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
      <Sphere ref={meshRef} args={[1, 128, 128]} scale={2.5}>
        <MeshDistortMaterial
          color="#FF006E"
          attach="material"
          distort={0.4}
          speed={2}
          roughness={0.2}
          metalness={0.8}
          emissive="#FF006E"
          emissiveIntensity={0.2}
        />
      </Sphere>
    </Float>
  )
}

function RingSystem() {
  const ring1Ref = useRef<THREE.Mesh>(null!)
  const ring2Ref = useRef<THREE.Mesh>(null!)
  const ring3Ref = useRef<THREE.Mesh>(null!)
  
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime()
    ring1Ref.current.rotation.x = t * 0.3
    ring1Ref.current.rotation.y = t * 0.2
    
    ring2Ref.current.rotation.x = -t * 0.2
    ring2Ref.current.rotation.z = t * 0.3
    
    ring3Ref.current.rotation.y = t * 0.4
    ring3Ref.current.rotation.z = -t * 0.2
  })
  
  return (
    <group>
      <mesh ref={ring1Ref}>
        <torusGeometry args={[3, 0.05, 16, 100]} />
        <meshStandardMaterial color="#00F5FF" emissive="#00F5FF" emissiveIntensity={0.3} />
      </mesh>
      <mesh ref={ring2Ref}>
        <torusGeometry args={[3.5, 0.04, 16, 100]} />
        <meshStandardMaterial color="#FFB800" emissive="#FFB800" emissiveIntensity={0.3} />
      </mesh>
      <mesh ref={ring3Ref}>
        <torusGeometry args={[4, 0.03, 16, 100]} />
        <meshStandardMaterial color="#8B00FF" emissive="#8B00FF" emissiveIntensity={0.3} />
      </mesh>
    </group>
  )
}

function Scene() {
  return (
    <>
      {/* Enhanced Lighting */}
      <ambientLight intensity={0.3} />
      <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={2} castShadow color="#FF006E" />
      <spotLight position={[-10, -10, -10]} angle={0.15} penumbra={1} intensity={1.5} color="#00F5FF" />
      <pointLight position={[10, -10, 10]} intensity={1} color="#FFB800" />
      <pointLight position={[-10, 10, -10]} intensity={1} color="#8B00FF" />
      
      {/* Stars background */}
      <Stars radius={100} depth={50} count={3000} factor={4} saturation={0.5} fade speed={1} />
      
      {/* Main elements */}
      <AnimatedSphere />
      <RingSystem />
      <FloatingArtifacts />
      <ParticleField />
      
      {/* Environment for reflections */}
      <Environment preset="night" />
      
      <OrbitControls
        enableZoom={false}
        enablePan={false}
        autoRotate
        autoRotateSpeed={0.3}
        maxPolarAngle={Math.PI / 1.5}
        minPolarAngle={Math.PI / 3}
      />
    </>
  )
}

export default function Hero3D() {
  return (
    <div className="absolute inset-0 -z-10 opacity-80">
      <Canvas
        camera={{ position: [0, 0, 8], fov: 60 }}
        gl={{ 
          alpha: true, 
          antialias: true,
          powerPreference: 'high-performance'
        }}
        dpr={[1, 2]}
      >
        <Suspense fallback={null}>
          <Scene />
        </Suspense>
      </Canvas>
      
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-atelier-black/50 to-atelier-black pointer-events-none" />
    </div>
  )
}

