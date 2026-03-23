# =============================================
# LISTING OPTIMIZER API ROUTES
# =============================================
from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel
from typing import Optional
import os
import sys
from pathlib import Path

# Add backend directory to path
backend_dir = Path(__file__).parent.parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from services.listing_optimizer import (
    analyze_listing,
    OptimizationRequest
)

router = APIRouter(prefix="/api/optimization", tags=["optimization"])

@router.post("/analyze")
async def analyze_route(request: OptimizationRequest, background_tasks: BackgroundTasks):
    """Analyze listing endpoint"""
    return await analyze_listing(request, background_tasks)

@router.get("/health")
async def health_route():
    return {"status": "healthy", "service": "Listing Optimizer"}

