from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    DATABASE_URL: str = "sqlite+aiosqlite:///./swappy.db"
    DATABASE_URL_SYNC: str = "sqlite:///./swappy.db"
    REDIS_URL: str = "redis://localhost:6379/0"
    S3_ENDPOINT: str = "http://localhost:9000"
    S3_ACCESS_KEY: str = "minioadmin"
    S3_SECRET_KEY: str = "minioadmin"
    S3_BUCKET: str = "swappy-uploads"
    JWT_SECRET: str = "swappy-dev-secret-change-in-production"
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRATION_MINUTES: int = 1440
    MODEL_PATH: str = "./data/models"
    DEVICE: str = "cpu"
    APP_ENV: str = "development"
    FRONTEND_URL: str = "http://localhost:3000"
    BACKEND_URL: str = "http://localhost:8000"

    # OAuth — leave blank to disable a provider
    GOOGLE_CLIENT_ID: str = ""
    GOOGLE_CLIENT_SECRET: str = ""
    INSTAGRAM_CLIENT_ID: str = ""
    INSTAGRAM_CLIENT_SECRET: str = ""
    TWITTER_CLIENT_ID: str = ""
    TWITTER_CLIENT_SECRET: str = ""

    model_config = {"env_file": ".env", "extra": "ignore"}


settings = Settings()
