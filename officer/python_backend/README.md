# SmartProcure Analytics Backend

Local FastAPI backend for Officer Dashboard analytics. It reads the existing
Firestore collections without writing to them:

- `farmers`
- `appointments`
- `procurements`

Every endpoint requires a Firebase ID token and confirms that the caller's
`users/{uid}` document has `role` exactly equal to `officer`.

## Local setup

1. Create a Firebase service account key for the existing `smart-farmer-procurement`
   project and save it outside this repository, or in this folder under a name
   matched by `.gitignore`.
2. Copy `.env.example` to `.env`, then set `FIREBASE_SERVICE_ACCOUNT_PATH` to
   the absolute key-file path.
3. Install dependencies: `python -m pip install -r requirements.txt`
4. Start locally: `python -m uvicorn app.main:app --reload --port 8000`
5. Run tests: `python -m pytest`

Use an Officer Dashboard Firebase ID token in the request header:

`Authorization: Bearer <firebase-id-token>`

Available endpoints:

- `GET /api/health` (no data access)
- `GET /api/analytics/schema-validation`
- `GET /api/analytics/summary`
- `GET /api/analytics/crops`
- `GET /api/analytics/daily`
- `GET /api/analytics/crop-chart.png`
- `GET /api/wait-time/{appointment_id}`
- `GET /api/reports/procurements.csv`

The validation endpoint should be called first after configuring credentials. It
reports field presence, timestamp types, status values, and invalid records
without returning farmer names, contacts, addresses, or raw documents.
