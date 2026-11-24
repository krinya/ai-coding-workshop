"""In the cloud the backend also serves the built frontend (see app/frontend.py)."""

from pathlib import Path

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient

from app.frontend import serve_frontend


@pytest.fixture
def site(tmp_path: Path) -> TestClient:
    built = tmp_path / "static"
    (built / "assets").mkdir(parents=True)
    (built / "index.html").write_text("<html>the app</html>")
    (built / "favicon.svg").write_text("<svg/>")
    (built / "assets" / "app.js").write_text("console.log(1)")
    (tmp_path / "secret.txt").write_text("do not serve me")
    app = FastAPI()
    serve_frontend(app, built)
    return TestClient(app)


def test_every_page_gets_the_app(site: TestClient) -> None:
    for path in ["/", "/wall", "/admin", "/join/abc123"]:
        response = site.get(path)
        assert response.status_code == 200
        assert response.text == "<html>the app</html>"


def test_files_are_served(site: TestClient) -> None:
    assert site.get("/favicon.svg").text == "<svg/>"
    assert site.get("/assets/app.js").text == "console.log(1)"


def test_files_outside_the_folder_are_not_served(site: TestClient) -> None:
    assert "do not serve me" not in site.get("/../secret.txt").text
    assert "do not serve me" not in site.get("/%2e%2e/secret.txt").text


def test_unknown_api_paths_are_404_not_the_app(site: TestClient) -> None:
    assert site.get("/api/does-not-exist").status_code == 404
