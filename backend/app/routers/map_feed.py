# backend/app/routers/map_feed.py
"""
Public Map Feed Endpoint.
Delivers real-time crowdsourced reports, active DBSCAN clusters,
and canal network salinity alert states to the interactive Leaflet frontend.
CRITICAL: Strips reporter_id, names, and phone numbers from all reports.
"""

from fastapi import APIRouter
from backend.app.models.schemas import MapFeedResponse, ReportType, VerificationStatus
from backend.app.services.db import db
from backend.app.services.clustering import run_dbscan_clustering
from backend.app.services.canal_routing import fetch_kuttanad_rainfall, analyze_salinity_propagation

router = APIRouter(prefix="/map-feed", tags=["Map Feed"])

@router.get("", response_model=MapFeedResponse)
async def get_map_feed():
    """
    Returns unified spatial intelligence feed for Kuttanad PWA map:
    - Anonymized reports (crop_disease, salinity, bird_deaths, bund_seepage, crop_loss)
    - Active DBSCAN spatial clusters
    - Affected canal network segments with alert levels
    - Open-Meteo rainfall summary
    """
    # 1. Anonymized reports
    reports = db.list_reports()

    # 2. Compute active DBSCAN clusters for crop diseases & bird mortality
    active_clusters = []
    
    # Disease clusters
    recent_diseases = db.get_recent_reports_raw(ReportType.crop_disease, days=7)
    for disease_code in ["brown_planthopper", "sheath_blight", "bacterial_leaf_blight", "rice_blast"]:
        cls = run_dbscan_clustering(recent_diseases, report_type="crop_disease", sub_category=disease_code)
        active_clusters.extend(cls)

    # Bird mortality clusters
    recent_birds = db.get_recent_reports_raw(ReportType.bird_deaths, days=7)
    bird_cls = run_dbscan_clustering(recent_birds, report_type="bird_deaths")
    active_clusters.extend(bird_cls)

    # 3. Analyze affected canals from active salinity reports
    rainfall_summary = await fetch_kuttanad_rainfall()
    all_canals_map = {c.id: c for c in db.get_all_canals()}

    recent_salinity = db.get_recent_reports_raw(ReportType.salinity, days=2)
    for sal_rep in recent_salinity:
        if sal_rep["verification_status"] == VerificationStatus.rejected:
            continue
        canal_id = sal_rep.get("canal_segment_id")
        if not canal_id:
            continue
        sal_ppt = float(sal_rep.get("details", {}).get("salinity_ppt", 1.5))
        affected, _ = analyze_salinity_propagation(canal_id, sal_ppt, rainfall_summary)
        for aff in affected:
            # Update canal in our map if it has an alert level
            if aff.id in all_canals_map:
                existing = all_canals_map[aff.id]
                # Keep highest alert
                if not existing.current_alert_level or (aff.current_alert_level == "Danger"):
                    all_canals_map[aff.id] = aff

    return MapFeedResponse(
        reports=reports,
        active_clusters=active_clusters,
        affected_canals=list(all_canals_map.values()),
        rainfall_summary=rainfall_summary
    )
