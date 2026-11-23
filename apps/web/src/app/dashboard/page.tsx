"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  Upload,
  Plus,
  ArrowRight,
  Flame,
  Sparkles,
  ExternalLink,
  ArrowUpRight,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

import { api, type Score, type TrendSignal } from "@/lib/api";
import {
  cn,
  formatScore,
  getScoreColor,
  getSignalTypeColor,
} from "@/lib/utils";
import {
  getTrendSourceLabel,
  getTrendSourceUrl,
} from "@/lib/trend-links";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AuthGuard } from "@/components/auth-guard";
import { StudioShell } from "@/components/studio/studio-shell";
import { NewProjectModal } from "./new-project-modal";

export default function DashboardPage() {
  return (
    <AuthGuard>
      <DashboardContent />
    </AuthGuard>
  );
}

function DashboardContent() {
  const router = useRouter();
  const [modalOpen, setModalOpen] = useState(false);

  const { data: dashboard, isLoading: dashLoading } = useQuery({
    queryKey: ["creator-dashboard"],
    queryFn: () => api.getCreatorDashboard(),
  });

  const { data: projects } = useQuery({
    queryKey: ["projects"],
    queryFn: () => api.getProjects(),
  });

  const { data: market } = useQuery({
    queryKey: ["market-overview"],
    queryFn: () => api.getMarketOverview(),
  });

  const totalProjects = dashboard?.total_projects ?? 0;
  const totalUploads = dashboard?.total_uploads ?? 0;
  const avgScore = dashboard?.average_viability ?? 0;
  const bestScore =
    dashboard?.recent_scores?.reduce(
      (max: number, s: Score) => Math.max(max, s.overall_viability),
      0,
    ) ?? 0;

  const chartData =
    dashboard?.recent_scores
      ?.slice()
      .sort(
        (a, b) =>
          new Date(a.scored_at).getTime() - new Date(b.scored_at).getTime(),
      )
      .map((s) => ({
        date: new Date(s.scored_at).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        }),
        score: Math.round(s.overall_viability * 100),
      })) ?? [];

  const hotTrends = market?.hot_trends?.slice(0, 8) ?? [];
  const emergingTrends = market?.emerging_trends?.slice(0, 6) ?? [];

  return (
    <StudioShell
      title="Command"
      subtitle="Score drafts, watch the radar, prepare the agent lane — one atelier surface."
      actions={
        <>
          <Button variant="outline" onClick={() => router.push("/upload")}>
            <Upload className="h-4 w-4" />
            Score content
          </Button>
          <Button onClick={() => setModalOpen(true)}>
            <Plus className="h-4 w-4" />
            New project
          </Button>
        </>
      }
    >
      {/* Atelier hero strip — not a card row */}
      <section className="relative mb-10 overflow-hidden rounded-[1.75rem] border border-atelier bg-surface">
        <div className="atelier-grain absolute inset-0" aria-hidden />
        <div
          className="pointer-events-none absolute -right-16 -top-24 h-72 w-72 rounded-full opacity-40"
          style={{
            background:
              "radial-gradient(circle, rgba(196,184,165,0.22), transparent 68%)",
          }}
          aria-hidden
        />
        <div className="relative grid gap-8 p-6 sm:p-8 lg:grid-cols-[1.4fr_1fr] lg:p-10">
          <div>
            <p className="font-display text-[11px] tracking-[0.32em] text-champagne uppercase">
              Live atelier
            </p>
            <h2 className="font-display mt-3 max-w-lg text-3xl leading-tight text-pearl sm:text-4xl">
              Create with{" "}
              <span className="gradient-text">predictive confidence</span>
            </h2>
            <p className="mt-3 max-w-md text-sm leading-relaxed text-muted-atelier">
              Your projects, viability, and market heat on one surface —
              champagne, pearl, and steel. No purple dashboard leftovers.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/upload"
                className="cta-primary inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold"
              >
                Open score lane
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/trends"
                className="cta-ghost inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm"
              >
                Open radar
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-atelier bg-atelier">
            <Metric
              label="Projects"
              value={dashLoading ? "—" : String(totalProjects)}
            />
            <Metric
              label="Uploads"
              value={dashLoading ? "—" : String(totalUploads)}
            />
            <Metric
              label="Avg viability"
              value={
                dashLoading
                  ? "—"
                  : avgScore > 0
                    ? `${formatScore(avgScore)}%`
                    : "—"
              }
              valueClass={avgScore > 0 ? getScoreColor(avgScore) : undefined}
            />
            <Metric
              label="Best score"
              value={
                dashLoading
                  ? "—"
                  : bestScore > 0
                    ? `${formatScore(bestScore)}%`
                    : "—"
              }
              valueClass={bestScore > 0 ? getScoreColor(bestScore) : undefined}
            />
          </div>
        </div>
      </section>

      <div className="mb-8 grid gap-3 sm:grid-cols-3">
        <Lane title="Score" body="Upload a draft. Feel the prediction." href="/upload" live />
        <Lane title="Radar" body="What’s heating up before you create." href="/trends" live />
        <Lane title="Agents" body="Create & refine with AI — warming up." href="#agents" live={false} />
      </div>

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1.55fr)_minmax(280px,0.9fr)]">
        <div className="min-w-0 space-y-10">
          <section>
            <div className="mb-4 flex items-end justify-between gap-3">
              <div>
                <p className="font-display text-[10px] tracking-[0.28em] text-champagne uppercase">
                  Library
                </p>
                <h3 className="font-display mt-1 text-2xl text-pearl">
                  Recent projects
                </h3>
              </div>
              <Button size="sm" onClick={() => setModalOpen(true)}>
                <Plus className="h-4 w-4" />
                New
              </Button>
            </div>

            {!projects?.length ? (
              <div className="rounded-2xl border border-dashed border-atelier px-6 py-14 text-center">
                <p className="font-display text-lg text-pearl">Empty atelier</p>
                <p className="mt-2 text-sm text-muted-atelier">
                  Start a project, then score your first draft.
                </p>
                <Button className="mt-5" onClick={() => setModalOpen(true)}>
                  Create project
                </Button>
              </div>
            ) : (
              <ul className="divide-y divide-[color:var(--border)] rounded-2xl border border-atelier bg-surface/60">
                {projects.slice(0, 8).map((project, idx) => {
                  const recentScore =
                    dashboard?.recent_scores?.find(
                      (s) => s.project_id === project.id,
                    ) ??
                    (idx === 0 ? dashboard?.recent_scores?.[0] : undefined);
                  return (
                    <li key={project.id}>
                      <Link
                        href={`/project/${project.id}`}
                        className="group flex items-center gap-4 px-5 py-4 transition-colors hover:bg-champagne/[0.04]"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h4 className="font-display text-base text-pearl group-hover:text-champagne">
                              {project.name}
                            </h4>
                            <Badge
                              variant={recentScore ? "success" : "default"}
                            >
                              {recentScore ? "Scored" : "Pending"}
                            </Badge>
                          </div>
                          {project.description && (
                            <p className="mt-1 line-clamp-1 text-sm text-muted-atelier">
                              {project.description}
                            </p>
                          )}
                          <p className="mt-1 text-[11px] text-muted-atelier">
                            {new Date(project.created_at).toLocaleDateString()}
                            {project.target_platform
                              ? ` · ${project.target_platform}`
                              : ""}
                          </p>
                        </div>
                        <div className="flex shrink-0 items-center gap-3">
                          {recentScore && (
                            <span
                              className={cn(
                                "font-display text-xl tabular-nums",
                                getScoreColor(recentScore.overall_viability),
                              )}
                            >
                              {formatScore(recentScore.overall_viability)}%
                            </span>
                          )}
                          <ArrowUpRight className="h-4 w-4 text-muted-atelier transition-colors group-hover:text-champagne" />
                        </div>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          <section>
            <p className="font-display text-[10px] tracking-[0.28em] text-champagne uppercase">
              Trajectory
            </p>
            <h3 className="font-display mt-1 mb-4 text-2xl text-pearl">
              Score history
            </h3>
            <div className="rounded-2xl border border-atelier bg-surface/60 p-4 sm:p-6">
              {chartData.length < 2 ? (
                <p className="py-16 text-center text-sm text-muted-atelier">
                  History appears after you analyze a few drafts.
                </p>
              ) : (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={chartData}
                      margin={{ top: 5, right: 12, left: 0, bottom: 5 }}
                    >
                      <defs>
                        <linearGradient
                          id="scoreGradient"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="5%"
                            stopColor="#c4b8a5"
                            stopOpacity={0.45}
                          />
                          <stop
                            offset="95%"
                            stopColor="#c4b8a5"
                            stopOpacity={0}
                          />
                        </linearGradient>
                      </defs>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="#2a2a2e"
                        vertical={false}
                      />
                      <XAxis
                        dataKey="date"
                        tick={{ fill: "#9a958c", fontSize: 12 }}
                        axisLine={{ stroke: "#2a2a2e" }}
                        tickLine={false}
                      />
                      <YAxis
                        domain={[0, 100]}
                        tick={{ fill: "#9a958c", fontSize: 12 }}
                        axisLine={{ stroke: "#2a2a2e" }}
                        tickLine={false}
                        tickFormatter={(v) => `${v}%`}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#121214",
                          border: "1px solid #2a2a2e",
                          borderRadius: 12,
                          color: "#f4f1ec",
                        }}
                        labelStyle={{ color: "#9a958c" }}
                        formatter={(value) => [`${value}%`, "Score"]}
                      />
                      <Area
                        type="monotone"
                        dataKey="score"
                        stroke="#c4b8a5"
                        strokeWidth={2}
                        fill="url(#scoreGradient)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </section>

          <section id="agents" className="rounded-2xl border border-atelier bg-surface/60 p-6 sm:p-8">
            <div className="flex flex-wrap items-center gap-3">
              <Sparkles className="h-5 w-5 text-champagne" />
              <h3 className="font-display text-2xl text-pearl">Agent lane</h3>
              <Badge variant="warning">Coming soon</Badge>
            </div>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-atelier">
              Soon you&apos;ll produce, update, and edit with AI agents and MCP
              tools — without leaving this experience center.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              {["Strategist", "Script", "Visuals", "Editor", "Publish"].map(
                (n) => (
                  <span
                    key={n}
                    className="rounded-lg border border-atelier px-3 py-1.5 text-xs tracking-wide text-muted-atelier"
                  >
                    {n}
                  </span>
                ),
              )}
            </div>
          </section>
        </div>

        {/* Radar column — external source links */}
        <aside className="space-y-8">
          <TrendPanel
            title="Hot trends"
            eyebrow="Live radar"
            icon={<Flame className="h-4 w-4 text-[#b45a5a]" />}
            trends={hotTrends}
            empty="No hot trends yet — open Radar to refresh."
          />
          <TrendPanel
            title="Emerging"
            eyebrow="Rising"
            icon={<Sparkles className="h-4 w-4 text-[#6f9b7a]" />}
            trends={emergingTrends}
            empty="No emerging signals yet."
            signalFallback="emerging"
          />
          <Link
            href="/trends"
            className="flex items-center justify-between rounded-2xl border border-champagne/35 bg-champagne/10 px-5 py-4 text-sm font-medium text-pearl transition-colors hover:bg-champagne/15"
          >
            Open full radar
            <ArrowRight className="h-4 w-4 text-champagne" />
          </Link>
        </aside>
      </div>

      <NewProjectModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreated={(project) => {
          setModalOpen(false);
          router.push(`/upload?project=${project.id}`);
        }}
      />
    </StudioShell>
  );
}

function Metric({
  label,
  value,
  valueClass,
}: {
  label: string;
  value: string;
  valueClass?: string;
}) {
  return (
    <div className="bg-surface px-4 py-5 sm:px-5">
      <p className="text-[11px] tracking-[0.18em] text-muted-atelier uppercase">
        {label}
      </p>
      <p
        className={cn(
          "font-display mt-2 text-3xl tabular-nums tracking-tight",
          valueClass ?? "text-pearl",
        )}
      >
        {value}
      </p>
    </div>
  );
}

function Lane({
  title,
  body,
  href,
  live,
}: {
  title: string;
  body: string;
  href: string;
  live: boolean;
}) {
  return (
    <Link
      href={href}
      className="group rounded-2xl border border-atelier bg-surface/80 px-5 py-5 transition-all hover:border-champagne/40"
    >
      <div className="flex items-center justify-between gap-2">
        <p className="font-display text-xl text-pearl group-hover:text-champagne">
          {title}
        </p>
        <Badge variant={live ? "success" : "warning"}>
          {live ? "Live" : "Soon"}
        </Badge>
      </div>
      <p className="mt-2 text-sm text-muted-atelier">{body}</p>
    </Link>
  );
}

function TrendPanel({
  title,
  eyebrow,
  icon,
  trends,
  empty,
  signalFallback = "hot",
}: {
  title: string;
  eyebrow: string;
  icon: React.ReactNode;
  trends: TrendSignal[];
  empty: string;
  signalFallback?: string;
}) {
  return (
    <section>
      <div className="mb-3 flex items-center gap-2">
        {icon}
        <div>
          <p className="font-display text-[10px] tracking-[0.28em] text-champagne uppercase">
            {eyebrow}
          </p>
          <h3 className="font-display text-xl text-pearl">{title}</h3>
        </div>
      </div>
      {trends.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-atelier px-4 py-8 text-center text-sm text-muted-atelier">
          {empty}
        </p>
      ) : (
        <ul className="space-y-2">
          {trends.map((trend) => {
            const href = getTrendSourceUrl(trend);
            const label = getTrendSourceLabel(trend);
            return (
              <li key={`${trend.topic}-${trend.region}-${trend.source}`}>
                <a
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={label}
                  className="group flex items-start gap-3 rounded-xl border border-atelier bg-surface/70 px-3.5 py-3 transition-all hover:border-champagne/40 hover:bg-champagne/[0.06]"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium leading-snug text-pearl group-hover:text-champagne">
                      {trend.topic}
                    </p>
                    <p className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-muted-atelier">
                      <span className="inline-flex items-center gap-1 text-champagne/90">
                        <ExternalLink className="h-3 w-3" />
                        {label.replace("Open on ", "")}
                      </span>
                      {trend.region ? <span>· {trend.region}</span> : null}
                      <span>· +{Math.round(trend.velocity)}%</span>
                    </p>
                  </div>
                  <span
                    className={cn(
                      "mt-0.5 shrink-0 rounded-md border px-2 py-0.5 text-[10px] font-medium",
                      getSignalTypeColor(
                        trend.signal_type || signalFallback,
                      ),
                    )}
                  >
                    {trend.signal_type || signalFallback}
                  </span>
                </a>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
