"""
Centralized app configuration.

Everything that changes between local/dev/prod lives here and nowhere else -
no os.environ.get() calls scattered through the codebase. Pydantic settings
also gives us free validation, so a missing DATABASE_URL fails fast at
startup instead of 500-ing on the first real request.
"""
from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    environment: str = Field(default="development", alias="ENVIRONMENT")

    # --- Database -----------------------------------------------------
    # Use Neon's *pooled* connection string (the one with "-pooler" in the
    # hostname) here, not the direct one. See app/db/session.py for why -
    # asyncpg + PgBouncer transaction mode has a sharp edge around prepared
    # statements that bites people the first time they wire this up.
    database_url: str = Field(..., alias="DATABASE_URL")
    db_schema: str = Field(default="public", alias="DB_SCHEMA")
    db_pool_size: int = Field(default=5, alias="DB_POOL_SIZE")
    db_pool_max_overflow: int = Field(default=5, alias="DB_MAX_OVERFLOW")
    query_timeout_ms: int = Field(default=8000, alias="QUERY_TIMEOUT_MS")

    # --- GenAI (Groq, OpenAI-compatible endpoint) ----------------------
    groq_api_key: str = Field(..., alias="GROQ_API_KEY")
    groq_model: str = Field(default="llama-3.3-70b-versatile", alias="GROQ_MODEL")
    llm_timeout_seconds: float = Field(default=20.0, alias="LLM_TIMEOUT_SECONDS")

    # --- Guardrails -----------------------------------------------------
    max_result_rows: int = Field(default=200, alias="MAX_RESULT_ROWS")

    # --- Schema cache ----------------------------------------------------
    schema_cache_ttl_seconds: int = Field(default=300, alias="SCHEMA_CACHE_TTL_SECONDS")

    # --- CORS -------------------------------------------------------------
    # Comma separated list, e.g. "https://asksql.vercel.app,http://localhost:5173"
    allowed_origins: str = Field(default="http://localhost:5173", alias="ALLOWED_ORIGINS")

    @property
    def allowed_origins_list(self) -> list[str]:
        return [origin.strip() for origin in self.allowed_origins.split(",") if origin.strip()]


@lru_cache
def get_settings() -> Settings:
    # lru_cache means .env is only parsed once per process, which is what we
    # want - Settings() is not free and every route depends on it.
    return Settings()
