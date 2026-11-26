from typing import Annotated

from fastapi import Depends, HTTPException, Request, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from firebase_admin import auth

from .firebase_client import FirestoreRepository


bearer_scheme = HTTPBearer(auto_error=False)


def get_repository(request: Request) -> FirestoreRepository:
    return request.app.state.repository


def require_officer(
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(bearer_scheme)],
    repository: Annotated[FirestoreRepository, Depends(get_repository)],
) -> dict[str, object]:
    if credentials is None or credentials.scheme.lower() != "bearer":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="A Firebase ID token is required.")
    try:
        decoded_token = auth.verify_id_token(credentials.credentials, check_revoked=True)
    except Exception as error:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired Firebase ID token.") from error

    uid = decoded_token.get("uid")
    if not isinstance(uid, str) or repository.user_role(uid) != "officer":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Officer access is required.")
    return decoded_token
