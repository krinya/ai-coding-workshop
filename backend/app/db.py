"""Database engine, the model base class, and the per-request session dependency.

Use it in a route:

    from app.db import SessionDep

    @api.get("/things")
    def list_things(db: SessionDep) -> list[ThingOut]:
        ...
"""

from collections.abc import Iterator
from typing import Annotated

from fastapi import Depends
from sqlalchemy import create_engine, text
from sqlalchemy.orm import DeclarativeBase, Session

from app.config import settings

engine = create_engine(settings.database_url, pool_pre_ping=True)


class Base(DeclarativeBase):
    """Every table model inherits from this. Put models in app/models.py."""


def get_session() -> Iterator[Session]:
    with Session(engine) as session:
        yield session


SessionDep = Annotated[Session, Depends(get_session)]


def database_is_up() -> bool:
    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))
    except Exception:
        return False
    return True
