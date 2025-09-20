from __future__ import annotations

from typing import Dict, List, Optional

from pydantic import BaseModel, Field


class PropertySpecs(BaseModel):
    bedrooms: Optional[int] = None
    bathrooms: Optional[int] = None
    area_sqft: Optional[float] = None
    location: Optional[str] = None


class RecommendationItem(BaseModel):
    property_id: str = Field(..., description="Unique property identifier")
    title: str
    image_url: str
    specs: PropertySpecs
    reasons: List[str] = Field(default_factory=list)
    score: float = Field(..., ge=0)


class RecommendationQuery(BaseModel):
    user_id: Optional[str] = Field(default=None)
    session_id: Optional[str] = Field(default=None)
    num_results: int = Field(default=10, ge=1, le=50)


class RecommendationResponse(BaseModel):
    items: List[RecommendationItem]

