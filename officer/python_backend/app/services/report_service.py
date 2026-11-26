from io import StringIO

import pandas as pd

from .validation_service import ValidatedData


def procurement_csv(data: ValidatedData) -> str:
    procurements = data.procurements.copy()
    appointments = data.appointments[["appointment_id", "appointment_date", "center_id", "crop", "farmer_id"]].copy()
    merged = procurements.merge(appointments, on="appointment_id", how="outer", suffixes=("_procurement", "_appointment"))
    merged["farmer_id"] = merged["farmer_id_procurement"].replace("", pd.NA).fillna(merged["farmer_id_appointment"])
    merged["center"] = merged["center_id_procurement"].replace("", pd.NA).fillna(merged["center_id_appointment"])
    merged["crop"] = merged["crop_procurement"].replace("", pd.NA).fillna(merged["crop_appointment"])
    merged["procurement_date"] = pd.to_datetime(merged["completed_at"], errors="coerce", utc=True).dt.strftime("%Y-%m-%d")
    merged["procurement_date"] = merged["procurement_date"].fillna(merged["appointment_date"])
    merged["procurement_status"] = merged["status"].replace("", pd.NA).fillna("pending")
    report = merged[["farmer_id", "procurement_date", "center", "crop", "quantity_quintals", "procurement_status"]].fillna("")
    report.columns = ["farmer_id", "procurement_date", "center", "crop", "quantity_quintals", "procurement_status"]
    destination = StringIO()
    report.to_csv(destination, index=False)
    return destination.getvalue()
