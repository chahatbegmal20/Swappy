import logging
import os
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

    # Object storage:
    # - Local dev defaults aim at MinIO.
    # - On ECS, leave S3_ACCESS_KEY / S3_SECRET_KEY empty and use the task IAM role.
    # - Set S3_ENDPOINT only for MinIO/R2 path-style; leave empty for AWS S3.
    S3_ENDPOINT: str = "http://localhost:9000"
    S3_ACCESS_KEY: str = "minioadmin"
    S3_SECRET_KEY: str = "minioadmin"
    S3_BUCKET: str = "swappy-uploads"
    S3_REGION: str = "ap-southeast-2"
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

        # Strip local MinIO defaults outside development so ECS uses IAM role + real S3.
        if not self.is_development:
            endpoint = (self.S3_ENDPOINT or "").strip()
            if "localhost" in endpoint or "127.0.0.1" in endpoint:
                object.__setattr__(self, "S3_ENDPOINT", "")
            key = (self.S3_ACCESS_KEY or "").strip().lower()
            if key in {"", "minioadmin", "your-access-key", "changeme"}:
                object.__setattr__(self, "S3_ACCESS_KEY", "")
                object.__setattr__(self, "S3_SECRET_KEY", "")
                object.__setattr__(self, "S3_FORCE_PATH_STYLE", False)

        # Never mint ephemeral JWT secrets — that breaks Google login across ECS tasks.
        if self.allow_insecure_defaults:
            jwt = self.JWT_SECRET.strip()
            if jwt in _INSECURE_JWT_DEFAULTS or len(jwt) < 32:
                logger.warning(
                    "JWT_SECRET is the insecure development default. "
                    "Set a unique 32+ character secret before any shared deploy."
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
        """Mock disk uploads are local-development only.

        ALLOW_MOCK_STORAGE=true on ECS/staging is ignored — files would land in the
        container's ephemeral filesystem and disappear on deploy/scale/crash.
        """
        if not self.is_development:
            return False
        return True

    @property
    def uses_iam_role_for_s3(self) -> bool:
        """True when access keys are blank — boto3 should use the ECS task role."""
        key = (self.S3_ACCESS_KEY or "").strip().lower()
        return key in {"", "minioadmin", "your-access-key", "changeme"}

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
        # Mock is already ignored outside development (see allow_mock_storage).
        # Warn instead of refusing boot so OAuth/security deploys are not blocked
        # while operators finish S3 cutover.
        if self.ALLOW_MOCK_STORAGE:
            logger.error(
                "ALLOW_MOCK_STORAGE=true is set but mock disk uploads are disabled "
                "outside local development. Set ALLOW_MOCK_STORAGE=false and configure "
                "S3_BUCKET + task IAM role (see docs/security/STORAGE_CUTOVER.md)."
            )
        if self.is_production and not (self.S3_BUCKET or "").strip():
            problems.append("S3_BUCKET must be set for production object storage")

        if problems:
            raise RuntimeError(
                "Invalid configuration for APP_ENV="
                f"{self.APP_ENV}: " + "; ".join(problems)
            )


settings = Settings()
settings.validate_for_runtime()
