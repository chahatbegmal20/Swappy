from datetime import datetime, timedelta, timezone
from typing import Optional

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from apps.api.models.database import TrendSignal


async def get_trends(
    db: AsyncSession,
    *,
    category: Optional[str] = None,
    region: Optional[str] = None,
    signal_type: Optional[str] = None,
    limit: int = 50,
) -> list[TrendSignal]:
    query = select(TrendSignal).order_by(TrendSignal.velocity.desc())
    if category:
        query = query.where(TrendSignal.category == category)
    if region:
        query = query.where(TrendSignal.region == region)
    if signal_type:
        query = query.where(TrendSignal.signal_type == signal_type)
    query = query.limit(limit)
    result = await db.execute(query)
    return list(result.scalars().all())


async def search_trends(
    db: AsyncSession,
    *,
    query: str,
    limit: int = 50,
) -> list[TrendSignal]:
    stmt = (
        select(TrendSignal)
        .where(TrendSignal.topic.ilike(f"%{query}%"))
        .order_by(TrendSignal.velocity.desc())
        .limit(limit)
    )
    result = await db.execute(stmt)
    return list(result.scalars().all())


async def get_heatmap(db: AsyncSession) -> list[dict]:
    stmt = (
        select(
            TrendSignal.region,
            func.count(TrendSignal.id).label("trend_count"),
            func.avg(TrendSignal.velocity).label("avg_velocity"),
            func.sum(TrendSignal.volume).label("total_volume"),
        )
        .where(TrendSignal.region.isnot(None))
        .group_by(TrendSignal.region)
        .order_by(func.sum(TrendSignal.volume).desc())
    )
    result = await db.execute(stmt)
    return [
        {
            "region": row.region,
            "trend_count": row.trend_count,
            "avg_velocity": round(row.avg_velocity, 2),
            "total_volume": round(row.total_volume, 2),
        }
        for row in result.all()
    ]


async def get_trajectory(db: AsyncSession, *, topic: str) -> list[dict]:
    stmt = (
        select(TrendSignal)
        .where(TrendSignal.topic.ilike(f"%{topic}%"))
        .order_by(TrendSignal.captured_at.asc())
    )
    result = await db.execute(stmt)
    return [
        {
            "captured_at": str(t.captured_at),
            "velocity": t.velocity,
            "volume": t.volume,
            "signal_type": t.signal_type,
            "source": t.source,
        }
        for t in result.scalars().all()
    ]


async def seed_demo_trends(db: AsyncSession) -> None:
    """Seed the database with realistic demo trend data."""
    existing = await db.execute(select(func.count(TrendSignal.id)))
    if (existing.scalar() or 0) > 0:
        return

    now = datetime.now(timezone.utc)
    demo_data = [
        # Music
        {"source": "youtube", "category": "music", "topic": "Lo-fi Hip Hop Beats", "region": "US", "signal_type": "hot", "velocity": 92.5, "volume": 1850000},
        {"source": "spotify", "category": "music", "topic": "AI-Generated Music Remixes", "region": "US", "signal_type": "emerging", "velocity": 78.3, "volume": 420000},
        {"source": "tiktok", "category": "music", "topic": "Bedroom Pop Revival", "region": "UK", "signal_type": "hot", "velocity": 88.1, "volume": 1200000},
        {"source": "youtube", "category": "music", "topic": "Acoustic Covers Challenge", "region": "BR", "signal_type": "emerging", "velocity": 65.4, "volume": 380000},
        {"source": "spotify", "category": "music", "topic": "Synthwave Nostalgia", "region": "DE", "signal_type": "declining", "velocity": -12.3, "volume": 290000},
        # Gaming
        {"source": "twitch", "category": "gaming", "topic": "Indie Roguelikes", "region": "US", "signal_type": "hot", "velocity": 85.7, "volume": 920000},
        {"source": "youtube", "category": "gaming", "topic": "Cozy Game Streams", "region": "JP", "signal_type": "emerging", "velocity": 71.2, "volume": 540000},
        {"source": "tiktok", "category": "gaming", "topic": "Speedrun Highlights", "region": "US", "signal_type": "hot", "velocity": 79.8, "volume": 780000},
        {"source": "twitch", "category": "gaming", "topic": "Retro Console Collecting", "region": "UK", "signal_type": "declining", "velocity": -8.5, "volume": 180000},
        # Tech
        {"source": "twitter", "category": "tech", "topic": "Open Source AI Tools", "region": "US", "signal_type": "hot", "velocity": 95.2, "volume": 2100000},
        {"source": "youtube", "category": "tech", "topic": "Local LLM Setup Guides", "region": "US", "signal_type": "emerging", "velocity": 82.6, "volume": 650000},
        {"source": "twitter", "category": "tech", "topic": "Rust Programming Language", "region": "DE", "signal_type": "hot", "velocity": 73.9, "volume": 480000},
        {"source": "youtube", "category": "tech", "topic": "3D Printing at Home", "region": "US", "signal_type": "declining", "velocity": -5.2, "volume": 310000},
        # Fashion
        {"source": "instagram", "category": "fashion", "topic": "Sustainable Streetwear", "region": "FR", "signal_type": "hot", "velocity": 81.4, "volume": 890000},
        {"source": "tiktok", "category": "fashion", "topic": "Thrift Flip Tutorials", "region": "US", "signal_type": "emerging", "velocity": 69.7, "volume": 520000},
        {"source": "instagram", "category": "fashion", "topic": "Y2K Revival", "region": "KR", "signal_type": "declining", "velocity": -15.8, "volume": 240000},
        # Food
        {"source": "tiktok", "category": "food", "topic": "Protein-Packed Meal Prep", "region": "US", "signal_type": "hot", "velocity": 87.3, "volume": 1100000},
        {"source": "youtube", "category": "food", "topic": "Fermentation at Home", "region": "JP", "signal_type": "emerging", "velocity": 62.1, "volume": 340000},
        {"source": "instagram", "category": "food", "topic": "Cloud Bread", "region": "US", "signal_type": "declining", "velocity": -22.4, "volume": 95000},
        # Fitness
        {"source": "youtube", "category": "fitness", "topic": "Zone 2 Cardio Training", "region": "US", "signal_type": "hot", "velocity": 76.8, "volume": 680000},
        {"source": "tiktok", "category": "fitness", "topic": "Hybrid Athlete Content", "region": "UK", "signal_type": "emerging", "velocity": 70.5, "volume": 420000},
        # Education
        {"source": "youtube", "category": "education", "topic": "Learn to Code in 2026", "region": "IN", "signal_type": "hot", "velocity": 91.0, "volume": 1500000},
        {"source": "tiktok", "category": "education", "topic": "Micro-Learning Clips", "region": "US", "signal_type": "emerging", "velocity": 74.6, "volume": 590000},
        # Travel
        {"source": "instagram", "category": "travel", "topic": "Digital Nomad Vlogs", "region": "TH", "signal_type": "hot", "velocity": 68.9, "volume": 470000},
        {"source": "tiktok", "category": "travel", "topic": "Hidden Gem Destinations", "region": "EU", "signal_type": "emerging", "velocity": 59.3, "volume": 310000},
    ]

    for i, data in enumerate(demo_data):
        offset_days = i * 2
        signal = TrendSignal(
            source=data["source"],
            category=data["category"],
            topic=data["topic"],
            region=data["region"],
            signal_type=data["signal_type"],
            velocity=data["velocity"],
            volume=data["volume"],
            raw_data={"demo": True, "rank": i + 1},
            captured_at=now - timedelta(days=offset_days),
        )
        db.add(signal)
    await db.flush()
