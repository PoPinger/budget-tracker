from datetime import date

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from backend.app.models.budget import Budget
from backend.app.models.category import Category
from backend.app.models.month import MONTH_STATUS_ACTIVE, Month
from backend.app.models.user import User
from backend.app.schemas.month import (
    MonthSetupRequest,
    MonthSetupResponse,
    PreviousMonthCategory,
    PreviousMonthResponse,
)
from backend.app.services.month_service import (
    build_month_response,
    first_of_month,
    get_month,
    previous_month,
)
from backend.app.services.recurring_service import sync_recurring_expense

ALREADY_STARTED_DETAIL = "Ten miesiąc został już rozpoczęty."


def setup_month(db: Session, payload: MonthSetupRequest, current_user: User) -> MonthSetupResponse:
    """Kreator miesiąca: wypłata, budżet, kategorie i wydatki cykliczne w jednej transakcji."""
    month_value = first_of_month(payload.month)

    already_used = (
        get_month(db, month_value, current_user) is not None
        or db.scalar(
            select(Budget.id).where(Budget.user_id == current_user.id, Budget.month == month_value)
        )
        is not None
        or db.scalar(
            select(Category.id).where(Category.user_id == current_user.id, Category.month == month_value)
        )
        is not None
    )
    if already_used:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=ALREADY_STARTED_DETAIL)

    try:
        db.add(
            Month(
                user_id=current_user.id,
                month=month_value,
                salary=payload.salary,
                status=MONTH_STATUS_ACTIVE,
            )
        )
        budget = Budget(user_id=current_user.id, month=month_value, total_limit=payload.total_limit)
        db.add(budget)

        categories = []
        for item in payload.categories:
            category = Category(
                user_id=current_user.id,
                month=month_value,
                name=item.name.strip(),
                limit_amount=item.limit_amount,
                is_recurring=item.is_recurring,
            )
            db.add(category)
            categories.append(category)

        db.flush()
        for category in categories:
            if category.is_recurring:
                sync_recurring_expense(db, category)

        db.commit()
    except IntegrityError:
        # Równoległe żądanie zdążyło rozpocząć ten miesiąc; nic nie zostaje zapisane.
        db.rollback()
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=ALREADY_STARTED_DETAIL)

    db.refresh(budget)
    for category in categories:
        db.refresh(category)

    return MonthSetupResponse(
        month=build_month_response(db, month_value, current_user),
        budget=budget,
        categories=sorted(categories, key=lambda category: category.name),
    )


def get_previous_month_template(db: Session, month: date, current_user: User) -> PreviousMonthResponse:
    """Dane z poprzedniego miesiąca do skopiowania w kreatorze (wszystko edytowalne)."""
    source = previous_month(first_of_month(month))
    month_row = get_month(db, source, current_user)
    budget = db.scalar(
        select(Budget).where(Budget.user_id == current_user.id, Budget.month == source)
    )
    categories = db.scalars(
        select(Category)
        .where(Category.user_id == current_user.id, Category.month == source)
        .order_by(Category.name.asc())
    ).all()

    return PreviousMonthResponse(
        month=source,
        salary=float(month_row.salary) if month_row and month_row.salary is not None else None,
        total_limit=float(budget.total_limit) if budget else None,
        categories=[
            PreviousMonthCategory(
                name=category.name,
                limit_amount=float(category.limit_amount),
                is_recurring=category.is_recurring,
            )
            for category in categories
        ],
    )
