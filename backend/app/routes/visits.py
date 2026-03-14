"""
Module 6: Site Visit QR Check-in System
- Book site visit (generates QR code, optional Razorpay payment)
- QR check-in endpoint (no auth required — works via public URL)
- Fires CAPI offline conversion on check-in
- Triggers N8N post-visit workflow
"""
from __future__ import annotations

import base64
import logging
import os
import random
import string
import uuid
from datetime import datetime, timezone

import httpx
import qrcode
from fastapi import APIRouter, HTTPException, Request
from io import BytesIO
from pydantic import BaseModel

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/visits", tags=["visits"])

SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")
RAZORPAY_KEY_ID = os.getenv("RAZORPAY_KEY_ID", "")
RAZORPAY_KEY_SECRET = os.getenv("RAZORPAY_KEY_SECRET", "")
N8N_WEBHOOK_POST_VISIT = os.getenv("N8N_WEBHOOK_POST_VISIT", "")
SITE_BASE_URL = os.getenv("SITE_URL", "https://tharaga.co.in")

SUPABASE_HEADERS = {
    "apikey": SUPABASE_SERVICE_ROLE_KEY,
    "Authorization": f"Bearer {SUPABASE_SERVICE_ROLE_KEY}",
    "Content-Type": "application/json",
    "Prefer": "return=representation",
}


def _supabase(path: str) -> str:
    return f"{SUPABASE_URL}/rest/v1/{path}"


def _generate_qr_code(data: str) -> str:
    """Generate QR code PNG and return as base64 string."""
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_H,
        box_size=10,
        border=4,
    )
    qr.add_data(data)
    qr.make(fit=True)
    img = qr.make_image(fill_color="black", back_color="white")
    buffer = BytesIO()
    img.save(buffer, format="PNG")
    return base64.b64encode(buffer.getvalue()).decode("utf-8")


def _generate_qr_string(length: int = 16) -> str:
    return "".join(random.choices(string.ascii_uppercase + string.digits, k=length))


# ── Booking ───────────────────────────────────────────────────────────────────
class BookVisitPayload(BaseModel):
    lead_id: str
    property_id: str
    visit_date: str         # ISO date string
    visit_time: str         # HH:MM
    name: str
    phone: str
    email: str | None = None
    collect_payment: bool = True  # whether to create Razorpay order


class BookVisitResponse(BaseModel):
    booking_id: str
    qr_code: str             # 16-char QR identifier
    qr_image_base64: str     # PNG QR code image
    check_in_url: str
    razorpay_order_id: str | None
    razorpay_key_id: str | None
    amount_inr: int


@router.post("/book", response_model=BookVisitResponse)
async def book_site_visit(payload: BookVisitPayload) -> BookVisitResponse:
    """Book a site visit and generate QR code for check-in."""
    booking_id = str(uuid.uuid4())
    qr_string = _generate_qr_string(16)
    check_in_url = f"{SITE_BASE_URL}/visit/{qr_string}"

    razorpay_order_id = None
    amount_inr = 25000

    # Create Razorpay order if payment requested and keys configured
    if payload.collect_payment and RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET:
        try:
            async with httpx.AsyncClient(
                auth=(RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET), timeout=15
            ) as client:
                rz_resp = await client.post(
                    "https://api.razorpay.com/v1/orders",
                    json={
                        "amount": amount_inr * 100,  # paise
                        "currency": "INR",
                        "receipt": f"visit_{booking_id[:8]}",
                        "notes": {
                            "booking_id": booking_id,
                            "lead_id": payload.lead_id,
                            "property_id": payload.property_id,
                        },
                    },
                )
                if rz_resp.status_code in (200, 201):
                    razorpay_order_id = rz_resp.json().get("id")
        except Exception as exc:
            logger.warning("Razorpay order creation failed: %s", exc)

    # Generate QR image
    qr_image_b64 = _generate_qr_code(check_in_url)

    # Save booking in DB
    booking_data = {
        "id": booking_id,
        "lead_id": payload.lead_id,
        "property_id": payload.property_id,
        "qr_code": qr_string,
        "visit_date": payload.visit_date if hasattr(payload, "visit_date") else None,
        "booking_token_inr": amount_inr,
        "payment_status": "pending",
        "capi_offline_fired": False,
        "n8n_triggered": False,
    }
    if razorpay_order_id:
        booking_data["razorpay_order_id"] = razorpay_order_id

    async with httpx.AsyncClient(timeout=10) as client:
        resp = await client.post(
            _supabase("site_visit_bookings"),
            headers=SUPABASE_HEADERS,
            json=booking_data,
        )
        if resp.status_code not in (200, 201):
            logger.error("Booking insert failed: %s", resp.text)
            raise HTTPException(status_code=500, detail="Failed to create booking")

    return BookVisitResponse(
        booking_id=booking_id,
        qr_code=qr_string,
        qr_image_base64=qr_image_b64,
        check_in_url=check_in_url,
        razorpay_order_id=razorpay_order_id,
        razorpay_key_id=RAZORPAY_KEY_ID if RAZORPAY_KEY_ID else None,
        amount_inr=amount_inr,
    )


# ── QR Check-in ───────────────────────────────────────────────────────────────
@router.get("/checkin/{qr_code}")
async def check_in(qr_code: str) -> dict:
    """
    QR check-in endpoint — NO AUTH required.
    Called when site visitor scans QR at the property.
    """
    async with httpx.AsyncClient(timeout=10) as client:
        # Find booking by QR code
        resp = await client.get(
            _supabase("site_visit_bookings"),
            headers=SUPABASE_HEADERS,
            params={"qr_code": f"eq.{qr_code}", "select": "*", "limit": "1"},
        )
        bookings = resp.json()
        if not bookings or not isinstance(bookings, list) or len(bookings) == 0:
            raise HTTPException(status_code=404, detail="Invalid QR code")

        booking = bookings[0]
        booking_id = booking["id"]

        if booking.get("checked_in_at"):
            return {
                "status": "already_checked_in",
                "checked_in_at": booking["checked_in_at"],
                "booking_id": booking_id,
            }

        now = datetime.now(timezone.utc).isoformat()

        # Mark checked in
        await client.patch(
            _supabase(f"site_visit_bookings?id=eq.{booking_id}"),
            headers=SUPABASE_HEADERS,
            json={"checked_in_at": now},
        )

        # Fire CAPI offline conversion
        lead_id = booking.get("lead_id")
        if not booking.get("capi_offline_fired"):
            try:
                await client.post(
                    "http://localhost:8000/api/capi/fire",
                    json={
                        "event_name": "Schedule",
                        "event_id": f"visit_{booking_id}",
                        "content_name": "Site Visit Check-in",
                        "value": 0,
                        "currency": "INR",
                        "content_ids": [booking.get("property_id", "")],
                        "action_source": "physical_store",
                        "lead_id": lead_id,
                        "visit_id": booking_id,
                    },
                )
                await client.patch(
                    _supabase(f"site_visit_bookings?id=eq.{booking_id}"),
                    headers=SUPABASE_HEADERS,
                    json={"capi_offline_fired": True},
                )
            except Exception as exc:
                logger.warning("CAPI offline fire failed: %s", exc)

        # Trigger N8N post-visit workflow
        if N8N_WEBHOOK_POST_VISIT and not booking.get("n8n_triggered"):
            try:
                await client.post(
                    N8N_WEBHOOK_POST_VISIT,
                    json={"booking_id": booking_id, "lead_id": lead_id, "checked_in_at": now},
                )
                await client.patch(
                    _supabase(f"site_visit_bookings?id=eq.{booking_id}"),
                    headers=SUPABASE_HEADERS,
                    json={"n8n_triggered": True},
                )
            except Exception as exc:
                logger.warning("N8N post-visit trigger failed: %s", exc)

    return {
        "status": "checked_in",
        "booking_id": booking_id,
        "checked_in_at": now,
        "message": "Welcome! Your site visit has been confirmed. Our team will greet you shortly.",
    }


# ── Razorpay payment webhook ──────────────────────────────────────────────────
@router.post("/razorpay-webhook")
async def razorpay_webhook(request: Request) -> dict:
    """Handle Razorpay payment.captured webhook to confirm booking."""
    body = await request.json()
    event = body.get("event", "")
    if event != "payment.captured":
        return {"status": "ignored"}

    payment = body.get("payload", {}).get("payment", {}).get("entity", {})
    order_id = payment.get("order_id")
    payment_id = payment.get("id")
    amount_paise = payment.get("amount", 0)

    if not order_id:
        return {"status": "ignored"}

    async with httpx.AsyncClient(timeout=10) as client:
        # Find booking by razorpay_order_id
        resp = await client.get(
            _supabase("site_visit_bookings"),
            headers=SUPABASE_HEADERS,
            params={"razorpay_order_id": f"eq.{order_id}", "select": "*", "limit": "1"},
        )
        bookings = resp.json()
        if not bookings:
            return {"status": "not_found"}

        booking = bookings[0]
        await client.patch(
            _supabase(f"site_visit_bookings?id=eq.{booking['id']}"),
            headers=SUPABASE_HEADERS,
            json={
                "razorpay_payment_id": payment_id,
                "payment_status": "paid",
            },
        )

        # Fire CAPI Purchase
        lead_id = booking.get("lead_id")
        try:
            await client.post(
                "http://localhost:8000/api/capi/purchase",
                params={
                    "lead_id": lead_id or "",
                    "visit_id": booking["id"],
                    "event_id": f"payment_{payment_id}",
                    "amount_inr": amount_paise / 100,
                    "property_id": booking.get("property_id", ""),
                },
            )
        except Exception as exc:
            logger.warning("CAPI purchase fire failed: %s", exc)

    return {"status": "ok", "booking_id": booking["id"]}
