from __future__ import annotations

import logging
import time
import os
from typing import Optional

from fastapi import FastAPI, HTTPException, Request
from prometheus_client import Counter, Histogram, generate_latest, CONTENT_TYPE_LATEST
from fastapi.responses import Response, JSONResponse
from fastapi.middleware.cors import CORSMiddleware

from .schemas import (
    RecommendationQuery,
    RecommendationResponse,
    RecommendationItem,
    PropertySpecs,
    ReraVerifyRequest,
    ReraVerifyResponse,
    TitleVerifyRequest,
    TitleVerifyResponse,
    TitleAnchorRequest,
    TitleAnchorResponse,
    FraudScoreRequest,
    FraudScoreResponse,
    PredictiveAnalyticsRequest,
    PredictiveAnalyticsResponse,
    MarketTrendsResponse,
    BatchInteractionRequest,
    BatchInteractionResponse,
)
import re
import hashlib
import base64
import time as _time
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
REQUEST_COUNT = Counter("http_requests_total", "Total HTTP requests", ["method", "path", "status"])
REQUEST_LATENCY = Histogram("http_request_duration_seconds", "HTTP request latency", ["method", "path"])

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
    start = time.time()
    try:
        response = await call_next(request)
    except Exception:
        logger.exception("request_failed", extra={
            "path": request.url.path,
            "method": request.method,
            "request_id": request_id,
        })
        REQUEST_COUNT.labels(method=request.method, path=request.url.path, status="500").inc()
        raise
    response.headers["x-request-id"] = request_id or ""
    logger.info("request_completed", extra={
        "path": request.url.path,
        "method": request.method,
        "status_code": getattr(response, 'status_code', None),
        "request_id": request_id,
    })
    REQUEST_COUNT.labels(method=request.method, path=request.url.path, status=str(getattr(response, 'status_code', ''))).inc()
    REQUEST_LATENCY.labels(method=request.method, path=request.url.path).observe(time.time() - start)
    return response


@app.get("/metrics")
def metrics() -> Response:
    if os.getenv("ENABLE_METRICS", "false").lower() != "true":
        raise HTTPException(status_code=404, detail="Not Found")
    data = generate_latest()
    return Response(content=data, media_type=CONTENT_TYPE_LATEST)


@app.post("/api/__vitals")
async def web_vitals(_: Request) -> JSONResponse:
    # No-op collector endpoint to avoid 404s; can be wired to analytics later
    return JSONResponse({"ok": True})


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


@app.post("/api/interactions", response_model=BatchInteractionResponse)
def ingest_interactions(payload: BatchInteractionRequest) -> BatchInteractionResponse:
    """Collect user interactions for learning.

    Production would persist to DB or queue; here we upsert into the in-memory
    interactions dataframe and warm-retrain the recommender.
    """
    global _interactions_df, _recommender
    accepted = 0
    try:
        import pandas as pd
        rows = []
        for ev in payload.events:
            if not ev.user_id or not ev.property_id or not ev.event:
                continue
            rows.append({
                "user_id": ev.user_id,
                "property_id": ev.property_id,
                "event": ev.event,
                "value": float(ev.value or 1.0),
            })
        if not rows:
            return BatchInteractionResponse(ok=True, accepted=0)
        df_new = pd.DataFrame(rows)
        _interactions_df = pd.concat([_interactions_df, df_new], ignore_index=True)
        accepted = len(rows)
        # Warm retrain (cheap SVD + TF-IDF; acceptable for small data)
        try:
            if HybridRecommender is not None:
                rec = HybridRecommender(properties_df=_properties_df, interactions_df=_interactions_df)
                rec.fit()
                _recommender = rec
        except Exception:
            logger.exception("Warm retrain failed; keeping previous model")
        return BatchInteractionResponse(ok=True, accepted=accepted)
    except Exception:
        logger.exception("Failed to ingest interactions")
        return BatchInteractionResponse(ok=False, accepted=accepted)


# ----------------------- Anti-fraud & verification -----------------------

_STATE_TO_RERA_PORTAL: dict[str, str] = {
    "KA": "https://rera.karnataka.gov.in/",
    "TN": "https://www.tnrera.in/",
    "MH": "https://maharera.mahaonline.gov.in/",
    "DL": "https://rera.delhi.gov.in/",
    "GJ": "https://gujrera.gujarat.gov.in/",
}


def _guess_state_from_rera_id(rera_id: str) -> str | None:
    up = rera_id.upper()
    for st in _STATE_TO_RERA_PORTAL.keys():
        if up.startswith(st):
            return st
    return None


@app.post("/api/verify/rera", response_model=ReraVerifyResponse)
def verify_rera(payload: ReraVerifyRequest) -> ReraVerifyResponse:
    # Basic validation heuristics; real integration would screen-scrape or API call to state portals
    rera_id = payload.rera_id.strip()
    if not re.match(r"^[A-Za-z0-9\-/]{5,}$", rera_id):
        return ReraVerifyResponse(
            verified=False,
            confidence=0.0,
            status="invalid_format",
            details={"rera_id": rera_id},
        )

    state = (payload.state or _guess_state_from_rera_id(rera_id) or "").upper()
    source_url = _STATE_TO_RERA_PORTAL.get(state)
    hints = {k: v for k, v in {
        "project_name": payload.project_name or "",
        "promoter_name": payload.promoter_name or "",
        "state": state,
    }.items() if v}

    # Heuristic: consider verified if looks well-formed and state recognized
    verified = bool(state) and len(rera_id) >= 8
    confidence = 0.9 if verified else 0.5
    status = "verified" if verified else "not_found"
    # Simulate evidence snapshot
    html_evidence = f"<html><body>RERA {rera_id} status: {status} ({state})</body></html>".encode("utf-8")
    return ReraVerifyResponse(
        verified=verified,
        confidence=confidence,
        status=status,
        source_url=source_url,
        details={"rera_id": rera_id, **hints},
        evidence_html_base64=base64.b64encode(html_evidence).decode("ascii"),
        queried_at=_time.time(),
    )


@app.post("/api/verify/title", response_model=TitleVerifyResponse)
def verify_title(payload: TitleVerifyRequest) -> TitleVerifyResponse:
    doc_hash = payload.document_hash.strip().lower()
    # Accept hex-like hash or base64-like; here we check hex length
    is_hex = bool(re.match(r"^[0-9a-f]{32,}$", doc_hash))
    # Deterministic pseudo tx hash to enable traceability without on-chain calls
    tx_hash = "0x" + hashlib.sha256(doc_hash.encode("utf-8")).hexdigest()
    explorer = None
    network = (payload.network or "").lower()
    if network in {"ethereum", "eth"}:
        explorer = f"https://etherscan.io/tx/{tx_hash}"
    elif network in {"polygon", "matic"}:
        explorer = f"https://polygonscan.com/tx/{tx_hash}"

    verified = is_hex and len(doc_hash) >= 64
    confidence = 0.85 if verified else 0.4
    return TitleVerifyResponse(
        verified=verified,
        confidence=confidence,
        transaction_hash=tx_hash,
        explorer_url=explorer,
        details={
            "property_id": payload.property_id,
            "network": payload.network or "",
            "registry_address": payload.registry_address or "",
        },
        proof_bundle={"hash": doc_hash, "algo": "sha256", "issued_at": str(_time.time())},
    )


@app.post("/api/verify/title/anchor", response_model=TitleAnchorResponse)
def anchor_title(payload: TitleAnchorRequest) -> TitleAnchorResponse:
    h = payload.document_hash.strip().lower()
    ok = bool(re.match(r"^[0-9a-f]{64}$", h))
    tx = "0x" + hashlib.sha256((h+":anchor").encode("utf-8")).hexdigest()
    explorer = None
    network = (payload.network or "").lower()
    if network in {"ethereum", "eth"}:
        explorer = f"https://etherscan.io/tx/{tx}"
    elif network in {"polygon", "matic"}:
        explorer = f"https://polygonscan.com/tx/{tx}"
    return TitleAnchorResponse(anchored=ok, transaction_hash=tx, explorer_url=explorer, proof_bundle={"hash": h, "algo":"sha256"})


@app.post("/api/fraud/score", response_model=FraudScoreResponse)
def fraud_score(payload: FraudScoreRequest) -> FraudScoreResponse:
    score = 50
    reasons: list[str] = []

    # Pricing anomalies
    try:
        if payload.price_inr and payload.sqft and payload.sqft > 0:
            ppsf = float(payload.price_inr) / float(payload.sqft)
            if ppsf < 2500:
                score += 20; reasons.append("Price per sqft unusually low for market")
            elif ppsf > 25000:
                score += 10; reasons.append("Price per sqft unusually high")
    except Exception:
        pass

    # Missing compliance
    if not payload.has_rera_id:
        score += 15; reasons.append("Missing RERA registration")
    if not payload.has_title_docs:
        score += 15; reasons.append("Missing title documents")

    # Seller heuristics
    if (payload.seller_type or "").lower() == "broker":
        score += 5; reasons.append("Listed by broker; verify mandate and documents")

    # Listing recency: older listings can indicate stale or suspicious posts
    if payload.listed_days_ago is not None:
        if payload.listed_days_ago > 120:
            score += 5; reasons.append("Listing is older than 120 days")

    score = max(0, min(100, score))
    if score >= 70:
        level = "high"
    elif score >= 40:
        level = "medium"
    else:
        level = "low"

    actions = [
        "Upload title deed for verification",
        "Provide latest EC and tax receipts",
        "Verify RERA registration and promoter details",
        "On-site inspection or trusted partner walkthrough",
    ]
    return FraudScoreResponse(risk_score=score, risk_level=level, reasons=reasons, recommended_actions=actions)


@app.post("/api/analytics/predict", response_model=PredictiveAnalyticsResponse)
def predictive_analytics(payload: PredictiveAnalyticsRequest) -> PredictiveAnalyticsResponse:
    # Extremely light-weight heuristic model; replace with real ML later
    city = (payload.city or "").lower()
    base_app_1y = {
        "bengaluru": 6.0,
        "bangalore": 6.0,
        "mumbai": 5.0,
        "pune": 5.5,
        "chennai": 4.5,
        "hyderabad": 6.5,
        "delhi": 4.0,
    }.get(city, 4.0)

    # Locality premium/discount
    locality_bonus = 0.0
    if payload.locality:
        loc = payload.locality.lower()
        if any(k in loc for k in ["indiranagar", "koramangala", "whitefield", "bandra", "powai", "adyar"]):
            locality_bonus += 1.0

    price_app_1y = base_app_1y + locality_bonus
    price_app_3y = price_app_1y * 3 * 0.9  # compounding but conservative

    # Rent yield heuristic by city
    rent_yield = {
        "bengaluru": 3.8,
        "bangalore": 3.8,
        "mumbai": 3.0,
        "pune": 3.2,
        "chennai": 3.1,
        "hyderabad": 3.4,
        "delhi": 2.8,
    }.get(city, 3.0)

    benchmarks = {
        "city_avg_appreciation_1y_pct": base_app_1y,
        "city_avg_rent_yield_pct": rent_yield,
    }
    notes = [
        "Heuristic estimate; plug in real market data for production",
        "Locality bonuses applied for prime neighborhoods",
    ]
    return PredictiveAnalyticsResponse(
        price_appreciation_1y_pct=round(price_app_1y, 2),
        price_appreciation_3y_pct=round(price_app_3y, 2),
        expected_rent_yield_pct=round(rent_yield, 2),
        benchmarks=benchmarks,
        notes=notes,
    )


@app.get("/api/market/trends", response_model=MarketTrendsResponse)
def market_trends() -> MarketTrendsResponse:
    items = [
        {"city":"Bengaluru","avg_psf":9800,"yoy":6.1,"inventory_months":6.5,"rent_yield_pct":3.8},
        {"city":"Mumbai","avg_psf":28700,"yoy":5.0,"inventory_months":8.2,"rent_yield_pct":3.0},
        {"city":"Chennai","avg_psf":9000,"yoy":4.6,"inventory_months":7.1,"rent_yield_pct":3.1},
    ]
    return MarketTrendsResponse(items=items) 
if __name__ == "__main__":
    import uvicorn

    uvicorn.run("app.main:app", host="0.0.0.0", port=int(os.getenv("PORT", 8000)), reload=True)

