"""FastAPI entry point. Every route lives under /api so the frontend proxy can forward it."""

from fastapi import APIRouter, FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from app.config import settings

app = FastAPI(title=settings.app_name)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

api = APIRouter(prefix="/api")


class Health(BaseModel):
    status: str
    environment: str
    # Which integrations have a key in .env — never the key itself
    llm_configured: bool
    email_configured: bool


@api.get("/health")
def health() -> Health:
    return Health(
        status="ok",
        environment=settings.environment,
        llm_configured=settings.llm_api_key is not None,
        email_configured=settings.resend_api_key is not None,
    )


app.include_router(api)
