# backend/tests/test_reporting_state_machine.py
from uuid import UUID
from fastapi.testclient import TestClient

FARMER_THOMAS = "22222222-2222-2222-2222-222222222201"
PULINCUNNOO_LAT = 9.4460
PULINCUNNOO_LON = 76.4580

def test_create_crop_disease_report_with_high_confidence(client: TestClient):
    payload = {
        "reporter_id": FARMER_THOMAS,
        "report_type": "crop_disease",
        "latitude": PULINCUNNOO_LAT,
        "longitude": PULINCUNNOO_LON,
        "photo_url": "https://example.com/photos/rice_bph_tiller.jpg",
        "notes_text": "Severe hopper aggregation at plant base.",
        "details": {
            "disease_code": "brown_planthopper",
            "confidence": 0.94
        }
    }
    response = client.post("/api/reports", json=payload)
    assert response.status_code == 201
    data = response.json()

    # Verify reporter_id is stripped
    assert "reporter_id" not in data
    assert data["report_type"] == "crop_disease"
    assert data["verification_status"] == "unconfirmed"
    assert data["confirmations_count"] == 0
    assert data["canal_segment_id"] is not None  # Auto-snapped

    # Verify KAU Guidance
    assert data["action_guidance"] is not None
    assert "Brown Plant Hopper" in data["action_guidance"]["title"]
    assert data["action_guidance"]["is_uncertain"] is False
    assert any("Alternate Wetting and Drying" in pt for pt in data["action_guidance"]["bullet_points"])

def test_crop_disease_low_confidence_fallback(client: TestClient):
    """When classifier confidence is < 0.70, must return 'Not sure — ask your Krishi Bhavan' fallback."""
    payload = {
        "reporter_id": FARMER_THOMAS,
        "report_type": "crop_disease",
        "latitude": PULINCUNNOO_LAT,
        "longitude": PULINCUNNOO_LON,
        "photo_url": "https://example.com/photos/uncertain_blurry_leaf.jpg",
        "notes_text": "Uncertain leaf spots.",
        "details": {
            "disease_code": "brown_planthopper",
            "confidence": 0.52
        }
    }
    response = client.post("/api/reports", json=payload)
    assert response.status_code == 201
    data = response.json()

    assert data["action_guidance"] is not None
    assert data["action_guidance"]["is_uncertain"] is True
    assert "Uncertain" in data["action_guidance"]["title"] or "വ്യക്തമല്ല" in data["action_guidance"]["title_ml"]
    assert "Krishi Bhavan" in data["action_guidance"]["title_ml"] or "Krishi Bhavan" in data["action_guidance"]["summary"]
    # Verify no chemical spray recommendation is given for uncertain image
    assert "Never apply random chemical sprays" in data["action_guidance"]["summary"]

def test_create_salinity_report_and_canal_routing(client: TestClient):
    payload = {
        "reporter_id": FARMER_THOMAS,
        "report_type": "salinity",
        "latitude": 9.4890,
        "longitude": 76.3810,
        "details": {
            "salinity_ppt": 2.8,
            "tide_phase": "high_tide"
        }
    }
    response = client.post("/api/reports", json=payload)
    assert response.status_code == 201
    data = response.json()

    assert "reporter_id" not in data
    assert data["report_type"] == "salinity"
    assert data["action_guidance"] is not None
    assert "Salinity" in data["action_guidance"]["title"]
    assert any("MOTOR SHUT-OFF" in pt for pt in data["action_guidance"]["bullet_points"])

def test_create_bird_deaths_report_safety_guidance(client: TestClient):
    payload = {
        "reporter_id": FARMER_THOMAS,
        "report_type": "bird_deaths",
        "latitude": 9.4285,
        "longitude": 76.4385,
        "details": {
            "dead_count": 35,
            "sick_count": 50,
            "flock_size": 1500
        }
    }
    response = client.post("/api/reports", json=payload)
    assert response.status_code == 201
    data = response.json()

    assert data["action_guidance"] is not None
    assert data["action_guidance"]["alert_level"] == "Danger"
    assert any("DEEP BURIAL" in pt for pt in data["action_guidance"]["bullet_points"])
    assert any("ISOLATION" in pt for pt in data["action_guidance"]["bullet_points"])

def test_create_bund_seepage_report_safety_guidance(client: TestClient):
    payload = {
        "reporter_id": FARMER_THOMAS,
        "report_type": "bund_seepage",
        "latitude": 9.4200,
        "longitude": 76.4230,
        "details": {
            "water_level_diff_feet": 4.0,
            "seepage_type": "active_piping"
        }
    }
    response = client.post("/api/reports", json=payload)
    assert response.status_code == 201
    data = response.json()

    assert data["action_guidance"] is not None
    assert any("REVERSE FILTER" in pt for pt in data["action_guidance"]["bullet_points"])

def test_create_crop_loss_report_guidance(client: TestClient):
    payload = {
        "reporter_id": FARMER_THOMAS,
        "report_type": "crop_loss",
        "latitude": 9.4360,
        "longitude": 76.4040,
        "details": {
            "affected_area_acres": 3.0,
            "cause": "salinity_intrusion"
        }
    }
    response = client.post("/api/reports", json=payload)
    assert response.status_code == 201
    data = response.json()

    assert data["action_guidance"] is not None
    assert any("GEO-TAGGED PHOTOS" in pt for pt in data["action_guidance"]["bullet_points"])
    assert any("AIMS PORTAL" in pt for pt in data["action_guidance"]["bullet_points"])
