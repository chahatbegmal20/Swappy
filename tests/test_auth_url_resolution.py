from fastapi import Request

from apps.api.core.config import settings
from apps.api.routers.auth import _get_frontend_base, _get_redirect_uri


def test_get_frontend_base_prefers_redirect_base_override():
    assert _get_frontend_base(redirect_base="https://swappy.example.com") == "https://swappy.example.com"


def test_get_frontend_base_uses_configured_frontend_url_not_api_host():
    """OAuth must bounce users to the Next.js app, never the API host."""
    scope = {
        "type": "http",
        "method": "GET",
        "path": "/api/v1/auth/social/google/authorize",
        "headers": [
            (b"host", b"swappy.internal:8000"),
            (b"x-forwarded-proto", b"https"),
            (b"x-forwarded-host", b"api.swappy.example.com"),
        ],
        "query_string": b"",
        "server": ("127.0.0.1", 8000),
    }
    request = Request(scope)
    assert _get_frontend_base(request=request) == settings.FRONTEND_URL.rstrip("/")


def test_get_redirect_uri_uses_canonical_backend_url_not_forwarded_host():
    """OAuth redirect_uri must ignore Host / X-Forwarded-* and use BACKEND_URL."""
    scope = {
        "type": "http",
        "method": "GET",
        "path": "/api/v1/auth/social/google/authorize",
        "headers": [
            (b"host", b"swappy.internal:8000"),
            (b"x-forwarded-proto", b"https"),
            (b"x-forwarded-host", b"evil.example.com"),
        ],
        "query_string": b"",
        "server": ("127.0.0.1", 8000),
    }
    request = Request(scope)
    expected = (
        f"{settings.BACKEND_URL.rstrip('/')}"
        "/api/v1/auth/social/google/callback"
    )
    assert _get_redirect_uri("google", request=request) == expected
