"""Settings, read from environment variables and the repo-root `.env` file.

Add a setting here (with a type and a default) and a matching line in `.env.example`.
Read it anywhere with `from app.config import settings`.
"""

from functools import lru_cache
from pathlib import Path

from pydantic import SecretStr
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

    # Email — sent through Resend (https://resend.com) when RESEND_API_KEY is set, otherwise
    # over SMTP to Mailpit, which catches every email locally (inbox: http://localhost:8025)
    resend_api_key: SecretStr | None = None
    email_from: str = "Workshop <onboarding@resend.dev>"
    smtp_host: str = "localhost"
    smtp_port: int = 1025

    # Sign-in. The secret key makes the stored login-code hashes useless without it.
    secret_key: SecretStr = SecretStr("dev-only-secret-change-me")
    # Send the session cookie only over HTTPS. Turn on when the site is served over HTTPS.
    cookie_secure: bool = False


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
