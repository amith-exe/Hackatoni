# PadamGuardian / Karshakan Lens

## Community-Verified Geospatial Early-Warning & Agronomic Intelligence Network for Kuttanad

Karshakan Lens is a mobile-first PWA for Kuttanad farmers and Krishi Bhavan officers. It combines:

- **Place & People:** GPS-tagged reports, padasekharam/canal context, peer confirmations, and officer verification.
- **Physical-world computing:** nearest-canal snapping, canal salinity propagation, Open-Meteo rainfall telemetry, Leaflet mapping, and Gemini Vision leaf diagnosis.
- **Voice & language:** English-first UI with an `EN / ML` toggle. `notes_text` is reserved for future Sarvam Malayalam STT/TTS; Sarvam is not currently wired as a live API dependency.

The platform turns a local observation into a spatially aware warning, a vetted agronomic action, and a trusted community record.

## The Kuttanad Problem

Kuttanad spans Alappuzha and Kottayam districts of Kerala and is widely known for below-sea-level farming. Paddy is cultivated inside embanked polders called *padasekharams*, often around 1.5–2.5 metres below sea level, with interconnected canals and Vembanad Lake controlling the water system.

### Five recurring crises and the system response

1. **Tidal salinity intrusion (*uppuvellam*) and shutter leakage**

   Brackish water can travel inland from Vembanad during high tides, low-flow periods, or Thanneermukkom Bund/spillway shutter problems. Water above the app's 2.0 ppt danger threshold can damage paddy roots and grain filling, contributing to quality deductions (*kizhivu*).

   **Solution:** salinity reports are snapped to canals and routed through connected upstream segments. Open-Meteo rainfall becomes a freshwater-dilution signal. Warnings follow the canal graph, not an arbitrary circular radius, and return pump and sluice-gate guidance.

2. **Rapid pest and fungal epidemics**

   Brown Planthopper (*chazhi*), Sheath Blight, Bacterial Leaf Blight, Rice Blast, Sheath Rot, Brown Leaf Spot, Rice Tungro, Stem Borer, Leaf Folder, Gall Midge, Hispa, False Smut, and Grain Discoloration can spread through humid contiguous fields.

   **Solution:** Gemini Vision diagnoses leaf images, confidence below 0.70 becomes `Not sure — ask your Krishi Bhavan`, confident diagnoses use deterministic KAU Package of Practices guidance, and recent reports are grouped with Haversine DBSCAN.

3. **Outer ring-bund seepage (*madaveezhcha*) and piping breaches**

   Waterhead pressure can create internal piping in earthen bunds. A missed leak can breach a bund and flood standing paddy rapidly.

   **Solution:** geotagged `bund_seepage` reports retain exact field context and return reverse-filter sandbagging, pumping, and escalation guidance.

4. **Duck mortality and avian-biosecurity risk**

   Duck flocks share canals and backwaters. Delayed reporting of sudden mortality can allow a disease event to move between flocks.

   **Solution:** `bird_deaths` reports receive isolation/deep-burial/veterinary notification guidance and can form mortality clusters.

5. **Missed 72-hour crop-loss evidence windows**

   Farmers can lose insurance eligibility when timestamped and geotagged evidence is not captured promptly after a calamity.

   **Solution:** `crop_loss` reports preserve coordinates, timestamps, notes, and structured loss details for officer review, with deterministic AIMS/PMFBY evidence guidance.

## Why DBSCAN Fits Kuttanad

DBSCAN (Density-Based Spatial Clustering of Applications with Noise) uses geographic Haversine distance. The interactive trend endpoint uses a 7-day current window, a prior comparison window, requested `eps` (default 2.0 km), and `min_samples=3`. The map feed uses configured overview defaults.

- **Irregular geography:** fields follow canals, bunds, and winding waterways rather than square grid cells.
- **Noise filtering:** isolated reports remain noise rather than causing a false regional alarm.
- **No cluster-count guess:** unlike K-Means, DBSCAN does not require a predetermined number of outbreaks.
- **Interactive comparison:** users can choose a GPS point, map point, or padasekharam preset, run `POST /api/trends/analyze`, compare clustered versus noise reports, and retain multiple location runs.

## User Workflows

### Persona A — Paddy farmer: Thomas Kutty, Pulincunnoo

1. Opens the PWA, uses the `EN / ML` toggle, and uses GPS or a dropped map pin to check local reports, rainfall, and canal salinity.
2. Sees yellowing leaves and opens `/scan`, uploads a photo, or tries a demo sample.
3. Receives a KAU action plan or the safe low-confidence fallback. The current code does not yet include live Sarvam STT/TTS.
4. Reports the diagnosis to the Live Map and receives subsequent alerts as neighbors confirm the event.

### Persona B — Neighboring farmer: Radhakrishnan M., Moncompu

1. Sees an amber `unconfirmed` report in Verify Queue or Alerts.
2. Confirms it once. Self-confirmation and duplicate votes are blocked; the second unique peer confirmation promotes it to `community_confirmed`.

### Persona C — Krishi Bhavan officer: Sreedhar P., Champakulam

1. Filters by category, disease, verification state, and 24-hour/7-day/14-day window.
2. Compares Pulincunnoo, Alappuzha, Kumarakom, Thrissur Kole, or Palakkad with Find Trend (Run DBSCAN).
3. Marks reports `officially_verified` or `rejected` and prioritizes growing clusters, Danger canal branches, mortality events, and bund seepage.

## Complete Report and Trust Lifecycle

```text
Map click / GPS / Leaf Scan / future Malayalam voice note
                         |
                         v
              POST /api/reports or /api/vision/diagnose
                         |
                         v
      nearest canal snap: Haversine/PostGIS ST_Distance equivalent
                         |
       +-----------------+-------------------+-----------------+
       |                 |                   |                 |
 Crop Disease        Salinity          Duck deaths       Bund / loss
       |                 |                   |                 |
 Gemini + KAU       Open-Meteo +      deterministic     safety/AIMS
 remedy + DBSCAN    upstream graph     biosecurity       checklists
       +-----------------+-------------------+-----------------+
                         |
                         v
       public responses strip reporter_id, names, and phone numbers
                         |
                    unconfirmed
                         |
          2+ unique peer confirmations
                         |
                 community_confirmed
                         |
          officer: officially_verified / rejected
```

## System Architecture

```text
Next.js 14 PWA / TypeScript / Tailwind
  Leaflet + OSM HOT + Esri Satellite + lucide-react + EN/ML
  Live Map | Leaf Scan | Report | Verify Queue | Alerts
                         |
                         | REST /api
                         v
FastAPI backend
  report branching and trust state machine
  Gemini Vision router and KAU remedy lookup
  Haversine DBSCAN engine
  canal graph + Open-Meteo rainfall router
                         |
                         v
PostgreSQL + PostGIS migrations / local in-memory repository
```

The running demo currently uses `InMemoryDatabase` in `backend/app/services/db.py`, seeded at startup. The SQL migrations describe the production PostGIS design; a live Supabase/Postgres repository is not yet connected to the FastAPI runtime.

## Database Design

| Table | Purpose | Spatial/integrity details |
|---|---|---|
| `profiles` | Farmer and officer profiles | `geography(Point, 4326)`, role and farm metadata, GiST index |
| `canal_segments` | Connected waterways | `geography(LineString, 4326)`, upstream/downstream keys, GiST index |
| `reports` | Crop, water, bird, bund, and loss events | `geography(Point, 4326)`, type/status/time indexes, private `reporter_id` |
| `report_confirmations` | Peer trust votes | `UNIQUE (report_id, confirmer_id)` anti-duplication constraint |
| `remedies_kau` | Curated disease/pest actions | Disease-code primary key, citation, cultural and approved guidance |
| `clusters` | Persistable DBSCAN outputs | Center, window, count, trend, and alert level |

`supabase/001_init_postgis.sql` defines `find_nearest_canal_segment(pt_geog)`, which orders canal geometries by spatial distance. The local repository mirrors this with Haversine point-to-linestring emulation.

## Gemini Vision and Sarvam AI

### Gemini Vision

`POST /api/vision/diagnose` accepts multipart image uploads or JSON demo inputs. The primary configured model is `gemini-2.5-flash`; if Google returns the model-unavailable 404 seen for some new accounts, the implementation retries with Google's recommended compatibility model.

Structured output is constrained to:

```text
brown_planthopper | sheath_blight | bacterial_leaf_blight | rice_blast
sheath_rot | brown_leaf_spot | rice_tungro | unknown
```

Responses include confidence, visual observations, image quality, nearby report count, and nearest canal. Below 0.70, no KAU spray guidance is returned. At or above 0.70, the disease code is used only as a lookup key into `KAU_REMEDIES_REGISTRY`; Gemini never generates chemical dosages.

The scanner includes three offline samples plus the real `frontend/demo data/image.png` asset. The real demo image has been tested through the Gemini upload path and returned a Rice Blast result with a KAU action plan.

### Sarvam status

The product design reserves `saaras:v3`/`saarika:v2.5` STT and `bulbul:v3`/`bulbul:v2` TTS for Malayalam `ml-IN` voice notes and spoken action plans. Sarvam is not currently wired as a live SDK, router, or dependency in this repository. The current safe path is typed notes, scanner observations, curated KAU text, and the EN/ML UI toggle.

## Important API Endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| `GET` | `/api/map-feed` | Filtered reports, clusters, canals, rainfall, and outbreak breakdown |
| `POST` | `/api/reports` | Create a public-anonymized incident report |
| `POST` | `/api/reports/{id}/confirm` | Add a unique peer confirmation |
| `POST` | `/api/reports/{id}/verify` | Officer verification or rejection |
| `POST` | `/api/trends/analyze` | Multi-location Haversine DBSCAN trend run |
| `POST` | `/api/vision/diagnose` | Gemini/offline leaf diagnosis and KAU lookup |
| `GET` | `/api/officer/dashboard` | Officer queue, clusters, critical canals, digest |
| `GET` | `/api/remedies/{disease_code}` | KAU remedy lookup |
| `GET` | `/api/alerts` | Salinity, cluster, and verification alerts |
| `GET` | `/api/trends/local` | Local radius trend and nearest-canal context |

Public report, map, and officer response models omit `reporter_id`, names, and phone numbers.

## Quick Start

### Backend

```powershell
python -m pip install -r backend/requirements.txt
```

Create/edit `backend/.env`:

```env
GEMINI_API_KEY=your_gemini_key
SARVAM_API_KEY=                 # reserved for planned voice integration
```

Start from the repository root:

```powershell
python -m uvicorn backend.app.main:app --host 0.0.0.0 --port 8000 --reload
```

Swagger: http://localhost:8000/docs

Run the existing backend suite:

```powershell
python backend/tests/run_tests.py
```

Expected result: **8 passed, 0 failed**. Startup demo data is marked `is_sample: true` and includes Kuttanad plus comparison points in Alappuzha, Kumarakom, Changanassery, Cherthala, Thiruvalla, Kayamkulam, Kollam, Ernakulam, Thrissur Kole, and Palakkad.

### Frontend

```powershell
cd frontend
pnpm install
pnpm dev
```

Open http://localhost:3000. Use `/scan` for the Leaf Scan flow, `/` for Live Map and DBSCAN comparison, `/report` for manual incidents, `/verify` for trust progression, and `/alerts` for the notification inbox.

### Supabase/PostGIS

Run in the Supabase SQL editor, in order:

```text
supabase/001_init_postgis.sql
supabase/002_seed_kuttanad.sql
```

These create the six core tables, spatial indexes, canal seed graph, KAU remedies, profiles, and sample reports. The local FastAPI demo does not require Supabase to start.

## Safety, Privacy, and Demo Boundaries

- Low-confidence leaf diagnosis never exposes chemical spray advice.
- KAU actions are deterministic registry lookups, not generated treatment plans.
- Public feeds strip reporter identity fields.
- Demo login is simplified and is not production authentication.
- `backend/.env` is ignored by Git; never commit API keys.
- OpenStreetMap/Esri and Open-Meteo are external services; fallback data keeps core demo flows usable.
- Production hardening should connect PostGIS, add authenticated role claims, restrict CORS, wire Sarvam, and replace deterministic classifier fallbacks with an audited model/service.

## Judge Demo Plan

1. Open the Live Map and click **Show All Data**.
2. Open **Filters & Find Trend** and show the `24 Hours / 7 Days / 14 Days`, category, disease, verification, and visible-layer controls.
3. Select Pulincunnoo and run DBSCAN. Explain clustered reports versus isolated noise and the 3 km analysis ring.
4. Repeat at Alappuzha, Kumarakom, Thrissur Kole, or Palakkad to show different disease clusters.
5. Open `/scan`, choose **Demo Data Folder: Rice Leaf Photo**, and run Gemini Vision.
6. Show the structured Rice Blast result, visual clues, KAU plan, nearest canal, and nearby report count.
7. Click **Report This Issue to Live Map**, return to `/`, and show the anonymized pin.
8. Switch persona to a neighboring farmer, confirm the report twice, then switch to the officer and verify it.
9. Finish with the salinity story: the alert propagates along connected canals and uses rainfall dilution rather than a misleading point-radius alert.

**Core thesis:** PadamGuardian connects place, people, and practical agronomy before a local warning becomes a regional loss.
