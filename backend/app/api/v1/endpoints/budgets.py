from datetime import date

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from backend.app.core.db import get_db
from backend.app.schemas.budget import BudgetCreate, BudgetResponse, BudgetUpdate
from backend.app.services.budget_service import (
    create_budget,
    delete_budget,
    get_all_budgets,
    get_budget_by_id,
    get_budget_by_month,
    update_budget,
)

router = APIRouter(prefix="/budgets", tags=["Budgets"])


@router.get("", response_model=list[BudgetResponse])
def list_budgets(db: Session = Depends(get_db)) -> list[BudgetResponse]:
    return get_all_budgets(db)


@router.get("/by-month", response_model=BudgetResponse)
def get_budget_for_month(
    month: date = Query(...),
    db: Session = Depends(get_db),
) -> BudgetResponse:
    budget = get_budget_by_month(db, month)
    if budget is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Budget not found for this month",
        )
    return budget


@router.get("/{budget_id}", response_model=BudgetResponse)
def get_budget(budget_id: int, db: Session = Depends(get_db)) -> BudgetResponse:
    budget = get_budget_by_id(db, budget_id)
    if budget is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Budget not found",
        )
    return budget


@router.post("", response_model=BudgetResponse, status_code=status.HTTP_201_CREATED)
def create_budget_endpoint(
    budget_in: BudgetCreate,
    db: Session = Depends(get_db),
) -> BudgetResponse:
    existing_budget = get_budget_by_month(db, budget_in.month)
    if existing_budget is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Budget for this month already exists",
        )

    return create_budget(db, budget_in)


@router.put("/{budget_id}", response_model=BudgetResponse)
def update_budget_endpoint(
    budget_id: int,
    budget_in: BudgetUpdate,
    db: Session = Depends(get_db),
) -> BudgetResponse:
    budget = get_budget_by_id(db, budget_id)
    if budget is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Budget not found",
        )

    new_month = budget_in.month if budget_in.month is not None else budget.month
    existing_budget = get_budget_by_month(db, new_month)

    if existing_budget is not None and existing_budget.id != budget.id:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Budget for this month already exists",
        )

    return update_budget(db, budget, budget_in)


@router.delete("/{budget_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_budget_endpoint(
    budget_id: int,
    db: Session = Depends(get_db),
) -> None:
    budget = get_budget_by_id(db, budget_id)
    if budget is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Budget not found",
        )

    delete_budget(db, budget)