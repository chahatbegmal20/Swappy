"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { ArrowUpRight, Sparkles, Target, Waves } from "lucide-react";

const LANES = [
  {
    id: "score",
    icon: Target,
    title: "Score lane",
    status: "Live",
    copy: "Drop a draft. Feel predictive confidence — virality, fit, timing — before you publish.",
    href: "/upload",
    cta: "Open score studio",
  },
  {
    id: "radar",
    icon: Waves,
    title: "Radar lane",
    status: "Live",
    copy: "Ride demand curves. Explore what’s heating up and what’s fading in your niche.",
    href: "/trends",
    cta: "Enter radar",
  },
  {
    id: "agents",
    icon: Sparkles,
    title: "Agent lane",
    status: "Soon",
    copy: "Create, edit, and refine with AI agents + MCP — the experience center’s next wing.",
    href: "/auth/register",
    cta: "Join the wait",
  },
];

/** Replaces the flat capabilities list with experience-center lanes. */
export function HomeExperience() {
  return (
    <section
      id="experience"
      className="relative border-t border-atelier bg-canvas px-4 py-24 sm:px-6 lg:px-8"
    >
      <div className="relative mx-auto max-w-7xl">
        <div className="max-w-2xl">
          <p className="font-display text-xs tracking-[0.28em] text-champagne uppercase">
            Experience center
          </p>
          <h2 className="font-display mt-4 text-3xl font-semibold tracking-tight text-pearl sm:text-5xl">
            Three lanes. One studio.
          </h2>
          <p className="mt-4 text-base leading-relaxed text-muted-atelier sm:text-lg">
            After you sign in, Swappy feels like an atelier — not a spreadsheet.
            Start in Score or Radar today; Agents open next.
          </p>
        </div>

        <div className="mt-14 grid gap-5 lg:grid-cols-3">
          {LANES.map((lane, i) => {
            const Icon = lane.icon;
            return (
              <motion.div
                key={lane.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ delay: i * 0.08, duration: 0.5 }}
                className="group relative flex flex-col overflow-hidden rounded-2xl border border-atelier bg-surface p-6 transition-colors hover:border-champagne/35"
              >
                <div className="mb-6 flex items-start justify-between">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-atelier bg-canvas text-champagne">
                    <Icon className="h-5 w-5" />
                  </span>
                  <span
                    className={`text-[10px] tracking-[0.18em] uppercase ${
                      lane.status === "Live"
                        ? "text-[#6f9b7a]"
                        : "text-champagne"
                    }`}
                  >
                    {lane.status}
                  </span>
                </div>
                <h3 className="font-display text-2xl text-pearl">{lane.title}</h3>
                <p className="mt-3 flex-1 text-sm leading-relaxed text-muted-atelier">
                  {lane.copy}
                </p>
                <Link
                  href={lane.href}
                  className="mt-8 inline-flex items-center gap-1.5 text-sm text-champagne transition-colors group-hover:text-champagne-bright"
                >
                  {lane.cta}
                  <ArrowUpRight className="h-4 w-4" />
                </Link>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
