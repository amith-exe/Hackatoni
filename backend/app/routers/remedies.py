# backend/app/routers/remedies.py
"""
Curated KAU Remedies Lookup Router.
"""

from typing import List
from fastapi import APIRouter, HTTPException, status
from backend.app.models.schemas import RemediesKAUResponse
from backend.app.services.remedies import get_kau_remedy, KAU_REMEDIES_REGISTRY

router = APIRouter(prefix="/remedies", tags=["KAU Remedies"])

@router.get("", response_model=List[RemediesKAUResponse])
async def list_all_remedies():
    """List all curated KAU PoP remedies."""
    return [RemediesKAUResponse(**v) for v in KAU_REMEDIES_REGISTRY.values()]

@router.get("/{disease_code}", response_model=RemediesKAUResponse)
async def get_remedy(disease_code: str):
    """Retrieve verified KAU remedy for a specific disease code."""
    remedy = get_kau_remedy(disease_code)
    if not remedy:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Remedy for disease '{disease_code}' not found in curated KAU database."
        )
    return remedy
