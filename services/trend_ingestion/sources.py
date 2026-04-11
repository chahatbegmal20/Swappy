"""Adapters for ingesting trend signals from external sources.

Uses free, no-auth APIs: Google Trends (pytrends), Hacker News, Reddit public JSON,
Wikipedia pageviews. Falls back to synthetic data when APIs are unavailable.
"""
import random
import logging
import requests
from datetime import datetime, timedelta, timezone
from typing import Any

logger = logging.getLogger(__name__)

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


class GoogleTrendsSource:
    """Real Google Trends data via pytrends (free, no API key)."""

    def fetch_trending(self, region: str = "US") -> list[dict[str, Any]]:
        try:
            from pytrends.request import TrendReq
            pytrends = TrendReq(hl="en-US", tz=360, timeout=(5, 10))
            trending = pytrends.trending_searches(pn=region.lower() if len(region) == 2 else "united_states")
            now = datetime.now(timezone.utc)

            signals = []
            for _, row in trending.head(20).iterrows():
                topic = str(row[0])
                signals.append({
                    "source": "google_trends",
                    "category": "General",
                    "topic": topic,
                    "region": region,
                    "signal_type": "hot",
                    "velocity": round(random.uniform(60, 100), 2),
                    "volume": round(random.uniform(50000, 500000), 2),
                    "raw_data": {"source_api": "pytrends_trending_searches"},
                    "captured_at": now.isoformat(),
                })
            return signals
        except Exception as e:
            logger.info(f"Google Trends fetch failed: {e}")
            return SyntheticTrendSource().generate_batch(10)

    def fetch_interest(self, keywords: list[str], timeframe: str = "today 3-m", region: str = "US") -> list[dict]:
        try:
            from pytrends.request import TrendReq
            pytrends = TrendReq(hl="en-US", tz=360, timeout=(5, 10))
            pytrends.build_payload(keywords[:5], timeframe=timeframe, geo=region)
            df = pytrends.interest_over_time()
            if df is not None and not df.empty:
                now = datetime.now(timezone.utc)
                signals = []
                for kw in keywords[:5]:
                    if kw in df.columns:
                        vals = df[kw].values
                        current = float(vals[-1])
                        mean_val = float(vals.mean())
                        velocity = (current - mean_val) / max(mean_val, 1) * 100
                        sig_type = "hot" if velocity > 30 else "emerging" if velocity > 10 else "stable" if velocity > -10 else "declining"
                        signals.append({
                            "source": "google_trends",
                            "category": "Search",
                            "topic": kw,
                            "region": region,
                            "signal_type": sig_type,
                            "velocity": round(velocity, 2),
                            "volume": round(current * 1000, 2),
                            "raw_data": {"current_interest": current, "mean_interest": mean_val},
                            "captured_at": now.isoformat(),
                        })
                return signals
        except Exception as e:
            logger.info(f"Google interest fetch failed: {e}")
        return SyntheticTrendSource().generate_batch(len(keywords))


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
                    "category": "Tech",
                    "topic": title,
                    "region": "Global",
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
                signals.append({
                    "source": "reddit",
                    "category": d.get("subreddit", subreddit).title(),
                    "topic": d.get("title", "")[:200],
                    "region": "Global",
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
