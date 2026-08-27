import os
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field


class Settings(BaseSettings):
    OPENAI_API_KEY: str
    OPENAI_BASE_URL: str = "https://openrouter.ai/api/v1"
    """
    Application Settings loaded from environment variables and .env file.
    """
    # Database URL: default to SQLite if not provided, for easy testing
    database_url: str = Field(default="sqlite:///./codereview.db", validation_alias="DATABASE_URL")

    # OpenAI API Key (Required for AI features, defaulted to empty string for testing safety)
    openai_api_key: str = Field(default="", validation_alias="OPENAI_API_KEY")

    # App running parameters
    port: int = Field(default=8000, validation_alias="PORT")
    host: str = Field(default="0.0.0.0", validation_alias="HOST")

    # Analysis limits
    max_files_to_analyze: int = Field(default=20, validation_alias="MAX_FILES_TO_ANALYZE")

    # Read .env file if available
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")


# Instantiate a global settings object
settings = Settings()
