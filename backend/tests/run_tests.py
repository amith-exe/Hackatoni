# backend/tests/run_tests.py
import sys
import os
from uuid import UUID

# Ensure repo root is on sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..")))

# Set testing environment
os.environ["TESTING"] = "true"
os.environ["MOCK_WEATHER"] = "true"
os.environ["LOKY_MAX_CPU_COUNT"] = "4"

from backend.app.services.db import db
from backend.app.models.schemas import (
    ReportCreate, ReportType, VerificationStatus,
    ConfirmationCreate, VerificationCreate, AlertLevel
)
from backend.app.routers.reports import create_report, confirm_report, verify_report, list_reports, get_report
from backend.app.routers.map_feed import get_map_feed
from backend.app.routers.officer import get_officer_dashboard
from backend.app.routers.remedies import get_remedy, list_all_remedies
from backend.app.services.clustering import run_dbscan_clustering
from backend.app.services.canal_routing import analyze_salinity_propagation

FARMER_THOMAS = UUID("22222222-2222-2222-2222-222222222201")
FARMER_RADHAKRISHNAN = UUID("22222222-2222-2222-2222-222222222202")
FARMER_JOSEPH = UUID("22222222-2222-2222-2222-222222222203")
OFFICER_SREEDHAR = UUID("22222222-2222-2222-2222-222222222204")
C1_ID = UUID("11111111-1111-1111-1111-111111111101")
C2_ID = UUID("11111111-1111-1111-1111-111111111102")

passed = 0
failed = 0

def test(name):
    def decorator(fn):
        global passed, failed
        import asyncio
        try:
            if asyncio.iscoroutinefunction(fn):
                asyncio.run(fn())
            else:
                fn()
            print(f"  [PASS] {name}")
            passed += 1
        except Exception as e:
            import traceback
            print(f"  [FAIL] {name}: {e}")
            traceback.print_exc()
            failed += 1
        return fn
    return decorator

print("==================================================")
print("RUNNING KARSHAKAN LENS BACKEND CORE UNIT TESTS")
print("==================================================")

# Reset DB before each suite
db.seed_defaults()

@test("1. Report creation & nearest canal snapping for all 5 types")
async def test_creation_all_types():
    db.seed_defaults()
    # 1. Crop disease
    r_crop = await create_report(ReportCreate(
        reporter_id=FARMER_THOMAS,
        report_type=ReportType.crop_disease,
        latitude=9.446,
        longitude=76.458,
        details={"disease_code": "brown_planthopper", "confidence": 0.94}
    ))
    assert r_crop.report_type == ReportType.crop_disease
    assert r_crop.canal_segment_id is not None
    assert r_crop.action_guidance is not None
    assert "Brown Plant Hopper" in r_crop.action_guidance.title
    assert r_crop.action_guidance.is_uncertain is False

    # 2. Salinity
    r_sal = await create_report(ReportCreate(
        reporter_id=FARMER_THOMAS,
        report_type=ReportType.salinity,
        latitude=9.489,
        longitude=76.381,
        details={"salinity_ppt": 2.8}
    ))
    assert r_sal.report_type == ReportType.salinity
    assert r_sal.action_guidance is not None
    assert any("MOTOR SHUT-OFF" in b for b in r_sal.action_guidance.bullet_points)

    # 3. Bird deaths
    r_bird = await create_report(ReportCreate(
        reporter_id=FARMER_THOMAS,
        report_type=ReportType.bird_deaths,
        latitude=9.4285,
        longitude=76.4385,
        details={"dead_count": 30, "sick_count": 40}
    ))
    assert r_bird.report_type == ReportType.bird_deaths
    assert r_bird.action_guidance.alert_level == AlertLevel.Danger

    # 4. Bund seepage
    r_bund = await create_report(ReportCreate(
        reporter_id=FARMER_THOMAS,
        report_type=ReportType.bund_seepage,
        latitude=9.420,
        longitude=76.423,
        details={"water_level_diff_feet": 4.0, "seepage_type": "active_piping"}
    ))
    assert r_bund.report_type == ReportType.bund_seepage
    assert any("REVERSE FILTER" in b for b in r_bund.action_guidance.bullet_points)

    # 5. Crop loss
    r_loss = await create_report(ReportCreate(
        reporter_id=FARMER_THOMAS,
        report_type=ReportType.crop_loss,
        latitude=9.436,
        longitude=76.404,
        details={"affected_area_acres": 2.5}
    ))
    assert r_loss.report_type == ReportType.crop_loss
    assert any("AIMS PORTAL" in b for b in r_loss.action_guidance.bullet_points)

@test("2. Crop disease classifier < 0.70 confidence fallback")
async def test_low_conf_fallback():
    r_low = await create_report(ReportCreate(
        reporter_id=FARMER_THOMAS,
        report_type=ReportType.crop_disease,
        latitude=9.446,
        longitude=76.458,
        photo_url="https://example.com/photos/uncertain_blurry.jpg",
        details={"confidence": 0.52}
    ))
    assert r_low.action_guidance.is_uncertain is True
    assert "Uncertain" in r_low.action_guidance.title or "വ്യക്തമല്ല" in r_low.action_guidance.title_ml
    assert "Krishi Bhavan" in r_low.action_guidance.title_ml or "Krishi Bhavan" in r_low.action_guidance.summary
    assert "Never apply random chemical sprays" in r_low.action_guidance.summary

@test("3. Confirmation state machine, self-rejection, duplicate rejection, and promotion")
async def test_confirmations_machine():
    db.seed_defaults()
    rep = await create_report(ReportCreate(
        reporter_id=FARMER_THOMAS,
        report_type=ReportType.crop_disease,
        latitude=9.446,
        longitude=76.458,
        details={"disease_code": "brown_planthopper", "confidence": 0.88}
    ))
    assert rep.verification_status == VerificationStatus.unconfirmed
    assert rep.confirmations_count == 0

    # Self-confirmation rejection
    try:
        await confirm_report(rep.id, ConfirmationCreate(confirmer_id=FARMER_THOMAS))
        assert False, "Should have raised exception for self-confirmation"
    except Exception as e:
        assert "cannot confirm their own" in str(e) or "400" in str(e)

    # First confirmation by neighbor
    c1 = await confirm_report(rep.id, ConfirmationCreate(confirmer_id=FARMER_RADHAKRISHNAN))
    assert c1.confirmations_count == 1
    assert c1.verification_status == VerificationStatus.unconfirmed

    # Duplicate confirmation rejection
    try:
        await confirm_report(rep.id, ConfirmationCreate(confirmer_id=FARMER_RADHAKRISHNAN))
        assert False, "Should have rejected duplicate confirmation"
    except Exception as e:
        assert "already confirmed" in str(e) or "409" in str(e)

    # Second confirmation promotes to community_confirmed
    c2 = await confirm_report(rep.id, ConfirmationCreate(confirmer_id=FARMER_JOSEPH))
    assert c2.confirmations_count == 2
    assert c2.verification_status == VerificationStatus.community_confirmed

@test("4. Officer verification by authorized role and rejection of unauthorized role")
async def test_officer_verification():
    db.seed_defaults()
    r6_id = UUID("33333333-3333-3333-3333-333333333306")

    # Farmer cannot act as officer
    try:
        await verify_report(r6_id, VerificationCreate(officer_id=FARMER_THOMAS, status="officially_verified"))
        assert False, "Should have forbidden non-officer"
    except Exception as e:
        assert "Unauthorized" in str(e) or "403" in str(e)

    # Authorized officer
    ver = await verify_report(r6_id, VerificationCreate(
        officer_id=OFFICER_SREEDHAR,
        status="officially_verified",
        notes="Inspected on-site with Padasekharam samithi."
    ))
    assert ver.verification_status == VerificationStatus.officially_verified
    assert "officer_notes" in ver.details

@test("5. DBSCAN Haversine Clustering logic")
def test_dbscan_logic():
    from datetime import datetime, timezone, timedelta
    now = datetime.now(timezone.utc)
    reports = [
        {"latitude": 9.446, "longitude": 76.458, "created_at": now - timedelta(hours=5), "details": {"disease_code": "brown_planthopper", "severity": "high"}},
        {"latitude": 9.445, "longitude": 76.456, "created_at": now - timedelta(hours=3), "details": {"disease_code": "brown_planthopper", "severity": "medium"}},
        {"latitude": 9.447, "longitude": 76.459, "created_at": now - timedelta(hours=1), "details": {"disease_code": "brown_planthopper", "severity": "high"}},
        {"latitude": 9.700, "longitude": 76.600, "created_at": now - timedelta(hours=4), "details": {"disease_code": "brown_planthopper", "severity": "low"}}
    ]
    cls = run_dbscan_clustering(reports, report_type="crop_disease", sub_category="brown_planthopper", eps_km=2.0, min_samples=2)
    assert len(cls) == 1
    assert cls[0].report_count == 3
    assert 9.445 <= cls[0].center_latitude <= 9.448
    assert cls[0].alert_level in (AlertLevel.Danger, AlertLevel.Warning)

@test("6. Upstream canal salinity propagation")
def test_salinity_propagation():
    dry_rain = {"status": "online", "total_rain_24h_mm": 0.8, "dilution_factor": "low"}
    aff, guidance = analyze_salinity_propagation(C1_ID, 3.4, dry_rain)
    assert len(aff) >= 2
    c1 = next(c for c in aff if c.id == C1_ID)
    assert c1.current_alert_level == AlertLevel.Danger
    c2 = next(c for c in aff if c.id == C2_ID)
    assert c2.current_alert_level in (AlertLevel.Danger, AlertLevel.Warning)
    assert guidance.alert_level == AlertLevel.Danger

@test("7. Strict anonymization & privacy verification (reporter_id stripped)")
async def test_anonymization():
    db.seed_defaults()
    rep = await create_report(ReportCreate(
        reporter_id=FARMER_THOMAS,
        report_type=ReportType.crop_disease,
        latitude=9.446,
        longitude=76.458,
        notes_text="Confidential report notes",
        details={"disease_code": "brown_planthopper"}
    ))
    rep_dict = rep.model_dump()
    assert "reporter_id" not in rep_dict
    assert "phone" not in rep_dict
    assert "Thomas" not in str(rep_dict)

    feed = await get_map_feed()
    for r in feed.reports:
        d = r.model_dump()
        assert "reporter_id" not in d
        assert "phone" not in d

    dash = await get_officer_dashboard()
    for r in dash.unconfirmed_queue:
        d = r.model_dump()
        assert "reporter_id" not in d
        assert "phone" not in d

@test("8. Curated KAU remedies lookup")
async def test_remedies_lookup():
    all_rems = await list_all_remedies()
    assert len(all_rems) >= 4
    bph = await get_remedy("brown_planthopper")
    assert bph.disease_code == "brown_planthopper"
    assert "ചാഴി" in bph.disease_name_ml
    assert len(bph.immediate_actions) >= 3
    assert "Package of Practices" in bph.source_citation

print("\n" + "=" * 50)
print(f"TEST RESULTS: {passed} PASSED, {failed} FAILED")
print("=" * 50)

if failed > 0:
    sys.exit(1)
