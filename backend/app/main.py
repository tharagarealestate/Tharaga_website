from __future__ import annotations

import logging
import time
import os
from typing import Optional

from fastapi import FastAPI, HTTPException, Request, BackgroundTasks
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
from .config import Config
from typing import Optional
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
            {"property_id": "P1", "title": "Modern 2BHK in Anna Nagar", "description": "Bright, airy, balcony, near cafes", "location": "Anna Nagar, Chennai", "amenities": "gym pool parking", "image_url": "https://picsum.photos/seed/p1/800/600", "bedrooms": 2, "bathrooms": 2, "area_sqft": 950},
            {"property_id": "P2", "title": "Luxury Villa in Adyar", "description": "Gated community, private garden", "location": "Adyar, Chennai", "amenities": "garden parking clubhouse", "image_url": "https://picsum.photos/seed/p2/800/600", "bedrooms": 4, "bathrooms": 4, "area_sqft": 3200},
            {"property_id": "P3", "title": "Cozy Studio near T Nagar", "description": "Walk to metro, compact living", "location": "T Nagar, Chennai", "amenities": "metro access security", "image_url": "https://picsum.photos/seed/p3/800/600", "bedrooms": 1, "bathrooms": 1, "area_sqft": 450},
            {"property_id": "P4", "title": "Spacious 3BHK in Velachery", "description": "Premium fittings, large living room", "location": "Velachery, Chennai", "amenities": "gym clubhouse balcony", "image_url": "https://picsum.photos/seed/p4/800/600", "bedrooms": 3, "bathrooms": 3, "area_sqft": 1550},
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
async def verify_rera(payload: ReraVerifyRequest) -> ReraVerifyResponse:
    """
    Enhanced RERA verification with snapshot and hashing
    """
    from .verification.rera_service import RERAVerificationService
    from .supabase_client import supabase
    import base64
    
    rera_id = payload.rera_id.strip()
    if not re.match(r"^[A-Za-z0-9\-/]{5,}$", rera_id):
        return ReraVerifyResponse(
            verified=False,
            confidence=0.0,
            status="invalid_format",
            details={"rera_id": rera_id},
        )

    state = (payload.state or _guess_state_from_rera_id(rera_id) or "TN").upper()
    source_url = _STATE_TO_RERA_PORTAL.get(state)
    
    # Fetch RERA snapshot
    config = {'USE_SYNTHETIC_RERA': os.getenv('USE_SYNTHETIC_RERA', 'true').lower() == 'true'}
    rera_service = RERAVerificationService(config)
    snapshot = await rera_service.fetch_rera_snapshot(
        rera_id=rera_id,
        state=state,
        project_name=payload.project_name,
        developer_name=payload.promoter_name
    )
    
    # Store snapshot in database
    try:
        snapshot_record = {
            'rera_id': rera_id,
            'state': state,
            'project_name': snapshot.get('project_name'),
            'developer_name': snapshot.get('developer_name'),
            'registration_number': snapshot.get('parsed_fields', {}).get('registration_number') if isinstance(snapshot.get('parsed_fields'), dict) else None,
            'status': snapshot.get('status'),
            'expiry_date': snapshot.get('parsed_fields', {}).get('expiry_date') if isinstance(snapshot.get('parsed_fields'), dict) else None,
            'raw_html': snapshot['raw_html'],
            'parsed_fields': snapshot.get('parsed_fields'),
            'snapshot_hash': snapshot.get('snapshot_hash'),
            'source_url': source_url or snapshot.get('source_url'),
            'data_source': snapshot.get('data_source', 'UNKNOWN'),
            'collected_at': snapshot.get('collected_at'),
        }
        
        # Add property_id if provided
        if payload.property_id:
            snapshot_record['property_id'] = payload.property_id
        
        # Insert snapshot
        supabase.table('rera_snapshots').insert(snapshot_record).execute()
    except Exception as e:
        # Log error but don't fail the request
        logger.warning(f"Failed to store RERA snapshot: {e}")
    
    verified = snapshot.get('status', '').lower() in ('active', 'verified')
    confidence = 0.9 if verified and snapshot.get('data_source') != 'SYNTHETIC' else 0.7
    
    # Encode HTML as base64 for response
    html_evidence = base64.b64encode(snapshot['raw_html'].encode('utf-8')).decode('utf-8')
    
    return ReraVerifyResponse(
        verified=verified,
        confidence=confidence,
        status=snapshot.get('status', 'not_found'),
        source_url=source_url or snapshot.get('source_url'),
        details={
            "rera_id": rera_id,
            "project_name": snapshot.get('project_name'),
            "developer_name": snapshot.get('developer_name'),
            "snapshot_hash": snapshot.get('snapshot_hash'),
            "data_source": snapshot.get('data_source', 'UNKNOWN'),
        },
        evidence_html_base64=html_evidence,
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
    # Only Chennai is supported
    base_app_1y = {
        "chennai": 4.5,
    }.get(city, 4.5)  # Default to Chennai if not specified

    # Locality premium/discount (Chennai localities)
    locality_bonus = 0.0
    if payload.locality:
        loc = payload.locality.lower()
        if any(k in loc for k in ["anna nagar", "adyar", "besant nagar", "velachery", "porur", "omr", "t nagar", "nungambakkam"]):
            locality_bonus += 1.0

    price_app_1y = base_app_1y + locality_bonus
    price_app_3y = price_app_1y * 3 * 0.9  # compounding but conservative

    # Rent yield heuristic by city (Chennai only)
    rent_yield = {
        "chennai": 3.1,
    }.get(city, 3.1)  # Default to Chennai if not specified

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
        {"city":"Chennai","avg_psf":9000,"yoy":4.6,"inventory_months":7.1,"rent_yield_pct":3.1},
    ]
    return MarketTrendsResponse(items=items)


# ===========================================
# Document Upload & PDF Generation Endpoints
# ===========================================

@app.post("/api/properties/{property_id}/generate-audit-pdf")
async def generate_audit_pdf(property_id: str, request: Request):
    """
    Generate audit PDF for property
    Called from Next.js API route (Edge runtime can't use reportlab)
    """
    try:
        from .verification.document_service import DocumentVerificationService
        from .supabase_client import supabase
        
        body = await request.json()
        property_data = body.get('property', {})
        documents = body.get('documents', [])
        rera_snapshot = body.get('rera_snapshot')
        risk_flags = body.get('risk_flags', [])
        
        # Enrich documents with uploader names
        enriched_docs = []
        for doc in documents:
            uploader_id = doc.get('uploaded_by')
            uploader_name = 'Unknown'
            if uploader_id:
                user_resp = supabase.table('profiles').select('full_name').eq('id', uploader_id).maybe_single().execute()
                if user_resp.data:
                    uploader_name = user_resp.data.get('full_name', 'Unknown')
            
            enriched_docs.append({
                **doc,
                'uploader_name': uploader_name
            })
        
        # Generate PDF
        config = {}
        doc_service = DocumentVerificationService(config)
        pdf_bytes = await doc_service.generate_audit_pdf(
            property_id=property_id,
            property_data=property_data,
            documents=enriched_docs,
            rera_snapshot=rera_snapshot,
            risk_flags=risk_flags
        )
        
        from fastapi.responses import Response
        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={
                "Content-Disposition": f'attachment; filename="audit-{property_id}-{int(time.time())}.pdf"'
            }
        )
    except Exception as e:
        logger.error(f"PDF generation error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ===========================================
# Chennai Insights & ML Prediction Endpoints
# ===========================================

@app.post("/api/properties/{property_id}/collect-insights")
async def collect_insights(property_id: str, request: Request):
    """Collect Chennai locality insights"""
    try:
        from .insights.chennai_service import ChennaiInsightsService
        from .supabase_client import supabase
        
        body = await request.json()
        locality = body.get('locality', '')
        
        # Get property data
        prop_resp = supabase.table('properties').select('*').eq('id', property_id).single().execute()
        if not prop_resp.data:
            raise HTTPException(status_code=404, detail="Property not found")
        
        property_data = prop_resp.data
        
        # Collect insights
        config = {}
        insights_service = ChennaiInsightsService(config)
        insights = await insights_service.collect_insights(
            property_id=property_id,
            locality=locality or property_data.get('locality', ''),
            latitude=property_data.get('latitude'),
            longitude=property_data.get('longitude')
        )
        
        # Save to database
        supabase.table('chennai_locality_insights').upsert(insights).execute()
        
        return insights
    except Exception as e:
        logger.error(f"Insights collection error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/properties/{property_id}/predict-appreciation")
async def predict_appreciation(property_id: str):
    """Generate appreciation band prediction"""
    try:
        from .ml.appreciation_model import AppreciationBandModel
        from .insights.chennai_service import ChennaiInsightsService
        from .supabase_client import supabase
        
        # Get property data
        prop_resp = supabase.table('properties').select('*').eq('id', property_id).single().execute()
        if not prop_resp.data:
            raise HTTPException(status_code=404, detail="Property not found")
        
        property_data = prop_resp.data
        
        # Get locality insights
        insights_resp = supabase.table('chennai_locality_insights').select('*').eq('property_id', property_id).maybe_single().execute()
        locality_insights = insights_resp.data or {}
        
        # Generate prediction
        config = {}
        model = AppreciationBandModel(config)
        prediction = model.predict(
            property_data=property_data,
            locality_insights=locality_insights,
            infrastructure_data={}
        )
        
        # Save to database
        prediction['property_id'] = property_id
        prediction['predicted_at'] = datetime.now().isoformat()
        supabase.table('property_appreciation_bands').upsert(prediction).execute()
        
        return prediction
    except Exception as e:
        logger.error(f"Prediction error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/properties/{property_id}/compute-risk-flags")
async def compute_risk_flags(property_id: str):
    """Automatically compute and store risk flags for a property"""
    try:
        from .verification.risk_flags_service import RiskFlagsService
        from .supabase_client import supabase
        
        # Get property data
        prop_resp = supabase.table('properties').select('*').eq('id', property_id).single().execute()
        if not prop_resp.data:
            raise HTTPException(status_code=404, detail="Property not found")
        
        property_data = prop_resp.data
        
        # Get RERA snapshot (latest)
        rera_resp = supabase.table('rera_snapshots').select('*').eq('property_id', property_id).order('collected_at', desc=True).limit(1).maybe_single().execute()
        rera_snapshot = rera_resp.data if rera_resp.data else None
        
        # Get documents
        docs_resp = supabase.table('property_documents').select('*').eq('property_id', property_id).execute()
        documents = docs_resp.data or []
        
        # Get Chennai insights (if Chennai property)
        chennai_insights = None
        if property_data.get('city', '').upper() == 'CHENNAI':
            insights_resp = supabase.table('chennai_locality_insights').select('*').eq('property_id', property_id).maybe_single().execute()
            chennai_insights = insights_resp.data if insights_resp.data else None
        
        # Compute risk flags
        config = {}
        risk_service = RiskFlagsService(config)
        flags = await risk_service.detect_risk_flags(
            property_id=property_id,
            property_data=property_data,
            rera_snapshot=rera_snapshot,
            documents=documents,
            chennai_insights=chennai_insights
        )
        
        # Delete existing unresolved flags for this property (to avoid duplicates)
        supabase.table('property_risk_flags').delete().eq('property_id', property_id).eq('resolved', False).execute()
        
        # Insert new flags
        if flags:
            # Add property_id and timestamps to each flag
            flags_to_insert = []
            for flag in flags:
                flag_data = {
                    'property_id': property_id,
                    'flag_type': flag.get('flag_type'),
                    'severity': flag.get('severity'),
                    'title': flag.get('title'),
                    'description': flag.get('description'),
                    'actionable_steps': flag.get('actionable_steps'),
                    'source': flag.get('source', 'AUTOMATED'),
                    'flagged_at': datetime.now().isoformat(),
                    'resolved': False
                }
                flags_to_insert.append(flag_data)
            
            supabase.table('property_risk_flags').insert(flags_to_insert).execute()
        
        return {
            'success': True,
            'flags_count': len(flags),
            'flags': flags
        }
    except Exception as e:
        logger.error(f"Risk flags computation error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ===========================================
# Smart Distribution Engine Endpoints
# ===========================================

@app.post("/ai/distribution/distribute")
async def distribute_listing(request: Request):
    """Distribute a listing to qualified buyers"""
    try:
        from .ai.distribution_engine import SmartDistributionEngine
        
        body = await request.json()
        listing_id = body.get("listing_id")
        
        if not listing_id:
            raise HTTPException(status_code=400, detail="listing_id is required")
        
        engine = SmartDistributionEngine()
        result = await engine.distribute_listing(listing_id)
        
        if not result.get("success"):
            raise HTTPException(status_code=400, detail=result.get("error", "Distribution failed"))
        
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Distribution error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


# ===========================================
# AI Virtual Staging Endpoints
# ===========================================

@app.post("/ai/staging/process")
async def process_staging(request: Request, background_tasks: BackgroundTasks):
    """Process virtual staging job in background"""
    try:
        from .ai.virtual_staging import VirtualStagingService
        
        body = await request.json()
        job_id = body.get("job_id")
        original_image_url = body.get("original_image_url")
        style = body.get("style")
        room_type = body.get("room_type")
        
        if not all([job_id, original_image_url, style, room_type]):
            raise HTTPException(status_code=400, detail="Missing required fields: job_id, original_image_url, style, room_type")
        
        staging_service = VirtualStagingService()
        
        # Validate job exists
        job_response = staging_service.supabase.table("virtual_staging_jobs")\
            .select("*")\
            .eq("id", job_id)\
            .maybe_single()\
            .execute()
        
        if not job_response.data:
            raise HTTPException(status_code=404, detail="Job not found")
        
        # Process in background
        background_tasks.add_task(
            staging_service.stage_image,
            job_id,
            original_image_url,
            style,
            room_type
        )
        
        return {
            "success": True,
            "job_id": job_id,
            "message": "Staging job started. Subscribe to real-time progress updates."
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Staging processing error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


# ===========================================
# SmartScore ML Service Endpoints
# ===========================================

try:
    import sys
    from pathlib import Path
    # Add backend directory to path for services imports
    backend_dir = Path(__file__).parent.parent
    if str(backend_dir) not in sys.path:
        sys.path.insert(0, str(backend_dir))
    
    from services.ml_service_routes import router as ml_router
    app.include_router(ml_router)
    logger.info("ML Service routes included successfully")
except Exception as e:
    logger.warning(f"ML Service routes not available: {e}")
    ml_router = None

# ===========================================
# Workflow Engine Service Endpoints
# ===========================================

try:
    import sys
    from pathlib import Path
    # Add backend directory to path for services imports
    backend_dir = Path(__file__).parent.parent
    if str(backend_dir) not in sys.path:
        sys.path.insert(0, str(backend_dir))
    
    from services.workflow_routes import router as workflow_router
    app.include_router(workflow_router)
    logger.info("Workflow Engine routes included successfully")
except Exception as e:
    logger.warning(f"Workflow Engine routes not available: {e}")
    workflow_router = None

# ===========================================
# Document Processor Service Endpoints
# ===========================================

try:
    import sys
    from pathlib import Path
    backend_dir = Path(__file__).parent.parent
    if str(backend_dir) not in sys.path:
        sys.path.insert(0, str(backend_dir))
    
    from services.document_routes import router as document_router
    app.include_router(document_router)
    logger.info("Document Processor routes included successfully")
except Exception as e:
    logger.warning(f"Document Processor routes not available: {e}")
    document_router = None

# ===========================================
# AI Content Generator Service Endpoints
# ===========================================

try:
    import sys
    from pathlib import Path
    backend_dir = Path(__file__).parent.parent
    if str(backend_dir) not in sys.path:
        sys.path.insert(0, str(backend_dir))
    
    from services.ai_content_routes import router as ai_content_router
    app.include_router(ai_content_router)
    logger.info("AI Content Generator routes included successfully")
except Exception as e:
    logger.warning(f"AI Content Generator routes not available: {e}")
    ai_content_router = None

# ===========================================
# Recommendation Engine Service Endpoints
# ===========================================

try:
    import sys
    from pathlib import Path
    backend_dir = Path(__file__).parent.parent
    if str(backend_dir) not in sys.path:
        sys.path.insert(0, str(backend_dir))
    
    from services.recommendation_routes import router as recommendation_router
    app.include_router(recommendation_router)
    logger.info("Recommendation Engine routes included successfully")
except Exception as e:
    logger.warning(f"Recommendation Engine routes not available: {e}")
    recommendation_router = None

# ===========================================
# Listing Optimizer Service Endpoints
# ===========================================

try:
    import sys
    from pathlib import Path
    backend_dir = Path(__file__).parent.parent
    if str(backend_dir) not in sys.path:
        sys.path.insert(0, str(backend_dir))
    
    from services.optimizer_routes import router as optimizer_router
    app.include_router(optimizer_router)
    logger.info("Listing Optimizer routes included successfully")
except Exception as e:
    logger.warning(f"Listing Optimizer routes not available: {e}")
    optimizer_router = None

# ===========================================
# Webhook Manager Service Endpoints
# ===========================================

try:
    import sys
    from pathlib import Path
    backend_dir = Path(__file__).parent.parent
    if str(backend_dir) not in sys.path:
        sys.path.insert(0, str(backend_dir))
    
    from services.webhook_routes import router as webhook_router
    app.include_router(webhook_router)
    logger.info("Webhook Manager routes included successfully")
except Exception as e:
    logger.warning(f"Webhook Manager routes not available: {e}")
    webhook_router = None

# ===========================================
# Seller Optimization Engine Service Endpoints
# ===========================================

try:
    import sys
    from pathlib import Path
    backend_dir = Path(__file__).parent.parent
    if str(backend_dir) not in sys.path:
        sys.path.insert(0, str(backend_dir))
    
    from services.seller_optimizer_routes import router as seller_optimizer_router
    app.include_router(seller_optimizer_router)
    logger.info("Seller Optimization Engine routes included successfully")
except Exception as e:
    logger.warning(f"Seller Optimization Engine routes not available: {e}")
    seller_optimizer_router = None

# ===========================================
# Social Media Distribution Service Endpoints
# ===========================================
try:
    import sys
    from pathlib import Path
    backend_dir = Path(__file__).parent.parent
    if str(backend_dir) not in sys.path:
        sys.path.insert(0, str(backend_dir))
    
    from services.social_media_routes import router as social_media_router
    app.include_router(social_media_router)
    logger.info("Social Media routes included successfully")
except Exception as e:
    logger.warning(f"Social Media routes not available: {e}")
    social_media_router = None

# ===========================================
# Partner Portal Syndication Service Endpoints
# ===========================================
try:
    import sys
    from pathlib import Path
    backend_dir = Path(__file__).parent.parent
    if str(backend_dir) not in sys.path:
        sys.path.insert(0, str(backend_dir))
    
    from services.partner_portals_routes import router as partner_portals_router
    app.include_router(partner_portals_router)
    logger.info("Partner Portals routes included successfully")
except Exception as e:
    logger.warning(f"Partner Portals routes not available: {e}")
    partner_portals_router = None

# Note: Old data collection endpoints removed - replaced with Chennai Phase-1 features 
if __name__ == "__main__":
    import uvicorn

    uvicorn.run("app.main:app", host="0.0.0.0", port=int(os.getenv("PORT", 8000)), reload=True)

