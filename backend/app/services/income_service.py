from datetime import date

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from backend.app.models.income import Income
from backend.app.models.user import User
from backend.app.schemas.income import IncomeCreate, IncomeUpdate
from backend.app.services.month_service import first_of_month


def list_incomes(db: Session, current_user: User, month: date | None = None) -> list[Income]:
    statement = (
        select(Income)
        .where(Income.user_id == current_user.id)
        .order_by(Income.income_date.desc(), Income.id.desc())
    )
    if month is not None:
        statement = statement.where(Income.month == first_of_month(month))
    return list(db.scalars(statement).all())


def get_income_or_404(db: Session, income_id: int, current_user: User) -> Income:
    income = db.scalar(
        select(Income).where(
            Income.id == income_id,
            Income.user_id == current_user.id,
        )
    )
    if income is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Przychód nie został znaleziony.",
        )
    return income


def create_income(db: Session, payload: IncomeCreate, current_user: User) -> Income:
    # Miesiąc przychodu wynika z jego daty, więc data zawsze należy do miesiąca.
    income = Income(
        user_id=current_user.id,
        month=first_of_month(payload.income_date),
        name=payload.name.strip(),
        amount=payload.amount,
        income_date=payload.income_date,
    )
    db.add(income)
    db.commit()
    db.refresh(income)
    return income


def update_income(db: Session, income_id: int, payload: IncomeUpdate, current_user: User) -> Income:
    income = get_income_or_404(db, income_id, current_user)

    if payload.name is not None:
        income.name = payload.name.strip()
    if payload.amount is not None:
        income.amount = payload.amount
    if payload.income_date is not None:
        income.income_date = payload.income_date
        income.month = first_of_month(payload.income_date)

    db.commit()
    db.refresh(income)
    return income


def delete_income(db: Session, income_id: int, current_user: User) -> None:
    income = get_income_or_404(db, income_id, current_user)
    db.delete(income)
    db.commit()
