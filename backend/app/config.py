"""
Configuration and settings for Tharaga Backend
"""
import os
from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    # App
    APP_NAME: str = "Tharaga API"
    VERSION: str = "1.0.0"
    DEBUG: bool = False
    
    # Supabase
    SUPABASE_URL: str
    SUPABASE_KEY: str  # Service role key
    SUPABASE_JWT_SECRET: Optional[str] = None
    
    # CORS
    ALLOWED_ORIGINS: str = "*"
    
    # Meta CAPI
    META_ACCESS_TOKEN: Optional[str] = None
    META_PIXEL_ID: Optional[str] = None
    
    # WhatsApp Business API
    WHATSAPP_PHONE_NUMBER_ID: Optional[str] = None
    WHATSAPP_ACCESS_TOKEN: Optional[str] = None
    WHATSAPP_VERIFY_TOKEN: Optional[str] = "tharaga_webhook_verify_2024"
    
    # Twilio (Alternative to WhatsApp Business API)
    TWILIO_ACCOUNT_SID: Optional[str] = None
    TWILIO_AUTH_TOKEN: Optional[str] = None
    TWILIO_WHATSAPP_FROM: Optional[str] = None
    
    # Zoho CRM
    ZOHO_CLIENT_ID: Optional[str] = None
    ZOHO_CLIENT_SECRET: Optional[str] = None
    ZOHO_REFRESH_TOKEN: Optional[str] = None
    ZOHO_ORG_ID: Optional[str] = None
    
    # Lead Scoring Weights
    LEAD_SCORE_BUDGET_WEIGHT: float = 0.25
    LEAD_SCORE_TIMELINE_WEIGHT: float = 0.20
    LEAD_SCORE_ENGAGEMENT_WEIGHT: float = 0.20
    LEAD_SCORE_SOURCE_WEIGHT: float = 0.15
    LEAD_SCORE_QUALIFICATION_WEIGHT: float = 0.20
    
    # Lead Tiers (score thresholds)
    LION_THRESHOLD: int = 75
    MONKEY_THRESHOLD: int = 50
    
    # SLA times (minutes)
    LION_SLA_MINUTES: int = 15
    MONKEY_SLA_MINUTES: int = 60
    DOG_SLA_MINUTES: int = 240
    
    # Property AI Scoring
    PROPERTY_SCORE_LOCATION_WEIGHT: float = 0.30
    PROPERTY_SCORE_PRICE_WEIGHT: float = 0.25
    PROPERTY_SCORE_AMENITIES_WEIGHT: float = 0.20
    PROPERTY_SCORE_RERA_WEIGHT: float = 0.15
    PROPERTY_SCORE_BUILDER_WEIGHT: float = 0.10
    
    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()
