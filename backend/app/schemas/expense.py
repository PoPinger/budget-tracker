from datetime import date, datetime

from pydantic import BaseModel, ConfigDict, Field


class ExpenseCreate(BaseModel):
    category_id: int
    name: str = Field(min_length=2, max_length=255)
    amount: float = Field(gt=0)
    expense_date: date
    notes: str | None = None


class ExpenseUpdate(BaseModel):
    category_id: int | None = None
    name: str | None = Field(default=None, min_length=2, max_length=255)
    amount: float | None = Field(default=None, gt=0)
    expense_date: date | None = None
    notes: str | None = None


class ExpenseResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    category_id: int
    name: str
    amount: float
    expense_date: date
    notes: str | None
    created_at: datetime
    updated_at: datetime


class ExpenseWithCategoryResponse(BaseModel):
    id: int
    user_id: int
    category_id: int
    category_name: str
    name: str
    amount: float
    expense_date: date
    notes: str | None
    created_at: datetime
    updated_at: datetime