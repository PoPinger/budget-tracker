from datetime import date

from pydantic import BaseModel


class CategorySummaryItem(BaseModel):
    category_id: int
    category_name: str
    category_limit: float
    spent_amount: float
    remaining_amount: float
    usage_percent: float
    is_limit_exceeded: bool


class MonthOverviewResponse(BaseModel):
    month: date
    budget_id: int | None
    total_budget: float
    total_spent: float
    remaining_budget: float
    budget_usage_percent: float
    category_count: int
    expense_count: int
    exceeded_categories_count: int
    categories: list[CategorySummaryItem]