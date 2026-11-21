# backend/tests/test_anonymization.py
from fastapi.testclient import TestClient

FARMER_THOMAS = "22222222-2222-2222-2222-222222222201"

def test_reports_api_does_not_leak_reporter_identity(client: TestClient):
    # 1. Create a report with sensitive reporter UUID
    create_res = client.post("/api/reports", json={
        "reporter_id": FARMER_THOMAS,
        "report_type": "crop_disease",
        "latitude": 9.4460,
        "longitude": 76.4580,
        "notes_text": "Private notes from farmer",
        "details": {"disease_code": "brown_planthopper", "confidence": 0.88}
    })
    assert create_res.status_code == 201
    created_data = create_res.json()

    # Never return reporter_id
    assert "reporter_id" not in created_data
    assert "phone" not in created_data
    assert "Thomas" not in str(created_data)

    # 2. Check /api/reports list
    list_res = client.get("/api/reports")
    assert list_res.status_code == 200
    for r in list_res.json():
        assert "reporter_id" not in r
        assert "phone" not in r
        assert "Thomas" not in str(r.get("notes_text", "")) or "തോമസ്" not in str(r)

    # 3. Check /api/map-feed
    feed_res = client.get("/api/map-feed")
    assert feed_res.status_code == 200
    feed_data = feed_res.json()
    for r in feed_data["reports"]:
        assert "reporter_id" not in r
        assert "phone" not in r

    # 4. Check /api/officer/dashboard unconfirmed queue
    dash_res = client.get("/api/officer/dashboard")
    assert dash_res.status_code == 200
    dash_data = dash_res.json()
    for r in dash_data["unconfirmed_queue"]:
        assert "reporter_id" not in r
        assert "phone" not in r
