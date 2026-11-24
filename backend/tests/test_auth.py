"""Sign-in with an emailed 6-digit code. The `outbox` fixture catches the emails."""

from datetime import timedelta

from fastapi.testclient import TestClient
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.auth import now
from app.models import LoginCode
from tests.conftest import FakeEmailSender

EMAIL = "ada@example.com"


def request_code(client: TestClient, email: str = EMAIL) -> int:
    return client.post("/api/auth/request-code", json={"email": email}).status_code


def verify(
    client: TestClient, code: str, email: str = EMAIL, display_name: str | None = None
) -> int:
    body = {"email": email, "code": code, "display_name": display_name}
    return client.post("/api/auth/verify-code", json=body).status_code


def test_request_code_emails_a_six_digit_code(client: TestClient, outbox: FakeEmailSender) -> None:
    assert request_code(client) == 200
    assert len(outbox.sent) == 1
    assert outbox.sent[0].to == EMAIL
    assert len(outbox.last_code()) == 6


def test_code_is_stored_hashed(client: TestClient, outbox: FakeEmailSender, db: Session) -> None:
    request_code(client)
    stored = db.scalars(select(LoginCode)).one()
    assert outbox.last_code() not in stored.code_hash


def test_response_does_not_reveal_whether_an_account_exists(
    client: TestClient, outbox: FakeEmailSender
) -> None:
    request_code(client)
    verify(client, outbox.last_code())  # ada now has an account
    client.post("/api/auth/sign-out")

    existing = client.post("/api/auth/request-code", json={"email": EMAIL})
    new = client.post("/api/auth/request-code", json={"email": "new@example.com"})
    assert existing.status_code == new.status_code == 200
    assert existing.json() == new.json()


def test_right_code_signs_in_and_creates_the_account(
    client: TestClient, outbox: FakeEmailSender
) -> None:
    assert client.get("/api/auth/me").status_code == 401
    request_code(client)

    response = client.post(
        "/api/auth/verify-code",
        json={"email": EMAIL, "code": outbox.last_code(), "display_name": "Ada"},
    )

    assert response.status_code == 200
    cookie = response.headers["set-cookie"].lower()
    assert "httponly" in cookie
    assert "samesite=lax" in cookie
    me = client.get("/api/auth/me").json()
    assert me["email"] == EMAIL
    assert me["display_name"] == "Ada"


def test_email_is_case_insensitive(client: TestClient, outbox: FakeEmailSender) -> None:
    request_code(client, "Ada@Example.COM")
    assert verify(client, outbox.last_code(), email="ada@example.com") == 200


def test_display_name_is_only_set_on_first_sign_in(
    client: TestClient, outbox: FakeEmailSender
) -> None:
    request_code(client)
    verify(client, outbox.last_code(), display_name="Ada")
    client.post("/api/auth/sign-out")

    request_code(client)
    verify(client, outbox.last_code(), display_name="Someone else")
    assert client.get("/api/auth/me").json()["display_name"] == "Ada"


def test_wrong_code_is_rejected(client: TestClient, outbox: FakeEmailSender) -> None:
    request_code(client)
    wrong = "000000" if outbox.last_code() != "000000" else "111111"
    assert verify(client, wrong) == 400
    assert client.get("/api/auth/me").status_code == 401


def test_code_works_only_once(client: TestClient, outbox: FakeEmailSender) -> None:
    request_code(client)
    code = outbox.last_code()
    assert verify(client, code) == 200
    client.post("/api/auth/sign-out")
    assert verify(client, code) == 400


def test_expired_code_is_rejected(client: TestClient, outbox: FakeEmailSender, db: Session) -> None:
    request_code(client)
    stored = db.scalars(select(LoginCode)).one()
    stored.expires_at = now() - timedelta(seconds=1)
    db.flush()

    assert verify(client, outbox.last_code()) == 400


def test_code_expires_after_ten_minutes(
    client: TestClient, outbox: FakeEmailSender, db: Session
) -> None:
    request_code(client)
    stored = db.scalars(select(LoginCode)).one()
    assert timedelta(minutes=9) < stored.expires_at - now() <= timedelta(minutes=10)


def test_five_wrong_tries_block_the_code(client: TestClient, outbox: FakeEmailSender) -> None:
    request_code(client)
    code = outbox.last_code()
    wrong = "000000" if code != "000000" else "111111"
    for _ in range(5):
        assert verify(client, wrong) == 400

    assert verify(client, code) == 400  # even the right code no longer works


def test_at_most_three_code_emails_per_fifteen_minutes(
    client: TestClient, outbox: FakeEmailSender
) -> None:
    for _ in range(3):
        assert request_code(client) == 200
    assert request_code(client) == 429
    assert len(outbox.sent) == 3
    assert request_code(client, "other@example.com") == 200  # the limit is per address


def test_sign_out_ends_the_session(client: TestClient, outbox: FakeEmailSender) -> None:
    request_code(client)
    verify(client, outbox.last_code())
    old_cookie = client.cookies.get("session")
    assert old_cookie
    assert client.get("/api/auth/me").status_code == 200

    assert client.post("/api/auth/sign-out").status_code == 200

    assert client.get("/api/auth/me").status_code == 401
    # The old cookie is dead on the server too, not just deleted in the browser
    client.cookies.set("session", old_cookie)
    assert client.get("/api/auth/me").status_code == 401


def test_invalid_email_is_rejected(client: TestClient) -> None:
    assert request_code(client, "not-an-email") == 422
