"""Real trend context features using free APIs (Google Trends, public RSS, etc.)."""
import logging
import time
from datetime import datetime, timezone
from typing import Optional
import numpy as np

logger = logging.getLogger(__name__)

_trend_cache: dict[str, tuple[float, dict]] = {}
CACHE_TTL = 3600


def extract_trend_features(
    keywords: list[str],
    category: Optional[str] = None,
    region: str = "US",
) -> dict:
    """Extract real trend context features from free public APIs."""
    features = {}

    cache_key = f"{','.join(sorted(keywords))}:{category}:{region}"
    if cache_key in _trend_cache:
        ts, cached = _trend_cache[cache_key]
        if time.time() - ts < CACHE_TTL:
            return cached

    google_data = _fetch_google_trends(keywords, region)
    features.update(google_data)

    wiki_data = _fetch_wikipedia_popularity(keywords)
    features.update(wiki_data)

    hn_data = _fetch_hackernews_relevance(keywords)
    features.update(hn_data)

    features["trend_data_available"] = any([
        google_data.get("google_trends_available"),
        wiki_data.get("wiki_available"),
        hn_data.get("hn_available"),
    ])

    if features["trend_data_available"]:
        sources = []
        if google_data.get("google_interest_now", 0) > 0:
            sources.append(google_data["google_interest_now"] / 100.0)
        if wiki_data.get("wiki_pageviews_norm", 0) > 0:
            sources.append(wiki_data["wiki_pageviews_norm"])
        if hn_data.get("hn_relevance_score", 0) > 0:
            sources.append(hn_data["hn_relevance_score"])

        features["composite_trend_score"] = float(np.mean(sources)) if sources else 0.0
    else:
        features["composite_trend_score"] = 0.0

    _seasonal_features(features)

    _trend_cache[cache_key] = (time.time(), features)
    return features


def _fetch_google_trends(keywords: list[str], region: str) -> dict:
    """Fetch real Google Trends data via pytrends."""
    features = {"google_trends_available": False}

    if not keywords:
        return features

    try:
        from pytrends.request import TrendReq

        pytrends = TrendReq(hl="en-US", tz=360, timeout=(5, 10))
        kw_list = keywords[:5]
        pytrends.build_payload(kw_list, cat=0, timeframe="today 3-m", geo=region)

        interest_df = pytrends.interest_over_time()

        if interest_df is not None and not interest_df.empty:
            features["google_trends_available"] = True

            for kw in kw_list:
                if kw in interest_df.columns:
                    values = interest_df[kw].values
                    features["google_interest_now"] = float(values[-1]) if len(values) > 0 else 0.0
                    features["google_interest_mean"] = float(np.mean(values))
                    features["google_interest_max"] = float(np.max(values))
                    features["google_interest_std"] = float(np.std(values))

                    if len(values) >= 4:
                        recent = np.mean(values[-4:])
                        older = np.mean(values[:4])
                        features["google_trend_velocity"] = float((recent - older) / max(older, 1))
                    else:
                        features["google_trend_velocity"] = 0.0

                    features["google_is_rising"] = int(features["google_trend_velocity"] > 0.1)
                    features["google_is_declining"] = int(features["google_trend_velocity"] < -0.1)
                    break

    except Exception as e:
        logger.info(f"Google Trends fetch skipped: {e}")

    if "google_interest_now" not in features:
        features.update({
            "google_interest_now": 0.0,
            "google_interest_mean": 0.0,
            "google_interest_max": 0.0,
            "google_interest_std": 0.0,
            "google_trend_velocity": 0.0,
            "google_is_rising": 0,
            "google_is_declining": 0,
        })

    return features


def _fetch_wikipedia_popularity(keywords: list[str]) -> dict:
    """Fetch Wikipedia pageview data as a topic popularity proxy."""
    features = {"wiki_available": False, "wiki_pageviews_norm": 0.0, "wiki_pageviews_raw": 0}

    if not keywords:
        return features

    try:
        import requests

        total_views = 0
        today = datetime.now(timezone.utc)
        end_date = today.strftime("%Y%m%d")
        start_y, start_m, start_d = today.year, today.month - 1, today.day
        if start_m <= 0:
            start_m += 12
            start_y -= 1
        start_date = f"{start_y}{start_m:02d}{start_d:02d}"

        for kw in keywords[:3]:
            article = kw.replace(" ", "_").title()
            url = (
                f"https://wikimedia.org/api/rest_v1/metrics/pageviews/per-article"
                f"/en.wikipedia.org/all-access/all-agents/{article}/daily/{start_date}/{end_date}"
            )
            resp = requests.get(url, timeout=5, headers={"User-Agent": "SwappyBot/1.0"})
            if resp.status_code == 200:
                data = resp.json()
                items = data.get("items", [])
                views = sum(item.get("views", 0) for item in items)
                total_views += views

        if total_views > 0:
            features["wiki_available"] = True
            features["wiki_pageviews_raw"] = total_views
            features["wiki_pageviews_norm"] = float(np.clip(total_views / 100000.0, 0, 1))

    except Exception as e:
        logger.info(f"Wikipedia pageviews fetch skipped: {e}")

    return features


def _fetch_hackernews_relevance(keywords: list[str]) -> dict:
    """Check Hacker News for tech-related trend signals."""
    features = {"hn_available": False, "hn_relevance_score": 0.0, "hn_story_count": 0}

    if not keywords:
        return features

    try:
        import requests

        query = " OR ".join(keywords[:3])
        url = f"http://hn.algolia.com/api/v1/search?query={query}&tags=story&hitsPerPage=10"
        resp = requests.get(url, timeout=5)
        if resp.status_code == 200:
            data = resp.json()
            hits = data.get("hits", [])
            features["hn_available"] = True
            features["hn_story_count"] = len(hits)

            if hits:
                total_points = sum(h.get("points", 0) or 0 for h in hits)
                features["hn_relevance_score"] = float(np.clip(total_points / 1000.0, 0, 1))

    except Exception as e:
        logger.info(f"HN fetch skipped: {e}")

    return features


def _seasonal_features(features: dict):
    """Add seasonal/temporal context."""
    now = datetime.now(timezone.utc)
    features["month"] = now.month
    features["day_of_week"] = now.weekday()
    features["is_q4"] = int(now.month >= 10)
    features["is_summer"] = int(6 <= now.month <= 8)
    features["is_new_year"] = int(now.month == 1)
