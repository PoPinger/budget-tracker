from datetime import date

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from backend.app.core.db import get_db
from backend.app.core.security import get_current_user
from backend.app.models.user import User
from backend.app.schemas.budget import BudgetCreate, BudgetResponse, BudgetUpdate
from backend.app.services.budget_service import (
    create_budget,
    delete_budget,
    get_budget_by_month_or_404,
    get_budget_or_404,
    list_budgets,
    update_budget,
)

router = APIRouter()


@router.get("/", response_model=list[BudgetResponse])
def get_budgets(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[BudgetResponse]:
    return list_budgets(db, current_user)


@router.post("/", response_model=BudgetResponse, status_code=status.HTTP_201_CREATED)
def create_budget_endpoint(
    payload: BudgetCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> BudgetResponse:
    return create_budget(db, payload, current_user)


@router.get("/by-month", response_model=BudgetResponse)
def get_budget_for_month(
    month: date,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> BudgetResponse:
    return get_budget_by_month_or_404(db, month, current_user)


@router.get("/{budget_id}", response_model=BudgetResponse)
def get_budget(
    budget_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> BudgetResponse:
    return get_budget_or_404(db, budget_id, current_user)


@router.put("/{budget_id}", response_model=BudgetResponse)
def update_budget_endpoint(
    budget_id: int,
    payload: BudgetUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> BudgetResponse:
    return update_budget(db, budget_id, payload, current_user)


@router.delete("/{budget_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_budget_endpoint(
    budget_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> None:
    delete_budget(db, budget_id, current_user)