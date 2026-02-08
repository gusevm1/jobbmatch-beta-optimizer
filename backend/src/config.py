from pathlib import Path

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    ANTHROPIC_API_KEY: str = ""
    BACKEND_PORT: int = 8000
    FRONTEND_URL: str = "http://localhost:3000"
    DATA_DIR: Path = Path("data")

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}


settings = Settings()
