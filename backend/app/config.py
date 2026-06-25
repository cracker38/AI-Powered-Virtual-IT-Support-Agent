from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    app_name: str = "AI-Powered Virtual IT Support Agent"
    database_url: str = "sqlite:///./data.db"
    secret_key: str = "CHANGE_ME_IN_PRODUCTION"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 60

    class Config:
        env_file = ".env"


settings = Settings()

