# Working instructions for AI assistants

A full-stack starter for a workshop: a FastAPI backend with PostgreSQL and a React frontend, run
with Docker Compose. Keep it simple — participants should be able to read every line you add.

## Layout

- `backend/` — Python 3.14, FastAPI, managed with `uv`. Entry point `app/main.py`; settings in
  `app/config.py`; database in `app/db.py`; table models in `app/models.py`; migrations in
  `migrations/` (Alembic). Every route is under `/api` (use the `api` router).
- `frontend/` — React 19 + TypeScript (strict) + Vite + Tailwind CSS v4. The page is
  `src/App.tsx`. Call the backend with the typed client in `src/api/client.ts`
  (`api.GET('/api/...')`); Vite proxies `/api` to the backend.
- `docker-compose.yml` — Postgres, backend and frontend with hot reload. `Makefile` — every
  command (`make help`).

## Commands

- Run: `make up` (Docker), then http://localhost:5173. Or `make dev-backend` + `make dev-frontend`.
- Before saying a task is done: `make check` must pass (format, lint, types, tests, build,
  browser tests). Fix what it reports; `make format` fixes most formatting and lint issues. The
  `/check` skill does this loop.
- After changing a model: `make migration m="what changed"`, read the generated file in
  `backend/migrations/versions/`, then `make migrate`.
- After changing an endpoint or its models: `make api-types` (`make check` does it too), then fix
  the frontend until `tsc` passes. Never edit `frontend/src/api/schema.d.ts` or
  `frontend/openapi.json` by hand.
- Add a Python dependency: `cd backend && uv add <pkg>` (dev-only: `uv add --dev <pkg>`).
- Add a JS dependency: `cd frontend && npm install --include=dev <pkg>` (dev-only: `-D`). Then
  `make up` to rebuild the containers.

## Rules

- **Types everywhere.** mypy runs `--strict` and TypeScript runs `strict`: annotate every Python
  function, type every React prop. No `Any`, `# type: ignore`, `as any` or `@ts-ignore` to
  silence a checker — fix the type instead.
- **Request and response bodies are Pydantic models**; the frontend gets their types from the
  generated schema, never from a hand-written copy.
- **Database access goes through `SessionDep`** in a route, and every schema change through a
  migration — never `Base.metadata.create_all`.
- **Secrets live in `.env` only.** Never read, print or commit `.env`. A new setting gets a typed
  field in `backend/app/config.py` and a line in `.env.example`. Keys are `SecretStr`; call
  `.get_secret_value()` only where the key is used.
- **LLM calls and email go through the backend**, never from the browser — the keys must not reach
  the frontend. The LLM is OpenAI-compatible: use the `openai` SDK with
  `base_url=settings.llm_base_url`. Email uses Resend (`resend` package or its HTTP API).
- **Tests** — write the test first when the behaviour is clear, then make it pass:
  - each endpoint: a pytest test in `backend/tests/`, using the `client` and `db` fixtures from
    `conftest.py` (a separate `app_test` database, rolled back after every test);
  - each component with logic: a Vitest test next to it (`Thing.test.tsx`), using React Testing
    Library — query by role or text, as a user would, not by CSS class;
  - each user-facing flow: a Playwright test in `frontend/e2e/`.
  `make test` runs the unit tests, `make e2e` the browser tests, `make coverage` shows untested
  lines.
- **Look at what you built.** After a UI change, open http://localhost:5173 with the Playwright
  MCP tools and check it in a screenshot before reporting it done.
- Style with Tailwind utility classes; no extra CSS files unless needed.
- Prefer small steps: make one change, run `make check`, then continue. When a feature is done,
  ask the `reviewer` agent to review it.
