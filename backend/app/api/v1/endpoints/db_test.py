from fastapi import APIRouter
from sqlalchemy import text

from backend.app.core.db import engine

router = APIRouter()


@router.get("/db-test", tags=["Database"])
def db_test() -> dict[str, str]:
    with engine.connect() as connection:
        connection.execute(text("SELECT 1"))

    return {
        "status": "ok",
        "message": "Database connection works"
    }