"""Adapters for ingesting trend signals from external sources.

Uses free, no-auth APIs:
- Google Trends daily RSS (no API key)
- Hacker News Algolia API
- Reddit public JSON

Falls back to synthetic data when live sources are unavailable.
"""
import logging
import random
import xml.etree.ElementTree as ET
from datetime import datetime, timedelta, timezone
from typing import Any
from urllib.parse import quote_plus

import requests

logger = logging.getLogger(__name__)

# Google Trends RSS namespaces
_ATOM = {"atom": "http://www.w3.org/2005/Atom"}
_HT = {"ht": "https://trends.google.com/trending/rss"}

CATEGORIES = ["Music", "Gaming", "Tech", "Fashion", "Beauty", "Food", "Travel", "Education", "Fitness", "Comedy"]
REGIONS = ["US", "UK", "IN", "BR", "DE", "JP", "KR", "FR", "AU", "NG", "MX", "ID"]
SIGNAL_TYPES = ["hot", "emerging", "stable", "saturated", "declining", "niche but promising"]

TOPICS_BY_CATEGORY = {
    "Music": ["Lo-fi beats study", "AI-generated music", "Afrobeats global rise", "K-pop comeback season",
              "Indie folk revival", "Drill music evolution", "Bedroom pop aesthetic", "Latin trap crossover"],
    "Gaming": ["Cozy games trend", "Speedrun challenges", "Retro gaming nostalgia", "Mobile gaming esports",
               "VR experiences", "Indie game discoveries", "Game dev diaries", "Minecraft building"],
    "Tech": ["AI coding assistants", "Wearable tech reviews", "Smart home automation", "EV comparisons",
             "Open source alternatives", "Privacy-focused tools", "Quantum computing basics", "Robot companions"],
    "Fashion": ["Quiet luxury", "Y2K revival", "Sustainable fashion", "Streetwear drops",
                "Thrift hauls", "Capsule wardrobe", "Gender-neutral fashion", "Vintage finds"],
    "Beauty": ["Glass skin routine", "Clean beauty", "Bold lip comeback", "Hair oiling trend",
               "Minimalist makeup", "DIY skincare", "Fragrance layering", "Nail art tutorials"],
    "Food": ["Air fryer recipes", "Cottage cheese craze", "Fermentation at home", "Protein-packed meals",
             "Street food tours", "Bento box art", "Sourdough everything", "One-pot wonders"],
    "Travel": ["Digital nomad hubs", "Hidden gem destinations", "Solo travel safety", "Budget backpacking",
               "Luxury on a budget", "Workation spots", "Cultural immersion", "Eco-tourism"],
    "Education": ["Learn to code paths", "Language learning hacks", "Study with me lives", "Book summaries",
                  "Financial literacy", "Science explained", "History deep dives", "Skill stacking"],
    "Fitness": ["Walking workouts", "Pilates renaissance", "Cold plunge benefits", "Zone 2 cardio",
                "Calisthenics basics", "Yoga for beginners", "Marathon training", "Gym anxiety tips"],
    "Comedy": ["Relatable humor", "Sketch comedy", "Standup clips", "Dark humor trending",
               "Parody content", "Reaction videos", "Roast battles", "Improv clips"],
}


class SyntheticTrendSource:
    """Generates realistic synthetic trend data for MVP demonstration."""

    def generate_batch(self, count: int = 50) -> list[dict[str, Any]]:
        signals = []
        now = datetime.now(timezone.utc)
        for _ in range(count):
            category = random.choice(CATEGORIES)
            topic = random.choice(TOPICS_BY_CATEGORY[category])
            signal_type = random.choices(
                SIGNAL_TYPES, weights=[15, 20, 25, 10, 15, 15], k=1
            )[0]
            signals.append({
                "source": random.choice(["youtube", "tiktok", "instagram", "twitter", "google_trends"]),
                "category": category,
                "topic": topic,
                "region": random.choice(REGIONS),
                "signal_type": signal_type,
                "velocity": round(self._velocity_for_type(signal_type), 2),
                "volume": round(self._volume_for_type(signal_type), 2),
                "raw_data": {
                    "sample_creators": random.randint(10, 5000),
                    "avg_engagement_rate": round(random.uniform(0.01, 0.15), 4),
                    "growth_7d": round(random.uniform(-0.3, 0.8), 3),
                    "search_interest": random.randint(10, 100),
                },
                "captured_at": (now - timedelta(hours=random.randint(0, 72))).isoformat(),
            })
        return signals

    def generate_trajectory(self, topic: str, days: int = 30) -> list[dict]:
        trajectory = []
        base_velocity = random.uniform(20, 80)
        base_volume = random.uniform(1000, 50000)
        now = datetime.now(timezone.utc)
        for i in range(days):
            day = now - timedelta(days=days - i)
            drift = random.uniform(-5, 5)
            seasonal = 10 * (0.5 + 0.5 * (i / days))
            trajectory.append({
                "date": day.strftime("%Y-%m-%d"),
                "velocity": round(max(0, base_velocity + drift + seasonal), 2),
                "volume": round(max(0, base_volume * (0.8 + 0.4 * (i / days)) + random.uniform(-1000, 1000)), 0),
                "engagement_rate": round(random.uniform(0.02, 0.12), 4),
            })
        return trajectory

    def _velocity_for_type(self, signal_type: str) -> float:
        ranges = {
            "hot": (60, 100), "emerging": (40, 75), "stable": (20, 45),
            "saturated": (10, 30), "declining": (-20, 10), "niche but promising": (30, 60),
        }
        low, high = ranges.get(signal_type, (10, 50))
        return random.uniform(low, high)

    def _volume_for_type(self, signal_type: str) -> float:
        ranges = {
            "hot": (50000, 500000), "emerging": (10000, 100000), "stable": (20000, 80000),
            "saturated": (80000, 200000), "declining": (5000, 30000), "niche but promising": (1000, 15000),
        }
        low, high = ranges.get(signal_type, (5000, 50000))
        return random.uniform(low, high)


def _guess_category(topic: str) -> str:
    text = topic.lower()
    rules = [
        ("tech", ("ai", "openai", "google", "apple", "microsoft", "iphone", "android", "software", "crypto", "bitcoin", "chatgpt")),
        ("gaming", ("game", "xbox", "playstation", "steam", "nintendo", "esport", "minecraft", "fortnite")),
        ("music", ("song", "album", "spotify", "concert", "rapper", "singer", "billboard", "grammy")),
        ("sports", ("nba", "nfl", "soccer", "football", "cricket", "olympics", "ufc", "tennis", "match")),
        ("entertainment", ("movie", "netflix", "disney", "trailer", "celebrity", "actor", "tv show", "oscar")),
        ("politics", ("election", "president", "senate", "minister", "parliament", "vote", "congress")),
        ("finance", ("stock", "market", "fed", "inflation", "nasdaq", "dow", "earnings")),
    ]
    for category, keywords in rules:
        if any(k in text for k in keywords):
            return category
    return "general"


class GoogleTrendsSource:
    """Live Google Trends via public RSS feeds (no API key)."""

    # Live /trending/rss is the working public feed (daily RSS currently 404s).
    RSS_URLS = (
        "https://trends.google.com/trending/rss?geo={geo}",
        "https://trends.google.com/trends/trendingsearches/daily/rss?geo={geo}",
    )

    def fetch_trending(self, region: str = "US") -> list[dict[str, Any]]:
        geo = (region or "US").upper()
        # GB geo code on classic feed is GB; keep as-is.
        if geo == "UK":
            geo = "GB"

        for template in self.RSS_URLS:
            url = template.format(geo=quote_plus(geo))
            signals = self._fetch_rss(url=url, geo=geo)
            if signals:
                return signals
        return []

    def _fetch_rss(self, *, url: str, geo: str) -> list[dict[str, Any]]:
        try:
            resp = requests.get(
                url,
                timeout=15,
                headers={
                    "User-Agent": (
                        "Mozilla/5.0 (compatible; SwappyStudio/1.0; "
                        "+https://www.swappystudio.com)"
                    ),
                    "Accept": "application/rss+xml, application/xml, text/xml, */*",
                },
            )
            if resp.status_code != 200 or not resp.text.strip():
                logger.warning(
                    "Google Trends RSS HTTP %s for geo=%s url=%s",
                    resp.status_code,
                    geo,
                    url,
                )
                return []

            root = ET.fromstring(resp.content)
            channel = root.find("channel")
            if channel is None:
                # Some feeds nest channel differently / Atom-ish
                channel = root.find("atom:feed", _ATOM) or root
            items = channel.findall("item")
            if not items:
                items = channel.findall("atom:entry", _ATOM)

            now = datetime.now(timezone.utc)
            signals: list[dict[str, Any]] = []
            for rank, item in enumerate(items, start=1):
                title_el = item.find("title")
                if title_el is None:
                    title_el = item.find("atom:title", _ATOM)
                topic = (title_el.text or "").strip() if title_el is not None else ""
                if not topic:
                    continue

                traffic_el = item.find("ht:approx_traffic", _HT)
                traffic_raw = (
                    (traffic_el.text or "").strip() if traffic_el is not None else ""
                )
                volume = self._parse_traffic(traffic_raw)
                velocity = max(35.0, 100.0 - (rank - 1) * 2.2)
                if volume >= 200_000:
                    signal_type = "hot"
                elif volume >= 50_000:
                    signal_type = "emerging"
                else:
                    signal_type = "stable"

                news_items = []
                for news in item.findall("ht:news_item", _HT)[:3]:
                    news_title = news.findtext(
                        "ht:news_item_title", default="", namespaces=_HT
                    )
                    news_url = news.findtext(
                        "ht:news_item_url", default="", namespaces=_HT
                    )
                    if news_title:
                        news_items.append({"title": news_title, "url": news_url})

                signals.append(
                    {
                        "source": "google_trends",
                        "category": _guess_category(topic),
                        "topic": topic,
                        "region": geo,
                        "signal_type": signal_type,
                        "velocity": round(velocity, 2),
                        "volume": float(volume),
                        "raw_data": {
                            "source_api": "google_trends_rss",
                            "approx_traffic": traffic_raw or str(volume),
                            "rank": rank,
                            "news": news_items,
                            "rss_url": url,
                            "google_trends_url": (
                                "https://trends.google.com/trends/explore"
                                f"?q={quote_plus(topic)}&geo={quote_plus(geo)}"
                            ),
                        },
                        "captured_at": now.isoformat(),
                    }
                )
            logger.info(
                "Google Trends RSS: %s topics for geo=%s from %s",
                len(signals),
                geo,
                url,
            )
            return signals
        except Exception as e:
            logger.warning("Google Trends RSS fetch failed (%s): %s", url, e)
            return []

    @staticmethod
    def _parse_traffic(raw: str) -> int:
        """Parse values like '200+', '50,000+', '1M+' into an integer estimate."""
        if not raw:
            return 10_000
        cleaned = raw.replace(",", "").replace("+", "").strip().upper()
        try:
            if cleaned.endswith("M"):
                return int(float(cleaned[:-1]) * 1_000_000)
            if cleaned.endswith("K"):
                return int(float(cleaned[:-1]) * 1_000)
            return int(float(cleaned))
        except ValueError:
            return 10_000

    def fetch_interest(self, keywords: list[str], timeframe: str = "today 3-m", region: str = "US") -> list[dict]:
        """Best-effort interest signals — prefer live RSS topics that match keywords."""
        live = self.fetch_trending(region=region)
        if not live:
            return SyntheticTrendSource().generate_batch(len(keywords))
        wanted = {k.lower() for k in keywords}
        matched = [s for s in live if any(w in s["topic"].lower() for w in wanted)]
        return matched or live[: max(1, len(keywords))]


def fetch_all_live_trends(
    *,
    regions: list[str] | None = None,
    include_reddit: bool = True,
    include_hn: bool = True,
) -> list[dict[str, Any]]:
    """Aggregate live trends from Google RSS + Reddit + Hacker News."""
    regions = regions or ["US", "GB", "IN", "AU", "CA", "DE", "JP", "BR"]
    combined: list[dict[str, Any]] = []
    seen_topics: set[str] = set()

    google = GoogleTrendsSource()
    for geo in regions:
        for signal in google.fetch_trending(region=geo):
            key = signal["topic"].strip().lower()
            if key in seen_topics:
                continue
            seen_topics.add(key)
            combined.append(signal)

    if include_hn:
        combined.extend(HackerNewsSource().fetch_trending(count=15))

    if include_reddit:
        reddit = RedditSource()
        for sub in ("popular", "technology", "news"):
            combined.extend(reddit.fetch_trending(subreddit=sub, count=10))

    if not combined:
        logger.warning("All live trend sources failed — using synthetic fallback")
        return SyntheticTrendSource().generate_batch(40)

    return combined


class HackerNewsSource:
    """Hacker News API (free, no auth) for tech trend signals."""

    def fetch_trending(self, count: int = 15) -> list[dict[str, Any]]:
        try:
            resp = requests.get("http://hn.algolia.com/api/v1/search?tags=front_page&hitsPerPage=30", timeout=5)
            if resp.status_code != 200:
                return []
            data = resp.json()
            now = datetime.now(timezone.utc)
            signals = []
            for hit in data.get("hits", [])[:count]:
                title = hit.get("title", "")
                points = hit.get("points", 0) or 0
                if points > 100:
                    sig_type = "hot"
                elif points > 50:
                    sig_type = "emerging"
                else:
                    sig_type = "stable"
                signals.append({
                    "source": "hackernews",
                    "category": "tech",
                    "topic": title,
                    "region": "GLOBAL",
                    "signal_type": sig_type,
                    "velocity": round(min(points / 5, 100), 2),
                    "volume": round(points * 100, 2),
                    "raw_data": {"url": hit.get("url", ""), "points": points, "num_comments": hit.get("num_comments", 0)},
                    "captured_at": now.isoformat(),
                })
            return signals
        except Exception as e:
            logger.info(f"HN fetch failed: {e}")
            return []


class RedditSource:
    """Reddit public JSON API (no auth required) for trend signals."""

    def fetch_trending(self, subreddit: str = "popular", count: int = 15) -> list[dict[str, Any]]:
        try:
            resp = requests.get(
                f"https://www.reddit.com/r/{subreddit}/hot.json?limit={count}",
                timeout=5,
                headers={"User-Agent": "SwappyBot/1.0"},
            )
            if resp.status_code != 200:
                return []
            data = resp.json()
            now = datetime.now(timezone.utc)
            signals = []
            for post in data.get("data", {}).get("children", []):
                d = post.get("data", {})
                score = d.get("score", 0)
                if score > 5000:
                    sig_type = "hot"
                elif score > 1000:
                    sig_type = "emerging"
                else:
                    sig_type = "stable"
                sub_name = (d.get("link_flair_text") or d.get("subreddit") or subreddit or "general")
                signals.append({
                    "source": "reddit",
                    "category": _guess_category(d.get("title", "") or sub_name),
                    "topic": d.get("title", "")[:200],
                    "region": "GLOBAL",
                    "signal_type": sig_type,
                    "velocity": round(min(score / 100, 100), 2),
                    "volume": round(score * 10, 2),
                    "raw_data": {"subreddit": d.get("subreddit"), "score": score, "num_comments": d.get("num_comments", 0)},
                    "captured_at": now.isoformat(),
                })
            return signals
        except Exception as e:
            logger.info(f"Reddit fetch failed: {e}")
            return []
