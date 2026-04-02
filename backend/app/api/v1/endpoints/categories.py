from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from backend.app.core.db import get_db
from backend.app.schemas.category import CategoryCreate, CategoryResponse, CategoryUpdate
from backend.app.services.category_service import (
    create_category,
    delete_category,
    get_all_categories,
    get_category_by_id,
    get_existing_category_by_month_and_name,
    update_category,
)

router = APIRouter(prefix="/categories", tags=["Categories"])


@router.get("", response_model=list[CategoryResponse])
def list_categories(db: Session = Depends(get_db)) -> list[CategoryResponse]:
    return get_all_categories(db)


@router.get("/{category_id}", response_model=CategoryResponse)
def get_category(category_id: int, db: Session = Depends(get_db)) -> CategoryResponse:
    category = get_category_by_id(db, category_id)
    if category is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Category not found",
        )
    return category


@router.post("", response_model=CategoryResponse, status_code=status.HTTP_201_CREATED)
def create_category_endpoint(
    category_in: CategoryCreate,
    db: Session = Depends(get_db),
) -> CategoryResponse:
    existing_category = get_existing_category_by_month_and_name(
        db,
        category_in.month,
        category_in.name,
    )
    if existing_category is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Category with this name already exists for this month",
        )

    return create_category(db, category_in)


@router.put("/{category_id}", response_model=CategoryResponse)
def update_category_endpoint(
    category_id: int,
    category_in: CategoryUpdate,
    db: Session = Depends(get_db),
) -> CategoryResponse:
    category = get_category_by_id(db, category_id)
    if category is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Category not found",
        )

    new_month = category_in.month if category_in.month is not None else category.month
    new_name = category_in.name if category_in.name is not None else category.name

    existing_category = get_existing_category_by_month_and_name(
        db,
        new_month,
        new_name,
    )

    if existing_category is not None and existing_category.id != category.id:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Category with this name already exists for this month",
        )

    return update_category(db, category, category_in)


@router.delete("/{category_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_category_endpoint(
    category_id: int,
    db: Session = Depends(get_db),
) -> None:
    category = get_category_by_id(db, category_id)
    if category is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Category not found",
        )

    delete_category(db, category)