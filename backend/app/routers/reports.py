# backend/app/routers/reports.py
"""
Core Reporting and Verification Endpoints.
Handles state machine transitions, community peer confirmations, officer verification,
and triggers real-time clustering / canal salinity routing.
"""

from uuid import UUID
from fastapi import APIRouter, HTTPException, status
from typing import List, Optional

from backend.app.models.schemas import (
    ReportCreate, ReportResponse, ConfirmationCreate, VerificationCreate,
    ReportType, VerificationStatus, ActionGuidance
)
from backend.app.services.db import db
from backend.app.services.classifier_stub import classify_crop_image
from backend.app.services.remedies import build_disease_guidance
from backend.app.services.canal_routing import fetch_kuttanad_rainfall, analyze_salinity_propagation
from backend.app.services.safety_guidance import (
    build_bird_deaths_guidance, build_bund_seepage_guidance, build_crop_loss_guidance
)
from backend.app.services.clustering import run_dbscan_clustering

router = APIRouter(prefix="/reports", tags=["Reports"])

@router.post("", response_model=ReportResponse, status_code=status.HTTP_201_CREATED)
async def create_report(report_in: ReportCreate):
    """
    Submit a crowdsourced agricultural/hydrological incident report.
    Strips reporter_id to guarantee privacy in the returned response.
    """
    # 1. Verify reporter profile exists
    profile = db.get_profile(report_in.reporter_id)
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Reporter profile {report_in.reporter_id} not found."
        )

    # 2. Persist report record (snapping to nearest canal if canal_segment_id omitted)
    record = db.create_report(report_in)
    
    # 3. Branching Intelligence Logic
    guidance: Optional[ActionGuidance] = None

    if report_in.report_type == ReportType.crop_disease:
        # Branch A: Crop Disease
        disease_code, confidence, meta = classify_crop_image(record.get("photo_url"), record.get("details"))
        record["details"]["disease_code"] = disease_code
        record["details"]["confidence"] = confidence
        record["details"]["classification_meta"] = meta
        
        # Get vetted KAU guidance with < 0.70 fallback
        guidance = build_disease_guidance(disease_code, confidence)

        # Trigger DBSCAN clustering for this disease code over past 7 days
        recent_disease_reports = db.get_recent_reports_raw(ReportType.crop_disease, days=7)
        clusters = run_dbscan_clustering(recent_disease_reports, report_type="crop_disease", sub_category=disease_code)
        if clusters:
            record["details"]["active_cluster_detected"] = True
            record["details"]["cluster_alert_level"] = clusters[0].alert_level

    elif report_in.report_type == ReportType.salinity:
        # Branch B: Salinity Intrusion
        salinity_ppt = float(record.get("details", {}).get("salinity_ppt", 1.5))
        rainfall_summary = await fetch_kuttanad_rainfall()
        
        # Canal network upstream traversal
        affected_canals, guidance = analyze_salinity_propagation(
            source_canal_id=record["canal_segment_id"],
            salinity_ppt=salinity_ppt,
            rainfall_summary=rainfall_summary
        )
        record["details"]["affected_canals_count"] = len(affected_canals)
        record["details"]["rainfall_dilution"] = rainfall_summary.get("dilution_factor")

    elif report_in.report_type == ReportType.bird_deaths:
        # Branch C1: Bird Deaths
        guidance = build_bird_deaths_guidance(record.get("details", {}))
        recent_bird_reports = db.get_recent_reports_raw(ReportType.bird_deaths, days=7)
        clusters = run_dbscan_clustering(recent_bird_reports, report_type="bird_deaths")
        if clusters:
            record["details"]["active_mortality_cluster"] = True

    elif report_in.report_type == ReportType.bund_seepage:
        # Branch C2: Bund Seepage
        guidance = build_bund_seepage_guidance(record.get("details", {}))

    elif report_in.report_type == ReportType.crop_loss:
        # Branch C3: Crop Loss
        guidance = build_crop_loss_guidance(record.get("details", {}))

    # 4. Form public anonymized response (reporter_id stripped)
    response = db.to_public_response(record)
    response.action_guidance = guidance
    return response

@router.get("", response_model=List[ReportResponse])
async def list_reports(
    report_type: Optional[ReportType] = None,
    status_filter: Optional[VerificationStatus] = None
):
    """
    List anonymized public reports.
    """
    return db.list_reports(report_type=report_type, status=status_filter)

@router.get("/{report_id}", response_model=ReportResponse)
async def get_report(report_id: UUID):
    """
    Get a single report by ID (anonymized).
    """
    record = db.get_report(report_id)
    if not record:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Report not found")
    
    resp = db.to_public_response(record)
    
    # Attach guidance
    if resp.report_type == ReportType.crop_disease:
        code = resp.details.get("disease_code", "brown_planthopper")
        conf = float(resp.details.get("confidence", 0.85))
        resp.action_guidance = build_disease_guidance(code, conf)
    elif resp.report_type == ReportType.salinity:
        ppt = float(resp.details.get("salinity_ppt", 1.5))
        rain = await fetch_kuttanad_rainfall()
        _, guidance = analyze_salinity_propagation(resp.canal_segment_id, ppt, rain)
        resp.action_guidance = guidance
    elif resp.report_type == ReportType.bird_deaths:
        resp.action_guidance = build_bird_deaths_guidance(resp.details)
    elif resp.report_type == ReportType.bund_seepage:
        resp.action_guidance = build_bund_seepage_guidance(resp.details)
    elif resp.report_type == ReportType.crop_loss:
        resp.action_guidance = build_crop_loss_guidance(resp.details)
        
    return resp

@router.post("/{report_id}/confirm", response_model=ReportResponse)
async def confirm_report(report_id: UUID, confirm_in: ConfirmationCreate):
    """
    Neighbor farmer confirmation.
    - Rejects if confirmer is the reporter.
    - Rejects duplicate confirmation.
    - If confirmations >= 2, promotes status to community_confirmed.
    """
    success, message, updated_report = db.add_confirmation(report_id, confirm_in.confirmer_id)
    if not success:
        if "cannot confirm their own" in message:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=message)
        elif "already confirmed" in message:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=message)
        else:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=message)

    return db.to_public_response(updated_report)

@router.post("/{report_id}/verify", response_model=ReportResponse)
async def verify_report(report_id: UUID, verify_in: VerificationCreate):
    """
    Officer action to set officially_verified or rejected.
    Restricted to role == 'officer'.
    """
    success, message, updated_report = db.officer_verify(
        report_id=report_id,
        officer_id=verify_in.officer_id,
        status=verify_in.status,
        notes=verify_in.notes
    )
    if not success:
        if "Unauthorized" in message:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=message)
        elif "not found" in message:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=message)
        else:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=message)

    return db.to_public_response(updated_report)
