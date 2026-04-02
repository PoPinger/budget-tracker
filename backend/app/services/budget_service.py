from datetime import date

from sqlalchemy import select
from sqlalchemy.orm import Session

from backend.app.models.budget import Budget
from backend.app.schemas.budget import BudgetCreate, BudgetUpdate


def get_all_budgets(db: Session) -> list[Budget]:
    statement = select(Budget).order_by(Budget.month.desc())
    return list(db.scalars(statement).all())


def get_budget_by_id(db: Session, budget_id: int) -> Budget | None:
    return db.get(Budget, budget_id)


def get_budget_by_month(db: Session, month: date) -> Budget | None:
    statement = select(Budget).where(Budget.month == month)
    return db.scalar(statement)


def create_budget(db: Session, budget_in: BudgetCreate) -> Budget:
    budget = Budget(
        month=budget_in.month,
        total_limit=budget_in.total_limit,
    )
    db.add(budget)
    db.commit()
    db.refresh(budget)
    return budget


def update_budget(
    db: Session,
    budget: Budget,
    budget_in: BudgetUpdate,
) -> Budget:
    update_data = budget_in.model_dump(exclude_unset=True)

    for field, value in update_data.items():
        setattr(budget, field, value)

    db.add(budget)
    db.commit()
    db.refresh(budget)
    return budget


def delete_budget(db: Session, budget: Budget) -> None:
    db.delete(budget)
    db.commit()