# Karshakan Lens Database Architecture

## Production data model

```mermaid
erDiagram
  PROFILES ||--o{ REPORTS : submits
  PROFILES ||--o{ REPORT_CONFIRMATIONS : confirms
  REPORTS ||--o{ REPORT_CONFIRMATIONS : receives
  CANAL_SEGMENTS ||--o{ PROFILES : nearest_to
  CANAL_SEGMENTS ||--o{ REPORTS : snaps_to
  CANAL_SEGMENTS ||--o| CANAL_SEGMENTS : upstream
  CANAL_SEGMENTS ||--o| CANAL_SEGMENTS : downstream
  REMEDIES_KAU {
    text disease_code PK
    text disease_name_en
    text disease_name_ml
    jsonb immediate_actions
    text spray_guidance
    text source_citation
    date last_checked
  }
  PROFILES {
    uuid id PK
    text name
    text phone
    text role
    text village_or_padasekharam
    geography land_location
    uuid nearest_canal_id FK
  }
  CANAL_SEGMENTS {
    uuid id PK
    text name
    geography geom
    uuid upstream_segment_id FK
    uuid downstream_segment_id FK
  }
  REPORTS {
    uuid id PK
    uuid reporter_id FK
    text report_type
    geography location
    uuid canal_segment_id FK
    jsonb details
    text verification_status
    int confirmations_count
    timestamptz created_at
  }
  REPORT_CONFIRMATIONS {
    uuid id PK
    uuid report_id FK
    uuid confirmer_id FK
    timestamptz created_at
  }
  CLUSTERS {
    uuid id PK
    text report_type
    text sub_category
    geography center
    int report_count
    timestamptz window_start
    timestamptz window_end
    text trend
    text alert_level
  }
```

## Spatial design

- `profiles.land_location` and `reports.location` use `geography(Point, 4326)`.
- `canal_segments.geom` uses `geography(LineString, 4326)`.
- `clusters.center` uses `geography(Point, 4326)`.
- GiST indexes support point, line, and cluster spatial lookups.
- `find_nearest_canal_segment(pt_geog)` orders canal segments by `ST_Distance` and returns the nearest canal.
- The local Python repository mirrors the same behavior with Haversine distance and point-to-linestring sampling.

## Privacy model

`reporter_id`, names, and phone numbers are private data. They are stored internally for trust checks but are removed by `db.to_public_response()` before public map, report, officer, and trend responses. Officer verification stores an officer reference in internal report details; it is not exposed as a farmer identity.

## Trust integrity

```mermaid
flowchart TD
  R[Report created] --> C{Confirmation request}
  C --> Self{Is confirmer reporter?}
  Self -->|yes| Block[400: reject self-confirmation]
  Self -->|no| Duplicate{Existing report + confirmer pair?}
  Duplicate -->|yes| Conflict[409: reject duplicate]
  Duplicate -->|no| Insert[Insert confirmation]
  Insert --> Count{Count >= 2?}
  Count -->|no| Pending[Remain unconfirmed]
  Count -->|yes| Promote[community_confirmed]
```

## Runtime versus migration state

`supabase/001_init_postgis.sql` and `002_seed_kuttanad.sql` define the intended persistent schema and seeded geography. The current demo uses `backend/app/services/db.py` so judges can run it locally without a database. A production migration should replace repository methods with Postgres/PostGIS queries while preserving the public anonymization boundary.
