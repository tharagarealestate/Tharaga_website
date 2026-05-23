from pydantic import BaseModel, Field, EmailStr
from typing import Optional, List
from datetime import datetime
from enum import Enum

class LeadSource(str, Enum):
    web = "web"
    meta = "meta"
    google = "google"
    whatsapp = "whatsapp"
    referral = "referral"
    direct = "direct"
    organic = "organic"

class LeadTier(str, Enum):
    lion = "lion"
    monkey = "monkey"
    dog = "dog"

class LeadStatus(str, Enum):
    new = "new"
    contacted = "contacted"
    qualified = "qualified"
    converted = "converted"
    lost = "lost"
    nurturing = "nurturing"

class LeadCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    email: Optional[EmailStr] = None
    phone: str = Field(..., min_length=10, max_length=15)
    alternate_phone: Optional[str] = None
    
    source: LeadSource = LeadSource.web
    
    # Requirements
    budget_min: Optional[float] = None
    budget_max: Optional[float] = None
    property_type: Optional[str] = None
    bedrooms: Optional[int] = None
    preferred_localities: Optional[List[str]] = None
    timeline: Optional[str] = None  # immediate, 1-3months, 3-6months, 6-12months
    
    # Attribution
    utm_source: Optional[str] = None
    utm_medium: Optional[str] = None
    utm_campaign: Optional[str] = None
    utm_content: Optional[str] = None
    landing_page: Optional[str] = None
    referrer: Optional[str] = None
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None
    
    # Meta tracking
    fbp: Optional[str] = None
    fbc: Optional[str] = None

class LeadResponse(BaseModel):
    id: str
    name: str
    email: Optional[str] = None
    phone: str
    source: str = "web"
    score: Optional[int] = 0
    tier: Optional[str] = "monkey"
    status: str = "new"
    is_qualified: bool = False
    created_at: Optional[str] = None
    
    class Config:
        from_attributes = True

class LeadScoreResponse(BaseModel):
    lead_id: str
    score: int
    tier: LeadTier
    factors: dict
    confidence: float

class LeadActivityCreate(BaseModel):
    lead_id: str
    activity_type: str
    description: Optional[str] = None
    metadata: Optional[dict] = None

class LeadAssignmentCreate(BaseModel):
    lead_id: str
    assigned_to: str
    reason: Optional[str] = None
    sla_minutes: int