# backend/app/routers/alerts.py
"""
Karshakan Lens - Alerts Inbox and Local Trends Router.
Provides notification feeds, local 3km trend analysis, and instant demo login.
"""

from typing import List, Optional
from fastapi import APIRouter, Query, HTTPException
from pydantic import BaseModel

from backend.app.models.schemas import AlertItem, LocalTrendResponse, DemoLoginRequest, DemoLoginResponse
from backend.app.services.db import db

router = APIRouter(tags=["Alerts & Trends"])

class MarkReadRequest(BaseModel):
    alert_id: Optional[str] = None

@router.get("/alerts", response_model=List[AlertItem])
async def get_alerts(unread_only: bool = False, category: Optional[str] = None):
    """
    Returns alerts across salinity, clusters, and verification updates.
    """
    alerts = db.get_alerts(unread_only=unread_only)
    if category and category != "all":
        if category == "salinity_clusters":
            alerts = [a for a in alerts if a.category in ("salinity", "cluster")]
        elif category == "verification":
            alerts = [a for a in alerts if a.category == "verification"]
        else:
            alerts = [a for a in alerts if a.category == category]
    return alerts

@router.post("/alerts/mark-read")
async def mark_alerts_read(payload: MarkReadRequest):
    """
    Marks an alert or all alerts as read.
    """
    db.mark_alert_read(payload.alert_id)
    return {"status": "success", "marked_alert_id": payload.alert_id or "all"}

@router.get("/trends/local", response_model=LocalTrendResponse)
async def get_local_trend(
    lat: float = Query(9.4460, description="Latitude of farm or current GPS location"),
    lng: float = Query(76.4580, description="Longitude of farm or current GPS location"),
    radius_km: float = Query(3.0, description="Radius in km for local aggregation")
):
    """
    Computes nearby reports within radius, nearest canal salinity, 7-day trend, and guidance.
    """
    return db.get_local_trend(lat=lat, lng=lng, radius_km=radius_km)

@router.post("/auth/demo-login", response_model=DemoLoginResponse)
async def demo_login(req: DemoLoginRequest):
    """
    Instant demo farmer sign-in with name, phone, and padasekharam (bypasses SMS OTP).
    """
    if not req.name or not req.phone:
        raise HTTPException(status_code=400, detail="Name and phone are required for demo registration")
    
    profile = db.create_demo_farmer(name=req.name, phone=req.phone, padasekharam=req.padasekharam, role=req.role)
    return DemoLoginResponse(
        token=f"demo-token-{profile['id']}",
        profile={
            "id": str(profile["id"]),
            "name": profile["name"],
            "phone": profile["phone"],
            "role": profile["role"],
            "village_or_padasekharam": profile["village_or_padasekharam"],
            "farm_type": profile["farm_type"],
            "latitude": profile["latitude"],
            "longitude": profile["longitude"]
        },
        message="Demo farmer session initialized successfully"
    )
