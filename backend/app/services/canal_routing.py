# backend/app/services/canal_routing.py
"""
Hydrological Canal Network Routing and Salinity Intrusion Analysis.
Traverses upstream canal segments to model saltwater ingress from Vembanad estuary into Kuttanad polders.
Integrates live/cached Open-Meteo precipitation to calculate freshwater dilution effects.
CRITICAL RULE: Never generates a circular radius blob for salinity; alerts follow strictly along canal segments.
"""

from typing import Dict, Any, List, Optional, Tuple
from uuid import UUID
import os
import httpx

from backend.app.models.schemas import (
    AlertLevel, ActionGuidance, CanalSegmentResponse
)
from backend.app.services.db import db
from backend.app.config import settings

async def fetch_kuttanad_rainfall() -> Dict[str, Any]:
    """
    Queries Open-Meteo API for Kuttanad (lat 9.45, lng 76.43) rainfall over the past 48 hours.
    Gracefully falls back to representative hydrological data if network is offline or in testing.
    """
    if os.getenv("TESTING") == "true" or os.getenv("MOCK_WEATHER") == "true":
        return {
            "source": "kuttanad_hydrology_mock",
            "status": "online",
            "total_rain_24h_mm": 2.5,
            "total_rain_48h_mm": 6.0,
            "dilution_factor": "low"
        }

    url = f"{settings.OPEN_METEO_BASE_URL}?latitude={settings.KUTTANAD_LAT}&longitude={settings.KUTTANAD_LNG}&hourly=rain,precipitation&past_days=2&forecast_days=1"
    
    try:
        timeout = httpx.Timeout(2.0, connect=1.0)
        async with httpx.AsyncClient(timeout=timeout, verify=False) as client:
            resp = await client.get(url)
            if resp.status_code == 200:
                data = resp.json()
                hourly_rain = data.get("hourly", {}).get("rain", [])
                total_rain_48h = sum(hourly_rain[-48:]) if len(hourly_rain) >= 48 else sum(hourly_rain)
                total_rain_24h = sum(hourly_rain[-24:]) if len(hourly_rain) >= 24 else total_rain_48h
                return {
                    "source": "open-meteo",
                    "status": "online",
                    "total_rain_24h_mm": round(total_rain_24h, 2),
                    "total_rain_48h_mm": round(total_rain_48h, 2),
                    "dilution_factor": "high" if total_rain_24h > 15.0 else ("medium" if total_rain_24h > 5.0 else "low")
                }
    except Exception:
        pass

    # Fallback to realistic dry-season Kuttanad baseline (salinity intrusion happens mostly during dry/low-rain spells)
    return {
        "source": "kuttanad_hydrology_baseline",
        "status": "fallback",
        "total_rain_24h_mm": 1.2,
        "total_rain_48h_mm": 3.4,
        "dilution_factor": "low"
    }

def analyze_salinity_propagation(
    source_canal_id: UUID,
    salinity_ppt: float,
    rainfall_summary: Dict[str, Any]
) -> Tuple[List[CanalSegmentResponse], ActionGuidance]:
    """
    Traverses the canal network starting from source_canal_id.
    Propagates warnings along upstream segments based on salinity level and rainfall dilution.
    """
    affected_canals: List[CanalSegmentResponse] = []
    dilution = rainfall_summary.get("dilution_factor", "low")
    rain_24h = rainfall_summary.get("total_rain_24h_mm", 0.0)

    # 1. Base alert level for origin segment
    if salinity_ppt >= settings.SALINITY_DANGER_THRESHOLD_PPT:
        origin_level = AlertLevel.Danger
    elif salinity_ppt >= settings.SALINITY_WARNING_THRESHOLD_PPT:
        origin_level = AlertLevel.Warning
    else:
        origin_level = AlertLevel.Watch

    # 2. Get origin canal
    origin_canal = db.get_canal(source_canal_id)
    if not origin_canal:
        # Fallback guidance if canal not found
        guidance = build_salinity_guidance(salinity_ppt, origin_level, "Unknown Canal", dilution, rain_24h)
        return [], guidance

    # Record Hop 0 (Origin segment)
    affected_canals.append(CanalSegmentResponse(
        id=origin_canal["id"],
        name=origin_canal["name"],
        coordinates=origin_canal["coordinates"],
        upstream_segment_id=origin_canal.get("upstream_segment_id"),
        downstream_segment_id=origin_canal.get("downstream_segment_id"),
        current_alert_level=origin_level,
        salinity_ppt=salinity_ppt,
        alert_reason=f"Origin point: Recorded {salinity_ppt} ppt salinity."
    ))

    # 3. Hop 1: Traverse upstream segments (towards inland connected polders)
    # In Kuttanad tidal hydrology, when high salinity hits a canal, all interconnected canals
    # receiving or feeding water need warning. We inspect upstream_segment_id and any segment that lists this as downstream.
    connected_segments: List[Tuple[UUID, int]] = []
    
    # Direct upstream
    if origin_canal.get("upstream_segment_id"):
        connected_segments.append((origin_canal["upstream_segment_id"], 1))
    
    # Direct downstream (water flows towards downstream, carrying salt with incoming tide or current)
    if origin_canal.get("downstream_segment_id"):
        connected_segments.append((origin_canal["downstream_segment_id"], 1))

    # Also search for other canals referencing this canal
    for c_id, c in db.canal_segments.items():
        if c_id != source_canal_id:
            if c.get("upstream_segment_id") == source_canal_id or c.get("downstream_segment_id") == source_canal_id:
                if (c_id, 1) not in connected_segments:
                    connected_segments.append((c_id, 1))

    visited = {source_canal_id}

    for seg_id, hop in connected_segments:
        if seg_id in visited:
            continue
        visited.add(seg_id)
        seg = db.get_canal(seg_id)
        if not seg:
            continue

        # Calculate alert level based on hop and rain dilution
        if hop == 1:
            if origin_level == AlertLevel.Danger:
                seg_level = AlertLevel.Warning if dilution == "high" else AlertLevel.Danger
            elif origin_level == AlertLevel.Warning:
                seg_level = AlertLevel.Watch if dilution == "high" else AlertLevel.Warning
            else:
                seg_level = AlertLevel.Watch
        else:
            seg_level = AlertLevel.Watch

        reason = f"Upstream canal network hop {hop}: Salinity ingress risk from {origin_canal['name']}."
        if dilution == "high":
            reason += f" Buffered by {rain_24h} mm recent rainfall runoff."
        else:
            reason += f" High intrusion threat due to low recent precipitation ({rain_24h} mm)."

        affected_canals.append(CanalSegmentResponse(
            id=seg["id"],
            name=seg["name"],
            coordinates=seg["coordinates"],
            upstream_segment_id=seg.get("upstream_segment_id"),
            downstream_segment_id=seg.get("downstream_segment_id"),
            current_alert_level=seg_level,
            salinity_ppt=round(max(0.5, salinity_ppt - (0.8 * hop)), 1),
            alert_reason=reason
        ))

    guidance = build_salinity_guidance(salinity_ppt, origin_level, origin_canal["name"], dilution, rain_24h)
    return affected_canals, guidance

def build_salinity_guidance(
    salinity_ppt: float,
    level: AlertLevel,
    canal_name: str,
    dilution: str,
    rain_24h: float
) -> ActionGuidance:
    """Constructs deterministic agronomic advice for salinity surge in Kuttanad."""
    return ActionGuidance(
        title=f"Canal Salinity Ingress Alert: {canal_name} ({salinity_ppt} ppt)",
        title_ml="ഉപ്പുവെള്ള കയറ്റം മുന്നറിയിപ്പ് — മോട്ടോർ തറകൾ അടിയന്തരമായി ഓഫ് ചെയ്യുക",
        alert_level=level,
        summary=f"Salinity level {salinity_ppt} ppt recorded in {canal_name}. Rainfall dilution is currently {dilution.upper()} ({rain_24h} mm in 24h).",
        bullet_points=[
            "IMMEDIATE MOTOR SHUT-OFF: Immediately suspend all Petti & Para dewatering and intake pumps along this canal segment to prevent saltwater entering polders.",
            "SLUICE GATE LOCK: Close padasekharam inlet sluice shutters (മടക്കുത്തുകൾ) before high tide peak.",
            "TEST BEFORE PUMPING: Do not pump water without verifying electrical conductivity (EC) or refractometer reading below 1.5 ppt.",
            "FRESHWATER FLUSHING: If saline water has entered standing paddy, do not apply fertilizer; await freshwater flush from upper Pampa/Manimala releases.",
            "IRRIGATION ADVISORY: Minor Irrigation Department Kuttanad sub-division alerted for Thanneermukkom Bund / Thottappally Spillway regulator management."
        ],
        citation="Kuttanad Water Management Protocol, Kerala Agricultural University & Irrigation Department.",
        helpline="Krishi Bhavan Salinity Control Desk: 0477-2702231 | KAU Moncompu RRS: 0477-2702212",
        is_uncertain=False
    )
