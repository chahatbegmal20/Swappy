"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { Environment, Float, MeshTransmissionMaterial } from "@react-three/drei";
import { Suspense, useEffect, useRef } from "react";
import type { Group, Mesh } from "three";
import * as THREE from "three";

function LiquidForm({ reduceMotion }: { reduceMotion: boolean }) {
  const group = useRef<Group>(null);
  const mesh = useRef<Mesh>(null);
  const pointer = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      pointer.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      pointer.current.y = (e.clientY / window.innerHeight) * 2 - 1;
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, []);

  useFrame((state) => {
    if (!group.current || !mesh.current) return;
    const t = state.clock.elapsedTime;
    if (reduceMotion) {
      group.current.rotation.y = 0.35;
      return;
    }
    group.current.rotation.y = t * 0.18 + pointer.current.x * 0.25;
    group.current.rotation.x = Math.sin(t * 0.35) * 0.12 + pointer.current.y * 0.12;
    mesh.current.scale.setScalar(1 + Math.sin(t * 0.8) * 0.03);
  });

  return (
    <Float
      speed={reduceMotion ? 0 : 1.2}
      rotationIntensity={reduceMotion ? 0 : 0.35}
      floatIntensity={reduceMotion ? 0 : 0.6}
    >
      <group ref={group}>
        <mesh ref={mesh} castShadow>
          <icosahedronGeometry args={[1.35, 1]} />
          <MeshTransmissionMaterial
            backside
            samples={4}
            resolution={256}
            thickness={0.55}
            chromaticAberration={0.06}
            anisotropy={0.2}
            distortion={0.35}
            distortionScale={0.4}
            temporalDistortion={0.12}
            iridescence={0.9}
            iridescenceIOR={1.2}
            iridescenceThicknessRange={[100, 800]}
            color="#c4b8a5"
            attenuationColor="#5b8fa8"
            attenuationDistance={1.2}
          />
        </mesh>
        <mesh scale={1.55}>
          <icosahedronGeometry args={[1, 0]} />
          <meshBasicMaterial
            color="#e0d6c8"
            wireframe
            transparent
            opacity={0.12}
          />
        </mesh>
      </group>
    </Float>
  );
}

function Scene({ reduceMotion }: { reduceMotion: boolean }) {
  return (
    <>
      <ambientLight intensity={0.35} />
      <directionalLight position={[4, 6, 2]} intensity={1.4} color="#f4f1ec" />
      <directionalLight position={[-3, -2, -4]} intensity={0.55} color="#5b8fa8" />
      <LiquidForm reduceMotion={reduceMotion} />
      <Environment preset="city" environmentIntensity={0.45} />
    </>
  );
}

export function HeroSculpture({
  className,
  reduceMotion = false,
}: {
  className?: string;
  reduceMotion?: boolean;
}) {
  return (
    <div className={className} aria-hidden>
      <Canvas
        dpr={[1, 1.5]}
        camera={{ position: [0, 0, 4.2], fov: 42 }}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
        onCreated={({ gl }) => {
          gl.toneMapping = THREE.ACESFilmicToneMapping;
        }}
      >
        <Suspense fallback={null}>
          <Scene reduceMotion={reduceMotion} />
        </Suspense>
      </Canvas>
    </div>
  );
}
