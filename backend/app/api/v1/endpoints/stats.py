from datetime import date

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from backend.app.core.db import get_db
from backend.app.schemas.stats import MonthOverviewResponse
from backend.app.services.stats_service import build_month_overview

router = APIRouter(prefix="/stats", tags=["Stats"])


@router.get("/month-overview", response_model=MonthOverviewResponse)
def get_month_overview(
    month: date = Query(...),
    db: Session = Depends(get_db),
) -> MonthOverviewResponse:
    return build_month_overview(db, month)