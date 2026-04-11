import os
import logging

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from apps.api.core.database import get_db
from apps.api.core.security import get_current_user
from apps.api.models.database import ContentScore, Project, User
from apps.api.models.schemas import AnalyzeRequest, ScoreResponse

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/scoring", tags=["scoring"])

_pipeline = None


def _get_pipeline():
    global _pipeline
    if _pipeline is None:
        from services.ml_inference.pipeline import ScoringPipeline
        _pipeline = ScoringPipeline()
        logger.info("ML Scoring Pipeline initialized")
    return _pipeline


@router.post("/analyze", response_model=ScoreResponse, status_code=status.HTTP_201_CREATED)
async def analyze_project(
    body: AnalyzeRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Project)
        .options(selectinload(Project.uploads))
        .where(Project.id == body.project_id, Project.user_id == current_user.id)
    )
    project = result.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")

    upload_file_paths = []
    if project.uploads:
        for upload in project.uploads:
            local_path = os.path.join("local_uploads", upload.s3_key) if upload.s3_key else ""
            upload_file_paths.append({
                "local_path": local_path,
                "content_type": upload.content_type,
                "filename": upload.original_filename,
            })

    pipeline = _get_pipeline()
    score_data = pipeline.analyze(
        title=project.name,
        description=project.description,
        hashtags=project.hashtags if hasattr(project, "hashtags") else None,
        genre_tags=project.genres if hasattr(project, "genres") else None,
        mood_tags=project.moods if hasattr(project, "moods") else None,
        target_platform=project.target_platform,
        target_audience=project.target_audience,
        language=project.language if hasattr(project, "language") else "en",
        region=project.region if hasattr(project, "region") else None,
        upload_file_paths=upload_file_paths,
    )

    score = ContentScore(project_id=project.id, **score_data)
    db.add(score)
    await db.flush()
    await db.refresh(score)

    return ScoreResponse.model_validate(score)


@router.get("/{project_id}/scores", response_model=list[ScoreResponse])
async def get_project_scores(
    project_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    proj_result = await db.execute(
        select(Project).where(Project.id == project_id, Project.user_id == current_user.id)
    )
    if not proj_result.scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")

    result = await db.execute(
        select(ContentScore)
        .where(ContentScore.project_id == project_id)
        .order_by(ContentScore.scored_at.desc())
    )
    return [ScoreResponse.model_validate(s) for s in result.scalars().all()]


@router.get("/{project_id}/latest", response_model=ScoreResponse)
async def get_latest_score(
    project_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    proj_result = await db.execute(
        select(Project).where(Project.id == project_id, Project.user_id == current_user.id)
    )
    if not proj_result.scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")

    result = await db.execute(
        select(ContentScore)
        .where(ContentScore.project_id == project_id)
        .order_by(ContentScore.scored_at.desc())
        .limit(1)
    )
    score = result.scalar_one_or_none()
    if not score:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No scores found")
    return ScoreResponse.model_validate(score)
