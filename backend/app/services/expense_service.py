from datetime import date

from sqlalchemy import extract, select
from sqlalchemy.orm import Session, joinedload

from backend.app.models.category import Category
from backend.app.models.expense import Expense
from backend.app.schemas.expense import ExpenseCreate, ExpenseUpdate


def get_all_expenses(db: Session) -> list[Expense]:
    statement = (
        select(Expense)
        .options(joinedload(Expense.category))
        .order_by(Expense.expense_date.desc(), Expense.id.desc())
    )
    return list(db.scalars(statement).unique().all())


def get_expenses_by_month(db: Session, year: int, month: int) -> list[Expense]:
    statement = (
        select(Expense)
        .options(joinedload(Expense.category))
        .where(extract("year", Expense.expense_date) == year)
        .where(extract("month", Expense.expense_date) == month)
        .order_by(Expense.expense_date.desc(), Expense.id.desc())
    )
    return list(db.scalars(statement).unique().all())


def get_expense_by_id(db: Session, expense_id: int) -> Expense | None:
    statement = (
        select(Expense)
        .options(joinedload(Expense.category))
        .where(Expense.id == expense_id)
    )
    return db.scalar(statement)


def get_category_by_id(db: Session, category_id: int) -> Category | None:
    return db.get(Category, category_id)


def create_expense(db: Session, expense_in: ExpenseCreate) -> Expense:
    expense = Expense(
        title=expense_in.title,
        amount=expense_in.amount,
        expense_date=expense_in.expense_date,
        notes=expense_in.notes,
        category_id=expense_in.category_id,
    )
    db.add(expense)
    db.commit()
    db.refresh(expense)
    return get_expense_by_id(db, expense.id)


def update_expense(
    db: Session,
    expense: Expense,
    expense_in: ExpenseUpdate,
) -> Expense:
    update_data = expense_in.model_dump(exclude_unset=True)

    for field, value in update_data.items():
        setattr(expense, field, value)

    db.add(expense)
    db.commit()
    db.refresh(expense)
    return get_expense_by_id(db, expense.id)


def delete_expense(db: Session, expense: Expense) -> None:
    db.delete(expense)
    db.commit()