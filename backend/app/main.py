from __future__ import annotations

import logging
import os
from typing import Optional

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware

from .schemas import RecommendationQuery, RecommendationResponse, RecommendationItem, PropertySpecs
try:
    from .recommender import HybridRecommender, load_demo_data  # type: ignore
    _HAS_ML = True
except Exception:  # pragma: no cover - fallback when heavy deps missing
    _HAS_ML = False
    HybridRecommender = None  # type: ignore
    def load_demo_data():  # type: ignore
        import pandas as pd
        properties = pd.DataFrame([
            {"property_id": "P1", "title": "Modern 2BHK in Koramangala", "description": "Bright, airy, balcony, near cafes", "location": "Koramangala, Bengaluru", "amenities": "gym pool parking", "image_url": "https://picsum.photos/seed/p1/800/600", "bedrooms": 2, "bathrooms": 2, "area_sqft": 950},
            {"property_id": "P2", "title": "Luxury Villa in Whitefield", "description": "Gated community, private garden", "location": "Whitefield, Bengaluru", "amenities": "garden parking clubhouse", "image_url": "https://picsum.photos/seed/p2/800/600", "bedrooms": 4, "bathrooms": 4, "area_sqft": 3200},
            {"property_id": "P3", "title": "Cozy Studio near MG Road", "description": "Walk to metro, compact living", "location": "MG Road, Bengaluru", "amenities": "metro access security", "image_url": "https://picsum.photos/seed/p3/800/600", "bedrooms": 1, "bathrooms": 1, "area_sqft": 450},
            {"property_id": "P4", "title": "Spacious 3BHK in Indiranagar", "description": "Premium fittings, large living room", "location": "Indiranagar, Bengaluru", "amenities": "gym clubhouse balcony", "image_url": "https://picsum.photos/seed/p4/800/600", "bedrooms": 3, "bathrooms": 3, "area_sqft": 1550},
        ])
        interactions = pd.DataFrame([
            {"user_id": "U1", "property_id": "P1", "event": "view", "value": 1.0},
            {"user_id": "U1", "property_id": "P1", "event": "favorite", "value": 1.0},
            {"user_id": "U1", "property_id": "P4", "event": "view", "value": 1.0},
            {"user_id": "U2", "property_id": "P2", "event": "favorite", "value": 1.0},
            {"user_id": "U2", "property_id": "P3", "event": "view", "value": 1.0},
        ])
        return properties, interactions

    class _TinyRecommender:
        def __init__(self, properties_df, interactions_df):
            self.properties_df = properties_df

        def fit(self):
            return self

        def recommend(self, user_id: str | None, session_id: str | None, top_n: int = 10):
            # Very naive popularity-based fallback
            items = []
            for _, row in self.properties_df.head(top_n).iterrows():
                items.append(RecommendationItem(
                    property_id=str(row.property_id),
                    title=str(row.title),
                    image_url=str(row.image_url),
                    specs=PropertySpecs(
                        bedrooms=int(row.bedrooms) if not pd.isna(row.bedrooms) else None,
                        bathrooms=int(row.bathrooms) if not pd.isna(row.bathrooms) else None,
                        area_sqft=float(row.area_sqft) if not pd.isna(row.area_sqft) else None,
                        location=str(row.location) if not pd.isna(row.location) else None,
                    ),
                    reasons=["Popular among similar seekers", "Matches common preferences"],
                    score=0.5,
                ))
            return items


logger = logging.getLogger("tharaga.recommendations")
logging.basicConfig(level=os.getenv("LOG_LEVEL", "INFO"))


def get_allowed_origins() -> list[str]:
    cors_env = os.getenv("ALLOWED_ORIGINS", "*")
    if cors_env.strip() == "*":
        return ["*"]
    return [origin.strip() for origin in cors_env.split(",") if origin.strip()]


app = FastAPI(title="Tharaga Recommendations API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=get_allowed_origins(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def add_request_id_logging(request: Request, call_next):
    request_id = request.headers.get("x-request-id") or request.headers.get("x-cloud-trace-context", "").split(";")[0]
    try:
        response = await call_next(request)
    except Exception:
        logger.exception("request_failed", extra={
            "path": request.url.path,
            "method": request.method,
            "request_id": request_id,
        })
        raise
    response.headers["x-request-id"] = request_id or ""
    logger.info("request_completed", extra={
        "path": request.url.path,
        "method": request.method,
        "status_code": getattr(response, 'status_code', None),
        "request_id": request_id,
    })
    return response


# In a real deployment, inject a database-backed recommender via dependency injection.
_properties_df, _interactions_df = load_demo_data()
_recommender = None
try:
    _recommender = HybridRecommender(properties_df=_properties_df, interactions_df=_interactions_df)
    _recommender.fit()
    logger.info("HybridRecommender initialized successfully")
except Exception:
    # Degrade gracefully; we'll compute a simple fallback response on demand
    logger.exception("Failed to initialize HybridRecommender; will use fallback recommendations")
    _recommender = None


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


def _fallback_recommendations(top_n: int) -> list[RecommendationItem]:
    # Popularity/content-lite fallback using available property specs
    items: list[RecommendationItem] = []
    try:
        for _, row in _properties_df.head(top_n).iterrows():
            items.append(
                RecommendationItem(
                    property_id=str(row.property_id),
                    title=str(row.title),
                    image_url=str(row.image_url),
                    specs=PropertySpecs(
                        bedrooms=int(row.bedrooms) if not (row.bedrooms != row.bedrooms) else None,  # NaN check
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


@app.post("/api/recommendations", response_model=RecommendationResponse)
def get_recommendations(payload: RecommendationQuery) -> RecommendationResponse:
    if not payload.user_id and not payload.session_id:
        raise HTTPException(status_code=400, detail="Provide either user_id or session_id")

    try:
        if _recommender is None:
            logger.warning("Recommender unavailable; serving fallback recommendations")
            return RecommendationResponse(items=_fallback_recommendations(top_n=payload.num_results))

        items = _recommender.recommend(
            user_id=payload.user_id,
            session_id=payload.session_id,
            top_n=payload.num_results,
        )
        return RecommendationResponse(items=items)
    except Exception as exc:  # pragma: no cover - safeguard for production
        logger.exception("Failed to compute recommendations; serving fallback")
        return RecommendationResponse(items=_fallback_recommendations(top_n=payload.num_results))


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("app.main:app", host="0.0.0.0", port=int(os.getenv("PORT", 8000)), reload=True)

