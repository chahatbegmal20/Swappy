import logging
import os
import secrets
from pathlib import Path

from pydantic import field_validator, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

logger = logging.getLogger(__name__)


def _find_project_root() -> Path:
    current = Path(__file__).resolve()
    for parent in [current.parent, *current.parents]:
        if (parent / ".env").exists():
            return parent
    return current.parent


ROOT_DIR = _find_project_root()
ENV_FILE = ROOT_DIR / ".env"

_INSECURE_JWT_DEFAULTS = {
    "",
    "swappy-dev-secret-change-in-production",
    "change-me",
    "secret",
}


class Settings(BaseSettings):
    # Secrets and connection strings belong in env vars / .env — keep defaults non-sensitive.
    DATABASE_URL: str = "mongodb://localhost:27017"
    DATABASE_URL_SYNC: str = "mongodb://localhost:27017"
    MONGO_DB_NAME: str = "swappy"
    REDIS_URL: str = "redis://localhost:6379/0"

    # Object storage — local MinIO defaults; staging/prod use R2 or S3 via env
    S3_ENDPOINT: str = "http://localhost:9000"
    S3_ACCESS_KEY: str = "minioadmin"
    S3_SECRET_KEY: str = "minioadmin"
    S3_BUCKET: str = "swappy-uploads"
    S3_REGION: str = "auto"
    S3_FORCE_PATH_STYLE: bool = True

    JWT_SECRET: str = "swappy-dev-secret-change-in-production"
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRATION_MINUTES: int = 1440

    MODEL_PATH: str = "./data/models"
    DEVICE: str = "cpu"

    # development | staging | production
    APP_ENV: str = "development"
    APP_DEBUG: bool = True
    # Early-stage cloud bootstrap: allow local mock uploads when S3/R2 is not ready yet
    ALLOW_MOCK_STORAGE: bool = False

    FRONTEND_URL: str = "http://localhost:3000"
    BACKEND_URL: str = "http://127.0.0.1:8000"
    # Comma-separated extra browser origins (Vercel preview URLs, etc.)
    CORS_ALLOW_ORIGINS: str = ""

    # OAuth — leave blank to disable a provider; set real values per environment
    GOOGLE_CLIENT_ID: str = ""
    GOOGLE_CLIENT_SECRET: str = ""
    INSTAGRAM_CLIENT_ID: str = ""
    INSTAGRAM_CLIENT_SECRET: str = ""
    TWITTER_CLIENT_ID: str = ""
    TWITTER_CLIENT_SECRET: str = ""

    model_config = SettingsConfigDict(
        env_file=str(ENV_FILE),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    @field_validator("APP_ENV")
    @classmethod
    def normalize_app_env(cls, value: str) -> str:
        normalized = (value or "development").strip().lower()
        if normalized in {"dev", "local"}:
            return "development"
        if normalized in {"stage", "stg"}:
            return "staging"
        if normalized in {"prod"}:
            return "production"
        if normalized not in {"development", "staging", "production"}:
            raise ValueError(
                "APP_ENV must be one of: development, staging, production"
            )
        return normalized

    @model_validator(mode="after")
    def apply_platform_defaults(self):
        """Fill cloud-platform URLs/secrets so first cloud boot can succeed."""
        # Render injects RENDER_EXTERNAL_URL; set BACKEND_URL explicitly on ECS/Amplify/etc.
        render_url = (os.getenv("RENDER_EXTERNAL_URL") or "").strip().rstrip("/")
        if render_url.startswith("https://") and not self.BACKEND_URL.startswith("https://"):
            object.__setattr__(self, "BACKEND_URL", render_url)
            logger.info("BACKEND_URL defaulted from RENDER_EXTERNAL_URL=%s", render_url)

        if not self.allow_insecure_defaults:
            jwt = self.JWT_SECRET.strip()
            if jwt in _INSECURE_JWT_DEFAULTS or len(jwt) < 32:
                # Prefer an explicit env secret; otherwise mint one so the service can boot.
                generated = secrets.token_urlsafe(48)
                object.__setattr__(self, "JWT_SECRET", generated)
                logger.warning(
                    "JWT_SECRET was missing/insecure for APP_ENV=%s — generated an ephemeral "
                    "secret for this process. Set a stable JWT_SECRET in the host env "
                    "(Render → Environment → Generate) so tokens survive restarts.",
                    self.APP_ENV,
                )
        return self

    @property
    def is_development(self) -> bool:
        return self.APP_ENV == "development"

    @property
    def is_staging(self) -> bool:
        return self.APP_ENV == "staging"

    @property
    def is_production(self) -> bool:
        return self.APP_ENV == "production"

    @property
    def allow_insecure_defaults(self) -> bool:
        return self.is_development

    @property
    def allow_mock_storage(self) -> bool:
        return self.is_development or self.ALLOW_MOCK_STORAGE

    def google_oauth_redirect_uri(self) -> str:
        return (
            f"{self.BACKEND_URL.rstrip('/')}"
            "/api/v1/auth/social/google/callback"
        )

    def validate_for_runtime(self) -> None:
        """Fail fast in staging/production when critical secrets are missing."""
        if self.allow_insecure_defaults:
            return

        problems: list[str] = []
        if self.JWT_SECRET.strip() in _INSECURE_JWT_DEFAULTS or len(self.JWT_SECRET) < 32:
            problems.append(
                "JWT_SECRET must be a unique value of at least 32 characters "
                "(do not reuse the local .env default)"
            )
        if not self.DATABASE_URL or self.DATABASE_URL.startswith("mongodb://localhost"):
            problems.append("DATABASE_URL must point at Atlas (or another remote MongoDB)")
        if not self.FRONTEND_URL.startswith("https://"):
            problems.append(
                "FRONTEND_URL must be your public https:// site "
                "(e.g. https://www.swappystudio.com), not localhost"
            )
        if not self.BACKEND_URL.startswith("https://"):
            problems.append(
                "BACKEND_URL must be an https:// URL "
                "(ECS Express public URL, or Render’s RENDER_EXTERNAL_URL)"
            )
        if self.APP_DEBUG and self.is_production:
            problems.append("APP_DEBUG must be false in production")

        if problems:
            raise RuntimeError(
                "Invalid configuration for APP_ENV="
                f"{self.APP_ENV}: " + "; ".join(problems)
            )


settings = Settings()
settings.validate_for_runtime()
