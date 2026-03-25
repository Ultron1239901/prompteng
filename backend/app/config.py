from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    openrouter_api_key: str = ""
    openrouter_base_url: str = "https://openrouter.ai/api/v1"
    # Optional OpenRouter ranking headers (see https://openrouter.ai/docs)
    openrouter_http_referer: str = ""
    openrouter_app_title: str = "PromptLab AI"

    default_model: str = "openai/gpt-4o-mini"
    database_url: str = "sqlite:///./promptlab.db"
    postgres_url: str = ""
    cors_origins: str = "http://localhost:5173,http://127.0.0.1:5173"

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]

    @property
    def resolved_database_url(self) -> str:
        return self.postgres_url.strip() or self.database_url


@lru_cache
def get_settings() -> Settings:
    return Settings()
