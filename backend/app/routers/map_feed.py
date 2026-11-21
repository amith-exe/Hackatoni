"""Filtered public map feed and outbreak intelligence."""
from datetime import datetime, timezone, timedelta
from typing import Optional
from fastapi import APIRouter, Query
from backend.app.models.schemas import MapFeedResponse, ReportType, VerificationStatus, OutbreakBreakdownItem
from backend.app.services.db import db
from backend.app.services.clustering import run_dbscan_clustering
from backend.app.services.canal_routing import fetch_kuttanad_rainfall, analyze_salinity_propagation

router = APIRouter(prefix="/map-feed", tags=["Map Feed"])
DISEASES = {"brown_planthopper":"Brown Planthopper (Chazhi)","sheath_blight":"Sheath Blight","bacterial_leaf_blight":"Bacterial Leaf Blight (BLB)","rice_blast":"Rice Blast","sheath_rot":"Sheath Rot","brown_leaf_spot":"Brown Leaf Spot","rice_tungro":"Rice Tungro / Hopper-Vector Yellowing","rice_stem_borer":"Rice Stem Borer","rice_leaf_folder":"Rice Leaf Folder","rice_gall_midge":"Rice Gall Midge","rice_hispa":"Rice Hispa","false_smut":"False Smut","grain_discoloration":"Grain Discoloration"}
THREATS = [("salinity", "Salinity Ingress"), ("bird_deaths", "Duck Mortality"), ("bund_seepage", "Bund Seepage"), ("crop_loss", "Crop Loss")]

def _allowed(r, report_type, disease_code, verification_status, cutoff):
    if r["created_at"] < cutoff or (report_type and r["report_type"].value != report_type): return False
    if disease_code and r.get("details", {}).get("disease_code") != disease_code: return False
    if verification_status == "verified_only" and r["verification_status"] not in (VerificationStatus.community_confirmed, VerificationStatus.officially_verified): return False
    if verification_status == "unconfirmed" and r["verification_status"] != VerificationStatus.unconfirmed: return False
    return r["verification_status"] != VerificationStatus.rejected

def build_outbreak_breakdown(reports):
    now = datetime.now(timezone.utc); current_cut = now - timedelta(days=7); previous_cut = now - timedelta(days=14); items = []
    for code, label in list(DISEASES.items()) + THREATS:
        matching = [r for r in reports if r["created_at"] >= previous_cut and (r.get("details", {}).get("disease_code") == code if code in DISEASES else r["report_type"].value == code)]
        current = [r for r in matching if r["created_at"] >= current_cut]; previous = [r for r in matching if r["created_at"] < current_cut]
        clusters = run_dbscan_clustering(current, "crop_disease", code) if code in DISEASES else run_dbscan_clustering(current, code)
        center = {"lat": clusters[0].center_latitude, "lng": clusters[0].center_longitude} if clusters else None
        growth = round(((len(current)-len(previous))/len(previous))*100, 1) if previous else (100.0 if current else 0.0)
        spread = "spreading" if growth > 20 and current else ("active_cluster" if clusters else ("watch" if current else "isolated"))
        if current or previous:
            items.append(OutbreakBreakdownItem(disease_code=code if code in DISEASES else None, threat_code=code if code not in DISEASES else None, label=label, current_7d_count=len(current), previous_7d_count=len(previous), growth_pct=growth, spread_status=spread, cluster_count=len(clusters), center=center, affected_areas=sorted({r.get("canal_name") or "Kuttanad sector" for r in current})))
    return sorted(items, key=lambda x: (x.current_7d_count, x.growth_pct), reverse=True)

@router.get("", response_model=MapFeedResponse)
async def get_map_feed(report_type: Optional[str] = Query(None), disease_code: Optional[str] = Query(None), verification_status: str = Query("all", pattern="^(all|verified_only|unconfirmed)$"), days: int = Query(14, ge=1, le=14)):
    # Direct unit-test calls receive FastAPI Query objects instead of parsed values.
    if hasattr(days, "default"): days = days.default
    if hasattr(report_type, "default"): report_type = report_type.default
    if hasattr(disease_code, "default"): disease_code = disease_code.default
    if hasattr(verification_status, "default"): verification_status = verification_status.default
    now = datetime.now(timezone.utc); cutoff = now - timedelta(days=days)
    raw = [r for r in db.reports.values() if _allowed(r, report_type, disease_code, verification_status, cutoff)]
    recent = [r for r in raw if r["created_at"] >= now - timedelta(days=7)]
    clusters = []
    diseases = [r for r in recent if r["report_type"] == ReportType.crop_disease]
    for code in DISEASES: clusters.extend(run_dbscan_clustering(diseases, "crop_disease", code))
    clusters.extend(run_dbscan_clustering([r for r in recent if r["report_type"] == ReportType.bird_deaths], "bird_deaths"))
    rainfall = await fetch_kuttanad_rainfall(); canals = {c.id: c for c in db.get_all_canals()}
    for r in recent:
        if r["report_type"] != ReportType.salinity: continue
        affected, _ = analyze_salinity_propagation(r.get("canal_segment_id"), float(r.get("details", {}).get("salinity_ppt", 1.5)), rainfall)
        for canal in affected:
            if canal.id in canals and (not canals[canal.id].current_alert_level or canal.current_alert_level == "Danger"): canals[canal.id] = canal
    all_public = [r for r in db.reports.values() if r["verification_status"] != VerificationStatus.rejected]
    return MapFeedResponse(reports=[db.to_public_response(r) for r in raw], active_clusters=clusters, affected_canals=list(canals.values()), rainfall_summary=rainfall, outbreak_breakdown=build_outbreak_breakdown(all_public))
