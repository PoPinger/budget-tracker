from datetime import date
from decimal import Decimal, ROUND_HALF_UP

from sqlalchemy import extract, select
from sqlalchemy.orm import Session

from backend.app.models.budget import Budget
from backend.app.models.category import Category
from backend.app.models.expense import Expense
from backend.app.schemas.stats import CategorySummaryItem, MonthOverviewResponse


ZERO = Decimal("0.00")
HUNDRED = Decimal("100.00")


def to_money(value: Decimal | int | float | None) -> Decimal:
    if value is None:
        return ZERO
    return Decimal(value).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)


def calculate_percent(part: Decimal, whole: Decimal) -> Decimal:
    if whole <= 0:
        return ZERO
    return ((part / whole) * HUNDRED).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)


def get_budget_for_month(db: Session, month_value: date) -> Budget | None:
    statement = select(Budget).where(Budget.month == month_value)
    return db.scalar(statement)


def get_categories_for_month(db: Session, month_value: date) -> list[Category]:
    statement = (
        select(Category)
        .where(Category.month == month_value)
        .order_by(Category.name.asc())
    )
    return list(db.scalars(statement).all())


def get_expenses_for_month(db: Session, year: int, month: int) -> list[Expense]:
    statement = (
        select(Expense)
        .where(extract("year", Expense.expense_date) == year)
        .where(extract("month", Expense.expense_date) == month)
        .order_by(Expense.expense_date.desc(), Expense.id.desc())
    )
    return list(db.scalars(statement).all())


def build_month_overview(db: Session, month_value: date) -> MonthOverviewResponse:
    budget = get_budget_for_month(db, month_value)
    categories = get_categories_for_month(db, month_value)
    expenses = get_expenses_for_month(db, month_value.year, month_value.month)

    total_budget = to_money(budget.total_limit if budget else ZERO)
    total_spent = to_money(sum((expense.amount for expense in expenses), start=ZERO))
    remaining_budget = to_money(total_budget - total_spent)
    budget_usage_percent = calculate_percent(total_spent, total_budget)

    category_spent_map: dict[int, Decimal] = {}
    for expense in expenses:
        if expense.category_id not in category_spent_map:
            category_spent_map[expense.category_id] = ZERO
        category_spent_map[expense.category_id] = to_money(
            category_spent_map[expense.category_id] + expense.amount
        )

    category_items: list[CategorySummaryItem] = []
    exceeded_categories_count = 0

    for category in categories:
        spent_amount = to_money(category_spent_map.get(category.id, ZERO))
        category_limit = to_money(category.limit_amount)
        remaining_amount = to_money(category_limit - spent_amount)
        usage_percent = calculate_percent(spent_amount, category_limit)
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