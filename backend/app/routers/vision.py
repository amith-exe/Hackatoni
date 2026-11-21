"""Gemini Vision leaf diagnosis with deterministic offline demo samples."""
import base64
import json
from typing import Optional, Any
from fastapi import APIRouter, HTTPException, Request
from backend.app.config import settings
from backend.app.models.schemas import LeafDiagnosisSchema
from backend.app.services.db import db, haversine_distance_km
from backend.app.services.remedies import KAU_REMEDIES_REGISTRY

router = APIRouter(prefix="/vision", tags=["AI Leaf Scanner"])
DEMO_SAMPLES = {
    "sample_1": ("brown_planthopper", 0.89, ["Hopperburn browning at the base of tillers", "Yellowing lower leaves in small patches", "Dense crop canopy around affected plants"], "Clear close-up leaf focus"),
    "sample_2": ("rice_blast", 0.91, ["Spindle-shaped grey lesions on the leaf blade", "Brown margins around the central lesion", "Sharp contrast against healthy green tissue"], "Clear close-up leaf focus"),
    "sample_3": ("unknown", 0.42, ["Leaf edges are difficult to distinguish", "Low light obscures lesion shape"], "Blurry / poor lighting"),
}

def _demo(sample_id: Optional[str], image_bytes: Optional[bytes]) -> LeafDiagnosisSchema:
    aliases = {"sample1": "sample_1", "hopperburn": "sample_1", "brown_planthopper": "sample_1", "sample2": "sample_2", "blast": "sample_2", "rice_blast": "sample_2", "sample3": "sample_3", "blurry": "sample_3", "uncertain": "sample_3"}
    sample_id = aliases.get((sample_id or "").lower(), sample_id)
    if sample_id in DEMO_SAMPLES:
        code, confidence, observations, quality = DEMO_SAMPLES[sample_id]
        return LeafDiagnosisSchema(disease_code=code, confidence=confidence, visual_observations=observations, image_quality_note=quality)
    return LeafDiagnosisSchema(disease_code="unknown", confidence=0.35, visual_observations=["No usable image was supplied", "A close-up leaf image is required"], image_quality_note="Missing image")

async def _gemini_diagnose(image_bytes: bytes, mime_type: str) -> LeafDiagnosisSchema:
    try:
        from google import genai
        from google.genai import types
        client = genai.Client(api_key=settings.GEMINI_API_KEY)
        prompt = """Identify the most likely Kuttanad rice leaf disease or pest from this image. Return only structured JSON. Use one of: brown_planthopper, sheath_blight, bacterial_leaf_blight, rice_blast, sheath_rot, brown_leaf_spot, rice_tungro, unknown. Do not provide treatment, chemical names, or dosages. Confidence must reflect image quality."""
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=[types.Part.from_bytes(data=image_bytes, mime_type=mime_type), prompt],
            config=types.GenerateContentConfig(response_mime_type="application/json", response_json_schema=LeafDiagnosisSchema.model_json_schema()),
        )
        parsed = getattr(response, "parsed", None)
        if parsed is not None:
            return LeafDiagnosisSchema.model_validate(parsed)
        return LeafDiagnosisSchema.model_validate(json.loads(response.text))
    except Exception as exc:
        raise RuntimeError(f"Gemini diagnosis failed: {exc}") from exc

def _nearby_context(lat: Optional[float], lng: Optional[float]) -> dict[str, Any]:
    if lat is None or lng is None:
        return {"nearby_reports_count": None, "nearest_canal_name": None}
    nearby = [r for r in db.reports.values() if haversine_distance_km(lat, lng, r["latitude"], r["longitude"]) <= 3 and r["verification_status"].value != "rejected"]
    _, canal_name, _ = db.snap_to_nearest_canal(lat, lng)
    return {"nearby_reports_count": len(nearby), "nearest_canal_name": canal_name}

@router.post("/diagnose")
async def diagnose_leaf(request: Request):
    content_type = request.headers.get("content-type", "")
    sample_id: Optional[str] = None; lat: Optional[float] = None; lng: Optional[float] = None; image_bytes: Optional[bytes] = None; mime_type = "image/jpeg"
    if "application/json" in content_type:
        payload = await request.json(); sample_id = payload.get("sample_id"); lat = payload.get("lat"); lng = payload.get("lng")
        encoded = payload.get("image_base64")
        if encoded:
            image_bytes = base64.b64decode(encoded.split(",")[-1])
    else:
        form = await request.form(); sample_id = form.get("sample_id") or None; lat = float(form["lat"]) if form.get("lat") else None; lng = float(form["lng"]) if form.get("lng") else None
        upload = form.get("file")
        if upload and hasattr(upload, "read"):
            image_bytes = await upload.read(); mime_type = getattr(upload, "content_type", None) or mime_type
    if sample_id or not settings.GEMINI_API_KEY:
        diagnosis = _demo(sample_id, image_bytes)
    elif image_bytes:
        try:
            diagnosis = await _gemini_diagnose(image_bytes, mime_type)
        except RuntimeError as exc:
            raise HTTPException(status_code=502, detail=str(exc))
    else:
        diagnosis = _demo(None, None)
    uncertain = diagnosis.confidence < 0.70 or diagnosis.disease_code == "unknown"
    remedy = None if uncertain else KAU_REMEDIES_REGISTRY.get(diagnosis.disease_code)
    return {"status": "uncertain" if uncertain else "diagnosed", "message": "Not sure — ask your Krishi Bhavan" if uncertain else "Diagnosis linked to the curated KAU action plan", "diagnosis": diagnosis.model_dump(), "remedy": None if remedy is None else {"disease_code": remedy["disease_code"], "disease_name_en": remedy["disease_name_en"], "disease_name_ml": remedy["disease_name_ml"], "immediate_actions": remedy["immediate_actions"], "spray_guidance": remedy["spray_guidance"], "source_citation": remedy["source_citation"]}, **_nearby_context(lat, lng)}
