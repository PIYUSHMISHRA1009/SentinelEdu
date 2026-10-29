from typing import List

from pydantic import field_validator, model_validator
from pydantic_settings import BaseSettings

DEVELOPMENT_SECRET_KEY = "development-only-secret-key-not-for-production"


class Settings(BaseSettings):
    # App
    APP_NAME: str = "InsightFlow Edu"
    ENVIRONMENT: str = "development"
    DEBUG: bool = True
    API_V1_STR: str = "/api/v1"

    # Security
    SECRET_KEY: str = ""
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days

    # Database
    DATABASE_URL: str = "postgresql://postgres:postgres@localhost:5432/insightflow"

    # CORS
    BACKEND_CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:5173",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173",
    ]

    # ML Model
    MODEL_PATH: str = "app/ml/risk_model.pkl"

    # OpenAI (for stretch features)
    OPENAI_API_KEY: str = ""

    @field_validator("DEBUG", mode="before")
    @classmethod
    def normalize_debug_value(cls, value):
        """Accept common deployment labels while keeping DEBUG a boolean."""
        if isinstance(value, str):
            normalized = value.strip().lower()
            if normalized in {"release", "production", "prod"}:
                return False
            if normalized in {"development", "dev"}:
                return True
        return value

    @model_validator(mode="after")
    def require_or_default_secret_key(self):
        if self.SECRET_KEY.strip():
            return self
        if self.ENVIRONMENT.lower() == "production":
            raise ValueError("SECRET_KEY must be set when ENVIRONMENT is production")
        self.SECRET_KEY = DEVELOPMENT_SECRET_KEY
        return self

    class Config:
        case_sensitive = True
        env_file = ".env"


settings = Settings()
