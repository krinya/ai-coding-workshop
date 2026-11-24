"""The host's controls: open and close the QR code, and remove entries from the wall."""

from fastapi.testclient import TestClient

from app.config import settings
from tests.conftest import Be, sign_in_as_admin


def test_only_the_admin_may_use_the_controls(client: TestClient, be: Be) -> None:
    assert client.get("/api/admin/join-link").status_code == 401
    be("Ada")
    assert client.get("/api/admin/join-link").status_code == 403
    assert client.post("/api/admin/join-link").status_code == 403
    assert client.delete("/api/admin/join-link").status_code == 403


def test_open_feedback_puts_a_qr_code_on_the_wall(client: TestClient) -> None:
    sign_in_as_admin(client)
    assert client.get("/api/admin/join-link").json() == {"join_url": None, "joined": 0}

    status = client.post("/api/admin/join-link").json()

    assert status["join_url"].startswith(f"{settings.public_url}/join/")
    assert client.get("/api/wall").json()["join_url"] == status["join_url"]


def test_a_new_link_replaces_the_old_one(client: TestClient) -> None:
    sign_in_as_admin(client)
    old_token = client.post("/api/admin/join-link").json()["join_url"].rsplit("/", 1)[1]
    new_token = client.post("/api/admin/join-link").json()["join_url"].rsplit("/", 1)[1]
    assert new_token != old_token

    client.cookies.clear()
    assert client.post("/api/auth/join", json={"token": old_token}).status_code == 404
    assert client.post("/api/auth/join", json={"token": new_token}).status_code == 200


def test_the_admin_sees_how_many_joined(client: TestClient) -> None:
    sign_in_as_admin(client)
    token = client.post("/api/admin/join-link").json()["join_url"].rsplit("/", 1)[1]
    for _ in range(3):
        client.cookies.clear()
        client.post("/api/auth/join", json={"token": token})
    sign_in_as_admin(client)
    assert client.get("/api/admin/join-link").json()["joined"] == 3


def test_closing_stops_new_joins_but_people_can_still_edit(client: TestClient, be: Be) -> None:
    be("Ada")
    client.post("/api/feedback", json={"rating": 4})
    entry_id = client.get("/api/feedback/mine").json()["id"]

    sign_in_as_admin(client)
    status = client.delete("/api/admin/join-link")

    assert status.json()["join_url"] is None
    assert client.get("/api/wall").json()["join_url"] is None
    client.cookies.clear()
    assert client.post("/api/auth/join", json={"token": "test-join-token"}).status_code == 404
    be("Ada")
    assert client.put(f"/api/feedback/{entry_id}", json={"rating": 5}).status_code == 200


def test_the_admin_can_remove_any_entry(client: TestClient, be: Be) -> None:
    be("Ada")
    client.post("/api/feedback", json={"rating": 1, "comment": "rude words"})
    entry_id = client.get("/api/feedback/mine").json()["id"]
    be("Bob")
    assert client.delete(f"/api/admin/feedback/{entry_id}").status_code == 403

    sign_in_as_admin(client)
    assert client.delete(f"/api/admin/feedback/{entry_id}").status_code == 204
    assert client.get("/api/wall").json()["entries"] == []
    assert client.delete(f"/api/admin/feedback/{entry_id}").status_code == 404
