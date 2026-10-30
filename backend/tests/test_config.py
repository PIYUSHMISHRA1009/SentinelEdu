import pytest
from pydantic import ValidationError

from app.core.config import DEVELOPMENT_SECRET_KEY, Settings


def test_settings_reads_secret_key_from_environment(monkeypatch):
    monkeypatch.setenv("SECRET_KEY", "configured-test-secret")

    settings = Settings(_env_file=None)

    assert settings.SECRET_KEY == "configured-test-secret"


def test_settings_uses_fixed_development_secret_when_unset(monkeypatch):
    monkeypatch.delenv("SECRET_KEY", raising=False)

    settings = Settings(_env_file=None, ENVIRONMENT="development")

    assert settings.SECRET_KEY == DEVELOPMENT_SECRET_KEY


def test_settings_rejects_empty_secret_in_production(monkeypatch):
    monkeypatch.delenv("SECRET_KEY", raising=False)

    with pytest.raises(ValidationError, match="SECRET_KEY must be set"):
        Settings(_env_file=None, ENVIRONMENT="production")
