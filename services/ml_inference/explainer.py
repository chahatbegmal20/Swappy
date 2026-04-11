"""Generate human-readable explanations and recommendations for content scores."""
from typing import Any
import numpy as np


def generate_explanations(
    scores: dict,
    text_features: dict,
    metadata_features: dict,
    image_features: dict | None = None,
    audio_features: dict | None = None,
    trend_features: dict | None = None,
) -> dict:
    """Produce explanation dicts for each score dimension."""
    explanations: dict[str, list[str]] = {
        "trend_factors": [],
        "audience_factors": [],
        "content_factors": [],
        "timing_factors": [],
    }

    tkr = text_features.get("trending_keyword_ratio", 0)
    tkc = text_features.get("trending_keyword_count", 0)
    if tkr > 0.1:
        explanations["trend_factors"].append(
            f"Your content uses {tkc} trending keywords, indicating strong market alignment."
        )
    elif tkr > 0:
        explanations["trend_factors"].append(
            "Some trending keywords detected. Consider incorporating more current trending terms."
        )
    else:
        explanations["trend_factors"].append(
            "No trending keywords found. Research current trending topics in your niche."
        )

    hto = text_features.get("hashtag_trending_overlap", 0)
    if hto > 2:
        explanations["trend_factors"].append(
            f"{hto} of your hashtags match current trends — strong discoverability signal."
        )
    elif hto > 0:
        explanations["trend_factors"].append(
            "Limited hashtag-trend overlap. Mix trending hashtags with niche-specific ones."
        )

    mgp = metadata_features.get("max_genre_popularity", 0.5)
    if mgp > 0.85:
        explanations["trend_factors"].append(
            "Your genre is currently in high demand across platforms."
        )
    elif mgp < 0.65:
        explanations["trend_factors"].append(
            "Your genre has moderate demand. Consider cross-genre elements to broaden appeal."
        )

    if trend_features:
        gv = trend_features.get("google_trend_velocity", 0)
        if gv > 0.1:
            explanations["trend_factors"].append(
                f"Google Trends shows rising interest (velocity: +{gv:.0%}) for your topic."
            )
        elif gv < -0.1:
            explanations["trend_factors"].append(
                "Google Trends indicates declining interest in this topic area."
            )

        gi = trend_features.get("google_interest_now", 0)
        if gi > 70:
            explanations["trend_factors"].append(
                f"Current Google search interest is high ({gi}/100) — favorable for release."
            )

        wiki = trend_features.get("wiki_pageviews_norm", 0)
        if wiki > 0.3:
            explanations["trend_factors"].append(
                "Wikipedia pageview data indicates broad public interest in this topic."
            )

    if metadata_features.get("has_target_audience"):
        specificity = metadata_features.get("audience_specificity", 0)
        if specificity > 0.6:
            explanations["audience_factors"].append(
                "Well-defined target audience improves content-audience matching."
            )
        else:
            explanations["audience_factors"].append(
                "Target audience could be more specific. Define demographics, interests, and behavior."
            )
    else:
        explanations["audience_factors"].append(
            "No target audience specified. Defining your audience significantly improves scoring accuracy."
        )

    pw = metadata_features.get("platform_weight", 0.5)
    if pw > 0.9:
        explanations["audience_factors"].append(
            "Your target platform has the largest creator audience — high potential reach."
        )

    mme = metadata_features.get("avg_mood_engagement", 0.5)
    if mme > 0.8:
        explanations["audience_factors"].append(
            "Selected mood tags correlate with high engagement patterns."
        )
    elif mme < 0.5:
        explanations["audience_factors"].append(
            "Current mood tags suggest lower engagement. Consider energetic or funny tones."
        )

    tl = text_features.get("title_length", 0)
    if 30 <= tl <= 70:
        explanations["content_factors"].append(
            "Title length is in the optimal range for click-through rates."
        )
    elif tl < 20:
        explanations["content_factors"].append(
            "Title is very short. Titles between 30-70 characters perform best."
        )
    elif tl > 80:
        explanations["content_factors"].append(
            "Title may be too long. It could get truncated on some platforms."
        )

    ebr = text_features.get("engagement_booster_ratio", 0)
    if ebr > 0.05:
        explanations["content_factors"].append(
            "Title contains engagement-boosting power words that drive clicks."
        )
    else:
        explanations["content_factors"].append(
            "Consider adding power words (e.g., 'secret', 'ultimate', 'shocking') to boost engagement."
        )

    vr = text_features.get("vocabulary_richness", 0.5)
    if vr > 0.7:
        explanations["content_factors"].append(
            "High vocabulary diversity suggests original and engaging content."
        )

    mc = metadata_features.get("metadata_completeness", 0)
    if mc >= 0.8:
        explanations["content_factors"].append(
            "Excellent metadata completeness — the algorithm has strong signals to work with."
        )
    elif mc < 0.4:
        explanations["content_factors"].append(
            "Low metadata completeness. Fill in more details for better predictions."
        )

    if image_features and image_features.get("clip_available"):
        qs = image_features.get("quality_score", 0)
        if qs > 0.6:
            explanations["content_factors"].append(
                f"Thumbnail quality is strong (score: {qs:.0%}) — CLIP analysis indicates professional visuals."
            )
        elif qs < 0.4:
            explanations["content_factors"].append(
                "Thumbnail quality could be improved. Consider brighter colors and clearer composition."
            )

    if audio_features and audio_features.get("audio_available"):
        tempo = audio_features.get("tempo", 0)
        energy = audio_features.get("energy_level", 0)
        if tempo > 0:
            explanations["content_factors"].append(
                f"Audio analysis: {tempo:.0f} BPM tempo, {'high' if energy > 0.5 else 'moderate'} energy level."
            )

    if metadata_features.get("is_peak_hour"):
        explanations["timing_factors"].append(
            "Upload time falls within peak engagement hours (10am-2pm or 7pm-10pm UTC)."
        )
    else:
        explanations["timing_factors"].append(
            "Consider scheduling for peak hours: 10am-2pm or 7pm-10pm UTC."
        )

    if metadata_features.get("is_weekend"):
        explanations["timing_factors"].append(
            "Weekend uploads can see 10-20% less professional audience engagement but higher casual viewership."
        )
    else:
        explanations["timing_factors"].append(
            "Weekday timing is generally favorable for most content categories."
        )

    ta = scores.get("trend_alignment", 0.5)
    if ta > 0.7:
        explanations["timing_factors"].append(
            "Current trend momentum supports immediate publication."
        )
    elif ta < 0.3:
        explanations["timing_factors"].append(
            "Low trend alignment suggests waiting for better market conditions or pivoting the topic."
        )

    return explanations


def generate_recommendations(
    scores: dict,
    text_features: dict,
    metadata_features: dict,
) -> dict:
    """Generate actionable improvement recommendations."""
    recs: dict[str, list[str]] = {
        "improvements": [],
        "target_audiences": [],
        "best_platforms": [],
        "timing_advice": [],
    }

    if scores.get("trend_alignment", 0) < 0.5:
        recs["improvements"].append(
            "Research and incorporate 2-3 trending keywords relevant to your niche."
        )
    if scores.get("novelty", 0) < 0.4:
        recs["improvements"].append(
            "Add a unique angle or perspective to differentiate from existing content."
        )
    if scores.get("virality_probability", 0) < 0.4:
        recs["improvements"].append(
            "Strengthen your hook — use questions, numbers, or power words in the first line."
        )
    if text_features.get("hashtag_count", 0) < 5:
        recs["improvements"].append(
            "Add more hashtags (aim for 8-15) mixing trending and niche-specific tags."
        )
    if metadata_features.get("metadata_completeness", 0) < 0.6:
        recs["improvements"].append(
            "Complete all metadata fields — platform, audience, genre, and mood for better analysis."
        )
    if scores.get("audience_fit", 0) < 0.5:
        recs["improvements"].append(
            "Define a more specific target audience to improve content-audience matching."
        )
    if not recs["improvements"]:
        recs["improvements"].append(
            "Content looks strong! Consider A/B testing thumbnails and titles for optimization."
        )

    mgp = metadata_features.get("max_genre_popularity", 0.5)
    if mgp > 0.85:
        recs["target_audiences"].extend([
            "18-34 age group (highest engagement for popular genres)",
            "Platform-native viewers who follow trending content",
        ])
    recs["target_audiences"].extend([
        "Niche community members who engage deeply with the topic",
        "Cross-platform audiences who share content across social media",
    ])

    platform_scores = {
        "YouTube": 0.5 + scores.get("overall_viability", 0.5) * 0.3,
        "TikTok": 0.4 + scores.get("virality_probability", 0.5) * 0.4,
        "Instagram Reels": 0.35 + scores.get("audience_fit", 0.5) * 0.35,
        "Twitter/X": 0.3 + scores.get("trend_alignment", 0.5) * 0.3,
    }
    sorted_platforms = sorted(platform_scores.items(), key=lambda x: x[1], reverse=True)
    for platform, score in sorted_platforms:
        recs["best_platforms"].append(f"{platform} (estimated fit: {score:.0%})")

    if scores.get("launch_timing", 0) > 0.6:
        recs["timing_advice"].append("Current timing is favorable — consider publishing within 48 hours.")
    else:
        recs["timing_advice"].append("Timing could be better. Consider waiting for a trend spike in your niche.")
    recs["timing_advice"].append("Best days: Tuesday through Thursday for professional content.")
    recs["timing_advice"].append("Best hours: 10am-12pm or 7pm-9pm in your target audience's timezone.")

    return recs


def generate_comparable_examples(scores: dict) -> list[dict]:
    """Generate synthetic comparable content examples."""
    overall = scores.get("overall_viability", 0.5)

    examples = [
        {
            "title": "Similar content in this category",
            "score": round(min(overall + 0.05, 0.98), 2),
            "similarity": 0.92,
            "outcome": "above_average" if overall > 0.6 else "average",
        },
        {
            "title": "Comparable trending content",
            "score": round(min(overall + 0.12, 0.98), 2),
            "similarity": 0.85,
            "outcome": "viral" if overall > 0.7 else "above_average",
        },
        {
            "title": "Similar style in adjacent niche",
            "score": round(max(overall - 0.08, 0.05), 2),
            "similarity": 0.78,
            "outcome": "average",
        },
    ]

    return examples
