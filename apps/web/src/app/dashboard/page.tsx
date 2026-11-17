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
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <p className="mt-1 text-gray-400">
              Your creative performance at a glance
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => router.push("/upload")}>
              <Upload className="h-4 w-4" />
              Upload
            </Button>
            <Button onClick={() => setModalOpen(true)}>
              <Plus className="h-4 w-4" />
              New Project
            </Button>
          </div>
        </div>

        {/* Stats Row */}
        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            icon={<Folder className="h-5 w-5 text-indigo-400" />}
            label="Total Projects"
            value={dashLoading ? "—" : String(totalProjects)}
          />
          <StatCard
            icon={<Upload className="h-5 w-5 text-cyan-400" />}
            label="Total Uploads"
            value={dashLoading ? "—" : String(totalUploads)}
          />
          <StatCard
            icon={
              avgScore > 0 ? (
                <ScoreRing score={avgScore} label="" size={40} />
              ) : (
                <TrendingUp className="h-5 w-5 text-emerald-400" />
              )
            }
            label="Average Viability"
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
            icon={<Star className="h-5 w-5 text-amber-400" />}
            label="Best Score"
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
          {/* Main Content — left 2 cols */}
          <div className="space-y-8 lg:col-span-2">
            {/* Recent Projects */}
            <Card className="border-gray-800 bg-gray-900">
              <CardHeader>
                <CardTitle>Recent Projects</CardTitle>
                <Button size="sm" onClick={() => setModalOpen(true)}>
                  <Plus className="h-4 w-4" />
                  New Project
                </Button>
              </CardHeader>
              <CardContent>
                {!projects?.length ? (
                  <p className="py-8 text-center text-gray-500">
                    No projects yet. Create one to get started.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {projects.slice(0, 6).map((project) => {
                      const recentScore = dashboard?.recent_scores?.[0];
                      return (
                        <Link
                          key={project.id}
                          href={`/project/${project.id}`}
                          className="group rounded-lg border border-gray-800 bg-gray-950 p-4 transition-colors hover:border-gray-700 hover:bg-gray-900/50"
                        >
                          <div className="mb-2 flex items-start justify-between">
                            <h4 className="font-medium text-white group-hover:text-indigo-400">
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
                            <p className="mb-3 line-clamp-2 text-sm text-gray-500">
                              {project.description}
                            </p>
                          )}
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-600">
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

            {/* Score History Chart */}
            <Card className="border-gray-800 bg-gray-900">
              <CardHeader>
                <CardTitle>Score History</CardTitle>
              </CardHeader>
              <CardContent>
                {chartData.length < 2 ? (
                  <p className="py-12 text-center text-gray-500">
                    Score history will appear after you analyze multiple
                    projects.
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
                            <stop
                              offset="5%"
                              stopColor="#6366f1"
                              stopOpacity={0.4}
                            />
                            <stop
                              offset="95%"
                              stopColor="#6366f1"
                              stopOpacity={0}
                            />
                          </linearGradient>
                        </defs>
                        <CartesianGrid
                          strokeDasharray="3 3"
                          stroke="#1f2937"
                          vertical={false}
                        />
                        <XAxis
                          dataKey="date"
                          tick={{ fill: "#6b7280", fontSize: 12 }}
                          axisLine={{ stroke: "#374151" }}
                          tickLine={false}
                        />
                        <YAxis
                          domain={[0, 100]}
                          tick={{ fill: "#6b7280", fontSize: 12 }}
                          axisLine={{ stroke: "#374151" }}
                          tickLine={false}
                          tickFormatter={(v) => `${v}%`}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "#111827",
                            border: "1px solid #374151",
                            borderRadius: 8,
                            color: "#f9fafb",
                          }}
                          labelStyle={{ color: "#9ca3af" }}
                          formatter={(value) => [`${value}%`, "Score"]}
                        />
                        <Area
                          type="monotone"
                          dataKey="score"
                          stroke="#6366f1"
                          strokeWidth={2}
                          fill="url(#scoreGradient)"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar — Market Intelligence */}
          <div className="space-y-6">
            <Card className="border-gray-800 bg-gray-900">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Flame className="h-5 w-5 text-red-400" />
                  Hot Trends
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {hotTrends.length === 0 ? (
                  <p className="text-sm text-gray-500">No hot trends found.</p>
                ) : (
                  hotTrends.map((trend) => (
                    <div
                      key={trend.topic}
                      className="flex items-center justify-between rounded-lg border border-gray-800 bg-gray-950 px-3 py-2"
                    >
                      <span className="text-sm font-medium text-gray-200">
                        {trend.topic}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500">
                          +{Math.round(trend.velocity)}%
                        </span>
                        <span
                          className={cn(
                            "rounded-full border px-2 py-0.5 text-[10px] font-medium",
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

            <Card className="border-gray-800 bg-gray-900">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-emerald-400" />
                  Emerging
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {emergingTrends.length === 0 ? (
                  <p className="text-sm text-gray-500">
                    No emerging trends found.
                  </p>
                ) : (
                  emergingTrends.map((trend) => (
                    <div
                      key={trend.topic}
                      className="flex items-center justify-between rounded-lg border border-gray-800 bg-gray-950 px-3 py-2"
                    >
                      <span className="text-sm font-medium text-gray-200">
                        {trend.topic}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500">
                          +{Math.round(trend.velocity)}%
                        </span>
                        <span
                          className={cn(
                            "rounded-full border px-2 py-0.5 text-[10px] font-medium",
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

            {/* Quick Actions */}
            <Card className="border-gray-800 bg-gray-900">
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  <li className="flex gap-2 text-sm text-gray-400">
                    <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-500" />
                    Upload new content to get AI-powered scores
                  </li>
                  <li className="flex gap-2 text-sm text-gray-400">
                    <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
                    Explore trending topics in your niche
                  </li>
                  <li className="flex gap-2 text-sm text-gray-400">
                    <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
                    Check launch timing before publishing
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Link
              href="/trends"
              className="flex items-center justify-center gap-2 rounded-lg border border-gray-800 bg-gray-900 px-4 py-3 text-sm font-medium text-gray-300 transition-colors hover:border-gray-700 hover:text-white"
            >
              View All Trends
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>

      <NewProjectModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreated={(project) => {
          setModalOpen(false);
          /* Take the user to the wizard's next step (upload files for the new project). */
          router.push(`/upload?project=${project.id}`);
        }}
      />
    </div>
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
    <Card className="border-gray-800 bg-gray-900">
      <div className="flex items-center gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-gray-800">
          {icon}
        </div>
        <div>
          <p className="text-sm text-gray-400">{label}</p>
          <p className={cn("text-2xl font-bold", valueClass ?? "text-white")}>
            {value}
          </p>
        </div>
      </div>
    </Card>
  );
}
