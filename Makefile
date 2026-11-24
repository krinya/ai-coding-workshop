# Run `make` or `make help` to list the targets.
.DEFAULT_GOAL := help
.PHONY: help setup up down logs restart dev-backend dev-frontend \
        lint format typecheck test check clean

BACKEND  := cd backend &&
FRONTEND := cd frontend &&

help: ## List the targets
	@grep -E '^[a-zA-Z_-]+:.*?## ' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-14s\033[0m %s\n", $$1, $$2}'

setup: ## First-time setup: .env, Python and Node dependencies
	@test -f .env || (cp .env.example .env && echo "Created .env from .env.example — add your keys")
	$(BACKEND) uv sync
	$(FRONTEND) npm install --include=dev

# ── Run ──────────────────────────────────────────────────────────────────────
up: ## Start the stack in Docker (http://localhost:5173)
	docker compose up --build -d
	@echo "Frontend: http://localhost:5173   API docs: http://localhost:8000/docs"

down: ## Stop the stack
	docker compose down

logs: ## Follow the logs of the stack
	docker compose logs -f

restart: down up ## Restart the stack

dev-backend: ## Run the backend without Docker (reloads on save)
	$(BACKEND) uv run fastapi dev app/main.py --port 8000

dev-frontend: ## Run the frontend without Docker (reloads on save)
	$(FRONTEND) npm run dev

# ── Quality ──────────────────────────────────────────────────────────────────
lint: ## Lint both apps
	$(BACKEND) uv run ruff check .
	$(FRONTEND) npm run lint

format: ## Auto-format both apps
	$(BACKEND) uv run ruff check --fix . && uv run ruff format .
	$(FRONTEND) npm run format

typecheck: ## Type-check both apps
	$(BACKEND) uv run mypy
	$(FRONTEND) npm run typecheck

test: ## Run the tests
	$(BACKEND) uv run pytest

check: ## Everything CI runs: format check, lint, types, tests, build
	$(BACKEND) uv run ruff format --check .
	$(FRONTEND) npm run format:check
	$(MAKE) lint typecheck test
	$(FRONTEND) npm run build

clean: ## Stop the stack and delete its containers and volumes
	docker compose down -v --remove-orphans
