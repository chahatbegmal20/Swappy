from typing import Optional

from fastapi import APIRouter, HTTPException, Query, status

from apps.api.models.schemas import TrendDetailResponse, TrendResponse
from apps.api.services.trend_service import (
    compute_trend_score,
    get_heatmap,
    get_trend_detail,
    get_trajectory,
    get_trends,
    refresh_live_trends,
    search_trends,
)

router = APIRouter(prefix="/trends", tags=["trends"])


def _to_trend_response(t) -> TrendResponse:
    data = TrendResponse.model_validate(t)
    data.trend_score = compute_trend_score(
        velocity=t.velocity, volume=t.volume, signal_type=t.signal_type
    )
    return data


@router.get("/", response_model=list[TrendResponse])
async def list_trends(
    category: Optional[str] = Query(None),
    region: Optional[str] = Query(None),
    signal_type: Optional[str] = Query(None),
    source: Optional[str] = Query(
        None, description="Filter by source, e.g. google_trends"
    ),
    limit: int = Query(50, ge=1, le=200),
):
    trends = await get_trends(
        category=category,
        region=region,
        signal_type=signal_type,
        source=source,
        limit=limit,
    )
    return [_to_trend_response(t) for t in trends]


@router.get("/search", response_model=list[TrendResponse])
async def search(
    q: str = Query(..., min_length=1),
    limit: int = Query(50, ge=1, le=200),
):
    trends = await search_trends(query=q, limit=limit)
    return [_to_trend_response(t) for t in trends]


@router.get("/heatmap")
async def heatmap():
    return await get_heatmap()


@router.post("/refresh")
async def refresh(force: bool = Query(False)):
    """Pull live Google Trends / Reddit / Hacker News into the database."""
    return await refresh_live_trends(force=force)


@router.get("/detail/{topic}", response_model=TrendDetailResponse)
async def trend_detail(topic: str):
    detail = await get_trend_detail(topic=topic)
    if not detail:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Trend not found")
    return TrendDetailResponse.model_validate(detail)


@router.get("/{topic}/trajectory")
async def trajectory(topic: str):
    return await get_trajectory(topic=topic)
