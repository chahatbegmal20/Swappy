import Link from "next/link";
import {
  TrendingUp,
  BarChart3,
  Lightbulb,
  Layers,
  Shield,
  Clock,
  ArrowRight,
  Play,
  Upload,
  Sparkles,
  CheckCircle2,
} from "lucide-react";
import type { Metadata } from "next";
import { DEFAULT_DESCRIPTION, SITE_NAME, SITE_TAGLINE } from "@/lib/seo";

export const metadata: Metadata = {
  title: `${SITE_NAME} — ${SITE_TAGLINE} | Know Before You Publish`,
  description: DEFAULT_DESCRIPTION,
  alternates: { canonical: "/" },
};

const features = [
  {
    icon: TrendingUp,
    title: "Trend Intelligence",
    description:
      "Real-time signals from YouTube, social media, and search. Know what's hot, emerging, or declining.",
  },
  {
    icon: BarChart3,
    title: "Predictive Scoring",
    description:
      "7 AI-powered scores including virality probability, audience fit, and trend creation potential.",
  },
  {
    icon: Lightbulb,
    title: "Smart Recommendations",
    description:
      "Actionable insights on timing, audience targeting, and content improvements.",
  },
  {
    icon: Layers,
    title: "Multimodal Analysis",
    description:
      "Analyze video, audio, thumbnails, and text together for complete content intelligence.",
  },
  {
    icon: Shield,
    title: "Competitive Edge",
    description:
      "Understand market saturation and find opportunities others miss.",
  },
  {
    icon: Clock,
    title: "Launch Timing",
    description:
      "Know the optimal window to publish for maximum impact.",
  },
];

const steps = [
  {
    icon: Upload,
    number: "01",
    title: "Upload your content draft",
    description:
      "Drop in your video, thumbnail, or script — any format works.",
  },
  {
    icon: Sparkles,
    number: "02",
    title: "Get AI-powered analysis in seconds",
    description:
      "Our models score your content across 7 dimensions and surface actionable insights.",
  },
  {
    icon: CheckCircle2,
    number: "03",
    title: "Publish with confidence",
    description:
      "Use data-backed recommendations to optimize timing, targeting, and content.",
  },
];

const scoreCards = [
  { label: "Trend Alignment", value: 87, color: "from-indigo-500 to-cyan-400" },
  { label: "Virality Score", value: 73, color: "from-purple-500 to-pink-400" },
  { label: "Audience Fit", value: 91, color: "from-emerald-500 to-teal-400" },
  { label: "Timing Score", value: 68, color: "from-amber-500 to-orange-400" },
];

export default function LandingPage() {
  return (
    <div className="relative overflow-x-hidden">
      {/* Gradient orbs for ambient background */}
      <div className="pointer-events-none absolute -left-40 -top-40 h-[500px] w-[500px] rounded-full bg-indigo-600/20 blur-[120px]" />
      <div className="pointer-events-none absolute -right-40 top-20 h-[400px] w-[400px] rounded-full bg-cyan-500/15 blur-[120px]" />

      {/* ── Hero ──────────────────────────────────────── */}
      <section className="relative mx-auto max-w-7xl px-4 pb-24 pt-20 sm:px-6 sm:pt-28 lg:px-8 lg:pt-36">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <div className="max-w-xl">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-4 py-1.5 text-sm text-indigo-300">
              <Sparkles className="h-3.5 w-3.5" />
              Swappy — AI Creator Market Intelligence
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl">
              <span className="gradient-text">Swappy</span>
              {" "}
              — know before you publish
            </h1>
            <p className="mt-5 text-lg leading-relaxed text-gray-400 sm:text-xl">
              Creator market intelligence for YouTube, TikTok, and social
              creators. Predict trends, score virality and audience fit, and
              maximize impact before your content goes live.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                href="/auth/register"
                className="gradient-bg inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition hover:opacity-90"
              >
                Start Free
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="#how-it-works"
                className="inline-flex items-center gap-2 rounded-xl border border-gray-700 px-6 py-3 text-sm font-semibold text-gray-300 transition hover:border-gray-500 hover:text-white"
              >
                <Play className="h-4 w-4" />
                See How It Works
              </Link>
            </div>
          </div>

          {/* Floating score cards */}
          <div className="relative hidden lg:block">
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-indigo-600/10 to-cyan-500/10 blur-2xl" />
            <div className="relative grid grid-cols-2 gap-4">
              {scoreCards.map((card, i) => (
                <div
                  key={card.label}
                  className={`glass rounded-2xl p-5 transition-transform hover:scale-105 ${
                    i % 2 === 1 ? "translate-y-6" : ""
                  }`}
                >
                  <p className="text-xs font-medium uppercase tracking-wider text-gray-400">
                    {card.label}
                  </p>
                  <div className="mt-2 flex items-end gap-1">
                    <span
                      className={`bg-gradient-to-r ${card.color} bg-clip-text text-3xl font-bold text-transparent`}
                    >
                      {card.value}
                    </span>
                    <span className="mb-1 text-sm text-gray-500">/100</span>
                  </div>
                  <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-gray-800">
                    <div
                      className={`h-full rounded-full bg-gradient-to-r ${card.color}`}
                      style={{ width: `${card.value}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Features Grid ─────────────────────────────── */}
      <section className="relative mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Everything you need to{" "}
            <span className="gradient-text">publish smarter</span>
          </h2>
          <p className="mt-4 text-lg text-gray-400">
            Comprehensive analysis across every dimension of your content.
          </p>
        </div>

        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map(({ icon: Icon, title, description }) => (
            <div
              key={title}
              className="group glass rounded-2xl p-6 transition-colors hover:border-indigo-500/30"
            >
              <div className="mb-4 inline-flex rounded-xl bg-indigo-500/10 p-3 text-indigo-400 transition-colors group-hover:bg-indigo-500/20">
                <Icon className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-semibold">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-gray-400">
                {description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── How It Works ──────────────────────────────── */}
      <section
        id="how-it-works"
        className="relative mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8"
      >
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            How it <span className="gradient-text">works</span>
          </h2>
          <p className="mt-4 text-lg text-gray-400">
            Three simple steps from draft to data-backed confidence.
          </p>
        </div>

        <div className="mt-16 grid gap-8 md:grid-cols-3">
          {steps.map(({ icon: Icon, number, title, description }) => (
            <div key={number} className="relative text-center">
              <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 to-cyan-500 shadow-lg shadow-indigo-500/25">
                <Icon className="h-7 w-7 text-white" />
              </div>
              <span className="text-xs font-bold uppercase tracking-widest text-indigo-400">
                Step {number}
              </span>
              <h3 className="mt-2 text-lg font-semibold">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-gray-400">
                {description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Bottom CTA ────────────────────────────────── */}
      <section className="relative mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600/20 to-cyan-500/20 p-12 text-center sm:p-16">
          <div className="pointer-events-none absolute -right-20 -top-20 h-60 w-60 rounded-full bg-indigo-600/30 blur-[80px]" />
          <div className="pointer-events-none absolute -bottom-20 -left-20 h-60 w-60 rounded-full bg-cyan-500/20 blur-[80px]" />
          <div className="relative">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Ready to predict your next{" "}
              <span className="gradient-text">hit</span>?
            </h2>
            <p className="mx-auto mt-4 max-w-md text-lg text-gray-400">
              Join creators who publish with confidence, backed by AI-powered
              market intelligence.
            </p>
            <Link
              href="/auth/register"
              className="gradient-bg mt-8 inline-flex items-center gap-2 rounded-xl px-8 py-3.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition hover:opacity-90"
            >
              Start Free
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ────────────────────────────────────── */}
      <footer className="border-t border-white/5 py-10 text-center text-sm text-gray-500">
        <p>
          &copy; Swappy — Creator Market Intelligence. All rights reserved.
        </p>
        <p className="mt-2">
          <Link href="/trends" className="text-gray-400 hover:text-white">
            Live trends
          </Link>
          {" · "}
          <Link href="/auth/register" className="text-gray-400 hover:text-white">
            Start free
          </Link>
        </p>
      </footer>
    </div>
  );
}
