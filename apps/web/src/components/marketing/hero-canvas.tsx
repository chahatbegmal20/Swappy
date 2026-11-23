"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { HeroSculptureFallback } from "@/components/three/hero-sculpture-fallback";

const HeroSculpture = dynamic(
  () =>
    import("@/components/three/hero-sculpture").then((m) => m.HeroSculpture),
  { ssr: false, loading: () => <HeroSculptureFallback className="h-full w-full" /> },
);

export function HeroCanvas() {
  const [ready, setReady] = useState(false);
  const [useWebGL, setUseWebGL] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const narrow = window.matchMedia("(max-width: 768px)");
    const reduced = motionQuery.matches;
    setReduceMotion(reduced);

    let glOk = false;
    try {
      const canvas = document.createElement("canvas");
      glOk = !!(
        canvas.getContext("webgl2") || canvas.getContext("webgl")
      );
    } catch {
      glOk = false;
    }

    // Mobile / reduced motion → CSS sculpture for LCP and battery.
    setUseWebGL(glOk && !reduced && !narrow.matches);
    setReady(true);

    const sync = () => {
      setReduceMotion(motionQuery.matches);
      setUseWebGL(glOk && !motionQuery.matches && !narrow.matches);
    };
    motionQuery.addEventListener("change", sync);
    narrow.addEventListener("change", sync);
    return () => {
      motionQuery.removeEventListener("change", sync);
      narrow.removeEventListener("change", sync);
    };
  }, []);

  if (!ready) {
    return <HeroSculptureFallback className="h-full w-full" />;
  }

  if (!useWebGL) {
    return <HeroSculptureFallback className="h-full w-full" />;
  }

  return (
    <HeroSculpture className="h-full w-full" reduceMotion={reduceMotion} />
  );
}
