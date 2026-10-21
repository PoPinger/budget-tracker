from sqlalchemy import select
from sqlalchemy.orm import Session

from backend.app.models.category import Category
from backend.app.models.expense import Expense
from backend.app.services.month_service import next_month


def sync_recurring_expense(db: Session, category: Category) -> None:
    """Kategoria cykliczna ma jeden automatyczny wydatek równy jej limitowi.

    Tworzy go, aktualizuje kwotę (i datę, jeśli kategoria zmieniła miesiąc)
    albo usuwa, gdy kategoria przestała być cykliczna. Nie robi commita.
    """
    if category.id is None and not category.is_recurring:
        return

    db.flush()
    expense = db.scalar(
        select(Expense).where(
            Expense.category_id == category.id,
            Expense.is_recurring.is_(True),
        )
    )

    if not category.is_recurring:
        if expense is not None:
            db.delete(expense)
        return

    if expense is None:
        db.add(
            Expense(
                user_id=category.user_id,
                category_id=category.id,
                name=category.name,
                amount=category.limit_amount,
                expense_date=category.month,
                is_recurring=True,
            )
        )
        return

    expense.amount = category.limit_amount
    if not category.month <= expense.expense_date < next_month(category.month):
        expense.expense_date = category.month
