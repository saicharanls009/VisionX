from datetime import datetime, timedelta, timezone

from app.services.analytics_service import analytics_summary, crop_statistics, daily_statistics, estimate_wait_time
from app.services.report_service import procurement_csv
from app.services.validation_service import validate_firestore_data


NOW = datetime.now(timezone.utc).replace(microsecond=0)


def make_data():
    farmers = [{"_id": "farmer-a"}, {"_id": "farmer-b"}, {"_id": "farmer-c"}]
    appointments = [
        {"_id": "apt-processing", "farmerId": "farmer-a", "centerId": "center-1", "appointmentDate": "2026-11-18", "timeSlot": "09:00 AM", "crop": "Paddy", "status": "Processing", "queuePosition": 1, "calledAt": NOW - timedelta(minutes=6)},
        {"_id": "apt-target", "farmerId": "farmer-b", "centerId": "center-1", "appointmentDate": "2026-11-18", "timeSlot": "09:30 AM", "crop": "Wheat", "status": "Waiting", "queuePosition": 2},
        {"_id": "apt-future", "farmerId": "farmer-c", "centerId": "center-1", "appointmentDate": "2026-11-18", "timeSlot": "10:00 AM", "crop": "Paddy", "status": "Booked", "queuePosition": 3},
    ]
    procurements = []
    for number in range(5):
        appointment_id = f"historical-{number}"
        called_at = NOW - timedelta(days=number + 1, minutes=20)
        appointments.append({"_id": appointment_id, "farmerId": f"old-{number}", "centerId": "center-1", "appointmentDate": "2026-11-17", "timeSlot": "08:00 AM", "crop": "Paddy", "status": "Completed", "calledAt": called_at})
        procurements.append({"_id": f"proc-{number}", "appointmentId": appointment_id, "farmerId": f"old-{number}", "centerId": "center-1", "crop": "Paddy", "actualQuantity": 10 + number, "procurementStatus": "completed", "procurementCompletionDate": called_at + timedelta(minutes=20)})
    return validate_firestore_data(farmers, appointments, procurements)


def test_summary_crop_and_daily_statistics_use_validated_firestore_data():
    data = make_data()
    summary = analytics_summary(data)
    assert summary["total_registered_farmers"] == 3
    assert summary["total_appointments"] == 8
    assert summary["completed_procurements"] == 5
    assert summary["pending_procurements"] == 3
    assert crop_statistics(data) == [{"crop": "Paddy", "quantity_quintals": 60.0, "completed_procurements": 5}]
    assert daily_statistics(data)[0]["completed_procurements"] >= 1


def test_wait_estimate_counts_processing_farmer_and_center_history():
    estimate = estimate_wait_time(make_data(), "apt-target", default_processing_minutes=15, min_historical_samples=5, history_lookback_days=90)
    assert estimate["queue_position"] == 2
    assert estimate["farmers_ahead"] == 1
    assert estimate["currently_processing_ahead"] == 1
    assert estimate["average_processing_minutes"] == 20.0
    assert estimate["estimated_wait_minutes"] == 10
    assert estimate["source"] == "historical_center_average"


def test_wait_estimate_falls_back_when_history_is_insufficient():
    data = make_data()
    estimate = estimate_wait_time(data, "apt-target", default_processing_minutes=12, min_historical_samples=6, history_lookback_days=90)
    assert estimate["source"] == "configurable_fallback_average"
    assert estimate["historical_sample_count"] == 5
    assert estimate["estimated_wait_minutes"] == 6


def test_validation_and_csv_do_not_return_farmer_personal_details():
    data = make_data()
    report = data.report
    csv_text = procurement_csv(data)
    assert report["safe_to_analyse"] is True
    assert "name" not in csv_text.lower()
    assert "mobile" not in csv_text.lower()
    assert csv_text.splitlines()[0] == "farmer_id,procurement_date,center,crop,quantity_quintals,procurement_status"
