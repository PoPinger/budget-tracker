from datetime import date, datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field


class CategoryBase(BaseModel):
    month: date
    name: str = Field(..., min_length=1, max_length=100)
    limit_amount: Decimal = Field(..., gt=0)


class CategoryCreate(CategoryBase):
    pass


class CategoryUpdate(BaseModel):
    month: date | None = None
    name: str | None = Field(default=None, min_length=1, max_length=100)
    limit_amount: Decimal | None = Field(default=None, gt=0)


class CategoryResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    month: date
    name: str
    limit_amount: Decimal
    created_at: datetime
    updated_at: datetime