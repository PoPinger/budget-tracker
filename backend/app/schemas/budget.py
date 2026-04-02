from datetime import date, datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field


class BudgetBase(BaseModel):
    month: date
    total_limit: Decimal = Field(..., gt=0)


class BudgetCreate(BudgetBase):
    pass


class BudgetUpdate(BaseModel):
    month: date | None = None
    total_limit: Decimal | None = Field(default=None, gt=0)


class BudgetResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    month: date
    total_limit: Decimal
    created_at: datetime
    updated_at: datetime