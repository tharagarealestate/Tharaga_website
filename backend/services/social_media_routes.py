# File: /backend/services/social_media_routes.py
from fastapi import APIRouter, BackgroundTasks, HTTPException
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from .social_media_service import SocialMediaService

router = APIRouter()
social_service = SocialMediaService()

class CreateSocialPostRequest(BaseModel):
    property_id: str
    social_account_id: str
    template_id: Optional[str] = None

@router.post("/integrations/social-media/post")
async def create_social_post(
    request: CreateSocialPostRequest,
    background_tasks: BackgroundTasks
):
    """Create and post to social media"""
    
    try:
        # Post in background
        background_tasks.add_task(
            social_service.create_and_post,
            request.property_id,
            request.social_account_id,
            request.template_id
        )
        
        return {
            "success": True,
            "message": "Social media post queued"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/integrations/social-media/analytics/{property_id}")
async def get_social_analytics(property_id: str):
    """Get social media performance for property"""
    
    try:
        posts = social_service.supabase.table("social_media_posts")\
            .select("*")\
            .eq("property_id", property_id)\
            .order("created_at", desc=True)\
            .execute()
        
        # Calculate aggregated metrics
        total_reach = sum(p.get("reach", 0) for p in posts.data or [])
        total_engagement = sum(
            p.get("likes_count", 0) + p.get("comments_count", 0) + p.get("shares_count", 0) 
            for p in posts.data or []
        )
        
        return {
            "success": True,
            "data": {
                "total_posts": len(posts.data or []),
                "total_reach": total_reach,
                "total_engagement": total_engagement,
                "posts": posts.data or []
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/integrations/social-media/accounts")
async def get_social_accounts():
    """Get connected social media accounts for current builder"""
    try:
        # This would need authentication context
        # For now, return placeholder
        accounts = social_service.supabase.table("social_media_accounts")\
            .select("*")\
            .eq("is_active", True)\
            .execute()
        
        return {
            "success": True,
            "data": accounts.data or []
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))



