"""FastAPI entry point. Every route lives under /api so the frontend proxy can forward it."""

from fastapi import APIRouter, FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.routing import APIRoute
from pydantic import BaseModel

from app import auth, feedback
from app.config import settings
from app.db import database_is_up


def operation_id(route: APIRoute) -> str:
    """Name each operation after its function, which keeps the generated frontend types readable."""
    return route.name


app = FastAPI(title=settings.app_name, generate_unique_id_function=operation_id)

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
    database: bool
    # Which integrations have a key in .env — never the key itself
    llm_configured: bool
    email_configured: bool


@api.get("/health")
def health() -> Health:
    return Health(
        status="ok",
        environment=settings.environment,
        database=database_is_up(),
        llm_configured=settings.llm_api_key is not None,
        email_configured=settings.resend_api_key is not None,
    )


api.include_router(auth.router)
api.include_router(feedback.router)
app.include_router(api)
