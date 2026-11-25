"""MongoDB connection and Beanie ODM initialization."""
import logging
import sys

from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie

from apps.api.core.config import settings

logger = logging.getLogger(__name__)

client: AsyncIOMotorClient | None = None


def _mongo_client_kwargs() -> dict:
    """TLS options that work with Atlas on modern OpenSSL / cloud hosts."""
    kwargs: dict = {
        "serverSelectionTimeoutMS": 20000,
        "connectTimeoutMS": 20000,
    }
    try:
        import certifi

        # Pin CA bundle — avoids TLSV1_ALERT_INTERNAL_ERROR on some cloud Python builds
        kwargs["tlsCAFile"] = certifi.where()
    except ImportError:
        logger.warning("certifi not installed — using system CA store for MongoDB TLS")
    return kwargs


def get_client() -> AsyncIOMotorClient:
    global client
    if client is None:
        client = AsyncIOMotorClient(settings.DATABASE_URL, **_mongo_client_kwargs())
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
        OAuthState,
    )

    logger.info(
        "Connecting to MongoDB db=%s python=%s",
        settings.MONGO_DB_NAME,
        sys.version.split()[0],
    )

    db = get_client()[settings.MONGO_DB_NAME]
    try:
        await init_beanie(
            database=db,
            document_models=[
                User,
                SocialAccount,
                Project,
                ContentUpload,
                ContentScore,
                TrendSignal,
                OAuthState,
            ],
        )
    except Exception as exc:
        raise RuntimeError(
            "MongoDB connection failed. Check: "
            "(1) Atlas → Network Access allows 0.0.0.0/0 (or Render egress IPs); "
            "(2) DATABASE_URL is a valid mongodb+srv:// URI with the correct password; "
            "(3) Render PYTHON_VERSION=3.11.9 and redeploy with Clear build cache "
            f"(current Python {sys.version.split()[0]}). "
            f"Underlying error: {exc}"
        ) from exc

    logger.info("Beanie initialized against MongoDB database '%s'", settings.MONGO_DB_NAME)
