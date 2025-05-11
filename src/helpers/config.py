import os
from functools import lru_cache

from pydantic import ConfigDict
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    OPENAI_API_KEY: str
    LLM_MODEL: str = "openai__gpt-4.1"
    EMBEDDING_MODEL: str = "openai__text-embedding-3-small"
    EMBEDDING_LENGTH: int = 1536
    # PG_VECTOR_DB_URL: str = ""

    # IS_LOCAL: bool = True

    # CON_AES_KEY: str = ""

    REDIS_HOST: str = "localhost"
    REDIS_PORT: int = 6379
    REDIS_DB: int = 1
    REDIS_PASSWORD: str = ""
    REDIS_TTL_SECONDS: int = 60 * 10  # 10 minutes

    LANGFUSE_PK: str = ""
    LANGFUSE_SK: str = ""
    LANGFUSE_HOST: str = ""

    model_config = ConfigDict(
        env_file=".env" if os.getenv("ENVIRONMENT") != "production" else None,
        extra="allow",
    )


@lru_cache()
def get_settings():
    return Settings()
