from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime

class BuilderCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    email: EmailStr
    phone: Optional[str] = None
    website: Optional[str] = None
    logo_url: Optional[str] = None
    description: Optional[str] = None
    rera_id: Optional[str] = None

class BuilderResponse(BaseModel):
    id: str
    name: str
    email: str
    phone: Optional[str]
    website: Optional[str]
    logo_url: Optional[str]
    description: Optional[str]
    rera_id: Optional[str]
    is_verified: bool
    trust_score: Optional[float]
    created_at: datetime
    
    class Config:
        from_attributes = True

class BuilderDashboard(BaseModel):
    builder_id: str
    
    # Today's metrics
    active_leads: int
    lion_leads: int
    monkey_leads: int
    dog_leads: int
    
    # Pipeline
    pipeline_value: float
    
    # Performance
    leads_converted_today: int
    leads_converted_week: int
    conversion_rate: float
    
    # Response metrics
    avg_response_time_minutes: Optional[float]
    sla_met_percentage: Optional[float]
    
    # Properties
    total_properties: int
    active_properties: int