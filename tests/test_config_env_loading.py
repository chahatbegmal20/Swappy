import importlib
import sys
from pathlib import Path


def test_settings_loads_env_when_started_from_api_dir(monkeypatch):
    """Settings should pick up GOOGLE_* from the environment even if cwd is apps/api."""
    repo_root = Path(__file__).resolve().parents[1]
    api_dir = repo_root / "apps" / "api"

    monkeypatch.chdir(api_dir)
    monkeypatch.setenv("GOOGLE_CLIENT_ID", "test-client-id")
    monkeypatch.setenv("GOOGLE_CLIENT_SECRET", "test-client-secret")
    sys.modules.pop("apps.api.core.config", None)

    import apps.api.core.config as config

    reloaded = importlib.reload(config)

    assert reloaded.settings.GOOGLE_CLIENT_ID == "test-client-id"
    assert reloaded.settings.GOOGLE_CLIENT_SECRET == "test-client-secret"


def test_oauth_providers_are_built_from_current_settings(monkeypatch):
    from apps.api.routers import auth

    monkeypatch.setattr(auth.settings, "GOOGLE_CLIENT_ID", "client-id")
    monkeypatch.setattr(auth.settings, "GOOGLE_CLIENT_SECRET", "client-secret")

    providers = auth._get_oauth_providers()

    assert providers["google"]["client_id"] == "client-id"
    assert providers["google"]["client_secret"] == "client-secret"
