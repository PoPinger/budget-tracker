from datetime import date, datetime
from typing import Literal

from pydantic import BaseModel, Field, field_validator

from backend.app.schemas.amount import Amount
from backend.app.schemas.budget import BudgetResponse
from backend.app.schemas.category import CategoryResponse

MonthStatus = Literal["not_started", "active", "closed"]


class MonthResponse(BaseModel):
    month: date
    status: MonthStatus
    salary: float | None
    extra_income_total: float
    closed_at: datetime | None


class MonthSetupCategory(BaseModel):
    name: str = Field(min_length=2, max_length=255)
    limit_amount: Amount = Field(gt=0)
    is_recurring: bool = False


class MonthSetupRequest(BaseModel):
    month: date
    salary: Amount = Field(ge=0)
    total_limit: Amount = Field(gt=0)
    categories: list[MonthSetupCategory] = Field(default_factory=list)

    @field_validator("categories")
    @classmethod
    def unique_names(cls, categories: list[MonthSetupCategory]) -> list[MonthSetupCategory]:
        names = [category.name.strip() for category in categories]
        if len(names) != len(set(names)):
            raise ValueError("Nazwy kategorii w miesiącu muszą być unikalne.")
        return categories


class MonthSetupResponse(BaseModel):
    month: MonthResponse
    budget: BudgetResponse
    categories: list[CategoryResponse]


class PreviousMonthCategory(BaseModel):
    name: str
    limit_amount: float
    is_recurring: bool


class PreviousMonthResponse(BaseModel):
    month: date
    salary: float | None
    total_limit: float | None
    categories: list[PreviousMonthCategory]


class SalaryUpdate(BaseModel):
    salary: Amount = Field(ge=0)
