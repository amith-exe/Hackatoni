 # backend/app/config.py
import os
os.environ.setdefault("LOKY_MAX_CPU_COUNT", "4")

from pydantic import BaseModel

class Settings(BaseModel):
    PROJECT_NAME: str = "Karshakan Lens"
    API_V1_STR: str = "/api"
    
    # Supabase / Database settings
    SUPABASE_URL: str = os.getenv("SUPABASE_URL", "")
    SUPABASE_KEY: str = os.getenv("SUPABASE_KEY", "")
    DATABASE_URL: str = os.getenv("DATABASE_URL", "")
    
    # DBSCAN spatial clustering defaults
    # For Kuttanad delta, 2.0 km groups neighboring padasekharams
    DBSCAN_DEFAULT_EPS_KM: float = float(os.getenv("DBSCAN_DEFAULT_EPS_KM", "2.0"))
    DBSCAN_MIN_SAMPLES: int = int(os.getenv("DBSCAN_MIN_SAMPLES", "2"))
    
    # Clustering window (days to consider for active cluster)
    CLUSTER_WINDOW_DAYS: int = int(os.getenv("CLUSTER_WINDOW_DAYS", "7"))
    
    # Threshold for community confirmation
    CONFIRMATIONS_THRESHOLD: int = 2
    
    # Salinity thresholds (parts per thousand - ppt)
    # Paddy is sensitive at >1.5-2.0 ppt depending on growth stage
    SALINITY_DANGER_THRESHOLD_PPT: float = 2.0
    SALINITY_WARNING_THRESHOLD_PPT: float = 1.0
    
    # Open-Meteo API for Kuttanad rainfall
    OPEN_METEO_BASE_URL: str = "https://api.open-meteo.com/v1/forecast"
    KUTTANAD_LAT: float = 9.45
    KUTTANAD_LNG: float = 76.43
    
    # Fallback confidence threshold for crop disease classifier
    CLASSIFIER_CONFIDENCE_THRESHOLD: float = 0.70

settings = Settings()
