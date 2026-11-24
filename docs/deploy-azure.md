# Deploying an app built on this starter to Azure

How to put your workshop app on the internet, so people can open it on their phones instead of
`localhost`. This was done once for real with the "Rate this course" app; its working version is on
the branch `feature/rate-this-course` (`Dockerfile`, `.dockerignore`, `backend/app/frontend.py`,
`deploy/azure.sh`, `deploy/README.md`). Expect about an hour the first time.

## The idea: one container

Locally, Docker Compose runs three containers: Postgres, the backend, and Vite's dev server.
Vite's dev server is not meant for the internet, so in the cloud:

- the frontend is **built once** into static files (`npm run build`), and
- **FastAPI serves those files** next to `/api`, so the whole app is **one container on one
  address**: no CORS, and the session cookie just works.

| Azure resource | What for | Rough cost |
| --- | --- | --- |
| Container Apps (0.5 CPU, scales to zero) | Runs the container, gives an HTTPS address | ~free when idle |
| Azure Database for PostgreSQL, Flexible Server, Burstable B1ms | The database | ~$13/month |
| Container Registry, Basic | Stores the built image | ~$5/month |

Put everything in **one resource group**, so `az group delete` removes it all afterwards.

## 1. Add a cloud Dockerfile (repo root)

```dockerfile
# Stage 1: build the frontend into static files
FROM node:24-alpine AS frontend
WORKDIR /frontend
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci --include=dev
COPY frontend/ ./
RUN npm run build

# Stage 2: the backend, which also serves those files
FROM python:3.14-slim
COPY --from=ghcr.io/astral-sh/uv:latest /uv /usr/local/bin/uv
ENV UV_PROJECT_ENVIRONMENT=/opt/venv UV_COMPILE_BYTECODE=1 UV_LINK_MODE=copy \
    PATH="/opt/venv/bin:$PATH" PYTHONUNBUFFERED=1 STATIC_DIR=/app/static
WORKDIR /app
COPY backend/pyproject.toml backend/uv.lock ./
RUN uv sync --frozen --no-install-project --no-dev
COPY backend/ ./
COPY --from=frontend /frontend/dist ./static
EXPOSE 8000
# Migrations on start; --proxy-headers because Azure's HTTPS proxy sits in front
CMD ["sh", "-c", "alembic upgrade head && fastapi run app/main.py --host 0.0.0.0 --port 8000 --proxy-headers --forwarded-allow-ips='*'"]
```

And a `.dockerignore` that keeps **`.env`** (your secrets!), `node_modules`, `.venv`, `.git` and
caches out of the image.

## 2. Let FastAPI serve the built frontend

Add a `static_dir: Path | None = None` setting in `backend/app/config.py`, and register this
**after** `app.include_router(api)` in `main.py`, only when `settings.static_dir` is set (locally
it is not, and Vite keeps serving the frontend):

```python
def serve_frontend(app: FastAPI, directory: Path) -> None:
    root = directory.resolve()

    @app.get("/{path:path}", include_in_schema=False)
    def frontend(path: str) -> FileResponse:
        if path.startswith("api/"):
            raise HTTPException(status.HTTP_404_NOT_FOUND)  # unknown API paths stay 404
        file = (root / path).resolve()
        if file.is_file() and file.is_relative_to(root):  # never serve files outside the folder
            return FileResponse(file)
        return FileResponse(root / "index.html")  # every page address gets the React app
```

Test it like any endpoint (a temporary folder with an `index.html`, plus a `../secret.txt` that
must not be served).

## 3. Settings for the internet

- `ENVIRONMENT=production`, `COOKIE_SECURE=true` (the site is HTTPS),
  `PUBLIC_URL=https://<your app address>`.
- Real secrets (`SECRET_KEY`, passwords): generate them
  (`python3 -c "import secrets; print(secrets.token_urlsafe(32))"`) and give them to the app as
  **Container App secrets**, never as plain environment variables or files in the image.
- Make the app **refuse to start** with the built-in development secrets anywhere except
  development on localhost (a Pydantic `model_validator` on `Settings`). Then forgetting a setting
  cannot quietly put the app online with a known password.
- Database URL: `postgresql+psycopg://USER:PASSWORD@SERVER.postgres.database.azure.com:5432/app?sslmode=require&connect_timeout=10`.
  `connect_timeout` makes a wrong address fail in 10 seconds with a clear error instead of
  hanging silently.

## 4. Create the resources and deploy

```bash
az login
RG=rg-my-app LOCATION=westeurope DB_LOCATION=northeurope   # see "Pitfalls" for DB_LOCATION
ACR=myapp$RANDOM DB=myapp-db-$RANDOM APP=my-app ENV_NAME=my-app-env
DB_PASSWORD=$(python3 -c "import secrets; print(secrets.token_urlsafe(24))")

az group create -n $RG -l $LOCATION
az acr create -g $RG -n $ACR --sku Basic
az postgres flexible-server create -g $RG -n $DB -l $DB_LOCATION \
  --tier Burstable --sku-name Standard_B1ms --storage-size 32 --version 17 \
  --admin-user appadmin --admin-password "$DB_PASSWORD" \
  --public-access 0.0.0.0 --yes          # 0.0.0.0 = only Azure services may connect
az postgres flexible-server db create -g $RG --server-name $DB --name app

# Build the image in Azure (also avoids Mac ARM vs Azure Intel image problems)
TAG=$(git rev-parse --short HEAD)
az acr build -r $ACR -t ${APP}:${TAG} .

az containerapp env create -g $RG -n $ENV_NAME -l $LOCATION
URL="https://${APP}.$(az containerapp env show -g $RG -n $ENV_NAME --query properties.defaultDomain -o tsv)"
az containerapp create -g $RG -n $APP --environment $ENV_NAME \
  --image ${ACR}.azurecr.io/${APP}:${TAG} --registry-server ${ACR}.azurecr.io --registry-identity system \
  --ingress external --target-port 8000 --min-replicas 0 --max-replicas 1 --cpu 0.5 --memory 1Gi \
  --secrets "database-url=postgresql+psycopg://appadmin:${DB_PASSWORD}@${DB}.postgres.database.azure.com:5432/app?sslmode=require&connect_timeout=10" \
            "secret-key=$(python3 -c 'import secrets; print(secrets.token_urlsafe(32))')" \
  --env-vars ENVIRONMENT=production COOKIE_SECURE=true PUBLIC_URL=$URL \
             DATABASE_URL=secretref:database-url SECRET_KEY=secretref:secret-key
echo $URL
```

Update later: build a new tag with `az acr build`, then
`az containerapp update -g $RG -n $APP --image ${ACR}.azurecr.io/${APP}:${TAG}`.

**Check it works:** `curl $URL/api/health` should show `"database": true`. Then run your
Playwright flow against `$URL` (pass secrets via environment variables, not in the test file).

## Pitfalls we actually hit

- **"The location is restricted from performing this operation"** when creating PostgreSQL:
  Visual Studio subscriptions may not create database servers in busy regions such as West
  Europe. Put the database in a nearby region (`northeurope`, `swedencentral`,
  `germanywestcentral`); the app can stay in West Europe.
- **`--database-name` on `flexible-server create`** only works for clusters in current CLI
  versions. Create the database separately with `db create --server-name … --name app`.
- **Check every step's real exit code.** Piping an `az` command into `grep` or `tail` hides its
  failure (`set -o pipefail`), and you only find out later when the app cannot reach a database
  that was never created.
- **zsh and `$NAME:tag`**: in zsh, `$APP:c…` applies a history modifier and silently changes the
  image name. Write `${APP}:${TAG}`.
- **First start of a new app**: `--registry-identity system` gives the app permission to pull the
  image, which can take a minute to apply. If the first revision fails to pull, start a new
  revision (`az containerapp update … --revision-suffix v2`).
- **Finding out why it does not start**:
  `az containerapp logs show -g $RG -n $APP --type system` (image pulls, probes) and
  `--type console` (your app's output). Logs of a revision that already stopped are in the Log
  Analytics workspace of the environment (`ContainerAppConsoleLogs_CL`).
- **Cold start**: with `--min-replicas 0` the first visitor after a quiet period waits 10–20
  seconds. During a workshop, `az containerapp update -g $RG -n $APP --min-replicas 1`.

## Clean up

```bash
az postgres flexible-server stop -g $RG -n $DB   # pause the database between events
az group delete -n $RG                           # remove everything when you are done
```
