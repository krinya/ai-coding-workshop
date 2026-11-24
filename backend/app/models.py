"""Table models. Each one inherits from `Base`; after adding or changing one, run
`make migration m="describe the change"` and then `make migrate`.

Example:

    from sqlalchemy.orm import Mapped, mapped_column

    class Note(Base):
        __tablename__ = "notes"

        id: Mapped[int] = mapped_column(primary_key=True)
        text: Mapped[str]
"""

from app.db import Base

__all__ = ["Base"]
