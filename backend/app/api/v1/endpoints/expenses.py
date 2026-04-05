from datetime import date

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from backend.app.core.db import get_db
from backend.app.core.security import get_current_user
from backend.app.models.expense import Expense
from backend.app.models.user import User
from backend.app.schemas.expense import (
    ExpenseCreate,
    ExpenseUpdate,
    ExpenseWithCategoryResponse,
)
from backend.app.services.expense_service import (
    create_expense,
    delete_expense,
    get_expense_or_404,
    list_expenses,
    update_expense,
)

router = APIRouter()


def _to_expense_response(expense: Expense) -> ExpenseWithCategoryResponse:
    return ExpenseWithCategoryResponse(
        id=expense.id,
        user_id=expense.user_id,
        category_id=expense.category_id,
        category_name=expense.category.name if expense.category else "",
        name=expense.name,
        amount=float(expense.amount),
        expense_date=expense.expense_date,
        notes=expense.notes,
        created_at=expense.created_at,
        updated_at=expense.updated_at,
    )


@router.get("/", response_model=list[ExpenseWithCategoryResponse])
def get_expenses(
    month: date | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[ExpenseWithCategoryResponse]:
    expenses = list_expenses(db, current_user, month)
    return [_to_expense_response(expense) for expense in expenses]


@router.post("/", response_model=ExpenseWithCategoryResponse, status_code=status.HTTP_201_CREATED)
def create_expense_endpoint(
    payload: ExpenseCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ExpenseWithCategoryResponse:
    expense = create_expense(db, payload, current_user)
    return _to_expense_response(expense)


@router.get("/{expense_id}", response_model=ExpenseWithCategoryResponse)
def get_expense(
    expense_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ExpenseWithCategoryResponse:
    expense = get_expense_or_404(db, expense_id, current_user)
    return _to_expense_response(expense)


@router.put("/{expense_id}", response_model=ExpenseWithCategoryResponse)
def update_expense_endpoint(
    expense_id: int,
    payload: ExpenseUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ExpenseWithCategoryResponse:
    expense = update_expense(db, expense_id, payload, current_user)
    return _to_expense_response(expense)


@router.delete("/{expense_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_expense_endpoint(
    expense_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> None:
    delete_expense(db, expense_id, current_user)