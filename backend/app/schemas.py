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


# --- Event collection for learning ---
class InteractionEvent(BaseModel):
    user_id: str
    session_id: str
    property_id: str
    event: str  # view | favorite | contact | share | scroll_50 | scroll_90 | time_on_page_30s | time_on_page_60s
    value: float = 1.0
    ts: Optional[float] = None

class BatchInteractionRequest(BaseModel):
    events: List[InteractionEvent] = Field(default_factory=list)

class BatchInteractionResponse(BaseModel):
    ok: bool
    accepted: int


# --- Anti-fraud and verification schemas ---

class ReraVerifyRequest(BaseModel):
    rera_id: str = Field(..., description="Official RERA registration number for the project/promoter")
    state: Optional[str] = Field(default=None, description="State or UT for RERA portal (e.g., KA, TN, MH)")
    project_name: Optional[str] = None
    promoter_name: Optional[str] = None
    property_id: Optional[str] = Field(default=None, description="Property ID to associate snapshot with")


class ReraVerifyResponse(BaseModel):
    verified: bool
    confidence: float = Field(ge=0.0, le=1.0)
    status: str
    source_url: Optional[str] = None
    details: Dict[str, str] = Field(default_factory=dict)
    evidence_html_base64: Optional[str] = Field(default=None, description="Base64 snapshot of verification page")
    queried_at: Optional[float] = None


class TitleVerifyRequest(BaseModel):
    property_id: str
    document_hash: str = Field(..., description="SHA-256 or keccak256 hash of title deed or registry doc")
    network: Optional[str] = Field(default=None, description="Blockchain network identifier (e.g., ethereum, polygon)")
    registry_address: Optional[str] = Field(default=None, description="On-chain registry contract address if applicable")


class TitleVerifyResponse(BaseModel):
    verified: bool
    confidence: float = Field(ge=0.0, le=1.0)
    transaction_hash: Optional[str] = None
    explorer_url: Optional[str] = None
    details: Dict[str, str] = Field(default_factory=dict)
    proof_bundle: Dict[str, str] = Field(default_factory=dict)


class FraudScoreRequest(BaseModel):
    price_inr: Optional[float] = None
    sqft: Optional[float] = None
    city: Optional[str] = None
    locality: Optional[str] = None
    bedrooms: Optional[int] = None
    bathrooms: Optional[int] = None
    has_rera_id: bool = Field(default=False)
    has_title_docs: bool = Field(default=False)
    seller_type: Optional[str] = Field(default=None, description="owner | broker | builder")
    listed_days_ago: Optional[int] = None


class FraudScoreResponse(BaseModel):
    risk_score: int = Field(ge=0, le=100)
    risk_level: str
    reasons: List[str] = Field(default_factory=list)
    recommended_actions: List[str] = Field(default_factory=list)


class PredictiveAnalyticsRequest(BaseModel):
    city: Optional[str] = None
    locality: Optional[str] = None
    price_inr: Optional[float] = None
    sqft: Optional[float] = None
    bedrooms: Optional[int] = None
    bathrooms: Optional[int] = None


class PredictiveAnalyticsResponse(BaseModel):
    price_appreciation_1y_pct: float
    price_appreciation_3y_pct: float
    expected_rent_yield_pct: float
    benchmarks: Dict[str, float] = Field(default_factory=dict)
    notes: List[str] = Field(default_factory=list)


class TitleAnchorRequest(BaseModel):
    document_hash: str
    network: Optional[str] = None


class TitleAnchorResponse(BaseModel):
    anchored: bool
    transaction_hash: Optional[str] = None
    explorer_url: Optional[str] = None
    proof_bundle: Dict[str, str] = Field(default_factory=dict)


class CityTrend(BaseModel):
    city: str
    avg_psf: float
    yoy: float
    inventory_months: float
    rent_yield_pct: float


class MarketTrendsResponse(BaseModel):
    items: List[CityTrend]


# Data Collection Schemas
class DataCollectionRequest(BaseModel):
    property_id: str
    force_refresh: bool = False


class DataCollectionResponse(BaseModel):
    success: bool
    property_id: str
    data_quality_score: float
    data_completeness_score: float
    fields_collected: int
    sources_used: List[str]
    message: str


class DataQualityResponse(BaseModel):
    property_id: str
    data_quality_score: float
    data_completeness_score: float
    fields_filled: int
    fields_total: int
    sources: List[str]
    last_updated: Optional[str] = None
