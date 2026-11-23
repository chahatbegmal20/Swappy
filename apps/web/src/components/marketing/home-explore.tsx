"use client";

import { PlaygroundProduct } from "@/components/marketing/playground-product";
import { PlaygroundReel } from "@/components/marketing/playground-reel";
import { PlaygroundAgents } from "@/components/marketing/playground-agents";

export function HomeExplore() {
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
            Don&apos;t just read it. Play with it.
          </h2>
          <p className="mt-4 text-base leading-relaxed text-muted-atelier sm:text-lg">
            Drag, scrub, pulse, and click through living demos — so you feel
            Swappy Studio before you sign in. Concept pieces stay clearly labeled.
          </p>
        </div>

        <div className="mt-16 grid gap-20 lg:gap-28">
          <PlaygroundProduct />
          <PlaygroundReel />
          <PlaygroundAgents />
        </div>
      </div>
    </section>
  );
}
