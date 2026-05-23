"""
Tharaga Backend API - Enterprise Real Estate Platform
Production-grade FastAPI Application
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
from .middleware import (
    RequestIDMiddleware,
    LoggingMiddleware,
    RateLimitMiddleware,
    tharaga_exception_handler
)
from .utils.exceptions import TharagaBaseException

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown events"""
    logger.info("=" * 60)
    logger.info("🚀 Tharaga Backend API Starting...")
    logger.info(f"   Version: {settings.VERSION}")
    logger.info(f"   Environment: {'Development' if settings.DEBUG else 'Production'}")
    logger.info(f"   Supabase: {'Connected' if settings.SUPABASE_URL else 'NOT CONFIGURED'}")
    logger.info(f"   Meta CAPI: {'Enabled' if settings.META_ACCESS_TOKEN else 'Disabled'}")
    logger.info(f"   WhatsApp: {'Enabled' if settings.WHATSAPP_ACCESS_TOKEN and settings.WHATSAPP_ACCESS_TOKEN != 'your_whatsapp_token' else 'Disabled'}")
    logger.info(f"   Zoho CRM: {'Enabled' if settings.ZOHO_REFRESH_TOKEN and settings.ZOHO_REFRESH_TOKEN != 'your_zoho_token' else 'Disabled'}")
    logger.info("=" * 60)
    
    # Test Supabase connection
    try:
        from .database import get_supabase
        supabase = get_supabase()
        result = supabase.table('builders').select('id').limit(1).execute()
        logger.info("✅ Supabase connection verified")
    except Exception as e:
        logger.error(f"❌ Supabase connection failed: {e}")
    
    yield
    logger.info("👋 Tharaga Backend API Shutting down...")


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.VERSION,
    description="Enterprise-grade AI-powered real estate platform for India",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json",
    lifespan=lifespan
)


# ============================================
# MIDDLEWARE (order matters - executed bottom-up)
# ============================================

# CORS - executed last
def get_allowed_origins():
    origins_str = settings.ALLOWED_ORIGINS
    if origins_str == "*":
        return ["*"]
    return [o.strip() for o in origins_str.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=get_allowed_origins(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["X-Request-ID", "X-Response-Time-Ms"]
)

# Custom middleware (executed in reverse order of addition)
app.add_middleware(RateLimitMiddleware)
app.add_middleware(LoggingMiddleware)
app.add_middleware(RequestIDMiddleware)


# ============================================
# EXCEPTION HANDLERS
# ============================================
app.add_exception_handler(TharagaBaseException, tharaga_exception_handler)


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Global exception handler"""
    request_id = getattr(request.state, 'request_id', 'unknown')
    logger.error(f"[{request_id}] Unhandled exception: {str(exc)}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={
            "detail": "Internal server error",
            "error_type": "InternalServerError",
            "request_id": request_id
        }
    )


# ============================================
# CORE ENDPOINTS
# ============================================
@app.get("/health")
async def health_check():
    """Comprehensive health check"""
    health = {
        "status": "healthy",
        "version": settings.VERSION,
        "service": settings.APP_NAME,
        "checks": {}
    }
    
    # Check Supabase
    try:
        from .database import get_supabase
        supabase = get_supabase()
        supabase.table('builders').select('id').limit(1).execute()
        health["checks"]["supabase"] = "healthy"
    except Exception as e:
        health["checks"]["supabase"] = f"unhealthy: {str(e)[:50]}"
        health["status"] = "degraded"
    
    # Check integrations
    health["checks"]["meta_capi"] = "configured" if settings.META_ACCESS_TOKEN else "not_configured"
    health["checks"]["whatsapp"] = "configured" if (settings.WHATSAPP_ACCESS_TOKEN and settings.WHATSAPP_ACCESS_TOKEN != 'your_whatsapp_token') else "not_configured"
    health["checks"]["zoho_crm"] = "configured" if (settings.ZOHO_REFRESH_TOKEN and settings.ZOHO_REFRESH_TOKEN != 'your_zoho_token') else "not_configured"
    
    return health


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "service": "Tharaga Backend API",
        "version": settings.VERSION,
        "status": "operational",
        "docs": "/api/docs",
        "health": "/health"
    }


# ============================================
# API ROUTES
# ============================================
app.include_router(api_router, prefix="/api/v1")


# ============================================
# LEGACY RECOMMENDATIONS (backward compatibility)
# ============================================
try:
    from .recommender import HybridRecommender, load_demo_data
    from .schemas import RecommendationQuery, RecommendationResponse, RecommendationItem, PropertySpecs
    _LEGACY_AVAILABLE = True
except ImportError as e:
    logger.warning(f"Legacy recommender dependencies missing: {e}")
    _LEGACY_AVAILABLE = False

if _LEGACY_AVAILABLE:
    _properties_df, _interactions_df = load_demo_data()
    _recommender = None
    try:
        _recommender = HybridRecommender(properties_df=_properties_df, interactions_df=_interactions_df)
        _recommender.fit()
        logger.info("Legacy recommender initialized")
    except Exception as e:
        logger.warning(f"Legacy recommender unavailable: {e}")


    def _fallback_recommendations(top_n: int):
        """Fallback recommendations"""
        items = []
        try:
            for _, row in _properties_df.head(top_n).iterrows():
                items.append(RecommendationItem(
                    property_id=str(row.property_id),
                    title=str(row.title),
                    image_url=str(row.image_url),
                    specs=PropertySpecs(
                        bedrooms=int(row.bedrooms) if not (row.bedrooms != row.bedrooms) else None,
                        bathrooms=int(row.bathrooms) if not (row.bathrooms != row.bathrooms) else None,
                        area_sqft=float(row.area_sqft) if not (row.area_sqft != row.area_sqft) else None,
                        location=str(row.location) if row.location is not None else None,
                    ),
                    reasons=["Popular among similar seekers"],
                    score=0.5,
                ))
        except Exception:
            pass
        return items


    @app.post("/api/recommendations", response_model=RecommendationResponse)
    def get_recommendations_legacy(payload: RecommendationQuery) -> RecommendationResponse:
        """Legacy recommendations endpoint"""
        from fastapi import HTTPException
        if not payload.user_id and not payload.session_id:
            raise HTTPException(status_code=400, detail="Provide either user_id or session_id")
        
        try:
            if _recommender is None:
                return RecommendationResponse(items=_fallback_recommendations(top_n=payload.num_results))
            items = _recommender.recommend(
                user_id=payload.user_id,
                session_id=payload.session_id,
                top_n=payload.num_results,
            )
            return RecommendationResponse(items=items)
        except Exception:
            return RecommendationResponse(items=_fallback_recommendations(top_n=payload.num_results))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=int(os.getenv("PORT", 8001)), reload=settings.DEBUG)
