from pathlib import Path

from pydantic_settings import BaseSettings


def _find_project_root() -> Path:
    current = Path(__file__).resolve()
    for parent in [current.parent, *current.parents]:
        if (parent / ".env").exists():
            return parent
    return current.parent


ROOT_DIR = _find_project_root()
ENV_FILE = ROOT_DIR / ".env"


class Settings(BaseSettings):
    # Secrets and connection strings belong in .env — keep defaults non-sensitive.
    DATABASE_URL: str = "mongodb://localhost:27017"
    DATABASE_URL_SYNC: str = "mongodb://localhost:27017"
    MONGO_DB_NAME: str = "swappy"
    REDIS_URL: str = "redis://localhost:6379/0"
    S3_ENDPOINT: str = "http://localhost:9000"
    S3_ACCESS_KEY: str = "minioadmin"
    S3_SECRET_KEY: str = "minioadmin"
    S3_BUCKET: str = "swappy-prod-uploads"
    JWT_SECRET: str = "swappy-dev-secret-change-in-production"
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRATION_MINUTES: int = 1440
    MODEL_PATH: str = "./data/models"
    DEVICE: str = "cpu"
    APP_ENV: str = "development"
    FRONTEND_URL: str = "http://localhost:3000"
    BACKEND_URL: str = "http://127.0.0.1:8000"

    # OAuth — leave blank to disable a provider; set real values in .env
    GOOGLE_CLIENT_ID: str = ""
    GOOGLE_CLIENT_SECRET: str = ""
    INSTAGRAM_CLIENT_ID: str = ""
    INSTAGRAM_CLIENT_SECRET: str = ""
    TWITTER_CLIENT_ID: str = ""
    TWITTER_CLIENT_SECRET: str = ""

    model_config = {"env_file": str(ENV_FILE), "extra": "ignore"}


settings = Settings()
