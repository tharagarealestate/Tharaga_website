"""
Property Management API Routes
"""
from fastapi import APIRouter, HTTPException
from typing import List
from ...models.property import (
    PropertyCreate, PropertyResponse, PropertySearchFilters,
    PropertyScoreResponse
)
from ...services.property_service import PropertyService

router = APIRouter()

@router.post("/", response_model=PropertyResponse, status_code=201)
async def create_property(property_data: PropertyCreate):
    """Create new property with AI scoring"""
    try:
        property_response = await PropertyService.create_property(property_data)
        return property_response
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{property_id}", response_model=PropertyResponse)
async def get_property(property_id: str):
    """Get property by ID"""
    property_data = await PropertyService.get_property(property_id)
    if not property_data:
        raise HTTPException(status_code=404, detail="Property not found")
    return property_data

@router.post("/search", response_model=List[PropertyResponse])
async def search_properties(filters: PropertySearchFilters):
    """Search properties with advanced filters"""
    properties = await PropertyService.search_properties(filters)
    return properties

@router.get("/{property_id}/score", response_model=PropertyScoreResponse)
async def get_property_score(property_id: str):
    """Get detailed AI score for property"""
    score_data = await PropertyService.get_property_score(property_id)
    if not score_data:
        raise HTTPException(status_code=404, detail="Property not found")
    return score_data

@router.post("/verify-rera")
async def verify_rera(rera_id: str):
    """Verify RERA ID"""
    is_valid = await PropertyService.verify_rera(rera_id)
    return {
        "rera_id": rera_id,
        "is_valid": is_valid,
        "verified_at": "now"
    }