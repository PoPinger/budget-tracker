from datetime import date
from decimal import Decimal

from sqlalchemy import select
from sqlalchemy.orm import Session

from backend.app.models.budget import Budget
from backend.app.models.category import Category
from backend.app.models.expense import Expense
from backend.app.models.user import User
from backend.app.schemas.stats import CategorySummaryItem, MonthOverviewResponse


def build_month_overview(db: Session, month_value: date, current_user: User) -> MonthOverviewResponse:
    budget = db.scalar(
        select(Budget).where(
            Budget.user_id == current_user.id,
            Budget.month == month_value,
        )
    )

    categories = list(
        db.scalars(
            select(Category).where(
                Category.user_id == current_user.id,
                Category.month == month_value,
            )
        ).all()
    )

    expenses = list(
        db.scalars(
            select(Expense).where(
                Expense.user_id == current_user.id,
                Expense.expense_date >= month_value,
                Expense.expense_date < _next_month(month_value),
            )
        ).all()
    )

    total_budget = float(budget.total_limit) if budget else 0.0
    total_spent = float(sum((expense.amount for expense in expenses), Decimal("0")))
    remaining_budget = total_budget - total_spent
    budget_usage_percent = (total_spent / total_budget * 100.0) if total_budget > 0 else 0.0

    category_items: list[CategorySummaryItem] = []
    exceeded_categories_count = 0

    for category in categories:
        spent_amount_decimal = sum(
            (expense.amount for expense in expenses if expense.category_id == category.id),
            Decimal("0"),
        )

        spent_amount = float(spent_amount_decimal)
        category_limit = float(category.limit_amount)
        remaining_amount = category_limit - spent_amount
        usage_percent = (spent_amount / category_limit * 100.0) if category_limit > 0 else 0.0
        is_limit_exceeded = spent_amount > category_limit

        if is_limit_exceeded:
            exceeded_categories_count += 1

        category_items.append(
            CategorySummaryItem(
                category_id=category.id,
                category_name=category.name,
                category_limit=category_limit,
                spent_amount=spent_amount,
                remaining_amount=remaining_amount,
                usage_percent=usage_percent,
                is_limit_exceeded=is_limit_exceeded,
            )
        )

    return MonthOverviewResponse(
        month=month_value,
        budget_id=budget.id if budget else None,
        total_budget=total_budget,
        total_spent=total_spent,
        remaining_budget=remaining_budget,
        budget_usage_percent=budget_usage_percent,
        category_count=len(categories),
        expense_count=len(expenses),
        exceeded_categories_count=exceeded_categories_count,
        categories=category_items,
    )


def _next_month(month_value: date) -> date:
    if month_value.month == 12:
        return date(month_value.year + 1, 1, 1)
    return date(month_value.year, month_value.month + 1, 1)