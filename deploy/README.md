# Deploying to Azure

The app runs on Azure as **one container** (the root `Dockerfile`: the API plus the built
frontend) on [Azure Container Apps](https://learn.microsoft.com/azure/container-apps/), with an
Azure Database for PostgreSQL server. Everything lives in one resource group, so it is easy to
remove.

| Resource | Why | Rough cost |
| --- | --- | --- |
| Container App (0.5 CPU, scales to zero) | Runs the app, gives it an HTTPS address | Almost free when idle |
| PostgreSQL Flexible Server, Burstable B1ms | The database | ~$13/month (stop it between workshops) |
| Container Registry, Basic | Stores the built images | ~$5/month |

## First time

```bash
az login
RG=rg-rate-this-course LOCATION=westeurope
ACR=ratethiscourse$RANDOM DB=rate-this-course-db-$RANDOM   # globally unique names
DB_PASSWORD=$(python3 -c "import secrets; print(secrets.token_urlsafe(24))")

DB_LOCATION=northeurope   # see "Location is restricted" below
az group create -n $RG -l $LOCATION
az acr create -g $RG -n $ACR --sku Basic
az postgres flexible-server create -g $RG -n $DB -l $DB_LOCATION \
  --tier Burstable --sku-name Standard_B1ms --storage-size 32 --version 17 \
  --admin-user rtcadmin --admin-password "$DB_PASSWORD" \
  --public-access 0.0.0.0 --yes   # 0.0.0.0 = only Azure services can connect
az postgres flexible-server db create -g $RG --server-name $DB --name app

RG=$RG ACR=$ACR DB=$DB DB_PASSWORD=$DB_PASSWORD ./deploy/azure.sh
```

The script prints the address and how to read the generated admin password.

**"The location is restricted from performing this operation"** when creating the database:
some subscriptions (e.g. Visual Studio ones) may not create PostgreSQL servers in busy regions.
Pick another nearby region for the database (`northeurope`, `swedencentral`,
`germanywestcentral`); the app can stay where it is.

## Updating

Commit, then run `RG=... ACR=... DB=... ./deploy/azure.sh` again: it builds the current commit
and rolls it out. Database migrations run when the new version starts.

## Before and after a workshop

```bash
# Keep one copy running, so the first visitor does not wait for a cold start
az containerapp update -g $RG -n rate-this-course --min-replicas 1
# Afterwards: back to zero, and pause the database
az containerapp update -g $RG -n rate-this-course --min-replicas 0
az postgres flexible-server stop -g $RG -n $DB
```

Remove everything: `az group delete -n $RG`.
