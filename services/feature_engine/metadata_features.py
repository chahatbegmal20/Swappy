"""Extract features from content metadata."""
from datetime import datetime, timezone
from typing import Optional
import numpy as np


PLATFORM_WEIGHTS = {
    "youtube": 1.0,
    "tiktok": 0.95,
    "instagram": 0.85,
    "twitter": 0.75,
    "multiple": 0.9,
}

GENRE_POPULARITY = {
    "music": 0.92, "gaming": 0.90, "tech": 0.85, "fashion": 0.80,
    "beauty": 0.78, "food": 0.82, "travel": 0.75, "education": 0.70,
    "fitness": 0.72, "comedy": 0.88, "drama": 0.65, "news": 0.60,
}

MOOD_ENGAGEMENT = {
    "energetic": 0.9, "calm": 0.5, "funny": 0.95, "serious": 0.4,
    "inspirational": 0.85, "dark": 0.6, "romantic": 0.7, "nostalgic": 0.75,
}


def extract_metadata_features(
    target_platform: Optional[str] = None,
    target_audience: Optional[str] = None,
    genre_tags: Optional[list[str]] = None,
    mood_tags: Optional[list[str]] = None,
    language: str = "en",
    region: Optional[str] = None,
    upload_time: Optional[datetime] = None,
) -> dict:
    features = {}

    # Platform weight
    features["platform_weight"] = PLATFORM_WEIGHTS.get(
        (target_platform or "").lower(), 0.5
    )

    # Genre popularity score
    if genre_tags:
        genre_scores = [GENRE_POPULARITY.get(g.lower(), 0.5) for g in genre_tags]
        features["max_genre_popularity"] = max(genre_scores)
        features["avg_genre_popularity"] = np.mean(genre_scores)
        features["genre_count"] = len(genre_tags)
    else:
        features["max_genre_popularity"] = 0.5
        features["avg_genre_popularity"] = 0.5
        features["genre_count"] = 0

    # Mood engagement score
    if mood_tags:
        mood_scores = [MOOD_ENGAGEMENT.get(m.lower(), 0.5) for m in mood_tags]
        features["max_mood_engagement"] = max(mood_scores)
        features["avg_mood_engagement"] = np.mean(mood_scores)
        features["mood_count"] = len(mood_tags)
    else:
        features["max_mood_engagement"] = 0.5
        features["avg_mood_engagement"] = 0.5
        features["mood_count"] = 0

    # Audience specificity
    features["has_target_audience"] = int(bool(target_audience))
    features["audience_specificity"] = min(len((target_audience or "").split()), 5) / 5

    # Language and region
    features["is_english"] = int(language.lower() in ("en", "english"))
    features["has_region"] = int(bool(region))

    # Timing features
    now = upload_time or datetime.now(timezone.utc)
    features["hour_of_day"] = now.hour
    features["day_of_week"] = now.weekday()
    features["is_weekend"] = int(now.weekday() >= 5)

    # Peak hours (10am-2pm and 7pm-10pm UTC are generally high engagement)
    hour = now.hour
    features["is_peak_hour"] = int(10 <= hour <= 14 or 19 <= hour <= 22)

    # Metadata completeness (how much info the creator provided)
    filled = sum([
        bool(target_platform),
        bool(target_audience),
        bool(genre_tags),
        bool(mood_tags),
        bool(region),
    ])
    features["metadata_completeness"] = filled / 5

    return features
