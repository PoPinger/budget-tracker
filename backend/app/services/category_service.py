from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from backend.app.models.category import Category
from backend.app.models.user import User
from backend.app.schemas.category import CategoryCreate, CategoryUpdate


def list_categories(db: Session, current_user: User) -> list[Category]:
    statement = (
        select(Category)
        .where(Category.user_id == current_user.id)
        .order_by(Category.month.desc(), Category.name.asc())
    )
    return list(db.scalars(statement).all())


def get_category_or_404(db: Session, category_id: int, current_user: User) -> Category:
    statement = select(Category).where(
        Category.id == category_id,
        Category.user_id == current_user.id,
    )
    category = db.scalar(statement)

    if category is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Kategoria nie została znaleziona.",
        )

    return category


def create_category(db: Session, payload: CategoryCreate, current_user: User) -> Category:
    existing = db.scalar(
        select(Category).where(
            Category.user_id == current_user.id,
            Category.month == payload.month,
            Category.name == payload.name.strip(),
        )
    )

    if existing is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Kategoria o tej nazwie już istnieje w tym miesiącu.",
        )

    category = Category(
        user_id=current_user.id,
        month=payload.month,
        name=payload.name.strip(),
        limit_amount=payload.limit_amount,
    )

    db.add(category)
    db.commit()
    db.refresh(category)
    return category


def update_category(
    db: Session,
    category_id: int,
    payload: CategoryUpdate,
    current_user: User,
) -> Category:
    category = get_category_or_404(db, category_id, current_user)

    if payload.month is not None:
        category.month = payload.month
    if payload.name is not None:
        category.name = payload.name.strip()
    if payload.limit_amount is not None:
        category.limit_amount = payload.limit_amount

    db.commit()
    db.refresh(category)
    return category


def delete_category(db: Session, category_id: int, current_user: User) -> None:
    category = get_category_or_404(db, category_id, current_user)
    db.delete(category)
    db.commit()