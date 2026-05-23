from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class LiveMetrics(BaseModel):
    active_leads: int = 0
    lion_leads: int = 0
    monkey_leads: int = 0
    dog_leads: int = 0
    pipeline_value: float = 0
    leads_converted_today: int = 0
    leads_converted_week: int = 0
    conversion_rate: float = 0
    avg_response_time_minutes: Optional[float] = None
    properties_listed: int = 0
    updated_at: Optional[str] = None


class LocalityInsight(BaseModel):
    city: str
    locality: str
    avg_price_sqft: Optional[float] = None
    price_trend_percentage: Optional[float] = None
    demand_level: Optional[str] = None
    demand_change_percentage: Optional[float] = None
    active_properties: int = 0
    connectivity_score: Optional[int] = None
    safety_score: Optional[int] = None
    lifestyle_score: Optional[int] = None
    updated_at: Optional[str] = None


class MarketDataResponse(BaseModel):
    localities: List[LocalityInsight] = []
    total_properties: int = 0
    avg_price_city: Optional[float] = None
    trending_localities: List[str] = []
