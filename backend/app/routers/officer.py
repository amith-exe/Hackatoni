# backend/app/routers/officer.py
"""
Officer Intelligence Dashboard Endpoint.
Provides Krishi Bhavan officers with verification queues, 7-day incident aggregations,
active clusters, critical canal segments, and structured JSON summaries for automated digests.
"""

from datetime import datetime, timezone, timedelta
from fastapi import APIRouter
from backend.app.models.schemas import (
    OfficerDashboardResponse, ReportType, VerificationStatus, AlertLevel
)
from backend.app.services.db import db
from backend.app.services.clustering import run_dbscan_clustering
from backend.app.services.canal_routing import fetch_kuttanad_rainfall, analyze_salinity_propagation

router = APIRouter(prefix="/officer", tags=["Officer Dashboard"])

@router.get("/dashboard", response_model=OfficerDashboardResponse)
async def get_officer_dashboard():
    """
    Returns high-priority officer inspection queue and statistical summary.
    """
    now = datetime.now(timezone.utc)
    seven_days_ago = now - timedelta(days=7)

    # 1. Unconfirmed queue (needs officer field inspection or community follow-up)
    unconfirmed = [
        db.to_public_response(r) for r in sorted(
            db.reports.values(), key=lambda x: x["created_at"], reverse=True
        )
        if r["verification_status"] == VerificationStatus.unconfirmed
    ]

    # 2. 7-Day counts by report type
    counts_by_type = {rt.value: 0 for rt in ReportType}
    for r in db.reports.values():
        if r["created_at"] >= seven_days_ago:
            counts_by_type[r["report_type"].value] = counts_by_type.get(r["report_type"].value, 0) + 1

    # 3. Active clusters
    active_clusters = []
    recent_diseases = db.get_recent_reports_raw(ReportType.crop_disease, days=7)
    for disease_code in ["brown_planthopper", "sheath_blight", "bacterial_leaf_blight", "rice_blast"]:
        cls = run_dbscan_clustering(recent_diseases, report_type="crop_disease", sub_category=disease_code)
        active_clusters.extend(cls)

    recent_birds = db.get_recent_reports_raw(ReportType.bird_deaths, days=7)
    bird_cls = run_dbscan_clustering(recent_birds, report_type="bird_deaths")
    active_clusters.extend(bird_cls)

    # 4. Critical canals under salinity warning or danger
    rainfall_summary = await fetch_kuttanad_rainfall()
    critical_canals = []
    
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
            if aff.current_alert_level in (AlertLevel.Danger, AlertLevel.Warning):
                if not any(c.id == aff.id for c in critical_canals):
                    critical_canals.append(aff)

    # 5. Structured digest summary for Krishi Bhavan briefing
    danger_cluster_count = sum(1 for c in active_clusters if c.alert_level == AlertLevel.Danger)
    critical_canal_count = len(critical_canals)

    digest_summary = {
        "generated_at": now.isoformat(),
        "region": "Kuttanad Agricultural Belt (Pulincunnoo, Moncompu, Nedumudy, Champakulam)",
        "total_active_reports": len(db.reports),
        "unconfirmed_queue_count": len(unconfirmed),
        "danger_clusters_count": danger_cluster_count,
        "critical_canals_count": critical_canal_count,
        "rainfall_24h_mm": rainfall_summary.get("total_rain_24h_mm", 0.0),
        "urgency_rating": "CRITICAL" if (danger_cluster_count > 0 or critical_canal_count > 0) else "NORMAL",
        "action_items": [
            f"Verify {len(unconfirmed)} pending community incident reports.",
            f"Monitor {critical_canal_count} canal segments flagged with saline ingress.",
            "Coordinate with Minor Irrigation regarding Thanneermukkom shutters if salinity rises."
        ]
    }

    return OfficerDashboardResponse(
        unconfirmed_queue=unconfirmed,
        counts_by_type_7d=counts_by_type,
        active_clusters=active_clusters,
        critical_canals=critical_canals,
        digest_summary=digest_summary
    )
