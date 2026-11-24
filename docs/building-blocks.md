# Building blocks: what each piece is, and how it helps the AI

An AI coding assistant writes code fast, but it makes the mistakes any fast writer makes: a typo
in a field name, a forgotten case, a button that renders off-screen. This starter is built so
those mistakes are **caught by a tool within seconds**, and so the assistant can **read the
error and fix it itself**. Each building block below has two jobs: its normal job in the app,
and a job in that feedback loop.

```text
            you describe a feature
                     │
                     ▼
   ┌──────── AI writes / edits code ◄────────────┐
   │                 │                           │
   │     format hook tidies each file            │ reads the error
   │                 ▼                           │ and fixes it
   │   make check:  format · lint · types ·      │
   │                tests · build · browser ─────┘ (fails)
   │                 │ (passes)
   │                 ▼
   │   AI opens the page in a browser (Playwright MCP) and looks at it
   │                 ▼
   └── reviewer agent reads the change cold ──► you review and commit
```

The rule of thumb: **the more of your intent a tool can check, the less you have to check by
reading code.** Types, tests and linters are your intent written in a form a machine can verify.

## How a request flows

```text
browser ──► Vite dev server (:5173) ──/api/*──► FastAPI (:8000) ──► PostgreSQL (:5433)
            serves the React app                reads keys from .env ──► LLM / email
```

The browser only ever talks to the frontend; anything under `/api` is forwarded to the backend
(`frontend/vite.config.ts`). So there are no CORS problems, and API keys never leave the server.

## The app

### FastAPI — the backend · `backend/app/main.py`

**Role:** the Python web server. It receives requests under `/api`, runs the logic, talks to the
database and to outside services (LLM, email).
**Why:** small, popular and modern. You describe an endpoint with ordinary Python type hints, and
FastAPI validates input against them and documents itself at <http://localhost:8000/docs>.
**How it helps the AI:** FastAPI is extremely common in training data, so the assistant writes it
idiomatically. Because endpoints are declared with types, the API's exact shape is
machine-readable — which the generated frontend types (below) rely on.

### Pydantic and pydantic-settings — data shapes · `backend/app/config.py`

**Role:** every request body, response body and setting is a Pydantic model with typed fields.
`config.py` turns `.env` into a typed `settings` object.
**Why:** bad data is rejected at the edge with a clear message instead of failing deep inside.
**How it helps the AI:** one obvious place for each shape. A missing or misspelled setting fails
at startup with its name, not later as a mysterious `None`.

### PostgreSQL, SQLAlchemy, Alembic — the database · `backend/app/db.py`, `models.py`, `migrations/`

**Role:** Postgres stores the data and runs in Docker. SQLAlchemy lets the code describe tables
as Python classes (`models.py`) and query them. Alembic keeps versioned **migrations**: small
scripts that change the schema step by step.
**Why:** real apps remember things. Postgres is the industry default; migrations mean everyone's
database — yours, a teammate's, CI's — ends up with the same schema.
**How it helps the AI:** the assistant changes a model, then `make migration` *writes the
migration for it* by comparing the models with the database. The schema change becomes a file
you can read before it runs, instead of something that happened silently.

### React, Vite, Tailwind — the frontend · `frontend/src/App.tsx`

**Role:** React builds the page from components. Vite serves it with instant reload and builds
it for production. Tailwind styles it with utility classes written directly on elements
(`className="text-4xl font-semibold"`).
**Why:** the most common way to build a web UI today, with a fast feedback loop.
**How it helps the AI:** all three are heavily represented in training data. Tailwind keeps
markup and styling in one file, so the assistant edits one place instead of hunting through
stylesheets — and its UIs look consistent.

### Typed API client — the contract · `frontend/src/api/`

**Role:** FastAPI publishes an exact description of its API (OpenAPI). `make api-types` turns it
into TypeScript types (`schema.d.ts`), and `client.ts` is a `fetch` that uses them:
`api.GET('/api/health')` knows the response has `status`, `database`, ….
**Why:** the backend and frontend can no longer silently disagree about a field name.
**How it helps the AI:** this is the strongest guardrail in the repo. When the assistant renames
a field in the backend, `make check` regenerates the types and `tsc` points at every frontend line
that still uses the old name. A bug that would otherwise show up as a blank screen in the
browser becomes a precise compiler error the assistant fixes on its own. CI also fails if the
generated files were not committed.

## The checks

### Type checkers — mypy (strict) and `tsc` (strict)

**Role:** read the code without running it and prove the types fit: no passing a string where a
number belongs, no forgetting a value can be missing.
**Why:** a whole class of bugs disappears before anything runs.
**How it helps the AI:** types are intent the computer can verify. Strict mode means the
assistant cannot quietly write untyped code, and `CLAUDE.md` forbids silencing the checker
(`Any`, `# type: ignore`, `as any`), so it must fix the real problem.

### Linters and formatters — Ruff, oxlint, Prettier

**Role:** linters (Ruff for Python, oxlint for TypeScript) flag suspicious code: unused
variables, risky patterns, broken React hook rules. Formatters (Ruff, Prettier) fix the layout.
**Why:** consistent, readable code, with no arguments about style.
**How it helps the AI:** formatting is never a reason a check fails — the hook formats every
file the assistant touches — so the errors it sees are real problems. Linters catch the small
slips fast code generation produces.

### Tests — pytest, Vitest, Playwright · `backend/tests/`, `src/*.test.tsx`, `frontend/e2e/`

**Role:** three layers, from fast and narrow to slow and broad:

| Layer | Tool | Tests | Runs in |
| --- | --- | --- | --- |
| API | [pytest](https://docs.pytest.org/) | an endpoint: send a request, check the answer and the database | milliseconds, against a separate `app_test` database |
| Component | [Vitest](https://vitest.dev/) + [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/) | one React component: render it, click it, check what it shows | milliseconds, in a simulated browser (jsdom) |
| End to end | [Playwright](https://playwright.dev/) | the whole app in a real browser, as a user would use it | seconds, against the running stack |

`backend/tests/conftest.py` gives every backend test a `client` and a `db` session. The test
database is created and migrated on first use, and each test is rolled back afterwards, so tests
never see each other's data — nor yours. `make coverage` lists the lines no test runs.
**Why:** types prove the pieces fit; tests prove they do the right thing. Most tests should be
the fast kind; a few browser tests cover the main flows end to end.
**How it helps the AI:** a test is a precise, runnable description of "done". Ask the assistant
to write the test first and it has a target it can check itself against — and the test stays,
so a later change that breaks the feature fails loudly. Browser tests catch what no type checker
can: the page does not load, the button does nothing. Coverage shows where its tests are thin.

### `make check` and CI · `Makefile`, `.github/workflows/ci.yml`

**Role:** one command runs everything above in order: format, lint, types, unit tests, build,
browser tests. CI runs the same command on GitHub on every push.
**Why:** one definition of "working", the same on every laptop and on the server.
**How it helps the AI:** the assistant does not need to know which tool to run; it runs one
command and reads the first error. `CLAUDE.md` makes a passing `make check` the condition for
calling a task done.

## Running it

### Docker and Docker Compose · `docker-compose.yml`, `*/Dockerfile`

**Role:** each part runs in a container with the right Python, Node and Postgres versions. One
command starts the database, backend and frontend together; the source folders are mounted, so
saving a file reloads the app.
**Why:** "works on my machine" becomes "works on every machine". Nobody installs Postgres.
**How it helps the AI:** the whole stack is described in one file it can read. It can restart a
service or read its logs (`make logs`) to diagnose a problem itself.

### Make · `Makefile`

**Role:** short names for every task: `make up`, `make check`, `make migration m="..."`.
`make help` lists them.
**Why:** nobody memorises long commands, and they stay the same for everyone.
**How it helps the AI:** a short menu of known-good commands. The assistant runs `make test`
instead of guessing flags, and you can read exactly what it ran.

### `.env` and `.env.example` — settings and secrets

**Role:** `.env` holds your API keys and settings; it is git-ignored and stays on your machine.
`.env.example` is the committed template listing every variable.
**Why:** secrets never end up in git, and everyone knows which keys exist.
**How it helps the AI:** Claude Code is blocked from reading or writing `.env`
(`.claude/settings.json`), so your keys never enter the conversation. The assistant learns what
is available from `.env.example` and `config.py` instead.

## Working with the AI

### `CLAUDE.md` (and `AGENTS.md`)

**Role:** the instructions the assistant reads before every task: the layout, the commands, and
the rules of this repo. `AGENTS.md` is the same file under the name Cursor, Codex and others
look for.
**Why:** without it the assistant guesses your conventions; with it, it follows them.
**How it helps the AI:** this is the onboarding document you would give a new colleague. When
the assistant does something you do not want, add a line here instead of correcting it again
next time.

### Playwright MCP server · `.mcp.json`

**Role:** gives the assistant a browser it controls: it can open <http://localhost:5173>, click,
type, and take screenshots.
**Why:** code that compiles is not the same as a page that looks right.
**How it helps the AI:** it can **see what it built**. After a UI change it checks the result in
a screenshot and fixes the layout itself, instead of you describing what is wrong.

### Format hook · `.claude/hooks/format.mjs`

**Role:** after every file the assistant edits, it runs Ruff or Prettier on that file.
**Why:** formatting is handled automatically, every time, without anyone asking.
**How it helps the AI:** a **hook** is a rule the tool enforces, not a request the model may
forget. Use hooks for anything that must always happen.

### `/check` skill · `.claude/skills/check/SKILL.md`

**Role:** a slash command: run `make check`, fix the first failure, repeat until everything is
green, then report.
**Why:** one word starts the whole verify-and-fix loop.
**How it helps the AI:** a **skill** is a reusable procedure written down once. It shows how you
can teach the assistant your own workflow.

### `reviewer` agent · `.claude/agents/reviewer.md`

**Role:** a separate assistant that reviews the current changes against `CLAUDE.md` and reports
bugs, security problems and rule breaks, ranked by severity. It cannot edit files.
**Why:** the assistant that wrote the code is anchored on its own reasoning; a fresh reviewer
that sees only the diff spots what it missed.
**How it helps the AI:** a **subagent** with its own instructions and limited tools. Ask "use the
reviewer agent on my changes" before committing.

### Editor setup · `.vscode/`, `.editorconfig`

**Role:** recommended extensions (Ruff, Prettier, Tailwind, Docker, …), format on save, and
consistent indentation and line endings in any editor.
**Why:** what you see in the editor matches what the checks enforce.

## Where to go next

- [tool-examples.md](tool-examples.md) — each tool catching a real mistake: the code, the exact
  output, and the fix.
- The tools' own docs: [FastAPI](https://fastapi.tiangolo.com/) ·
  [SQLAlchemy](https://docs.sqlalchemy.org/en/20/) · [Alembic](https://alembic.sqlalchemy.org/) ·
  [React](https://react.dev/) · [Vite](https://vite.dev/) · [Tailwind](https://tailwindcss.com/) ·
  [openapi-fetch](https://openapi-ts.dev/openapi-fetch/) · [Playwright](https://playwright.dev/) ·
  [uv](https://docs.astral.sh/uv/) · [Ruff](https://docs.astral.sh/ruff/)
- Claude Code: [memory and CLAUDE.md](https://docs.claude.com/en/docs/claude-code/memory) ·
  [hooks](https://docs.claude.com/en/docs/claude-code/hooks) ·
  [skills](https://docs.claude.com/en/docs/claude-code/skills) ·
  [subagents](https://docs.claude.com/en/docs/claude-code/sub-agents) ·
  [MCP](https://docs.claude.com/en/docs/claude-code/mcp)
