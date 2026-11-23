import logging
import re
from collections import defaultdict
from datetime import datetime, timedelta, timezone
from typing import Optional

from apps.api.models.database import TrendSignal

logger = logging.getLogger(__name__)

# Refresh live sources at most this often (unless force=True).
LIVE_REFRESH_TTL = timedelta(minutes=30)


async def get_trends(
    *,
    category: Optional[str] = None,
    region: Optional[str] = None,
    signal_type: Optional[str] = None,
    source: Optional[str] = None,
    limit: int = 50,
) -> list[TrendSignal]:
    filters: dict = {}
    if category:
        filters["category"] = re.compile(f"^{re.escape(category)}$", re.IGNORECASE)
    if region:
        filters["region"] = re.compile(f"^{re.escape(region)}$", re.IGNORECASE)
    if signal_type:
        filters["signal_type"] = re.compile(f"^{re.escape(signal_type)}$", re.IGNORECASE)
    if source:
        filters["source"] = re.compile(f"^{re.escape(source)}$", re.IGNORECASE)

    query = TrendSignal.find(filters) if filters else TrendSignal.find_all()
    return await query.sort(-TrendSignal.velocity).limit(limit).to_list()


async def search_trends(
    *,
    query: str,
    limit: int = 50,
) -> list[TrendSignal]:
    pattern = re.compile(re.escape(query), re.IGNORECASE)
    return (
        await TrendSignal.find({"topic": {"$regex": pattern}})
        .sort(-TrendSignal.velocity)
        .limit(limit)
        .to_list()
    )


async def get_heatmap() -> list[dict]:
    signals = await TrendSignal.find(TrendSignal.region != None).to_list()  # noqa: E711
    by_region: dict[str, list[TrendSignal]] = defaultdict(list)
    for s in signals:
        by_region[s.region].append(s)

    rows = []
    for region, items in by_region.items():
        count = len(items)
        avg_velocity = sum(i.velocity for i in items) / count if count else 0.0
        total_volume = sum(i.volume for i in items)
        rows.append({
            "region": region,
            "count": count,
            "trend_count": count,
            "avg_velocity": round(avg_velocity, 2),
            "total_volume": round(total_volume, 2),
        })

    rows.sort(key=lambda r: r["total_volume"], reverse=True)
    return rows


def compute_trend_score(*, velocity: float, volume: float, signal_type: str) -> float:
    """Predict a 0–100 trend score from velocity, volume, and signal class."""
    type_boost = {
        "hot": 18,
        "emerging": 12,
        "niche but promising": 10,
        "stable": 4,
        "saturated": -4,
        "declining": -12,
    }.get((signal_type or "").lower(), 0)
    velocity_part = max(0.0, min(55.0, abs(velocity) * 0.55))
    # log-scale volume so huge search traffic doesn't dominate
    import math

    volume_part = max(0.0, min(30.0, math.log10(max(volume, 1.0)) * 6.0))
    score = velocity_part + volume_part + type_boost + 20
    if velocity < 0:
        score -= min(20.0, abs(velocity) * 0.25)
    return round(max(0.0, min(100.0, score)), 1)


def _as_int(value, default: int = 0) -> int:
    try:
        if value is None or value == "":
            return default
        return int(float(value))
    except (TypeError, ValueError):
        return default


def build_engagement(signal: TrendSignal) -> dict:
    """Map source-specific raw metrics into views/likes/comments/saves/shares.

    Exact platform stats are used when present (HN/Reddit). Google Trends only
    exposes search interest, so remaining engagement figures are estimated.
    """
    raw = signal.raw_data if isinstance(signal.raw_data, dict) else {}
    source = (signal.source or "").lower()
    volume = float(signal.volume or 0)
    velocity = float(signal.velocity or 0)

    if source == "hackernews":
        likes = max(_as_int(raw.get("points"), 0), _as_int(volume / 100, 1), 1)
        comments = max(_as_int(raw.get("num_comments"), 0), _as_int(likes * 0.15, 0))
        views = max(likes * 28, _as_int(volume, 0), likes + comments)
        saves = max(_as_int(likes * 0.08, 0), 0)
        shares = max(_as_int(likes * 0.12, 0), 0)
        note = "Likes/comments from Hacker News; views/saves/shares estimated from engagement."
    elif source == "reddit":
        likes = max(_as_int(raw.get("score"), 0), _as_int(volume / 10, 1), 1)
        comments = max(_as_int(raw.get("num_comments"), 0), _as_int(likes * 0.2, 0))
        views = max(likes * 22, _as_int(volume, 0), likes + comments)
        saves = max(_as_int(likes * 0.1, 0), 0)
        shares = max(_as_int(likes * 0.15, 0), 0)
        note = "Upvotes/comments from Reddit; views/saves/shares estimated from post score."
    elif source == "google_trends":
        rank = max(1, _as_int(raw.get("rank"), 1))
        views = max(_as_int(volume, 0), _as_int(200_000 / rank, 10_000), 10_000)
        likes = max(_as_int(views * (0.01 + min(abs(velocity), 100) / 5000), 50), 50)
        comments = max(_as_int(likes * 0.18, 10), 10)
        saves = max(_as_int(likes * 0.22, 10), 10)
        shares = max(_as_int(likes * 0.25, 10), 10)
        note = "Views ≈ Google Trends search interest; likes/comments/saves/shares are estimated."
    else:
        views = max(_as_int(volume, 1000), 1000)
        likes = max(_as_int(views * 0.04, 20), 20)
        comments = max(_as_int(likes * 0.2, 5), 5)
        saves = max(_as_int(likes * 0.15, 5), 5)
        shares = max(_as_int(likes * 0.18, 5), 5)
        note = "Engagement estimated from trend volume and velocity (source has no public counters)."

    return {
        "views": views,
        "likes": likes,
        "comments": comments,
        "saves": saves,
        "shares": shares,
        "metrics_note": note,
    }


def _synthesize_trajectory(signal: TrendSignal, days: int = 14) -> list[dict]:
    """Build a short estimated trajectory when we only have one live snapshot."""
    import random

    now = signal.captured_at if isinstance(signal.captured_at, datetime) else datetime.now(timezone.utc)
    if now.tzinfo is None:
        now = now.replace(tzinfo=timezone.utc)
    end_velocity = float(signal.velocity)
    end_volume = float(signal.volume)
    end_score = compute_trend_score(
        velocity=end_velocity, volume=end_volume, signal_type=signal.signal_type
    )
    points = []
    seed = abs(hash(signal.topic)) % (2**32)
    rng = random.Random(seed)
    for i in range(days):
        day = now - timedelta(days=days - 1 - i)
        progress = i / max(days - 1, 1)
        # Ease toward current values with mild noise
        velocity = end_velocity * (0.55 + 0.45 * progress) + rng.uniform(-4, 4)
        volume = end_volume * (0.5 + 0.5 * progress) * (1 + rng.uniform(-0.08, 0.08))
        score = compute_trend_score(
            velocity=velocity, volume=volume, signal_type=signal.signal_type
        )
        # Pull last point exactly to measured snapshot
        if i == days - 1:
            velocity, volume, score = end_velocity, end_volume, end_score
        points.append({
            "date": day.strftime("%Y-%m-%d"),
            "captured_at": day.isoformat(),
            "velocity": round(velocity, 2),
            "volume": round(max(volume, 0), 2),
            "score": round(score, 1),
            "signal_type": signal.signal_type,
            "source": signal.source,
            "estimated": i < days - 1,
        })
    return points


async def get_trajectory(*, topic: str) -> dict:
    pattern = re.compile(re.escape(topic), re.IGNORECASE)
    signals = (
        await TrendSignal.find({"topic": {"$regex": pattern}})
        .sort(+TrendSignal.captured_at)
        .to_list()
    )
    if not signals:
        return {"topic": topic, "data_points": [], "trend": None}

    primary = signals[-1]
    if len(signals) >= 2:
        data_points = [
            {
                "date": (t.captured_at.strftime("%Y-%m-%d") if isinstance(t.captured_at, datetime) else str(t.captured_at)[:10]),
                "captured_at": str(t.captured_at),
                "velocity": t.velocity,
                "volume": t.volume,
                "score": compute_trend_score(
                    velocity=t.velocity, volume=t.volume, signal_type=t.signal_type
                ),
                "signal_type": t.signal_type,
                "source": t.source,
                "estimated": False,
            }
            for t in signals
        ]
    else:
        data_points = _synthesize_trajectory(primary)

    engagement = build_engagement(primary)
    trend_score = compute_trend_score(
        velocity=primary.velocity, volume=primary.volume, signal_type=primary.signal_type
    )
    raw = primary.raw_data or {}
    return {
        "topic": primary.topic,
        "trend": {
            "id": primary.id,
            "source": primary.source,
            "category": primary.category,
            "topic": primary.topic,
            "region": primary.region,
            "signal_type": primary.signal_type,
            "velocity": primary.velocity,
            "volume": primary.volume,
            "trend_score": trend_score,
            "captured_at": primary.captured_at,
            "raw_data": raw,
        },
        "engagement": engagement,
        "related_news": raw.get("news") or [],
        "data_points": data_points,
    }


async def get_trend_detail(*, topic: str) -> Optional[dict]:
    result = await get_trajectory(topic=topic)
    if not result.get("trend"):
        return None
    trend = result["trend"]
    return {
        **trend,
        "engagement": result["engagement"],
        "related_news": result["related_news"],
        "data_points": result["data_points"],
    }


async def _latest_live_capture() -> Optional[datetime]:
    """Most recent captured_at among non-demo live sources."""
    doc = await TrendSignal.find(
        {"source": {"$in": ["google_trends", "reddit", "hackernews"]}}
    ).sort(-TrendSignal.captured_at).first_or_none()
    return doc.captured_at if doc else None


async def refresh_live_trends(*, force: bool = False) -> dict:
    """Fetch Google Trends RSS + Reddit + HN and replace stored live signals."""
    latest = await _latest_live_capture()
    now = datetime.now(timezone.utc)
    if not force and latest is not None:
        latest_aware = latest if latest.tzinfo else latest.replace(tzinfo=timezone.utc)
        if now - latest_aware < LIVE_REFRESH_TTL:
            total = await TrendSignal.count()
            return {
                "refreshed": False,
                "reason": "cache_fresh",
                "total": total,
                "fetched": 0,
                "inserted": 0,
            }

    from services.trend_ingestion.processor import TrendProcessor
    from services.trend_ingestion.sources import fetch_all_live_trends

    raw = fetch_all_live_trends()
    processed = TrendProcessor().process_batch(raw)

    # Drop previous live rows so the explorer shows current data (keep any demo leftovers out).
    await TrendSignal.find(
        {"source": {"$in": ["google_trends", "reddit", "hackernews", "youtube", "spotify", "tiktok", "twitch", "twitter", "instagram"]}}
    ).delete()

    docs = [
        TrendSignal(
            source=s["source"],
            category=(s.get("category") or "general").lower(),
            topic=s["topic"],
            region=s.get("region"),
            signal_type=s["signal_type"],
            velocity=float(s["velocity"]),
            volume=float(s["volume"]),
            raw_data=s.get("raw_data"),
            captured_at=s.get("captured_at") if isinstance(s.get("captured_at"), datetime) else now,
        )
        for s in processed
    ]
    if docs:
        await TrendSignal.insert_many(docs)

    logger.info("Live trends refresh: fetched=%s inserted=%s", len(raw), len(docs))
    return {
        "refreshed": True,
        "reason": "ok",
        "total": await TrendSignal.count(),
        "fetched": len(raw),
        "inserted": len(docs),
        "sources": sorted({d.source for d in docs}),
    }


async def seed_demo_trends() -> None:
    """On API startup: pull live trends (or keep fresh cache). Falls back to demo seed only if live fails empty."""
    try:
        result = await refresh_live_trends(force=False)
        if result.get("total", 0) > 0:
            logger.info("Trends ready (%s)", result)
            return
    except Exception as exc:
        logger.warning("Live trend refresh failed on startup: %s", exc)

    if await TrendSignal.count() > 0:
        return

    now = datetime.now(timezone.utc)
    demo_data = [
        {"source": "youtube", "category": "music", "topic": "Lo-fi Hip Hop Beats", "region": "US", "signal_type": "hot", "velocity": 92.5, "volume": 1850000},
        {"source": "tiktok", "category": "tech", "topic": "Open Source AI Tools", "region": "US", "signal_type": "hot", "velocity": 95.2, "volume": 2100000},
        {"source": "youtube", "category": "gaming", "topic": "Indie Roguelikes", "region": "US", "signal_type": "emerging", "velocity": 71.2, "volume": 540000},
    ]
    await TrendSignal.insert_many([
        TrendSignal(
            source=d["source"],
            category=d["category"],
            topic=d["topic"],
            region=d["region"],
            signal_type=d["signal_type"],
            velocity=d["velocity"],
            volume=d["volume"],
            raw_data={"demo": True},
            captured_at=now,
        )
        for d in demo_data
    ])
    logger.info("Seeded %s demo trends (live sources unavailable)", len(demo_data))
