# backend/app/models/schemas.py
from datetime import datetime, date
from typing import Optional, List, Dict, Any, Literal
from uuid import UUID
from enum import Enum
from pydantic import BaseModel, Field

class ReportType(str, Enum):
    crop_disease = "crop_disease"
    salinity = "salinity"
    bird_deaths = "bird_deaths"
    bund_seepage = "bund_seepage"
    crop_loss = "crop_loss"

class VerificationStatus(str, Enum):
    unconfirmed = "unconfirmed"
    community_confirmed = "community_confirmed"
    officially_verified = "officially_verified"
    rejected = "rejected"

class AlertLevel(str, Enum):
    Watch = "Watch"
    Warning = "Warning"
    Danger = "Danger"

class Trend(str, Enum):
    new = "new"
    growing = "growing"
    stable = "stable"

class FlowDirection(str, Enum):
    toward_sea = "toward_sea"
    inland = "inland"
    unknown = "unknown"

class UserRole(str, Enum):
    farmer = "farmer"
    officer = "officer"

class FarmType(str, Enum):
    paddy = "paddy"
    duck = "both"
    both = "both"

# ----------------- Request Models -----------------

class ReportCreate(BaseModel):
    reporter_id: UUID = Field(..., description="UUID of the submitting profile (kept private, never exposed in public feeds)")
    report_type: ReportType = Field(..., description="Type of incident")
    latitude: float = Field(..., ge=-90.0, le=90.0, description="Latitude in WGS84")
    longitude: float = Field(..., ge=-180.0, le=180.0, description="Longitude in WGS84")
    canal_segment_id: Optional[UUID] = Field(None, description="Optional canal segment ID. If omitted, snaps to nearest canal.")
    flow_direction: Optional[FlowDirection] = Field(FlowDirection.unknown, description="Flow direction if known")
    photo_url: Optional[str] = Field(None, description="URL or upload path of photo")
    notes_text: Optional[str] = Field(None, description="Farmer notes (or transcript from future Sarvam STT)")
    details: Dict[str, Any] = Field(default_factory=dict, description="Structured fields: disease_code, salinity_ppt, sick_count, etc.")

class ConfirmationCreate(BaseModel):
    confirmer_id: UUID = Field(..., description="UUID of the farmer confirming this report")

class VerificationCreate(BaseModel):
    officer_id: UUID = Field(..., description="UUID of the Krishi Bhavan / Vet Officer")
    status: Literal["officially_verified", "rejected"] = Field(..., description="Official verification status")
    notes: Optional[str] = Field(None, description="Official notes from field inspection")

# ----------------- Response Models -----------------

class RemediesKAUResponse(BaseModel):
    disease_code: str
    disease_name_en: str
    disease_name_ml: str
    immediate_actions: List[str]
    spray_guidance: str
    source_citation: str
    last_checked: date

class LeafDiagnosisSchema(BaseModel):
    disease_code: Literal["brown_planthopper", "sheath_blight", "bacterial_leaf_blight", "rice_blast", "sheath_rot", "brown_leaf_spot", "rice_tungro", "unknown"]
    confidence: float = Field(..., ge=0.0, le=1.0)
    visual_observations: List[str] = Field(..., min_length=2, max_length=3)
    image_quality_note: str

class OutbreakBreakdownItem(BaseModel):
    disease_code: Optional[str] = None
    threat_code: Optional[str] = None
    label: str
    current_7d_count: int
    previous_7d_count: int
    growth_pct: float
    spread_status: Literal["spreading", "active_cluster", "watch", "isolated"]
    cluster_count: int = 0
    center: Optional[Dict[str, float]] = None
    affected_areas: List[str] = Field(default_factory=list)

class TrendAnalyzeRequest(BaseModel):
    lat: float = Field(..., ge=-90, le=90)
    lng: float = Field(..., ge=-180, le=180)
    radius_km: float = Field(3.0, gt=0, le=50)
    dbscan_eps_km: float = Field(2.0, gt=0, le=50)
    days: int = Field(7, ge=1, le=14)

class TrendDiseaseResult(BaseModel):
    disease_code: str
    label: str
    distance_km: float
    current_count: int
    previous_count: int
    trend_label: str
    percentage_change: float
    cluster_center: Optional[Dict[str, float]] = None
    action_summary: Optional[List[str]] = None

class TrendAnalyzeResponse(BaseModel):
    selected_location: Dict[str, float]
    dbscan_summary: Dict[str, Any]
    spreading_diseases: List[TrendDiseaseResult]
    canal_salinity_status: Dict[str, Any]
    recommended_actions: List[str]

class ActionGuidance(BaseModel):
    title: str
    title_ml: str
    alert_level: AlertLevel
    summary: str
    bullet_points: List[str]
    citation: Optional[str] = None
    helpline: Optional[str] = None
    is_uncertain: bool = False

class ReportResponse(BaseModel):
    """
    Public representation of a report.
    SECURITY NOTE: reporter_id is stripped to protect farmer anonymity and privacy.
    """
    id: UUID
    report_type: ReportType
    latitude: float
    longitude: float
    canal_segment_id: Optional[UUID] = None
    canal_name: Optional[str] = None
    flow_direction: FlowDirection = FlowDirection.unknown
    photo_url: Optional[str] = None
    notes_text: Optional[str] = None
    details: Dict[str, Any] = Field(default_factory=dict)
    verification_status: VerificationStatus
    confirmations_count: int
    created_at: datetime
    action_guidance: Optional[ActionGuidance] = None

class CanalSegmentResponse(BaseModel):
    id: UUID
    name: str
    coordinates: List[List[float]] = Field(..., description="List of [lng, lat] coordinate pairs")
    upstream_segment_id: Optional[UUID] = None
    downstream_segment_id: Optional[UUID] = None
    current_alert_level: Optional[AlertLevel] = None
    salinity_ppt: Optional[float] = None
    alert_reason: Optional[str] = None

class ClusterResponse(BaseModel):
    id: UUID
    report_type: str
    sub_category: Optional[str] = None
    center_latitude: float
    center_longitude: float
    radius_km: float = 2.0
    report_count: int
    window_start: datetime
    window_end: datetime
    trend: Trend
    alert_level: AlertLevel

class MapFeedResponse(BaseModel):
    reports: List[ReportResponse]
    active_clusters: List[ClusterResponse]
    affected_canals: List[CanalSegmentResponse]
    rainfall_summary: Optional[Dict[str, Any]] = None
    outbreak_breakdown: List[OutbreakBreakdownItem] = Field(default_factory=list)

class OfficerDashboardResponse(BaseModel):
    unconfirmed_queue: List[ReportResponse]
    counts_by_type_7d: Dict[str, int]
    active_clusters: List[ClusterResponse]
    critical_canals: List[CanalSegmentResponse]
    digest_summary: Dict[str, Any]

class AlertItem(BaseModel):
    id: str
    category: str = Field(..., description="salinity | cluster | verification")
    title: str
    description: str
    alert_level: AlertLevel
    timestamp: datetime
    location: Optional[Dict[str, float]] = None
    is_read: bool = False
    metadata: Dict[str, Any] = Field(default_factory=dict)

class LocalTrendResponse(BaseModel):
    query_latitude: float
    query_longitude: float
    nearest_landmark: str
    nearby_reports_count_7d: int
    prior_7d_reports_count: int
    trend_direction: str  # "Growing", "Stable", "Watch"
    nearest_canal_name: Optional[str] = None
    nearest_canal_distance_km: float
    nearest_canal_salinity_ppt: Optional[float] = None
    nearest_canal_alert_level: Optional[AlertLevel] = None
    active_outbreak_nearby: bool
    nearest_cluster_name: Optional[str] = None
    recommended_action: str
    reports_nearby: List[ReportResponse] = Field(default_factory=list)

class DemoLoginRequest(BaseModel):
    name: str
    phone: str
    padasekharam: str
    role: str = "farmer"

class DemoLoginResponse(BaseModel):
    token: str
    profile: Dict[str, Any]
    message: str
