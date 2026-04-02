from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from backend.app.core.db import get_db
from backend.app.schemas.expense import (
    ExpenseCreate,
    ExpenseUpdate,
    ExpenseWithCategoryResponse,
)
from backend.app.services.expense_service import (
    create_expense,
    delete_expense,
    get_all_expenses,
    get_category_by_id,
    get_expense_by_id,
    get_expenses_by_month,
    update_expense,
)

router = APIRouter(prefix="/expenses", tags=["Expenses"])


def map_expense_to_response(expense) -> ExpenseWithCategoryResponse:
    return ExpenseWithCategoryResponse(
        id=expense.id,
        title=expense.title,
        amount=expense.amount,
        expense_date=expense.expense_date,
        notes=expense.notes,
        category_id=expense.category_id,
        category_name=expense.category.name,
        created_at=expense.created_at,
        updated_at=expense.updated_at,
    )


@router.get("", response_model=list[ExpenseWithCategoryResponse])
def list_expenses(
    year: int | None = Query(default=None, ge=2000, le=2100),
    month: int | None = Query(default=None, ge=1, le=12),
    db: Session = Depends(get_db),
) -> list[ExpenseWithCategoryResponse]:
    if year is not None and month is not None:
        expenses = get_expenses_by_month(db, year, month)
    else:
        expenses = get_all_expenses(db)

    return [map_expense_to_response(expense) for expense in expenses]


@router.get("/{expense_id}", response_model=ExpenseWithCategoryResponse)
def get_expense(expense_id: int, db: Session = Depends(get_db)) -> ExpenseWithCategoryResponse:
    expense = get_expense_by_id(db, expense_id)
    if expense is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Expense not found",
        )

    return map_expense_to_response(expense)


@router.post("", response_model=ExpenseWithCategoryResponse, status_code=status.HTTP_201_CREATED)
def create_expense_endpoint(
    expense_in: ExpenseCreate,
    db: Session = Depends(get_db),
) -> ExpenseWithCategoryResponse:
    category = get_category_by_id(db, expense_in.category_id)
    if category is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Category not found",
        )

    expense = create_expense(db, expense_in)
    return map_expense_to_response(expense)


@router.put("/{expense_id}", response_model=ExpenseWithCategoryResponse)
def update_expense_endpoint(
    expense_id: int,
    expense_in: ExpenseUpdate,
    db: Session = Depends(get_db),
) -> ExpenseWithCategoryResponse:
    expense = get_expense_by_id(db, expense_id)
    if expense is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Expense not found",
        )

    if expense_in.category_id is not None:
        category = get_category_by_id(db, expense_in.category_id)
        if category is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Category not found",
            )

    updated_expense = update_expense(db, expense, expense_in)
    return map_expense_to_response(updated_expense)


@router.delete("/{expense_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_expense_endpoint(
    expense_id: int,
    db: Session = Depends(get_db),
) -> None:
    expense = get_expense_by_id(db, expense_id)
    if expense is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Expense not found",
        )

    delete_expense(db, expense)