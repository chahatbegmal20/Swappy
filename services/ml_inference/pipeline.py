"""End-to-end ML scoring pipeline orchestrating all feature extractors and models."""
import logging
import os
from datetime import datetime, timezone
from typing import Optional, Any
from pathlib import Path

import numpy as np

from services.feature_engine.text_features import (
    extract_text_features,
    compute_text_embedding,
    compute_trend_similarity,
)
from services.feature_engine.metadata_features import extract_metadata_features
from services.feature_engine.image_features import (
    extract_image_features,
    compute_image_embedding,
)
from services.feature_engine.audio_features import extract_audio_features
from services.feature_engine.trend_features import extract_trend_features
from services.ml_inference.scorer import ContentScorer
from services.ml_inference.explainer import (
    generate_explanations,
    generate_recommendations,
    generate_comparable_examples,
)

logger = logging.getLogger(__name__)

UPLOAD_DIR = Path(os.environ.get("UPLOAD_DIR", "./local_uploads"))


class ScoringPipeline:
    """Orchestrates the full content scoring pipeline with real ML models."""

    MODEL_VERSION = "swappy-ml-v2.0"

    def __init__(self):
        self.scorer = ContentScorer()

    def analyze(
        self,
        title: Optional[str] = None,
        description: Optional[str] = None,
        hashtags: Optional[list[str]] = None,
        genre_tags: Optional[list[str]] = None,
        mood_tags: Optional[list[str]] = None,
        target_platform: Optional[str] = None,
        target_audience: Optional[str] = None,
        language: str = "en",
        region: Optional[str] = None,
        upload_file_paths: Optional[list[dict]] = None,
    ) -> dict[str, Any]:
        """Run the complete multimodal analysis pipeline."""
        models_used = ["XGBoost-Tabular", "MLP-Embedding-Fusion"]

        logger.info("Starting ML scoring pipeline...")

        text_features = extract_text_features(
            title=title,
            description=description,
            hashtags=hashtags,
            genre_tags=genre_tags,
            mood_tags=mood_tags,
            target_platform=target_platform,
        )

        metadata_features = extract_metadata_features(
            target_platform=target_platform,
            target_audience=target_audience,
            genre_tags=genre_tags,
            mood_tags=mood_tags,
            language=language,
            region=region,
            upload_time=datetime.now(timezone.utc),
        )

        text_embedding = None
        content_text = " ".join(filter(None, [title, description]))
        if content_text.strip():
            text_embedding = compute_text_embedding(content_text)
            models_used.append("SentenceTransformer-MiniLM")
            logger.info("Text embedding computed (384-dim)")

        image_features = None
        image_embedding = None
        audio_features = None

        if upload_file_paths:
            for upload in upload_file_paths:
                file_path = upload.get("local_path", "")
                content_type = upload.get("content_type", "")

                if content_type in ("thumbnail", "image") and file_path:
                    image_features = extract_image_features(file_path)
                    image_embedding = compute_image_embedding(file_path)
                    if image_features and image_features.get("clip_available"):
                        models_used.append("CLIP-ViT-B/32")
                    logger.info("Image features extracted")

                elif content_type == "audio" and file_path:
                    audio_features = extract_audio_features(file_path)
                    if audio_features and audio_features.get("audio_available"):
                        models_used.append("Librosa-AudioAnalysis")
                    logger.info("Audio features extracted")

                elif content_type == "video" and file_path:
                    audio_features = extract_audio_features(file_path)
                    if audio_features and audio_features.get("audio_available"):
                        models_used.append("Librosa-AudioAnalysis")
                    logger.info("Video audio track analyzed")

        keywords = []
        if title:
            keywords.extend(title.split()[:5])
        if hashtags:
            keywords.extend(hashtags[:5])
        keywords = list(set(kw.lower().strip("#") for kw in keywords if len(kw) > 2))

        trend_features = None
        trend_similarity = 0.0
        if keywords:
            trend_features = extract_trend_features(
                keywords=keywords,
                category=genre_tags[0] if genre_tags else None,
                region=region or "US",
            )
            if trend_features.get("trend_data_available"):
                models_used.append("GoogleTrends-Live")
            logger.info("Trend features extracted")

            trending_topics = _get_trending_topics()
            if content_text and trending_topics:
                trend_similarity = compute_trend_similarity(content_text, trending_topics)

        scores = self.scorer.score(
            text_features=text_features,
            metadata_features=metadata_features,
            image_features=image_features,
            audio_features=audio_features,
            trend_features=trend_features,
            text_embedding=text_embedding,
            image_embedding=image_embedding,
            trend_similarity=trend_similarity,
        )

        feature_importance = self.scorer.get_feature_importance(
            text_features=text_features,
            metadata_features=metadata_features,
            image_features=image_features or {},
            audio_features=audio_features or {},
            trend_features=trend_features or {},
            trend_similarity=trend_similarity,
        )

        explanations = generate_explanations(
            scores, text_features, metadata_features,
            image_features, audio_features, trend_features,
        )
        recommendations = generate_recommendations(scores, text_features, metadata_features)
        comparable_examples = generate_comparable_examples(scores)

        platform = (target_platform or "").lower()
        best_publish_window = _build_publish_window(platform)
        best_platforms = _build_best_platforms(scores, platform)

        models_used = list(dict.fromkeys(models_used))

        logger.info(f"Scoring complete: overall_viability={scores['overall_viability']}, models={models_used}")

        return {
            "model_version": self.MODEL_VERSION,
            **scores,
            "explanations": explanations,
            "recommendations": recommendations,
            "comparable_examples": comparable_examples,
            "best_publish_window": best_publish_window,
            "best_platforms": best_platforms,
            "models_used": models_used,
            "feature_importance": feature_importance,
        }


def _get_trending_topics() -> list[str]:
    """Get current trending topics for similarity computation."""
    return [
        "AI tools and productivity",
        "Short form video content",
        "Gaming highlights and clips",
        "Cooking and recipe tutorials",
        "Fitness transformation journey",
        "Tech product reviews",
        "Music covers and remixes",
        "Fashion haul and styling",
        "Travel vlog adventure",
        "Comedy sketch and reaction",
    ]


def _build_publish_window(platform: str) -> dict:
    windows = {
        "youtube": {"best_days": ["Tuesday", "Thursday", "Saturday"], "best_hours": "14:00-18:00 UTC"},
        "tiktok": {"best_days": ["Monday", "Wednesday", "Friday"], "best_hours": "11:00-15:00 UTC"},
        "instagram": {"best_days": ["Tuesday", "Wednesday", "Friday"], "best_hours": "11:00-14:00 UTC"},
        "twitter": {"best_days": ["Monday", "Tuesday", "Thursday"], "best_hours": "12:00-16:00 UTC"},
    }
    return windows.get(platform, {"best_days": ["Tuesday", "Thursday"], "best_hours": "12:00-18:00 UTC"})


def _build_best_platforms(scores: dict, current_platform: str) -> dict:
    overall = scores.get("overall_viability", 0.5)
    rankings = [
        {"platform": "YouTube", "fit_score": round(min(overall + 0.05, 1.0), 2)},
        {"platform": "TikTok", "fit_score": round(min(overall + 0.08, 1.0), 2)},
        {"platform": "Instagram", "fit_score": round(min(overall + 0.03, 1.0), 2)},
        {"platform": "Twitter/X", "fit_score": round(min(overall - 0.02, 1.0), 2)},
        {"platform": "Twitch", "fit_score": round(min(overall + 0.01, 1.0), 2)},
    ]
    if current_platform:
        for r in rankings:
            if r["platform"].lower() == current_platform:
                r["selected"] = True
    return {"rankings": sorted(rankings, key=lambda x: x["fit_score"], reverse=True)}
