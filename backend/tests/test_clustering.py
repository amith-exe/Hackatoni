# backend/tests/test_clustering.py
from datetime import datetime, timezone, timedelta
from backend.app.services.clustering import run_dbscan_clustering
from backend.app.models.schemas import AlertLevel, Trend

def test_dbscan_clustering_nearby_points():
    now = datetime.now(timezone.utc)
    # Three neighboring points within 0.8 km in Pulincunnoo
    sample_reports = [
        {
            "latitude": 9.4460,
            "longitude": 76.4580,
            "created_at": now - timedelta(hours=10),
            "details": {"disease_code": "brown_planthopper", "severity": "high"}
        },
        {
            "latitude": 9.4450,
            "longitude": 76.4560,
            "created_at": now - timedelta(hours=8),
            "details": {"disease_code": "brown_planthopper", "severity": "medium"}
        },
        {
            "latitude": 9.4470,
            "longitude": 76.4590,
            "created_at": now - timedelta(hours=2),
            "details": {"disease_code": "brown_planthopper", "severity": "high"}
        },
        # One isolated point far away (~20 km) in Kottayam/Vaikom
        {
            "latitude": 9.6200,
            "longitude": 76.5100,
            "created_at": now - timedelta(hours=5),
            "details": {"disease_code": "brown_planthopper", "severity": "low"}
        }
    ]

    clusters = run_dbscan_clustering(
        reports=sample_reports,
        report_type="crop_disease",
        sub_category="brown_planthopper",
        eps_km=2.0,
        min_samples=2
    )

    # Exactly 1 cluster formed (the 3 nearby points), the distant point is ignored as noise
    assert len(clusters) == 1
    cluster = clusters[0]
    assert cluster.report_count == 3
    assert cluster.sub_category == "brown_planthopper"
    assert 9.445 <= cluster.center_latitude <= 9.448
    assert 76.455 <= cluster.center_longitude <= 76.460
    assert cluster.alert_level in (AlertLevel.Danger, AlertLevel.Warning)
    assert cluster.trend in (Trend.growing, Trend.new)

def test_dbscan_clustering_insufficient_samples():
    now = datetime.now(timezone.utc)
    single_report = [
        {
            "latitude": 9.4460,
            "longitude": 76.4580,
            "created_at": now,
            "details": {"disease_code": "rice_blast"}
        }
    ]
    # min_samples=2 -> single report cannot form a cluster
    clusters = run_dbscan_clustering(
        reports=single_report,
        report_type="crop_disease",
        sub_category="rice_blast",
        eps_km=2.0,
        min_samples=2
    )
    assert len(clusters) == 0
