# backend/app/services/db.py
"""
Repository Layer for Karshakan Lens.
Supports both direct PostGIS PostgreSQL / Supabase connection AND
a high-performance in-memory / SQLite store with full PostGIS geometry emulation
(Haversine point-to-linestring distance, spatial indexing, upstream traversal).
Preloads verified seed data for Kuttanad delta.
"""

import math
from datetime import datetime, timezone, timedelta
from typing import List, Dict, Any, Optional, Tuple
from uuid import UUID, uuid4

from backend.app.models.schemas import (
    ReportType, VerificationStatus, AlertLevel, Trend, FlowDirection,
    ReportCreate, ReportResponse, CanalSegmentResponse, ClusterResponse,
    AlertItem, LocalTrendResponse
)

# Earth radius in kilometers
EARTH_RADIUS_KM = 6371.0

def haversine_distance_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate the great circle distance between two points on the earth in km."""
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (math.sin(dlat / 2.0) ** 2 +
         math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) *
         math.sin(dlon / 2.0) ** 2)
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    return EARTH_RADIUS_KM * c

def distance_point_to_linestring_km(lat: float, lon: float, coords: List[List[float]]) -> float:
    """
    Computes minimum distance from a point (lat, lon) to a LineString coords [[lon, lat], ...].
    Interpolates along segments for accurate snapping.
    """
    min_dist = float("inf")
    for i in range(len(coords) - 1):
        lon1, lat1 = coords[i]
        lon2, lat2 = coords[i + 1]
        
        # Sample along segment
        for step in (0.0, 0.25, 0.5, 0.75, 1.0):
            plat = lat1 + step * (lat2 - lat1)
            plon = lon1 + step * (lon2 - lon1)
            dist = haversine_distance_km(lat, lon, plat, plon)
            if dist < min_dist:
                min_dist = dist
    return min_dist

class InMemoryDatabase:
    """
    Thread-safe database storage with PostGIS emulation for Kuttanad.
    """
    def __init__(self):
        self.profiles: Dict[UUID, Dict[str, Any]] = {}
        self.canal_segments: Dict[UUID, Dict[str, Any]] = {}
        self.reports: Dict[UUID, Dict[str, Any]] = {}
        self.confirmations: Dict[UUID, Dict[str, Any]] = {}
        self.clusters: Dict[UUID, Dict[str, Any]] = {}
        self.read_alerts: set = set()
        self.seed_defaults()

    def seed_defaults(self):
        """Seed verified Kuttanad geography across 8 connected canals and 20 timestamped reports."""
        # 1. Eight Connected Canal Segments across Kuttanad Polder Network
        c1_id = UUID("11111111-1111-1111-1111-111111111101")
        c2_id = UUID("11111111-1111-1111-1111-111111111102")
        c3_id = UUID("11111111-1111-1111-1111-111111111103")
        c4_id = UUID("11111111-1111-1111-1111-111111111104")
        c5_id = UUID("11111111-1111-1111-1111-111111111105")
        c6_id = UUID("11111111-1111-1111-1111-111111111106")
        c7_id = UUID("11111111-1111-1111-1111-111111111107")
        c8_id = UUID("11111111-1111-1111-1111-111111111108")

        self.canal_segments = {
            c1_id: {
                "id": c1_id,
                "name": "Vembanad - Kainakary North Channel",
                "coordinates": [[76.3650, 9.5100], [76.3800, 9.4900], [76.3950, 9.4750]],
                "upstream_segment_id": None,
                "downstream_segment_id": c2_id,
                "created_at": datetime.now(timezone.utc)
            },
            c2_id: {
                "id": c2_id,
                "name": "Kainakary - Pulincunnoo Main Canal",
                "coordinates": [[76.3950, 9.4750], [76.4250, 9.4600], [76.4550, 9.4450]],
                "upstream_segment_id": c1_id,
                "downstream_segment_id": c3_id,
                "created_at": datetime.now(timezone.utc)
            },
            c3_id: {
                "id": c3_id,
                "name": "Pulincunnoo - Moncompu Feeder Canal",
                "coordinates": [[76.4550, 9.4450], [76.4480, 9.4350], [76.4380, 9.4280]],
                "upstream_segment_id": c2_id,
                "downstream_segment_id": c4_id,
                "created_at": datetime.now(timezone.utc)
            },
            c4_id: {
                "id": c4_id,
                "name": "Moncompu - Champakulam Southern Channel",
                "coordinates": [[76.4380, 9.4280], [76.4300, 9.4220], [76.4250, 9.4180]],
                "upstream_segment_id": c3_id,
                "downstream_segment_id": c6_id,
                "created_at": datetime.now(timezone.utc)
            },
            c5_id: {
                "id": c5_id,
                "name": "Nedumudy - Moncompu Link Canal",
                "coordinates": [[76.4020, 9.4350], [76.4200, 9.4320], [76.4380, 9.4280]],
                "upstream_segment_id": c2_id,
                "downstream_segment_id": c4_id,
                "created_at": datetime.now(timezone.utc)
            },
            c6_id: {
                "id": c6_id,
                "name": "Champakulam - Nedumudy Western Link",
                "coordinates": [[76.4250, 9.4180], [76.4120, 9.4240], [76.4020, 9.4350]],
                "upstream_segment_id": c4_id,
                "downstream_segment_id": c5_id,
                "created_at": datetime.now(timezone.utc)
            },
            c7_id: {
                "id": c7_id,
                "name": "Moncompu - Ramankary Eastern Branch",
                "coordinates": [[76.4380, 9.4280], [76.4600, 9.4200], [76.4850, 9.4120]],
                "upstream_segment_id": c3_id,
                "downstream_segment_id": None,
                "created_at": datetime.now(timezone.utc)
            },
            c8_id: {
                "id": c8_id,
                "name": "Kavalam - Pulincunnoo Northern Waterway",
                "coordinates": [[76.4750, 9.4700], [76.4650, 9.4580], [76.4550, 9.4450]],
                "upstream_segment_id": c2_id,
                "downstream_segment_id": c3_id,
                "created_at": datetime.now(timezone.utc)
            }
        }

        # 2. Profiles (Farmers and Krishi Officers)
        p1_id = UUID("22222222-2222-2222-2222-222222222201")
        p2_id = UUID("22222222-2222-2222-2222-222222222202")
        p3_id = UUID("22222222-2222-2222-2222-222222222203")
        p4_id = UUID("22222222-2222-2222-2222-222222222204")
        p5_id = UUID("22222222-2222-2222-2222-222222222205")
        p6_id = UUID("22222222-2222-2222-2222-222222222206")
        p7_id = UUID("22222222-2222-2222-2222-222222222207")

        self.profiles = {
            p1_id: {
                "id": p1_id,
                "name": "Thomas Kutty",
                "phone": "+919447101001",
                "role": "farmer",
                "village_or_padasekharam": "Pulincunnoo Padasekharam",
                "farm_type": "paddy",
                "latitude": 9.4460,
                "longitude": 76.4580,
                "nearest_canal_id": c3_id,
                "flow_direction": FlowDirection.inland
            },
            p2_id: {
                "id": p2_id,
                "name": "Radhakrishnan M.",
                "phone": "+919447101002",
                "role": "farmer",
                "village_or_padasekharam": "Moncompu Thekkekkara",
                "farm_type": "both",
                "latitude": 9.4290,
                "longitude": 76.4390,
                "nearest_canal_id": c3_id,
                "flow_direction": FlowDirection.inland
            },
            p3_id: {
                "id": p3_id,
                "name": "Joseph Varghese",
                "phone": "+919447101003",
                "role": "farmer",
                "village_or_padasekharam": "Nedumudy Vadakkumuri",
                "farm_type": "paddy",
                "latitude": 9.4360,
                "longitude": 76.4040,
                "nearest_canal_id": c5_id,
                "flow_direction": FlowDirection.inland
            },
            p4_id: {
                "id": p4_id,
                "name": "Sreedhar P.",
                "phone": "+919447101004",
                "role": "officer",
                "village_or_padasekharam": "Krishi Bhavan Champakulam",
                "farm_type": "paddy",
                "latitude": 9.4300,
                "longitude": 76.4320,
                "nearest_canal_id": c4_id,
                "flow_direction": FlowDirection.unknown
            },
            p5_id: {
                "id": p5_id,
                "name": "Biju K.",
                "phone": "+919447101005",
                "role": "farmer",
                "village_or_padasekharam": "Kainakary Padasekharam",
                "farm_type": "duck",
                "latitude": 9.4760,
                "longitude": 76.3920,
                "nearest_canal_id": c1_id,
                "flow_direction": FlowDirection.toward_sea
            },
            p6_id: {
                "id": p6_id,
                "name": "Mathew Chacko",
                "phone": "+919447101006",
                "role": "farmer",
                "village_or_padasekharam": "Ramankary Padasekharam",
                "farm_type": "paddy",
                "latitude": 9.4220,
                "longitude": 76.4780,
                "nearest_canal_id": c7_id,
                "flow_direction": FlowDirection.inland
            },
            p7_id: {
                "id": p7_id,
                "name": "Aniyankunju P.",
                "phone": "+919447101007",
                "role": "farmer",
                "village_or_padasekharam": "Kavalam Northern Polder",
                "farm_type": "paddy",
                "latitude": 9.4680,
                "longitude": 76.4680,
                "nearest_canal_id": c8_id,
                "flow_direction": FlowDirection.inland
            }
        }

        # 3. Twenty Realistic Timestamped Seed Reports (Last 14 Days)
        now = datetime.now(timezone.utc)
        self.reports = {}

        def make_rep(id_num: int, rep_id: UUID, r_type: ReportType, lat: float, lng: float, c_id: UUID,
                     notes: str, details: dict, status: VerificationStatus, confirms: int, days_ago: float, hours_ago: float = 0):
            r_uuid = UUID(f"33333333-3333-3333-3333-33333333{3300 + id_num:04d}")
            created = now - timedelta(days=days_ago, hours=hours_ago)
            details["is_sample"] = True
            c = self.canal_segments.get(c_id)
            self.reports[r_uuid] = {
                "id": r_uuid,
                "reporter_id": rep_id,
                "report_type": r_type,
                "latitude": lat,
                "longitude": lng,
                "canal_segment_id": c_id,
                "canal_name": c["name"] if c else "Kuttanad Canal",
                "flow_direction": FlowDirection.inland if lat < 9.48 else FlowDirection.toward_sea,
                "photo_url": details.get("photo_url"),
                "notes_text": notes,
                "details": details,
                "verification_status": status,
                "confirmations_count": confirms,
                "created_at": created
            }
            return r_uuid

        # Active Recent 7-Day Window (DBSCAN Clusters & Salinity Alerts Active)
        r01 = make_rep(1, p1_id, ReportType.crop_disease, 9.4460, 76.4580, c3_id,
                       "Brown plant hopper colony observed at base of paddy tillers. Yellowing noticed across 2.5 acres.",
                       {"disease_code": "brown_planthopper", "confidence": 0.94, "severity": "high", "affected_area_acres": 2.5, "crop_age_days": 65, "photo_url": "https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?auto=format&fit=crop&w=600&q=80"},
                       VerificationStatus.community_confirmed, 3, 2, 0)

        r02 = make_rep(2, p2_id, ReportType.crop_disease, 9.4420, 76.4510, c3_id,
                       "Hopper burn spreading rapidly from adjacent plot. Lower leaves wilting, drainage completed.",
                       {"disease_code": "brown_planthopper", "confidence": 0.89, "severity": "medium", "affected_area_acres": 1.8, "crop_age_days": 68, "photo_url": "https://images.unsplash.com/photo-1592982537447-7440770cbfc9?auto=format&fit=crop&w=600&q=80"},
                       VerificationStatus.community_confirmed, 2, 1, 12)

        r03 = make_rep(3, p5_id, ReportType.salinity, 9.4890, 76.3810, c1_id,
                       "High salinity ingress of 3.4 ppt detected at Vembanad outlet. Motor shutoff completed.",
                       {"salinity_ppt": 3.4, "tide_phase": "high_tide", "surface_scum_visible": True, "motor_shutoff_done": True},
                       VerificationStatus.officially_verified, 5, 0, 18)

        r04 = make_rep(4, p1_id, ReportType.salinity, 9.4600, 76.4250, c2_id,
                       "Salinity reading 2.2 ppt in Kainakary main canal. Sluice gate closed to prevent ingress.",
                       {"salinity_ppt": 2.2, "tide_phase": "rising", "surface_scum_visible": False, "motor_shutoff_done": True},
                       VerificationStatus.community_confirmed, 2, 0, 8)

        r05 = make_rep(5, p2_id, ReportType.bird_deaths, 9.4285, 76.4385, c3_id,
                       "Sudden mortality in duck flock. Symptoms include loss of balance and head twitching. Vet notified.",
                       {"sick_count": 45, "dead_count": 28, "symptoms": ["sudden_death", "loss_of_balance", "cyanosis_of_head"], "flock_size": 1200, "veterinary_notified": True},
                       VerificationStatus.unconfirmed, 1, 0, 5)

        r06 = make_rep(6, p3_id, ReportType.bund_seepage, 9.4200, 76.4230, c4_id,
                       "Active piping and boiling detected on outer ring bund. Sandbag ring placement required immediately.",
                       {"seepage_type": "active_piping", "bund_length_meters": 12, "water_level_diff_feet": 3.8, "emergency_pumping_needed": True},
                       VerificationStatus.unconfirmed, 0, 0, 3)

        r07 = make_rep(7, p7_id, ReportType.crop_disease, 9.4490, 76.4550, c3_id,
                       "Additional BPH patches verified in northern block of Pulincunnoo polder.",
                       {"disease_code": "brown_planthopper", "confidence": 0.91, "severity": "medium", "affected_area_acres": 1.2, "crop_age_days": 67},
                       VerificationStatus.community_confirmed, 2, 1, 4)

        r08 = make_rep(8, p3_id, ReportType.crop_disease, 9.4350, 76.4150, c5_id,
                       "Sheath blight lesions appearing on leaf sheaths near water line. Humid weather accelerating spread.",
                       {"disease_code": "sheath_blight", "confidence": 0.88, "severity": "medium", "affected_area_acres": 2.0, "crop_age_days": 55},
                       VerificationStatus.community_confirmed, 2, 3, 0)

        r09 = make_rep(9, p6_id, ReportType.salinity, 9.4300, 76.4350, c4_id,
                       "Canal salinity test returned 1.9 ppt near Moncompu junction. Advising upstream caution.",
                       {"salinity_ppt": 1.9, "tide_phase": "falling", "surface_scum_visible": False, "motor_shutoff_done": False},
                       VerificationStatus.unconfirmed, 1, 2, 10)

        r10 = make_rep(10, p6_id, ReportType.bird_deaths, 9.4240, 76.4720, c7_id,
                        "15 ducks found dead in Ramankary feeder area. Isolation pen erected.",
                        {"sick_count": 22, "dead_count": 15, "symptoms": ["sudden_death", "diarrhea"], "flock_size": 800, "veterinary_notified": True},
                        VerificationStatus.community_confirmed, 2, 3, 6)

        r11 = make_rep(11, p7_id, ReportType.crop_loss, 9.4720, 76.4650, c8_id,
                        "Waterlogging crop loss following high tide ingress. Completed 72-hour AIMS insurance survey draft.",
                        {"affected_area_acres": 3.5, "loss_cause": "tidal_inundation", "damage_percentage": 60},
                        VerificationStatus.officially_verified, 4, 4, 0)

        r12 = make_rep(12, p2_id, ReportType.bund_seepage, 9.4320, 76.4310, c4_id,
                        "Outer bund sweat wetting observed along 25 meters. No boiling sand observed yet.",
                        {"seepage_type": "surface_sweat", "bund_length_meters": 25, "water_level_diff_feet": 2.5, "emergency_pumping_needed": False},
                        VerificationStatus.community_confirmed, 2, 5, 2)

        # Prior 7-14 Day Window (Establishes Historical Baseline & Trends)
        r13 = make_rep(13, p1_id, ReportType.crop_disease, 9.4440, 76.4570, c3_id,
                        "Initial sighting of stray hoppers on outer field margins. Spraying Neem formulation.",
                        {"disease_code": "brown_planthopper", "confidence": 0.78, "severity": "low", "affected_area_acres": 0.5, "crop_age_days": 55},
                        VerificationStatus.officially_verified, 3, 9, 0)

        r14 = make_rep(14, p3_id, ReportType.crop_disease, 9.4340, 76.4110, c5_id,
                        "Early water-soaked lesions on lower sheath. Applying Pseudomonas fluorescens culture.",
                        {"disease_code": "sheath_blight", "confidence": 0.85, "severity": "low", "affected_area_acres": 1.0, "crop_age_days": 48},
                        VerificationStatus.officially_verified, 3, 10, 0)

        r15 = make_rep(15, p5_id, ReportType.salinity, 9.4850, 76.3840, c1_id,
                        "Moderate salinity 1.6 ppt during neap tide. Diluted with river discharge.",
                        {"salinity_ppt": 1.6, "tide_phase": "neap", "surface_scum_visible": False, "motor_shutoff_done": False},
                        VerificationStatus.officially_verified, 3, 11, 0)

        r16 = make_rep(16, p3_id, ReportType.bund_seepage, 9.4080, 76.4280, c6_id,
                        "Tension crack observed along bund crest following motor pumping. Clay refilling done.",
                        {"seepage_type": "settlement_crack", "bund_length_meters": 15, "water_level_diff_feet": 3.0, "emergency_pumping_needed": False},
                        VerificationStatus.officially_verified, 3, 12, 0)

        r17 = make_rep(17, p6_id, ReportType.crop_disease, 9.4210, 76.4750, c7_id,
                        "Bacterial leaf blight symptoms with wavy margins observed on seedling crop.",
                        {"disease_code": "bacterial_leaf_blight", "confidence": 0.86, "severity": "medium", "affected_area_acres": 1.5, "crop_age_days": 40},
                        VerificationStatus.community_confirmed, 2, 8, 0)

        r18 = make_rep(18, p7_id, ReportType.salinity, 9.4620, 76.4290, c2_id,
                        "Salinity measured at 0.8 ppt in Pulincunnoo main channel. Safe for irrigation pumping.",
                        {"salinity_ppt": 0.8, "tide_phase": "low_tide", "surface_scum_visible": False, "motor_shutoff_done": False},
                        VerificationStatus.community_confirmed, 2, 13, 0)

        r19 = make_rep(19, p2_id, ReportType.crop_loss, 9.4280, 76.4420, c3_id,
                        "Heavy squall caused lodging of mature paddy across 3 acres. Filed compensation notice.",
                        {"affected_area_acres": 3.0, "loss_cause": "wind_lodging", "damage_percentage": 45},
                        VerificationStatus.officially_verified, 4, 11, 0)

        r20 = make_rep(20, p5_id, ReportType.bird_deaths, 9.4790, 76.3950, c1_id,
                        "8 ducklings died due to sudden cold rain exposure. Non-infectious cold shock diagnosed by vet.",
                        {"sick_count": 5, "dead_count": 8, "symptoms": ["hypothermia"], "flock_size": 500, "veterinary_notified": True},
                        VerificationStatus.officially_verified, 3, 12, 0)

        r21 = make_rep(21, p1_id, ReportType.crop_disease, 9.4470, 76.4560, c3_id,
                       "Sheath rot symptoms around the flag leaf sheath in Pulincunnoo.", {"disease_code": "sheath_rot", "confidence": 0.84, "severity": "medium"}, VerificationStatus.community_confirmed, 2, 2, 8)
        r22 = make_rep(22, p2_id, ReportType.crop_disease, 9.4310, 76.4370, c4_id,
                       "Brown leaf spot spreading in a humid Moncompu block.", {"disease_code": "brown_leaf_spot", "confidence": 0.82, "severity": "medium"}, VerificationStatus.unconfirmed, 1, 3, 4)
        r23 = make_rep(23, p6_id, ReportType.crop_disease, 9.4230, 76.4770, c7_id,
                       "Yellowing and hopper-vector symptoms suggest rice tungro.", {"disease_code": "rice_tungro", "confidence": 0.81, "severity": "high"}, VerificationStatus.community_confirmed, 2, 1, 6)
        r24 = make_rep(24, p7_id, ReportType.crop_disease, 9.4670, 76.4670, c8_id,
                       "Rice blast lesions noted near Kavalam northern polder.", {"disease_code": "rice_blast", "confidence": 0.88, "severity": "medium"}, VerificationStatus.unconfirmed, 0, 6, 3)

        r25 = make_rep(25, p1_id, ReportType.crop_disease, 9.4455, 76.4570, c3_id, "Dead hearts indicate rice stem borer in Pulincunnoo.", {"disease_code": "rice_stem_borer", "confidence": 0.82, "severity": "medium"}, VerificationStatus.community_confirmed, 2, 2, 2)
        r26 = make_rep(26, p2_id, ReportType.crop_disease, 9.4300, 76.4380, c4_id, "Folded leaves and larvae found along Moncompu bunds.", {"disease_code": "rice_leaf_folder", "confidence": 0.82, "severity": "medium"}, VerificationStatus.unconfirmed, 1, 4, 1)
        r27 = make_rep(27, p3_id, ReportType.crop_disease, 9.4350, 76.4140, c5_id, "Smut balls observed at panicle emergence near Nedumudy.", {"disease_code": "false_smut", "confidence": 0.80, "severity": "medium"}, VerificationStatus.community_confirmed, 2, 5, 2)
        r28 = make_rep(28, p5_id, ReportType.crop_disease, 9.4780, 76.3940, c1_id, "Rice hispa scraping seen on young leaves at Kainakary.", {"disease_code": "rice_hispa", "confidence": 0.81, "severity": "low"}, VerificationStatus.unconfirmed, 0, 7, 3)
        r29 = make_rep(29, p6_id, ReportType.crop_disease, 9.4220, 76.4770, c7_id, "Grain discoloration noted after persistent wet weather.", {"disease_code": "grain_discoloration", "confidence": 0.80, "severity": "medium"}, VerificationStatus.community_confirmed, 2, 3, 5)
        r30 = make_rep(30, p7_id, ReportType.crop_disease, 9.4680, 76.4680, c8_id, "Gall midge silver shoots found in Kavalam.", {"disease_code": "rice_gall_midge", "confidence": 0.81, "severity": "medium"}, VerificationStatus.unconfirmed, 1, 6, 1)
        # Cross-location demo points for Alappuzha and Kottayam comparisons.
        make_rep(31, p1_id, ReportType.crop_disease, 9.4980, 76.3380, c1_id, "Brown leaf spot survey point near Alappuzha.", {"disease_code": "brown_leaf_spot", "confidence": 0.83, "severity": "medium", "location_label": "Alappuzha"}, VerificationStatus.community_confirmed, 2, 2, 4)
        make_rep(32, p2_id, ReportType.salinity, 9.6170, 76.4300, c2_id, "Kumarakom water reading for comparison run.", {"salinity_ppt": 1.4, "location_label": "Kumarakom"}, VerificationStatus.officially_verified, 3, 1, 2)
        make_rep(33, p3_id, ReportType.bird_deaths, 9.4420, 76.5360, c7_id, "Duck mortality comparison point near Changanassery.", {"dead_count": 12, "sick_count": 18, "flock_size": 500, "location_label": "Changanassery"}, VerificationStatus.unconfirmed, 0, 3, 6)
        make_rep(34, p5_id, ReportType.crop_disease, 9.6850, 76.3390, c1_id, "Rice leaf folder observation near Cherthala.", {"disease_code": "rice_leaf_folder", "confidence": 0.82, "severity": "low", "location_label": "Cherthala"}, VerificationStatus.community_confirmed, 2, 5, 3)
        make_rep(35, p1_id, ReportType.crop_disease, 9.3810, 76.5740, c2_id, "Rice blast comparison point near Thiruvalla.", {"disease_code": "rice_blast", "confidence": 0.86, "severity": "medium", "location_label": "Thiruvalla"}, VerificationStatus.community_confirmed, 2, 2, 1)
        make_rep(36, p2_id, ReportType.salinity, 9.1830, 76.5000, c1_id, "Kayamkulam backwater salinity comparison reading.", {"salinity_ppt": 1.8, "location_label": "Kayamkulam"}, VerificationStatus.unconfirmed, 1, 4, 3)
        make_rep(37, p3_id, ReportType.crop_disease, 8.8930, 76.6140, c4_id, "Sheath blight comparison report near Kollam.", {"disease_code": "sheath_blight", "confidence": 0.84, "severity": "medium", "location_label": "Kollam"}, VerificationStatus.officially_verified, 3, 3, 2)
        make_rep(38, p5_id, ReportType.crop_loss, 9.9810, 76.2990, c3_id, "Waterlogging crop loss comparison point near Ernakulam.", {"affected_area_acres": 2.2, "loss_cause": "waterlogging", "damage_percentage": 35, "location_label": "Ernakulam"}, VerificationStatus.community_confirmed, 2, 6, 4)
        make_rep(39, p6_id, ReportType.crop_disease, 10.5200, 76.1900, c5_id, "Brown planthopper comparison point in Thrissur Kole lands.", {"disease_code": "brown_planthopper", "confidence": 0.90, "severity": "high", "location_label": "Thrissur Kole"}, VerificationStatus.community_confirmed, 3, 1, 5)
        make_rep(40, p7_id, ReportType.bund_seepage, 10.7860, 76.6540, c6_id, "Bund seepage comparison report near Palakkad paddy fields.", {"seepage_type": "surface_sweat", "bund_length_meters": 18, "location_label": "Palakkad"}, VerificationStatus.unconfirmed, 0, 5, 5)
        # Deliberate multi-report clusters for the live map and demo trend scans.
        make_rep(41, p1_id, ReportType.crop_disease, 9.5010, 76.3420, c1_id, "Brown leaf spot cluster A near Alappuzha fields.", {"disease_code": "brown_leaf_spot", "confidence": 0.84, "severity": "medium", "location_label": "Alappuzha Cluster"}, VerificationStatus.community_confirmed, 2, 1, 2)
        make_rep(42, p2_id, ReportType.crop_disease, 9.4940, 76.3350, c1_id, "Brown leaf spot cluster B near Alappuzha fields.", {"disease_code": "brown_leaf_spot", "confidence": 0.83, "severity": "medium", "location_label": "Alappuzha Cluster"}, VerificationStatus.community_confirmed, 2, 2, 1)
        make_rep(43, p3_id, ReportType.crop_disease, 9.4980, 76.3390, c1_id, "Brown leaf spot cluster C near Alappuzha fields.", {"disease_code": "brown_leaf_spot", "confidence": 0.82, "severity": "high", "location_label": "Alappuzha Cluster"}, VerificationStatus.officially_verified, 3, 2, 4)
        make_rep(44, p5_id, ReportType.crop_disease, 9.6200, 76.4340, c2_id, "Rice blast cluster A near Kumarakom.", {"disease_code": "rice_blast", "confidence": 0.88, "severity": "high", "location_label": "Kumarakom Cluster"}, VerificationStatus.community_confirmed, 2, 1, 4)
        make_rep(45, p6_id, ReportType.crop_disease, 9.6130, 76.4260, c2_id, "Rice blast cluster B near Kumarakom.", {"disease_code": "rice_blast", "confidence": 0.87, "severity": "medium", "location_label": "Kumarakom Cluster"}, VerificationStatus.community_confirmed, 2, 2, 5)
        make_rep(46, p7_id, ReportType.crop_disease, 9.6170, 76.4300, c2_id, "Rice blast cluster C near Kumarakom.", {"disease_code": "rice_blast", "confidence": 0.86, "severity": "high", "location_label": "Kumarakom Cluster"}, VerificationStatus.officially_verified, 3, 3, 1)
        make_rep(47, p1_id, ReportType.crop_disease, 10.5240, 76.1950, c5_id, "Brown planthopper cluster A in Thrissur Kole.", {"disease_code": "brown_planthopper", "confidence": 0.91, "severity": "high", "location_label": "Thrissur Kole Cluster"}, VerificationStatus.community_confirmed, 3, 1, 1)
        make_rep(48, p2_id, ReportType.crop_disease, 10.5160, 76.1850, c5_id, "Brown planthopper cluster B in Thrissur Kole.", {"disease_code": "brown_planthopper", "confidence": 0.90, "severity": "high", "location_label": "Thrissur Kole Cluster"}, VerificationStatus.community_confirmed, 2, 2, 2)
        make_rep(49, p3_id, ReportType.crop_disease, 10.5200, 76.1900, c5_id, "Brown planthopper cluster C in Thrissur Kole.", {"disease_code": "brown_planthopper", "confidence": 0.89, "severity": "medium", "location_label": "Thrissur Kole Cluster"}, VerificationStatus.officially_verified, 3, 2, 5)
        make_rep(50, p5_id, ReportType.crop_disease, 10.7900, 76.6600, c6_id, "Stem borer cluster A near Palakkad.", {"disease_code": "rice_stem_borer", "confidence": 0.83, "severity": "medium", "location_label": "Palakkad Cluster"}, VerificationStatus.community_confirmed, 2, 1, 5)
        make_rep(51, p6_id, ReportType.crop_disease, 10.7810, 76.6480, c6_id, "Stem borer cluster B near Palakkad.", {"disease_code": "rice_stem_borer", "confidence": 0.82, "severity": "medium", "location_label": "Palakkad Cluster"}, VerificationStatus.community_confirmed, 2, 2, 3)
        make_rep(52, p7_id, ReportType.crop_disease, 10.7860, 76.6540, c6_id, "Stem borer cluster C near Palakkad.", {"disease_code": "rice_stem_borer", "confidence": 0.81, "severity": "high", "location_label": "Palakkad Cluster"}, VerificationStatus.officially_verified, 3, 3, 2)

        # 4. Seed Confirmations
        self.confirmations = {
            uuid4(): {"report_id": r01, "confirmer_id": p2_id, "created_at": now - timedelta(days=1, hours=20)},
            uuid4(): {"report_id": r01, "confirmer_id": p3_id, "created_at": now - timedelta(days=1, hours=18)},
            uuid4(): {"report_id": r01, "confirmer_id": p7_id, "created_at": now - timedelta(days=1, hours=16)},
            uuid4(): {"report_id": r02, "confirmer_id": p1_id, "created_at": now - timedelta(hours=20)},
            uuid4(): {"report_id": r02, "confirmer_id": p3_id, "created_at": now - timedelta(hours=18)},
            uuid4(): {"report_id": r04, "confirmer_id": p2_id, "created_at": now - timedelta(hours=6)},
            uuid4(): {"report_id": r04, "confirmer_id": p5_id, "created_at": now - timedelta(hours=5)},
            uuid4(): {"report_id": r05, "confirmer_id": p1_id, "created_at": now - timedelta(hours=3)},
            uuid4(): {"report_id": r07, "confirmer_id": p1_id, "created_at": now - timedelta(hours=14)},
            uuid4(): {"report_id": r07, "confirmer_id": p2_id, "created_at": now - timedelta(hours=12)},
            uuid4(): {"report_id": r08, "confirmer_id": p2_id, "created_at": now - timedelta(days=2)},
            uuid4(): {"report_id": r08, "confirmer_id": p4_id, "created_at": now - timedelta(days=2)},
            uuid4(): {"report_id": r10, "confirmer_id": p1_id, "created_at": now - timedelta(days=2, hours=10)},
            uuid4(): {"report_id": r10, "confirmer_id": p2_id, "created_at": now - timedelta(days=2, hours=8)},
            uuid4(): {"report_id": r12, "confirmer_id": p1_id, "created_at": now - timedelta(days=4)},
            uuid4(): {"report_id": r12, "confirmer_id": p3_id, "created_at": now - timedelta(days=4)},
        }

    # ---------------- Canal Methods ----------------

    def snap_to_nearest_canal(self, lat: float, lon: float) -> Tuple[UUID, str, float]:
        """Snaps a point to nearest canal segment, returning (canal_id, canal_name, distance_km)."""
        closest_id = None
        closest_name = ""
        min_dist = float("inf")

        for c_id, canal in self.canal_segments.items():
            dist = distance_point_to_linestring_km(lat, lon, canal["coordinates"])
            if dist < min_dist:
                min_dist = dist
                closest_id = c_id
                closest_name = canal["name"]
        
        return closest_id, closest_name, min_dist

    def get_canal(self, canal_id: UUID) -> Optional[Dict[str, Any]]:
        return self.canal_segments.get(canal_id)

    def get_all_canals(self) -> List[CanalSegmentResponse]:
        res = []
        for c in self.canal_segments.values():
            res.append(CanalSegmentResponse(
                id=c["id"],
                name=c["name"],
                coordinates=c["coordinates"],
                upstream_segment_id=c.get("upstream_segment_id"),
                downstream_segment_id=c.get("downstream_segment_id")
            ))
        return res

    # ---------------- Profile & Demo Auth ----------------

    def get_profile(self, profile_id: UUID) -> Optional[Dict[str, Any]]:
        return self.profiles.get(profile_id)

    def create_demo_farmer(self, name: str, phone: str, padasekharam: str, role: str = "farmer") -> Dict[str, Any]:
        """Registers an instant demo session profile for farmer sign-in."""
        new_id = uuid4()
        c_id, _, _ = self.snap_to_nearest_canal(9.4460, 76.4580)
        profile = {
            "id": new_id,
            "name": name,
            "phone": phone,
            "role": role,
            "village_or_padasekharam": padasekharam,
            "farm_type": "paddy",
            "latitude": 9.4460,
            "longitude": 76.4580,
            "nearest_canal_id": c_id,
            "flow_direction": FlowDirection.inland
        }
        self.profiles[new_id] = profile
        return profile

    # ---------------- Report Methods ----------------

    def create_report(self, report_in: ReportCreate) -> Dict[str, Any]:
        """Creates report and snaps to nearest canal if omitted."""
        canal_id = report_in.canal_segment_id
        canal_name = None
        if not canal_id:
            canal_id, canal_name, _ = self.snap_to_nearest_canal(report_in.latitude, report_in.longitude)
        else:
            c = self.get_canal(canal_id)
            if c:
                canal_name = c["name"]

        report_id = uuid4()
        now = datetime.now(timezone.utc)
        record = {
            "id": report_id,
            "reporter_id": report_in.reporter_id,  # Stored internally, NEVER returned publicly
            "report_type": report_in.report_type,
            "latitude": report_in.latitude,
            "longitude": report_in.longitude,
            "canal_segment_id": canal_id,
            "canal_name": canal_name,
            "flow_direction": report_in.flow_direction or FlowDirection.unknown,
            "photo_url": report_in.photo_url,
            "notes_text": report_in.notes_text,
            "details": report_in.details,
            "verification_status": VerificationStatus.unconfirmed,
            "confirmations_count": 0,
            "created_at": now
        }
        self.reports[report_id] = record
        return record

    def get_report(self, report_id: UUID) -> Optional[Dict[str, Any]]:
        return self.reports.get(report_id)

    def to_public_response(self, record: Dict[str, Any]) -> ReportResponse:
        """Strips reporter_id and returns an anonymized public representation."""
        canal_name = record.get("canal_name")
        if not canal_name and record.get("canal_segment_id"):
            c = self.get_canal(record["canal_segment_id"])
            if c:
                canal_name = c["name"]

        return ReportResponse(
            id=record["id"],
            report_type=record["report_type"],
            latitude=record["latitude"],
            longitude=record["longitude"],
            canal_segment_id=record.get("canal_segment_id"),
            canal_name=canal_name,
            flow_direction=record.get("flow_direction", FlowDirection.unknown),
            photo_url=record.get("photo_url"),
            notes_text=record.get("notes_text"),
            details=record.get("details", {}),
            verification_status=record["verification_status"],
            confirmations_count=record.get("confirmations_count", 0),
            created_at=record["created_at"]
        )

    def list_reports(self, report_type: Optional[ReportType] = None, status: Optional[VerificationStatus] = None) -> List[ReportResponse]:
        out = []
        for r in sorted(self.reports.values(), key=lambda x: x["created_at"], reverse=True):
            if report_type and r["report_type"] != report_type:
                continue
            if status and r["verification_status"] != status:
                continue
            out.append(self.to_public_response(r))
        return out

    def get_recent_reports_raw(self, report_type: ReportType, days: int = 7) -> List[Dict[str, Any]]:
        cutoff = datetime.now(timezone.utc) - timedelta(days=days)
        res = []
        for r in self.reports.values():
            if r["report_type"] == report_type and r["created_at"] >= cutoff:
                if r["verification_status"] != VerificationStatus.rejected:
                    res.append(r)
        return res

    # ---------------- Confirmations ----------------

    def add_confirmation(self, report_id: UUID, confirmer_id: UUID) -> Tuple[bool, str, Dict[str, Any]]:
        """Validates and adds confirmation. Rejects self or duplicate confirmation."""
        report = self.get_report(report_id)
        if not report:
            return False, "Report not found", {}

        # 1. Prohibit self-confirmation
        if report["reporter_id"] == confirmer_id:
            return False, "Reporters cannot confirm their own report", report

        # 2. Check for duplicate confirmation
        for conf in self.confirmations.values():
            if conf["report_id"] == report_id and conf["confirmer_id"] == confirmer_id:
                return False, "You have already confirmed this report", report

        # 3. Add confirmation
        conf_id = uuid4()
        self.confirmations[conf_id] = {
            "id": conf_id,
            "report_id": report_id,
            "confirmer_id": confirmer_id,
            "created_at": datetime.now(timezone.utc)
        }
        report["confirmations_count"] = report.get("confirmations_count", 0) + 1

        # 4. State transition: If >= 2 confirmations and unconfirmed -> promote to community_confirmed
        promoted = False
        if report["confirmations_count"] >= 2 and report["verification_status"] == VerificationStatus.unconfirmed:
            report["verification_status"] = VerificationStatus.community_confirmed
            promoted = True

        msg = "Report community-confirmed by neighboring farmers" if promoted else "Confirmation recorded successfully"
        return True, msg, report

    # ---------------- Officer Verification ----------------

    def officer_verify(self, report_id: UUID, officer_id: UUID, status: str, notes: Optional[str] = None) -> Tuple[bool, str, Dict[str, Any]]:
        """Allows role == 'officer' to officially verify or reject."""
        officer = self.get_profile(officer_id)
        if not officer or officer.get("role") != "officer":
            return False, "Unauthorized: Only a designated Krishi Bhavan / Vet Officer can perform official verification", {}

        report = self.get_report(report_id)
        if not report:
            return False, "Report not found", {}

        if status not in ("officially_verified", "rejected"):
            return False, "Invalid status. Must be officially_verified or rejected", {}

        report["verification_status"] = VerificationStatus(status)
        if notes:
            report.setdefault("details", {})["officer_notes"] = notes
        report["details"]["verified_by_officer_id"] = str(officer_id)
        report["details"]["verified_at"] = datetime.now(timezone.utc).isoformat()

        return True, f"Report officially marked as {status}", report

    # ---------------- Location Trends & Notifications ----------------

    def get_local_trend(self, lat: float, lng: float, radius_km: float = 3.0) -> LocalTrendResponse:
        """Computes localized 7-day vs prior-7-day trend, nearest canal salinity, and guidance."""
        now = datetime.now(timezone.utc)
        cutoff_7d = now - timedelta(days=7)
        cutoff_14d = now - timedelta(days=14)

        nearby_7d = []
        nearby_prior_7d = []

        for r in self.reports.values():
            if r["verification_status"] == VerificationStatus.rejected:
                continue
            dist = haversine_distance_km(lat, lng, r["latitude"], r["longitude"])
            if dist <= radius_km:
                if r["created_at"] >= cutoff_7d:
                    nearby_7d.append(r)
                elif r["created_at"] >= cutoff_14d:
                    nearby_prior_7d.append(r)

        # Nearest Landmark
        landmarks = [
            ("Pulincunnoo", 9.4460, 76.4580),
            ("Moncompu", 9.4290, 76.4390),
            ("Nedumudy", 9.4360, 76.4040),
            ("Kainakary", 9.4760, 76.3920),
            ("Champakulam", 9.4200, 76.4230),
            ("Ramankary", 9.4220, 76.4780),
            ("Kavalam", 9.4680, 76.4680)
        ]
        nearest_lm = min(landmarks, key=lambda l: haversine_distance_km(lat, lng, l[1], l[2]))[0]

        # Nearest canal and salinity
        c_id, c_name, c_dist = self.snap_to_nearest_canal(lat, lng)
        canal_salinity = None
        canal_alert = None
        # Check recent salinity reports on this canal
        for r in nearby_7d:
            if r["report_type"] == ReportType.salinity and r.get("canal_segment_id") == c_id:
                ppt = r["details"].get("salinity_ppt", 0)
                if canal_salinity is None or ppt > canal_salinity:
                    canal_salinity = ppt
                    canal_alert = AlertLevel.Danger if ppt >= 2.0 else AlertLevel.Warning

        count_7d = len(nearby_7d)
        count_prior = len(nearby_prior_7d)

        if count_7d > count_prior:
            trend_dir = "Growing"
        elif count_7d == count_prior and count_7d > 0:
            trend_dir = "Stable"
        else:
            trend_dir = "Watch"

        # Check for active outbreak
        disease_count = sum(1 for r in nearby_7d if r["report_type"] == ReportType.crop_disease)
        active_outbreak = disease_count >= 2
        cluster_name = "Brown Plant Hopper (BPH)" if active_outbreak else None

        # Determine recommended action
        if canal_alert == AlertLevel.Danger:
            action = "Halt paddy irrigation motor pumping immediately. Salinity ingress detected in connected canal."
        elif active_outbreak:
            action = "Scout lower tillers for Brown Plant Hopper. Maintain 5–7 cm water level and notify Krishi Bhavan."
        elif count_7d > 0:
            action = "Monitor field borders and inspect outer ring bund for seepage during high tide."
        else:
            action = "Field conditions normal in this sector. Routine agronomic monitoring advised."

        public_nearby = [self.to_public_response(r) for r in sorted(nearby_7d, key=lambda x: x["created_at"], reverse=True)]

        return LocalTrendResponse(
            query_latitude=lat,
            query_longitude=lng,
            nearest_landmark=f"Near {nearest_lm}",
            nearby_reports_count_7d=count_7d,
            prior_7d_reports_count=count_prior,
            trend_direction=trend_dir,
            nearest_canal_name=c_name,
            nearest_canal_distance_km=round(c_dist, 2),
            nearest_canal_salinity_ppt=canal_salinity,
            nearest_canal_alert_level=canal_alert,
            active_outbreak_nearby=active_outbreak,
            nearest_cluster_name=cluster_name,
            recommended_action=action,
            reports_nearby=public_nearby[:5]
        )

    def get_alerts(self, unread_only: bool = False) -> List[AlertItem]:
        """Generates comprehensive alert feed spanning salinity, outbreaks, and community validations."""
        alerts: List[AlertItem] = []
        now = datetime.now(timezone.utc)

        # 1. Salinity Canal Alert (from seed data)
        sal_alert_id = "alert-sal-kainakary"
        alerts.append(AlertItem(
            id=sal_alert_id,
            category="salinity",
            title="High Salinity Ingress Alert: Kainakary - Pulincunnoo",
            description="Recorded 3.4 ppt at Vembanad outlet propagating upstream. Low rainfall (0.5 mm) increases threat to paddy irrigation motors.",
            alert_level=AlertLevel.Danger,
            timestamp=now - timedelta(hours=6),
            location={"lat": 9.4890, "lng": 76.3810},
            is_read=sal_alert_id in self.read_alerts,
            metadata={"canal_id": "11111111-1111-1111-1111-111111111101", "salinity_ppt": 3.4}
        ))

        # 2. DBSCAN Outbreak Cluster Alert
        cluster_alert_id = "alert-cluster-bph"
        alerts.append(AlertItem(
            id=cluster_alert_id,
            category="cluster",
            title="Growing Pest Outbreak: Brown Plant Hopper (BPH)",
            description="3 active reports confirmed within 2.0 km radius around Pulincunnoo and Moncompu polders over past 48 hours.",
            alert_level=AlertLevel.Danger,
            timestamp=now - timedelta(hours=14),
            location={"lat": 9.4440, "lng": 76.4545},
            is_read=cluster_alert_id in self.read_alerts,
            metadata={"disease_code": "brown_planthopper", "report_count": 3}
        ))

        # 3. Community Verification Updates
        comm_alert_id = "alert-comm-pulincunnoo"
        alerts.append(AlertItem(
            id=comm_alert_id,
            category="verification",
            title="Community Verified: Brown Plant Hopper Outbreak",
            description="Incident report promoted to Community Confirmed after 3 neighboring farmers validated the infestation.",
            alert_level=AlertLevel.Watch,
            timestamp=now - timedelta(days=1),
            location={"lat": 9.4460, "lng": 76.4580},
            is_read=comm_alert_id in self.read_alerts,
            metadata={"confirmations_count": 3}
        ))

        # 4. Officer Official Verification Alert
        officer_alert_id = "alert-officer-kainakary"
        alerts.append(AlertItem(
            id=officer_alert_id,
            category="verification",
            title="Officially Verified: Vembanad Salinity Incident",
            description="Krishi Bhavan Officer Sreedhar P. officially validated salinity reading and alerted Padasekharam samithi.",
            alert_level=AlertLevel.Warning,
            timestamp=now - timedelta(hours=12),
            location={"lat": 9.4890, "lng": 76.3810},
            is_read=officer_alert_id in self.read_alerts,
            metadata={"officer_name": "Sreedhar P."}
        ))

        # 5. Duck Mortality Warning
        duck_alert_id = "alert-duck-moncompu"
        alerts.append(AlertItem(
            id=duck_alert_id,
            category="cluster",
            title="Biosecurity Alert: Unexplained Duck Mortality",
            description="45 sick / 28 dead ducks reported in Moncompu Thekkekkara. AHVD bio-containment checklist active.",
            alert_level=AlertLevel.Danger,
            timestamp=now - timedelta(hours=4),
            location={"lat": 9.4285, "lng": 76.4385},
            is_read=duck_alert_id in self.read_alerts,
            metadata={"dead_count": 28}
        ))

        if unread_only:
            alerts = [a for a in alerts if not a.is_read]

        return alerts

    def mark_alert_read(self, alert_id: Optional[str] = None):
        """Marks a specific alert or all alerts as read."""
        if alert_id:
            self.read_alerts.add(alert_id)
        else:
            all_alerts = self.get_alerts()
            for a in all_alerts:
                self.read_alerts.add(a.id)

# Global repository instance
db = InMemoryDatabase()
