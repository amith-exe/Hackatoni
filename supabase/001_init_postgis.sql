-- 001_init_postgis.sql
-- Karshakan Lens: Community-verified early-warning platform for Kuttanad paddy and duck farmers
-- Database Initialization & Schema with PostGIS

-- 1. Enable PostGIS Extension
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Drop existing tables if needed (in reverse dependency order)
DROP TABLE IF EXISTS clusters CASCADE;
DROP TABLE IF EXISTS report_confirmations CASCADE;
DROP TABLE IF EXISTS reports CASCADE;
DROP TABLE IF EXISTS remedies_kau CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;
DROP TABLE IF EXISTS canal_segments CASCADE;

-- 3. canal_segments table
-- Represents hydrological canals, rivers, and feeder waterways of the Kuttanad delta.
CREATE TABLE canal_segments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    geom GEOGRAPHY(LineString, 4326) NOT NULL,
    upstream_segment_id UUID REFERENCES canal_segments(id) ON DELETE SET NULL,
    downstream_segment_id UUID REFERENCES canal_segments(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Spatial index on canal geometry
CREATE INDEX idx_canal_segments_geom ON canal_segments USING GIST (geom);
CREATE INDEX idx_canal_segments_upstream ON canal_segments(upstream_segment_id);
CREATE INDEX idx_canal_segments_downstream ON canal_segments(downstream_segment_id);

-- 4. profiles table
-- Farmers, Krishi Bhavan Agricultural Officers, and Vet Doctors
CREATE TABLE profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('farmer', 'officer')),
    village_or_padasekharam TEXT NOT NULL,
    farm_type TEXT NOT NULL CHECK (farm_type IN ('paddy', 'duck', 'both')),
    land_location GEOGRAPHY(Point, 4326) NOT NULL,
    nearest_canal_id UUID REFERENCES canal_segments(id) ON DELETE SET NULL,
    flow_direction TEXT NOT NULL DEFAULT 'unknown' CHECK (flow_direction IN ('toward_sea', 'inland', 'unknown')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Spatial and relational indexes on profiles
CREATE INDEX idx_profiles_land_location ON profiles USING GIST (land_location);
CREATE INDEX idx_profiles_nearest_canal ON profiles(nearest_canal_id);
CREATE INDEX idx_profiles_role ON profiles(role);

-- 5. reports table
-- Core crowdsourced reports for disease, salinity, bird deaths, bund seepage, and crop loss.
-- SECURITY & PRIVACY: reporter_id is strictly private and MUST NEVER be exposed in public API feeds.
CREATE TABLE reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reporter_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    report_type TEXT NOT NULL CHECK (report_type IN ('crop_disease', 'salinity', 'bird_deaths', 'bund_seepage', 'crop_loss')),
    location GEOGRAPHY(Point, 4326) NOT NULL,
    canal_segment_id UUID REFERENCES canal_segments(id) ON DELETE SET NULL,
    flow_direction TEXT NOT NULL DEFAULT 'unknown' CHECK (flow_direction IN ('toward_sea', 'inland', 'unknown')),
    photo_url TEXT,
    notes_text TEXT, -- Reserved for future Sarvam STT integration
    details JSONB NOT NULL DEFAULT '{}'::jsonb,
    verification_status TEXT NOT NULL DEFAULT 'unconfirmed' CHECK (
        verification_status IN ('unconfirmed', 'community_confirmed', 'officially_verified', 'rejected')
    ),
    confirmations_count INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Spatial & search indexes on reports
CREATE INDEX idx_reports_location ON reports USING GIST (location);
CREATE INDEX idx_reports_type ON reports(report_type);
CREATE INDEX idx_reports_status ON reports(verification_status);
CREATE INDEX idx_reports_canal ON reports(canal_segment_id);
CREATE INDEX idx_reports_created_at ON reports(created_at DESC);

-- 6. report_confirmations table
-- Trust-verification peer reviews by neighboring farmers
CREATE TABLE report_confirmations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_id UUID NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
    confirmer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT unique_report_confirmer UNIQUE (report_id, confirmer_id)
);

CREATE INDEX idx_confirmations_report ON report_confirmations(report_id);
CREATE INDEX idx_confirmations_confirmer ON report_confirmations(confirmer_id);

-- 7. remedies_kau table
-- Curated Kerala Agricultural University (KAU) Package of Practices lookup table.
-- Rule: Never generate chemical dosages with an LLM. Must come strictly from this vetted table.
CREATE TABLE remedies_kau (
    disease_code TEXT PRIMARY KEY,
    disease_name_en TEXT NOT NULL,
    disease_name_ml TEXT NOT NULL,
    immediate_actions JSONB NOT NULL DEFAULT '[]'::jsonb,
    spray_guidance TEXT NOT NULL,
    source_citation TEXT NOT NULL,
    last_checked DATE NOT NULL DEFAULT CURRENT_DATE
);

-- 8. clusters table
-- Spatial clusters computed using DBSCAN (e.g., crop disease outbreaks and bird mortality hot-zones)
CREATE TABLE clusters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_type TEXT NOT NULL,
    sub_category TEXT, -- e.g. disease_code or mortality cluster
    center GEOGRAPHY(Point, 4326) NOT NULL,
    report_count INT NOT NULL DEFAULT 1,
    window_start TIMESTAMPTZ NOT NULL,
    window_end TIMESTAMPTZ NOT NULL,
    trend TEXT NOT NULL CHECK (trend IN ('new', 'growing', 'stable')),
    alert_level TEXT NOT NULL CHECK (alert_level IN ('Watch', 'Warning', 'Danger')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_clusters_center ON clusters USING GIST (center);
CREATE INDEX idx_clusters_type ON clusters(report_type);
CREATE INDEX idx_clusters_window ON clusters(window_start, window_end);

-- 9. Helper Function: Snap Point to Nearest Canal Segment using PostGIS ST_Distance
CREATE OR REPLACE FUNCTION find_nearest_canal_segment(pt_geog GEOGRAPHY)
RETURNS TABLE (
    canal_id UUID,
    canal_name TEXT,
    distance_meters DOUBLE PRECISION
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.id AS canal_id,
        c.name AS canal_name,
        ST_Distance(c.geom, pt_geog) AS distance_meters
    FROM canal_segments c
    ORDER BY c.geom <-> pt_geog
    LIMIT 1;
END;
$$ LANGUAGE plpgsql STABLE;
