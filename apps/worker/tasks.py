"""Async worker tasks for heavy processing jobs."""
import os
import sys
import logging
from datetime import datetime, timezone

from celery import Celery

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..'))

logger = logging.getLogger(__name__)

app = Celery(
    "swappy",
    broker=os.getenv("REDIS_URL", "redis://localhost:6379/0"),
    backend=os.getenv("REDIS_URL", "redis://localhost:6379/0"),
)

app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
    task_time_limit=300,
    task_soft_time_limit=240,
)


@app.task(bind=True, max_retries=3)
def analyze_content(self, project_id: str, user_id: str):
    """Run the full ML scoring pipeline for a project."""
    try:
        logger.info(f"Starting analysis for project {project_id}")
        
        from services.ml_inference.pipeline import ScoringPipeline
        
        pipeline = ScoringPipeline()
        result = pipeline.analyze(
            title=f"Project {project_id}",
            description="Content analysis in progress",
        )
        
        logger.info(f"Analysis complete for project {project_id}: viability={result['overall_viability']}")
        return {"project_id": project_id, "scores": result, "completed_at": datetime.now(timezone.utc).isoformat()}
    
    except Exception as exc:
        logger.error(f"Analysis failed for project {project_id}: {exc}")
        self.retry(exc=exc, countdown=30)


@app.task(bind=True, max_retries=2)
def ingest_trends(self):
    """Run the trend ingestion pipeline."""
    try:
        logger.info("Starting trend ingestion...")
        
        from services.trend_ingestion.sources import SyntheticTrendSource
        from services.trend_ingestion.processor import TrendProcessor
        
        source = SyntheticTrendSource()
        processor = TrendProcessor()
        
        raw = source.generate_batch(100)
        processed = processor.process_batch(raw)
        quality = processor.detect_quality_issues(processed)
        
        logger.info(f"Ingested {len(processed)} trends, quality={quality['quality_score']}")
        return {"count": len(processed), "quality": quality}
    
    except Exception as exc:
        logger.error(f"Trend ingestion failed: {exc}")
        self.retry(exc=exc, countdown=60)


@app.task
def process_upload(upload_id: str, s3_key: str, content_type: str):
    """Process an uploaded file — extract features and store embeddings."""
    logger.info(f"Processing upload {upload_id} ({content_type})")
    
    if content_type in ("video", "audio"):
        logger.info(f"Media processing for {upload_id} — placeholder for ffmpeg/librosa pipeline")
    elif content_type == "thumbnail":
        logger.info(f"Image processing for {upload_id} — placeholder for CLIP embedding")
    elif content_type == "text":
        logger.info(f"Text processing for {upload_id} — placeholder for NLP embedding")
    
    return {"upload_id": upload_id, "status": "processed"}


app.conf.beat_schedule = {
    "ingest-trends-hourly": {
        "task": "apps.worker.tasks.ingest_trends",
        "schedule": 3600.0,
    },
}
