from datetime import date

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from backend.app.core.db import get_db
from backend.app.core.security import get_current_user
from backend.app.models.user import User
from backend.app.schemas.month import (
    MonthResponse,
    MonthSetupRequest,
    MonthSetupResponse,
    PreviousMonthResponse,
    SalaryUpdate,
)
from backend.app.services.month_service import (
    build_month_response,
    close_month,
    reopen_month,
    update_salary,
)
from backend.app.services.month_setup_service import get_previous_month_template, setup_month

router = APIRouter()


@router.post("/setup", response_model=MonthSetupResponse, status_code=status.HTTP_201_CREATED)
def setup_month_endpoint(
    payload: MonthSetupRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> MonthSetupResponse:
    return setup_month(db, payload, current_user)


@router.get("/{month}", response_model=MonthResponse)
def get_month_endpoint(
    month: date,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> MonthResponse:
    return build_month_response(db, month, current_user)


@router.get("/{month}/previous", response_model=PreviousMonthResponse)
def get_previous_month_endpoint(
    month: date,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> PreviousMonthResponse:
    return get_previous_month_template(db, month, current_user)


@router.post("/{month}/close", response_model=MonthResponse)
def close_month_endpoint(
    month: date,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> MonthResponse:
    return close_month(db, month, current_user)


@router.post("/{month}/reopen", response_model=MonthResponse)
def reopen_month_endpoint(
    month: date,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> MonthResponse:
    return reopen_month(db, month, current_user)


@router.put("/{month}/salary", response_model=MonthResponse)
def update_salary_endpoint(
    month: date,
    payload: SalaryUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> MonthResponse:
    return update_salary(db, month, payload.salary, current_user)
