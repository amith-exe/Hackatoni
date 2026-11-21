# backend/tests/run_tests.py
import sys
import os
from uuid import UUID

# Ensure repo root is on sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..")))

# Set testing environment
os.environ["TESTING"] = "true"
os.environ["MOCK_WEATHER"] = "true"
os.environ["LOKY_MAX_CPU_COUNT"] = "1"

def run_sync(coro):
    """Executes coroutine synchronously without event loop socketpair overhead."""
    try:
        coro.send(None)
    except StopIteration as e:
        return e.value
    raise RuntimeError("Coroutine unexpectedly yielded to event loop")

from backend.app.services.db import db
from backend.app.models.schemas import (
    ReportCreate, ReportType, VerificationStatus,
    ConfirmationCreate, VerificationCreate, AlertLevel
)
from backend.app.routers.reports import create_report, confirm_report, verify_report
from backend.app.routers.map_feed import get_map_feed
from backend.app.routers.remedies import get_remedy, list_all_remedies
from backend.app.services.clustering import run_dbscan_clustering
from backend.app.services.canal_routing import analyze_salinity_propagation

FARMER_THOMAS = UUID("22222222-2222-2222-2222-222222222201")
FARMER_RADHAKRISHNAN = UUID("22222222-2222-2222-2222-222222222202")
FARMER_JOSEPH = UUID("22222222-2222-2222-2222-222222222203")
OFFICER_SREEDHAR = UUID("22222222-2222-2222-2222-222222222204")
C1_ID = UUID("11111111-1111-1111-1111-111111111101")
C2_ID = UUID("11111111-1111-1111-1111-111111111102")

def main():
    print("==================================================", flush=True)
    print("RUNNING KARSHAKAN LENS FAST BACKEND TEST SUITE", flush=True)
    print("==================================================", flush=True)

    passed = 0
    failed = 0

    # 1. Report creation & nearest canal snapping
    try:
        db.seed_defaults()
        r_crop = run_sync(create_report(ReportCreate(
            reporter_id=FARMER_THOMAS,
            report_type=ReportType.crop_disease,
            latitude=9.446,
            longitude=76.458,
            details={"disease_code": "brown_planthopper", "confidence": 0.94}
        )))
        assert r_crop.report_type == ReportType.crop_disease
        assert r_crop.canal_segment_id is not None
        assert r_crop.action_guidance is not None
        assert "Brown Plant Hopper" in r_crop.action_guidance.title

        r_sal = run_sync(create_report(ReportCreate(
            reporter_id=FARMER_THOMAS,
            report_type=ReportType.salinity,
            latitude=9.489,
            longitude=76.381,
            details={"salinity_ppt": 2.8}
        )))
        assert r_sal.report_type == ReportType.salinity
        assert any("MOTOR SHUT-OFF" in b for b in r_sal.action_guidance.bullet_points)
        print("  [PASS] 1. Report creation & nearest canal snapping", flush=True)
        passed += 1
    except Exception as e:
        print(f"  [FAIL] 1. Report creation: {e}", flush=True)
        failed += 1

    # 2. Classifier < 0.70 fallback
    try:
        r_low = run_sync(create_report(ReportCreate(
            reporter_id=FARMER_THOMAS,
            report_type=ReportType.crop_disease,
            latitude=9.446,
            longitude=76.458,
            photo_url="https://example.com/photos/uncertain_blurry.jpg",
            details={"confidence": 0.52}
        )))
        assert r_low.action_guidance.is_uncertain is True
        assert "Krishi Bhavan" in r_low.action_guidance.title or "വ്യക്തമല്ല" in r_low.action_guidance.title_ml
        print("  [PASS] 2. Crop disease classifier < 0.70 fallback", flush=True)
        passed += 1
    except Exception as e:
        print(f"  [FAIL] 2. Classifier fallback: {e}", flush=True)
        failed += 1

    # 3. Confirmation state machine
    try:
        db.seed_defaults()
        rep = run_sync(create_report(ReportCreate(
            reporter_id=FARMER_THOMAS,
            report_type=ReportType.crop_disease,
            latitude=9.446,
            longitude=76.458,
            details={"disease_code": "brown_planthopper", "confidence": 0.88}
        )))
        assert rep.verification_status == VerificationStatus.unconfirmed

        # Confirmation 1
        c1 = run_sync(confirm_report(rep.id, ConfirmationCreate(confirmer_id=FARMER_RADHAKRISHNAN)))
        assert c1.confirmations_count == 1

        # Confirmation 2 -> community_confirmed
        c2 = run_sync(confirm_report(rep.id, ConfirmationCreate(confirmer_id=FARMER_JOSEPH)))
        assert c2.confirmations_count == 2
        assert c2.verification_status == VerificationStatus.community_confirmed
        print("  [PASS] 3. Confirmation state machine & promotion at 2 verifies", flush=True)
        passed += 1
    except Exception as e:
        print(f"  [FAIL] 3. Confirmation state machine: {e}", flush=True)
        failed += 1

    # 4. Officer verification
    try:
        db.seed_defaults()
        r6_id = UUID("33333333-3333-3333-3333-333333333306")
        ver = run_sync(verify_report(r6_id, VerificationCreate(
            officer_id=OFFICER_SREEDHAR,
            status="officially_verified",
            notes="Inspected on-site with Padasekharam samithi."
        )))
        assert ver.verification_status == VerificationStatus.officially_verified
        print("  [PASS] 4. Officer verification by authorized role", flush=True)
        passed += 1
    except Exception as e:
        print(f"  [FAIL] 4. Officer verification: {e}", flush=True)
        failed += 1

    # 5. DBSCAN Haversine Clustering
    try:
        from datetime import datetime, timezone, timedelta
        now = datetime.now(timezone.utc)
        sample_reports = [
            {"latitude": 9.446, "longitude": 76.458, "created_at": now - timedelta(hours=5), "details": {"disease_code": "brown_planthopper", "severity": "high"}},
            {"latitude": 9.445, "longitude": 76.456, "created_at": now - timedelta(hours=3), "details": {"disease_code": "brown_planthopper", "severity": "medium"}},
            {"latitude": 9.447, "longitude": 76.459, "created_at": now - timedelta(hours=1), "details": {"disease_code": "brown_planthopper", "severity": "high"}},
        ]
        cls = run_dbscan_clustering(sample_reports, report_type="crop_disease", sub_category="brown_planthopper", eps_km=2.0, min_samples=2)
        assert len(cls) == 1
        assert cls[0].report_count == 3
        print("  [PASS] 5. DBSCAN Haversine spatial clustering", flush=True)
        passed += 1
    except Exception as e:
        print(f"  [FAIL] 5. DBSCAN clustering: {e}", flush=True)
        failed += 1

    # 6. Salinity propagation
    try:
        dry_rain = {"status": "online", "total_rain_24h_mm": 0.8, "dilution_factor": "low"}
        aff, guidance = analyze_salinity_propagation(C1_ID, 3.4, dry_rain)
        assert len(aff) >= 2
        assert guidance.alert_level == AlertLevel.Danger
        print("  [PASS] 6. Upstream canal salinity propagation", flush=True)
        passed += 1
    except Exception as e:
        print(f"  [FAIL] 6. Salinity propagation: {e}", flush=True)
        failed += 1

    # 7. Privacy & Anonymization
    try:
        feed = run_sync(get_map_feed())
        for r in feed.reports:
            d = r.model_dump()
            assert "reporter_id" not in d
            assert "phone" not in d
        print("  [PASS] 7. Strict anonymization & privacy verification", flush=True)
        passed += 1
    except Exception as e:
        print(f"  [FAIL] 7. Anonymization: {e}", flush=True)
        failed += 1

    # 8. Curated KAU remedies
    try:
        all_rems = run_sync(list_all_remedies())
        assert len(all_rems) >= 4
        bph = run_sync(get_remedy("brown_planthopper"))
        assert bph.disease_code == "brown_planthopper"
        assert len(bph.immediate_actions) >= 3
        print("  [PASS] 8. Curated KAU remedies lookup", flush=True)
        passed += 1
    except Exception as e:
        print(f"  [FAIL] 8. Remedies lookup: {e}", flush=True)
        failed += 1

    print("\n" + "=" * 50, flush=True)
    print(f"TEST RESULTS: {passed} PASSED, {failed} FAILED", flush=True)
    print("=" * 50, flush=True)

    if failed > 0:
        sys.exit(1)

if __name__ == "__main__":
    main()
