# AI Coding Workshop — starter

A ready-to-run full-stack base for building an app together with an AI coding assistant. Everything
is wired up and checks pass; the page shows a single title. Your job in the workshop is the actual
feature.

| Part | What it is |
| --- | --- |
| `backend/` | Python 3.14 · FastAPI · Pydantic settings · `uv` |
| `frontend/` | React 19 · TypeScript (strict) · Vite · Tailwind CSS v4 |
| Quality | Ruff (lint + format) · mypy `--strict` · oxlint · Prettier · `tsc` · pytest |
| Run | Docker Compose (hot reload) or plain `make dev-*` |
| AI | [`CLAUDE.md`](CLAUDE.md) (also `AGENTS.md`) tells the assistant how this repo works |

What each tool does and why it is here: [docs/stack.md](docs/stack.md).

## Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) — enough to run the stack
- For running without Docker and for the checks: [`uv`](https://docs.astral.sh/uv/getting-started/installation/)
  and [Node.js 24+](https://nodejs.org/)
- `make` (preinstalled on macOS/Linux; on Windows use WSL)

## Quickstart

```bash
make setup     # creates .env from .env.example and installs dependencies
# put your API keys in .env (see below)
make up        # starts backend + frontend in Docker
```

- App: <http://localhost:5173>
- API docs (Swagger): <http://localhost:8000/docs>
- Health check: <http://localhost:8000/api/health> — also shows whether your LLM and email keys are set

Edit a file and the browser (or API) reloads on its own. `make logs` follows the output, `make down`
stops it.

Without Docker, in two terminals: `make dev-backend` and `make dev-frontend`.

## API keys (`.env`)

`.env` holds your secrets and is git-ignored. [`.env.example`](.env.example) lists every variable:

| Variable | For |
| --- | --- |
| `LLM_BASE_URL`, `LLM_API_KEY`, `LLM_CHAT_MODEL` | An OpenAI-compatible LLM (default: the workshop gateway) |
| `OPENAI_API_KEY`, `ANTHROPIC_API_KEY` | Optional, if you bring your own provider |
| `RESEND_API_KEY`, `EMAIL_FROM` | Sending email via [Resend](https://resend.com) |

After changing `.env`, run `make restart` so the containers pick it up.

## Commands

Run `make` to see them all. The ones you need:

| Command | Does |
| --- | --- |
| `make up` / `make down` | Start / stop the stack |
| `make format` | Auto-fix formatting and simple lint issues |
| `make check` | Everything CI checks — run it before you commit |

## Layout

```text
backend/
  app/main.py        FastAPI app; routes live under /api
  app/config.py      settings, read from .env
  tests/             pytest
frontend/
  src/App.tsx        the page
  vite.config.ts     dev server; proxies /api to the backend
docker-compose.yml   local stack
Makefile             every command
CLAUDE.md            instructions for the AI assistant
```
