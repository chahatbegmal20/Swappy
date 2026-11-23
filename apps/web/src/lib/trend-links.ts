import type { TrendSignal } from "@/lib/api";

/** Resolve an external URL for a trend (Google Trends, Reddit, HN, etc.). */
export function getTrendSourceUrl(trend: TrendSignal): string {
  const raw = (trend.raw_data ?? {}) as Record<string, unknown>;
  const asString = (v: unknown) =>
    typeof v === "string" && v.trim() ? v.trim() : null;

  const googleUrl = asString(raw.google_trends_url);
  if (googleUrl) return googleUrl;

  const news = raw.news;
  if (Array.isArray(news) && news.length > 0) {
    const first = news[0] as { url?: string };
    const newsUrl = asString(first?.url);
    if (newsUrl) return newsUrl;
  }

  const direct = asString(raw.url);
  if (direct && /^https?:\/\//i.test(direct)) return direct;

  const source = (trend.source || "").toLowerCase();
  const topic = trend.topic || "";
  const geo = (trend.region || "US").toUpperCase();

  if (source === "google_trends") {
    return `https://trends.google.com/trends/explore?q=${encodeURIComponent(topic)}&geo=${encodeURIComponent(geo)}`;
  }

  if (source === "reddit") {
    const sub = asString(raw.subreddit);
    if (sub) return `https://www.reddit.com/r/${encodeURIComponent(sub)}/`;
    return `https://www.reddit.com/search/?q=${encodeURIComponent(topic)}`;
  }

  if (source === "hackernews") {
    if (direct) return direct;
    return `https://hn.algolia.com/?q=${encodeURIComponent(topic)}`;
  }

  return `https://trends.google.com/trends/explore?q=${encodeURIComponent(topic)}&geo=${encodeURIComponent(geo)}`;
}

export function getTrendSourceLabel(trend: TrendSignal): string {
  const source = (trend.source || "").toLowerCase();
  if (source === "google_trends") return "Open on Google Trends";
  if (source === "reddit") return "Open on Reddit";
  if (source === "hackernews") return "Open on Hacker News";
  return "Open source";
}
