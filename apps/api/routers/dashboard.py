from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from apps.api.core.database import get_db
from apps.api.core.security import get_current_user
from apps.api.models.database import ContentScore, ContentUpload, Project, TrendSignal, User
from apps.api.models.schemas import (
    CreatorDashboard,
    MarketOverview,
    ProjectResponse,
    ScoreResponse,
    TrendResponse,
)

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/creator", response_model=CreatorDashboard)
async def creator_dashboard(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    proj_count = await db.execute(
        select(func.count(Project.id)).where(Project.user_id == current_user.id)
    )
    total_projects = proj_count.scalar() or 0

    upload_count = await db.execute(
        select(func.count(ContentUpload.id))
        .join(Project, ContentUpload.project_id == Project.id)
        .where(Project.user_id == current_user.id)
    )
    total_uploads = upload_count.scalar() or 0

    avg_result = await db.execute(
        select(func.avg(ContentScore.overall_viability))
        .join(Project, ContentScore.project_id == Project.id)
        .where(Project.user_id == current_user.id)
    )
    average_viability = avg_result.scalar()

    best_project = None
    best_score_result = await db.execute(
        select(ContentScore)
        .join(Project, ContentScore.project_id == Project.id)
        .where(Project.user_id == current_user.id)
        .order_by(ContentScore.overall_viability.desc())
        .limit(1)
    )
    best_score = best_score_result.scalar_one_or_none()
    if best_score:
        bp_result = await db.execute(select(Project).where(Project.id == best_score.project_id))
        bp = bp_result.scalar_one_or_none()
        if bp:
            best_project = ProjectResponse.model_validate(bp)

    recent_result = await db.execute(
        select(ContentScore)
        .join(Project, ContentScore.project_id == Project.id)
        .where(Project.user_id == current_user.id)
        .order_by(ContentScore.scored_at.desc())
        .limit(10)
    )
    recent_scores = [ScoreResponse.model_validate(s) for s in recent_result.scalars().all()]

    history_result = await db.execute(
        select(ContentScore.scored_at, ContentScore.overall_viability)
        .join(Project, ContentScore.project_id == Project.id)
        .where(Project.user_id == current_user.id)
        .order_by(ContentScore.scored_at.asc())
    )
    score_history = [
        {"scored_at": str(row.scored_at), "overall_viability": row.overall_viability}
        for row in history_result.all()
    ]

    return CreatorDashboard(
        total_projects=total_projects,
        total_uploads=total_uploads,
        average_viability=round(average_viability, 4) if average_viability else None,
        best_project=best_project,
        recent_scores=recent_scores,
        score_history=score_history,
    )


@router.get("/market", response_model=MarketOverview)
async def market_overview(db: AsyncSession = Depends(get_db)):
    hot = await db.execute(
        select(TrendSignal)
        .where(TrendSignal.signal_type == "hot")
        .order_by(TrendSignal.velocity.desc())
        .limit(10)
    )
    hot_trends = [TrendResponse.model_validate(t) for t in hot.scalars().all()]

    emerging = await db.execute(
        select(TrendSignal)
        .where(TrendSignal.signal_type == "emerging")
        .order_by(TrendSignal.velocity.desc())
        .limit(10)
    )
    emerging_trends = [TrendResponse.model_validate(t) for t in emerging.scalars().all()]

    declining = await db.execute(
        select(TrendSignal)
        .where(TrendSignal.signal_type == "declining")
        .order_by(TrendSignal.velocity.asc())
        .limit(10)
    )
    declining_trends = [TrendResponse.model_validate(t) for t in declining.scalars().all()]

    cat_result = await db.execute(
        select(TrendSignal.category, func.count(TrendSignal.id).label("count"))
        .where(TrendSignal.category.isnot(None))
        .group_by(TrendSignal.category)
        .order_by(func.count(TrendSignal.id).desc())
        .limit(10)
    )
    top_categories = [{"category": row.category, "count": row.count} for row in cat_result.all()]

    region_result = await db.execute(
        select(
            TrendSignal.region,
            func.count(TrendSignal.id).label("count"),
            func.avg(TrendSignal.velocity).label("avg_velocity"),
        )
        .where(TrendSignal.region.isnot(None))
        .group_by(TrendSignal.region)
        .order_by(func.count(TrendSignal.id).desc())
        .limit(10)
    )
    regional_highlights = [
        {"region": row.region, "count": row.count, "avg_velocity": round(row.avg_velocity, 2)}
        for row in region_result.all()
    ]

    return MarketOverview(
        hot_trends=hot_trends,
        emerging_trends=emerging_trends,
        declining_trends=declining_trends,
        top_categories=top_categories,
        regional_highlights=regional_highlights,
    )
