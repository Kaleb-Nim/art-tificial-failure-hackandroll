from pydantic_settings import BaseSettings
from functools import lru_cache
import logging
from typing import Optional

logger = logging.getLogger(__name__)

class Settings(BaseSettings):
    OPENAI_API_KEY: str
    GEMINI_API_KEY: Optional[str] = None
    MODEL_NAME: str = "gpt-4o-2024-08-06"
    GEMINI_MODEL_NAME: str = "gemini-pro-vision"
    MAX_TOKENS: int = 1000
    TEMPERATURE: float = 0.8
    ENV: str = "development"

    class Config:
        env_file = ".env"
        env_file_encoding = 'utf-8'
        case_sensitive = True

    @classmethod
    def validate_environment(cls) -> None:
        """Validate that required environment variables are set."""
        settings = cls()
        missing_vars = []
        
        if not settings.OPENAI_API_KEY:
            missing_vars.append("OPENAI_API_KEY")
        
        if not settings.GEMINI_API_KEY:
            missing_vars.append("GEMINI_API_KEY")
        
        if missing_vars:
            raise ValueError(
                f"Missing required environment variables: {', '.join(missing_vars)}\n"
                "Please ensure all required environment variables are set."
            )

@lru_cache()
def get_settings() -> Settings:
    """Get cached settings instance with validation."""
    try:
        settings = Settings()
        Settings.validate_environment()
        logger.info(f"Loading settings for environment: {settings.ENV}")
        return settings
    except Exception as e:
        logger.error(f"Failed to load settings: {str(e)}")
        raise
