# File: /backend/services/partner_portals_routes.py
from fastapi import APIRouter, BackgroundTasks, HTTPException
from pydantic import BaseModel
from typing import Optional
from .partner_portals_service import PartnerPortalsService

router = APIRouter()
portal_service = PartnerPortalsService()

class SyncToPortalRequest(BaseModel):
    property_id: str
    portal_account_id: str
    sync_type: str = "create"

@router.post("/integrations/portals/sync")
async def sync_to_portal(
    request: SyncToPortalRequest,
    background_tasks: BackgroundTasks
):
    """Sync property to partner portal"""
    
    try:
        # Sync in background
        background_tasks.add_task(
            portal_service.sync_property_to_portal,
            request.property_id,
            request.portal_account_id,
            request.sync_type
        )
        
        return {
            "success": True,
            "message": "Portal sync queued"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/integrations/portals/analytics/{property_id}")
async def get_portal_analytics(property_id: str):
    """Get cross-portal analytics for property"""
    
    try:
        syncs = portal_service.supabase.table("syndicated_listings")\
            .select("*, partner_portals!inner(portal_display_name)")\
            .eq("property_id", property_id)\
            .execute()
        
        total_views = sum(s.get("portal_views", 0) for s in syncs.data or [])
        total_contacts = sum(s.get("portal_contacts", 0) for s in syncs.data or [])
        
        return {
            "success": True,
            "data": {
                "total_portals": len(syncs.data or []),
                "total_views": total_views,
                "total_contacts": total_contacts,
                "portal_breakdown": syncs.data or []
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/integrations/portals/sync-metrics/{syndicated_listing_id}")
async def sync_portal_metrics(syndicated_listing_id: str):
    """Sync metrics from portal"""
    
    try:
        metrics = await portal_service.sync_portal_metrics(syndicated_listing_id)
        return {"success": True, "data": metrics}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

