"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { ArrowRight } from "lucide-react";
import { useAuthStore } from "@/lib/store";

export function HomeCta() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const href = isAuthenticated ? "/dashboard" : "/auth/register";

  return (
    <section className="relative border-t border-atelier px-4 py-24 sm:px-6 lg:px-8">
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 70% 60% at 50% 100%, rgba(196,184,165,0.12) 0%, transparent 60%)",
        }}
      />
      <div className="relative mx-auto max-w-3xl text-center">
        <motion.h2
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="font-display text-3xl font-semibold tracking-tight text-pearl sm:text-5xl"
        >
          Step into the studio.
        </motion.h2>
        <p className="mx-auto mt-4 max-w-lg text-base text-muted-atelier sm:text-lg">
          Score what you have today. Shape what you&apos;ll create next —
          intelligence now, agents soon.
        </p>
        <Link
          href={href}
          className="cta-primary mt-10 inline-flex items-center gap-2 rounded-xl px-8 py-3.5 text-sm font-semibold"
        >
          Enter the Studio
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </section>
  );
}
