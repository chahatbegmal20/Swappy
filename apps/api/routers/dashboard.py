from collections import defaultdict

from fastapi import APIRouter, Depends

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
):
    projects = await Project.find(Project.user_id == current_user.id).to_list()
    project_ids = [p.id for p in projects]
    project_by_id = {p.id: p for p in projects}
    total_projects = len(projects)

    if not project_ids:
        return CreatorDashboard(
            total_projects=0,
            total_uploads=0,
            average_viability=None,
            best_project=None,
            recent_scores=[],
            score_history=[],
        )

    total_uploads = await ContentUpload.find(
        {"project_id": {"$in": project_ids}}
    ).count()

    scores = await ContentScore.find({"project_id": {"$in": project_ids}}).to_list()

    average_viability = None
    best_project = None
    if scores:
        average_viability = sum(s.overall_viability for s in scores) / len(scores)
        best_score = max(scores, key=lambda s: s.overall_viability)
        bp = project_by_id.get(best_score.project_id)
        if bp:
            best_project = ProjectResponse.model_validate(bp)

    recent_scores = [
        ScoreResponse.model_validate(s)
        for s in sorted(scores, key=lambda s: s.scored_at, reverse=True)[:10]
    ]

    score_history = [
        {"scored_at": str(s.scored_at), "overall_viability": s.overall_viability}
        for s in sorted(scores, key=lambda s: s.scored_at)
    ]

    return CreatorDashboard(
        total_projects=total_projects,
        total_uploads=total_uploads,
        average_viability=round(average_viability, 4) if average_viability is not None else None,
        best_project=best_project,
        recent_scores=recent_scores,
        score_history=score_history,
    )


@router.get("/market", response_model=MarketOverview)
async def market_overview():
    hot = (
        await TrendSignal.find(TrendSignal.signal_type == "hot")
        .sort(-TrendSignal.velocity)
        .limit(10)
        .to_list()
    )
    hot_trends = [TrendResponse.model_validate(t) for t in hot]

    emerging = (
        await TrendSignal.find(TrendSignal.signal_type == "emerging")
        .sort(-TrendSignal.velocity)
        .limit(10)
        .to_list()
    )
    emerging_trends = [TrendResponse.model_validate(t) for t in emerging]

    declining = (
        await TrendSignal.find(TrendSignal.signal_type == "declining")
        .sort(+TrendSignal.velocity)
        .limit(10)
        .to_list()
    )
    declining_trends = [TrendResponse.model_validate(t) for t in declining]

    all_signals = await TrendSignal.find_all().to_list()

    cat_counts: dict[str, int] = defaultdict(int)
    region_signals: dict[str, list[TrendSignal]] = defaultdict(list)
    for s in all_signals:
        if s.category:
            cat_counts[s.category] += 1
        if s.region:
            region_signals[s.region].append(s)

    top_categories = [
        {"category": cat, "count": count}
        for cat, count in sorted(cat_counts.items(), key=lambda x: x[1], reverse=True)[:10]
    ]

    regional_highlights = []
    for region, items in region_signals.items():
        count = len(items)
        avg_velocity = sum(i.velocity for i in items) / count if count else 0.0
        regional_highlights.append({
            "region": region,
            "count": count,
            "avg_velocity": round(avg_velocity, 2),
        })
    regional_highlights.sort(key=lambda r: r["count"], reverse=True)
    regional_highlights = regional_highlights[:10]

    return MarketOverview(
        hot_trends=hot_trends,
        emerging_trends=emerging_trends,
        declining_trends=declining_trends,
        top_categories=top_categories,
        regional_highlights=regional_highlights,
    )