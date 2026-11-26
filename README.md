# VisionX
Farmers often face long waiting times, lack of information regarding procurement schedules, and uncertainty about procurement status.

VisionX brings together two applications for the smart procurement workflow:
an assistant dashboard for farmers and a procurement officer dashboard for
center operations.

## Applications

### Assistant Dashboard (`sih/`)

Supports procurement-center staff assisting farmers with registration and
verification, crop and appointment workflows, queue tracking, and printable
tokens. The application uses Firebase for its configured data and authentication
services.

### Procurement Officer Dashboard (`officer/`)

Provides procurement officers with queue and center-capacity views, settlement
and payment workflows, weighment and quality records, reports, and operational
metrics. Its optional local FastAPI analytics backend reads Firestore data and
requires an authenticated Firebase officer ID token.

## Technology

- Both dashboards: React, TypeScript, Vite, Firebase, and Lucide React
- Assistant Dashboard: Tailwind CSS and PostCSS
- Officer analytics backend: Python, FastAPI, Firebase Admin, pandas, and
  Matplotlib

## Requirements

- Node.js and npm compatible with the Vite version in each app's `package.json`
- Python 3.10+ for the optional Officer analytics backend
- Firebase project access for features that use Firebase

## Run the Assistant Dashboard

```powershell
cd sih
npm ci
Copy-Item .env.example .env.local
```

Edit `sih/.env.local` and set the Firebase web app values for your own Firebase
project:

```dotenv
VITE_FIREBASE_API_KEY=<your_firebase_web_api_key>
VITE_FIREBASE_AUTH_DOMAIN=<your_firebase_auth_domain>
VITE_FIREBASE_PROJECT_ID=<your_firebase_project_id>
VITE_FIREBASE_STORAGE_BUCKET=<your_firebase_storage_bucket>
VITE_FIREBASE_MESSAGING_SENDER_ID=<your_firebase_messaging_sender_id>
VITE_FIREBASE_APP_ID=<your_firebase_app_id>
```

Start the development server:

```powershell
npm run dev
```

To create a production build, run `npm run build` from `sih/`.

## Run the Procurement Officer Dashboard

```powershell
cd officer
npm ci
Copy-Item .env.example .env.local
```

Set the same Firebase web app values in `officer/.env.local`. Set
`VITE_ANALYTICS_API_URL` to the URL where the optional analytics backend runs
(for a local backend, `http://localhost:8000`). Then start the frontend:

```powershell
npm run dev
```

Build the frontend with `npm run build` from `officer/`.

### Optional Officer analytics backend

Create and activate a Python virtual environment from `officer/python_backend/`,
then install its dependencies and configure Firebase:

```powershell
cd officer/python_backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
Copy-Item .env.example .env
```

Set these values in `officer/python_backend/.env`:

```dotenv
FIREBASE_PROJECT_ID=<your_firebase_project_id>
FIREBASE_SERVICE_ACCOUNT_PATH=<absolute_path_to_service_account_file_outside_this_repository>
```

Create a Firebase service-account credential for the intended project and keep
the file outside this repository. Grant only the access needed by the backend;
never commit the credential or put its contents in an environment file.
Start the backend from `officer/python_backend/`:

```powershell
python -m uvicorn app.main:app --reload --port 8000
```

The backend's protected analytics endpoints require a valid Firebase ID token
for an officer account. Use `python -m pytest` from `officer/python_backend/` to
run its tests.

## Firebase setup and credential safety

1. Create or select your Firebase project, register a web app, and enable the
   Firebase services required by the applications.
2. Put the web app configuration in each dashboard's local `.env.local`, using
   the `VITE_FIREBASE_*` variable names shown above. These values belong to your
   local setup; do not commit populated local environment files.
3. If using the Officer analytics backend, set its project ID and an external
   service-account file path in `officer/python_backend/.env`. Keep the actual
   service-account file outside the repository.
4. Do not commit `.env`, `.env.local`, `.env.production`, service-account files,
   private keys, tokens, or passwords.
