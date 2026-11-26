from datetime import datetime, timedelta, timezone
from typing import Any

import pandas as pd

from .validation_service import ValidatedData


COMPLETED = "completed"
INACTIVE_APPOINTMENT_STATUSES = {"completed", "cancelled"}


def analytics_summary(data: ValidatedData) -> dict[str, Any]:
    appointments = data.appointments
    procurements = data.procurements
    completed = procurements[procurements["status"] == COMPLETED]
    completed_appointment_ids = set(completed["appointment_id"].dropna())
    active_appointments = appointments[~appointments["status"].isin(INACTIVE_APPOINTMENT_STATUSES)]
    pending_appointments = active_appointments[~active_appointments["appointment_id"].isin(completed_appointment_ids)]
    return {
        "total_registered_farmers": int(len(data.farmers)),
        "total_appointments": int(len(appointments)),
        "completed_procurements": int(len(completed)),
        "pending_procurements": int(len(pending_appointments)),
        "definition": "Pending procurements are active appointments without a completed procurement record.",
    }


def crop_statistics(data: ValidatedData) -> list[dict[str, Any]]:
    completed = data.procurements[data.procurements["status"] == COMPLETED].copy()
    if completed.empty:
        return []
    completed["crop"] = completed["crop"].replace("", "Unknown")
    grouped = completed.groupby("crop", dropna=False)["quantity_quintals"].sum(min_count=1).reset_index()
    return [
        {"crop": row.crop, "quantity_quintals": round(float(row.quantity_quintals or 0), 2), "completed_procurements": int((completed["crop"] == row.crop).sum())}
        for row in grouped.sort_values("quantity_quintals", ascending=False).itertuples(index=False)
    ]


def daily_statistics(data: ValidatedData) -> list[dict[str, Any]]:
    completed = data.procurements[data.procurements["status"] == COMPLETED].copy()
    completed = completed[completed["completed_at"].notna()]
    if completed.empty:
        return []
    completed["date"] = pd.to_datetime(completed["completed_at"], utc=True).dt.date.astype(str)
    grouped = completed.groupby("date")["quantity_quintals"].agg(["count", "sum"]).reset_index()
    return [
        {"date": row.date, "completed_procurements": int(row.count), "quantity_quintals": round(float(row.sum or 0), 2)}
        for row in grouped.sort_values("date", ascending=False).itertuples(index=False)
    ]


def _queue_sort_key(row: pd.Series) -> tuple[Any, ...]:
    position = row.queue_position
    if pd.notna(position):
        return (0, float(position), "", "", row.appointment_id)
    return (1, float("inf"), row.appointment_date, row.time_slot, row.appointment_id)


def _historical_duration_minutes(data: ValidatedData, center_id: str, lookback_days: int) -> list[float]:
    completed = data.procurements[(data.procurements["status"] == COMPLETED) & (data.procurements["center_id"] == center_id)].copy()
    if completed.empty:
        return []
    appointments = data.appointments[["appointment_id", "called_at"]]
    merged = completed.merge(appointments, on="appointment_id", how="left")
    cutoff = datetime.now(timezone.utc) - timedelta(days=lookback_days)
    durations: list[float] = []
    for record in merged.itertuples(index=False):
        if record.called_at is None or record.completed_at is None or record.completed_at < cutoff:
            continue
        minutes = (record.completed_at - record.called_at).total_seconds() / 60
        if 0 < minutes <= 8 * 60:
            durations.append(minutes)
    return durations


def estimate_wait_time(
    data: ValidatedData,
    appointment_id: str,
    default_processing_minutes: int,
    min_historical_samples: int,
    history_lookback_days: int,
) -> dict[str, Any]:
    matches = data.appointments[data.appointments["appointment_id"] == appointment_id]
    if matches.empty:
        raise KeyError("Appointment was not found.")
    target = matches.iloc[0]
    if target.status in INACTIVE_APPOINTMENT_STATUSES:
        return {"appointment_id": appointment_id, "estimated_wait_minutes": 0, "estimate_label": "Estimate only — this appointment is no longer active.", "source": "not_applicable"}
    if not target.center_id:
        raise ValueError("The appointment has no procurement center, so a queue estimate cannot be calculated.")

    queue = data.appointments[
        (data.appointments["center_id"] == target.center_id)
        & (~data.appointments["status"].isin(INACTIVE_APPOINTMENT_STATUSES))
    ].copy()
    has_actual_queue_positions = queue["queue_position"].notna().any()
    if target.appointment_date and not has_actual_queue_positions:
        same_day = queue[queue["appointment_date"] == target.appointment_date]
        if not same_day.empty:
            queue = same_day
    ordered = sorted((row for _, row in queue.iterrows()), key=_queue_sort_key)
    target_index = next((index for index, row in enumerate(ordered) if row.appointment_id == appointment_id), None)
    if target_index is None:
        raise ValueError("The active appointment is not present in its center queue.")
    ahead = ordered[:target_index]
    processing_ids = {row.appointment_id for row in ordered if row.status == "processing" and row.appointment_id != appointment_id}
    processing_ahead_ids = {row.appointment_id for row in ahead if row.status == "processing"}
    processing_not_ordered_ahead = processing_ids - processing_ahead_ids
    processing_ahead = len(processing_ids)
    historical_minutes = _historical_duration_minutes(data, target.center_id, history_lookback_days)
    if len(historical_minutes) >= min_historical_samples:
        processing_minutes = round(sum(historical_minutes) / len(historical_minutes), 1)
        source = "historical_center_average"
        data_notice = f"Based on {len(historical_minutes)} completed records from this center."
    else:
        processing_minutes = float(default_processing_minutes)
        source = "configurable_fallback_average"
        data_notice = f"Only {len(historical_minutes)} valid historical records were available; the configured average is used."
    farmers_ahead = len(ahead) + len(processing_not_ordered_ahead)
    waiting_ahead = farmers_ahead - processing_ahead
    estimated_wait = round(waiting_ahead * processing_minutes + processing_ahead * (processing_minutes / 2))
    return {
        "appointment_id": appointment_id,
        "center_id": target.center_id,
        "queue_position": target_index + 1,
        "farmers_ahead": farmers_ahead,
        "currently_processing_ahead": processing_ahead,
        "estimated_wait_minutes": max(0, estimated_wait),
        "average_processing_minutes": processing_minutes,
        "historical_sample_count": len(historical_minutes),
        "source": source,
        "data_notice": data_notice,
        "estimate_label": "Estimated waiting time only — not a guaranteed service time.",
    }
