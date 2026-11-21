# backend/app/services/clustering.py
"""
Spatial Clustering Engine using Scikit-Learn DBSCAN with Haversine Metric.
Groups localized crop disease outbreaks and bird mortality hot-zones across Kuttanad delta.
Configurable eps_km per report type (default: 2.0 km).
"""

from typing import List, Dict, Any, Optional
from datetime import datetime, timezone, timedelta
from uuid import uuid4
import numpy as np
from sklearn.cluster import DBSCAN

from backend.app.models.schemas import ClusterResponse, Trend, AlertLevel, ReportType
from backend.app.config import settings

EARTH_RADIUS_KM = 6371.0088

def run_dbscan_clustering(
    reports: List[Dict[str, Any]],
    report_type: str,
    sub_category: Optional[str] = None,
    eps_km: Optional[float] = None,
    min_samples: Optional[int] = None
) -> List[ClusterResponse]:
    """
    Executes haversine DBSCAN on a collection of geo-located reports.
    
    Args:
        reports: List of report dictionary records with 'latitude', 'longitude', 'created_at'.
        report_type: Incident type ('crop_disease', 'bird_deaths', etc.).
        sub_category: Optional disease_code to cluster specific pathogen.
        eps_km: Neighborhood radius in kilometers (defaults to settings.DBSCAN_DEFAULT_EPS_KM).
        min_samples: Minimum cluster size (defaults to settings.DBSCAN_MIN_SAMPLES).
    
    Returns:
        List[ClusterResponse] with center coordinates, alert level, and trend.
    """
    if eps_km is None:
        eps_km = settings.DBSCAN_DEFAULT_EPS_KM
    if min_samples is None:
        min_samples = settings.DBSCAN_MIN_SAMPLES

    # Filter reports by subcategory if provided
    eligible_reports = []
    for r in reports:
        if sub_category:
            details = r.get("details", {})
            if details.get("disease_code") != sub_category:
                continue
        eligible_reports.append(r)

    if len(eligible_reports) < min_samples:
        return []

    # Prepare coordinates in radians for haversine metric: [lat, lon]
    coords = np.array([[r["latitude"], r["longitude"]] for r in eligible_reports])
    coords_rad = np.radians(coords)

    # eps in radians = eps_km / Earth's radius in km
    eps_rad = eps_km / EARTH_RADIUS_KM

    # Use n_jobs=1 to avoid loky multiprocessing subprocess spawning overhead/hangs in containerized/sandboxed environments
    db = DBSCAN(eps=eps_rad, min_samples=min_samples, metric='haversine', n_jobs=1)
    labels = db.fit_predict(coords_rad)

    unique_labels = set(labels)
    clusters: List[ClusterResponse] = []
    now = datetime.now(timezone.utc)

    for cluster_id in unique_labels:
        if cluster_id == -1:
            # Noise points
            continue

        cluster_indices = np.where(labels == cluster_id)[0]
        cluster_reports = [eligible_reports[i] for i in cluster_indices]
        count = len(cluster_reports)

        # Compute centroid (mean latitude and longitude)
        cluster_coords = coords[cluster_indices]
        center_lat = float(np.mean(cluster_coords[:, 0]))
        center_lon = float(np.mean(cluster_coords[:, 1]))

        # Calculate time window
        timestamps = [r["created_at"] for r in cluster_reports]
        window_start = min(timestamps)
        window_end = max(timestamps)

        # Determine trend
        recent_count = sum(1 for t in timestamps if (now - t) <= timedelta(hours=36))
        if count >= 4 and recent_count >= 2:
            trend = Trend.growing
        elif (now - window_start) <= timedelta(hours=24):
            trend = Trend.new
        elif recent_count >= 1:
            trend = Trend.growing
        else:
            trend = Trend.stable

        # Determine alert level
        # Check severity in details
        has_severe_details = any(
            r.get("details", {}).get("severity") == "high" or
            r.get("details", {}).get("dead_count", 0) >= 20
            for r in cluster_reports
        )

        if count >= 4 or has_severe_details:
            alert_level = AlertLevel.Danger
        elif count >= 2:
            alert_level = AlertLevel.Warning
        else:
            alert_level = AlertLevel.Watch

        clusters.append(ClusterResponse(
            id=uuid4(),
            report_type=report_type,
            sub_category=sub_category,
            center_latitude=round(center_lat, 6),
            center_longitude=round(center_lon, 6),
            radius_km=eps_km,
            report_count=count,
            window_start=window_start,
            window_end=window_end,
            trend=trend,
            alert_level=alert_level
        ))

    return clusters
