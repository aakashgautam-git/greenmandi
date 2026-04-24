"""
config/settings.py — Pydantic settings loaded from .env
"""
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    # Blockchain
    polygon_rpc_url: str = "https://rpc-amoy.polygon.technology"
    private_key: str = ""
    energy_token_address: str = ""
    energy_marketplace_address: str = ""

    # Database
    database_url: str = "sqlite+aiosqlite:///./solarix.db"

    # JWT
    secret_key: str = "changeme_please_use_a_real_random_secret"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 60


settings = Settings()
