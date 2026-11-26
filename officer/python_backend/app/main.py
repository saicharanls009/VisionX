from contextlib import asynccontextmanager
from typing import Annotated

from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response

from .config import get_settings
from .firebase_client import FirestoreRepository
from .security import require_officer
from .services.analytics_service import analytics_summary, crop_statistics, daily_statistics, estimate_wait_time
from .services.chart_service import crop_chart_png
from .services.report_service import procurement_csv
from .services.validation_service import ValidatedData, validate_firestore_data


@asynccontextmanager
async def lifespan(app: FastAPI):
    settings = get_settings()
    app.state.settings = settings
    app.state.repository = FirestoreRepository(settings)
    yield


app = FastAPI(title="SmartProcure Analytics API", version="1.0.0", lifespan=lifespan)
app.add_middleware(CORSMiddleware, allow_origins=get_settings().allowed_origins, allow_credentials=True, allow_methods=["GET"], allow_headers=["Authorization", "Content-Type"])


def validated_data() -> ValidatedData:
    repository = app.state.repository
    return validate_firestore_data(
        repository.collection_documents("farmers"),
        repository.collection_documents("appointments"),
        repository.collection_documents("procurements"),
    )


Officer = Annotated[dict[str, object], Depends(require_officer)]


@app.get("/api/health")
def health(_: Officer) -> dict[str, str]:
    return {"status": "ok", "service": "SmartProcure Analytics API"}


@app.get("/api/analytics/schema-validation")
def schema_validation(_: Officer) -> dict[str, object]:
    return validated_data().report


@app.get("/api/analytics/summary")
def summary(_: Officer) -> dict[str, object]:
    return analytics_summary(validated_data())


@app.get("/api/analytics/crops")
def crops(_: Officer) -> list[dict[str, object]]:
    return crop_statistics(validated_data())


@app.get("/api/analytics/daily")
def daily(_: Officer) -> list[dict[str, object]]:
    return daily_statistics(validated_data())


@app.get("/api/analytics/crop-chart.png")
def crop_chart(_: Officer) -> Response:
    return Response(content=crop_chart_png(crop_statistics(validated_data())), media_type="image/png")


@app.get("/api/wait-time/{appointment_id}")
def wait_time(appointment_id: str, _: Officer) -> dict[str, object]:
    settings = app.state.settings
    try:
        return estimate_wait_time(validated_data(), appointment_id, settings.default_processing_minutes, settings.min_historical_samples, settings.history_lookback_days)
    except KeyError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error
    except ValueError as error:
        raise HTTPException(status_code=422, detail=str(error)) from error


@app.get("/api/reports/procurements.csv")
def report(_: Officer) -> Response:
    return Response(
        content=procurement_csv(validated_data()),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=smartprocure-procurements.csv"},
    )
