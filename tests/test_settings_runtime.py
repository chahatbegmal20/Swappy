import pytest

from apps.api.core.config import Settings


def test_development_allows_local_defaults():
    settings = Settings(
        APP_ENV="development",
        APP_DEBUG=True,
        JWT_SECRET="swappy-dev-secret-change-in-production",
        DATABASE_URL="mongodb://localhost:27017",
        FRONTEND_URL="http://localhost:3000",
        BACKEND_URL="http://127.0.0.1:8000",
    )
    settings.validate_for_runtime()
    assert settings.is_development
    assert settings.allow_mock_storage is True
    assert settings.google_oauth_redirect_uri().endswith(
        "/api/v1/auth/social/google/callback"
    )


def test_staging_uses_render_external_url_for_backend(monkeypatch):
    monkeypatch.setenv("RENDER_EXTERNAL_URL", "https://swappy-api.onrender.com")
    settings = Settings(
        APP_ENV="staging",
        APP_DEBUG=False,
        ALLOW_MOCK_STORAGE=False,
        JWT_SECRET="a" * 32,
        DATABASE_URL="mongodb+srv://user:pass@cluster.example.mongodb.net/",
        FRONTEND_URL="https://swappy.vercel.app",
        BACKEND_URL="http://127.0.0.1:8000",
        S3_BUCKET="swappy-staging-uploads",
        S3_ENDPOINT="http://localhost:9000",
        S3_ACCESS_KEY="minioadmin",
        S3_SECRET_KEY="minioadmin",
    )
    assert settings.BACKEND_URL == "https://swappy-api.onrender.com"
    # Local MinIO defaults are cleared outside development.
    assert settings.S3_ENDPOINT == ""
    assert settings.S3_ACCESS_KEY == ""
    assert settings.allow_mock_storage is False
    settings.validate_for_runtime()


def test_staging_rejects_insecure_jwt_secret(monkeypatch):
    monkeypatch.delenv("RENDER_EXTERNAL_URL", raising=False)
    settings = Settings(
        APP_ENV="staging",
        APP_DEBUG=False,
        ALLOW_MOCK_STORAGE=False,
        JWT_SECRET="swappy-dev-secret-change-in-production",
        DATABASE_URL="mongodb+srv://user:pass@cluster.example.mongodb.net/",
        FRONTEND_URL="https://swappy.vercel.app",
        BACKEND_URL="https://swappy-api.onrender.com",
        S3_BUCKET="swappy-staging-uploads",
    )
    with pytest.raises(RuntimeError, match="JWT_SECRET"):
        settings.validate_for_runtime()


def test_staging_rejects_mock_storage_flag(monkeypatch):
    monkeypatch.delenv("RENDER_EXTERNAL_URL", raising=False)
    settings = Settings(
        APP_ENV="staging",
        APP_DEBUG=False,
        ALLOW_MOCK_STORAGE=True,
        JWT_SECRET="a" * 32,
        DATABASE_URL="mongodb+srv://user:pass@cluster.example.mongodb.net/",
        FRONTEND_URL="https://swappy.vercel.app",
        BACKEND_URL="https://swappy-api.onrender.com",
        S3_BUCKET="swappy-staging-uploads",
    )
    assert settings.allow_mock_storage is False
    with pytest.raises(RuntimeError, match="ALLOW_MOCK_STORAGE"):
        settings.validate_for_runtime()


def test_production_rejects_localhost_frontend():
    settings = Settings(
        APP_ENV="production",
        APP_DEBUG=False,
        ALLOW_MOCK_STORAGE=False,
        JWT_SECRET="a" * 32,
        DATABASE_URL="mongodb+srv://user:pass@cluster.example.mongodb.net/",
        FRONTEND_URL="http://localhost:3000",
        BACKEND_URL="https://api.example.com",
        S3_BUCKET="swappy-prod-uploads",
    )
    with pytest.raises(RuntimeError, match="FRONTEND_URL"):
        settings.validate_for_runtime()


def test_production_accepts_hardened_config(monkeypatch):
    monkeypatch.delenv("RENDER_EXTERNAL_URL", raising=False)
    settings = Settings(
        APP_ENV="production",
        APP_DEBUG=False,
        ALLOW_MOCK_STORAGE=False,
        JWT_SECRET="a" * 32,
        DATABASE_URL="mongodb+srv://user:pass@cluster.example.mongodb.net/",
        FRONTEND_URL="https://app.example.com",
        BACKEND_URL="https://api.example.com",
        S3_BUCKET="swappy-prod-uploads",
        S3_ACCESS_KEY="",
        S3_SECRET_KEY="",
        S3_ENDPOINT="",
    )
    settings.validate_for_runtime()
    assert settings.is_production
    assert settings.uses_iam_role_for_s3 is True
