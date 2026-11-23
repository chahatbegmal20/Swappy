"use client";

import { motion, animate } from "motion/react";
import { useEffect, useState } from "react";
import Link from "next/link";

const HOOKS = [
  { id: "tutorial", label: "Tutorial hook", base: [62, 55, 48, 70] },
  { id: "story", label: "Story cold open", base: [78, 71, 66, 74] },
  { id: "trend", label: "Trend ride", base: [88, 82, 79, 85] },
];

const METRICS = ["Virality", "Audience fit", "Trend align", "Timing"];

function Ring({
  value,
  label,
  delay,
}: {
  value: number;
  label: string;
  delay: number;
}) {
  const [display, setDisplay] = useState(0);
  const r = 36;
  const c = 2 * Math.PI * r;
  const offset = c - (value / 100) * c;

  useEffect(() => {
    const controls = animate(0, value, {
      duration: 0.9,
      delay,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => setDisplay(Math.round(v)),
    });
    return () => controls.stop();
  }, [value, delay]);

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative h-24 w-24">
        <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
          <circle
            cx="50"
            cy="50"
            r={r}
            fill="none"
            stroke="rgba(42,42,46,1)"
            strokeWidth="8"
          />
          <motion.circle
            cx="50"
            cy="50"
            r={r}
            fill="none"
            stroke="url(#scoreGrad)"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={c}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 0.9, delay, ease: [0.22, 1, 0.36, 1] }}
          />
          <defs>
            <linearGradient id="scoreGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#e0d6c8" />
              <stop offset="100%" stopColor="#5b8fa8" />
            </linearGradient>
          </defs>
        </svg>
        <div className="absolute inset-0 flex items-center justify-center text-lg font-semibold text-pearl">
          {display}
        </div>
      </div>
      <span className="text-[11px] tracking-wide text-muted-atelier uppercase">
        {label}
      </span>
    </div>
  );
}

/** Playable mock of Swappy scoring — illustrative, not live API. */
export function PlaygroundScore() {
  const [hook, setHook] = useState(HOOKS[0]);
  const [energy, setEnergy] = useState(55);
  const [running, setRunning] = useState(false);

  const scores = hook.base.map((b) =>
    Math.min(99, Math.max(8, Math.round(b + (energy - 50) * 0.35))),
  );

  function runPulse() {
    setRunning(true);
    setEnergy((e) => (e > 70 ? 35 : e + 20));
    window.setTimeout(() => setRunning(false), 900);
  }

  return (
    <section
      id="try-score"
      className="relative border-t border-atelier bg-surface px-4 py-24 sm:px-6 lg:px-8"
    >
      <div className="relative mx-auto max-w-7xl">
        <div className="max-w-2xl">
          <p className="font-display text-xs tracking-[0.28em] text-champagne uppercase">
            Try it · Interactive demo
          </p>
          <h2 className="font-display mt-4 text-3xl font-semibold tracking-tight text-pearl sm:text-5xl">
            Feel a score before you ship.
          </h2>
          <p className="mt-4 text-base leading-relaxed text-muted-atelier sm:text-lg">
            Play with hooks and energy — this is a sandbox preview of how
            Swappy&apos;s intelligence surfaces confidence. Real uploads score
            inside the studio.
          </p>
        </div>

        <div className="mt-12 grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-2xl border border-atelier bg-canvas p-6 sm:p-8">
            <p className="text-xs tracking-[0.18em] text-muted-atelier uppercase">
              Pick a hook style
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {HOOKS.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setHook(item)}
                  className={`rounded-xl border px-4 py-2.5 text-sm transition-all ${
                    hook.id === item.id
                      ? "border-champagne bg-champagne/15 text-pearl scale-[1.02]"
                      : "border-atelier text-muted-atelier hover:border-champagne/40 hover:text-pearl"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>

            <label className="mt-8 block">
              <div className="mb-3 flex justify-between text-xs tracking-wide text-muted-atelier uppercase">
                <span>Creative energy</span>
                <span className="text-champagne">{energy}</span>
              </div>
              <input
                type="range"
                min={20}
                max={95}
                value={energy}
                onChange={(e) => setEnergy(Number(e.target.value))}
                className="h-2 w-full cursor-pointer appearance-none rounded-full bg-surface-raised accent-[#c4b8a5]"
              />
            </label>

            <button
              type="button"
              onClick={runPulse}
              className="cta-primary mt-8 inline-flex rounded-xl px-6 py-3 text-sm font-semibold"
            >
              {running ? "Scoring…" : "Pulse scores"}
            </button>
          </div>

          <div className="rounded-2xl border border-atelier bg-canvas p-6 sm:p-8">
            <div className="grid grid-cols-2 gap-6 sm:grid-cols-2">
              {METRICS.map((label, i) => (
                <Ring
                  key={`${hook.id}-${label}-${scores[i]}`}
                  value={scores[i]}
                  label={label}
                  delay={i * 0.05}
                />
              ))}
            </div>
            <p className="mt-8 text-center text-xs text-muted-atelier">
              Demo only —{" "}
              <Link href="/auth/register" className="text-champagne hover:underline">
                upload a real draft
              </Link>{" "}
              for live scoring.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
