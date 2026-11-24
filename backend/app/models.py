"""Table models. Each one inherits from `Base`; after adding or changing one, run
`make migration m="describe the change"` and then `make migrate`.
"""

from datetime import datetime

from sqlalchemy import CheckConstraint, DateTime, ForeignKey, LargeBinary, String, func
from sqlalchemy.orm import Mapped, column_property, mapped_column, relationship

from app.db import Base


class User(Base):
    """Created on the first successful sign-in — that is the registration."""

    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)
    email: Mapped[str] = mapped_column(String(320), unique=True)
    display_name: Mapped[str | None] = mapped_column(String(50))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class LoginCode(Base):
    """A 6-digit code emailed to an address. Only a hash of the code is stored."""

    __tablename__ = "login_codes"

    id: Mapped[int] = mapped_column(primary_key=True)
    email: Mapped[str] = mapped_column(String(320), index=True)
    code_hash: Mapped[str] = mapped_column(String(64))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    wrong_tries: Mapped[int] = mapped_column(default=0)
    used: Mapped[bool] = mapped_column(default=False)


class UserSession(Base):
    """A signed-in browser. The cookie holds a random token; only its hash is stored here."""

    __tablename__ = "sessions"

    id: Mapped[int] = mapped_column(primary_key=True)
    token_hash: Mapped[str] = mapped_column(String(64), unique=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"))
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))


class Feedback(Base):
    """One entry per user: a 1-5 star rating, a comment and an optional photo."""

    __tablename__ = "feedback"
    __table_args__ = (CheckConstraint("rating BETWEEN 1 AND 5", name="rating_1_to_5"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), unique=True)
    rating: Mapped[int]
    comment: Mapped[str] = mapped_column(String(500), default="")
    # A JPEG of at most 640px, only stored with consent. `deferred`: loaded only when read,
    # so listing entries does not pull every photo out of the database.
    photo: Mapped[bytes | None] = mapped_column(LargeBinary, deferred=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    user: Mapped[User] = relationship()
    # True when there is a photo — computed by the database, without loading the photo
    has_photo: Mapped[bool] = column_property(photo.is_not(None))
