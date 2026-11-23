"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { HeroSculptureFallback } from "@/components/three/hero-sculpture-fallback";

const HeroSculpture = dynamic(
  () =>
    import("@/components/three/hero-sculpture").then((m) => m.HeroSculpture),
  {
    ssr: false,
    loading: () => <HeroSculptureFallback className="h-full w-full" />,
  },
);

/**
 * Prefer CSS sculpture for instant paint.
 * Upgrade to light WebGL only on capable desktop after idle + visible.
 */
export function HeroCanvas() {
  const hostRef = useRef<HTMLDivElement>(null);
  const [useWebGL, setUseWebGL] = useState(false);

  useEffect(() => {
    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const narrow = window.matchMedia("(max-width: 900px)");
    const saveData =
      (navigator as Navigator & { connection?: { saveData?: boolean } })
        .connection?.saveData === true;

    if (motionQuery.matches || narrow.matches || saveData) {
      return;
    }

    let cancelled = false;
    let idleId = 0;
    let timeoutId = 0;

    const enable = () => {
      if (cancelled) return;
      let glOk = false;
      try {
        const c = document.createElement("canvas");
        glOk = !!(c.getContext("webgl2") || c.getContext("webgl"));
      } catch {
        glOk = false;
      }
      if (glOk) setUseWebGL(true);
    };

    const start = () => {
      const el = hostRef.current;
      if (!el || typeof IntersectionObserver === "undefined") {
        enable();
        return;
      }
      const io = new IntersectionObserver(
        ([entry]) => {
          if (entry?.isIntersecting) {
            enable();
            io.disconnect();
          }
        },
        { rootMargin: "80px", threshold: 0.1 },
      );
      io.observe(el);
      return () => io.disconnect();
    };

    // Defer WebGL so first paint / interaction stay snappy.
    const ric = (
      window as Window & {
        requestIdleCallback?: (
          cb: () => void,
          opts?: { timeout: number },
        ) => number;
        cancelIdleCallback?: (id: number) => void;
      }
    ).requestIdleCallback;

    let cleanupIo: (() => void) | undefined;
    if (ric) {
      idleId = ric(
        () => {
          cleanupIo = start() || undefined;
        },
        { timeout: 1800 },
      );
    } else {
      timeoutId = window.setTimeout(() => {
        cleanupIo = start() || undefined;
      }, 900);
    }

    return () => {
      cancelled = true;
      if (idleId && window.cancelIdleCallback) {
        window.cancelIdleCallback(idleId);
      }
      if (timeoutId) window.clearTimeout(timeoutId);
      cleanupIo?.();
    };
  }, []);

  return (
    <div ref={hostRef} className="h-full w-full">
      {useWebGL ? (
        <HeroSculpture className="h-full w-full" />
      ) : (
        <HeroSculptureFallback className="h-full w-full" />
      )}
    </div>
  );
}
