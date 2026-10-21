from datetime import date, datetime
from decimal import Decimal

from sqlalchemy import Boolean, Date, DateTime, ForeignKey, Index, Numeric, String, Text, false, func, text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from backend.app.core.base import Base


class Expense(Base):
    __tablename__ = "expenses"
    __table_args__ = (
        # Najwyżej jeden automatyczny wydatek na kategorię cykliczną.
        Index(
            "uq_expenses_recurring_category_id",
            "category_id",
            unique=True,
            postgresql_where=text("is_recurring"),
        ),
    )

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        index=True,
        nullable=False,
    )
    category_id: Mapped[int] = mapped_column(
        ForeignKey("categories.id", ondelete="CASCADE"),
        index=True,
        nullable=False,
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    amount: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    expense_date: Mapped[date] = mapped_column(Date, index=True, nullable=False)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    # Wydatek utworzony automatycznie dla kategorii cyklicznej (powiązanie przez category_id).
    is_recurring: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default=false())

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

    user = relationship("User", back_populates="expenses")
    category = relationship("Category", back_populates="expenses")