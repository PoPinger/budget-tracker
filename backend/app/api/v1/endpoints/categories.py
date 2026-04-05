from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from backend.app.core.db import get_db
from backend.app.core.security import get_current_user
from backend.app.models.user import User
from backend.app.schemas.category import CategoryCreate, CategoryResponse, CategoryUpdate
from backend.app.services.category_service import (
    create_category,
    delete_category,
    get_category_or_404,
    list_categories,
    update_category,
)

router = APIRouter()


@router.get("/", response_model=list[CategoryResponse])
def get_categories(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[CategoryResponse]:
    return list_categories(db, current_user)


@router.post("/", response_model=CategoryResponse, status_code=status.HTTP_201_CREATED)
def create_category_endpoint(
    payload: CategoryCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> CategoryResponse:
    return create_category(db, payload, current_user)


@router.get("/{category_id}", response_model=CategoryResponse)
def get_category(
    category_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> CategoryResponse:
    return get_category_or_404(db, category_id, current_user)


@router.put("/{category_id}", response_model=CategoryResponse)
def update_category_endpoint(
    category_id: int,
    payload: CategoryUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> CategoryResponse:
    return update_category(db, category_id, payload, current_user)


@router.delete("/{category_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_category_endpoint(
    category_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> None:
    delete_category(db, category_id, current_user)