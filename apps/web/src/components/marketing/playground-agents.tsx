"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";

const NODES = [
  {
    id: "idea",
    title: "Idea",
    blurb: "Capture the spark — audience, promise, platform.",
  },
  {
    id: "strategy",
    title: "Strategy",
    blurb: "Creative Strategist agent shapes angle and hooks.",
  },
  {
    id: "script",
    title: "Script",
    blurb: "Scriptwriter drafts beats, CTAs, and pacing.",
  },
  {
    id: "visuals",
    title: "Visuals",
    blurb: "Visual Director proposes frames and brand metal.",
  },
  {
    id: "edit",
    title: "Edit",
    blurb: "Editor + MCP tools refine cuts and captions.",
  },
  {
    id: "publish",
    title: "Publish",
    blurb: "Optimizer times the drop with market intelligence.",
  },
];

export function PlaygroundAgents() {
  const [active, setActive] = useState(0);
  const [auto, setAuto] = useState(true);
  const [inView, setInView] = useState(false);
  const rootRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => setInView(!!entry?.isIntersecting),
      { threshold: 0.15 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!auto || !inView) return;
    const id = window.setInterval(() => {
      setActive((i) => (i + 1) % NODES.length);
    }, 2200);
    return () => window.clearInterval(id);
  }, [auto, inView]);

  return (
    <article ref={rootRef}>
      <div className="max-w-2xl">
        <span className="text-xs tracking-[0.2em] text-champagne uppercase">
          Coming soon · Playable map
        </span>
        <h3 className="font-display mt-3 text-2xl font-semibold text-pearl sm:text-3xl">
          Your creative team. Reimagined.
        </h3>
        <p className="mt-3 text-sm leading-relaxed text-muted-atelier sm:text-base">
          Click any agent stage or let the loop run. This is the future Agent
          SDK + MCP path — explorative UI, not a live generation run.
        </p>
        <button
          type="button"
          onClick={() => setAuto((a) => !a)}
          className="cta-ghost mt-5 rounded-xl px-4 py-2 text-sm"
        >
          {auto ? "Pause auto-flow" : "Resume auto-flow"}
        </button>
      </div>

      <div className="mt-10 flex flex-wrap gap-3">
        {NODES.map((node, i) => {
          const on = i === active;
          return (
            <button
              key={node.id}
              type="button"
              onClick={() => {
                setAuto(false);
                setActive(i);
              }}
              className={`relative rounded-xl border px-4 py-3 text-left text-sm transition-all ${
                on
                  ? "border-champagne bg-champagne/15 text-pearl scale-[1.03]"
                  : "border-atelier bg-surface-raised text-muted-atelier hover:border-champagne/40 hover:text-pearl"
              }`}
            >
              <span className="block text-[10px] tracking-[0.16em] uppercase opacity-70">
                0{i + 1}
              </span>
              {node.title}
              {on && (
                <motion.span
                  layoutId="agent-glow"
                  className="absolute inset-0 -z-10 rounded-xl bg-champagne/5"
                  transition={{ type: "spring", stiffness: 280, damping: 24 }}
                />
              )}
            </button>
          );
        })}
      </div>

      <div className="mt-6 overflow-hidden rounded-2xl border border-atelier bg-canvas p-6 sm:p-8">
        <div className="mb-4 h-1 overflow-hidden rounded-full bg-surface-raised">
          <motion.div
            className="h-full bg-gradient-to-r from-champagne to-steel"
            animate={{ width: `${((active + 1) / NODES.length) * 100}%` }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          />
        </div>
        <AnimatePresence mode="wait">
          <motion.div
            key={NODES[active].id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.35 }}
          >
            <p className="font-display text-xl text-pearl sm:text-2xl">
              {NODES[active].title}
            </p>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted-atelier sm:text-base">
              {NODES[active].blurb}
            </p>
          </motion.div>
        </AnimatePresence>
      </div>
    </article>
  );
}
