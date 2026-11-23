"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  Folder,
  Upload,
  Star,
  TrendingUp,
  Plus,
  ArrowRight,
  Flame,
  Sparkles,
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

import { api, type Score } from "@/lib/api";
import {
  cn,
  formatScore,
  getScoreColor,
  getSignalTypeColor,
} from "@/lib/utils";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScoreRing } from "@/components/ui/score-ring";
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
        name: s.model_version,
      })) ?? [];

  const hotTrends = market?.hot_trends?.slice(0, 6) ?? [];
  const emergingTrends = market?.emerging_trends?.slice(0, 6) ?? [];

  return (
    <StudioShell
      title="Command"
      subtitle="Your experience center — score what exists, watch the radar, prepare for agents."
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
      {/* Experience lanes strip */}
      <div className="mb-8 grid gap-3 sm:grid-cols-3">
        <LaneCard
          title="Score"
          body="Upload a draft and feel predictive confidence."
          href="/upload"
          live
        />
        <LaneCard
          title="Radar"
          body="See what’s heating up before you create."
          href="/trends"
          live
        />
        <LaneCard
          title="Agents"
          body="Create, edit, and refine with AI — coming soon."
          href="#agents"
          live={false}
        />
      </div>

      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={<Folder className="h-5 w-5 text-champagne" />}
          label="Projects"
          value={dashLoading ? "—" : String(totalProjects)}
        />
        <StatCard
          icon={<Upload className="h-5 w-5 text-steel" />}
          label="Uploads"
          value={dashLoading ? "—" : String(totalUploads)}
        />
        <StatCard
          icon={
            avgScore > 0 ? (
              <ScoreRing score={avgScore} label="" size={40} />
            ) : (
              <TrendingUp className="h-5 w-5 text-[#6f9b7a]" />
            )
          }
          label="Avg viability"
          value={
            dashLoading
              ? "—"
              : avgScore > 0
                ? `${formatScore(avgScore)}%`
                : "N/A"
          }
          valueClass={avgScore > 0 ? getScoreColor(avgScore) : undefined}
        />
        <StatCard
          icon={<Star className="h-5 w-5 text-champagne" />}
          label="Best score"
          value={
            dashLoading
              ? "—"
              : bestScore > 0
                ? `${formatScore(bestScore)}%`
                : "N/A"
          }
          valueClass={bestScore > 0 ? getScoreColor(bestScore) : undefined}
        />
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="space-y-8 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Recent projects</CardTitle>
              <Button size="sm" onClick={() => setModalOpen(true)}>
                <Plus className="h-4 w-4" />
                New
              </Button>
            </CardHeader>
            <CardContent>
              {!projects?.length ? (
                <div className="rounded-xl border border-dashed border-atelier py-12 text-center">
                  <p className="text-muted-atelier">
                    No projects yet — start a score lane.
                  </p>
                  <Button className="mt-4" onClick={() => setModalOpen(true)}>
                    Create project
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {projects.slice(0, 6).map((project) => {
                    const recentScore = dashboard?.recent_scores?.[0];
                    return (
                      <Link
                        key={project.id}
                        href={`/project/${project.id}`}
                        className="group rounded-xl border border-atelier bg-canvas p-4 transition-all hover:border-champagne/35 hover:bg-surface-raised/40"
                      >
                        <div className="mb-2 flex items-start justify-between gap-2">
                          <h4 className="font-medium text-pearl group-hover:text-champagne">
                            {project.name}
                          </h4>
                          {recentScore && (
                            <span
                              className={cn(
                                "text-sm font-semibold",
                                getScoreColor(recentScore.overall_viability),
                              )}
                            >
                              {formatScore(recentScore.overall_viability)}%
                            </span>
                          )}
                        </div>
                        {project.description && (
                          <p className="mb-3 line-clamp-2 text-sm text-muted-atelier">
                            {project.description}
                          </p>
                        )}
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-atelier">
                            {new Date(project.created_at).toLocaleDateString()}
                          </span>
                          <Badge variant={recentScore ? "success" : "default"}>
                            {recentScore ? "Scored" : "Pending"}
                          </Badge>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Score history</CardTitle>
            </CardHeader>
            <CardContent>
              {chartData.length < 2 ? (
                <p className="py-12 text-center text-muted-atelier">
                  History appears after you analyze a few drafts.
                </p>
              ) : (
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={chartData}
                      margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
                    >
                      <defs>
                        <linearGradient
                          id="scoreGradient"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop offset="5%" stopColor="#c4b8a5" stopOpacity={0.45} />
                          <stop offset="95%" stopColor="#c4b8a5" stopOpacity={0} />
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
            </CardContent>
          </Card>

          <Card id="agents">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-champagne" />
                Agent lane
              </CardTitle>
              <Badge variant="warning">Coming soon</Badge>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-relaxed text-muted-atelier">
                Soon you&apos;ll produce, update, and edit content with AI
                agents and MCP tools — without leaving this experience center.
                Score and Radar stay live while Agents warm up.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {["Strategist", "Script", "Visuals", "Editor", "Publish"].map(
                  (n) => (
                    <span
                      key={n}
                      className="rounded-lg border border-atelier bg-canvas px-3 py-1.5 text-xs text-muted-atelier"
                    >
                      {n}
                    </span>
                  ),
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Flame className="h-5 w-5 text-[#b45a5a]" />
                Hot trends
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {hotTrends.length === 0 ? (
                <p className="text-sm text-muted-atelier">No hot trends found.</p>
              ) : (
                hotTrends.map((trend) => (
                  <div
                    key={trend.topic}
                    className="flex items-center justify-between rounded-xl border border-atelier bg-canvas px-3 py-2.5"
                  >
                    <span className="text-sm font-medium text-pearl">
                      {trend.topic}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-atelier">
                        +{Math.round(trend.velocity)}%
                      </span>
                      <span
                        className={cn(
                          "rounded-md border px-2 py-0.5 text-[10px] font-medium",
                          getSignalTypeColor("hot"),
                        )}
                      >
                        hot
                      </span>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-[#6f9b7a]" />
                Emerging
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {emergingTrends.length === 0 ? (
                <p className="text-sm text-muted-atelier">
                  No emerging trends found.
                </p>
              ) : (
                emergingTrends.map((trend) => (
                  <div
                    key={trend.topic}
                    className="flex items-center justify-between rounded-xl border border-atelier bg-canvas px-3 py-2.5"
                  >
                    <span className="text-sm font-medium text-pearl">
                      {trend.topic}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-atelier">
                        +{Math.round(trend.velocity)}%
                      </span>
                      <span
                        className={cn(
                          "rounded-md border px-2 py-0.5 text-[10px] font-medium",
                          getSignalTypeColor("emerging"),
                        )}
                      >
                        emerging
                      </span>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Link
            href="/trends"
            className="flex items-center justify-center gap-2 rounded-xl border border-atelier bg-surface px-4 py-3 text-sm font-medium text-pearl transition-colors hover:border-champagne/40"
          >
            Open full radar
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
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

function LaneCard({
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
      className="rounded-2xl border border-atelier bg-surface p-5 transition-all hover:border-champagne/35 hover:bg-surface-raised/50"
    >
      <div className="flex items-center justify-between">
        <p className="font-display text-lg text-pearl">{title}</p>
        <Badge variant={live ? "success" : "warning"}>
          {live ? "Live" : "Soon"}
        </Badge>
      </div>
      <p className="mt-2 text-sm text-muted-atelier">{body}</p>
    </Link>
  );
}

function StatCard({
  icon,
  label,
  value,
  valueClass,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  valueClass?: string;
}) {
  return (
    <Card>
      <div className="flex items-center gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-atelier bg-canvas">
          {icon}
        </div>
        <div>
          <p className="text-sm text-muted-atelier">{label}</p>
          <p className={cn("text-2xl font-semibold", valueClass ?? "text-pearl")}>
            {value}
          </p>
        </div>
      </div>
    </Card>
  );
}
