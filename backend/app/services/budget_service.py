from datetime import date

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from backend.app.models.budget import Budget
from backend.app.models.user import User
from backend.app.schemas.budget import BudgetCreate, BudgetUpdate

DUPLICATE_BUDGET_DETAIL = "Budżet dla tego miesiąca już istnieje."
BUDGET_UNIQUE_CONSTRAINT = "uq_budgets_user_id_month"


def _raise_duplicate() -> None:
    raise HTTPException(
        status_code=status.HTTP_409_CONFLICT,
        detail=DUPLICATE_BUDGET_DETAIL,
    )


def _ensure_month_available(
    db: Session,
    current_user: User,
    month: date,
    exclude_budget_id: int | None = None,
) -> None:
    statement = select(Budget.id).where(
        Budget.user_id == current_user.id,
        Budget.month == month,
    )
    if exclude_budget_id is not None:
        statement = statement.where(Budget.id != exclude_budget_id)

    if db.scalar(statement) is not None:
        _raise_duplicate()


def _commit(db: Session) -> None:
    # Dwa równoległe żądania mogą minąć sprawdzenie powyżej; wtedy decyduje constraint w bazie.
    try:
        db.commit()
    except IntegrityError as error:
        db.rollback()
        constraint = getattr(getattr(error.orig, "diag", None), "constraint_name", None)
        if constraint == BUDGET_UNIQUE_CONSTRAINT:
            _raise_duplicate()
        raise


def list_budgets(db: Session, current_user: User) -> list[Budget]:
    statement = (
        select(Budget)
        .where(Budget.user_id == current_user.id)
        .order_by(Budget.month.desc())
    )
    return list(db.scalars(statement).all())


def get_budget_or_404(db: Session, budget_id: int, current_user: User) -> Budget:
    statement = select(Budget).where(
        Budget.id == budget_id,
        Budget.user_id == current_user.id,
    )
    budget = db.scalar(statement)

    if budget is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Budżet nie został znaleziony.",
        )

    return budget


def get_budget_by_month_or_404(db: Session, month: date, current_user: User) -> Budget:
    statement = select(Budget).where(
        Budget.month == month,
        Budget.user_id == current_user.id,
    )
    budget = db.scalar(statement)

    if budget is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Budżet dla tego miesiąca nie istnieje.",
        )

    return budget


def create_budget(db: Session, payload: BudgetCreate, current_user: User) -> Budget:
    _ensure_month_available(db, current_user, payload.month)

    budget = Budget(
        user_id=current_user.id,
        month=payload.month,
        total_limit=payload.total_limit,
    )

    db.add(budget)
    _commit(db)
    db.refresh(budget)
    return budget


def update_budget(
    db: Session,
    budget_id: int,
    payload: BudgetUpdate,
    current_user: User,
) -> Budget:
    budget = get_budget_or_404(db, budget_id, current_user)

    if payload.month is not None:
        _ensure_month_available(db, current_user, payload.month, exclude_budget_id=budget.id)
        budget.month = payload.month
    if payload.total_limit is not None:
        budget.total_limit = payload.total_limit

    _commit(db)
    db.refresh(budget)
    return budget


def delete_budget(db: Session, budget_id: int, current_user: User) -> None:
    budget = get_budget_or_404(db, budget_id, current_user)
    db.delete(budget)
    db.commit()