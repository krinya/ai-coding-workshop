"""Write the API description (OpenAPI) to frontend/openapi.json, from which the frontend's
TypeScript types are generated. Run through `make api-types`."""

import json

from app.config import REPO_ROOT
from app.main import app

OUTPUT = REPO_ROOT / "frontend" / "openapi.json"

OUTPUT.write_text(json.dumps(app.openapi(), indent=2) + "\n")
