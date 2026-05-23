"""
Analytics & Live Metrics API Routes
"""
from fastapi import APIRouter, HTTPException
from ...models.analytics import LiveMetrics, MarketDataResponse, LocalityInsight
from ...services.analytics_service import AnalyticsService

router = APIRouter()

@router.get("/live-metrics", response_model=LiveMetrics)
async def get_live_metrics():
    """Get real-time dashboard metrics"""
    try:
        metrics = await AnalyticsService.get_live_metrics()
        return metrics
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/market-data", response_model=MarketDataResponse)
async def get_market_data(city: str = "Chennai"):
    """Get market intelligence for city"""
    try:
        data = await AnalyticsService.get_market_data(city)
        return data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/locality-insights", response_model=LocalityInsight)
async def get_locality_insights(city: str, locality: str):
    """Get detailed insights for locality"""
    insights = await AnalyticsService.get_locality_insights(city, locality)
    if not insights:
        raise HTTPException(status_code=404, detail="Locality not found")
    return insights