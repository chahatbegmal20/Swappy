"use client";

import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Search,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  Globe,
  Flame,
  RefreshCw,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

import { api } from "@/lib/api";
import { cn, getSignalTypeColor } from "@/lib/utils";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StudioShell } from "@/components/studio/studio-shell";

const CATEGORIES = [
  "All",
  "Music",
  "Gaming",
  "Tech",
  "Fashion",
  "Food",
  "Fitness",
  "Education",
  "Travel",
  "Sports",
  "Entertainment",
  "Politics",
  "Finance",
  "General",
] as const;

const SIGNAL_TYPES = [
  "All",
  "Hot",
  "Emerging",
  "Stable",
  "Saturated",
  "Declining",
] as const;

const SOURCES = [
  { id: "google_trends", label: "Google Trends" },
  { id: "All", label: "All sources" },
  { id: "reddit", label: "Reddit" },
  { id: "hackernews", label: "Hacker News" },
] as const;

function useDebounce(value: string, delay: number) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

function formatVolume(volume: number) {
  if (volume >= 1_000_000) return `${(volume / 1_000_000).toFixed(1)}M`;
  if (volume >= 1_000) return `${Math.round(volume / 1_000)}K`;
  return String(Math.round(volume));
}

export default function TrendsExplorerPage() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedSignal, setSelectedSignal] = useState("All");
  const [selectedSource, setSelectedSource] = useState("google_trends");
  const [refreshMessage, setRefreshMessage] = useState("");
  const autoRefreshStarted = useRef(false);
  const debouncedSearch = useDebounce(searchQuery, 400);

  const isSearching = debouncedSearch.length >= 2;

  const { data: searchResults, isLoading: searchLoading } = useQuery({
    queryKey: ["trends-search", debouncedSearch],
    queryFn: () => api.searchTrends(debouncedSearch),
    enabled: isSearching,
  });

  const { data: allTrends, isLoading: trendsLoading } = useQuery({
    queryKey: ["trends", selectedCategory, selectedSource],
    queryFn: () =>
      api.getTrends({
        ...(selectedCategory !== "All"
          ? { category: selectedCategory.toLowerCase() }
          : {}),
        ...(selectedSource !== "All" ? { source: selectedSource } : {}),
        limit: 100,
      }),
    enabled: !isSearching,
  });

  const { data: heatmap } = useQuery({
    queryKey: ["trend-heatmap"],
    queryFn: () => api.getTrendHeatmap(),
  });

  const refreshMutation = useMutation({
    mutationFn: () => api.refreshTrends(true),
    onSuccess: async (result) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["trends"] }),
        queryClient.invalidateQueries({ queryKey: ["trends-search"] }),
        queryClient.invalidateQueries({ queryKey: ["trend-heatmap"] }),
        queryClient.invalidateQueries({ queryKey: ["market-overview"] }),
      ]);
      const sources = result.sources?.join(", ") || "live sources";
      setRefreshMessage(
        result.refreshed
          ? `Pulled ${result.inserted} live topics from ${sources}`
          : `Using cached trends (${result.total} total)`,
      );
      setTimeout(() => setRefreshMessage(""), 4500);
    },
    onError: (err) => {
      setRefreshMessage(err instanceof Error ? err.message : "Refresh failed");
      setTimeout(() => setRefreshMessage(""), 5000);
    },
  });

  // Pull latest Google Trends (and other live sources) when the page opens.
  useEffect(() => {
    if (autoRefreshStarted.current) return;
    autoRefreshStarted.current = true;
    refreshMutation.mutate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const trends = isSearching ? searchResults : allTrends;
  const loading = isSearching ? searchLoading : trendsLoading;

  const filteredTrends = useMemo(() => {
    if (!trends) return [];
    let list = trends;
    if (selectedSignal !== "All") {
      list = list.filter(
        (t) => t.signal_type.toLowerCase() === selectedSignal.toLowerCase(),
      );
    }
    if (isSearching && selectedSource !== "All") {
      list = list.filter(
        (t) => (t.source || "").toLowerCase() === selectedSource.toLowerCase(),
      );
    }
    return list;
  }, [trends, selectedSignal, selectedSource, isSearching]);

  const googleCount = useMemo(
    () =>
      (allTrends || []).filter((t) => t.source === "google_trends").length ||
      (selectedSource === "google_trends" ? filteredTrends.length : 0),
    [allTrends, filteredTrends.length, selectedSource],
  );

  const getVelocityDisplay = useCallback((velocity: number | undefined) => {
    if (velocity === undefined) return null;
    const isPositive = velocity >= 0;
    return (
      <span
        className={cn(
          "flex items-center gap-0.5 text-xs font-medium",
          isPositive ? "text-emerald-400" : "text-red-400",
        )}
      >
        {isPositive ? (
          <TrendingUp className="h-3 w-3" />
        ) : (
          <TrendingDown className="h-3 w-3" />
        )}
        {isPositive ? "+" : ""}
        {Math.round(velocity)}%
      </span>
    );
  }, []);

  return (
    <StudioShell
      title="Radar"
      subtitle="Latest Google Trends topics, refreshed live from Google’s public feeds."
      actions={
        <Button
          variant="outline"
          onClick={() => refreshMutation.mutate()}
          loading={refreshMutation.isPending}
          className="shrink-0"
        >
          <RefreshCw
            className={cn(
              "h-4 w-4",
              refreshMutation.isPending && "animate-spin",
            )}
          />
          Refresh Google Trends
        </Button>
      }
    >
      {refreshMessage && (
        <p className="mb-4 text-sm text-champagne-bright">{refreshMessage}</p>
      )}

      <div className="mb-6 flex flex-wrap items-center gap-3 rounded-2xl border border-atelier bg-surface/80 px-4 py-3">
        <Flame className="h-5 w-5 text-champagne" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-pearl">
            Live Google Trends
            {googleCount > 0 ? ` · ${googleCount} topics` : ""}
          </p>
          <p className="text-xs text-muted-atelier">
            Sourced from Google Trends daily RSS across major regions. Auto-refreshes when you open this page.
          </p>
        </div>
        {refreshMutation.isPending && (
          <span className="text-xs text-muted-atelier">Fetching…</span>
        )}
      </div>

      <div className="relative mb-6">
        <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-atelier" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search trends by topic, keyword, or niche..."
          className="w-full rounded-xl border border-atelier bg-surface py-4 pl-12 pr-4 text-pearl placeholder:text-muted-atelier focus:border-champagne/50 focus:outline-none focus:ring-2 focus:ring-champagne/20"
        />
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        {SOURCES.map((src) => (
          <button
            key={src.id}
            onClick={() => setSelectedSource(src.id)}
            className={cn(
              "rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors",
              selectedSource === src.id
                ? "border-champagne bg-champagne/10 text-champagne"
                : "border-atelier bg-surface text-muted-atelier hover:text-pearl",
            )}
          >
            {src.label}
          </button>
        ))}
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={cn(
              "rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors",
              selectedCategory === cat
                ? "border-champagne bg-champagne/10 text-champagne"
                : "border-atelier bg-surface text-muted-atelier hover:text-pearl",
            )}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="mb-8 flex flex-wrap gap-2">
        {SIGNAL_TYPES.map((signal) => (
          <button
            key={signal}
            onClick={() => setSelectedSignal(signal)}
            className={cn(
              "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
              selectedSignal === signal
                ? signal === "All"
                  ? "border-champagne/40 bg-champagne/10 text-pearl"
                  : getSignalTypeColor(signal.toLowerCase())
                : "border-atelier bg-surface text-muted-atelier hover:text-pearl",
            )}
          >
            {signal}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-atelier border-t-champagne" />
        </div>
      ) : filteredTrends.length === 0 ? (
        <div className="flex flex-col items-center py-24 text-muted-atelier">
          <Search className="mb-3 h-10 w-10" />
          <p className="text-lg font-medium text-pearl">No trends found</p>
          <p className="mt-1 text-sm">
            Try Refresh Google Trends, or switch source / filters
          </p>
        </div>
      ) : (
        <div className="mb-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredTrends.map((trend) => {
            const source = trend.source;
            const region = trend.region;
            const volume = trend.volume;
            const capturedAt = trend.captured_at;
            const velocity = trend.velocity;
            const isGoogle = source === "google_trends";

            return (
              <Link
                key={`${trend.topic}-${region || ""}-${source || ""}`}
                href={`/trends/${encodeURIComponent(trend.topic)}`}
                className="group"
              >
                <Card className="h-full border-atelier bg-surface transition-all hover:border-champagne/35 hover:bg-surface-raised/50">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="text-lg font-semibold text-pearl group-hover:text-champagne">
                      {trend.topic}
                    </h3>
                    <ArrowUpRight className="h-4 w-4 shrink-0 text-muted-atelier transition-colors group-hover:text-champagne" />
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <Badge variant="info">{trend.category}</Badge>
                    <span
                      className={cn(
                        "inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium",
                        getSignalTypeColor(trend.signal_type),
                      )}
                    >
                      {trend.signal_type}
                    </span>
                    {isGoogle && (
                      <span className="inline-flex items-center rounded-full border border-champagne/30 bg-champagne/10 px-2 py-0.5 text-[10px] font-medium text-champagne">
                        Google Trends
                      </span>
                    )}
                  </div>

                  <div className="mt-4 flex items-center gap-4 text-xs text-muted-atelier">
                    {source && (
                      <span className="flex items-center gap-1">
                        <Globe className="h-3 w-3" />
                        {isGoogle ? "google trends" : source}
                      </span>
                    )}
                    {region && <span>{region}</span>}
                    {velocity !== undefined && getVelocityDisplay(velocity)}
                  </div>

                  {volume !== undefined && (
                    <div className="mt-3">
                      <div className="flex items-center justify-between text-xs text-muted-atelier">
                        <span>{isGoogle ? "Search interest" : "Volume"}</span>
                        <span>{formatVolume(volume)}</span>
                      </div>
                      <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-surface-raised">
                        <div
                          className="h-full rounded-full bg-champagne transition-all"
                          style={{
                            width: `${Math.min(
                              100,
                              Math.max(
                                8,
                                Math.log10(Math.max(volume, 10)) * 18,
                              ),
                            )}%`,
                          }}
                        />
                      </div>
                    </div>
                  )}

                  {capturedAt && (
                    <p className="mt-3 text-[11px] text-muted-atelier">
                      {formatDistanceToNow(new Date(capturedAt), {
                        addSuffix: true,
                      })}
                    </p>
                  )}
                </Card>
              </Link>
            );
          })}
        </div>
      )}

      {heatmap && heatmap.length > 0 && (
        <div className="mb-8">
          <div className="mb-4 flex items-center gap-3">
            <Flame className="h-6 w-6 text-champagne" />
            <h2 className="text-xl font-semibold text-pearl">Trend Heatmap</h2>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {heatmap.map((item) => {
              const normalizedVelocity = Math.max(
                0.15,
                Math.min(1, item.avg_velocity / 100),
              );

              return (
                <Card
                  key={item.region}
                  className="border-atelier bg-surface"
                  style={{
                    background: `linear-gradient(135deg, rgba(201,169,110,${normalizedVelocity * 0.18}) 0%, rgba(12,12,14,1) 100%)`,
                  }}
                >
                  <CardHeader className="mb-2">
                    <CardTitle className="text-base text-pearl">
                      {item.region}
                    </CardTitle>
                    <Badge variant="default">{item.count} trends</Badge>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-bold text-champagne">
                        {Math.round(item.avg_velocity)}
                      </span>
                      <span className="text-xs text-muted-atelier">
                        avg velocity
                      </span>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}
    </StudioShell>
  );
}
