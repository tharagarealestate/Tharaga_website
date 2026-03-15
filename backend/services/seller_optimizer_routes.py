# =============================================
# FEATURE 8: SELLER OPTIMIZER API ROUTES
# =============================================
from fastapi import APIRouter, BackgroundTasks, HTTPException
from pydantic import BaseModel
from typing import Optional
from datetime import datetime

from services.seller_optimizer import get_optimizer, SellerOptimizationEngine

router = APIRouter(prefix="/api/seller-optimizer", tags=["seller-optimizer"])

# Request/Response Models
class OptimizeRequest(BaseModel):
    property_id: str

class ImplementSuggestionRequest(BaseModel):
    suggestion_id: str

@router.post("/optimize/{property_id}")
async def optimize_listing(property_id: str, background_tasks: BackgroundTasks):
    """
    Run full optimization analysis on a property
    Returns immediately, processes in background
    """
    
    optimizer = get_optimizer()
    
    # Trigger analysis in background
    async def run_analysis():
        try:
            await optimizer.analyze_and_optimize(property_id)
        except Exception as e:
            # Log error but don't fail the request
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Background optimization failed: {str(e)}", exc_info=True)
    
    background_tasks.add_task(run_analysis)
    
    return {
        "success": True,
        "message": "Optimization analysis started",
        "property_id": property_id
    }

@router.get("/optimize/{property_id}/status")
async def get_optimization_status(property_id: str):
    """Get current optimization suggestions and performance"""
    
    try:
        optimizer = get_optimizer()
        supabase = optimizer.supabase
        
        # Get performance
        perf = supabase.table("listing_performance_metrics")\
            .select("*")\
            .eq("property_id", property_id)\
            .maybe_single()\
            .execute()
        
        # Get suggestions
        suggestions = supabase.table("ai_optimization_suggestions")\
            .select("*")\
            .eq("property_id", property_id)\
            .eq("status", "pending")\
            .order("impact_score", desc=True)\
            .execute()
        
        # Get competitive analysis
        competitive = supabase.table("competitive_analysis_new")\
            .select("*")\
            .eq("property_id", property_id)\
            .order("analyzed_at", desc=True)\
            .limit(1)\
            .maybe_single()\
            .execute()
        
        return {
            "success": True,
            "data": {
                "performance": perf.data if perf.data else {},
                "suggestions": suggestions.data if suggestions.data else [],
                "competitive_insights": competitive.data if competitive.data else None,
                "total_pending_suggestions": len(suggestions.data) if suggestions.data else 0,
                "critical_count": sum(1 for s in (suggestions.data or []) if s.get("priority") == "critical")
            }
        }
        
    except Exception as e:
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f"Get optimization status failed: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/optimize/{property_id}/implement")
async def implement_suggestion(
    property_id: str,
    request: ImplementSuggestionRequest
):
    """Mark a suggestion as implemented and start tracking results"""
    
    try:
        optimizer = get_optimizer()
        supabase = optimizer.supabase
        
        # Get current performance as baseline
        perf = supabase.table("listing_performance_metrics")\
            .select("*")\
            .eq("property_id", property_id)\
            .maybe_single()\
            .execute()
        
        # Update suggestion
        supabase.table("ai_optimization_suggestions")\
            .update({
                "status": "implemented",
                "implemented_at": datetime.utcnow().isoformat(),
                "baseline_metrics": perf.data if perf.data else {}
            })\
            .eq("id", request.suggestion_id)\
            .eq("property_id", property_id)\
            .execute()
        
        return {
            "success": True,
            "message": "Suggestion marked as implemented. Results will be tracked."
        }
        
    except Exception as e:
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f"Implement suggestion failed: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))








