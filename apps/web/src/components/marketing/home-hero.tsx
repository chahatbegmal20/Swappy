"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { ArrowRight } from "lucide-react";
import { HeroCanvas } from "@/components/marketing/hero-canvas";
import { useAuthStore } from "@/lib/store";

export function HomeHero() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const studioHref = isAuthenticated ? "/dashboard" : "/auth/register";

  return (
    <section className="relative isolate min-h-[100svh] overflow-hidden bg-canvas">
      {/* Full-bleed visual plane */}
      <div className="absolute inset-0 z-0">
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 90% 70% at 70% 45%, rgba(91,143,168,0.18) 0%, transparent 55%), radial-gradient(ellipse 60% 50% at 20% 20%, rgba(196,184,165,0.12) 0%, transparent 50%), linear-gradient(180deg, #0c0c0e 0%, #070708 55%, #070708 100%)",
          }}
        />
        <div className="absolute inset-y-0 right-0 w-full md:w-[58%]">
          <HeroCanvas />
        </div>
        <div className="atelier-vignette absolute inset-0" />
        <div className="atelier-grain absolute inset-0" />
      </div>

      <div className="relative z-10 mx-auto flex min-h-[100svh] max-w-7xl flex-col justify-end px-4 pb-16 pt-28 sm:px-6 sm:pb-20 lg:justify-center lg:px-8 lg:pb-24 lg:pt-24">
        <div className="max-w-xl lg:max-w-2xl">
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="font-display text-sm font-medium tracking-[0.28em] text-champagne uppercase sm:text-base"
          >
            Swappy Studio
          </motion.p>

          <motion.h1
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.85, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
            className="font-display mt-5 text-[clamp(2.6rem,7vw,5.25rem)] leading-[0.95] font-semibold tracking-tight text-pearl"
          >
            Your Imagination.
            <br />
            Our Intelligence.
            <br />
            <span className="gradient-text">Infinite Possibilities.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.75, delay: 0.18, ease: [0.22, 1, 0.36, 1] }}
            className="mt-6 max-w-md text-base leading-relaxed text-muted-atelier sm:text-lg"
          >
            From the first spark of an idea to content that captivates. Discover
            a new way to create, transform, and bring your vision to life with
            AI.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className="mt-10 flex flex-wrap items-center gap-3"
          >
            <Link
              href={studioHref}
              className="cta-primary inline-flex items-center gap-2 rounded-xl px-7 py-3.5 text-sm font-semibold tracking-wide"
            >
              Enter the Studio
              <ArrowRight className="h-4 w-4" />
            </Link>
            <a
              href="#try-score"
              className="cta-ghost inline-flex items-center gap-2 rounded-xl px-7 py-3.5 text-sm font-medium tracking-wide"
            >
              Play with a demo
            </a>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
