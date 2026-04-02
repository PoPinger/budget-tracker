from fastapi import APIRouter

from backend.app.api.v1.endpoints.budgets import router as budgets_router
from backend.app.api.v1.endpoints.categories import router as categories_router
from backend.app.api.v1.endpoints.db_test import router as db_test_router
from backend.app.api.v1.endpoints.expenses import router as expenses_router
from backend.app.api.v1.endpoints.health import router as health_router
from backend.app.api.v1.endpoints.stats import router as stats_router

api_router = APIRouter()
api_router.include_router(health_router)
api_router.include_router(db_test_router)
api_router.include_router(categories_router)
api_router.include_router(budgets_router)
api_router.include_router(expenses_router)
api_router.include_router(stats_router)