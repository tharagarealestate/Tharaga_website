"""
Module 3: SmartScore ML Service — Google Cloud Run
Standalone FastAPI app for lead scoring.
Deploy: asia-south1, min-instances=1

Score formula:
  Budget (0-30) + Timeline (0-30) + Behavioral (0-25) + Intent (0-15) = 0-100
  Lion ≥70, Monkey 40-69, Dog <40
"""
from __future__ import annotations

import json
import logging
import os
from datetime import datetime, timezone
from typing import Any

import joblib
import httpx
import numpy as np
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Tharaga SmartScore", version="1.0.0")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")
MODEL_PATH = os.getenv("MODEL_PATH", "/app/model.pkl")

SUPABASE_HEADERS = {
    "apikey": SUPABASE_SERVICE_ROLE_KEY,
    "Authorization": f"Bearer {SUPABASE_SERVICE_ROLE_KEY}",
    "Content-Type": "application/json",
}

# Load model if available
_model = None
try:
    _model = joblib.load(MODEL_PATH)
    logger.info("Loaded SmartScore model from %s", MODEL_PATH)
except Exception:
    logger.info("No model.pkl found — using rule-based scoring")


class ScoreRequest(BaseModel):
    lead_id: str


class ScoreResponse(BaseModel):
    lead_id: str
    smartscore: int
    classification: str
    score_breakdown: dict
    scored_at: str


def _budget_score(budget_lakhs: float | None) -> tuple[int, str]:
    if not budget_lakhs:
        return 0, "unknown"
    if budget_lakhs >= 200:
        return 30, "luxury"
    if budget_lakhs >= 100:
        return 25, "premium"
    if budget_lakhs >= 60:
        return 18, "mid"
    if budget_lakhs >= 30:
        return 10, "affordable"
    return 5, "budget"


def _timeline_score(months: int | None) -> tuple[int, str]:
    if months is None:
        return 12, "unknown"
    if months <= 1:
        return 30, "immediate"
    if months <= 3:
        return 25, "urgent"
    if months <= 6:
        return 18, "moderate"
    if months <= 12:
        return 10, "planning"
    return 5, "long_term"


def _behavioral_score(signals: list[dict]) -> tuple[int, str]:
    """Score based on behavioral signals from behavioral_signals table."""
    score = 0
    scroll_depths = [s.get("signal_value", {}).get("percent", 0) for s in signals if s.get("signal_type") == "scroll_depth"]
    property_views = sum(1 for s in signals if s.get("signal_type") == "property_view")
    cta_clicks = sum(1 for s in signals if s.get("signal_type") == "cta_click")
    time_on_pages = [s.get("signal_value", {}).get("seconds", 0) for s in signals if s.get("signal_type") in ("time_on_page", "exit")]

    max_scroll = max(scroll_depths, default=0)
    avg_time = sum(time_on_pages) / max(len(time_on_pages), 1)

    score += min(int(max_scroll / 100 * 10), 10)  # 0-10 from scroll
    score += min(property_views * 3, 8)            # 0-8 from property views
    score += min(cta_clicks * 2, 4)                # 0-4 from CTA clicks
    score += 3 if avg_time > 120 else (1 if avg_time > 30 else 0)  # 0-3 from time

    label = "high" if score >= 20 else "medium" if score >= 10 else "low"
    return min(score, 25), label


def _intent_score(purpose: str | None, loan_required: bool | None, source: str | None) -> tuple[int, str]:
    score = 0
    intent_label = "unknown"
    if purpose == "self_use":
        score += 8; intent_label = "buyer"
    elif purpose == "investment":
        score += 6; intent_label = "investor"
    elif purpose == "rental":
        score += 4; intent_label = "rental"
    if loan_required is True:
        score += 4  # Has urgency + financial intent
    # Source quality
    source_q = {"meta_lead_ads": 3, "google_ads": 3, "referral": 2, "organic": 2, "whatsapp": 1}.get(source or "", 1)
    score += source_q
    return min(score, 15), intent_label


def rule_based_score(lead: dict, signals: list[dict]) -> dict:
    """Calculate SmartScore using rule-based system."""
    bs, budget_label = _budget_score(lead.get("budget"))
    ts, timeline_label = _timeline_score(lead.get("timeline_months"))
    beh_s, beh_label = _behavioral_score(signals)
    int_s, intent_label = _intent_score(lead.get("purpose"), lead.get("loan_required"), lead.get("source"))

    total = bs + ts + beh_s + int_s

    classification = "lion" if total >= 70 else "monkey" if total >= 40 else "dog"

    return {
        "smartscore": total,
        "classification": classification,
        "score_breakdown": {
            "budget": {"score": bs, "max": 30, "label": budget_label, "value_lakhs": lead.get("budget")},
            "timeline": {"score": ts, "max": 30, "label": timeline_label, "months": lead.get("timeline_months")},
            "behavioral": {"score": beh_s, "max": 25, "label": beh_label, "signal_count": len(signals)},
            "intent": {"score": int_s, "max": 15, "label": intent_label, "purpose": lead.get("purpose")},
        },
    }


def ml_score(lead: dict, signals: list[dict]) -> dict | None:
    """Use trained ML model if available."""
    if not _model:
        return None
    try:
        features = np.array([[
            lead.get("budget") or 0,
            lead.get("timeline_months") or 12,
            1 if lead.get("purpose") == "self_use" else 0,
            1 if lead.get("loan_required") else 0,
            len(signals),
            sum(1 for s in signals if s.get("signal_type") == "property_view"),
        ]])
        score = int(_model.predict(features)[0])
        classification = "lion" if score >= 70 else "monkey" if score >= 40 else "dog"
        return {"smartscore": min(max(score, 0), 100), "classification": classification, "score_breakdown": {}}
    except Exception as exc:
        logger.warning("ML scoring failed: %s", exc)
        return None


@app.get("/health")
def health():
    return {"status": "ok", "model": "ml" if _model else "rule_based", "time": datetime.now(timezone.utc).isoformat()}


@app.post("/score", response_model=ScoreResponse)
async def score_lead(req: ScoreRequest) -> ScoreResponse:
    """Score a lead by fetching data from Supabase."""
    async with httpx.AsyncClient(timeout=15) as client:
        # Fetch lead
        lead_resp = await client.get(
            f"{SUPABASE_URL}/rest/v1/leads",
            headers=SUPABASE_HEADERS,
            params={"id": f"eq.{req.lead_id}", "select": "*", "limit": "1"},
        )
        leads = lead_resp.json()
        if not leads or not isinstance(leads, list):
            return ScoreResponse(lead_id=req.lead_id, smartscore=0, classification="dog",
                                 score_breakdown={}, scored_at=datetime.now(timezone.utc).isoformat())

        lead = leads[0]

        # Fetch behavioral signals for this session
        session_id = None
        sig_resp = await client.get(
            f"{SUPABASE_URL}/rest/v1/behavioral_signals",
            headers=SUPABASE_HEADERS,
            params={"lead_id": f"eq.{req.lead_id}", "select": "*", "limit": "50"},
        )
        signals = sig_resp.json() if isinstance(sig_resp.json(), list) else []

        # Score: try ML first, fallback to rule-based
        result = ml_score(lead, signals) or rule_based_score(lead, signals)

        # Persist scores back to leads table
        await client.patch(
            f"{SUPABASE_URL}/rest/v1/leads?id=eq.{req.lead_id}",
            headers=SUPABASE_HEADERS,
            json={
                "smartscore": result["smartscore"],
                "classification": result["classification"],
                "score_breakdown": result["score_breakdown"],
                "updated_at": datetime.now(timezone.utc).isoformat(),
            },
        )

    return ScoreResponse(
        lead_id=req.lead_id,
        smartscore=result["smartscore"],
        classification=result["classification"],
        score_breakdown=result["score_breakdown"],
        scored_at=datetime.now(timezone.utc).isoformat(),
    )


@app.post("/score/batch")
async def score_batch(lead_ids: list[str]) -> list[ScoreResponse]:
    """Score multiple leads (called by cron or N8N)."""
    import asyncio
    results = await asyncio.gather(*[score_lead(ScoreRequest(lead_id=lid)) for lid in lead_ids])
    return list(results)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=int(os.getenv("PORT", 8080)))
