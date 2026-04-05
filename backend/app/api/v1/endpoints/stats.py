from datetime import date

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from backend.app.core.db import get_db
from backend.app.core.security import get_current_user
from backend.app.models.user import User
from backend.app.schemas.stats import MonthOverviewResponse
from backend.app.services.stats_service import build_month_overview

router = APIRouter()


@router.get("/month-overview", response_model=MonthOverviewResponse)
def get_month_overview(
    month: date,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> MonthOverviewResponse:
    return build_month_overview(db, month, current_user)