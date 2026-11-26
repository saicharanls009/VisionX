import os
import sys
from contextlib import asynccontextmanager

sys.path.insert(0, os.path.abspath("."))

from app.main import app as fastapi_app
from app.config import get_settings
from app.firebase_client import InMemoryFirestoreRepository
from tests.test_api import build_mock_repository
import app.security

mock_repo = build_mock_repository()
settings = get_settings()

@asynccontextmanager
async def mock_lifespan(application):
    application.state.settings = settings
    application.state.repository = mock_repo
    yield

fastapi_app.router.lifespan_context = mock_lifespan

# Mock Firebase ID token verification for test officer
def mock_verify_id_token(token: str, check_revoked: bool = True):
    if token == "officer-token":
        return {"uid": "officer-uid-123"}
    elif token == "farmer-token":
        return {"uid": "farmer-uid-456"}
    raise ValueError("Invalid token")

app.security.auth.verify_id_token = mock_verify_id_token

app = fastapi_app

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000, log_level="info")
