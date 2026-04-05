from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from backend.app.core.db import get_db
from backend.app.schemas.auth import AuthResponse, UserLogin, UserRegister
from backend.app.services.auth_service import login_user, register_user

router = APIRouter()


@router.post("/register", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
def register(payload: UserRegister, db: Session = Depends(get_db)) -> AuthResponse:
    user, access_token = register_user(db, payload)
    return AuthResponse(user=user, access_token=access_token, token_type="bearer")


@router.post("/login", response_model=AuthResponse)
def login(payload: UserLogin, db: Session = Depends(get_db)) -> AuthResponse:
    user, access_token = login_user(db, payload)
    return AuthResponse(user=user, access_token=access_token, token_type="bearer")