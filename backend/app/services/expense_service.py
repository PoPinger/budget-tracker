from datetime import date

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from backend.app.models.category import Category
from backend.app.models.expense import Expense
from backend.app.models.user import User
from backend.app.schemas.expense import ExpenseCreate, ExpenseUpdate


def _get_user_category_or_404(db: Session, category_id: int, current_user: User) -> Category:
    statement = select(Category).where(
        Category.id == category_id,
        Category.user_id == current_user.id,
    )
    category = db.scalar(statement)

    if category is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Kategoria nie została znaleziona.",
        )

    return category


def list_expenses(
    db: Session,
    current_user: User,
    month: date | None = None,
) -> list[Expense]:
    statement = (
        select(Expense)
        .options(joinedload(Expense.category))
        .where(Expense.user_id == current_user.id)
        .order_by(Expense.expense_date.desc(), Expense.id.desc())
    )

    if month is not None:
        statement = statement.where(
            Expense.expense_date >= month,
            Expense.expense_date < _next_month(month),
        )

    return list(db.scalars(statement).unique().all())


def get_expense_or_404(db: Session, expense_id: int, current_user: User) -> Expense:
    statement = (
        select(Expense)
        .options(joinedload(Expense.category))
        .where(
            Expense.id == expense_id,
            Expense.user_id == current_user.id,
        )
    )

    expense = db.scalar(statement)

    if expense is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Wydatek nie został znaleziony.",
        )

    return expense


def create_expense(db: Session, payload: ExpenseCreate, current_user: User) -> Expense:
    _get_user_category_or_404(db, payload.category_id, current_user)

    expense = Expense(
        user_id=current_user.id,
        category_id=payload.category_id,
        name=payload.name.strip(),
        amount=payload.amount,
        expense_date=payload.expense_date,
        notes=payload.notes,
    )

    db.add(expense)
    db.commit()
    db.refresh(expense)

    return get_expense_or_404(db, expense.id, current_user)


def update_expense(
    db: Session,
    expense_id: int,
    payload: ExpenseUpdate,
    current_user: User,
) -> Expense:
    expense = get_expense_or_404(db, expense_id, current_user)

    if payload.category_id is not None:
        _get_user_category_or_404(db, payload.category_id, current_user)
        expense.category_id = payload.category_id

    if payload.name is not None:
        expense.name = payload.name.strip()
    if payload.amount is not None:
        expense.amount = payload.amount
    if payload.expense_date is not None:
        expense.expense_date = payload.expense_date
    if payload.notes is not None:
        expense.notes = payload.notes

    db.commit()
    db.refresh(expense)

    return get_expense_or_404(db, expense.id, current_user)


def delete_expense(db: Session, expense_id: int, current_user: User) -> None:
    expense = get_expense_or_404(db, expense_id, current_user)
    db.delete(expense)
    db.commit()


def _next_month(month_value: date) -> date:
    if month_value.month == 12:
        return date(month_value.year + 1, 1, 1)
    return date(month_value.year, month_value.month + 1, 1)