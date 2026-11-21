# backend/app/services/classifier_stub.py
"""
Modular Crop Disease Image Classifier Stub.
Ready for PyTorch MobileNetV3 / ResNet50 fine-tuned on Kuttanad rice diseases.
Provides deterministic confidence heuristics based on image indicators or mock tags,
and strictly enforces < 0.70 fallback to prevent erroneous chemical/cultural interventions.
"""

from typing import Tuple, Dict, Any, Optional

# Supported disease classes mapped to KAU database codes
VALID_DISEASE_CODES = {
    "brown_planthopper",
    "sheath_blight",
    "bacterial_leaf_blight",
    "rice_blast", "sheath_rot", "brown_leaf_spot", "rice_tungro",
    "rice_stem_borer", "rice_leaf_folder", "rice_gall_midge", "rice_hispa",
    "false_smut", "grain_discoloration"
}

def classify_crop_image(photo_url: Optional[str], hints: Optional[Dict[str, Any]] = None) -> Tuple[str, float, Dict[str, Any]]:
    """
    Classifies a paddy leaf/tiller image.
    
    Returns:
        (disease_code, confidence, metadata)
    
    If confidence < 0.70, upstream callers MUST present the fallback:
    "Not sure — ask your Krishi Bhavan"
    """
    if not photo_url:
        # If no photo provided, check if disease_code was specified in report details
        if hints and "disease_code" in hints and hints["disease_code"] in VALID_DISEASE_CODES:
            conf = float(hints.get("confidence", 0.85))
            return hints["disease_code"], conf, {"source": "manual_farmer_selection"}
        return "unknown", 0.0, {"source": "no_photo_provided"}

    url_lower = photo_url.lower()
    
    # Check for direct disease hints in image URL / metadata (useful for testing & demo seeds)
    if "planthopper" in url_lower or "bph" in url_lower or "chazhi" in url_lower:
        return "brown_planthopper", 0.93, {"model": "kuttanad_rice_v1_stub", "top_class": "brown_planthopper"}
    elif "sheath" in url_lower or "blight" in url_lower and "bacterial" not in url_lower:
        return "sheath_blight", 0.88, {"model": "kuttanad_rice_v1_stub", "top_class": "sheath_blight"}
    elif "bacterial" in url_lower or "blb" in url_lower:
        return "bacterial_leaf_blight", 0.86, {"model": "kuttanad_rice_v1_stub", "top_class": "bacterial_leaf_blight"}
    elif "blast" in url_lower:
        return "rice_blast", 0.89, {"model": "kuttanad_rice_v1_stub", "top_class": "rice_blast"}
    elif "sheath_rot" in url_lower or "sheathrot" in url_lower:
        return "sheath_rot", 0.86, {"model": "kuttanad_rice_v1_stub", "top_class": "sheath_rot"}
    elif "brown_leaf" in url_lower or "leafspot" in url_lower:
        return "brown_leaf_spot", 0.84, {"model": "kuttanad_rice_v1_stub", "top_class": "brown_leaf_spot"}
    elif "tungro" in url_lower:
        return "rice_tungro", 0.83, {"model": "kuttanad_rice_v1_stub", "top_class": "rice_tungro"}
    elif "stem_borer" in url_lower or "stemborer" in url_lower:
        return "rice_stem_borer", 0.82, {"model": "kuttanad_rice_v1_stub", "top_class": "rice_stem_borer"}
    elif "leaf_folder" in url_lower or "leaffolder" in url_lower:
        return "rice_leaf_folder", 0.82, {"model": "kuttanad_rice_v1_stub", "top_class": "rice_leaf_folder"}
    elif "gall_midge" in url_lower or "gallmidge" in url_lower:
        return "rice_gall_midge", 0.81, {"model": "kuttanad_rice_v1_stub", "top_class": "rice_gall_midge"}
    elif "hispa" in url_lower:
        return "rice_hispa", 0.81, {"model": "kuttanad_rice_v1_stub", "top_class": "rice_hispa"}
    elif "false_smut" in url_lower or "falsesmut" in url_lower:
        return "false_smut", 0.80, {"model": "kuttanad_rice_v1_stub", "top_class": "false_smut"}
    elif "grain_discoloration" in url_lower or "graindiscoloration" in url_lower:
        return "grain_discoloration", 0.80, {"model": "kuttanad_rice_v1_stub", "top_class": "grain_discoloration"}
    elif "uncertain" in url_lower or "blur" in url_lower or "low_conf" in url_lower:
        # Deliberate low-confidence test case
        return "brown_planthopper", 0.52, {"model": "kuttanad_rice_v1_stub", "note": "low_confidence_below_threshold"}
    
    # If explicit details passed by farmer
    if hints and "disease_code" in hints and hints["disease_code"] in VALID_DISEASE_CODES:
        conf = float(hints.get("confidence", 0.85))
        return hints["disease_code"], conf, {"source": "details_with_photo"}

    # Default fallback for unrecognized paddy images: low confidence to trigger Krishi Bhavan advice
    return "unidentified_leaf_spot", 0.55, {"model": "kuttanad_rice_v1_stub", "note": "unrecognized_symptoms"}
