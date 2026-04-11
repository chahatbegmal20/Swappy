"""Trend ingestion pipeline — runs as a scheduled task.

In production, this would be an Airflow/Dagster DAG.
For MVP, it's a standalone script that can be run via cron or celery beat.
"""
import asyncio
import logging
from datetime import datetime, timezone

from services.trend_ingestion.sources import SyntheticTrendSource
from services.trend_ingestion.processor import TrendProcessor

logger = logging.getLogger(__name__)


async def run_trend_ingestion():
    """Execute the full trend ingestion pipeline."""
    logger.info("Starting trend ingestion pipeline...")
    start = datetime.now(timezone.utc)
    
    # Step 1: Fetch from sources
    source = SyntheticTrendSource()
    raw_signals = source.generate_batch(100)
    logger.info(f"Fetched {len(raw_signals)} raw signals")
    
    # Step 2: Process and validate
    processor = TrendProcessor()
    processed = processor.process_batch(raw_signals)
    logger.info(f"Processed {len(processed)} valid signals (from {len(raw_signals)} raw)")
    
    # Step 3: Quality check
    quality = processor.detect_quality_issues(processed)
    logger.info(f"Data quality score: {quality['quality_score']}")
    
    if quality["quality_score"] < 0.5:
        logger.warning("Data quality below threshold — signals may be unreliable")
    
    # Step 4: Store signals (in production, write to database)
    elapsed = (datetime.now(timezone.utc) - start).total_seconds()
    logger.info(f"Pipeline completed in {elapsed:.2f}s — {len(processed)} signals ready")
    
    return {
        "signals": processed,
        "quality": quality,
        "elapsed_seconds": elapsed,
        "timestamp": start.isoformat(),
    }


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    result = asyncio.run(run_trend_ingestion())
    print(f"Ingested {len(result['signals'])} signals with quality {result['quality']['quality_score']}")
