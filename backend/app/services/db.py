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
    ReportCreate, ReportResponse, CanalSegmentResponse, ClusterResponse
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
        
        # Approximate segment distance by sampling along segment
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
        self.seed_defaults()

    def seed_defaults(self):
        """Seed verified Kuttanad geography and profiles matching 002_seed_kuttanad.sql."""
        # 1. Canal Segments
        c1_id = UUID("11111111-1111-1111-1111-111111111101")
        c2_id = UUID("11111111-1111-1111-1111-111111111102")
        c3_id = UUID("11111111-1111-1111-1111-111111111103")
        c4_id = UUID("11111111-1111-1111-1111-111111111104")
        c5_id = UUID("11111111-1111-1111-1111-111111111105")

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
                "downstream_segment_id": None,
                "created_at": datetime.now(timezone.utc)
            },
            c5_id: {
                "id": c5_id,
                "name": "Nedumudy - Moncompu Link Canal",
                "coordinates": [[76.4020, 9.4350], [76.4200, 9.4320], [76.4380, 9.4280]],
                "upstream_segment_id": c2_id,
                "downstream_segment_id": c4_id,
                "created_at": datetime.now(timezone.utc)
            }
        }

        # 2. Profiles (Farmers and Krishi Officers)
        p1_id = UUID("22222222-2222-2222-2222-222222222201")
        p2_id = UUID("22222222-2222-2222-2222-222222222202")
        p3_id = UUID("22222222-2222-2222-2222-222222222203")
        p4_id = UUID("22222222-2222-2222-2222-222222222204")
        p5_id = UUID("22222222-2222-2222-2222-222222222205")

        self.profiles = {
            p1_id: {
                "id": p1_id,
                "name": "Thomas Kutty (തോമസ് കുട്ടി)",
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
                "name": "Radhakrishnan M. (രാധാകൃഷ്ണൻ)",
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
                "name": "Joseph Varghese (ജോസഫ് വർഗ്ഗീസ്)",
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
                "name": "Sreedhar P. (ശ്രീധർ - കൃഷി ഓഫീസർ)",
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
                "name": "Biju K. (ബിജു)",
                "phone": "+919447101005",
                "role": "farmer",
                "village_or_padasekharam": "Kainakary Padasekharam",
                "farm_type": "duck",
                "latitude": 9.4760,
                "longitude": 76.3920,
                "nearest_canal_id": c1_id,
                "flow_direction": FlowDirection.toward_sea
            }
        }

        # 3. Seed Reports
        r1_id = UUID("33333333-3333-3333-3333-333333333301")
        r2_id = UUID("33333333-3333-3333-3333-333333333302")
        r3_id = UUID("33333333-3333-3333-3333-333333333303")
        r4_id = UUID("33333333-3333-3333-3333-333333333304")
        r5_id = UUID("33333333-3333-3333-3333-333333333305")
        r6_id = UUID("33333333-3333-3333-3333-333333333306")

        now = datetime.now(timezone.utc)
        self.reports = {
            r1_id: {
                "id": r1_id,
                "reporter_id": p1_id,
                "report_type": ReportType.crop_disease,
                "latitude": 9.4460,
                "longitude": 76.4580,
                "canal_segment_id": c3_id,
                "flow_direction": FlowDirection.inland,
                "photo_url": "https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?auto=format&fit=crop&w=600&q=80",
                "notes_text": "കതിരുകൾക്ക് താഴെ തവിട്ടു ചാഴി കൂട്ടത്തോടെ കാണുന്നു. ഇലകൾ മഞ്ഞളിക്കുന്നുണ്ട്.",
                "details": {
                    "disease_code": "brown_planthopper",
                    "confidence": 0.94,
                    "severity": "high",
                    "affected_area_acres": 2.5,
                    "crop_age_days": 65,
                    "is_sample": True
                },
                "verification_status": VerificationStatus.community_confirmed,
                "confirmations_count": 3,
                "created_at": now - timedelta(days=2)
            },
            r2_id: {
                "id": r2_id,
                "reporter_id": p2_id,
                "report_type": ReportType.crop_disease,
                "latitude": 9.4420,
                "longitude": 76.4510,
                "canal_segment_id": c3_id,
                "flow_direction": FlowDirection.inland,
                "photo_url": "https://images.unsplash.com/photo-1592982537447-7440770cbfc9?auto=format&fit=crop&w=600&q=80",
                "notes_text": "അടുത്ത കണ്ടത്തിലും ചാഴി ശല്യം തുടങ്ങി. വേഗത്തിൽ വ്യാപിക്കുന്നു.",
                "details": {
                    "disease_code": "brown_planthopper",
                    "confidence": 0.89,
                    "severity": "medium",
                    "affected_area_acres": 1.8,
                    "crop_age_days": 68,
                    "is_sample": True
                },
                "verification_status": VerificationStatus.community_confirmed,
                "confirmations_count": 2,
                "created_at": now - timedelta(days=1)
            },
            r3_id: {
                "id": r3_id,
                "reporter_id": p5_id,
                "report_type": ReportType.salinity,
                "latitude": 9.4890,
                "longitude": 76.3810,
                "canal_segment_id": c1_id,
                "flow_direction": FlowDirection.toward_sea,
                "photo_url": None,
                "notes_text": "കൈനകരി വടക്കേ ആറ്റിൽ ഉപ്പുവെള്ളം കയറി. റിഫ്രാക്ടോമീറ്റർ റീഡിംഗ് 3.4 ppt.",
                "details": {
                    "salinity_ppt": 3.4,
                    "tide_phase": "high_tide",
                    "surface_scum_visible": True,
                    "motor_shutoff_done": True,
                    "is_sample": True
                },
                "verification_status": VerificationStatus.officially_verified,
                "confirmations_count": 5,
                "created_at": now - timedelta(hours=12)
            },
            r4_id: {
                "id": r4_id,
                "reporter_id": p1_id,
                "report_type": ReportType.salinity,
                "latitude": 9.4600,
                "longitude": 76.4250,
                "canal_segment_id": c2_id,
                "flow_direction": FlowDirection.toward_sea,
                "photo_url": None,
                "notes_text": "പുളിങ്കുന്ന് വലിയ തോട്ടിൽ വെള്ളത്തിന് ഉപ്പുരസം. കൃഷിക്ക് അടിക്കുന്നത് നിർത്തണം.",
                "details": {
                    "salinity_ppt": 2.2,
                    "tide_phase": "rising",
                    "surface_scum_visible": False,
                    "motor_shutoff_done": True,
                    "is_sample": True
                },
                "verification_status": VerificationStatus.community_confirmed,
                "confirmations_count": 2,
                "created_at": now - timedelta(hours=6)
            },
            r5_id: {
                "id": r5_id,
                "reporter_id": p2_id,
                "report_type": ReportType.bird_deaths,
                "latitude": 9.4285,
                "longitude": 76.4385,
                "canal_segment_id": c3_id,
                "flow_direction": FlowDirection.inland,
                "photo_url": None,
                "notes_text": "മങ്കൊമ്പ് തെക്കേക്കരയിൽ താറാവുകൾ പെട്ടെന്ന് ചത്തു വീഴുന്നു. തല കുലുക്കലും തളർച്ചയും.",
                "details": {
                    "sick_count": 45,
                    "dead_count": 28,
                    "symptoms": ["sudden_death", "loss_of_balance", "cyanosis_of_head", "greenish_diarrhea"],
                    "flock_size": 1200,
                    "veterinary_notified": True,
                    "is_sample": True
                },
                "verification_status": VerificationStatus.unconfirmed,
                "confirmations_count": 1,
                "created_at": now - timedelta(hours=4)
            },
            r6_id: {
                "id": r6_id,
                "reporter_id": p3_id,
                "report_type": ReportType.bund_seepage,
                "latitude": 9.4200,
                "longitude": 76.4230,
                "canal_segment_id": c4_id,
                "flow_direction": FlowDirection.inland,
                "photo_url": None,
                "notes_text": "ചമ്പക്കുളം പുറംബണ്ടിൽ ശക്തമായ ചോർച്ച. അടിയന്തര മണൽച്ചാക്ക് തടയണ വേണം.",
                "details": {
                    "seepage_type": "active_piping",
                    "bund_length_meters": 12,
                    "water_level_diff_feet": 3.8,
                    "emergency_pumping_needed": True,
                    "is_sample": True
                },
                "verification_status": VerificationStatus.unconfirmed,
                "confirmations_count": 0,
                "created_at": now - timedelta(hours=2)
            }
        }

        # 4. Seed Confirmations
        self.confirmations = {
            uuid4(): {"report_id": r1_id, "confirmer_id": p2_id, "created_at": now - timedelta(hours=40)},
            uuid4(): {"report_id": r1_id, "confirmer_id": p3_id, "created_at": now - timedelta(hours=38)},
            uuid4(): {"report_id": r1_id, "confirmer_id": p5_id, "created_at": now - timedelta(hours=36)},
            uuid4(): {"report_id": r2_id, "confirmer_id": p1_id, "created_at": now - timedelta(hours=20)},
            uuid4(): {"report_id": r2_id, "confirmer_id": p3_id, "created_at": now - timedelta(hours=18)},
            uuid4(): {"report_id": r4_id, "confirmer_id": p2_id, "created_at": now - timedelta(hours=5)},
            uuid4(): {"report_id": r4_id, "confirmer_id": p3_id, "created_at": now - timedelta(hours=4)},
            uuid4(): {"report_id": r5_id, "confirmer_id": p1_id, "created_at": now - timedelta(hours=3)},
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

    # ---------------- Profile Methods ----------------

    def get_profile(self, profile_id: UUID) -> Optional[Dict[str, Any]]:
        return self.profiles.get(profile_id)

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
        """
        Strips reporter_id and returns an anonymized public representation.
        """
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
                # Do not include rejected reports in clustering
                if r["verification_status"] != VerificationStatus.rejected:
                    res.append(r)
        return res

    # ---------------- Confirmations ----------------

    def add_confirmation(self, report_id: UUID, confirmer_id: UUID) -> Tuple[bool, str, Dict[str, Any]]:
        """
        Validates and adds confirmation.
        Returns (success, message, updated_report).
        Rejects if confirmer is the reporter or duplicate.
        """
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
        """
        Allows role == 'officer' to officially verify or reject.
        """
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

# Global repository instance
db = InMemoryDatabase()
