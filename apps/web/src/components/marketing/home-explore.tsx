"use client";

import { motion } from "motion/react";
import { useState } from "react";

const PRODUCT_LOOKS = [
  { id: "studio", label: "Neutral studio", tone: "from-[#2a2a2e] to-[#121214]" },
  { id: "cinema", label: "Cinematic night", tone: "from-[#1a2430] to-[#070708]" },
  { id: "chrome", label: "Liquid chrome", tone: "from-[#3a3834] via-[#c4b8a5]/30 to-[#121214]" },
];

const REEL_STYLES = [
  { id: "kinetic", label: "Kinetic captions" },
  { id: "editorial", label: "Editorial type" },
  { id: "pulse", label: "Pulse cuts" },
];

export function HomeExplore() {
  const [look, setLook] = useState(PRODUCT_LOOKS[1]);
  const [reel, setReel] = useState(REEL_STYLES[0]);

  return (
    <section
      id="explore"
      className="relative border-t border-atelier bg-canvas px-4 py-24 sm:px-6 lg:px-8"
    >
      <div className="atelier-grain absolute inset-0" />
      <div className="relative mx-auto max-w-7xl">
        <div className="max-w-2xl">
          <p className="font-display text-xs tracking-[0.28em] text-champagne uppercase">
            Explore what&apos;s possible
          </p>
          <h2 className="font-display mt-4 text-3xl font-semibold tracking-tight text-pearl sm:text-5xl">
            Creative demos. Real studio next.
          </h2>
          <p className="mt-4 text-base leading-relaxed text-muted-atelier sm:text-lg">
            Interactive previews of where Swappy Studio is headed — labeled
            clearly so you always know what ships today versus what&apos;s next.
          </p>
        </div>

        <div className="mt-16 grid gap-16 lg:gap-24">
          {/* Experience 1 — Product branding (concept) */}
          <article className="grid items-center gap-10 lg:grid-cols-2">
            <div>
              <span className="text-xs tracking-[0.2em] text-champagne uppercase">
                Concept preview
              </span>
              <h3 className="font-display mt-3 text-2xl font-semibold text-pearl sm:text-3xl">
                Make every product a statement.
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-muted-atelier sm:text-base">
                Illustrative sequence: a quiet product silhouette steps into
                cinematic light, brand metal, and campaign atmosphere. Coming
                generation workflows will drive this for real.
              </p>
              <div className="mt-6 flex flex-wrap gap-2">
                {PRODUCT_LOOKS.map((item) => (
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
            </div>
            <motion.div
              key={look.id}
              initial={{ opacity: 0.4, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
              className={`relative aspect-[4/5] overflow-hidden rounded-2xl border border-atelier bg-gradient-to-br ${look.tone}`}
            >
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="h-40 w-28 rounded-xl border border-pearl/20 bg-pearl/5 shadow-[0_30px_80px_rgba(0,0,0,0.45)] backdrop-blur-sm sm:h-52 sm:w-36" />
              </div>
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-canvas/90 to-transparent p-5">
                <p className="text-xs tracking-[0.18em] text-champagne uppercase">
                  {look.label}
                </p>
              </div>
            </motion.div>
          </article>

          {/* Experience 2 — Reels */}
          <article className="grid items-center gap-10 lg:grid-cols-2 lg:[&>*:first-child]:order-2">
            <div>
              <span className="text-xs tracking-[0.2em] text-champagne uppercase">
                Concept preview
              </span>
              <h3 className="font-display mt-3 text-2xl font-semibold text-pearl sm:text-3xl">
                From moments to motion.
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-muted-atelier sm:text-base">
                Vertical frames, caption energy, and aspect shifts — a taste of
                short-form storytelling. Not a live render; a design of the
                workflow agents will power.
              </p>
              <div className="mt-6 flex flex-wrap gap-2">
                {REEL_STYLES.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setReel(item)}
                    className={`rounded-lg border px-3 py-2 text-xs tracking-wide transition-colors ${
                      reel.id === item.id
                        ? "border-champagne bg-champagne/10 text-pearl"
                        : "border-atelier text-muted-atelier hover:border-champagne/40 hover:text-pearl"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="relative mx-auto aspect-[9/16] w-full max-w-[280px] overflow-hidden rounded-[1.75rem] border border-atelier bg-surface">
              <motion.div
                key={reel.id}
                initial={{ y: 24, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.5 }}
                className="absolute inset-3 rounded-[1.25rem] border border-pearl/10 bg-gradient-to-b from-steel/25 to-canvas"
              />
              <div className="absolute inset-x-6 bottom-10 space-y-2">
                <div className="h-2 w-[75%] rounded bg-pearl/80" />
                <div className="h-2 w-[50%] rounded bg-champagne/70" />
                <p className="pt-2 text-[10px] tracking-[0.2em] text-muted-atelier uppercase">
                  {reel.label}
                </p>
              </div>
            </div>
          </article>

          {/* Experience 3 — Agents */}
          <article>
            <div className="max-w-2xl">
              <span className="text-xs tracking-[0.2em] text-champagne uppercase">
                Coming soon
              </span>
              <h3 className="font-display mt-3 text-2xl font-semibold text-pearl sm:text-3xl">
                Your creative team. Reimagined.
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-muted-atelier sm:text-base">
                A coordinated agent loop — strategist to publisher — built on
                Google Agent SDK patterns and MCP tools. Vision first; live
                wiring next.
              </p>
            </div>
            <div className="mt-10 flex flex-wrap items-center gap-3 sm:gap-4">
              {[
                "Idea",
                "Strategy",
                "Script",
                "Visuals",
                "Edit",
                "Publish",
              ].map((node, i) => (
                <div key={node} className="flex items-center gap-3 sm:gap-4">
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-40px" }}
                    transition={{ delay: i * 0.06, duration: 0.45 }}
                    className="rounded-xl border border-atelier bg-surface-raised px-4 py-3 text-sm text-pearl"
                  >
                    {node}
                  </motion.div>
                  {i < 5 && (
                    <span className="hidden text-champagne/50 sm:inline" aria-hidden>
                      →
                    </span>
                  )}
                </div>
              ))}
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}
