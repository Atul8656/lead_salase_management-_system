from pydantic_settings import BaseSettings
from functools import lru_cache

class Settings(BaseSettings):
    DATABASE_URL: str
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440  # Match .env
    # Comma-separated origins for browser (Cloudflare Pages, tunnel URL, etc.). Empty = allow all.
    CORS_ORIGINS: str = ""
    EMAIL_HOST: str = ""
    EMAIL_PORT: int = 0
    EMAIL_USER: str = ""
    EMAIL_PASS: str = ""

    class Config:
        env_file = ".env"

    @property
    def sqlalchemy_database_url(self) -> str:
        if self.DATABASE_URL.startswith("postgresql://") and "+psycopg" not in self.DATABASE_URL:
            return self.DATABASE_URL.replace("postgresql://", "postgresql+psycopg://", 1)
        return self.DATABASE_URL

@lru_cache()
def get_settings():
    return Settings()

settings = get_settings()
