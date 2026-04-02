from datetime import date, datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field


class ExpenseBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=150)
    amount: Decimal = Field(..., gt=0)
    expense_date: date
    notes: str | None = Field(default=None, max_length=2000)
    category_id: int = Field(..., gt=0)


class ExpenseCreate(ExpenseBase):
    pass


class ExpenseUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=150)
    amount: Decimal | None = Field(default=None, gt=0)
    expense_date: date | None = None
    notes: str | None = Field(default=None, max_length=2000)
    category_id: int | None = Field(default=None, gt=0)


class ExpenseResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    amount: Decimal
    expense_date: date
    notes: str | None
    category_id: int
    created_at: datetime
    updated_at: datetime


class ExpenseWithCategoryResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    amount: Decimal
    expense_date: date
    notes: str | None
    category_id: int
    category_name: str
    created_at: datetime
    updated_at: datetime