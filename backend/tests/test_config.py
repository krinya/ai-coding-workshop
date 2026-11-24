"""The built-in secrets are only for trying the app on your own computer."""

import pytest
from pydantic import SecretStr, ValidationError

from app.config import Settings

KEY = SecretStr("a-real-secret-key-0123456789")
PASSWORD = SecretStr("a-long-admin-password")
ONLINE = "https://rate.example.com"


def test_development_on_localhost_needs_no_secrets() -> None:
    Settings(environment="development", public_url="http://localhost:5173")


def test_in_production_the_built_in_secrets_are_refused() -> None:
    with pytest.raises(ValidationError, match="SECRET_KEY"):
        Settings(environment="production")
    with pytest.raises(ValidationError, match="ADMIN_PASSWORD"):
        Settings(environment="production", secret_key=KEY)


def test_forgetting_environment_online_is_still_refused() -> None:
    with pytest.raises(ValidationError, match="SECRET_KEY"):
        Settings(environment="development", public_url=ONLINE)


def test_on_the_wifi_secrets_are_needed_but_http_is_fine() -> None:
    """A workshop on your laptop: phones reach http://<laptop>:5173, no HTTPS there."""
    wifi = "http://192.168.1.20:5173"
    with pytest.raises(ValidationError, match="SECRET_KEY"):
        Settings(public_url=wifi)
    Settings(public_url=wifi, secret_key=KEY, admin_password=PASSWORD, cookie_secure=False)


def test_a_short_admin_password_is_refused() -> None:
    with pytest.raises(ValidationError, match="ADMIN_PASSWORD"):
        Settings(environment="production", secret_key=KEY, admin_password=SecretStr("short"))


def test_on_https_the_cookie_must_be_https_only() -> None:
    with pytest.raises(ValidationError, match="COOKIE_SECURE"):
        Settings(public_url=ONLINE, secret_key=KEY, admin_password=PASSWORD, cookie_secure=False)


def test_with_real_secrets_it_starts() -> None:
    Settings(
        environment="production",
        public_url=ONLINE,
        secret_key=KEY,
        admin_password=PASSWORD,
        cookie_secure=True,
    )
