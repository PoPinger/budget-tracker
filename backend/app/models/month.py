from datetime import date, datetime
from decimal import Decimal

from sqlalchemy import CheckConstraint, Date, DateTime, ForeignKey, Numeric, String, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from backend.app.core.base import Base

MONTH_STATUS_ACTIVE = "active"
MONTH_STATUS_CLOSED = "closed"


class Month(Base):
    """Rozpoczęty miesiąc użytkownika. Brak wiersza oznacza miesiąc nierozpoczęty."""

    __tablename__ = "months"
    __table_args__ = (
        UniqueConstraint("user_id", "month", name="uq_months_user_id_month"),
        CheckConstraint("status IN ('active', 'closed')", name="ck_months_status"),
    )

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        index=True,
        nullable=False,
    )
    month: Mapped[date] = mapped_column(Date, index=True, nullable=False)
    # NULL dla miesięcy sprzed wprowadzenia wypłaty.
    salary: Mapped[Decimal | None] = mapped_column(Numeric(12, 2), nullable=True)
    status: Mapped[str] = mapped_column(
        String(16),
        nullable=False,
        server_default=MONTH_STATUS_ACTIVE,
    )
    closed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    user = relationship("User", back_populates="months")
