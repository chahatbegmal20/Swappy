import re
from collections import defaultdict
from datetime import datetime, timedelta, timezone
from typing import Optional

from apps.api.models.database import TrendSignal


async def get_trends(
    *,
    category: Optional[str] = None,
    region: Optional[str] = None,
    signal_type: Optional[str] = None,
    limit: int = 50,
) -> list[TrendSignal]:
    filters = {}
    if category:
        filters["category"] = category
    if region:
        filters["region"] = region
    if signal_type:
        filters["signal_type"] = signal_type

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
            "trend_count": count,
            "avg_velocity": round(avg_velocity, 2),
            "total_volume": round(total_volume, 2),
        })

    rows.sort(key=lambda r: r["total_volume"], reverse=True)
    return rows


async def get_trajectory(*, topic: str) -> list[dict]:
    pattern = re.compile(re.escape(topic), re.IGNORECASE)
    signals = (
        await TrendSignal.find({"topic": {"$regex": pattern}})
        .sort(+TrendSignal.captured_at)
        .to_list()
    )
    return [
        {
            "captured_at": str(t.captured_at),
            "velocity": t.velocity,
            "volume": t.volume,
            "signal_type": t.signal_type,
            "source": t.source,
        }
        for t in signals
    ]


async def seed_demo_trends() -> None:
    """Seed the database with realistic demo trend data (idempotent)."""
    if await TrendSignal.count() > 0:
        return

    now = datetime.now(timezone.utc)
    demo_data = [
        {"source": "youtube", "category": "music", "topic": "Lo-fi Hip Hop Beats", "region": "US", "signal_type": "hot", "velocity": 92.5, "volume": 1850000},
        {"source": "spotify", "category": "music", "topic": "AI-Generated Music Remixes", "region": "US", "signal_type": "emerging", "velocity": 78.3, "volume": 420000},
        {"source": "tiktok", "category": "music", "topic": "Bedroom Pop Revival", "region": "UK", "signal_type": "hot", "velocity": 88.1, "volume": 1200000},
        {"source": "youtube", "category": "music", "topic": "Acoustic Covers Challenge", "region": "BR", "signal_type": "emerging", "velocity": 65.4, "volume": 380000},
        {"source": "spotify", "category": "music", "topic": "Synthwave Nostalgia", "region": "DE", "signal_type": "declining", "velocity": -12.3, "volume": 290000},
        {"source": "twitch", "category": "gaming", "topic": "Indie Roguelikes", "region": "US", "signal_type": "hot", "velocity": 85.7, "volume": 920000},
        {"source": "youtube", "category": "gaming", "topic": "Cozy Game Streams", "region": "JP", "signal_type": "emerging", "velocity": 71.2, "volume": 540000},
        {"source": "tiktok", "category": "gaming", "topic": "Speedrun Highlights", "region": "US", "signal_type": "hot", "velocity": 79.8, "volume": 780000},
        {"source": "twitch", "category": "gaming", "topic": "Retro Console Collecting", "region": "UK", "signal_type": "declining", "velocity": -8.5, "volume": 180000},
        {"source": "twitter", "category": "tech", "topic": "Open Source AI Tools", "region": "US", "signal_type": "hot", "velocity": 95.2, "volume": 2100000},
        {"source": "youtube", "category": "tech", "topic": "Local LLM Setup Guides", "region": "US", "signal_type": "emerging", "velocity": 82.6, "volume": 650000},
        {"source": "twitter", "category": "tech", "topic": "Rust Programming Language", "region": "DE", "signal_type": "hot", "velocity": 73.9, "volume": 480000},
        {"source": "youtube", "category": "tech", "topic": "3D Printing at Home", "region": "US", "signal_type": "declining", "velocity": -5.2, "volume": 310000},
        {"source": "instagram", "category": "fashion", "topic": "Sustainable Streetwear", "region": "FR", "signal_type": "hot", "velocity": 81.4, "volume": 890000},
        {"source": "tiktok", "category": "fashion", "topic": "Thrift Flip Tutorials", "region": "US", "signal_type": "emerging", "velocity": 69.7, "volume": 520000},
        {"source": "instagram", "category": "fashion", "topic": "Y2K Revival", "region": "KR", "signal_type": "declining", "velocity": -15.8, "volume": 240000},
        {"source": "tiktok", "category": "food", "topic": "Protein-Packed Meal Prep", "region": "US", "signal_type": "hot", "velocity": 87.3, "volume": 1100000},
        {"source": "youtube", "category": "food", "topic": "Fermentation at Home", "region": "JP", "signal_type": "emerging", "velocity": 62.1, "volume": 340000},
        {"source": "instagram", "category": "food", "topic": "Cloud Bread", "region": "US", "signal_type": "declining", "velocity": -22.4, "volume": 95000},
        {"source": "youtube", "category": "fitness", "topic": "Zone 2 Cardio Training", "region": "US", "signal_type": "hot", "velocity": 76.8, "volume": 680000},
        {"source": "tiktok", "category": "fitness", "topic": "Hybrid Athlete Content", "region": "UK", "signal_type": "emerging", "velocity": 70.5, "volume": 420000},
        {"source": "youtube", "category": "education", "topic": "Learn to Code in 2026", "region": "IN", "signal_type": "hot", "velocity": 91.0, "volume": 1500000},
        {"source": "tiktok", "category": "education", "topic": "Micro-Learning Clips", "region": "US", "signal_type": "emerging", "velocity": 74.6, "volume": 590000},
        {"source": "instagram", "category": "travel", "topic": "Digital Nomad Vlogs", "region": "TH", "signal_type": "hot", "velocity": 68.9, "volume": 470000},
        {"source": "tiktok", "category": "travel", "topic": "Hidden Gem Destinations", "region": "EU", "signal_type": "emerging", "velocity": 59.3, "volume": 310000},
    ]

    docs = []
    for i, data in enumerate(demo_data):
        offset_days = i * 2
        docs.append(TrendSignal(
            source=data["source"],
            category=data["category"],
            topic=data["topic"],
            region=data["region"],
            signal_type=data["signal_type"],
            velocity=data["velocity"],
            volume=data["volume"],
            raw_data={"demo": True, "rank": i + 1},
            captured_at=now - timedelta(days=offset_days),
        ))
    await TrendSignal.insert_many(docs)