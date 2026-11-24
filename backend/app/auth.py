"""Sign-in with a 6-digit code sent by email. The first sign-in creates the account.

Use the signed-in user in a route:

    from app.auth import CurrentUser

    @api.get("/things")
    def my_things(user: CurrentUser, db: SessionDep) -> ...:
"""

import hashlib
import hmac
import secrets
from datetime import UTC, datetime, timedelta
from typing import Annotated

from fastapi import APIRouter, Cookie, Depends, HTTPException, Response, status
from pydantic import BaseModel, EmailStr, Field, StringConstraints
from sqlalchemy import delete, func, select

from app.config import settings
from app.db import SessionDep
from app.mailer import Email, EmailNotSentError, EmailSenderDep
from app.models import LoginCode, User, UserSession

CODE_LIFETIME = timedelta(minutes=10)
MAX_WRONG_TRIES = 5
MAX_CODES_PER_WINDOW = 3
RATE_LIMIT_WINDOW = timedelta(minutes=15)
SESSION_LIFETIME = timedelta(days=30)
COOKIE_NAME = "session"

router = APIRouter(prefix="/auth", tags=["auth"])


def now() -> datetime:
    return datetime.now(UTC)


def hash_secret(value: str) -> str:
    """A keyed hash (HMAC): without SECRET_KEY, a stolen hash cannot be matched to its code."""
    key = settings.secret_key.get_secret_value().encode()
    return hmac.new(key, value.encode(), hashlib.sha256).hexdigest()


# ── Request and response bodies ──────────────────────────────────────────────


class CodeRequest(BaseModel):
    email: EmailStr


class CodeVerification(BaseModel):
    email: EmailStr
    code: str = Field(pattern=r"^\d{6}$")
    # Only used when this sign-in creates the account
    display_name: Annotated[str, StringConstraints(strip_whitespace=True, max_length=50)] | None = (
        None
    )


class Message(BaseModel):
    detail: str


class Me(BaseModel):
    id: int
    email: str
    display_name: str | None


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
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Sign in first.")
    return user


OptionalUser = Annotated[User | None, Depends(optional_user)]
CurrentUser = Annotated[User, Depends(current_user)]


# ── Routes ───────────────────────────────────────────────────────────────────


@router.post("/request-code")
def request_code(body: CodeRequest, db: SessionDep, mailer: EmailSenderDep) -> Message:
    email = body.email.lower()
    recent_codes = db.scalar(
        select(func.count())
        .select_from(LoginCode)
        .where(LoginCode.email == email, LoginCode.created_at > now() - RATE_LIMIT_WINDOW)
    )
    if (recent_codes or 0) >= MAX_CODES_PER_WINDOW:
        raise HTTPException(
            status.HTTP_429_TOO_MANY_REQUESTS,
            "Too many codes requested. Wait 15 minutes and try again.",
        )

    code = f"{secrets.randbelow(1_000_000):06d}"
    db.add(
        LoginCode(
            email=email,
            code_hash=hash_secret(code),
            created_at=now(),
            expires_at=now() + CODE_LIFETIME,
        )
    )
    try:
        mailer.send(
            Email(
                to=email,
                subject=f"Your sign-in code: {code}",
                text=f"Your code is {code}\n\nIt works once, for 10 minutes. "
                "If you did not ask for it, ignore this email.",
            )
        )
    except EmailNotSentError as error:
        db.rollback()  # a code that never arrived should not count toward the limit
        raise HTTPException(
            status.HTTP_503_SERVICE_UNAVAILABLE, "We could not send the email. Try again soon."
        ) from error
    db.commit()
    # The same answer for every address, so nobody can probe who has an account
    return Message(detail="We sent a 6-digit code to that address.")


@router.post("/verify-code")
def verify_code(body: CodeVerification, db: SessionDep, response: Response) -> Me:
    email = body.email.lower()
    login = db.scalars(
        select(LoginCode)
        .where(LoginCode.email == email, LoginCode.used.is_(False))
        .order_by(LoginCode.created_at.desc())
        # Lock the row: simultaneous guesses wait their turn, so each one counts toward the
        # 5-tries limit, and one code can never sign in twice
        .with_for_update()
    ).first()
    if login is None or login.expires_at <= now() or login.wrong_tries >= MAX_WRONG_TRIES:
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST, "This code has expired. Request a new one."
        )
    if not hmac.compare_digest(login.code_hash, hash_secret(body.code)):
        login.wrong_tries += 1
        db.commit()
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Wrong code. Check the email again.")

    login.used = True
    user = db.scalars(select(User).where(User.email == email)).first()
    if user is None:
        user = User(email=email, display_name=body.display_name or None)
        db.add(user)
        db.flush()  # gives the new user its id

    token = secrets.token_urlsafe(32)
    db.add(
        UserSession(
            token_hash=hash_secret(token), user_id=user.id, expires_at=now() + SESSION_LIFETIME
        )
    )
    db.commit()
    response.set_cookie(
        COOKIE_NAME,
        token,
        max_age=int(SESSION_LIFETIME.total_seconds()),
        httponly=True,  # JavaScript cannot read it
        samesite="lax",  # other sites cannot send it with their forms
        secure=settings.cookie_secure,
    )
    return Me(id=user.id, email=user.email, display_name=user.display_name)


@router.get("/me")
def me(user: CurrentUser) -> Me:
    return Me(id=user.id, email=user.email, display_name=user.display_name)


@router.post("/sign-out")
def sign_out(db: SessionDep, response: Response, token: SessionCookie = None) -> Message:
    if token:
        db.execute(delete(UserSession).where(UserSession.token_hash == hash_secret(token)))
        db.commit()
    response.delete_cookie(
        COOKIE_NAME, httponly=True, samesite="lax", secure=settings.cookie_secure
    )
    return Message(detail="Signed out.")
