"""In the cloud, the backend also serves the built frontend, so the whole app is one container
on one address. Locally this is off: Vite serves the frontend (see docker-compose.yml)."""

from pathlib import Path

from fastapi import FastAPI, HTTPException, status
from fastapi.responses import FileResponse


def serve_frontend(app: FastAPI, directory: Path) -> None:
    """Serve the files of `npm run build`. Every other page address gets index.html, and the
    React app picks the page (/wall, /admin, /join/...) from the address."""
    root = directory.resolve()

    @app.get("/{path:path}", include_in_schema=False)
    def frontend(path: str) -> FileResponse:
        if path.startswith("api/"):
            raise HTTPException(status.HTTP_404_NOT_FOUND)
        file = (root / path).resolve()
        if file.is_file() and file.is_relative_to(root):  # never serve files outside the folder
            return FileResponse(file)
        return FileResponse(root / "index.html")
