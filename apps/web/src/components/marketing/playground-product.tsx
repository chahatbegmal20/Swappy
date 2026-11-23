"use client";

import { motion, useMotionValue, useSpring, useTransform } from "motion/react";
import { useRef, useState, type PointerEvent } from "react";

const LOOKS = [
  {
    id: "studio",
    label: "Neutral",
    bg: "radial-gradient(circle at 40% 30%, #3a3a40 0%, #121214 55%, #070708 100%)",
  },
  {
    id: "cinema",
    label: "Cinema",
    bg: "radial-gradient(circle at 60% 20%, #2a4050 0%, #101820 50%, #070708 100%)",
  },
  {
    id: "chrome",
    label: "Chrome",
    bg: "radial-gradient(circle at 50% 40%, #c4b8a5 0%, #5b8fa8 35%, #1c1c1f 70%, #070708 100%)",
  },
];

export function PlaygroundProduct() {
  const [look, setLook] = useState(LOOKS[1]);
  const [compare, setCompare] = useState(0.35);
  const [light, setLight] = useState(65);
  const ref = useRef<HTMLDivElement>(null);
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const rotX = useSpring(useTransform(my, [-0.5, 0.5], [14, -14]), {
    stiffness: 120,
    damping: 18,
  });
  const rotY = useSpring(useTransform(mx, [-0.5, 0.5], [-18, 18]), {
    stiffness: 120,
    damping: 18,
  });

  function onPointer(e: PointerEvent<HTMLDivElement>) {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    mx.set((e.clientX - rect.left) / rect.width - 0.5);
    my.set((e.clientY - rect.top) / rect.height - 0.5);
  }

  return (
    <article className="grid items-center gap-10 lg:grid-cols-2">
      <div>
        <span className="text-xs tracking-[0.2em] text-champagne uppercase">
          Concept preview · Playable
        </span>
        <h3 className="font-display mt-3 text-2xl font-semibold text-pearl sm:text-3xl">
          Make every product a statement.
        </h3>
        <p className="mt-3 text-sm leading-relaxed text-muted-atelier sm:text-base">
          Drag over the stage, morph the environment, dial the light, and wipe
          before → after. Generation agents will drive this for real later —
          right now it&apos;s pure feel.
        </p>

        <div className="mt-6 flex flex-wrap gap-2">
          {LOOKS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setLook(item)}
              className={`rounded-lg border px-3 py-2 text-xs tracking-wide transition-colors ${
                look.id === item.id
                  ? "border-champagne bg-champagne/10 text-pearl"
                  : "border-atelier text-muted-atelier hover:border-champagne/40 hover:text-pearl"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        <label className="mt-6 block">
          <div className="mb-2 flex justify-between text-xs text-muted-atelier uppercase tracking-wide">
            <span>Lighting drama</span>
            <span className="text-champagne">{light}%</span>
          </div>
          <input
            type="range"
            min={15}
            max={100}
            value={light}
            onChange={(e) => setLight(Number(e.target.value))}
            className="h-2 w-full cursor-pointer appearance-none rounded-full bg-surface-raised accent-[#c4b8a5]"
          />
        </label>

        <label className="mt-5 block">
          <div className="mb-2 flex justify-between text-xs text-muted-atelier uppercase tracking-wide">
            <span>Before / after wipe</span>
            <span className="text-champagne">{Math.round(compare * 100)}%</span>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            value={compare * 100}
            onChange={(e) => setCompare(Number(e.target.value) / 100)}
            className="h-2 w-full cursor-pointer appearance-none rounded-full bg-surface-raised accent-[#5b8fa8]"
          />
        </label>
      </div>

      <div
        ref={ref}
        onPointerMove={onPointer}
        onPointerLeave={() => {
          mx.set(0);
          my.set(0);
        }}
        className="relative aspect-[4/5] cursor-grab overflow-hidden rounded-2xl border border-atelier active:cursor-grabbing"
        style={{ background: look.bg }}
      >
        <motion.div
          style={{
            rotateX: rotX,
            rotateY: rotY,
            transformPerspective: 900,
          }}
          className="absolute inset-0 flex items-center justify-center"
        >
          {/* Before (flat) */}
          <div
            className="absolute inset-0 flex items-center justify-center"
            style={{
              clipPath: `inset(0 ${100 - compare * 100}% 0 0)`,
              filter: `brightness(${0.55 + light / 220})`,
            }}
          >
            <div className="h-44 w-32 rounded-lg bg-[#2a2a2e] sm:h-56 sm:w-40" />
          </div>
          {/* After (premium) */}
          <div
            className="absolute inset-0 flex items-center justify-center"
            style={{
              clipPath: `inset(0 0 0 ${compare * 100}%)`,
              filter: `brightness(${0.7 + light / 140}) saturate(1.15)`,
            }}
          >
            <div
              className="h-44 w-32 rounded-xl border border-pearl/25 sm:h-56 sm:w-40"
              style={{
                background:
                  "linear-gradient(145deg, rgba(244,241,236,0.35), rgba(196,184,165,0.15), rgba(91,143,168,0.2))",
                boxShadow: `0 ${20 + light / 4}px ${60 + light}px rgba(0,0,0,0.5)`,
              }}
            />
          </div>
          <div
            className="absolute top-0 bottom-0 w-px bg-champagne/80"
            style={{ left: `${compare * 100}%` }}
          />
        </motion.div>
        <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-canvas/90 to-transparent p-5">
          <p className="text-xs tracking-[0.18em] text-champagne uppercase">
            Drag · wipe · light — {look.label}
          </p>
        </div>
      </div>
    </article>
  );
}
