from fastapi import Request

from apps.api.routers.auth import _get_frontend_base, _get_redirect_uri


def test_get_frontend_base_prefers_redirect_base_override():
    assert _get_frontend_base(redirect_base="https://swappy.example.com") == "https://swappy.example.com"


def test_get_frontend_base_uses_referer_origin_when_present():
    scope = {
        "type": "http",
        "method": "GET",
        "path": "/api/v1/auth/social/google/authorize",
        "headers": [
            (b"host", b"api.swappy.local:8000"),
            (b"referer", b"http://localhost:3000/auth/login"),
        ],
        "query_string": b"",
        "server": ("127.0.0.1", 8000),
    }
    request = Request(scope)
    assert _get_frontend_base(request=request) == "http://localhost:3000"


def test_get_frontend_base_uses_request_headers_when_no_override_is_present():
    scope = {
        "type": "http",
        "method": "GET",
        "path": "/api/v1/auth/social/google/authorize",
        "headers": [
            (b"host", b"swappy.internal:8000"),
            (b"x-forwarded-proto", b"https"),
            (b"x-forwarded-host", b"swappy.example.com"),
        ],
        "query_string": b"",
        "server": ("127.0.0.1", 8000),
    }
    request = Request(scope)
    assert _get_frontend_base(request=request) == "https://swappy.example.com"


def test_get_redirect_uri_uses_request_host_when_available():
    scope = {
        "type": "http",
        "method": "GET",
        "path": "/api/v1/auth/social/google/authorize",
        "headers": [
            (b"host", b"swappy.internal:8000"),
            (b"x-forwarded-proto", b"https"),
            (b"x-forwarded-host", b"swappy.example.com"),
        ],
        "query_string": b"",
        "server": ("127.0.0.1", 8000),
    }
    request = Request(scope)
    assert _get_redirect_uri("google", request=request) == "https://swappy.example.com/api/v1/auth/social/google/callback"
