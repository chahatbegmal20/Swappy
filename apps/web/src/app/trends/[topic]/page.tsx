"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  Activity,
  BarChart3,
  Eye,
  Heart,
  MessageCircle,
  Bookmark,
  Share2,
  Newspaper,
  Gauge,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from "recharts";
import { formatDistanceToNow } from "date-fns";

import { api } from "@/lib/api";
import { cn, getSignalTypeColor } from "@/lib/utils";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(n >= 10_000 ? 0 : 1)}K`;
  return String(Math.round(n));
}

export default function TrendDetailPage() {
  const params = useParams<{ topic: string }>();
  const topic = decodeURIComponent(params.topic);

  const { data: detail, isLoading } = useQuery({
    queryKey: ["trend-detail", topic],
    queryFn: () => api.getTrendDetail(topic),
    enabled: !!topic,
  });

  const { data: allTrends } = useQuery({
    queryKey: ["trends"],
    queryFn: () => api.getTrends({ limit: 100 }),
  });

  const relatedTrends = allTrends
    ?.filter(
      (t) =>
        t.topic.toLowerCase() !== topic.toLowerCase() &&
        t.category === detail?.category,
    )
    .slice(0, 6);

  const dataPoints = detail?.data_points ?? [];
  const latestPoint = dataPoints[dataPoints.length - 1];
  const previousPoint = dataPoints[dataPoints.length - 2];
  const velocityChange =
    latestPoint && previousPoint
      ? latestPoint.velocity - previousPoint.velocity
      : 0;

  const chartData = dataPoints.map((point) => ({
    date: new Date(point.date || point.captured_at || Date.now()).toLocaleDateString(
      "en-US",
      { month: "short", day: "numeric" },
    ),
    velocity: Math.round(point.velocity),
    score: Math.round(point.score ?? 0),
    volume: Math.round(point.volume ?? 0),
  }));

  const engagement = detail?.engagement;
  const hasEstimatedHistory = dataPoints.some((p) => p.estimated);

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <Link
          href="/trends"
          className="mb-6 inline-flex items-center gap-1 text-sm text-gray-400 transition-colors hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Trends
        </Link>

        {isLoading ? (
          <div className="flex items-center justify-center py-32">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-700 border-t-indigo-500" />
          </div>
        ) : !detail ? (
          <Card className="border-gray-800 bg-gray-900">
            <div className="py-16 text-center text-gray-500">
              <p className="text-lg font-medium">Trend not found</p>
              <p className="mt-1 text-sm">Try refreshing live trends, then open this topic again.</p>
            </div>
          </Card>
        ) : (
          <>
            <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h1 className="text-3xl font-bold">{detail.topic}</h1>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <Badge variant="info">{detail.category}</Badge>
                  <span
                    className={cn(
                      "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
                      getSignalTypeColor(detail.signal_type),
                    )}
                  >
                    {detail.signal_type}
                  </span>
                  <Badge variant="default">{detail.source}</Badge>
                  {detail.region && <Badge variant="default">{detail.region}</Badge>}
                </div>
                <p className="mt-2 text-sm text-gray-500">
                  Captured{" "}
                  {formatDistanceToNow(new Date(detail.captured_at), { addSuffix: true })}
                </p>
              </div>
            </div>

            {/* Core prediction metrics */}
            <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
              <MetricCard
                icon={<Activity className="h-5 w-5 text-indigo-400" />}
                label="Current Velocity"
                value={`${Math.round(detail.velocity)}%`}
                change={velocityChange !== 0 ? velocityChange : undefined}
              />
              <MetricCard
                icon={<Gauge className="h-5 w-5 text-emerald-400" />}
                label="Trend Score"
                value={`${Math.round(detail.trend_score)}`}
                hint="Predicted 0–100"
              />
              <MetricCard
                icon={<Eye className="h-5 w-5 text-cyan-400" />}
                label="Views / Interest"
                value={formatCount(engagement?.views ?? detail.volume)}
              />
              <MetricCard
                icon={<BarChart3 className="h-5 w-5 text-amber-400" />}
                label="Volume"
                value={formatCount(detail.volume)}
              />
            </div>

            {/* Engagement breakdown */}
            <Card className="mb-8 border-gray-800 bg-gray-900">
              <CardHeader>
                <CardTitle>Audience engagement</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
                  <EngagementStat
                    icon={<Eye className="h-4 w-4 text-cyan-400" />}
                    label="Views"
                    value={formatCount(engagement?.views ?? 0)}
                  />
                  <EngagementStat
                    icon={<Heart className="h-4 w-4 text-rose-400" />}
                    label="Likes"
                    value={formatCount(engagement?.likes ?? 0)}
                  />
                  <EngagementStat
                    icon={<MessageCircle className="h-4 w-4 text-sky-400" />}
                    label="Comments"
                    value={formatCount(engagement?.comments ?? 0)}
                  />
                  <EngagementStat
                    icon={<Bookmark className="h-4 w-4 text-violet-400" />}
                    label="Saves"
                    value={formatCount(engagement?.saves ?? 0)}
                  />
                  <EngagementStat
                    icon={<Share2 className="h-4 w-4 text-emerald-400" />}
                    label="Shares"
                    value={formatCount(engagement?.shares ?? 0)}
                  />
                </div>
                {engagement?.metrics_note && (
                  <p className="mt-4 text-xs text-gray-500">{engagement.metrics_note}</p>
                )}
              </CardContent>
            </Card>

            {/* Charts */}
            {chartData.length > 1 ? (
              <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
                <Card className="border-gray-800 bg-gray-900">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-indigo-400" />
                      Velocity over time
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {hasEstimatedHistory && (
                      <p className="mb-3 text-xs text-amber-400/80">
                        Earlier points are modeled from the latest live snapshot until more history is collected.
                      </p>
                    )}
                    <div className="h-72 min-h-[18rem] w-full">
                      <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={280}>
                        <AreaChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                          <defs>
                            <linearGradient id="velocityGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#818cf8" stopOpacity={0.3} />
                              <stop offset="95%" stopColor="#818cf8" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                          <XAxis
                            dataKey="date"
                            tick={{ fill: "#6b7280", fontSize: 12 }}
                            axisLine={{ stroke: "#374151" }}
                            tickLine={false}
                          />
                          <YAxis
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
                            formatter={(value) => [`${value}%`, "Velocity"]}
                          />
                          <Area
                            type="monotone"
                            dataKey="velocity"
                            stroke="#818cf8"
                            strokeWidth={2}
                            fill="url(#velocityGrad)"
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-gray-800 bg-gray-900">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="h-5 w-5 text-emerald-400" />
                      Trend score over time
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-72 min-h-[18rem] w-full">
                      <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={280}>
                        <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
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
                          />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: "#111827",
                              border: "1px solid #374151",
                              borderRadius: 8,
                              color: "#f9fafb",
                            }}
                            formatter={(value) => [`${value}`, "Score"]}
                          />
                          <Line
                            type="monotone"
                            dataKey="score"
                            stroke="#10b981"
                            strokeWidth={2}
                            dot={{ fill: "#10b981", r: 3 }}
                            activeDot={{ r: 5 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <Card className="mb-8 border-gray-800 bg-gray-900">
                <div className="flex flex-col items-center py-16 text-gray-500">
                  <Activity className="mb-3 h-10 w-10" />
                  <p className="text-lg font-medium">Not enough history yet</p>
                  <p className="mt-1 text-sm">
                    Velocity and score above still reflect the latest live snapshot.
                  </p>
                </div>
              </Card>
            )}

            {/* Related news from Google Trends */}
            {detail.related_news?.length > 0 && (
              <div className="mb-8">
                <h2 className="mb-4 flex items-center gap-2 text-xl font-semibold">
                  <Newspaper className="h-5 w-5 text-indigo-400" />
                  Related coverage
                </h2>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  {detail.related_news.map((news) => (
                    <a
                      key={`${news.title}-${news.url || ""}`}
                      href={news.url || "#"}
                      target="_blank"
                      rel="noreferrer"
                      className="block"
                    >
                      <Card className="border-gray-800 bg-gray-900 transition-colors hover:border-gray-700">
                        <p className="font-medium text-white">{news.title}</p>
                        {news.url && (
                          <p className="mt-1 truncate text-xs text-indigo-400">{news.url}</p>
                        )}
                      </Card>
                    </a>
                  ))}
                </div>
              </div>
            )}

            {relatedTrends && relatedTrends.length > 0 && (
              <div>
                <h2 className="mb-4 text-xl font-semibold">
                  Related trends in {detail.category}
                </h2>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {relatedTrends.map((trend) => (
                    <Link
                      key={trend.topic}
                      href={`/trends/${encodeURIComponent(trend.topic)}`}
                      className="group"
                    >
                      <Card className="border-gray-800 bg-gray-900 transition-all hover:border-gray-700 hover:bg-gray-800/50">
                        <div className="flex items-center justify-between">
                          <div className="min-w-0">
                            <h4 className="truncate font-medium text-white group-hover:text-indigo-400">
                              {trend.topic}
                            </h4>
                            <div className="mt-1 flex items-center gap-2">
                              <span
                                className={cn(
                                  "inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium",
                                  getSignalTypeColor(trend.signal_type),
                                )}
                              >
                                {trend.signal_type}
                              </span>
                              {trend.trend_score != null && (
                                <span className="text-[10px] text-gray-500">
                                  score {Math.round(trend.trend_score)}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-1 text-sm">
                            {trend.velocity >= 0 ? (
                              <TrendingUp className="h-4 w-4 text-emerald-400" />
                            ) : (
                              <TrendingDown className="h-4 w-4 text-red-400" />
                            )}
                            <span
                              className={cn(
                                "font-medium",
                                trend.velocity >= 0 ? "text-emerald-400" : "text-red-400",
                              )}
                            >
                              {trend.velocity >= 0 ? "+" : ""}
                              {Math.round(trend.velocity)}%
                            </span>
                          </div>
                        </div>
                      </Card>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function EngagementStat({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg border border-gray-800 bg-gray-950/60 p-3">
      <div className="mb-2 flex items-center gap-2 text-gray-400">
        {icon}
        <span className="text-xs">{label}</span>
      </div>
      <p className="text-xl font-bold text-white">{value}</p>
    </div>
  );
}

function MetricCard({
  icon,
  label,
  value,
  change,
  hint,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  change?: number;
  hint?: string;
}) {
  return (
    <Card className="border-gray-800 bg-gray-900">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gray-800">
          {icon}
        </div>
        <div className="min-w-0">
          <p className="truncate text-xs text-gray-500">{label}</p>
          <div className="flex items-center gap-2">
            <p className="text-lg font-bold text-white">{value}</p>
            {change !== undefined && (
              <span
                className={cn(
                  "flex items-center text-xs font-medium",
                  change >= 0 ? "text-emerald-400" : "text-red-400",
                )}
              >
                {change >= 0 ? (
                  <TrendingUp className="mr-0.5 h-3 w-3" />
                ) : (
                  <TrendingDown className="mr-0.5 h-3 w-3" />
                )}
                {change >= 0 ? "+" : ""}
                {Math.round(change)}
              </span>
            )}
          </div>
          {hint && <p className="text-[10px] text-gray-600">{hint}</p>}
        </div>
      </div>
    </Card>
  );
}
