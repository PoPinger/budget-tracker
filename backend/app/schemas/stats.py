from datetime import date
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field


class CategorySummaryItem(BaseModel):
    model_config = ConfigDict(
        json_encoders={Decimal: float}
    )

    category_id: int
    category_name: str
    category_limit: Decimal
    spent_amount: Decimal
    remaining_amount: Decimal
    usage_percent: Decimal
    is_limit_exceeded: bool


class MonthOverviewResponse(BaseModel):
    model_config = ConfigDict(
        json_encoders={Decimal: float}
    )

    month: date
    budget_id: int | None = None
    total_budget: Decimal = Field(default=Decimal("0.00"))
    total_spent: Decimal = Field(default=Decimal("0.00"))
    remaining_budget: Decimal = Field(default=Decimal("0.00"))
    budget_usage_percent: Decimal = Field(default=Decimal("0.00"))
    category_count: int = 0
    expense_count: int = 0
    exceeded_categories_count: int = 0
    categories: list[CategorySummaryItem] = []