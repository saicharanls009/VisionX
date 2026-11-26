# SIH26032: Online Procurement Assistance Center Portal
### Smart Farmer Procurement Management System
**Assisted-Digital Service Portal for Village Service Centers & Common Service Centers (CSC)**

---

## 🌾 1. Context & Purpose

In India, a substantial segment of rural farmers:
- Do not own smartphones (use feature / keypad phones).
- Are uncomfortable navigating complex mobile applications.
- Need digital assistance to participate in government Minimum Support Price (MSP) crop procurement.

> **Important Ecosystem Distinction:**
> - 📱 **Farmer Mobile App:** For farmers with smartphones.
> - 🖥️ **Online Procurement Assistance Center Website (This Portal):** Operated by an authorized CSC / Village Service Center operator at a desktop computer to assist keypad phone and non-smartphone farmers.
> - 🏢 **Procurement Officer Dashboard:** Used by Mandi/APMC officials at procurement intake counters to weigh, inspect quality, approve, and disburse DBT payments.

**All three portals share the EXACT SAME centralized Firebase backend and permanent farmer records.**

---

## ⚡ 2. Core Features Implemented

### 🔐 A. Operator Authentication & Authorized Center Context
- Secure Operator Login with:
  - **Center ID:** e.g., `OC-001`
  - **Operator Username / Email:** e.g., `rajkot_operator_1`
  - **Password:** `password123`
- Persistent header displays authorized center metadata:
  `Center ID: OC-001 | Center Name: Village Service Center - Rajkot | Operator: Rajkot Center Operator`.
- Quick-fill demo credentials for `OC-001 (Rajkot)` and `OC-002 (Jasdan)`.

### 📊 B. Clean Government Portal Dashboard
- **Today's Statistics:**
  - `Farmers Assisted Today`
  - `New Registrations Today`
  - `Appointments Booked Today`
  - `Pending in Queue`
  - `Procurements Completed & Paid`
- **Quick Action Tiles:** Big, accessible buttons for Farmer Lookup, Registration, Slot Booking, Status Tracking, and Token Printing.
- **Live Queue Snapshot:** Instant view of today's active tokens and pending requests.

### 👤 C. Farmer Verification & Permanent Identity
- **Central Search:** Lookup by **Official Farmer ID** (e.g. `DEMO-FARMER-001`) or **Registered Mobile** (`9876543210`).
- **Strict Rule:** Farmers have **ONE permanent profile**. New appointments do not regenerate farmer IDs.
- **Masked PII:** Displays masked phone (`******3210`) and masked ID (`****1234`) with full demographic address, registered crops, and active token status.

### 📝 D. Assisted New Farmer Registration
- Validates official external Farmer ID, Name, 10-digit Mobile, Village, District, State, Language, and crop yield.
- **Duplicate Prevention:** Prevents creating duplicate records if the Official Farmer ID or mobile number already exists in the centralized database.
- Displays standard government confirmation:
  > *"Farmer verified and profile created successfully."*

### 🌾 E. Crop Registration & Procurement Requests
- Register multiple commodities (Rice, Wheat, Groundnut, Cotton, Mustard, Maize, etc.) with variety, estimated quantity (`kg`, `quintal`, `ton`), harvest period, and preferred procurement date.

### 🏢 F. Dynamic Procurement Centers Selection
- Real-time Firestore stream from `procurement_centers`:
  - **Center A** (*Rajkot APMC*): Queue: 4, Available Slots: 35, Wait: 20m, Status: `Available`
  - **Center B** (*Gondal Mandi*): Queue: 7, Available Slots: 18, Wait: 42m, Status: `Available`
  - **Center C** (*Morbi Agro Yard*): Queue: 22, Available Slots: 3, Wait: 90m, Status: `Busy`
- Visual utilization progress bars and daily capacity tracking.

### 🎫 G. Disambiguated Appointment Booking & IDs
- Time slot and date picker with capacity feedback.
- Strictly separate identifier hierarchy:
  - **Permanent Farmer ID:** `DEMO-FARMER-001` (Lifetime identity)
  - **Appointment ID:** `APT-2026-00045` (Unique booking visit)
  - **Procurement ID:** `PROC-2026-00045` (Physical intake transaction)
  - **Queue Token:** `B-024` (Daily center-specific queue number)

### 🖨️ H. Printable Token Slip & Keypad Phone SMS
- Official thermal receipt slip with dashed border matching government specifications:
  - Header: `PROCUREMENT APPOINTMENT`
  - Farmer Name & Masked ID (`****1234`)
  - Center Name, Date, and Time Slot
  - Prominent `TOKEN: B-024`
  - Unique `Appointment ID: APT-2026-00045`
  - Advisory Notice: *"Please arrive 15 minutes before your appointment."*
- Actions:
  - `[ Print Appointment ]`: Clean `@media print` thermal slip printout.
  - `[ Download / Save PDF ]`: Browser PDF export.
  - `[ Send SMS (Keypad Phone) ]`: Clearly labeled **SMS Gateway Simulation Modal** dispatching the SMS payload to the farmer's feature phone.

### ⏱️ I. Real-Time Mandi Status Tracker
- 3 synchronized progress timelines with active step highlighting:
  1. **Appointment Lifecycle:** `Booked` ➔ `Checked In` ➔ `Waiting` ➔ `Called` ➔ `Processing` ➔ `Completed`
  2. **Physical Procurement:** `Pending` ➔ `Verification` ➔ `Crop Verified` ➔ `Weighing` ➔ `Quality Check` ➔ `Approved` ➔ `Completed`
  3. **DBT Payment:** `Pending` ➔ `Processing` ➔ `Paid` (with PFMS reference)
- Displays net weight (kg), moisture percentage, quality grade, and real-time audit history of every officer action with timestamps.

### 🎮 J. Mandi Officer Real-Time Simulator (Hackathon Demo Tool)
- Integrated simulator modal accessible via the top navbar and sidebar.
- Demonstrates calling tokens (`Called`), weighbridge recordings, quality approvals, and DBT disbursements in real time without refreshing the browser!

---

## 🛠️ 3. Technology Stack

- **Frontend:** React 19, TypeScript, Vite 8
- **Styling:** Tailwind CSS (Government theme: National Navy, Harvest Green, Saffron accents)
- **Icons:** Lucide React
- **Backend / DB:** Firebase Firestore (real-time `onSnapshot` listeners) & Firebase Authentication
- **Offline / Demo Resilience:** Built-in reactive fallback store that implements the exact same Firestore API contract if run offline or without API keys.

---

## 🚀 4. How to Run the Project

### Option A: Quick 1-Click Launcher (Windows)
Double-click **`start-dev.bat`** in this folder.

### Option B: Terminal Command (PowerShell)
```powershell
# Set Node environment path
$env:PATH = "C:\Users\boddu\AppData\Local\OpenAI\Codex\runtimes\cua_node\dd584937042db7da\bin;" + $env:PATH

# Start the development server
npm.cmd run dev
```

Open your browser at:
👉 **`http://localhost:5173/`**

### Building for Production
```powershell
npm.cmd run build
```
The optimized bundle will be generated in `dist/`.

---

## 🔗 5. Firebase Configuration (`.env`)

To connect to a live Firebase backend shared across your other SIH apps, create a `.env` file from `.env.example`:

```env
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain_here
VITE_FIREBASE_PROJECT_ID=smart-farmer-procurement
VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket_here
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id_here
VITE_FIREBASE_APP_ID=your_app_id_here
```

If these environment variables are omitted, the application automatically runs in **Live Demo Mode** using an in-memory/localStorage reactive state store with full `onSnapshot` pub/sub synchronization!

### Firestore authorization setup

Live registration is intentionally restricted to authenticated assistance-center operators. Before registering farmers, create the operator's Firebase Authentication account and create the matching Firestore document at `/users/{operatorUid}`:

```json
{
  "role": "assistant",
  "serviceCenterId": "OC-001",
  "serviceCenterName": "Village Service Center - Rajkot",
  "displayName": "Rajkot Center Operator"
}
```

Deploy the included rules after configuring Firebase:

```powershell
firebase use smart-farmer-procurement
firebase deploy --only firestore:rules
```

The `firebase.json` file maps that deployment to `firestore.rules`. Without both the operator record and deployed rules, Firebase correctly returns `Missing or insufficient permissions` when a registration is submitted.

---

## 🏛️ 6. Hackathon Demonstration Walkthrough

1. **Log In:** Use Center `OC-001` (Village Service Center - Rajkot).
2. **Search Farmer:** Enter `DEMO-FARMER-001` (Ravi Kumar) or `9876543210` to view verified permanent profile and active token `B-024`.
3. **Register New Farmer:** Test registering a new farmer to verify duplicate detection and permanent ID assignment.
4. **Book Appointment:** Pick Center B (Gondal Mandi), choose date/slot, and see distinct ID generation (`APT-2026-00045`, Token `B-024`).
5. **Print Token Slip:** View the thermal appointment slip, test browser printing, and dispatch simulated SMS to keypad phone.
6. **Live Synchronization:** Open "Mandi Officer Sim", click "Call Token to Counter", and watch the portal update to **Token Called!** instantly without refreshing the page.
