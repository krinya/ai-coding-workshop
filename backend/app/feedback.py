"""The feedback form: one entry per signed-in user, which only its owner can change."""

import base64
import binascii
import io
from datetime import datetime
from typing import Annotated

from fastapi import APIRouter, HTTPException, Response, status
from PIL import Image, UnidentifiedImageError
from pydantic import BaseModel, Field, StringConstraints
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, joinedload

from app.auth import CurrentUser
from app.db import SessionDep
from app.models import Feedback

ALREADY_SENT = "You already sent feedback — edit it instead."
MAX_PHOTO_SIDE = 640
MAX_PHOTO_UPLOAD = 3_000_000  # characters of base64, about 2 MB of image
MAX_PHOTO_PIXELS = 25_000_000  # e.g. 5000 x 5000

router = APIRouter(prefix="/feedback", tags=["feedback"])


# ── Request and response bodies ──────────────────────────────────────────────


class FeedbackIn(BaseModel):
    rating: int = Field(ge=1, le=5)
    comment: Annotated[str, StringConstraints(strip_whitespace=True, max_length=500)] = ""
    # A picture as a data URL ("data:image/jpeg;base64,...") or plain base64.
    # On update, leave it out to keep the current photo.
    photo: str | None = Field(default=None, max_length=MAX_PHOTO_UPLOAD)
    # "My photo may be shown on the screen during the workshop". Without it, no photo is kept.
    photo_consent: bool = False
    remove_photo: bool = False


class MyFeedback(BaseModel):
    id: int
    rating: int
    comment: str
    photo_url: str | None
    created_at: datetime
    updated_at: datetime


class PublicFeedback(BaseModel):
    """What everyone may see. Never add the email here."""

    id: int
    display_name: str | None
    rating: int
    comment: str
    photo_url: str | None
    created_at: datetime


def photo_url(entry: Feedback) -> str | None:
    if not entry.has_photo:
        return None
    # The version makes browsers fetch the new picture after an edit
    return f"/api/feedback/{entry.id}/photo?v={int(entry.updated_at.timestamp())}"


def to_mine(entry: Feedback) -> MyFeedback:
    return MyFeedback(
        id=entry.id,
        rating=entry.rating,
        comment=entry.comment,
        photo_url=photo_url(entry),
        created_at=entry.created_at,
        updated_at=entry.updated_at,
    )


def to_public(entry: Feedback) -> PublicFeedback:
    return PublicFeedback(
        id=entry.id,
        display_name=entry.user.display_name,
        rating=entry.rating,
        comment=entry.comment,
        photo_url=photo_url(entry),
        created_at=entry.created_at,
    )


def to_jpeg(photo: str) -> bytes:
    """Decode an uploaded picture and save it again as a JPEG of at most 640px.

    Re-encoding proves it really is an image and drops hidden metadata such as GPS location.
    """
    data = photo.partition(",")[2] if photo.startswith("data:") else photo
    try:
        upload = Image.open(io.BytesIO(base64.b64decode(data, validate=True)))
        if upload.format not in {"JPEG", "PNG", "WEBP"}:
            raise ValueError(upload.format)
        # A small file can claim huge dimensions and eat all memory once decoded
        if upload.width * upload.height > MAX_PHOTO_PIXELS:
            raise ValueError("too many pixels")
        image = upload.convert("RGB")
        image.thumbnail((MAX_PHOTO_SIDE, MAX_PHOTO_SIDE))
    except (
        binascii.Error,
        UnidentifiedImageError,
        Image.DecompressionBombError,  # Pillow's own guard against gigantic pictures
        ValueError,
        OSError,
    ) as error:
        raise HTTPException(
            status.HTTP_422_UNPROCESSABLE_CONTENT, "The photo must be a JPEG, PNG or WebP picture."
        ) from error
    output = io.BytesIO()
    image.save(output, format="JPEG", quality=85)
    return output.getvalue()


def apply(entry: Feedback, body: FeedbackIn) -> None:
    """Copy the form onto the entry. Photos are only kept with consent."""
    entry.rating = body.rating
    entry.comment = body.comment
    if not body.photo_consent or body.remove_photo:
        entry.photo = None
    elif body.photo is not None:
        entry.photo = to_jpeg(body.photo)


def newest_first(db: Session) -> list[Feedback]:
    """All entries, newest first, with their users loaded in the same query."""
    query = (
        select(Feedback)
        .options(joinedload(Feedback.user))
        .order_by(Feedback.created_at.desc(), Feedback.id.desc())
    )
    return list(db.scalars(query))


def own_entry(db: SessionDep, user: CurrentUser, feedback_id: int) -> Feedback:
    entry = db.get(Feedback, feedback_id)
    if entry is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Feedback not found.")
    if entry.user_id != user.id:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "You can only change your own feedback.")
    return entry


# ── Routes ───────────────────────────────────────────────────────────────────


@router.get("")
def list_feedback(db: SessionDep) -> list[PublicFeedback]:
    return [to_public(entry) for entry in newest_first(db)]


@router.get("/mine")
def my_feedback(db: SessionDep, user: CurrentUser) -> MyFeedback | None:
    entry = db.scalars(select(Feedback).where(Feedback.user_id == user.id)).first()
    return to_mine(entry) if entry else None


@router.post("", status_code=status.HTTP_201_CREATED)
def submit_feedback(body: FeedbackIn, db: SessionDep, user: CurrentUser) -> MyFeedback:
    if db.scalars(select(Feedback).where(Feedback.user_id == user.id)).first():
        raise HTTPException(status.HTTP_409_CONFLICT, ALREADY_SENT)
    entry = Feedback(user_id=user.id)
    apply(entry, body)
    db.add(entry)
    try:
        db.commit()
    except IntegrityError as error:  # a double click: the first request already saved it
        db.rollback()
        raise HTTPException(status.HTTP_409_CONFLICT, ALREADY_SENT) from error
    return to_mine(entry)


@router.put("/{feedback_id}")
def update_feedback(
    feedback_id: int, body: FeedbackIn, db: SessionDep, user: CurrentUser
) -> MyFeedback:
    entry = own_entry(db, user, feedback_id)
    apply(entry, body)
    db.commit()
    return to_mine(entry)


@router.delete("/{feedback_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_feedback(feedback_id: int, db: SessionDep, user: CurrentUser) -> None:
    db.delete(own_entry(db, user, feedback_id))
    db.commit()


@router.get(
    "/{feedback_id}/photo",
    response_class=Response,
    responses={200: {"content": {"image/jpeg": {}}}, 404: {}},
)
def feedback_photo(feedback_id: int, db: SessionDep) -> Response:
    entry = db.get(Feedback, feedback_id)
    if entry is None or entry.photo is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "No photo.")
    return Response(entry.photo, media_type="image/jpeg")
