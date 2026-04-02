from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    database_url: str
    app_name: str = "Budget Tracker API"
    app_env: str = "development"
    backend_port: int = 8000

    model_config = SettingsConfigDict(
        env_file="backend/.env",
        extra="ignore",
    )


settings = Settings()