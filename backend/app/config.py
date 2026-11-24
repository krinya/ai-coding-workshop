"""Settings, read from environment variables and the repo-root `.env` file.

Add a setting here (with a type and a default) and a matching line in `.env.example`.
Read it anywhere with `from app.config import settings`.
"""

from functools import lru_cache
from pathlib import Path
from typing import Self

from pydantic import SecretStr, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

REPO_ROOT = Path(__file__).resolve().parents[2]


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=REPO_ROOT / ".env",
        env_file_encoding="utf-8",
        extra="ignore",
        env_ignore_empty=True,
    )

    app_name: str = "AI Coding Workshop"
    environment: str = "development"
    cors_origins: list[str] = ["http://localhost:5173"]

    # PostgreSQL. This is the address from your machine; docker compose overrides it with the
    # in-network address for the backend container.
    database_url: str = "postgresql+psycopg://app:app@localhost:5433/app"

    # LLM — any OpenAI-compatible endpoint (the lab gateway, OpenAI, ...)
    llm_base_url: str = "https://llm.twinhub.nl/v1"
    llm_api_key: SecretStr | None = None
    llm_chat_model: str = "qwen3.8-nothink"
    llm_timeout_seconds: float = 120

    # Optional hosted providers
    openai_api_key: SecretStr | None = None
    anthropic_api_key: SecretStr | None = None

    # Sign-in. The secret key makes stored session hashes useless without it.
    secret_key: SecretStr = SecretStr("dev-only-secret-change-me")
    # The host signs in at /admin with this password to open and close the QR code.
    admin_password: SecretStr = SecretStr("admin")
    # Send the session cookie only over HTTPS. Turn on when the site is served over HTTPS.
    cookie_secure: bool = False

    # The address people open on their phones; the wall's QR code links here. For a workshop,
    # use your laptop's address on the Wi-Fi, e.g. http://192.168.1.20:5173
    public_url: str = "http://localhost:5173"

    @model_validator(mode="after")
    def real_secrets_outside_development(self) -> Self:
        if self.environment == "development":
            return self
        defaults = type(self).model_fields
        if self.secret_key == defaults["secret_key"].default:
            raise ValueError("Set SECRET_KEY: the built-in one is only for development.")
        password = self.admin_password.get_secret_value()
        if self.admin_password == defaults["admin_password"].default or len(password) < 16:
            raise ValueError("Set ADMIN_PASSWORD to a long random string (16+ characters).")
        return self


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
