"""
Tharaga Backend API - Enterprise Real Estate Platform
Main FastAPI Application
"""
from __future__ import annotations

import logging
import os
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from .config import settings
from .api.v1 import api_router

# Setup logging
logging.basicConfig(
    level=getattr(logging, settings.LOG_LEVEL, logging.INFO),
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown events"""
    logger.info("🚀 Tharaga Backend API Starting...")
    logger.info(f"Environment: {'Development' if settings.DEBUG else 'Production'}")
    logger.info(f"Supabase URL: {settings.SUPABASE_URL}")
    logger.info(f"Meta CAPI: {'Enabled' if settings.META_ACCESS_TOKEN else 'Disabled'}")
    logger.info(f"WhatsApp: {'Enabled' if settings.WHATSAPP_ACCESS_TOKEN else 'Disabled'}")
    yield
    logger.info("👋 Tharaga Backend API Shutting down...")


# Initialize FastAPI app
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.VERSION,
    description="Enterprise-grade AI-powered real estate platform backend",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json",
    lifespan=lifespan
)

# CORS Configuration
def get_allowed_origins():
    """Get allowed CORS origins"""
    origins_str = settings.ALLOWED_ORIGINS
    if origins_str == "*":
        return ["*"]
    return [origin.strip() for origin in origins_str.split(",") if origin.strip()]


app.add_middleware(
    CORSMiddleware,
    allow_origins=get_allowed_origins(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Exception handlers
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Global exception handler"""
    logger.error(f"Unhandled exception: {str(exc)}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={
            "detail": "Internal server error",
            "error": str(exc) if settings.DEBUG else "An unexpected error occurred"
        }
    )


# Health check
@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "version": settings.VERSION,
        "service": settings.APP_NAME
    }


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "Tharaga Backend API",
        "version": settings.VERSION,
        "docs": "/api/docs",
        "status": "operational"
    }


# Include API routes
app.include_router(api_router, prefix="/api/v1")


# Legacy recommendations endpoint (for backward compatibility)
from .recommender import HybridRecommender, load_demo_data
from .schemas import RecommendationQuery, RecommendationResponse

_properties_df, _interactions_df = load_demo_data()
_recommender = None
try:
    _recommender = HybridRecommender(properties_df=_properties_df, interactions_df=_interactions_df)
    _recommender.fit()
    logger.info("Legacy recommender initialized successfully")
except Exception:
    logger.warning("Legacy recommender initialization failed - using fallback")
    _recommender = None


@app.post("/api/recommendations", response_model=RecommendationResponse)
def get_recommendations_legacy(payload: RecommendationQuery) -> RecommendationResponse:
    """Legacy recommendations endpoint (backward compatibility)"""
    from fastapi import HTTPException
    
    if not payload.user_id and not payload.session_id:
        raise HTTPException(status_code=400, detail="Provide either user_id or session_id")

    try:
        if _recommender is None:
            logger.warning("Recommender unavailable; serving fallback recommendations")
            from .main import _fallback_recommendations
            return RecommendationResponse(items=_fallback_recommendations(top_n=payload.num_results))

        items = _recommender.recommend(
            user_id=payload.user_id,
            session_id=payload.session_id,
            top_n=payload.num_results,
        )
        return RecommendationResponse(items=items)
    except Exception as exc:
        logger.exception("Failed to compute recommendations; serving fallback")
        from .main import _fallback_recommendations
        return RecommendationResponse(items=_fallback_recommendations(top_n=payload.num_results))


def _fallback_recommendations(top_n: int):
    """Fallback recommendations"""
    from .schemas import RecommendationItem, PropertySpecs
    items = []
    try:
        for _, row in _properties_df.head(top_n).iterrows():
            items.append(
                RecommendationItem(
                    property_id=str(row.property_id),
                    title=str(row.title),
                    image_url=str(row.image_url),
                    specs=PropertySpecs(
                        bedrooms=int(row.bedrooms) if not (row.bedrooms != row.bedrooms) else None,
                        bathrooms=int(row.bathrooms) if not (row.bathrooms != row.bathrooms) else None,
                        area_sqft=float(row.area_sqft) if not (row.area_sqft != row.area_sqft) else None,
                        location=str(row.location) if row.location is not None else None,
                    ),
                    reasons=["Popular among similar seekers", "Matches common preferences"],
                    score=0.5,
                )
            )
    except Exception:
        logger.exception("Failed to build fallback recommendations")
        items = []
    return items


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=int(os.getenv("PORT", 8000)),
        reload=settings.DEBUG
    )
