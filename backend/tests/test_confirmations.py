# backend/tests/test_confirmations.py
from fastapi.testclient import TestClient

FARMER_THOMAS = "22222222-2222-2222-2222-222222222201"
FARMER_RADHAKRISHNAN = "22222222-2222-2222-2222-222222222202"
FARMER_JOSEPH = "22222222-2222-2222-2222-222222222203"
OFFICER_SREEDHAR = "22222222-2222-2222-2222-222222222204"

def test_confirmation_state_machine_and_promotion(client: TestClient):
    # 1. Create a fresh unconfirmed report by Farmer Thomas
    rep = client.post("/api/reports", json={
        "reporter_id": FARMER_THOMAS,
        "report_type": "crop_disease",
        "latitude": 9.4460,
        "longitude": 76.4580,
        "details": {"disease_code": "brown_planthopper", "confidence": 0.90}
    }).json()

    report_id = rep["id"]
    assert rep["verification_status"] == "unconfirmed"
    assert rep["confirmations_count"] == 0

    # 2. Reject self-confirmation: Farmer Thomas cannot confirm his own report
    self_conf = client.post(f"/api/reports/{report_id}/confirm", json={
        "confirmer_id": FARMER_THOMAS
    })
    assert self_conf.status_code == 400
    assert "cannot confirm their own" in self_conf.json()["detail"]

    # 3. First neighbor confirmation by Farmer Radhakrishnan
    conf1 = client.post(f"/api/reports/{report_id}/confirm", json={
        "confirmer_id": FARMER_RADHAKRISHNAN
    })
    assert conf1.status_code == 200
    data1 = conf1.json()
    assert data1["confirmations_count"] == 1
    # Still unconfirmed since threshold is 2
    assert data1["verification_status"] == "unconfirmed"

    # 4. Reject duplicate confirmation by Farmer Radhakrishnan
    dup_conf = client.post(f"/api/reports/{report_id}/confirm", json={
        "confirmer_id": FARMER_RADHAKRISHNAN
    })
    assert dup_conf.status_code == 409
    assert "already confirmed" in dup_conf.json()["detail"]

    # 5. Second neighbor confirmation by Farmer Joseph -> triggers promotion!
    conf2 = client.post(f"/api/reports/{report_id}/confirm", json={
        "confirmer_id": FARMER_JOSEPH
    })
    assert conf2.status_code == 200
    data2 = conf2.json()
    assert data2["confirmations_count"] == 2
    # Automatically promoted to community_confirmed!
    assert data2["verification_status"] == "community_confirmed"

def test_officer_verification_flow(client: TestClient):
    # Unconfirmed report
    r6_id = "33333333-3333-3333-3333-333333333306"

    # Unauthorized attempt: Farmer cannot act as officer
    unauth = client.post(f"/api/reports/{r6_id}/verify", json={
        "officer_id": FARMER_THOMAS,
        "status": "officially_verified",
        "notes": "Looks bad."
    })
    assert unauth.status_code == 403

    # Authorized officer verification
    auth = client.post(f"/api/reports/{r6_id}/verify", json={
        "officer_id": OFFICER_SREEDHAR,
        "status": "officially_verified",
        "notes": "Verified piping seepage on site; mobilized sandbags."
    })
    assert auth.status_code == 200
    assert auth.json()["verification_status"] == "officially_verified"
    assert "officer_notes" in auth.json()["details"]
