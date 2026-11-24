from fastapi.testclient import TestClient
from sqlalchemy import text
from sqlalchemy.orm import Session


def test_health(client: TestClient) -> None:
    response = client.get("/api/health")
    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "ok"
    assert body["database"] is True, "Postgres is not reachable — run `make db`"


def test_tests_use_their_own_database(db: Session) -> None:
    assert db.execute(text("SELECT current_database()")).scalar() == "app_test"
