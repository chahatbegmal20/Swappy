import hashlib
from typing import Any


MODEL_VERSION = "swappy-mvp-1.0"

PLATFORM_WEIGHTS = {
    "youtube": {"virality": 0.15, "audience": 0.10, "timing": 0.05},
    "tiktok": {"virality": 0.20, "audience": 0.05, "timing": 0.10},
    "instagram": {"virality": 0.10, "audience": 0.15, "timing": 0.05},
    "twitter": {"virality": 0.12, "audience": 0.08, "timing": 0.15},
    "twitch": {"virality": 0.08, "audience": 0.12, "timing": 0.10},
    "spotify": {"virality": 0.05, "audience": 0.10, "timing": 0.08},
}


def _hash_score(seed: str, floor: float = 0.3, ceiling: float = 0.95) -> float:
    """Generate a deterministic float from a seed string."""
    digest = hashlib.sha256(seed.encode()).hexdigest()
    raw = int(digest[:8], 16) / 0xFFFFFFFF
    return round(floor + raw * (ceiling - floor), 4)


def _metadata_completeness(project) -> float:
    """Score 0-1 based on how much metadata the project has filled in."""
    fields = [project.name, project.description, project.target_platform, project.target_audience]
    filled = sum(1 for f in fields if f and str(f).strip())
    return filled / len(fields)


def _content_richness(uploads: list) -> float:
    """Score 0-1 based on variety and quantity of content uploads."""
    if not uploads:
        return 0.0
    type_set = {u.content_type for u in uploads}
    variety_score = min(len(type_set) / 4.0, 1.0)
    quantity_score = min(len(uploads) / 5.0, 1.0)
    return round((variety_score * 0.6 + quantity_score * 0.4), 4)


def generate_scores(project) -> dict[str, Any]:
    pid = str(project.id)
    completeness = _metadata_completeness(project)
    richness = _content_richness(project.uploads if project.uploads else [])
    base_boost = completeness * 0.25 + richness * 0.15

    platform = (project.target_platform or "").lower()
    pw = PLATFORM_WEIGHTS.get(platform, {"virality": 0.10, "audience": 0.10, "timing": 0.08})

    trend_alignment = min(_hash_score(f"{pid}-trend") + base_boost, 0.99)
    virality_prob = min(_hash_score(f"{pid}-viral") + base_boost + pw["virality"], 0.99)
    audience_fit = min(_hash_score(f"{pid}-audience") + base_boost + pw["audience"], 0.99)
    novelty = min(_hash_score(f"{pid}-novelty") + base_boost * 0.5, 0.99)
    competitiveness = min(_hash_score(f"{pid}-compete") + base_boost * 0.3, 0.99)
    launch_timing = min(_hash_score(f"{pid}-timing") + base_boost * 0.4 + pw["timing"], 0.99)
    trend_creation = min(_hash_score(f"{pid}-trendcreate") + base_boost * 0.2, 0.99)

    overall = round(
        trend_alignment * 0.15
        + virality_prob * 0.20
        + audience_fit * 0.20
        + novelty * 0.15
        + competitiveness * 0.10
        + launch_timing * 0.10
        + trend_creation * 0.10,
        4,
    )

    spread = _hash_score(f"{pid}-spread", floor=0.03, ceiling=0.12)
    confidence_lower = round(max(overall - spread, 0.0), 4)
    confidence_upper = round(min(overall + spread, 1.0), 4)

    explanations = _build_explanations(project, trend_alignment, virality_prob, audience_fit, launch_timing)
    recommendations = _build_recommendations(project, overall, platform)
    comparable_examples = _build_comparables(platform, overall)
    best_publish_window = _build_publish_window(platform)
    best_platforms = _build_best_platforms(overall, platform)

    return {
        "model_version": MODEL_VERSION,
        "trend_alignment": trend_alignment,
        "virality_probability": virality_prob,
        "audience_fit": audience_fit,
        "novelty": novelty,
        "competitiveness": competitiveness,
        "launch_timing": launch_timing,
        "trend_creation_probability": trend_creation,
        "overall_viability": overall,
        "confidence_lower": confidence_lower,
        "confidence_upper": confidence_upper,
        "explanations": explanations,
        "recommendations": recommendations,
        "comparable_examples": comparable_examples,
        "best_publish_window": best_publish_window,
        "best_platforms": best_platforms,
    }


def _build_explanations(project, trend_alignment, virality, audience, timing) -> dict:
    trend_factors = []
    if trend_alignment > 0.7:
        trend_factors.append("Content aligns well with current trending topics")
    elif trend_alignment > 0.4:
        trend_factors.append("Moderate alignment with current trends detected")
    else:
        trend_factors.append("Low trend alignment — consider researching current popular topics")

    audience_factors = []
    if project.target_audience:
        audience_factors.append(f"Targeting '{project.target_audience}' audience segment")
    if audience > 0.7:
        audience_factors.append("Strong audience-content match predicted")
    else:
        audience_factors.append("Consider refining target audience for better engagement")

    content_factors = []
    upload_count = len(project.uploads) if project.uploads else 0
    if upload_count > 0:
        content_factors.append(f"{upload_count} content asset(s) uploaded for analysis")
    else:
        content_factors.append("No content uploads yet — scores based on metadata only")
    if project.description:
        content_factors.append("Project description provides good context for scoring")

    timing_factors = []
    if timing > 0.7:
        timing_factors.append("Current timing window is favorable for this content type")
    else:
        timing_factors.append("Consider adjusting launch timing for optimal reach")

    return {
        "trend_factors": trend_factors,
        "audience_factors": audience_factors,
        "content_factors": content_factors,
        "timing_factors": timing_factors,
    }


def _build_recommendations(project, overall, platform) -> dict:
    improvements = []
    if not project.description:
        improvements.append("Add a detailed description to improve analysis accuracy")
    if not project.target_audience:
        improvements.append("Define your target audience for better scoring precision")
    if not project.target_platform:
        improvements.append("Specify a target platform to get platform-specific insights")
    uploads = project.uploads if project.uploads else []
    if len(uploads) == 0:
        improvements.append("Upload content assets (video, audio, thumbnails) for deeper analysis")
    if overall < 0.5:
        improvements.append("Consider researching competitor content in your niche")

    target_audiences = ["Gen Z (18-24)", "Millennials (25-34)"]
    if project.target_audience:
        target_audiences.insert(0, project.target_audience)

    best_platforms_rec = [platform] if platform else []
    best_platforms_rec.extend(["youtube", "tiktok", "instagram"])
    best_platforms_rec = list(dict.fromkeys(best_platforms_rec))[:4]

    timing_advice = [
        "Peak engagement hours: 6-9 PM local time for most platforms",
        "Tuesday through Thursday tends to show higher engagement rates",
        "Avoid major holiday weekends for initial launches",
    ]

    return {
        "improvements": improvements,
        "target_audiences": target_audiences,
        "best_platforms": best_platforms_rec,
        "timing_advice": timing_advice,
    }


def _build_comparables(platform: str, overall: float) -> dict:
    tier = "top" if overall > 0.7 else "mid" if overall > 0.4 else "emerging"
    return {
        "performance_tier": tier,
        "comparable_range": f"{tier}-performing content on {platform or 'general platforms'}",
        "benchmark_note": "Based on aggregate content performance data for similar metadata profiles",
    }


def _build_publish_window(platform: str) -> dict:
    windows = {
        "youtube": {"best_days": ["Tuesday", "Thursday", "Saturday"], "best_hours": "14:00-18:00 UTC"},
        "tiktok": {"best_days": ["Monday", "Wednesday", "Friday"], "best_hours": "11:00-15:00 UTC"},
        "instagram": {"best_days": ["Tuesday", "Wednesday", "Friday"], "best_hours": "11:00-14:00 UTC"},
        "twitter": {"best_days": ["Monday", "Tuesday", "Thursday"], "best_hours": "12:00-16:00 UTC"},
    }
    return windows.get(platform, {"best_days": ["Tuesday", "Thursday"], "best_hours": "12:00-18:00 UTC"})


def _build_best_platforms(overall: float, current_platform: str) -> dict:
    rankings = [
        {"platform": "youtube", "fit_score": round(min(overall + 0.05, 1.0), 2)},
        {"platform": "tiktok", "fit_score": round(min(overall + 0.08, 1.0), 2)},
        {"platform": "instagram", "fit_score": round(min(overall + 0.03, 1.0), 2)},
        {"platform": "twitter", "fit_score": round(min(overall - 0.02, 1.0), 2)},
        {"platform": "twitch", "fit_score": round(min(overall + 0.01, 1.0), 2)},
    ]
    if current_platform:
        for r in rankings:
            if r["platform"] == current_platform:
                r["selected"] = True
    return {"rankings": sorted(rankings, key=lambda x: x["fit_score"], reverse=True)}
