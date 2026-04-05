from datetime import date, datetime

from pydantic import BaseModel, ConfigDict, Field


class CategoryCreate(BaseModel):
    month: date
    name: str = Field(min_length=2, max_length=255)
    limit_amount: float = Field(gt=0)


class CategoryUpdate(BaseModel):
    month: date | None = None
    name: str | None = Field(default=None, min_length=2, max_length=255)
    limit_amount: float | None = Field(default=None, gt=0)


class CategoryResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    month: date
    name: str
    limit_amount: float
    created_at: datetime
    updated_at: datetime