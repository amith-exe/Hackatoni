"""Interactive multi-location DBSCAN trend analysis."""
from datetime import datetime, timezone, timedelta
from fastapi import APIRouter
from backend.app.models.schemas import TrendAnalyzeRequest, TrendAnalyzeResponse
from backend.app.services.db import db, haversine_distance_km
from backend.app.services.clustering import run_dbscan_clustering
from backend.app.services.remedies import KAU_REMEDIES_REGISTRY

router = APIRouter(prefix="/trends", tags=["Trend Analysis"])
LABELS = {"brown_planthopper":"Brown Planthopper (Chazhi)","sheath_blight":"Sheath Blight","bacterial_leaf_blight":"Bacterial Leaf Blight (BLB)","rice_blast":"Rice Blast","sheath_rot":"Sheath Rot","brown_leaf_spot":"Brown Leaf Spot","rice_tungro":"Rice Tungro / Hopper-Vector Yellowing","bird_deaths":"Duck Mortality","salinity":"Salinity Ingress","bund_seepage":"Bund Seepage","crop_loss":"Crop Loss"}

@router.post("/analyze", response_model=TrendAnalyzeResponse)
async def analyze_trend(req: TrendAnalyzeRequest):
    now = datetime.now(timezone.utc); current_cut = now - timedelta(days=req.days); prior_cut = now - timedelta(days=req.days * 2)
    candidates = [r for r in db.reports.values() if r["created_at"] >= prior_cut and r["verification_status"].value != "rejected" and haversine_distance_km(req.lat, req.lng, r["latitude"], r["longitude"]) <= req.radius_km]
    groups = {}
    for r in candidates:
        code = r.get("details", {}).get("disease_code") if r["report_type"].value == "crop_disease" else r["report_type"].value
        groups.setdefault(code or r["report_type"].value, []).append(r)
    results = []; clustered_count = 0; noise_count = 0
    for code, rows in groups.items():
        current = [r for r in rows if r["created_at"] >= current_cut]; previous = [r for r in rows if r["created_at"] < current_cut]
        clusters = run_dbscan_clustering(current, "crop_disease" if code in KAU_REMEDIES_REGISTRY else code, code if code in KAU_REMEDIES_REGISTRY else None, eps_km=req.dbscan_eps_km, min_samples=3)
        clustered_count += sum(c.report_count for c in clusters); noise_count += max(0, len(current) - sum(c.report_count for c in clusters))
        if not current: continue
        growth = round(((len(current)-len(previous))/len(previous))*100, 1) if previous else 100.0
        cluster = clusters[0] if clusters else None
        label = "Growing Spike" if growth > 50 else ("Active Cluster" if cluster else ("Watch" if len(current) else "Isolated Noise"))
        center = {"lat": cluster.center_latitude, "lng": cluster.center_longitude} if cluster else None
        distance = haversine_distance_km(req.lat, req.lng, center["lat"], center["lng"]) if center else min(haversine_distance_km(req.lat, req.lng, r["latitude"], r["longitude"]) for r in current)
        actions = KAU_REMEDIES_REGISTRY.get(code, {}).get("immediate_actions") if code in KAU_REMEDIES_REGISTRY else None
        results.append({"disease_code": code, "label": LABELS.get(code, code.replace("_", " ").title()), "distance_km": round(distance, 2), "current_count": len(current), "previous_count": len(previous), "trend_label": label, "percentage_change": growth, "cluster_center": center, "action_summary": actions})
    canal_id, canal_name, canal_distance = db.snap_to_nearest_canal(req.lat, req.lng)
    salinity = max([float(r.get("details", {}).get("salinity_ppt", 0)) for r in db.reports.values() if r["report_type"].value == "salinity" and r.get("canal_segment_id") == canal_id and r["created_at"] >= prior_cut] or [0])
    sal_status = "Danger" if salinity >= 2 else ("Warning" if salinity >= 1 else ("Watch" if salinity > 0 else "Safe"))
    sal_actions = ["Halt irrigation motor pumping and close the inlet sluice.", "Test EC or refractometer before pumping."] if sal_status in ("Danger", "Warning") else ["Routine canal monitoring advised."]
    recommendations = sal_actions + [a for r in results[:2] for a in (r.get("action_summary") or [])[:2]]
    return TrendAnalyzeResponse(selected_location={"lat": req.lat, "lng": req.lng}, dbscan_summary={"clusters_found": sum(1 for r in results if r["cluster_center"]), "clustered_reports_count": clustered_count, "noise_reports_count": noise_count, "eps_km": req.dbscan_eps_km, "radius_km": req.radius_km}, spreading_diseases=results, canal_salinity_status={"status": sal_status, "salinity_ppt": salinity, "canal_name": canal_name, "distance_km": round(canal_distance, 2)}, recommended_actions=recommendations)
