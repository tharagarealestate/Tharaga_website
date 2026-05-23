from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

class PropertyCreate(BaseModel):
    title: str = Field(..., min_length=5, max_length=200)
    description: Optional[str] = None
    city: str
    locality: Optional[str] = None
    property_type: str  # apartment, villa, plot, commercial
    bedrooms: Optional[int] = Field(None, ge=0, le=10)
    bathrooms: Optional[int] = Field(None, ge=0, le=10)
    price_inr: float = Field(..., gt=0)
    sqft: Optional[float] = Field(None, gt=0)
    
    # Location
    lat: Optional[float] = None
    lng: Optional[float] = None
    
    # Details
    furnishing: Optional[str] = None  # furnished, semi-furnished, unfurnished
    age_years: Optional[int] = None
    facing: Optional[str] = None  # north, south, east, west
    floor_number: Optional[int] = None
    total_floors: Optional[int] = None
    parking: Optional[int] = None
    balconies: Optional[int] = None
    
    # Features
    amenities: Optional[List[str]] = None
    images: Optional[List[str]] = None
    video_url: Optional[str] = None
    virtual_tour_url: Optional[str] = None
    
    # RERA
    rera_id: Optional[str] = None
    
    # Builder
    builder_id: Optional[str] = None

class PropertyResponse(BaseModel):
    id: str
    title: str
    description: Optional[str]
    city: str
    locality: Optional[str]
    property_type: str
    bedrooms: Optional[int]
    bathrooms: Optional[int]
    price_inr: float
    sqft: Optional[float]
    lat: Optional[float]
    lng: Optional[float]
    ai_score: Optional[int]
    is_rera_verified: bool
    images: Optional[List[str]]
    amenities: Optional[List[str]]
    status: str
    created_at: datetime
    
    class Config:
        from_attributes = True

class PropertyScoreResponse(BaseModel):
    property_id: str
    ai_score: int
    factors: dict
    reasons: List[str]

class PropertySearchFilters(BaseModel):
    city: Optional[str] = None
    locality: Optional[str] = None
    property_type: Optional[str] = None
    min_price: Optional[float] = None
    max_price: Optional[float] = None
    bedrooms: Optional[int] = None
    min_sqft: Optional[float] = None
    max_sqft: Optional[float] = None
    furnishing: Optional[str] = None
    rera_verified_only: bool = False
    sort_by: str = "created_at"  # created_at, price_asc, price_desc, ai_score
    limit: int = Field(default=20, ge=1, le=100)
    offset: int = Field(default=0, ge=0)