"""The host's controls at /admin: open or close the QR code, and remove entries from the wall."""

import secrets

from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import delete, func, select

from app.auth import AdminUser, join_url, now, open_join_link
from app.db import SessionDep
from app.models import Feedback, JoinLink, User, UserSession

router = APIRouter(prefix="/admin", tags=["admin"])


class JoinLinkStatus(BaseModel):
    join_url: str | None  # None while feedback is closed
    joined: int  # how many people joined with the current link


def link_status(db: SessionDep) -> JoinLinkStatus:
    link = open_join_link(db)
    joined = 0
    if link:
        query = select(func.count()).select_from(User).where(User.join_link_id == link.id)
        joined = db.scalar(query) or 0
    return JoinLinkStatus(join_url=join_url(link), joined=joined)


def close_links(db: SessionDep) -> None:
    for link in db.scalars(select(JoinLink).where(JoinLink.closed_at.is_(None))):
        link.closed_at = now()


@router.get("/join-link")
def get_join_link(db: SessionDep, admin: AdminUser) -> JoinLinkStatus:
    return link_status(db)


@router.post("/join-link")
def open_feedback(db: SessionDep, admin: AdminUser) -> JoinLinkStatus:
    """Show a QR code with a brand-new link (the old link stops working)."""
    close_links(db)
    db.add(JoinLink(token=secrets.token_urlsafe(16), created_at=now()))
    db.commit()
    return link_status(db)


@router.delete("/join-link")
def close_feedback(db: SessionDep, admin: AdminUser) -> JoinLinkStatus:
    """Take the QR code down. People who already joined can still edit their feedback."""
    close_links(db)
    db.commit()
    return link_status(db)


@router.delete("/feedback/{feedback_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_feedback(feedback_id: int, db: SessionDep, admin: AdminUser) -> None:
    """Remove an entry from the wall, and sign its author out so they cannot post again
    right away (they can rejoin only while the QR code is up)."""
    entry = db.get(Feedback, feedback_id)
    if entry is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Feedback not found.")
    if not entry.user.is_admin:
        db.execute(delete(UserSession).where(UserSession.user_id == entry.user_id))
    db.delete(entry)
    db.commit()
