from datetime import date, datetime

from pydantic import BaseModel, ConfigDict, Field

from backend.app.schemas.amount import Amount


class BudgetCreate(BaseModel):
    month: date
    total_limit: Amount = Field(gt=0)


class BudgetUpdate(BaseModel):
    month: date | None = None
    total_limit: Amount | None = Field(default=None, gt=0)


class BudgetResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    month: date
    total_limit: float
    created_at: datetime
    updated_at: datetime