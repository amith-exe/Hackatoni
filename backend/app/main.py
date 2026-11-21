# backend/app/main.py
"""
Karshakan Lens - Community-Verified Early-Warning API.
FastAPI Application Entry Point.
"""

import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from backend.app.config import settings
from backend.app.routers import reports, map_feed, officer, remedies
from backend.app.services.db import db

app = FastAPI(
    title="Karshakan Lens API",
    description="Community-verified early-warning platform for Kuttanad paddy and duck farmers. PostGIS hydrology, DBSCAN spatial clustering, and KAU remedies.",
    version="1.0.0"
)

# Enable CORS for Next.js PWA and local testing
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(reports.router, prefix=settings.API_V1_STR)
app.include_router(map_feed.router, prefix=settings.API_V1_STR)
app.include_router(officer.router, prefix=settings.API_V1_STR)
app.include_router(remedies.router, prefix=settings.API_V1_STR)

# Static files and root UI
STATIC_DIR = os.path.join(os.path.dirname(__file__), "static")
if os.path.exists(STATIC_DIR):
    app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")

@app.get("/", include_in_schema=False)
async def serve_index():
    index_file = os.path.join(STATIC_DIR, "index.html")
    if os.path.exists(index_file):
        return FileResponse(index_file)
    return {"message": "Karshakan Lens API is running. Visit /docs for OpenAPI documentation."}

@app.get("/api/health", tags=["Health"])
async def health_check():
    return {
        "status": "healthy",
        "service": "karshakan-lens-backend",
        "version": "1.0.0",
        "database": "online",
        "active_reports": len(db.reports),
        "canal_segments": len(db.canal_segments)
    }

@app.get("/api/profiles", tags=["Profiles"])
async def list_profiles():
    """Returns demo profiles for farmer/officer role switching."""
    return [
        {
            "id": p["id"],
            "name": p["name"],
            "phone": p["phone"],
            "role": p["role"],
            "village_or_padasekharam": p["village_or_padasekharam"],
            "farm_type": p["farm_type"],
            "latitude": p["latitude"],
            "longitude": p["longitude"]
        }
        for p in db.profiles.values()
    ]

@app.get("/api/canals", tags=["Canals"])
async def list_canals():
    """Returns all Kuttanad canal segments."""
    return db.get_all_canals()
