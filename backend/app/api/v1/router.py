from fastapi import APIRouter

from backend.app.api.v1.endpoints import (
    auth,
    budgets,
    categories,
    expenses,
    health,
    incomes,
    months,
    stats,
)

api_router = APIRouter()

api_router.include_router(health.router, tags=["default"])
api_router.include_router(auth.router, prefix="/auth", tags=["Auth"])
api_router.include_router(categories.router, prefix="/categories", tags=["Categories"])
api_router.include_router(budgets.router, prefix="/budgets", tags=["Budgets"])
api_router.include_router(expenses.router, prefix="/expenses", tags=["Expenses"])
api_router.include_router(stats.router, prefix="/stats", tags=["Stats"])
api_router.include_router(months.router, prefix="/months", tags=["Months"])
api_router.include_router(incomes.router, prefix="/incomes", tags=["Incomes"])