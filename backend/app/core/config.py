import secrets
import warnings

from pydantic import model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

# Lokalny frontend (vite dev / vite preview) – dozwolony tylko poza produkcją.
LOCAL_DEV_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:4173",
    "http://127.0.0.1:4173",
]


class Settings(BaseSettings):
    database_url: str
    secret_key: str = ""
    # Adres frontendu na Vercelu; kilka adresów można podać po przecinku.
    frontend_url: str = ""
    app_name: str = "Budget Tracker API"
    app_env: str = "development"
    backend_port: int = 8000

    model_config = SettingsConfigDict(
        env_file="backend/.env",
        extra="ignore",
    )

    @property
    def is_production(self) -> bool:
        return self.app_env.lower() == "production"

    @property
    def cors_origins(self) -> list[str]:
        origins = [
            origin.strip().rstrip("/")
            for origin in self.frontend_url.split(",")
            if origin.strip()
        ]
        if not self.is_production:
            origins += LOCAL_DEV_ORIGINS
        return origins

    @model_validator(mode="after")
    def check_required_secrets(self) -> "Settings":
        if self.is_production:
            if not self.secret_key:
                raise ValueError("SECRET_KEY musi być ustawiony, gdy APP_ENV=production.")
            if not self.frontend_url:
                raise ValueError("FRONTEND_URL musi być ustawiony, gdy APP_ENV=production.")
        elif not self.secret_key:
            # Lokalnie: losowy klucz na czas działania procesu (tokeny tracą ważność po restarcie).
            warnings.warn("Brak SECRET_KEY – używam losowego klucza tylko dla developmentu.")
            self.secret_key = secrets.token_urlsafe(64)
        return self


settings = Settings()
