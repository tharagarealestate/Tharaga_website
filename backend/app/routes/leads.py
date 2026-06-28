"""
Module 2: Lead Ingest Engine
FastAPI route for capturing leads with:
- Phone dedup by phone_normalized (E.164)
- Meta CAPI server-side event firing
- SmartScore trigger (async)
- N8N welcome workflow trigger
- Meta Lead Ads webhook handler
"""
from __future__ import annotations

import asyncio
import hashlib
import logging
import os
import re
import time
import uuid
from datetime import datetime, timezone
from typing import Any

import httpx
from fastapi import APIRouter, BackgroundTasks, HTTPException, Request
from pydantic import BaseModel, field_validator

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/leads", tags=["leads"])

# ── env ──────────────────────────────────────────────────────────────────────
SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")
META_ACCESS_TOKEN = os.getenv("META_ACCESS_TOKEN", "")
META_PIXEL_ID = os.getenv("META_PIXEL_ID", "")
META_TEST_EVENT_CODE = os.getenv("META_TEST_EVENT_CODE", "")  # for testing
# N8N_WEBHOOK_NEW_LEAD = os.getenv("N8N_WEBHOOK_NEW_LEAD", "")  # DISCONNECTED: Ultra Automation handles this
SMARTSCORE_URL = os.getenv("SMARTSCORE_SERVICE_URL", "http://localhost:8001")

SUPABASE_HEADERS = {
    "apikey": SUPABASE_SERVICE_ROLE_KEY,
    "Authorization": f"Bearer {SUPABASE_SERVICE_ROLE_KEY}",
    "Content-Type": "application/json",
    "Prefer": "return=representation",
}


# ── helpers ───────────────────────────────────────────────────────────────────
def normalize_phone(raw: str) -> str | None:
    """Normalize to E.164 +91XXXXXXXXXX."""
    if not raw:
        return None
    cleaned = re.sub(r"[^\d+]", "", raw)
    if re.fullmatch(r"\+91\d{10}", cleaned):
        return cleaned
    if re.fullmatch(r"\d{10}", cleaned):
        return f"+91{cleaned}"
    if re.fullmatch(r"91\d{10}", cleaned):
        return f"+{cleaned}"
    return None


def sha256(value: str) -> str:
    return hashlib.sha256(value.strip().lower().encode()).hexdigest()


def _supabase_rest(path: str) -> str:
    return f"{SUPABASE_URL}/rest/v1/{path}"


# ── Pydantic models ───────────────────────────────────────────────────────────
class LeadIngestPayload(BaseModel):
    name: str
    phone: str
    email: str | None = None
    message: str | None = None
    property_id: str | None = None
    builder_id: str | None = None
    # UTM / attribution
    utm_source: str | None = None
    utm_medium: str | None = None
    utm_campaign: str | None = None
    utm_content: str | None = None
    utm_term: str | None = None
    fbclid: str | None = None
    gclid: str | None = None
    fbc: str | None = None
    fbp: str | None = None
    event_id: str | None = None   # browser pixel event ID for CAPI dedup
    # Qualification (from form or WhatsApp)
    budget: float | None = None   # lakhs
    preferred_location: str | None = None
    timeline_months: int | None = None
    property_type_interest: str | None = None
    purpose: str | None = None    # self_use | investment | rental
    loan_required: bool | None = None

    @field_validator("phone")
    @classmethod
    def validate_phone(cls, v: str) -> str:
        normalized = normalize_phone(v)
        if not normalized:
            raise ValueError(f"Invalid phone number: {v}. Expected 10-digit Indian number.")
        return v  # store original; DB trigger normalizes


class LeadIngestResponse(BaseModel):
    lead_id: str
    status: str          # created | deduplicated
    smartscore: int | None = None
    classification: str | None = None


# ── background tasks ──────────────────────────────────────────────────────────
async def _fire_meta_capi_lead(lead: dict[str, Any]) -> None:
    """Fire Meta Conversions API Lead event server-side."""
    if not META_ACCESS_TOKEN or not META_PIXEL_ID:
        return
    try:
        user_data: dict[str, Any] = {}
        if lead.get("email_hash"):
            user_data["em"] = [lead["email_hash"]]
        if lead.get("phone_hash"):
            user_data["ph"] = [lead["phone_hash"]]
        if lead.get("fbc"):
            user_data["fbc"] = lead["fbc"]
        if lead.get("fbp"):
            user_data["fbp"] = lead["fbp"]

        payload: dict[str, Any] = {
            "data": [{
                "event_name": "Lead",
                "event_time": int(time.time()),
                "event_id": lead.get("event_id") or lead["id"],
                "action_source": "website",
                "user_data": user_data,
                "custom_data": {
                    "content_name": lead.get("preferred_location", "Chennai Property"),
                    "currency": "INR",
                    "value": (lead.get("budget") or 0) * 100000,  # lakhs → INR
                },
            }]
        }
        if META_TEST_EVENT_CODE:
            payload["test_event_code"] = META_TEST_EVENT_CODE

        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.post(
                f"https://graph.facebook.com/v19.0/{META_PIXEL_ID}/events",
                params={"access_token": META_ACCESS_TOKEN},
                json=payload,
            )
            if resp.status_code != 200:
                logger.warning("CAPI Lead event failed: %s", resp.text)
            else:
                # Mark capi_lead_fired in DB
                await client.patch(
                    _supabase_rest(f"leads?id=eq.{lead['id']}"),
                    headers=SUPABASE_HEADERS,
                    json={"capi_lead_fired": True},
                )
    except Exception as exc:
        logger.error("CAPI fire error: %s", exc)


# ── N8N new-lead trigger — DISCONNECTED (Ultra Automation is active instead) ──
# async def _trigger_n8n_new_lead(lead: dict[str, Any]) -> None:
#     if not N8N_WEBHOOK_NEW_LEAD:
#         return
#     try:
#         async with httpx.AsyncClient(timeout=10) as client:
#             await client.post(N8N_WEBHOOK_NEW_LEAD, json={"lead": lead})
#     except Exception as exc:
#         logger.warning("N8N trigger failed: %s", exc)
async def _trigger_n8n_new_lead(lead: dict[str, Any]) -> None:
    """Stub — N8N disconnected. Ultra Automation pipeline handles lead events."""
    return  # noqa: intentional no-op


async def _trigger_smartscore(lead_id: str) -> None:
    """Call SmartScore service to score this lead asynchronously."""
    await asyncio.sleep(2)  # small delay to ensure DB write is committed
    try:
        async with httpx.AsyncClient(timeout=30) as client:
            resp = await client.post(
                f"{SMARTSCORE_URL}/score",
                json={"lead_id": lead_id},
            )
            if resp.status_code == 200:
                data = resp.json()
                # Patch lead with score result
                await client.patch(
                    _supabase_rest(f"leads?id=eq.{lead_id}"),
                    headers=SUPABASE_HEADERS,
                    json={
                        "smartscore": data.get("smartscore", 0),
                        "classification": data.get("classification"),
                        "score_breakdown": data.get("score_breakdown", {}),
                    },
                )
    except Exception as exc:
        logger.warning("SmartScore trigger failed for %s: %s", lead_id, exc)


async def _trigger_distribution(lead_id: str) -> None:
    """Trigger lead distribution 30s after creation."""
    await asyncio.sleep(30)
    try:
        async with httpx.AsyncClient(timeout=15) as client:
            await client.post(
                _supabase_rest(f"rpc/distribute_lead"),
                headers=SUPABASE_HEADERS,
                json={"p_lead_id": lead_id},
            )
    except Exception as exc:
        logger.warning("Distribution trigger failed for %s: %s", lead_id, exc)


# ── main endpoint ─────────────────────────────────────────────────────────────
@router.post("/ingest", response_model=LeadIngestResponse)
async def ingest_lead(
    payload: LeadIngestPayload,
    background_tasks: BackgroundTasks,
) -> LeadIngestResponse:
    """
    Ingest a new lead from any source (web form, API, Meta Lead Ads).
    Deduplicates by phone_normalized (E.164).
    """
    phone_normalized = normalize_phone(payload.phone)
    if not phone_normalized:
        raise HTTPException(status_code=422, detail="Invalid phone number")

    phone_hash = sha256(phone_normalized)
    email_hash = sha256(payload.email) if payload.email else None

    # ── Dedup check ───────────────────────────────────────────────────────────
    async with httpx.AsyncClient(timeout=10) as client:
        dedup_resp = await client.get(
            _supabase_rest("leads"),
            headers=SUPABASE_HEADERS,
            params={
                "phone_normalized": f"eq.{phone_normalized}",
                "select": "id,smartscore,classification",
                "limit": "1",
            },
        )
        existing = dedup_resp.json()
        if existing and isinstance(existing, list) and len(existing) > 0:
            ex = existing[0]
            return LeadIngestResponse(
                lead_id=ex["id"],
                status="deduplicated",
                smartscore=ex.get("smartscore"),
                classification=ex.get("classification"),
            )

        # ── Build lead record ─────────────────────────────────────────────────
        lead_data: dict[str, Any] = {
            "id": str(uuid.uuid4()),
            "name": payload.name,
            "phone": payload.phone,
            "phone_normalized": phone_normalized,
            "phone_hash": phone_hash,
            "email_hash": email_hash,
            "source": payload.utm_source or "organic",
            "utm_source": payload.utm_source,
            "utm_medium": payload.utm_medium,
            "utm_campaign": payload.utm_campaign,
            "utm_content": payload.utm_content,
            "utm_term": payload.utm_term,
            "fbclid": payload.fbclid,
            "gclid": payload.gclid,
            "fbc": payload.fbc,
            "fbp": payload.fbp,
            "event_id": payload.event_id,
            "message": payload.message,
            "status": "new",
            "smartscore": 0,
        }
        if payload.email:
            lead_data["email"] = payload.email
        if payload.property_id:
            lead_data["property_id"] = payload.property_id
        if payload.builder_id:
            lead_data["builder_id"] = payload.builder_id
        if payload.budget is not None:
            lead_data["budget"] = payload.budget
        if payload.preferred_location:
            lead_data["preferred_location"] = payload.preferred_location
        if payload.timeline_months is not None:
            lead_data["timeline_months"] = payload.timeline_months
        if payload.property_type_interest:
            lead_data["property_type_interest"] = payload.property_type_interest
        if payload.purpose:
            lead_data["purpose"] = payload.purpose
        if payload.loan_required is not None:
            lead_data["loan_required"] = payload.loan_required

        # Initial rule-based SmartScore before ML kicks in
        initial_score = _rule_based_initial_score(payload)
        lead_data["smartscore"] = initial_score
        lead_data["classification"] = _classify(initial_score)

        # ── Insert ────────────────────────────────────────────────────────────
        insert_resp = await client.post(
            _supabase_rest("leads"),
            headers=SUPABASE_HEADERS,
            json=lead_data,
        )
        if insert_resp.status_code not in (200, 201):
            logger.error("Lead insert failed: %s", insert_resp.text)
            raise HTTPException(status_code=500, detail="Failed to save lead")

        created = insert_resp.json()
        if isinstance(created, list):
            created = created[0]

    # ── Fire background tasks ─────────────────────────────────────────────────
    background_tasks.add_task(_fire_meta_capi_lead, created)
    background_tasks.add_task(_trigger_n8n_new_lead, created)
    background_tasks.add_task(_trigger_smartscore, created["id"])
    background_tasks.add_task(_trigger_distribution, created["id"])

    return LeadIngestResponse(
        lead_id=created["id"],
        status="created",
        smartscore=initial_score,
        classification=_classify(initial_score),
    )


# ── Meta Lead Ads webhook ─────────────────────────────────────────────────────
@router.get("/meta-webhook")
async def meta_webhook_verify(
    hub_mode: str | None = None,
    hub_verify_token: str | None = None,
    hub_challenge: str | None = None,
) -> Any:
    """Meta webhook verification (GET)."""
    verify_token = os.getenv("META_WEBHOOK_VERIFY_TOKEN", "tharaga-secret-2024")
    if hub_mode == "subscribe" and hub_verify_token == verify_token:
        return int(hub_challenge or "0")
    raise HTTPException(status_code=403, detail="Verification failed")


@router.post("/meta-webhook")
async def meta_webhook_receive(request: Request, background_tasks: BackgroundTasks) -> dict:
    """Receive Meta Lead Ads leads via webhook and ingest them."""
    body = await request.json()
    leads_ingested = 0
    for entry in body.get("entry", []):
        for change in entry.get("changes", []):
            if change.get("field") != "leadgen":
                continue
            lead_data = change.get("value", {})
            # Fetch full lead from Meta Lead Ads API
            background_tasks.add_task(_fetch_and_ingest_meta_lead, lead_data)
            leads_ingested += 1
    return {"status": "ok", "leads_queued": leads_ingested}


async def _fetch_and_ingest_meta_lead(lead_data: dict) -> None:
    """Fetch full lead details from Meta and ingest."""
    lead_id = lead_data.get("leadgen_id")
    if not lead_id or not META_ACCESS_TOKEN:
        return
    try:
        async with httpx.AsyncClient(timeout=15) as client:
            resp = await client.get(
                f"https://graph.facebook.com/v19.0/{lead_id}",
                params={"access_token": META_ACCESS_TOKEN, "fields": "field_data,created_time"},
            )
            if resp.status_code != 200:
                logger.warning("Meta lead fetch failed: %s", resp.text)
                return
            meta_lead = resp.json()
            fields = {f["name"]: f["values"][0] if f["values"] else "" for f in meta_lead.get("field_data", [])}
            payload = LeadIngestPayload(
                name=fields.get("full_name", fields.get("name", "Meta Lead")),
                phone=fields.get("phone_number", "0000000000"),
                email=fields.get("email"),
                utm_source="meta_lead_ads",
                utm_medium="paid_social",
                budget=float(fields.get("budget", 0)) if fields.get("budget") else None,
            )
            # Re-use ingest logic
            from fastapi import BackgroundTasks as BT
            bt = BT()
            await ingest_lead(payload, bt)
    except Exception as exc:
        logger.error("Meta lead ingest error: %s", exc)


# ── SmartScore helpers ────────────────────────────────────────────────────────
def _rule_based_initial_score(p: LeadIngestPayload) -> int:
    """
    Initial SmartScore before ML model runs.
    Budget (0-30) + Timeline (0-30) + Intent (0-20) + Source (0-20)
    """
    score = 0

    # Budget score (0–30)
    if p.budget:
        if p.budget >= 150:
            score += 30
        elif p.budget >= 80:
            score += 22
        elif p.budget >= 40:
            score += 14
        else:
            score += 6

    # Timeline score (0–30)
    if p.timeline_months is not None:
        if p.timeline_months <= 3:
            score += 30
        elif p.timeline_months <= 6:
            score += 22
        elif p.timeline_months <= 12:
            score += 14
        else:
            score += 6

    # Intent/purpose score (0–20)
    if p.purpose == "self_use":
        score += 20
    elif p.purpose == "investment":
        score += 15
    elif p.purpose == "rental":
        score += 10

    # Source quality (0–20)
    source_scores = {
        "meta_lead_ads": 20, "google_ads": 18,
        "organic": 14, "referral": 16,
        "whatsapp": 12, "instagram": 10,
    }
    score += source_scores.get(p.utm_source or "organic", 10)

    return min(score, 100)


def _classify(score: int) -> str:
    if score >= 70:
        return "lion"
    if score >= 40:
        return "monkey"
    return "dog"
