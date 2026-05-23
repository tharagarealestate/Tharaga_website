from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import date, datetime

class LiveMetrics(BaseModel):
    active_leads: int
    lion_leads: int
    monkey_leads: int
    dog_leads: int
    pipeline_value: float
    leads_converted_today: int
    leads_converted_week: int
    conversion_rate: float
    avg_response_time_minutes: Optional[float]
    properties_listed: int
    updated_at: datetime

class LocalityInsight(BaseModel):
    city: str
    locality: str
    avg_price_sqft: Optional[float]
    price_trend_percentage: Optional[float]
    demand_level: Optional[str]
    demand_change_percentage: Optional[float]
    active_properties: int
    connectivity_score: Optional[int]
    safety_score: Optional[int]
    lifestyle_score: Optional[int]
    updated_at: datetime

class MarketDataResponse(BaseModel):
    localities: List[LocalityInsight]
    total_properties: int
    avg_price_city: Optional[float]
    trending_localities: List[str]