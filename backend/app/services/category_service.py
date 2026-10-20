from datetime import date

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from backend.app.models.category import Category
from backend.app.models.user import User
from backend.app.schemas.category import CategoryCreate, CategoryUpdate

DUPLICATE_CATEGORY_DETAIL = "Kategoria o tej nazwie już istnieje w tym miesiącu."
CATEGORY_UNIQUE_CONSTRAINT = "uq_categories_user_id_month_name"


def _raise_duplicate() -> None:
    raise HTTPException(
        status_code=status.HTTP_409_CONFLICT,
        detail=DUPLICATE_CATEGORY_DETAIL,
    )


def _ensure_name_available(
    db: Session,
    current_user: User,
    month: date,
    name: str,
    exclude_category_id: int | None = None,
) -> None:
    statement = select(Category.id).where(
        Category.user_id == current_user.id,
        Category.month == month,
        Category.name == name,
    )
    if exclude_category_id is not None:
        statement = statement.where(Category.id != exclude_category_id)

    if db.scalar(statement) is not None:
        _raise_duplicate()


def _commit(db: Session) -> None:
    # Dwa równoległe żądania mogą minąć sprawdzenie powyżej; wtedy decyduje constraint w bazie.
    try:
        db.commit()
    except IntegrityError as error:
        db.rollback()
        constraint = getattr(getattr(error.orig, "diag", None), "constraint_name", None)
        if constraint == CATEGORY_UNIQUE_CONSTRAINT:
            _raise_duplicate()
        raise


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
    _ensure_name_available(db, current_user, payload.month, payload.name.strip())

    category = Category(
        user_id=current_user.id,
        month=payload.month,
        name=payload.name.strip(),
        limit_amount=payload.limit_amount,
    )

    db.add(category)
    _commit(db)
    db.refresh(category)
    return category


def update_category(
    db: Session,
    category_id: int,
    payload: CategoryUpdate,
    current_user: User,
) -> Category:
    category = get_category_or_404(db, category_id, current_user)

    new_month = payload.month if payload.month is not None else category.month
    new_name = payload.name.strip() if payload.name is not None else category.name
    _ensure_name_available(db, current_user, new_month, new_name, exclude_category_id=category.id)

    category.month = new_month
    category.name = new_name
    if payload.limit_amount is not None:
        category.limit_amount = payload.limit_amount

    _commit(db)
    db.refresh(category)
    return category


def delete_category(db: Session, category_id: int, current_user: User) -> None:
    category = get_category_or_404(db, category_id, current_user)
    db.delete(category)
    db.commit()