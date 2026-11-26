from collections import Counter
from dataclasses import dataclass
from datetime import datetime
from typing import Any

import pandas as pd


APPOINTMENT_STATUSES = {"pending", "booked", "checked in", "waiting", "called", "processing", "completed", "cancelled"}
PROCUREMENT_STATUSES = {"verification", "weighing", "completed"}


@dataclass
class ValidatedData:
    farmers: pd.DataFrame
    appointments: pd.DataFrame
    procurements: pd.DataFrame
    report: dict[str, Any]


def normalize_status(value: Any) -> str:
    return value.strip().lower() if isinstance(value, str) else ""


def parse_timestamp(value: Any) -> datetime | None:
    if value is None or value == "":
        return None
    if hasattr(value, "to_datetime"):
        value = value.to_datetime()
    parsed = pd.to_datetime(value, errors="coerce", utc=True)
    if pd.isna(parsed):
        return None
    return parsed.to_pydatetime()


def _field_report(records: list[dict[str, Any]], fields: list[str]) -> dict[str, dict[str, int]]:
    return {
        field: {
            "present": sum(field in record and record.get(field) not in (None, "") for record in records),
            "missing": sum(field not in record or record.get(field) in (None, "") for record in records),
        }
        for field in fields
    }


def _prepare_appointments(records: list[dict[str, Any]]) -> tuple[pd.DataFrame, dict[str, Any]]:
    rows: list[dict[str, Any]] = []
    invalid_timestamps = 0
    status_values: Counter[str] = Counter()
    for record in records:
        status = normalize_status(record.get("status", "pending")) or "pending"
        status_values[status] += 1
        called_at = parse_timestamp(record.get("calledAt"))
        created_at = parse_timestamp(record.get("createdAt"))
        if record.get("calledAt") not in (None, "") and called_at is None:
            invalid_timestamps += 1
        center_id = record.get("centerId") or record.get("procurementCenterId")
        queue_position = pd.to_numeric(record.get("queuePosition"), errors="coerce")
        rows.append({
            "appointment_id": str(record.get("_id", "")),
            "farmer_id": str(record.get("farmerId", "")),
            "center_id": str(center_id) if center_id not in (None, "") else "",
            "appointment_date": str(record.get("appointmentDate", "")),
            "time_slot": str(record.get("timeSlot", "")),
            "crop": str(record.get("crop", "")),
            "status": status,
            "queue_position": queue_position,
            "called_at": called_at,
            "created_at": created_at,
        })
    return pd.DataFrame(rows, columns=["appointment_id", "farmer_id", "center_id", "appointment_date", "time_slot", "crop", "status", "queue_position", "called_at", "created_at"]), {
        "fields": _field_report(records, ["farmerId", "centerId", "procurementCenterId", "appointmentDate", "timeSlot", "crop", "status", "queuePosition", "calledAt", "createdAt"]),
        "status_values": dict(status_values),
        "unknown_status_values": sorted(status for status in status_values if status not in APPOINTMENT_STATUSES),
        "invalid_timestamp_count": invalid_timestamps,
    }


def _prepare_procurements(records: list[dict[str, Any]]) -> tuple[pd.DataFrame, dict[str, Any]]:
    rows: list[dict[str, Any]] = []
    invalid_timestamps = 0
    status_values: Counter[str] = Counter()
    for record in records:
        status = normalize_status(record.get("procurementStatus"))
        status_values[status] += 1
        completed_at = parse_timestamp(record.get("procurementCompletionDate") or record.get("completedAt"))
        if (record.get("procurementCompletionDate") or record.get("completedAt")) not in (None, "") and completed_at is None:
            invalid_timestamps += 1
        actual_quantity = pd.to_numeric(record.get("actualQuantity"), errors="coerce")
        net_weight_kg = pd.to_numeric(record.get("netWeightKg"), errors="coerce")
        if pd.isna(actual_quantity) and not pd.isna(net_weight_kg):
            actual_quantity = net_weight_kg / 100
        rows.append({
            "procurement_id": str(record.get("_id", "")),
            "appointment_id": str(record.get("appointmentId", "")),
            "farmer_id": str(record.get("farmerId", "")),
            "center_id": str(record.get("centerId", "")),
            "crop": str(record.get("crop", "")),
            "quantity_quintals": actual_quantity,
            "status": status,
            "completed_at": completed_at,
        })
    return pd.DataFrame(rows, columns=["procurement_id", "appointment_id", "farmer_id", "center_id", "crop", "quantity_quintals", "status", "completed_at"]), {
        "fields": _field_report(records, ["appointmentId", "farmerId", "centerId", "crop", "actualQuantity", "netWeightKg", "procurementStatus", "procurementCompletionDate", "completedAt"]),
        "status_values": dict(status_values),
        "unknown_status_values": sorted(status for status in status_values if status and status not in PROCUREMENT_STATUSES),
        "invalid_timestamp_count": invalid_timestamps,
    }


def validate_firestore_data(
    farmers: list[dict[str, Any]], appointments: list[dict[str, Any]], procurements: list[dict[str, Any]]
) -> ValidatedData:
    appointment_frame, appointment_report = _prepare_appointments(appointments)
    procurement_frame, procurement_report = _prepare_procurements(procurements)
    farmer_frame = pd.DataFrame([{"farmer_id": str(record.get("_id", ""))} for record in farmers], columns=["farmer_id"])
    report = {
        "collection_counts": {"farmers": len(farmers), "appointments": len(appointments), "procurements": len(procurements)},
        "appointments": appointment_report,
        "procurements": procurement_report,
        "safe_to_analyse": not appointment_report["unknown_status_values"] and not procurement_report["unknown_status_values"],
        "notice": "Missing optional fields are excluded from affected calculations. No raw farmer records are returned.",
    }
    return ValidatedData(farmers=farmer_frame, appointments=appointment_frame, procurements=procurement_frame, report=report)
