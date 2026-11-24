"""Joining by scanning the QR code, and the host's admin sign-in. No passwords for participants,
no email: the QR code on the wall holds a link with a secret token, and opening it signs you in.

Use the signed-in user in a route:

    from app.auth import CurrentUser

    @api.get("/things")
    def my_things(user: CurrentUser, db: SessionDep) -> ...:
"""

import hashlib
import hmac
import logging
import secrets
from datetime import UTC, datetime, timedelta
from typing import Annotated

from fastapi import APIRouter, Cookie, Depends, HTTPException, Request, Response, status
from pydantic import BaseModel, Field, StringConstraints
from sqlalchemy import delete, func, select

from app.config import settings
from app.db import SessionDep
from app.models import JoinLink, User, UserSession

MAX_JOINS_PER_LINK = 300  # stops one person from creating endless accounts with an open link
SESSION_LIFETIME = timedelta(days=30)
ADMIN_SESSION_LIFETIME = timedelta(hours=12)
# Wrong admin passwords: after this many from one address, that address waits a while
ADMIN_MAX_FAILURES = 10
ADMIN_LOCKOUT = timedelta(minutes=15)
failed_admin_sign_ins: dict[str, list[datetime]] = {}  # per address; kept in memory

logger = logging.getLogger(__name__)
COOKIE_NAME = "session"

router = APIRouter(prefix="/auth", tags=["auth"])


def now() -> datetime:
    return datetime.now(UTC)


def hash_secret(value: str) -> str:
    """A keyed hash (HMAC): without SECRET_KEY, a stolen hash cannot be matched to its token."""
    key = settings.secret_key.get_secret_value().encode()
    return hmac.new(key, value.encode(), hashlib.sha256).hexdigest()


def open_join_link(db: SessionDep, *, lock: bool = False) -> JoinLink | None:
    """The link in the QR code right now, or None while feedback is closed.
    With `lock`, other requests wait until this one is done with the link."""
    query = select(JoinLink).where(JoinLink.closed_at.is_(None)).order_by(JoinLink.id.desc())
    return db.scalars(query.with_for_update() if lock else query).first()


def join_url(link: JoinLink | None) -> str | None:
    return f"{settings.public_url.rstrip('/')}/join/{link.token}" if link else None


# ── Request and response bodies ──────────────────────────────────────────────


class JoinRequest(BaseModel):
    token: str = Field(max_length=64)
    display_name: Annotated[str, StringConstraints(strip_whitespace=True, max_length=50)] | None = (
        None
    )


class AdminSignIn(BaseModel):
    password: str = Field(max_length=200)


class Message(BaseModel):
    detail: str


class Me(BaseModel):
    id: int
    display_name: str | None
    is_admin: bool


def to_me(user: User) -> Me:
    return Me(id=user.id, display_name=user.display_name, is_admin=user.is_admin)


# ── Who is signed in ─────────────────────────────────────────────────────────

SessionCookie = Annotated[str | None, Cookie(alias=COOKIE_NAME)]


def optional_user(db: SessionDep, token: SessionCookie = None) -> User | None:
    """The signed-in user, or None."""
    if not token:
        return None
    session = db.scalars(
        select(UserSession).where(
            UserSession.token_hash == hash_secret(token), UserSession.expires_at > now()
        )
    ).first()
    return db.get(User, session.user_id) if session else None


def current_user(user: Annotated[User | None, Depends(optional_user)]) -> User:
    """The signed-in user; answers 401 when nobody is signed in."""
    if user is None:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Scan the QR code to join first.")
    return user


def admin_user(user: Annotated[User, Depends(current_user)]) -> User:
    """The signed-in host; answers 403 for everyone else."""
    if not user.is_admin:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Only the host can do this.")
    return user


OptionalUser = Annotated[User | None, Depends(optional_user)]
CurrentUser = Annotated[User, Depends(current_user)]
AdminUser = Annotated[User, Depends(admin_user)]


def start_session(
    db: SessionDep, response: Response, user: User, lifetime: timedelta = SESSION_LIFETIME
) -> None:
    """Remember this browser: a random token in an httpOnly cookie, only its hash in the DB."""
    token = secrets.token_urlsafe(32)
    db.add(UserSession(token_hash=hash_secret(token), user_id=user.id, expires_at=now() + lifetime))
    db.commit()
    response.set_cookie(
        COOKIE_NAME,
        token,
        max_age=int(lifetime.total_seconds()),
        httponly=True,  # JavaScript cannot read it
        samesite="lax",  # other sites cannot send it with their forms
        secure=settings.cookie_secure,
    )


# ── Routes ───────────────────────────────────────────────────────────────────


@router.post("/join")
def join(body: JoinRequest, db: SessionDep, response: Response, viewer: OptionalUser) -> Me:
    """Opening the QR code's link. The first time it creates your account."""
    # Locked, so people joining at the same moment are counted one after the other
    link = open_join_link(db, lock=True)
    if link is None or not hmac.compare_digest(link.token.encode(), body.token.encode()):
        raise HTTPException(
            status.HTTP_404_NOT_FOUND,
            "This QR code is not active any more. Scan the one on the screen.",
        )
    if viewer is not None:
        return to_me(viewer)  # scanned again: keep the same account

    joined = db.scalar(select(func.count()).select_from(User).where(User.join_link_id == link.id))
    if (joined or 0) >= MAX_JOINS_PER_LINK:
        raise HTTPException(
            status.HTTP_429_TOO_MANY_REQUESTS, "Too many people joined with this QR code."
        )
    user = User(display_name=body.display_name or None, join_link_id=link.id)
    db.add(user)
    db.flush()  # gives the new user its id
    start_session(db, response, user)
    return to_me(user)


@router.post("/admin")
def admin_sign_in(body: AdminSignIn, db: SessionDep, request: Request, response: Response) -> Me:
    address = request.client.host if request.client else "unknown"
    recent = [
        time for time in failed_admin_sign_ins.get(address, []) if time > now() - ADMIN_LOCKOUT
    ]
    failed_admin_sign_ins[address] = recent
    if len(recent) >= ADMIN_MAX_FAILURES:
        raise HTTPException(
            status.HTTP_429_TOO_MANY_REQUESTS, "Too many wrong passwords. Try again later."
        )
    expected = settings.admin_password.get_secret_value()
    if not hmac.compare_digest(body.password.encode(), expected.encode()):
        recent.append(now())
        logger.warning("Wrong admin password from %s", address)
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Wrong password.")
    admin = db.scalars(select(User).where(User.is_admin)).first()
    if admin is None:
        admin = User(display_name="Host", is_admin=True)
        db.add(admin)
        db.flush()
    start_session(db, response, admin, ADMIN_SESSION_LIFETIME)
    return to_me(admin)


@router.get("/me")
def me(user: CurrentUser) -> Me:
    return to_me(user)


@router.post("/sign-out")
def sign_out(db: SessionDep, response: Response, token: SessionCookie = None) -> Message:
    if token:
        db.execute(delete(UserSession).where(UserSession.token_hash == hash_secret(token)))
        db.commit()
    response.delete_cookie(
        COOKIE_NAME, httponly=True, samesite="lax", secure=settings.cookie_secure
    )
    return Message(detail="Signed out.")
