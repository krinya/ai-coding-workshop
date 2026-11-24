# The stack, piece by piece

What each part of this repository is, and why it is here.

## How a request flows

```text
browser ──► Vite dev server (:5173) ──/api/*──► FastAPI (:8000) ──► LLM / email / ...
            serves the React app                reads keys from .env
```

The browser only ever talks to the frontend. Anything starting with `/api` is forwarded to the
backend (`frontend/vite.config.ts`), so there are no CORS problems and API keys stay on the server.

## Backend

| Tool | What it does |
| --- | --- |
| [FastAPI](https://fastapi.tiangolo.com/) | Python web framework. Type hints define request/response shapes and generate the interactive docs at `/docs`. |
| [Pydantic](https://docs.pydantic.dev/) / pydantic-settings | Validates data. `app/config.py` turns `.env` into a typed `settings` object. |
| [uv](https://docs.astral.sh/uv/) | Installs Python and dependencies; `uv.lock` pins exact versions. `uv run <cmd>` runs inside the project's environment. |
| [Ruff](https://docs.astral.sh/ruff/) | Linter and formatter (replaces flake8, isort, black). |
| [mypy](https://mypy.readthedocs.io/) | Static type checker, in strict mode. |
| [pytest](https://docs.pytest.org/) | Tests, in `backend/tests/`. |

## Frontend

| Tool | What it does |
| --- | --- |
| [React](https://react.dev/) | UI library: the page is built from components (`src/App.tsx`). |
| [TypeScript](https://www.typescriptlang.org/) | JavaScript with types; `tsc` checks them in strict mode. |
| [Vite](https://vite.dev/) | Dev server with instant reload, and the production build (`npm run build`). |
| [Tailwind CSS](https://tailwindcss.com/) | Styling with utility classes (`className="text-4xl font-semibold"`). |
| [oxlint](https://oxc.rs/docs/guide/usage/linter) | Fast linter for JS/TS and React rules. |
| [Prettier](https://prettier.io/) | Formatter; also sorts Tailwind classes. |

## Around them

| File | What it does |
| --- | --- |
| `docker-compose.yml` | Starts backend and frontend in containers with the source mounted, so saves reload. |
| `Makefile` | One short command per task; `make help` lists them. |
| `.env` / `.env.example` | Secrets and settings. `.env` is private and git-ignored; the example is the template. |
| `.github/workflows/ci.yml` | Runs `make check` on every push and pull request. |
| `CLAUDE.md` / `AGENTS.md` | Instructions an AI assistant reads before working here. |
| `.claude/settings.json` | Stops Claude Code from reading or writing `.env`. |
| `.vscode/` | Recommended extensions; format on save. |
| `.editorconfig` | Consistent indentation and line endings in any editor. |
