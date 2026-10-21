from datetime import date, datetime

from pydantic import BaseModel, ConfigDict, Field

from backend.app.schemas.amount import Amount


class CategoryCreate(BaseModel):
    month: date
    name: str = Field(min_length=2, max_length=255)
    limit_amount: Amount = Field(gt=0)
    is_recurring: bool = False


class CategoryUpdate(BaseModel):
    month: date | None = None
    name: str | None = Field(default=None, min_length=2, max_length=255)
    limit_amount: Amount | None = Field(default=None, gt=0)
    is_recurring: bool | None = None


class CategoryResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    month: date
    name: str
    limit_amount: float
    is_recurring: bool
    created_at: datetime
    updated_at: datetime