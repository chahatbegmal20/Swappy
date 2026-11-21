import os
import logging
import asyncio

from fastapi import APIRouter, Depends, HTTPException, status

from apps.api.core.security import get_current_user
from apps.api.models.database import ContentScore, ContentUpload, Project, User
from apps.api.models.schemas import AnalyzeRequest, ScoreResponse

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/scoring", tags=["scoring"])

_pipeline = None
_pipeline_failed = False


def _get_pipeline():
    """Prefer full ML pipeline; return None on slim cloud installs without heavy deps."""
    global _pipeline, _pipeline_failed
    if _pipeline is not None or _pipeline_failed:
        return _pipeline
    try:
        from services.ml_inference.pipeline import ScoringPipeline

        _pipeline = ScoringPipeline()
        logger.info("ML Scoring Pipeline initialized")
    except Exception as exc:
        _pipeline_failed = True
        logger.warning(
            "ML pipeline unavailable (%s) — using heuristic scoring_engine fallback",
            exc,
        )
        _pipeline = None
    return _pipeline


async def _get_owned_project(project_id: str, user: User) -> Project | None:
    project = await Project.get(project_id)
    if not project or project.user_id != user.id:
        return None
    return project


@router.post("/analyze", response_model=ScoreResponse, status_code=status.HTTP_201_CREATED)
async def analyze_project(
    body: AnalyzeRequest,
    current_user: User = Depends(get_current_user),
):
    project = await _get_owned_project(body.project_id, current_user)
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")

    uploads = await ContentUpload.find(ContentUpload.project_id == project.id).to_list()
    upload_file_paths = []
    for upload in uploads:
        local_path = os.path.join("local_uploads", upload.s3_key) if upload.s3_key else ""
        upload_file_paths.append({
            "local_path": local_path,
            "content_type": upload.content_type,
            "filename": upload.original_filename,
        })

    pipeline = _get_pipeline()
    if pipeline is not None:
        # Run CPU-heavy model inference off the event loop so auth/health stay responsive
        # while sentence-transformers / XGBoost load on first request.
        score_data = await asyncio.to_thread(
            pipeline.analyze,
            title=project.name,
            description=project.description,
            hashtags=project.hashtags,
            genre_tags=project.genres,
            mood_tags=project.moods,
            target_platform=project.target_platform,
            target_audience=project.target_audience,
            language=project.language or "en",
            region=project.region,
            upload_file_paths=upload_file_paths,
        )
    else:
        from apps.api.services.scoring_engine import generate_scores

        # Heuristic scorer expects uploads on the project object
        project.uploads = uploads  # type: ignore[attr-defined]
        score_data = generate_scores(project)

    score = ContentScore(project_id=project.id, **score_data)
    await score.insert()

    return ScoreResponse.model_validate(score)


@router.get("/{project_id}/scores", response_model=list[ScoreResponse])
async def get_project_scores(
    project_id: str,
    current_user: User = Depends(get_current_user),
):
    if not await _get_owned_project(project_id, current_user):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")

    scores = (
        await ContentScore.find(ContentScore.project_id == project_id)
        .sort(-ContentScore.scored_at)
        .to_list()
    )
    return [ScoreResponse.model_validate(s) for s in scores]


@router.get("/{project_id}/latest", response_model=ScoreResponse)
async def get_latest_score(
    project_id: str,
    current_user: User = Depends(get_current_user),
):
    if not await _get_owned_project(project_id, current_user):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")

    score = (
        await ContentScore.find(ContentScore.project_id == project_id)
        .sort(-ContentScore.scored_at)
        .first_or_none()
    )
    if not score:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No scores found")
    return ScoreResponse.model_validate(score)