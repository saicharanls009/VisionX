from datetime import datetime, timedelta, timezone
from unittest.mock import patch
import pytest
from fastapi import HTTPException
from fastapi.security import HTTPAuthorizationCredentials

from app.firebase_client import InMemoryFirestoreRepository
from app.main import (
    app,
    health,
    schema_validation,
    summary,
    crops,
    daily,
    crop_chart,
    wait_time,
    report,
)
from app.security import require_officer
from app.config import get_settings


NOW = datetime.now(timezone.utc).replace(microsecond=0)


def build_mock_repository() -> InMemoryFirestoreRepository:
    farmers = [{"_id": "farmer-a"}, {"_id": "farmer-b"}, {"_id": "farmer-c"}]
    appointments = [
        {
            "_id": "apt-processing",
            "farmerId": "farmer-a",
            "centerId": "center-1",
            "appointmentDate": "2026-11-18",
            "timeSlot": "09:00 AM",
            "crop": "Paddy",
            "status": "Processing",
            "queuePosition": 1,
            "calledAt": NOW - timedelta(minutes=6),
        },
        {
            "_id": "apt-target",
            "farmerId": "farmer-b",
            "centerId": "center-1",
            "appointmentDate": "2026-11-18",
            "timeSlot": "09:30 AM",
            "crop": "Wheat",
            "status": "Waiting",
            "queuePosition": 2,
        },
        {
            "_id": "apt-future",
            "farmerId": "farmer-c",
            "centerId": "center-1",
            "appointmentDate": "2026-11-18",
            "timeSlot": "10:00 AM",
            "crop": "Paddy",
            "status": "Booked",
            "queuePosition": 3,
        },
    ]
    procurements = []
    for number in range(5):
        appointment_id = f"historical-{number}"
        called_at = NOW - timedelta(days=number + 1, minutes=20)
        appointments.append({
            "_id": appointment_id,
            "farmerId": f"old-{number}",
            "centerId": "center-1",
            "appointmentDate": "2026-11-17",
            "timeSlot": "08:00 AM",
            "crop": "Paddy",
            "status": "Completed",
            "calledAt": called_at,
        })
        procurements.append({
            "_id": f"proc-{number}",
            "appointmentId": appointment_id,
            "farmerId": f"old-{number}",
            "centerId": "center-1",
            "crop": "Paddy",
            "actualQuantity": 10 + number,
            "procurementStatus": "completed",
            "procurementCompletionDate": called_at + timedelta(minutes=20),
        })

    documents = {
        "farmers": farmers,
        "appointments": appointments,
        "procurements": procurements,
    }
    roles = {
        "officer-uid-123": "officer",
        "farmer-uid-456": "farmer",
    }
    return InMemoryFirestoreRepository(documents, roles)


@pytest.fixture(autouse=True)
def setup_app_state():
    repo = build_mock_repository()
    settings = get_settings()
    app.state.settings = settings
    app.state.repository = repo
    return repo


OFFICER_USER = {"uid": "officer-uid-123", "role": "officer"}


# --- Security & Role Authorization Tests ---

def test_security_missing_credentials(setup_app_state):
    with pytest.raises(HTTPException) as exc_info:
        require_officer(None, setup_app_state)
    assert exc_info.value.status_code == 401
    assert exc_info.value.detail == "A Firebase ID token is required."


def test_security_non_bearer_scheme(setup_app_state):
    cred = HTTPAuthorizationCredentials(scheme="Basic", credentials="xyz")
    with pytest.raises(HTTPException) as exc_info:
        require_officer(cred, setup_app_state)
    assert exc_info.value.status_code == 401
    assert exc_info.value.detail == "A Firebase ID token is required."


def test_security_invalid_token(setup_app_state):
    cred = HTTPAuthorizationCredentials(scheme="Bearer", credentials="bad-token")
    with patch("app.security.auth.verify_id_token", side_effect=Exception("Invalid token")):
        with pytest.raises(HTTPException) as exc_info:
            require_officer(cred, setup_app_state)
        assert exc_info.value.status_code == 401
        assert exc_info.value.detail == "Invalid or expired Firebase ID token."


def test_security_farmer_role_forbidden(setup_app_state):
    cred = HTTPAuthorizationCredentials(scheme="Bearer", credentials="farmer-token")
    with patch("app.security.auth.verify_id_token", return_value={"uid": "farmer-uid-456"}):
        with pytest.raises(HTTPException) as exc_info:
            require_officer(cred, setup_app_state)
        assert exc_info.value.status_code == 403
        assert exc_info.value.detail == "Officer access is required."


def test_security_unknown_user_forbidden(setup_app_state):
    cred = HTTPAuthorizationCredentials(scheme="Bearer", credentials="unknown-token")
    with patch("app.security.auth.verify_id_token", return_value={"uid": "unknown-uid"}):
        with pytest.raises(HTTPException) as exc_info:
            require_officer(cred, setup_app_state)
        assert exc_info.value.status_code == 403
        assert exc_info.value.detail == "Officer access is required."


def test_security_officer_role_authorized(setup_app_state):
    cred = HTTPAuthorizationCredentials(scheme="Bearer", credentials="officer-token")
    with patch("app.security.auth.verify_id_token", return_value={"uid": "officer-uid-123"}):
        res = require_officer(cred, setup_app_state)
        assert res == {"uid": "officer-uid-123"}


# --- Direct Endpoint Handlers Verification ---

def test_endpoint_health():
    res = health(OFFICER_USER)
    assert res == {"status": "ok", "service": "SmartProcure Analytics API"}


def test_endpoint_schema_validation():
    res = schema_validation(OFFICER_USER)
    assert res["safe_to_analyse"] is True
    assert "collection_counts" in res
    assert res["collection_counts"]["farmers"] == 3
    assert "appointments" in res
    assert "procurements" in res


def test_endpoint_summary():
    res = summary(OFFICER_USER)
    assert res["total_registered_farmers"] == 3
    assert res["total_appointments"] == 8
    assert res["completed_procurements"] == 5
    assert res["pending_procurements"] == 3


def test_endpoint_crops():
    res = crops(OFFICER_USER)
    assert len(res) == 1
    assert res[0]["crop"] == "Paddy"
    assert res[0]["quantity_quintals"] == 60.0
    assert res[0]["completed_procurements"] == 5


def test_endpoint_daily():
    res = daily(OFFICER_USER)
    assert len(res) >= 1
    assert res[0]["completed_procurements"] >= 1


def test_endpoint_crop_chart_png():
    res = crop_chart(OFFICER_USER)
    assert res.media_type == "image/png"
    assert res.body.startswith(b"\x89PNG\r\n\x1a\n")


def test_endpoint_wait_time_success():
    res = wait_time("apt-target", OFFICER_USER)
    assert res["appointment_id"] == "apt-target"
    assert res["queue_position"] == 2
    assert res["farmers_ahead"] == 1
    assert res["estimated_wait_minutes"] == 10
    assert res["source"] == "historical_center_average"


def test_endpoint_wait_time_not_found():
    with pytest.raises(HTTPException) as exc_info:
        wait_time("non-existent-id", OFFICER_USER)
    assert exc_info.value.status_code == 404


def test_endpoint_reports_csv():
    res = report(OFFICER_USER)
    assert res.media_type == "text/csv"
    assert "smartprocure-procurements.csv" in res.headers["content-disposition"]
    lines = res.body.decode().splitlines()
    assert lines[0] == "farmer_id,procurement_date,center,crop,quantity_quintals,procurement_status"
