from datetime import date, datetime, timezone
from decimal import Decimal

from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.orm import Session

from backend.app.models.month import MONTH_STATUS_ACTIVE, MONTH_STATUS_CLOSED, Month
from backend.app.models.income import Income
from backend.app.models.user import User
from backend.app.schemas.month import MonthResponse


def first_of_month(value: date) -> date:
    return value.replace(day=1)


def next_month(month_value: date) -> date:
    if month_value.month == 12:
        return date(month_value.year + 1, 1, 1)
    return date(month_value.year, month_value.month + 1, 1)


def previous_month(month_value: date) -> date:
    if month_value.month == 1:
        return date(month_value.year - 1, 12, 1)
    return date(month_value.year, month_value.month - 1, 1)


def get_month(db: Session, month: date, current_user: User) -> Month | None:
    return db.scalar(
        select(Month).where(
            Month.user_id == current_user.id,
            Month.month == first_of_month(month),
        )
    )


def get_month_or_404(db: Session, month: date, current_user: User) -> Month:
    month_row = get_month(db, month, current_user)
    if month_row is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Ten miesiąc nie został jeszcze rozpoczęty.",
        )
    return month_row


def ensure_month_started(db: Session, month: date, current_user: User) -> None:
    # Dane dodane starym formularzem (budżet, kategoria, wydatek) też rozpoczynają miesiąc.
    # ON CONFLICT, bo dwa równoległe żądania mogą chcieć utworzyć ten sam wiersz.
    db.execute(
        insert(Month)
        .values(user_id=current_user.id, month=first_of_month(month), status=MONTH_STATUS_ACTIVE)
        .on_conflict_do_nothing(constraint="uq_months_user_id_month")
    )


def extra_income_total(db: Session, month: date, current_user: User) -> Decimal:
    return db.scalar(
        select(func.coalesce(func.sum(Income.amount), 0)).where(
            Income.user_id == current_user.id,
            Income.month == first_of_month(month),
        )
    )


def build_month_response(db: Session, month: date, current_user: User) -> MonthResponse:
    month_value = first_of_month(month)
    month_row = get_month(db, month_value, current_user)
    return MonthResponse(
        month=month_value,
        status=month_row.status if month_row else "not_started",
        salary=float(month_row.salary) if month_row and month_row.salary is not None else None,
        extra_income_total=float(extra_income_total(db, month_value, current_user)),
        closed_at=month_row.closed_at if month_row else None,
    )


def close_month(db: Session, month: date, current_user: User) -> MonthResponse:
    month_row = get_month_or_404(db, month, current_user)
    if month_row.status == MONTH_STATUS_CLOSED:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Ten miesiąc jest już zamknięty.",
        )
    month_row.status = MONTH_STATUS_CLOSED
    month_row.closed_at = datetime.now(timezone.utc)
    db.commit()
    return build_month_response(db, month, current_user)


def reopen_month(db: Session, month: date, current_user: User) -> MonthResponse:
    month_row = get_month_or_404(db, month, current_user)
    if month_row.status == MONTH_STATUS_ACTIVE:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Ten miesiąc jest już otwarty.",
        )
    month_row.status = MONTH_STATUS_ACTIVE
    month_row.closed_at = None
    db.commit()
    return build_month_response(db, month, current_user)


def update_salary(db: Session, month: date, salary: float, current_user: User) -> MonthResponse:
    month_row = get_month_or_404(db, month, current_user)
    month_row.salary = salary
    db.commit()
    return build_month_response(db, month, current_user)
