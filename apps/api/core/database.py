"""MongoDB connection and Beanie ODM initialization."""
import logging

from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie

from apps.api.core.config import settings

logger = logging.getLogger(__name__)

client: AsyncIOMotorClient | None = None


def get_client() -> AsyncIOMotorClient:
    global client
    if client is None:
        client = AsyncIOMotorClient(settings.DATABASE_URL)
    return client


async def init_db() -> None:
    """Connect to MongoDB and register all Beanie document models."""
    from apps.api.models.database import (
        User,
        SocialAccount,
        Project,
        ContentUpload,
        ContentScore,
        TrendSignal,
    )

    db = get_client()[settings.MONGO_DB_NAME]
    await init_beanie(
        database=db,
        document_models=[
            User,
            SocialAccount,
            Project,
            ContentUpload,
            ContentScore,
            TrendSignal,
        ],
    )
    logger.info("Beanie initialized against MongoDB database '%s'", settings.MONGO_DB_NAME)
