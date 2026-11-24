# Run `make` or `make help` to list the targets.
.DEFAULT_GOAL := help
.PHONY: help setup up down logs restart db dev-backend dev-frontend migrate migration \
        api-types lint format typecheck test coverage e2e check clean

BACKEND  := cd backend &&
FRONTEND := cd frontend &&

help: ## List the targets
	@grep -E '^[a-zA-Z_-]+:.*?## ' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-14s\033[0m %s\n", $$1, $$2}'

setup: ## First-time setup: .env, dependencies, Playwright's browser
	@test -f .env || (cp .env.example .env && echo "Created .env from .env.example — add your keys")
	$(BACKEND) uv sync
	$(FRONTEND) npm install --include=dev
	$(FRONTEND) npx playwright install chromium

# ── Run ──────────────────────────────────────────────────────────────────────
up: ## Start the whole stack in Docker (http://localhost:5173); fresh node_modules from the image
	docker compose up --build --renew-anon-volumes -d --wait
	@echo "Frontend: http://localhost:5173   API docs: http://localhost:8000/docs"

down: ## Stop the stack (the database keeps its data)
	docker compose down

logs: ## Follow the logs of the stack
	docker compose logs -f

restart: down up ## Restart the stack, e.g. after editing .env

db: ## Start only Postgres (for running the apps or tests outside Docker)
ifndef SKIP_COMPOSE_DB
	docker compose up -d --wait db
endif

dev-backend: db ## Run the backend without Docker (reloads on save)
	$(BACKEND) uv run alembic upgrade head
	$(BACKEND) uv run fastapi dev app/main.py --port 8000

dev-frontend: ## Run the frontend without Docker (reloads on save)
	$(FRONTEND) npm run dev

# ── Database ─────────────────────────────────────────────────────────────────
migrate: db ## Apply pending database migrations
	$(BACKEND) uv run alembic upgrade head

migration: db ## Create a migration from changed models: make migration m="add notes table"
	@test -n "$(m)" || (echo 'Usage: make migration m="describe the change"' && exit 1)
	$(BACKEND) uv run alembic upgrade head
	$(BACKEND) uv run alembic revision --autogenerate -m "$(m)"
	$(BACKEND) uv run ruff format migrations

# ── Quality ──────────────────────────────────────────────────────────────────
api-types: ## Regenerate the frontend's API types from the backend
	$(BACKEND) uv run python -m scripts.export_openapi
	$(FRONTEND) npm run api-types

lint: ## Lint both apps
	$(BACKEND) uv run ruff check .
	$(FRONTEND) npm run lint

format: ## Auto-format both apps
	$(BACKEND) uv run ruff check --fix . && uv run ruff format .
	$(FRONTEND) npm run format

typecheck: api-types ## Type-check both apps (regenerates the API types first)
	$(BACKEND) uv run mypy
	$(FRONTEND) npm run typecheck

test: db ## Unit tests: backend (pytest, own test database) and frontend (Vitest)
	$(BACKEND) uv run pytest
	$(FRONTEND) npm test

coverage: db ## Unit tests with a coverage report: which lines no test runs
	$(BACKEND) uv run pytest --cov=app --cov-report=term-missing
	$(FRONTEND) npm run coverage

e2e: migrate ## Run the browser tests (uses the running stack, or starts the apps)
	$(FRONTEND) npm run e2e

check: ## Everything CI runs: format, lint, types, unit tests, build, browser tests
	$(BACKEND) uv run ruff format --check .
	$(FRONTEND) npm run format:check
	$(MAKE) lint typecheck test
	$(FRONTEND) npm run build
	$(MAKE) e2e

clean: ## Stop the stack and delete its containers and the database volume
	docker compose down -v --remove-orphans
