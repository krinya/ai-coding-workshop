"""Joining by scanning the QR code, and the host's admin sign-in. No email involved."""

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app import auth
from app.config import settings
from app.models import JoinLink, User


def join(client: TestClient, token: str, name: str | None = None) -> int:
    return client.post("/api/auth/join", json={"token": token, "display_name": name}).status_code


def test_scanning_the_qr_code_creates_an_account_and_signs_in(
    client: TestClient, open_link: JoinLink
) -> None:
    assert client.get("/api/auth/me").status_code == 401

    response = client.post("/api/auth/join", json={"token": open_link.token, "display_name": "Ada"})

    assert response.status_code == 200
    cookie = response.headers["set-cookie"].lower()
    assert "httponly" in cookie
    assert "samesite=lax" in cookie
    me = client.get("/api/auth/me").json()
    assert me["display_name"] == "Ada"
    assert me["is_admin"] is False


def test_the_name_is_optional_and_trimmed(client: TestClient, open_link: JoinLink) -> None:
    assert join(client, open_link.token, "   ") == 200
    assert client.get("/api/auth/me").json()["display_name"] is None
    client.post("/api/auth/sign-out")
    assert join(client, open_link.token, "  Grace  ") == 200
    assert client.get("/api/auth/me").json()["display_name"] == "Grace"
    client.post("/api/auth/sign-out")
    assert join(client, open_link.token, "x" * 51) == 422


def test_an_unknown_link_does_not_work(client: TestClient, open_link: JoinLink) -> None:
    assert join(client, "not-the-token") == 404
    assert client.get("/api/auth/me").status_code == 401


def test_a_strange_token_is_simply_not_found(client: TestClient, open_link: JoinLink) -> None:
    assert join(client, "é🙂") == 404


def test_a_closed_link_does_not_work(client: TestClient, db: Session, open_link: JoinLink) -> None:
    open_link.closed_at = auth.now()
    db.flush()
    assert join(client, open_link.token) == 404


def test_scanning_again_keeps_the_same_account(
    client: TestClient, db: Session, open_link: JoinLink
) -> None:
    join(client, open_link.token, "Ada")
    first = client.get("/api/auth/me").json()

    assert join(client, open_link.token, "Someone else") == 200

    assert client.get("/api/auth/me").json() == first
    assert db.scalar(select(func.count()).select_from(User)) == 1


def test_a_link_lets_only_so_many_people_join(
    client: TestClient, open_link: JoinLink, monkeypatch: pytest.MonkeyPatch
) -> None:
    monkeypatch.setattr(auth, "MAX_JOINS_PER_LINK", 2)
    for _ in range(2):
        client.cookies.clear()
        assert join(client, open_link.token) == 200
    client.cookies.clear()
    assert join(client, open_link.token) == 429


def test_sign_out_ends_the_session(client: TestClient, open_link: JoinLink) -> None:
    join(client, open_link.token, "Ada")
    old_cookie = client.cookies["session"]

    assert client.post("/api/auth/sign-out").status_code == 200

    assert client.get("/api/auth/me").status_code == 401
    # The old cookie is dead on the server too, not just deleted in the browser
    client.cookies.set("session", old_cookie)
    assert client.get("/api/auth/me").status_code == 401


def test_admin_signs_in_with_the_password(client: TestClient) -> None:
    password = settings.admin_password.get_secret_value()
    response = client.post("/api/auth/admin", json={"password": password})
    assert response.status_code == 200
    assert client.get("/api/auth/me").json()["is_admin"] is True


def test_a_wrong_admin_password_is_rejected(client: TestClient) -> None:
    assert client.post("/api/auth/admin", json={"password": "guess"}).status_code == 401
    assert client.get("/api/auth/me").status_code == 401


def test_admin_sign_in_twice_is_the_same_admin(client: TestClient, db: Session) -> None:
    password = settings.admin_password.get_secret_value()
    client.post("/api/auth/admin", json={"password": password})
    client.post("/api/auth/admin", json={"password": password})
    assert db.scalar(select(func.count()).select_from(User).where(User.is_admin)) == 1


def test_admin_sessions_are_short(client: TestClient) -> None:
    password = settings.admin_password.get_secret_value()
    response = client.post("/api/auth/admin", json={"password": password})
    assert "max-age=43200" in response.headers["set-cookie"].lower()  # 12 hours


def test_guessing_the_admin_password_gets_blocked(client: TestClient) -> None:
    for _ in range(10):
        assert client.post("/api/auth/admin", json={"password": "guess"}).status_code == 401
    password = settings.admin_password.get_secret_value()
    # Blocked for a while, even with the right password
    assert client.post("/api/auth/admin", json={"password": password}).status_code == 429
