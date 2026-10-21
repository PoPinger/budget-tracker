from datetime import date, datetime

from pydantic import BaseModel, ConfigDict, Field

from backend.app.schemas.amount import Amount


class IncomeCreate(BaseModel):
    name: str = Field(min_length=2, max_length=255)
    amount: Amount = Field(gt=0)
    income_date: date


class IncomeUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=2, max_length=255)
    amount: Amount | None = Field(default=None, gt=0)
    income_date: date | None = None


class IncomeResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    month: date
    name: str
    amount: float
    income_date: date
    created_at: datetime
    updated_at: datetime
