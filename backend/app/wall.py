"""The live wall for the projector (public) and emoji reactions (signed-in users)."""

import re
from collections import Counter
from pathlib import Path
from typing import Literal

from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import delete, func, select
from sqlalchemy.exc import IntegrityError

from app.auth import CurrentUser, OptionalUser, join_url, open_join_link
from app.db import SessionDep
from app.feedback import PublicFeedback, newest_first, to_public
from app.models import Feedback, Reaction

router = APIRouter(tags=["wall"])

Emoji = Literal["clap", "laugh", "heart"]  # 👏 😂 ❤️ — the frontend draws them
EMOJIS: tuple[Emoji, ...] = ("clap", "laugh", "heart")

# Words too common to say anything about the course, one per line in stop_words.txt
STOP_WORDS = set((Path(__file__).parent / "stop_words.txt").read_text().split())
WORD = re.compile(r"[^\W\d_]+(?:'[^\W\d_]+)?")  # letters, with an optional apostrophe: "don't"


class ReactionIn(BaseModel):
    emoji: Emoji


class ReactionCounts(BaseModel):
    clap: int = 0
    laugh: int = 0
    heart: int = 0


class ReactionState(BaseModel):
    reactions: ReactionCounts
    my_reactions: list[Emoji]  # what the person looking has pressed


class WallEntry(PublicFeedback):
    reactions: ReactionCounts
    my_reactions: list[Emoji]  # what the person looking has pressed (empty when signed out)


class WordCount(BaseModel):
    word: str
    count: int


class Wall(BaseModel):
    average: float | None
    count: int
    histogram: list[int]  # how many gave 1, 2, 3, 4 and 5 stars
    entries: list[WallEntry]
    words: list[WordCount]
    join_url: str | None  # for the QR code; None while feedback is closed


def top_words(comments: list[str], limit: int = 30) -> list[WordCount]:
    counts = Counter(
        word
        for comment in comments
        for word in WORD.findall(comment.lower())
        if len(word) >= 3 and word not in STOP_WORDS
    )
    return [WordCount(word=word, count=count) for word, count in counts.most_common(limit)]


@router.get("/wall")
def wall(db: SessionDep, viewer: OptionalUser) -> Wall:
    entries = newest_first(db)

    counts: dict[int, ReactionCounts] = {entry.id: ReactionCounts() for entry in entries}
    rows = db.execute(
        select(Reaction.feedback_id, Reaction.emoji, func.count()).group_by(
            Reaction.feedback_id, Reaction.emoji
        )
    )
    for feedback_id, emoji, count in rows:
        if feedback_id in counts:
            setattr(counts[feedback_id], emoji, count)

    mine: dict[int, list[Emoji]] = {}
    if viewer:
        for reaction in db.scalars(select(Reaction).where(Reaction.user_id == viewer.id)):
            mine.setdefault(reaction.feedback_id, []).append(as_emoji(reaction.emoji))

    histogram = [0] * 5
    for entry in entries:
        histogram[entry.rating - 1] += 1

    return Wall(
        average=round(sum(e.rating for e in entries) / len(entries), 2) if entries else None,
        count=len(entries),
        histogram=histogram,
        entries=[
            WallEntry(
                **to_public(entry).model_dump(),
                reactions=counts[entry.id],
                my_reactions=sorted(mine.get(entry.id, []), key=EMOJIS.index),
            )
            for entry in entries
        ],
        words=top_words([entry.comment for entry in entries]),
        join_url=join_url(open_join_link(db)),
    )


@router.post("/feedback/{feedback_id}/reactions")
def toggle_reaction(
    feedback_id: int, body: ReactionIn, db: SessionDep, user: CurrentUser
) -> ReactionState:
    """Press once to react, press again to take it back."""
    if db.get(Feedback, feedback_id) is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Feedback not found.")
    mine = (
        Reaction.feedback_id == feedback_id,
        Reaction.user_id == user.id,
        Reaction.emoji == body.emoji,
    )
    if db.scalars(select(Reaction).where(*mine)).first():
        db.execute(delete(Reaction).where(*mine))
        db.commit()
    else:
        db.add(Reaction(feedback_id=feedback_id, user_id=user.id, emoji=body.emoji))
        try:
            db.commit()
        except IntegrityError:  # a double click: the first one already added it
            db.rollback()

    state = ReactionState(reactions=ReactionCounts(), my_reactions=[])
    for reaction in db.scalars(select(Reaction).where(Reaction.feedback_id == feedback_id)):
        emoji = as_emoji(reaction.emoji)
        setattr(state.reactions, emoji, getattr(state.reactions, emoji) + 1)
        if reaction.user_id == user.id:
            state.my_reactions.append(emoji)
    state.my_reactions.sort(key=EMOJIS.index)
    return state


def as_emoji(value: str) -> Emoji:
    """The database stores plain text; turn it back into one of the known emoji names."""
    return EMOJIS[EMOJIS.index(value)]  # ValueError for anything unknown
