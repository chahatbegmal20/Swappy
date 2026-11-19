"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  RefreshCw,
  TrendingUp,
  Users,
  FileText,
  Clock,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  ArrowRight,
  Target,
  Zap,
  Sparkles,
  Swords,
  Timer,
  Flame,
  CalendarClock,
  BarChart3,
} from "lucide-react";
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

import { api } from "@/lib/api";
import { cn, formatScore, getScoreColor } from "@/lib/utils";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScoreRing } from "@/components/ui/score-ring";
import { AuthGuard } from "@/components/auth-guard";

interface ScoreDetail {
  key: string;
  label: string;
  description: string;
  icon: React.ReactNode;
}

const SCORE_DETAILS: ScoreDetail[] = [
  { key: "trend_alignment", label: "Trend Alignment", description: "How well your content matches current demand", icon: <TrendingUp className="h-5 w-5" /> },
  { key: "virality_probability", label: "Virality Probability", description: "Likelihood of outperforming baseline", icon: <Zap className="h-5 w-5" /> },
  { key: "audience_fit", label: "Audience Fit", description: "Match with your intended audience", icon: <Target className="h-5 w-5" /> },
  { key: "novelty", label: "Novelty", description: "How fresh and original your content feels", icon: <Sparkles className="h-5 w-5" /> },
  { key: "competitiveness", label: "Competitiveness", description: "Strength vs market alternatives", icon: <Swords className="h-5 w-5" /> },
  { key: "launch_timing", label: "Launch Timing", description: "Whether now is the right time", icon: <Timer className="h-5 w-5" /> },
  { key: "trend_creation", label: "Trend Creation", description: "Probability of becoming a trendsetter", icon: <Flame className="h-5 w-5" /> },
];

const EXPLANATION_SECTIONS = [
  { key: "trend_factors", label: "Trend Factors", icon: <TrendingUp className="h-5 w-5 text-indigo-400" /> },
  { key: "audience_factors", label: "Audience Factors", icon: <Users className="h-5 w-5 text-cyan-400" /> },
  { key: "content_factors", label: "Content Factors", icon: <FileText className="h-5 w-5 text-emerald-400" /> },
  { key: "timing_factors", label: "Timing Factors", icon: <Clock className="h-5 w-5 text-amber-400" /> },
];

function resolveScoreValue(score: Record<string, unknown>, key: string): number {
  if (typeof score[key] === "number") return score[key] as number;
  const fallbackMap: Record<string, string> = {
    trend_alignment: "trend_alignment",
    virality_probability: "virality_probability",
    audience_fit: "audience_fit",
    novelty: "novelty",
    competitiveness: "competitiveness",
    launch_timing: "launch_timing",
    trend_creation: "trend_creation_probability",
  };
  const fallback = fallbackMap[key];
  if (fallback && typeof score[fallback] === "number") return score[fallback] as number;
  return 0;
}

export default function ProjectScorecardPage() {
  return (
    <AuthGuard>
      <ProjectScorecardContent />
    </AuthGuard>
  );
}

function ProjectScorecardContent() {
  const params = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});

  const { data: project, isLoading: projectLoading } = useQuery({
    queryKey: ["project", params.id],
    queryFn: () => api.getProject(params.id),
    enabled: !!params.id,
  });

  const { data: score, isLoading: scoreLoading } = useQuery({
    queryKey: ["latest-score", params.id],
    queryFn: () => api.getLatestScore(params.id),
    enabled: !!params.id,
  });

  const analyzeMutation = useMutation({
    mutationFn: () => api.analyzeProject(params.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["latest-score", params.id] });
    },
  });

  const toggleSection = (key: string) => {
    setExpandedSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const isLoading = projectLoading || scoreLoading;
  const overallViability = score?.overall_viability ?? 0;
  const confidenceLower = score?.confidence_lower ?? 0;
  const confidenceUpper = score?.confidence_upper ?? 0;

  const explanations = score?.explanations as
    | Record<string, string[]>
    | undefined;

  const recommendations = score?.recommendations as
    | Record<string, string[]>
    | undefined;

  const bestPublishWindow = score?.best_publish_window ?? undefined;
  const comparableExamples = score?.comparable_examples ?? undefined;
  const modelsUsed = score?.models_used ?? [];
  const featureImportance = score?.feature_importance ?? [];

  const scoreAsRecord = (score ?? {}) as Record<string, unknown>;
  const radarData = SCORE_DETAILS.map((d) => ({
    subject: d.label,
    value: Math.round(resolveScoreValue(scoreAsRecord, d.key) * 100),
    fullMark: 100,
  }));

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard"
              className="flex items-center gap-1 text-sm text-gray-400 transition-colors hover:text-white"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Link>
          </div>
          <Button
            onClick={() => analyzeMutation.mutate()}
            loading={analyzeMutation.isPending}
            variant="outline"
          >
            <RefreshCw className="h-4 w-4" />
            Re-analyze
          </Button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-32">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-700 border-t-indigo-500" />
          </div>
        ) : (
          <>
            {/* Project Info */}
            <div className="mb-8">
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold">{project?.name}</h1>
                <Badge variant={score ? "success" : "warning"}>
                  {score ? "Scored" : "Pending Analysis"}
                </Badge>
              </div>
              {project?.description && (
                <p className="mt-1 text-gray-400">{project.description}</p>
              )}
              <p className="mt-1 text-sm text-gray-500">
                Created {new Date(project?.created_at ?? "").toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
              </p>
            </div>

            {score && (
              <>
                {/* Hero Section: ScoreRing + Radar */}
                <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
                  <Card className="flex flex-col items-center justify-center border-gray-800 bg-gray-900 py-10">
                    <div className="relative">
                      <ScoreRing score={overallViability} label="" size={200} />
                    </div>
                    <h2 className="mt-4 text-xl font-semibold text-white">
                      Overall Content Viability
                    </h2>
                    {confidenceLower > 0 && (
                      <p className="mt-1 text-sm text-gray-400">
                        Confidence: {Math.round(confidenceLower * 100)}% – {Math.round(confidenceUpper * 100)}%
                      </p>
                    )}
                    <p className="mt-1 text-sm text-gray-500">
                      Analyzed {new Date(score.scored_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </p>
                  </Card>

                  <Card className="flex items-center justify-center border-gray-800 bg-gray-900">
                    <div className="h-80 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="70%">
                          <PolarGrid stroke="#374151" />
                          <PolarAngleAxis
                            dataKey="subject"
                            tick={{ fill: "#9ca3af", fontSize: 11 }}
                          />
                          <PolarRadiusAxis
                            angle={90}
                            domain={[0, 100]}
                            tick={{ fill: "#6b7280", fontSize: 10 }}
                            axisLine={false}
                          />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: "#111827",
                              border: "1px solid #374151",
                              borderRadius: 8,
                              color: "#f9fafb",
                            }}
                            formatter={(value) => [`${value}%`, "Score"]}
                          />
                          <Radar
                            name="Scores"
                            dataKey="value"
                            stroke="#818cf8"
                            fill="#6366f1"
                            fillOpacity={0.3}
                            strokeWidth={2}
                          />
                        </RadarChart>
                      </ResponsiveContainer>
                    </div>
                  </Card>
                </div>

                {/* 7-Score Grid */}
                <div className="mb-8">
                  <h2 className="mb-4 text-xl font-semibold">Score Breakdown</h2>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {SCORE_DETAILS.map((detail) => {
                      const value = resolveScoreValue(scoreAsRecord, detail.key);
                      return (
                        <Card key={detail.key} className="border-gray-800 bg-gray-900">
                          <div className="flex items-start gap-4">
                            <div className="relative">
                              <ScoreRing score={value} label="" size={72} />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <span className="text-gray-400">{detail.icon}</span>
                                <h3 className="text-sm font-semibold text-white">{detail.label}</h3>
                              </div>
                              <p className="mt-1 text-xs text-gray-500">{detail.description}</p>
                            </div>
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                </div>

                {/* Explanations */}
                {explanations && (
                  <div className="mb-8">
                    <h2 className="mb-4 text-xl font-semibold">Analysis Explanations</h2>
                    <div className="space-y-3">
                      {EXPLANATION_SECTIONS.map((section) => {
                        const factors = explanations[section.key];
                        if (!factors?.length) return null;
                        const isOpen = expandedSections[section.key] ?? false;
                        return (
                          <Card key={section.key} className="border-gray-800 bg-gray-900 p-0">
                            <button
                              onClick={() => toggleSection(section.key)}
                              className="flex w-full items-center justify-between px-6 py-4 text-left"
                            >
                              <div className="flex items-center gap-3">
                                {section.icon}
                                <span className="font-medium text-white">{section.label}</span>
                                <Badge variant="default">{factors.length}</Badge>
                              </div>
                              {isOpen ? (
                                <ChevronUp className="h-5 w-5 text-gray-400" />
                              ) : (
                                <ChevronDown className="h-5 w-5 text-gray-400" />
                              )}
                            </button>
                            {isOpen && (
                              <div className="border-t border-gray-800 px-6 py-4">
                                <ul className="space-y-2">
                                  {factors.map((factor, i) => (
                                    <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
                                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-500" />
                                      {factor}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </Card>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Recommendations */}
                <div className="mb-8">
                  <h2 className="mb-4 text-xl font-semibold">Recommendations</h2>
                  {Array.isArray(recommendations) ? (
                    <Card className="border-gray-800 bg-gray-900">
                      <ul className="space-y-3">
                        {recommendations.map((rec, i) => (
                          <li key={i} className="flex items-start gap-3 text-sm text-gray-300">
                            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                            {rec}
                          </li>
                        ))}
                      </ul>
                    </Card>
                  ) : recommendations ? (
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      {recommendations.improvements?.length ? (
                        <Card className="border-gray-800 bg-gray-900">
                          <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-base">
                              <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                              Improvements
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <ul className="space-y-2">
                              {recommendations.improvements.map((item, i) => (
                                <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
                                  <ArrowRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" />
                                  {item}
                                </li>
                              ))}
                            </ul>
                          </CardContent>
                        </Card>
                      ) : null}
                      {recommendations.target_audiences?.length ? (
                        <Card className="border-gray-800 bg-gray-900">
                          <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-base">
                              <Users className="h-5 w-5 text-cyan-400" />
                              Target Audiences
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <ul className="space-y-2">
                              {recommendations.target_audiences.map((item, i) => (
                                <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
                                  <ArrowRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-cyan-500" />
                                  {item}
                                </li>
                              ))}
                            </ul>
                          </CardContent>
                        </Card>
                      ) : null}
                      {recommendations.best_platforms?.length ? (
                        <Card className="border-gray-800 bg-gray-900">
                          <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-base">
                              <BarChart3 className="h-5 w-5 text-indigo-400" />
                              Best Platforms
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <ul className="space-y-2">
                              {recommendations.best_platforms.map((item, i) => (
                                <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
                                  <ArrowRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-indigo-500" />
                                  {item}
                                </li>
                              ))}
                            </ul>
                          </CardContent>
                        </Card>
                      ) : null}
                      {recommendations.timing_advice?.length ? (
                        <Card className="border-gray-800 bg-gray-900">
                          <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-base">
                              <Clock className="h-5 w-5 text-amber-400" />
                              Timing Advice
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <ul className="space-y-2">
                              {recommendations.timing_advice.map((item, i) => (
                                <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
                                  <ArrowRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-500" />
                                  {item}
                                </li>
                              ))}
                            </ul>
                          </CardContent>
                        </Card>
                      ) : null}
                    </div>
                  ) : (
                    <Card className="border-gray-800 bg-gray-900">
                      <p className="text-center text-sm text-gray-500">
                        No recommendations available yet.
                      </p>
                    </Card>
                  )}
                </div>

                {/* Best Publishing Window */}
                {bestPublishWindow && (
                  <div className="mb-8">
                    <h2 className="mb-4 text-xl font-semibold">Best Publishing Window</h2>
                    <Card className="border-gray-800 bg-gray-900">
                      <div className="flex items-center gap-6">
                        <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-indigo-500/10">
                          <CalendarClock className="h-8 w-8 text-indigo-400" />
                        </div>
                        <div>
                          <p className="text-lg font-semibold text-white">
                            {bestPublishWindow.best_days?.join(", ")} at {bestPublishWindow.best_hours}
                          </p>
                          <p className="mt-1 text-xs text-gray-500">
                            Recommended based on audience activity and trend momentum
                          </p>
                        </div>
                      </div>
                    </Card>
                  </div>
                )}

                {/* ML Models Used */}
                {modelsUsed.length > 0 && (
                  <div className="mb-8">
                    <h2 className="mb-4 text-xl font-semibold">Models Used</h2>
                    <div className="flex flex-wrap gap-2">
                      {modelsUsed.map((m) => (
                        <Badge key={m} variant="info">{m}</Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Feature Importance (SHAP) */}
                {featureImportance.length > 0 && (
                  <div className="mb-8">
                    <h2 className="mb-4 text-xl font-semibold">Top Feature Drivers</h2>
                    <Card className="border-gray-800 bg-gray-900">
                      <CardContent>
                        <div className="space-y-3">
                          {featureImportance.slice(0, 10).map((f) => (
                            <div key={f.feature} className="flex items-center gap-3">
                              <span className="w-40 shrink-0 truncate text-sm text-gray-300">{f.feature}</span>
                              <div className="flex-1">
                                <div className="h-3 overflow-hidden rounded-full bg-gray-800">
                                  <div
                                    className={cn(
                                      "h-full rounded-full transition-all",
                                      f.direction === "positive" ? "bg-emerald-500" : "bg-red-500",
                                    )}
                                    style={{ width: `${Math.min(Math.abs(f.importance) * 100, 100)}%` }}
                                  />
                                </div>
                              </div>
                              <span className={cn(
                                "w-12 text-right text-xs font-medium",
                                f.direction === "positive" ? "text-emerald-400" : "text-red-400",
                              )}>
                                {f.direction === "positive" ? "+" : "-"}{(Math.abs(f.importance) * 100).toFixed(0)}%
                              </span>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}

                {/* Comparable Examples */}
                {comparableExamples && comparableExamples.length > 0 && (
                  <div className="mb-8">
                    <h2 className="mb-4 text-xl font-semibold">Comparable Examples</h2>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {comparableExamples.map((example, i) => (
                        <Card key={i} className="border-gray-800 bg-gray-900">
                          <div className="flex items-center justify-between">
                            <div className="min-w-0 flex-1">
                              <h4 className="truncate font-medium text-white">{example.title}</h4>
                              <p className="mt-1 text-xs text-gray-500">
                                {Math.round(example.similarity * 100)}% similar
                              </p>
                            </div>
                            <div className={cn("text-lg font-bold", getScoreColor(example.score))}>
                              {formatScore(example.score)}
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}

            {!score && !scoreLoading && (
              <Card className="border-gray-800 bg-gray-900">
                <div className="flex flex-col items-center gap-4 py-16">
                  <BarChart3 className="h-12 w-12 text-gray-600" />
                  <h3 className="text-lg font-semibold text-gray-400">No Score Yet</h3>
                  <p className="text-sm text-gray-500">
                    Upload your content and run an analysis to get your scorecard.
                  </p>
                  <Button onClick={() => analyzeMutation.mutate()} loading={analyzeMutation.isPending}>
                    <RefreshCw className="h-4 w-4" />
                    Analyze Now
                  </Button>
                </div>
              </Card>
            )}
          </>
        )}
      </div>
    </div>
  );
}
