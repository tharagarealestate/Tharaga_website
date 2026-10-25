"""
Module 8: Meta Conversions API Helper
Server-side event firing for offline conversions (site visit, booking/purchase).
SHA-256 hashes email + phone; fbc/fbp sent as-is (not hashed per Meta spec).
Deduplication via shared eventID between browser pixel and server CAPI.
"""
from __future__ import annotations

import hashlib
import logging
import os
import time
from typing import Any

import httpx
from fastapi import APIRouter, BackgroundTasks, HTTPException
from pydantic import BaseModel

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/capi", tags=["capi"])

META_ACCESS_TOKEN = os.getenv("META_ACCESS_TOKEN", "")
META_PIXEL_ID = os.getenv("META_PIXEL_ID", "")
META_TEST_EVENT_CODE = os.getenv("META_TEST_EVENT_CODE", "")
CAPI_ENDPOINT = f"https://graph.facebook.com/v19.0/{META_PIXEL_ID}/events"

SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")
SUPABASE_HEADERS = {
    "apikey": SUPABASE_SERVICE_ROLE_KEY,
    "Authorization": f"Bearer {SUPABASE_SERVICE_ROLE_KEY}",
    "Content-Type": "application/json",
}


def _sha256(value: str) -> str:
    return hashlib.sha256(value.strip().lower().encode()).hexdigest()


class CAPIEventPayload(BaseModel):
    event_name: str           # Lead | ViewContent | Purchase | Schedule
    event_id: str             # Shared with browser pixel for dedup
    email: str | None = None
    phone: str | None = None  # E.164
    fbc: str | None = None    # NOT hashed
    fbp: str | None = None    # NOT hashed
    city: str | None = None
    state: str | None = None
    country: str = "IN"
    currency: str = "INR"
    value: float = 0.0        # INR (not lakhs)
    content_name: str | None = None
    content_type: str = "product"
    content_ids: list[str] = []
    action_source: str = "website"
    lead_id: str | None = None
    visit_id: str | None = None


async def _fire_capi_event(payload: CAPIEventPayload) -> dict:
    if not META_ACCESS_TOKEN or not META_PIXEL_ID:
        return {"status": "skipped", "reason": "Meta CAPI not configured"}

    user_data: dict[str, Any] = {
        "country": [_sha256(payload.country)],
    }
    if payload.email:
        user_data["em"] = [_sha256(payload.email)]
    if payload.phone:
        user_data["ph"] = [_sha256(payload.phone)]
    if payload.fbc:
        user_data["fbc"] = payload.fbc   # NOT hashed
    if payload.fbp:
        user_data["fbp"] = payload.fbp   # NOT hashed
    if payload.city:
        user_data["ct"] = [_sha256(payload.city)]
    if payload.state:
        user_data["st"] = [_sha256(payload.state)]

    custom_data: dict[str, Any] = {
        "currency": payload.currency,
        "value": payload.value,
    }
    if payload.content_name:
        custom_data["content_name"] = payload.content_name
    if payload.content_ids:
        custom_data["content_ids"] = payload.content_ids
    if payload.content_type:
        custom_data["content_type"] = payload.content_type

    event_body: dict[str, Any] = {
        "data": [{
            "event_name": payload.event_name,
            "event_time": int(time.time()),
            "event_id": payload.event_id,
            "action_source": payload.action_source,
            "user_data": user_data,
            "custom_data": custom_data,
        }]
    }
    if META_TEST_EVENT_CODE:
        event_body["test_event_code"] = META_TEST_EVENT_CODE

    async with httpx.AsyncClient(timeout=10) as client:
        resp = await client.post(
            CAPI_ENDPOINT,
            params={"access_token": META_ACCESS_TOKEN},
            json=event_body,
        )
        if resp.status_code != 200:
            logger.warning("CAPI event %s failed: %s", payload.event_name, resp.text)
            return {"status": "error", "detail": resp.text}
        return {"status": "fired", "event": payload.event_name, "event_id": payload.event_id}


async def _update_lead_capi_flag(lead_id: str, event_name: str) -> None:
    flag_map = {
        "Lead": "capi_lead_fired",
        "Schedule": "capi_visit_fired",
        "Purchase": "capi_purchase_fired",
    }
    flag = flag_map.get(event_name)
    if not flag or not lead_id:
        return
    async with httpx.AsyncClient(timeout=5) as client:
        await client.patch(
            f"{SUPABASE_URL}/rest/v1/leads?id=eq.{lead_id}",
            headers=SUPABASE_HEADERS,
            json={flag: True},
        )


@router.post("/fire")
async def fire_capi_event(
    payload: CAPIEventPayload,
    background_tasks: BackgroundTasks,
) -> dict:
    """Fire a Meta CAPI event for any conversion point."""
    result = await _fire_capi_event(payload)
    if payload.lead_id:
        background_tasks.add_task(_update_lead_capi_flag, payload.lead_id, payload.event_name)
    return result


@router.post("/view-content")
async def fire_view_content(
    property_id: str,
    event_id: str,
    email: str | None = None,
    phone: str | None = None,
    fbc: str | None = None,
    fbp: str | None = None,
) -> dict:
    """Convenience endpoint: fire ViewContent for a property page view."""
    return await _fire_capi_event(CAPIEventPayload(
        event_name="ViewContent",
        event_id=event_id,
        email=email,
        phone=phone,
        fbc=fbc,
        fbp=fbp,
        content_ids=[property_id],
        content_type="product",
        action_source="website",
    ))


@router.post("/purchase")
async def fire_purchase(
    lead_id: str,
    visit_id: str,
    event_id: str,
    amount_inr: float,
    property_id: str,
    email: str | None = None,
    phone: str | None = None,
    fbc: str | None = None,
    fbp: str | None = None,
    background_tasks: BackgroundTasks = None,
) -> dict:
    """Fire Purchase event when booking token is paid (₹25,000)."""
    payload = CAPIEventPayload(
        event_name="Purchase",
        event_id=event_id,
        email=email,
        phone=phone,
        fbc=fbc,
        fbp=fbp,
        value=amount_inr,
        currency="INR",
        content_ids=[property_id],
        content_name="Site Visit Booking",
        action_source="website",
        lead_id=lead_id,
        visit_id=visit_id,
    )
    result = await _fire_capi_event(payload)
    if background_tasks and lead_id:
        background_tasks.add_task(_update_lead_capi_flag, lead_id, "Purchase")
    return result
