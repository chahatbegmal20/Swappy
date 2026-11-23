"use client";

import Link from "next/link";
import { motion } from "motion/react";
import {
  CAPABILITIES,
  STATUS_LABEL,
  type CapabilityStatus,
} from "@/features/capabilities/config";

const statusClass: Record<CapabilityStatus, string> = {
  available: "text-[#6f9b7a] border-[#6f9b7a]/35",
  in_development: "text-champagne border-champagne/35",
  coming_soon: "text-muted-atelier border-atelier",
};

export function HomeCapabilities() {
  return (
    <section
      id="capabilities"
      className="relative border-t border-atelier bg-surface px-4 py-24 sm:px-6 lg:px-8"
    >
      <div className="relative mx-auto max-w-7xl">
        <div className="max-w-2xl">
          <p className="font-display text-xs tracking-[0.28em] text-champagne uppercase">
            Capabilities
          </p>
          <h2 className="font-display mt-4 text-3xl font-semibold tracking-tight text-pearl sm:text-5xl">
            Intelligence that ships. Agents on the horizon.
          </h2>
          <p className="mt-4 text-base leading-relaxed text-muted-atelier sm:text-lg">
            Every item is tagged for what you can use now versus what we&apos;re
            building with AI agents and MCP.
          </p>
        </div>

        <ul className="mt-14 divide-y divide-[color:var(--border)] border-y border-atelier">
          {CAPABILITIES.map((cap, i) => (
            <motion.li
              key={cap.id}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-30px" }}
              transition={{ delay: Math.min(i * 0.04, 0.24), duration: 0.45 }}
              className="grid gap-4 py-7 sm:grid-cols-[1fr_auto] sm:items-center"
            >
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <h3 className="font-display text-xl text-pearl sm:text-2xl">
                    {cap.title}
                  </h3>
                  <span
                    className={`rounded-md border px-2 py-0.5 text-[10px] tracking-[0.16em] uppercase ${statusClass[cap.status]}`}
                  >
                    {STATUS_LABEL[cap.status]}
                  </span>
                </div>
                <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-atelier sm:text-base">
                  {cap.description}
                </p>
              </div>
              {cap.href && cap.status === "available" ? (
                <Link
                  href={cap.href}
                  className="cta-ghost inline-flex justify-center rounded-xl px-5 py-2.5 text-sm"
                >
                  Open
                </Link>
              ) : (
                <span className="text-xs tracking-wide text-muted-atelier uppercase">
                  Watch this space
                </span>
              )}
            </motion.li>
          ))}
        </ul>
      </div>
    </section>
  );
}
