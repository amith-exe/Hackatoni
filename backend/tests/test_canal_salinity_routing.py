# backend/tests/test_canal_salinity_routing.py
from uuid import UUID
from backend.app.services.canal_routing import analyze_salinity_propagation
from backend.app.models.schemas import AlertLevel

C1_ID = UUID("11111111-1111-1111-1111-111111111101")  # Vembanad - Kainakary North Channel
C2_ID = UUID("11111111-1111-1111-1111-111111111102")  # Kainakary - Pulincunnoo Main Canal

def test_canal_salinity_propagation_low_rain():
    # Low rain condition (dry spell): salinity does not dilute easily
    dry_rain_summary = {
        "status": "online",
        "total_rain_24h_mm": 1.0,
        "dilution_factor": "low"
    }

    affected_canals, guidance = analyze_salinity_propagation(
        source_canal_id=C1_ID,
        salinity_ppt=3.5,
        rainfall_summary=dry_rain_summary
    )

    # Origin segment C1 should be Danger
    assert len(affected_canals) >= 2
    c1 = next(c for c in affected_canals if c.id == C1_ID)
    assert c1.current_alert_level == AlertLevel.Danger

    # Connected downstream/upstream canal C2 should also receive Danger under dry conditions
    c2 = next(c for c in affected_canals if c.id == C2_ID)
    assert c2.current_alert_level in (AlertLevel.Danger, AlertLevel.Warning)
    assert "Salinity ingress risk" in c2.alert_reason

    # Guidance should mandate motor shut-off
    assert guidance.alert_level == AlertLevel.Danger
    assert any("MOTOR SHUT-OFF" in b for b in guidance.bullet_points)

def test_canal_salinity_propagation_high_rain():
    # Heavy rainfall: freshwater runoff dilutes salinity
    heavy_rain_summary = {
        "status": "online",
        "total_rain_24h_mm": 28.5,
        "dilution_factor": "high"
    }

    affected_canals, guidance = analyze_salinity_propagation(
        source_canal_id=C1_ID,
        salinity_ppt=2.2,
        rainfall_summary=heavy_rain_summary
    )

    c2 = next(c for c in affected_canals if c.id == C2_ID)
    # With high dilution, C2 should be buffered to Warning or Watch
    assert c2.current_alert_level in (AlertLevel.Warning, AlertLevel.Watch)
    assert "Buffered by 28.5 mm" in c2.alert_reason
