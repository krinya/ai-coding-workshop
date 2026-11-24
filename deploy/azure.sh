#!/usr/bin/env bash
# Deploy the app to Azure Container Apps (run from the repo root, after `az login`).
#
#   First run:  creates the Container Apps environment and the app, with generated secrets.
#   Later runs: builds a new image from the current commit and rolls it out.
#
# The resource group, container registry and Postgres server must exist already; see
# deploy/README.md. Secrets are kept only as Container App secrets, never printed.
set -euo pipefail

RG=${RG:-rg-rate-this-course}
LOCATION=${LOCATION:-westeurope}
APP=${APP:-rate-this-course}
ENV_NAME=${ENV_NAME:-rate-this-course-env}
ACR=${ACR:?Set ACR to the container registry name}
DB=${DB:?Set DB to the Postgres server name}
DB_USER=${DB_USER:-rtcadmin}

TAG=$(git rev-parse --short HEAD)
IMAGE="$ACR.azurecr.io/$APP:$TAG"

echo "Building $IMAGE in Azure (the cloud builds it for the right CPU)..."
az acr build -r "$ACR" -t "$APP:$TAG" . -o none --only-show-errors

if az containerapp show -g "$RG" -n "$APP" -o none 2>/dev/null; then
  echo "Rolling out the new image..."
  az containerapp update -g "$RG" -n "$APP" --image "$IMAGE" -o none --only-show-errors
else
  : "${DB_PASSWORD:?Set DB_PASSWORD to the Postgres admin password}"
  echo "Creating the Container Apps environment..."
  az containerapp env create -g "$RG" -n "$ENV_NAME" -l "$LOCATION" -o none --only-show-errors
  DOMAIN=$(az containerapp env show -g "$RG" -n "$ENV_NAME" --query properties.defaultDomain -o tsv)
  URL="https://$APP.$DOMAIN"
  random() { python3 -c "import secrets; print(secrets.token_urlsafe(32))"; }

  echo "Creating the app at $URL ..."
  az containerapp create -g "$RG" -n "$APP" --environment "$ENV_NAME" \
    --image "$IMAGE" --registry-server "$ACR.azurecr.io" --registry-identity system \
    --ingress external --target-port 8000 \
    --min-replicas 0 --max-replicas 1 --cpu 0.5 --memory 1Gi \
    --secrets \
      "database-url=postgresql+psycopg://$DB_USER:$DB_PASSWORD@$DB.postgres.database.azure.com:5432/app?sslmode=require&connect_timeout=10" \
      "secret-key=$(random)" \
      "admin-password=$(random)" \
    --env-vars \
      ENVIRONMENT=production COOKIE_SECURE=true PUBLIC_URL="$URL" \
      DATABASE_URL=secretref:database-url SECRET_KEY=secretref:secret-key \
      ADMIN_PASSWORD=secretref:admin-password \
    -o none --only-show-errors
fi

URL="https://$(az containerapp show -g "$RG" -n "$APP" --query properties.configuration.ingress.fqdn -o tsv)"
echo "Live at $URL  (host controls: $URL/admin)"
echo "Admin password: az containerapp secret show -g $RG -n $APP --secret-name admin-password --query value -o tsv"
