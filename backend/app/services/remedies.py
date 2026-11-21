# backend/app/services/remedies.py
"""
Kerala Agricultural University (KAU) Curated Remedies Service.
Adheres strictly to vetted university Package of Practices (PoP) recommendations.
Never generates chemical dosages with an LLM.
"""

from typing import Dict, Any, Optional
from datetime import date
from backend.app.models.schemas import RemediesKAUResponse, ActionGuidance, AlertLevel

# Curated in-memory KAU remedies database (matching /supabase/002_seed_kuttanad.sql)
KAU_REMEDIES_REGISTRY: Dict[str, Dict[str, Any]] = {
    "brown_planthopper": {
        "disease_code": "brown_planthopper",
        "disease_name_en": "Brown Plant Hopper (BPH)",
        "disease_name_ml": "തവിട്ടു ചാഴി (ചാഴി ശല്യം)",
        "immediate_actions": [
            "Drain standing water from the field for 3 to 4 days (Alternate Wetting and Drying) to break the microclimate and disrupt hopper reproduction.",
            "Form 30 cm alleyways (walking paths) every 2 meters throughout thick crop canopy to admit sunlight and ventilation at plant base.",
            "Immediately stop top-dressing with nitrogenous fertilizers (Urea), which accelerates nymph multiplication.",
            "Do NOT apply synthetic pyrethroid insecticides; they destroy natural predators like mirid bugs and spiders, triggering catastrophic hopper resurgence."
        ],
        "spray_guidance": "KAU PoP Guideline: At initial hopper detection, spray 5% Neem Kernel Suspension (NSKE) or Azadirachtin 0.03% (3 ml/L). If infestation exceeds Economic Threshold Level (1 hopper/tiller at tillering stage, 2 hoppers/tiller at flowering), apply bio-control fungus Beauveria bassiana (20 g/L) directed at the plant base in evening hours. For chemical intervention, contact your local Krishi Bhavan for university-sanctioned insect growth regulators (Buprofezin 25 SC @ 1.6 ml/L or Pymetrozine 50 WG @ 0.6 g/L).",
        "source_citation": "Kerala Agricultural University (KAU) Package of Practices Recommendations: Crops (15th Edition), Rice Entomology Section, Rice Research Station (RRS) Moncompu.",
        "last_checked": date(2026, 10, 15)
    },
    "sheath_blight": {
        "disease_code": "sheath_blight",
        "disease_name_en": "Sheath Blight",
        "disease_name_ml": "പോളരോഗം",
        "immediate_actions": [
            "Drain excess water and lower field water depth to prevent sclerotia floating and contacting upper leaf sheaths.",
            "Remove and destroy weed hosts on surrounding bunds (Echinochloa, Cyperus species) which harbor the fungus.",
            "Apply remaining recommended potash in 2 split applications to strengthen culm resistance against fungal penetration.",
            "Avoid excessive plant density; ensure proper aeration between rows."
        ],
        "spray_guidance": "KAU PoP Guideline: Prophylactic foliar spray of Pseudomonas fluorescens (20 g/L) at 30 and 45 days after planting. On first symptom appearance of snake-skin lesions on sheath, spray biological formulation of Trichoderma harzianum (20 g/L) or university-recommended validamycin 3L (2 ml/L) or trifloxystrobin + tebuconazole 75 WG (0.4 g/L). Direct spray towards the base of the rice plant.",
        "source_citation": "KAU Package of Practices Recommendations: Crops, Rice Pathology Division & All India Coordinated Rice Improvement Project (AICRIP) Moncompu.",
        "last_checked": date(2026, 10, 15)
    },
    "bacterial_leaf_blight": {
        "disease_code": "bacterial_leaf_blight",
        "disease_name_en": "Bacterial Leaf Blight (BLB)",
        "disease_name_ml": "ബാക്ടീരിയൽ ഇലകരിച്ചിൽ",
        "immediate_actions": [
            "Drain field immediately and keep moist without stagnant standing water.",
            "Strictly prevent overflow of irrigation or drainage water from affected polders into neighboring polders.",
            "Temporarily suspend application of all nitrogenous fertilizers until disease progression halts.",
            "Spray fresh cow dung supernatant (20 g cow dung stirred in 1 litre water, filtered through fine muslin cloth) on the foliage."
        ],
        "spray_guidance": "KAU PoP Guideline: Foliar spray of fresh cow dung slurry supernatant (2%) or Pseudomonas fluorescens (20 g/L) at 10-day intervals. Avoid mechanical injury to crop leaves during intercultural operations. Plant resistant varieties recommended for Kuttanad (such as Uma/MO-16, Jyothi) in subsequent seasons.",
        "source_citation": "KAU Extension Advisory Bulletin No. 44/2025, Regional Agricultural Research Station (RARS) Kumarakom.",
        "last_checked": date(2026, 9, 20)
    },
    "rice_blast": {
        "disease_code": "rice_blast",
        "disease_name_en": "Rice Blast (Leaf / Neck Blast)",
        "disease_name_ml": "കുലവാട്ടം / ഇലപ്പുള്ളി രോഗം",
        "immediate_actions": [
            "Avoid applying nitrogen in single heavy doses; split into 3-4 fractional applications based on leaf color chart (LCC).",
            "Avoid movement in fields early morning while leaves are covered with dew drops to prevent spore transmission on clothing and implements.",
            "Maintain adequate soil moisture without water stress during the tillering and panicle emergence stages."
        ],
        "spray_guidance": "KAU PoP Guideline: Seed treatment with Pseudomonas fluorescens (10 g/kg seed) followed by seedling root dip (2.5 kg/ha). Foliar spray of Pseudomonas fluorescens (20 g/L) on initial leaf spotting. For neck blast protection at panicle emergence, consult Krishi Bhavan for university-evaluated bio-fungicides or isoprothiolane 40 EC (1.5 ml/L).",
        "source_citation": "KAU Rice Research Station Moncompu, Crop Health Advisory 2026.",
        "last_checked": date(2026, 10, 1)
    },
    "sheath_rot": {
        "disease_code": "sheath_rot", "disease_name_en": "Sheath Rot", "disease_name_ml": "ഷീത്ത് ചെംചീയൽ",
        "immediate_actions": ["Remove badly affected tillers and weeds.", "Avoid excess nitrogen and dense canopy.", "Improve drainage and field aeration."],
        "spray_guidance": "KAU Package of Practices: use approved biological disease management and consult Moncompu Rice Research Station before any chemical intervention.",
        "source_citation": "KAU Package of Practices / Moncompu Rice Research Station", "last_checked": date(2026, 10, 1)
    },
    "brown_leaf_spot": {
        "disease_code": "brown_leaf_spot", "disease_name_en": "Brown Leaf Spot", "disease_name_ml": "തവിട്ടിലപ്പുള്ളി",
        "immediate_actions": ["Use clean seed and remove infected residues.", "Maintain balanced potash and avoid drought stress.", "Improve field sanitation and ventilation."],
        "spray_guidance": "KAU Package of Practices: use a verified seed treatment or biological option; contact Krishi Bhavan for a current approved spray recommendation.",
        "source_citation": "KAU Package of Practices / Moncompu Rice Research Station", "last_checked": date(2026, 10, 1)
    },
    "rice_tungro": {
        "disease_code": "rice_tungro", "disease_name_en": "Rice Tungro / Hopper-Vector Yellowing", "disease_name_ml": "നെല്ലിലെ തുംഗ്രോ",
        "immediate_actions": ["Rogue severely affected plants and remove them from the field.", "Control volunteer rice and grassy weeds.", "Avoid staggered planting and coordinate planting dates locally."],
        "spray_guidance": "KAU Package of Practices: use resistant varieties and integrated vector management; consult Krishi Bhavan before selecting any insecticide.",
        "source_citation": "KAU Package of Practices / Moncompu Rice Research Station", "last_checked": date(2026, 10, 1)
    },
    "rice_stem_borer": {
        "disease_code": "rice_stem_borer", "disease_name_en": "Rice Stem Borer", "disease_name_ml": "നെല്ലിലെ തണ്ട് തുരപ്പൻ",
        "immediate_actions": ["Remove dead hearts and destroy infested tillers.", "Use light traps and conserve parasitoids.", "Avoid excess nitrogen that produces lush susceptible growth."],
        "spray_guidance": "KAU Package of Practices: use integrated pest management and contact Krishi Bhavan for the current approved treatment.", "source_citation": "KAU Package of Practices / Moncompu Rice Research Station", "last_checked": date(2026, 10, 1)
    },
    "rice_leaf_folder": {
        "disease_code": "rice_leaf_folder", "disease_name_en": "Rice Leaf Folder", "disease_name_ml": "നെല്ലിലെ ഇലചുരുട്ടിപ്പുഴു",
        "immediate_actions": ["Open folded leaves and remove larvae where practical.", "Avoid unnecessary broad-spectrum sprays.", "Maintain field scouting along bunds and crop edges."],
        "spray_guidance": "KAU Package of Practices: conserve natural enemies and consult Krishi Bhavan before any approved intervention.", "source_citation": "KAU Package of Practices / Moncompu Rice Research Station", "last_checked": date(2026, 10, 1)
    },
    "rice_gall_midge": {
        "disease_code": "rice_gall_midge", "disease_name_en": "Rice Gall Midge", "disease_name_ml": "നെല്ലിലെ കതിര്‍ ഈച്ച",
        "immediate_actions": ["Remove silver shoots and volunteer rice.", "Synchronize planting with nearby fields.", "Use locally recommended resistant varieties."],
        "spray_guidance": "KAU Package of Practices: use resistant varieties and integrated vector management; confirm treatment with Krishi Bhavan.", "source_citation": "KAU Package of Practices / Moncompu Rice Research Station", "last_checked": date(2026, 10, 1)
    },
    "rice_hispa": {
        "disease_code": "rice_hispa", "disease_name_en": "Rice Hispa", "disease_name_ml": "നെല്ലിലെ ഹിസ്പ",
        "immediate_actions": ["Collect and destroy heavily damaged leaves.", "Avoid excess nitrogen and dense canopy.", "Monitor nursery beds and field margins twice weekly."],
        "spray_guidance": "KAU Package of Practices: start with field sanitation and natural-enemy conservation; seek a current approved recommendation from Krishi Bhavan.", "source_citation": "KAU Package of Practices / Moncompu Rice Research Station", "last_checked": date(2026, 10, 1)
    },
    "false_smut": {
        "disease_code": "false_smut", "disease_name_en": "False Smut", "disease_name_ml": "കതിരിലെ കള്ളക്കരി",
        "immediate_actions": ["Remove smut balls before they release spores.", "Avoid excessive nitrogen at booting.", "Keep seed and field sanitation strong."],
        "spray_guidance": "KAU Package of Practices: use clean seed and a verified integrated disease-management programme; consult Moncompu RRS.", "source_citation": "KAU Package of Practices / Moncompu Rice Research Station", "last_checked": date(2026, 10, 1)
    },
    "grain_discoloration": {
        "disease_code": "grain_discoloration", "disease_name_en": "Grain Discoloration", "disease_name_ml": "നെല്ലുമണിയുടെ നിറവ്യത്യാസം",
        "immediate_actions": ["Harvest at proper maturity and dry grain quickly.", "Use clean seed and remove infected residues.", "Improve ventilation and avoid prolonged wet panicles."],
        "spray_guidance": "KAU Package of Practices: use clean seed and post-harvest hygiene; request a current approved recommendation if disease pressure rises.", "source_citation": "KAU Package of Practices / Moncompu Rice Research Station", "last_checked": date(2026, 10, 1)
    }
}

def get_kau_remedy(disease_code: str) -> Optional[RemediesKAUResponse]:
    """Fetch exact KAU remedy by disease code."""
    data = KAU_REMEDIES_REGISTRY.get(disease_code.lower())
    if not data:
        return None
    return RemediesKAUResponse(**data)

def build_disease_guidance(disease_code: str, confidence: float) -> ActionGuidance:
    """
    Constructs actionable guidance based on image classifier result.
    If confidence < 0.70, returns deterministic fallback:
    'Not sure — ask your Krishi Bhavan'.
    """
    if confidence < 0.70 or disease_code not in KAU_REMEDIES_REGISTRY:
        return ActionGuidance(
            title="Not sure — ask your Krishi Bhavan (രോഗനിർണയം വ്യക്തമല്ല)",
            title_ml="രോഗനിർണയം വ്യക്തമല്ല — കൃഷിഭവനുമായി ബന്ധപ്പെടുക",
            alert_level=AlertLevel.Watch,
            summary="Not sure — ask your Krishi Bhavan. Confidence score is below 70%. Never apply random chemical sprays or pesticides based on uncertain automated diagnosis.",
            bullet_points=[
                "Take 2-3 clear, close-up photos of both the leaf blade and tiller base in bright daylight.",
                "Visit your local Krishi Bhavan (കൃഷിഭവൻ) or Rice Research Station Moncompu for expert diagnostic confirmation.",
                "Drain standing water temporarily as a precautionary cultural measure.",
                "Do NOT apply synthetic insecticides or heavy fertilizer doses before official confirmation."
            ],
            citation="KAU Good Agricultural Practices (GAP) Diagnostic Advisory Protocol.",
            helpline="Kisan Call Centre: 1800-180-1551 | Krishi Bhavan Moncompu: 0477-2702231",
            is_uncertain=True
        )

    remedy = KAU_REMEDIES_REGISTRY[disease_code]
    return ActionGuidance(
        title=f"KAU Recommended Actions: {remedy['disease_name_en']}",
        title_ml=f"കേരള കാർഷിക സർവകലാശാലാ നിർദ്ദേശങ്ങൾ: {remedy['disease_name_ml']}",
        alert_level=AlertLevel.Warning if confidence < 0.90 else AlertLevel.Danger,
        summary=f"Automated detection confirmed with {int(confidence * 100)}% confidence. Follow verified KAU cultural and biological measures immediately.",
        bullet_points=remedy["immediate_actions"] + [remedy["spray_guidance"]],
        citation=remedy["source_citation"],
        helpline="Krishi Bhavan Champakulam / Moncompu Emergency Desk: 0477-2702231",
        is_uncertain=False
    )
