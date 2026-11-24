# AI Coding Workshop — starter

A ready-to-run full-stack base for building an app together with an AI coding assistant. Everything
is wired up and checks pass; the page shows a single title. Your job in the workshop is the actual
feature.

| Part | What it is |
| --- | --- |
| `backend/` | Python 3.14 · FastAPI · Pydantic settings · `uv` |
| Database | PostgreSQL 18 · SQLAlchemy 2 · Alembic migrations |
| `frontend/` | React 19 · TypeScript (strict) · Vite · Tailwind CSS v4 |
| API types | Frontend types generated from the backend's OpenAPI description, typed client (`openapi-fetch`) |
| Quality | Ruff (lint + format) · mypy `--strict` · oxlint · Prettier · `tsc` |
| Tests | pytest (API, own test database) · Vitest + React Testing Library (components) · Playwright (browser) · coverage |
| Run | Docker Compose (hot reload) or plain `make dev-*` |
| AI | [`CLAUDE.md`](CLAUDE.md) (also `AGENTS.md`), Playwright MCP so the assistant can see the page, a format-on-edit hook, `/check`, a `reviewer` agent |

What each building block does, why it is here and how it helps the AI:
[docs/building-blocks.md](docs/building-blocks.md). Each tool catching a real mistake, with its
output and the fix: [docs/tool-examples.md](docs/tool-examples.md).

Workshop slides: [docs/slides/](docs/slides/) — [PDF](docs/slides/ai-coding-workshop.pdf),
[browser version](docs/slides/index.html) (open the file; arrow keys to move, F for full screen),
[speaker notes](docs/slides/speaker-notes.md).

## The app on this branch: "Rate this course"

| Page | Who | What it does |
| --- | --- | --- |
| `/admin` | The host | Sign in with `ADMIN_PASSWORD`, open feedback (a QR code appears), make a new QR code, close it, remove entries |
| `/wall` | The projector | Average, star bars, word cloud, entries that pop in, emoji reactions. Shows the QR code when this browser is signed in at `/admin` |
| `/join/…` | Participants | What the QR code opens: pick an optional name, tap Join |
| `/` | Participants | Rate the course: stars, a comment, a photo-booth picture with filters |

**Run it locally**: `make up`, then open <http://localhost:5173/admin> (password `admin` — the
built-in development password works only on localhost), click "Open feedback", and open
<http://localhost:5173/wall> in the same browser.

**A workshop from your laptop over Wi-Fi**: set `PUBLIC_URL` to your laptop's address
(e.g. `http://192.168.1.20:5173`) plus a real `SECRET_KEY` and `ADMIN_PASSWORD` in `.env`, then
`make restart`. Phones on the same Wi-Fi can scan the QR code.

**On the internet**: see [deploy/README.md](deploy/README.md) (Azure Container Apps).

## Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) — enough to run the stack
- For running without Docker and for the checks: [`uv`](https://docs.astral.sh/uv/getting-started/installation/)
  and [Node.js 24 LTS](https://nodejs.org/) (`.nvmrc`)
- `make` (preinstalled on macOS/Linux; on Windows use WSL)

## Quickstart

```bash
make setup     # creates .env, installs dependencies and Playwright's browser
# put your API keys in .env (see below)
make up        # starts Postgres + backend + frontend in Docker
```

- App: <http://localhost:5173>
- API docs (Swagger): <http://localhost:8000/docs>
- Health check: <http://localhost:8000/api/health> — shows whether the database is reachable and
  your LLM key is set
- Postgres: `localhost:5433`, user/password/database `app`

Edit a file and the browser (or API) reloads on its own. `make logs` follows the output, `make down`
stops it.

Without Docker, in two terminals: `make dev-backend` (starts Postgres in Docker) and
`make dev-frontend`.

## API keys (`.env`)

`.env` holds your secrets and is git-ignored. [`.env.example`](.env.example) lists every variable:

| Variable | For |
| --- | --- |
| `LLM_BASE_URL`, `LLM_API_KEY`, `LLM_CHAT_MODEL` | An OpenAI-compatible LLM (default: the workshop gateway) |
| `OPENAI_API_KEY`, `ANTHROPIC_API_KEY` | Optional, if you bring your own provider |
| `SECRET_KEY`, `ADMIN_PASSWORD` | Sign-in; empty means the development defaults, which work only on localhost |
| `PUBLIC_URL`, `COOKIE_SECURE` | The address the QR code points to, and HTTPS-only cookies when it is `https://` |

After changing `.env`, run `make restart` so the containers pick it up.

## Commands

Run `make` to see them all. The ones you need:

| Command | Does |
| --- | --- |
| `make up` / `make down` | Start / stop the stack |
| `make migration m="..."` / `make migrate` | Create a migration from changed models / apply it |
| `make api-types` | Regenerate the frontend's API types after a backend change |
| `make test` | Unit tests: backend (pytest) and frontend (Vitest) |
| `make e2e` | Browser tests (Playwright) |
| `make coverage` | Unit tests plus a report of the lines no test runs |
| `make format` | Auto-fix formatting and simple lint issues |
| `make check` | Everything CI checks — run it before you commit |

## Working with an AI assistant

Open the repo in Claude Code (or Cursor, Codex, … — they read `AGENTS.md`). Already set up:

- **It can see the app.** `.mcp.json` adds the [Playwright MCP server](https://github.com/microsoft/playwright-mcp):
  ask it to open <http://localhost:5173>, click around and take a screenshot.
- **Types catch its mistakes.** Change a backend response and `make check` regenerates the
  frontend types, so `tsc` flags every place that no longer fits.
- **Formatting is automatic.** A hook formats every file it edits.
- **`/check`** runs everything and fixes failures until green.
- **`reviewer` agent** — "use the reviewer agent on my changes" gets a cold review against
  `CLAUDE.md`.

## Layout

```text
backend/
  app/main.py        FastAPI app; routes live under /api
  app/config.py      settings, read from .env
  app/db.py          database engine, session dependency
  app/models.py      table models
  migrations/        Alembic migrations
  tests/             pytest; conftest.py gives each test a clean database
frontend/
  src/App.tsx        the page (App.test.tsx: its component test)
  src/api/           typed API client + generated types (schema.d.ts — do not edit)
  e2e/               Playwright browser tests
  vite.config.ts     dev server; proxies /api to the backend
docker-compose.yml   local stack
Makefile             every command
CLAUDE.md            instructions for the AI assistant
.claude/             Claude Code settings, hook, /check skill, reviewer agent
.mcp.json            Playwright MCP server
```
