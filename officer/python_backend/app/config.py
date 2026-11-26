from dataclasses import dataclass
import os
from pathlib import Path

from dotenv import load_dotenv


load_dotenv()


def _positive_int(name: str, default: int) -> int:
    value = os.getenv(name, str(default))
    try:
        parsed = int(value)
    except ValueError as error:
        raise ValueError(f"{name} must be a whole number") from error
    if parsed <= 0:
        raise ValueError(f"{name} must be greater than zero")
    return parsed


@dataclass(frozen=True)
class Settings:
    firebase_project_id: str
    service_account_path: Path | None
    default_processing_minutes: int
    min_historical_samples: int
    history_lookback_days: int
    allowed_origins: list[str]


def get_settings() -> Settings:
    service_account_value = os.getenv("FIREBASE_SERVICE_ACCOUNT_PATH", "").strip()
    origins = [origin.strip() for origin in os.getenv("ALLOWED_ORIGINS", "http://localhost:5173").split(",") if origin.strip()]
    return Settings(
        firebase_project_id=os.getenv("FIREBASE_PROJECT_ID", "smart-farmer-procurement").strip(),
        service_account_path=Path(service_account_value) if service_account_value else None,
        default_processing_minutes=_positive_int("DEFAULT_PROCESSING_MINUTES", 15),
        min_historical_samples=_positive_int("MIN_HISTORICAL_SAMPLES", 5),
        history_lookback_days=_positive_int("HISTORY_LOOKBACK_DAYS", 90),
        allowed_origins=origins,
    )
