# Karshakan Lens - Supabase & PostGIS Migrations

This folder contains the database schema and seed data for the **Karshakan Lens** community-verified early-warning platform.

## Migrations Overview

1. `001_init_postgis.sql`:
   - Enables the `postgis` and `uuid-ossp` extensions.
   - Creates the core tables:
     - `profiles`: Farmer & Officer accounts with spatial land locations.
     - `canal_segments`: LineString geometries with upstream and downstream self-referential graph keys.
     - `reports`: Crowdsourced incident logs (`crop_disease`, `salinity`, `bird_deaths`, `bund_seepage`, `crop_loss`).
     - `report_confirmations`: Peer confirmations by neighboring farmers with unique constraint `(report_id, confirmer_id)`.
     - `remedies_kau`: Curated Kerala Agricultural University Package of Practices remedies.
     - `clusters`: DBSCAN computed spatial clusters for disease and bird deaths.
   - Defines spatial GiST indexes for millisecond query performance across Kuttanad delta coordinates.
   - Helper function `find_nearest_canal_segment(pt_geog)` for PostGIS distance snapping.

2. `002_seed_kuttanad.sql`:
   - Realistic seed data for the central Kuttanad agricultural polders (Pulincunnoo, Moncompu, Nedumudy, Champakulam, Kainakary).
   - 5 interconnected canal segments with upstream/downstream topological links.
   - 4 farmer profiles + 1 Krishi Bhavan agricultural officer profile.
   - Verified KAU Package of Practices recommendations for Brown Plant Hopper (`brown_planthopper`), Sheath Blight (`sheath_blight`), Bacterial Leaf Blight (`bacterial_leaf_blight`), and Rice Blast (`rice_blast`).
   - Clearly labeled seeded crowd reports with `is_sample: true` in `details`.

## Running Migrations in Supabase
In your Supabase project dashboard:
1. Open the **SQL Editor**.
2. Run `001_init_postgis.sql`.
3. Run `002_seed_kuttanad.sql`.
