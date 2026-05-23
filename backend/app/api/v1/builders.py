"""
Builder Management API Routes
"""
from fastapi import APIRouter, HTTPException
from ...models.builder import BuilderCreate, BuilderResponse, BuilderDashboard
from ...services.builder_service import BuilderService

router = APIRouter()

@router.post("/", response_model=BuilderResponse, status_code=201)
async def create_builder(builder_data: BuilderCreate, user_id: str):
    """Register new builder"""
    try:
        builder = await BuilderService.create_builder(builder_data, user_id)
        return builder
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{builder_id}", response_model=BuilderResponse)
async def get_builder(builder_id: str):
    """Get builder profile"""
    builder = await BuilderService.get_builder(builder_id)
    if not builder:
        raise HTTPException(status_code=404, detail="Builder not found")
    return builder

@router.get("/{builder_id}/dashboard", response_model=BuilderDashboard)
async def get_builder_dashboard(builder_id: str):
    """Get comprehensive builder dashboard with live metrics"""
    try:
        dashboard = await BuilderService.get_builder_dashboard(builder_id)
        return dashboard
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{builder_id}/properties")
async def get_builder_properties(builder_id: str, limit: int = 50):
    """Get all properties for builder"""
    properties = await BuilderService.get_builder_properties(builder_id, limit)
    return {"properties": properties}

@router.put("/{builder_id}")
async def update_builder(builder_id: str, update_data: dict):
    """Update builder information"""
    success = await BuilderService.update_builder(builder_id, update_data)
    if not success:
        raise HTTPException(status_code=500, detail="Failed to update builder")
    return {"success": True}