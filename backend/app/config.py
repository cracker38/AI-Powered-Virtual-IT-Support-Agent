from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    app_name: str = "CYPADI Virtual IT Support Backend"
    environment: str = "development"
    debug: bool = True

    # Database (defaults tailored for local XAMPP)
    mysql_user: str = "root"
    mysql_password: str = ""
    mysql_host: str = "localhost"
    mysql_port: int = 3306
    mysql_db: str = "cypadi_support"

    # Redis (for caching, sessions, Celery broker)
    redis_host: str = "localhost"
    redis_port: int = 6379
    redis_db: int = 0
    redis_password: str | None = None

    # Celery
    celery_broker_url: str | None = None
    celery_result_backend: str | None = None

    # Security / Auth
    auth_jwt_audience: str = "cypadi-virtual-it-support"
    auth_jwt_issuer: str = "cypadi-idp"
    auth_jwks_url: str | None = None

    # CORS
    cors_origins: list[str] = ["http://localhost:3000", "http://localhost:5173"]

    # Local JWT secret for dev email/password login
    auth_secret_key: str = "change-me-in-production"

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


@lru_cache
def get_settings() -> Settings:
    return Settings()

