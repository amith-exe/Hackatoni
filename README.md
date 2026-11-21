
# Karshakan Lens (കർഷകൻ ലെൻസ്)

**Community-Verified Early-Warning Web App (PWA) for Kuttanad Paddy & Duck Farmers**

Karshakan Lens is a mobile-first Progressive Web Application designed for the below-sea-level agricultural delta of Kuttanad (Alappuzha & Kottayam, Kerala). It combines crowdsourced farmer intelligence, community peer confirmations, hydrological canal-network salinity propagation modeling, and DBSCAN spatial clustering to provide hyper-local, actionable early warnings before catastrophic crop or flock losses occur.

---

## 🏛️ Architecture & Stack

```
Karshakan-Lens/
├── /backend                    # FastAPI Python Service
│   ├── app/
│   │   ├── config.py           # Settings, DBSCAN thresholds, Open-Meteo URLs
│   │   ├── main.py             # FastAPI entry point, CORS, routers
│   │   ├── models/schemas.py   # Pydantic v2 schemas (anonymized public responses)
│   │   ├── services/
│   │   │   ├── db.py           # PostGIS repository & in-memory distance emulator
│   │   │   ├── classifier_stub.py # PyTorch-ready crop disease classifier (<0.70 fallback)
│   │   │   ├── remedies.py     # Vetted Kerala Agricultural University (KAU) PoP remedies
│   │   │   ├── canal_routing.py # Upstream canal traversal + Open-Meteo rainfall dilution
│   │   │   ├── clustering.py   # Scikit-learn DBSCAN (Haversine metric, eps=2.0km)
│   │   │   └── safety_guidance.py # Avian flu, bund piping & AIMS crop insurance guidance
│   │   └── routers/
│   │       ├── reports.py      # POST /api/reports, /confirm, /verify
│   │       ├── map_feed.py     # GET /api/map-feed
│   │       ├── officer.py      # GET /api/officer/dashboard
│   │       └── remedies.py     # GET /api/remedies/{disease_code}
│   ├── tests/
│   │   ├── run_tests.py        # Comprehensive test runner (8/8 core tests passing)
│   │   ├── test_reporting_state_machine.py
│   │   ├── test_confirmations.py
│   │   ├── test_clustering.py
│   │   ├── test_canal_salinity_routing.py
│   │   └── test_anonymization.py
│   ├── requirements.txt
│   └── .env.example
│
├── /frontend                   # Next.js (App Router, TypeScript, Tailwind CSS) PWA
│   ├── src/
│   │   ├── app/
│   │   │   ├── page.tsx        # View 1: Live Kuttanad Hydro-Topography Map (/)
│   │   │   ├── report/page.tsx # View 2: Submit 5-Type Incident Report (/report)
│   │   │   ├── verify/page.tsx # View 3: Neighbor Confirm & Officer Queue (/verify)
│   │   │   ├── layout.tsx      # Root PWA shell with Role Switcher & Navbar
│   │   │   └── globals.css     # Tailwind styling & Leaflet animations
│   │   ├── components/
│   │   │   ├── Navbar.tsx      # Emergency hotline, Malayalam branding, user picker
│   │   │   ├── Map/KuttanadMap.tsx # Leaflet map, color-coded pins, canal lines, clusters
│   │   │   ├── Report/ReportForm.tsx # 5-type clean selector, GPS picker, instant Action Card
│   │   │   └── Verify/VerificationQueue.tsx # Peer confirmation & officer verification
│   │   ├── lib/
│   │   │   ├── api.ts          # Backend client
│   │   │   └── demo-user.tsx   # Switchable demo context (Farmers Thomas/Radhakrishnan & Krishi Officer)
│   │   └── types/index.ts      # TypeScript interfaces
│   ├── public/manifest.json    # PWA Manifest
│   ├── package.json
│   ├── tailwind.config.ts
│   └── next.config.mjs
│
└── /supabase                   # PostGIS Migrations & Real-World Delta Seeds
    ├── 001_init_postgis.sql    # PostGIS extension, spatial tables, GiST indexes, snapping function
    ├── 002_seed_kuttanad.sql   # Seed data for Pulincunnoo, Moncompu, Nedumudy, Champakulam, Kainakary
    └── README.md
```

---

## 🌾 Core Features & Intelligence Logic

### 1. Crowdsourced Reporting & Branching Logic (`POST /api/reports`)
Supports 5 distinct incident types:
- **🌾 Crop Disease (`crop_disease`):** Calls `classify_crop_image(photo_url)` service stub. If confidence `< 0.70`, triggers deterministic fallback *"Not sure — ask your Krishi Bhavan"* with strict prohibition against unauthorized chemical spraying. If confidence `≥ 0.70`, retrieves curated Kerala Agricultural University (KAU) Package of Practices steps and runs DBSCAN clustering over the past 7 days.
- **🌊 Salinity Ingress (`salinity`):** Evaluates electrical conductivity / refractometer readings (`salinity_ppt >= 2.0`). Queries live/cached rainfall from Open-Meteo for Kuttanad (`9.45 N, 76.43 E`) to model freshwater dilution, and traverses upstream canal segments to issue targeted `Watch`, `Warning`, and `Danger` alerts to connected polders. **Never uses a circular radius for salinity.**
- **🦆 Bird Deaths (`bird_deaths`):** High-mortality avian biosecurity alert protocol (carcass deep burial with lime, no canal entry for flocks, District Animal Husbandry hotline) and DBSCAN mortality clustering.
- **🧱 Bund Seepage (`bund_seepage`):** Outer bund boiling piping reverse filter sandbagging guidance and pump relief protocol.
- **📉 Crop Loss (`crop_loss`):** Geo-tagged landscape photography checklist, Padasekharam samithi survey slip, and AIMS/PMFBY insurance claim filing within 72 hours.
- **📍 Nearest Canal Snapping:** If `canal_segment_id` is omitted, automatically snaps to the nearest canal segment using PostGIS `ST_Distance` / Haversine point-to-linestring interpolation.

### 2. Trust Verification State Machine (`POST /api/reports/{id}/confirm`)
1. **Self-Confirmation Blocked:** A farmer cannot confirm their own report (`400 Bad Request`).
2. **Deduplication:** Duplicate confirmations by the same user are rejected (`409 Conflict`).
3. **Automatic Promotion:** When `confirmations_count >= 2` on an `unconfirmed` report, the system automatically promotes status to `community_confirmed` and triggers downstream clustering and upstream canal alerts.
4. **Official Verification (`POST /api/reports/{id}/verify`):** Krishi Bhavan Agricultural Officers (`role == 'officer'`) can officially verify (`officially_verified`) or reject (`rejected`).

### 3. Strict Farmer Privacy & Anonymization
`reporter_id`, farmer names, and phone numbers are stored strictly in private backend tables and are **NEVER exposed in any public API response** (`ReportResponse`, `MapFeedResponse`, `OfficerDashboardResponse`).

---

## 🚀 Getting Started

### Backend Setup (FastAPI)

1. **Activate Environment & Install Dependencies:**
   ```powershell
   python -m pip install -r backend/requirements.txt
   ```

2. **Run Core Unit Tests (8/8 Passing):**
   ```powershell
   python backend/tests/run_tests.py
   ```
   *Verifies report creation, classifier fallback, confirmation state machine, officer verification, DBSCAN clustering, canal traversal, and strict anonymization.*

3. **Start the FastAPI Backend Service:**
   ```powershell
   python -m uvicorn backend.app.main:app --host 0.0.0.0 --port 8000 --reload
   ```
   API Docs available at: `http://localhost:8000/docs`

---

### Supabase & PostGIS Migrations

1. In Supabase Dashboard, open the **SQL Editor**.
2. Run `/supabase/001_init_postgis.sql` to initialize PostGIS tables and spatial indexes.
3. Run `/supabase/002_seed_kuttanad.sql` to seed Kuttanad delta canals, farmer profiles, KAU remedies, and sample reports.

---

### Frontend Setup (Next.js PWA)

1. **Install Frontend Dependencies:**
   ```powershell
   cd frontend
   pnpm install
   ```

2. **Run Frontend Development Server:**
   ```powershell
   pnpm dev
   ```
   Open `http://localhost:3000` in your mobile browser or desktop.

---

## 👥 Demo User Switcher
Use the top header dropdown to switch between demo roles to test the full lifecycle:
- **Thomas Kutty (തോമസ്)**: Farmer in Pulincunnoo (submits BPH disease or salinity reports).
- **Radhakrishnan M. (രാധാകൃഷ്ണൻ)**: Farmer in Moncompu (confirms neighbor reports).
- **Sreedhar P. (ശ്രീധർ)**: Krishi Officer at Champakulam Krishi Bhavan (officially verifies reports).
