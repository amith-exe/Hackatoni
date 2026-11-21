# Karshakan Lens Architecture

## System overview

```mermaid
flowchart LR
  Farmer[Farmer / Mobile PWA]
  Officer[Krishi Bhavan Officer]
  UI[Next.js 14 App Router\nTypeScript + Tailwind + lucide-react\nEN / ML toggle]
  Map[Leaflet Live Map\nOSM HOT / OSM / Esri]
  API[FastAPI REST API]
  Reports[Report + Trust Router]
  Vision[Gemini Vision Router\nStructured Leaf Diagnosis]
  Trend[DBSCAN Trend Engine\nHaversine distance]
  Canal[Canal Graph Router\nSalinity propagation]
  Safety[Deterministic Safety + KAU Guidance]
  Weather[Open-Meteo Rainfall]
  Store[(InMemoryDatabase\nproduction target: PostgreSQL/PostGIS)]
  SQL[(Supabase/PostGIS\n001 schema + 002 seeds)]

  Farmer --> UI
  Officer --> UI
  UI --> Map
  UI --> API
  API --> Reports
  API --> Vision
  API --> Trend
  API --> Canal
  API --> Safety
  Canal --> Weather
  Reports --> Store
  Vision --> Safety
  Trend --> Store
  Canal --> Store
  SQL -. migration/production target .-> Store
```

## Main runtime modules

| Layer | Current implementation | Responsibility |
|---|---|---|
| Presentation | `frontend/src/app`, `components`, `lib/api.ts` | Map, scan, report, verification, alerts, filters, GPS/preset locations |
| Mapping | `KuttanadMap.tsx` | Report pins, canal lines, DBSCAN circles, 3 km trend ring, fit-to-data view |
| API | `backend/app/main.py` and routers | REST endpoints, request validation, response shaping |
| Intelligence | `services/clustering.py`, `canal_routing.py`, `remedies.py` | DBSCAN, salinity graph traversal, curated KAU actions |
| Vision | `routers/vision.py` | Gemini structured diagnosis, demo samples, confidence guardrail |
| Repository | `services/db.py` | Seeded in-memory runtime with spatial emulation and trust state |
| Production schema | `supabase/*.sql` | PostGIS tables, indexes, canal helper, seed data |

## Request paths

### Leaf scan

```mermaid
sequenceDiagram
  participant U as User
  participant P as Next.js /scan
  participant V as FastAPI /api/vision/diagnose
  participant G as Gemini Vision
  participant K as KAU Registry
  participant D as Local Repository

  U->>P: Select photo or demo sample
  P->>V: multipart image + lat/lng
  V->>G: gemini-2.5-flash structured JSON
  G-->>V: code, confidence, observations
  alt model unavailable
    V->>G: compatibility fallback model
  end
  alt confidence < 0.70 or unknown
    V-->>P: uncertain, no spray advice
  else confident diagnosis
    V->>K: exact disease-code lookup
    V->>D: nearby report and canal context
    V-->>P: diagnosis + KAU actions
  end
```

### Trust and report path

```mermaid
stateDiagram-v2
  [*] --> unconfirmed: POST /api/reports
  unconfirmed --> unconfirmed: one unique peer confirm
  unconfirmed --> community_confirmed: second unique peer confirm
  community_confirmed --> officially_verified: officer approves
  unconfirmed --> officially_verified: officer approves
  unconfirmed --> rejected: officer rejects
  community_confirmed --> rejected: officer rejects
  officially_verified --> [*]
  rejected --> [*]
```

## Deployment boundaries

The current demo starts without Supabase because `InMemoryDatabase` is preloaded with Kuttanad geography and reports. The SQL migrations are the production database design. Before production, connect a PostGIS repository, add authenticated role claims, restrict CORS, and wire the planned Sarvam voice service.
