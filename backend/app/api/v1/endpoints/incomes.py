from datetime import date

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from backend.app.core.db import get_db
from backend.app.core.security import get_current_user
from backend.app.models.user import User
from backend.app.schemas.income import IncomeCreate, IncomeResponse, IncomeUpdate
from backend.app.services.income_service import (
    create_income,
    delete_income,
    get_income_or_404,
    list_incomes,
    update_income,
)

router = APIRouter()


@router.get("/", response_model=list[IncomeResponse])
def get_incomes(
    month: date | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[IncomeResponse]:
    return list_incomes(db, current_user, month)


@router.post("/", response_model=IncomeResponse, status_code=status.HTTP_201_CREATED)
def create_income_endpoint(
    payload: IncomeCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> IncomeResponse:
    return create_income(db, payload, current_user)


@router.get("/{income_id}", response_model=IncomeResponse)
def get_income(
    income_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> IncomeResponse:
    return get_income_or_404(db, income_id, current_user)


@router.put("/{income_id}", response_model=IncomeResponse)
def update_income_endpoint(
    income_id: int,
    payload: IncomeUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> IncomeResponse:
    return update_income(db, income_id, payload, current_user)


@router.delete("/{income_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_income_endpoint(
    income_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> None:
    delete_income(db, income_id, current_user)
