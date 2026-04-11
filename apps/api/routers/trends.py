from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from apps.api.core.database import get_db
from apps.api.models.schemas import TrendResponse
from apps.api.services.trend_service import (
    get_heatmap,
    get_trajectory,
    get_trends,
    search_trends,
)

router = APIRouter(prefix="/trends", tags=["trends"])


@router.get("/", response_model=list[TrendResponse])
async def list_trends(
    category: Optional[str] = Query(None),
    region: Optional[str] = Query(None),
    signal_type: Optional[str] = Query(None),
    limit: int = Query(50, ge=1, le=200),
    db: AsyncSession = Depends(get_db),
):
    trends = await get_trends(
        db, category=category, region=region, signal_type=signal_type, limit=limit
    )
    return [TrendResponse.model_validate(t) for t in trends]


@router.get("/search", response_model=list[TrendResponse])
async def search(
    q: str = Query(..., min_length=1),
    limit: int = Query(50, ge=1, le=200),
    db: AsyncSession = Depends(get_db),
):
    trends = await search_trends(db, query=q, limit=limit)
    return [TrendResponse.model_validate(t) for t in trends]


@router.get("/heatmap")
async def heatmap(db: AsyncSession = Depends(get_db)):
    return await get_heatmap(db)


@router.get("/{topic}/trajectory")
async def trajectory(topic: str, db: AsyncSession = Depends(get_db)):
    return await get_trajectory(db, topic=topic)
