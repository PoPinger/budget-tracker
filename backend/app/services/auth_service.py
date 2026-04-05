from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from backend.app.core.security import create_access_token, hash_password, verify_password
from backend.app.models.user import User
from backend.app.schemas.auth import UserLogin, UserRegister


def get_user_by_email(db: Session, email: str) -> User | None:
    statement = select(User).where(User.email == email)
    return db.scalar(statement)


def register_user(db: Session, payload: UserRegister) -> tuple[User, str]:
    existing_user = get_user_by_email(db, payload.email.lower())

    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Użytkownik z tym adresem e-mail już istnieje.",
        )

    user = User(
        email=payload.email.lower(),
        hashed_password=hash_password(payload.password),
        full_name=payload.full_name.strip(),
    )

    db.add(user)
    db.commit()
    db.refresh(user)

    access_token = create_access_token(subject=str(user.id))
    return user, access_token


def login_user(db: Session, payload: UserLogin) -> tuple[User, str]:
    user = get_user_by_email(db, payload.email.lower())

    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Nieprawidłowy e-mail lub hasło.",
        )

    access_token = create_access_token(subject=str(user.id))
    return user, access_token