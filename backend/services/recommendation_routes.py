# =============================================
# RECOMMENDATION ENGINE API ROUTES
# =============================================
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
import os
import sys
from pathlib import Path

# Add backend directory to path
backend_dir = Path(__file__).parent.parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from services.recommendation_engine import (
    get_recommendations,
    RecommendationRequest,
    RecommendationResponse
)

router = APIRouter(prefix="/api/recommendations", tags=["recommendations"])

@router.post("/recommend", response_model=List[RecommendationResponse])
async def recommend_route(request: RecommendationRequest):
    """Get recommendations endpoint"""
    return await get_recommendations(request)

@router.get("/health")
async def health_route():
    return {"status": "healthy", "service": "Recommendation Engine"}

