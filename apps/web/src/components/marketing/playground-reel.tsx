"use client";

import { AnimatePresence, motion } from "motion/react";
import { Pause, Play } from "lucide-react";
import { useEffect, useState } from "react";

const STYLES = [
  {
    id: "kinetic",
    label: "Kinetic",
    captions: ["WAIT FOR IT", "THIS CHANGES EVERYTHING", "SAVE THIS"],
    accent: "#e0d6c8",
  },
  {
    id: "editorial",
    label: "Editorial",
    captions: ["A quieter open.", "Then the turn.", "Hold the frame."],
    accent: "#5b8fa8",
  },
  {
    id: "pulse",
    label: "Pulse",
    captions: ["3…", "2…", "GO"],
    accent: "#c4b8a5",
  },
];

export function PlaygroundReel() {
  const [style, setStyle] = useState(STYLES[0]);
  const [playing, setPlaying] = useState(true);
  const [frame, setFrame] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!playing) return;
    const id = window.setInterval(() => {
      setProgress((p) => {
        if (p >= 100) {
          setFrame((f) => (f + 1) % style.captions.length);
          return 0;
        }
        return p + 4;
      });
    }, 80);
    return () => window.clearInterval(id);
  }, [playing, style]);

  useEffect(() => {
    setFrame(0);
    setProgress(0);
  }, [style.id]);

  return (
    <article className="grid items-center gap-10 lg:grid-cols-2 lg:[&>*:first-child]:order-2">
      <div>
        <span className="text-xs tracking-[0.2em] text-champagne uppercase">
          Concept preview · Playable
        </span>
        <h3 className="font-display mt-3 text-2xl font-semibold text-pearl sm:text-3xl">
          From moments to motion.
        </h3>
        <p className="mt-3 text-sm leading-relaxed text-muted-atelier sm:text-base">
          Hit play, scrub the timeline, swap caption languages. A toy reel so
          you can feel short-form pacing before agents generate the real cut.
        </p>
        <div className="mt-6 flex flex-wrap gap-2">
          {STYLES.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setStyle(item)}
              className={`rounded-lg border px-3 py-2 text-xs tracking-wide transition-colors ${
                style.id === item.id
                  ? "border-champagne bg-champagne/10 text-pearl"
                  : "border-atelier text-muted-atelier hover:border-champagne/40 hover:text-pearl"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
        <div className="mt-6 flex items-center gap-3">
          <button
            type="button"
            onClick={() => setPlaying((p) => !p)}
            className="cta-primary inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold"
          >
            {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            {playing ? "Pause" : "Play"}
          </button>
          <button
            type="button"
            onClick={() => {
              setFrame(0);
              setProgress(0);
              setPlaying(true);
            }}
            className="cta-ghost rounded-xl px-5 py-2.5 text-sm"
          >
            Restart
          </button>
        </div>
      </div>

      <div className="relative mx-auto w-full max-w-[280px]">
        <div className="relative aspect-[9/16] overflow-hidden rounded-[1.75rem] border border-atelier bg-surface">
          <motion.div
            animate={{
              background:
                style.id === "editorial"
                  ? "linear-gradient(180deg,#1c2430,#070708)"
                  : style.id === "pulse"
                    ? "linear-gradient(180deg,#2a241c,#070708)"
                    : "linear-gradient(180deg,#1a2228,#070708)",
            }}
            className="absolute inset-3 rounded-[1.25rem]"
          />
          <div className="absolute inset-x-5 top-10 flex gap-1">
            {style.captions.map((_, i) => (
              <div key={i} className="h-1 flex-1 overflow-hidden rounded-full bg-pearl/15">
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: style.accent }}
                  animate={{
                    width:
                      i < frame ? "100%" : i === frame ? `${progress}%` : "0%",
                  }}
                  transition={{ duration: 0.15 }}
                />
              </div>
            ))}
          </div>
          <div className="absolute inset-x-6 bottom-16 min-h-[4.5rem]">
            <AnimatePresence mode="wait">
              <motion.p
                key={`${style.id}-${frame}`}
                initial={{ opacity: 0, y: 18, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.35 }}
                className="font-display text-2xl font-semibold leading-tight text-pearl"
                style={{ color: style.accent }}
              >
                {style.captions[frame]}
              </motion.p>
            </AnimatePresence>
          </div>
        </div>
        <label className="mt-4 block">
          <span className="sr-only">Scrub timeline</span>
          <input
            type="range"
            min={0}
            max={style.captions.length * 100 - 1}
            value={frame * 100 + progress}
            onChange={(e) => {
              setPlaying(false);
              const v = Number(e.target.value);
              setFrame(Math.floor(v / 100));
              setProgress(v % 100);
            }}
            className="h-2 w-full cursor-pointer appearance-none rounded-full bg-surface-raised accent-[#c4b8a5]"
          />
        </label>
      </div>
    </article>
  );
}
