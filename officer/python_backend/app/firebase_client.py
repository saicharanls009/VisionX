from collections.abc import Iterable
from typing import Any

import firebase_admin
from firebase_admin import credentials, firestore

from .config import Settings


class FirestoreRepository:
    """Read-only gateway for existing SmartProcure Firestore collections."""

    def __init__(self, settings: Settings):
        if not settings.service_account_path:
            raise RuntimeError("FIREBASE_SERVICE_ACCOUNT_PATH is required for the local backend.")
        if not settings.service_account_path.is_file():
            raise RuntimeError("FIREBASE_SERVICE_ACCOUNT_PATH does not point to a readable service-account file.")
        try:
            self._app = firebase_admin.get_app()
        except ValueError:
            self._app = firebase_admin.initialize_app(
                credentials.Certificate(str(settings.service_account_path)),
                {"projectId": settings.firebase_project_id},
            )
        self._db = firestore.client(self._app)

    def collection_documents(self, collection_name: str) -> list[dict[str, Any]]:
        return [self._document_to_dict(document) for document in self._db.collection(collection_name).stream()]

    def user_role(self, uid: str) -> str | None:
        snapshot = self._db.collection("users").document(uid).get()
        if not snapshot.exists:
            return None
        role = snapshot.to_dict().get("role")
        return role if isinstance(role, str) else None

    @staticmethod
    def _document_to_dict(document: Any) -> dict[str, Any]:
        data = document.to_dict() or {}
        data["_id"] = document.id
        return data


class InMemoryFirestoreRepository:
    """Small in-memory repository used only by automated tests."""

    def __init__(self, documents: dict[str, Iterable[dict[str, Any]]], roles: dict[str, str] | None = None):
        self.documents = {name: [dict(document) for document in items] for name, items in documents.items()}
        self.roles = roles or {}

    def collection_documents(self, collection_name: str) -> list[dict[str, Any]]:
        return [dict(document) for document in self.documents.get(collection_name, [])]

    def user_role(self, uid: str) -> str | None:
        return self.roles.get(uid)
