"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { Float } from "@react-three/drei";
import { Suspense, useEffect, useRef } from "react";
import type { Group, Mesh } from "three";

/** Lightweight hero mesh — no transmission / HDR env (those crush FPS). */
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
    if (reduceMotion) {
      group.current.rotation.y = 0.35;
      return;
    }
    const t = state.clock.elapsedTime;
    group.current.rotation.y = t * 0.14 + pointer.current.x * 0.2;
    group.current.rotation.x =
      Math.sin(t * 0.28) * 0.1 + pointer.current.y * 0.1;
  });

  return (
    <Float
      speed={reduceMotion ? 0 : 0.9}
      rotationIntensity={reduceMotion ? 0 : 0.25}
      floatIntensity={reduceMotion ? 0 : 0.4}
    >
      <group ref={group}>
        <mesh ref={mesh}>
          <icosahedronGeometry args={[1.3, 0]} />
          <meshStandardMaterial
            color="#c4b8a5"
            metalness={0.85}
            roughness={0.28}
            envMapIntensity={0.6}
          />
        </mesh>
        <mesh scale={1.45}>
          <icosahedronGeometry args={[1, 0]} />
          <meshBasicMaterial
            color="#e0d6c8"
            wireframe
            transparent
            opacity={0.14}
          />
        </mesh>
      </group>
    </Float>
  );
}

function Scene({ reduceMotion }: { reduceMotion: boolean }) {
  return (
    <>
      <ambientLight intensity={0.45} />
      <directionalLight position={[4, 5, 2]} intensity={1.2} color="#f4f1ec" />
      <directionalLight position={[-3, -1, -3]} intensity={0.4} color="#5b8fa8" />
      <LiquidForm reduceMotion={reduceMotion} />
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
        dpr={[1, 1.25]}
        frameloop={reduceMotion ? "never" : "always"}
        camera={{ position: [0, 0, 4.2], fov: 42 }}
        gl={{
          antialias: false,
          alpha: true,
          powerPreference: "high-performance",
          stencil: false,
          depth: true,
        }}
      >
        <Suspense fallback={null}>
          <Scene reduceMotion={reduceMotion} />
        </Suspense>
      </Canvas>
    </div>
  );
}
