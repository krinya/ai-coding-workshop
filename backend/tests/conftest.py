"""Shared test fixtures.

Tests use their own database (`app_test` next to `app`), created and migrated on the first run,
so they never touch your data. Each test runs inside a transaction that is rolled back
afterwards: every test starts from an empty database.

Use them by naming them as arguments:

    def test_something(client: TestClient, db: Session) -> None:
        db.add(Note(text="hi")); db.flush()
        assert client.get("/api/notes").json() == [...]
"""

import re
from collections.abc import Iterator
from pathlib import Path

import pytest
from alembic import command
from alembic.config import Config
from fastapi.testclient import TestClient
from sqlalchemy import Engine, create_engine, text
from sqlalchemy.engine import URL, make_url
from sqlalchemy.orm import Session

from app.config import settings
from app.db import get_session
from app.mailer import Email, EmailNotSentError, get_email_sender
from app.main import app

BACKEND_DIR = Path(__file__).resolve().parents[1]


def _test_database_url() -> URL:
    url = make_url(settings.database_url)
    return url.set(database=f"{url.database}_test")


def _create_database_if_missing(url: URL) -> None:
    admin = create_engine(url.set(database="postgres"), isolation_level="AUTOCOMMIT")
    with admin.connect() as connection:
        exists = connection.execute(
            text("SELECT 1 FROM pg_database WHERE datname = :name"), {"name": url.database}
        ).scalar()
        if not exists:
            connection.execute(text(f'CREATE DATABASE "{url.database}"'))
    admin.dispose()


@pytest.fixture(scope="session")
def engine() -> Iterator[Engine]:
    url = _test_database_url()
    _create_database_if_missing(url)

    config = Config(BACKEND_DIR / "alembic.ini")
    config.set_main_option("sqlalchemy.url", url.render_as_string(hide_password=False))
    command.upgrade(config, "head")

    test_engine = create_engine(url)
    yield test_engine
    test_engine.dispose()


@pytest.fixture
def db(engine: Engine) -> Iterator[Session]:
    """A database session whose changes are rolled back after the test."""
    with engine.connect() as connection:
        transaction = connection.begin()
        session = Session(bind=connection, join_transaction_mode="create_savepoint")
        yield session
        session.close()
        transaction.rollback()


class FakeEmailSender:
    """Keeps emails in a list instead of sending them, so tests never send real email."""

    def __init__(self) -> None:
        self.sent: list[Email] = []
        self.broken = False  # set to True to act like a mail server that is down

    def send(self, email: Email) -> None:
        if self.broken:
            raise EmailNotSentError
        self.sent.append(email)

    def last_code(self) -> str:
        match = re.search(r"\b\d{6}\b", self.sent[-1].text)
        assert match, "the last email has no 6-digit code"
        return match.group()


@pytest.fixture
def outbox() -> FakeEmailSender:
    return FakeEmailSender()


@pytest.fixture
def client(db: Session, outbox: FakeEmailSender) -> Iterator[TestClient]:
    """An HTTP client for the app whose routes use the test session and the fake email sender."""
    app.dependency_overrides[get_session] = lambda: db
    app.dependency_overrides[get_email_sender] = lambda: outbox
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


def sign_in(
    client: TestClient, outbox: FakeEmailSender, email: str, name: str | None = None
) -> None:
    """Sign in through the real endpoints (the client keeps the session cookie)."""
    client.post("/api/auth/sign-out")
    client.post("/api/auth/request-code", json={"email": email})
    code = outbox.last_code()
    body = {"email": email, "code": code, "display_name": name}
    assert client.post("/api/auth/verify-code", json=body).status_code == 200
