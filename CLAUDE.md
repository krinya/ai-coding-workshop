# Working instructions for AI assistants

A full-stack starter for a workshop: a FastAPI backend and a React frontend, run with Docker
Compose. Keep it simple — participants should be able to read every line you add.

## Layout

- `backend/` — Python 3.14, FastAPI, managed with `uv`. Entry point `app/main.py`; settings in
  `app/config.py`. Every route is under `/api` (use the `api` router).
- `frontend/` — React 19 + TypeScript (strict) + Vite + Tailwind CSS v4. The page is
  `src/App.tsx`. Call the backend with relative URLs (`fetch('/api/...')`); Vite proxies them.
- `docker-compose.yml` — runs both with hot reload. `Makefile` — every command (`make help`).

## Commands

- Run: `make up` (Docker) or `make dev-backend` + `make dev-frontend`.
- Before saying a task is done: `make check` must pass (format, lint, types, tests, build). Fix
  what it reports; `make format` fixes most formatting and lint issues.
- Add a Python dependency: `cd backend && uv add <pkg>` (dev-only: `uv add --dev <pkg>`).
- Add a JS dependency: `cd frontend && npm install <pkg>` (dev-only: `-D`). Then `make up` to
  rebuild the containers.

## Rules

- **Types everywhere.** mypy runs `--strict` and TypeScript runs `strict`: annotate every Python
  function, type every React prop and API response. No `Any`, `# type: ignore`, `as any` or
  `@ts-ignore` to silence a checker — fix the type instead.
- **Request and response bodies are Pydantic models** in the backend, with a matching TypeScript
  type in the frontend.
- **Secrets live in `.env` only.** Never read, print or commit `.env`. A new setting gets a typed
  field in `backend/app/config.py` and a line in `.env.example`. Keys are `SecretStr`; call
  `.get_secret_value()` only where the key is used.
- **LLM calls and email go through the backend**, never from the browser — the keys must not reach
  the frontend.
- The LLM is OpenAI-compatible: use the `openai` SDK with `base_url=settings.llm_base_url`.
  Email uses Resend (`resend` package or its HTTP API).
- Add a test in `backend/tests/` for each new endpoint.
- Style with Tailwind utility classes; no extra CSS files unless needed.
- Prefer small steps: make one change, run `make check`, then continue.
