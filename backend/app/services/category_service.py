from sqlalchemy import select
from sqlalchemy.orm import Session

from backend.app.models.category import Category
from backend.app.schemas.category import CategoryCreate, CategoryUpdate


def get_all_categories(db: Session) -> list[Category]:
    statement = select(Category).order_by(Category.month.desc(), Category.name.asc())
    return list(db.scalars(statement).all())


def get_category_by_id(db: Session, category_id: int) -> Category | None:
    return db.get(Category, category_id)


def get_existing_category_by_month_and_name(
    db: Session,
    month,
    name: str,
) -> Category | None:
    statement = select(Category).where(
        Category.month == month,
        Category.name == name,
    )
    return db.scalar(statement)


def create_category(db: Session, category_in: CategoryCreate) -> Category:
    category = Category(
        month=category_in.month,
        name=category_in.name,
        limit_amount=category_in.limit_amount,
    )
    db.add(category)
    db.commit()
    db.refresh(category)
    return category


def update_category(
    db: Session,
    category: Category,
    category_in: CategoryUpdate,
) -> Category:
    update_data = category_in.model_dump(exclude_unset=True)

    for field, value in update_data.items():
        setattr(category, field, value)

    db.add(category)
    db.commit()
    db.refresh(category)
    return category


def delete_category(db: Session, category: Category) -> None:
    db.delete(category)
    db.commit()