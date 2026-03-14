"""
Module 4: WhatsApp AI Chatbot — "Priya"
Twilio TwiML webhook + outbound sender.
Uses Claude claude-sonnet-4-6 for conversational lead qualification.

6-stage qualification flow:
  greeting → budget → location → timeline → property_type → purpose → loan → complete

WhatsApp rules:
- Free-text replies only within 24h window.
- Proactive outbound requires pre-approved templates.
- EXTRACTED: {} JSON blocks parsed from AI response for structured data capture.
"""
from __future__ import annotations

import json
import logging
import os
import re
import uuid
from datetime import datetime, timedelta, timezone
from typing import Any

import anthropic
import httpx
from fastapi import APIRouter, Form, Request, Response
from fastapi.responses import PlainTextResponse

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/whatsapp", tags=["whatsapp"])

# ── env ───────────────────────────────────────────────────────────────────────
SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")
TWILIO_ACCOUNT_SID = os.getenv("TWILIO_ACCOUNT_SID", "")
TWILIO_AUTH_TOKEN = os.getenv("TWILIO_AUTH_TOKEN", "")
TWILIO_WHATSAPP_NUMBER = os.getenv("TWILIO_WHATSAPP_NUMBER", "whatsapp:+14155238886")
ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY", "")
N8N_WEBHOOK_QUALIFIED = os.getenv("N8N_WEBHOOK_QUALIFIED_LEAD", "")

SUPABASE_HEADERS = {
    "apikey": SUPABASE_SERVICE_ROLE_KEY,
    "Authorization": f"Bearer {SUPABASE_SERVICE_ROLE_KEY}",
    "Content-Type": "application/json",
    "Prefer": "return=representation",
}

# ── Priya persona system prompt ───────────────────────────────────────────────
SYSTEM_PROMPT = """You are Priya, a warm and knowledgeable real estate assistant for Tharaga — India's first AI-powered zero-commission real estate platform in Chennai.

Your goal is to qualify leads through a natural conversation. You ask ONE question at a time, gently.

Current qualification stages you must complete (in order):
1. budget — Ask about their budget in lakhs (e.g., "50-70 lakhs?")
2. location — Preferred Chennai locality (Anna Nagar, Adyar, OMR, Porur, etc.)
3. timeline — When are they looking to buy? (immediate, 3 months, 6 months, 1 year+)
4. property_type — 1BHK, 2BHK, 3BHK, villa, plot?
5. purpose — Self-use, investment, or rental income?
6. loan — Do they need a home loan?

Rules:
- You are conversational, warm, never robotic.
- After each user reply, extract the relevant field value and reply naturally, then ask the NEXT unanswered question.
- At the end of your reply, if you extracted a value, include a JSON block in this exact format:
  [EXTRACTED: {"field": "budget", "value": "80-100 lakhs"}]
- When all 6 fields are collected, say a warm closing message and include:
  [EXTRACTED: {"stage": "complete"}]
- Keep messages short (2-3 sentences max). This is WhatsApp, not email.
- Use Indian conversational style. Occasional Tamil words are fine (e.g., "neenga").
- Do NOT mention competitor platforms or share external links.
- Budget values must be in lakhs (numbers only for the value field, e.g., 80 means 80 lakhs).

You already know: the user's name and phone. Their previous messages are in the conversation history."""

STAGE_ORDER = ["greeting", "budget", "location", "timeline", "property_type", "purpose", "loan", "complete"]

FIELD_MAP = {
    "budget": "budget",
    "location": "preferred_location",
    "timeline": "timeline_months",
    "property_type": "property_type_interest",
    "purpose": "purpose",
    "loan": "loan_required",
}

TIMELINE_MAP = {
    "immediate": 1, "now": 1, "asap": 1,
    "1 month": 1, "3 months": 3, "6 months": 6,
    "1 year": 12, "2 years": 24, "no rush": 36,
}

PURPOSE_MAP = {"self": "self_use", "self-use": "self_use", "self_use": "self_use",
               "invest": "investment", "investment": "investment",
               "rental": "rental", "rent": "rental"}


# ── Helpers ───────────────────────────────────────────────────────────────────
def _supabase(path: str) -> str:
    return f"{SUPABASE_URL}/rest/v1/{path}"


def _extract_json_block(text: str) -> dict | None:
    match = re.search(r"\[EXTRACTED:\s*(\{.*?\})\s*\]", text, re.DOTALL)
    if match:
        try:
            return json.loads(match.group(1))
        except json.JSONDecodeError:
            return None
    return None


def _clean_ai_response(text: str) -> str:
    """Remove [EXTRACTED:...] blocks from text before sending to user."""
    return re.sub(r"\[EXTRACTED:.*?\]", "", text, flags=re.DOTALL).strip()


def _next_stage(current: str, extracted_data: dict) -> str:
    stages = ["budget", "location", "timeline", "property_type", "purpose", "loan"]
    for stage in stages:
        if stage not in extracted_data or extracted_data[stage] is None:
            return stage
    return "complete"


async def _get_or_create_conversation(phone: str) -> dict:
    """Fetch existing WhatsApp conversation or create a new one."""
    async with httpx.AsyncClient(timeout=10) as client:
        resp = await client.get(
            _supabase("whatsapp_conversations"),
            headers=SUPABASE_HEADERS,
            params={"phone": f"eq.{phone}", "limit": "1"},
        )
        existing = resp.json()
        if existing and isinstance(existing, list) and len(existing) > 0:
            return existing[0]
        # Create new
        new_conv = {
            "id": str(uuid.uuid4()),
            "phone": phone,
            "qualification_stage": "greeting",
            "extracted_data": {},
            "messages": [],
            "last_message_at": datetime.now(timezone.utc).isoformat(),
            "window_expires_at": (datetime.now(timezone.utc) + timedelta(hours=24)).isoformat(),
        }
        create_resp = await client.post(
            _supabase("whatsapp_conversations"),
            headers=SUPABASE_HEADERS,
            json=new_conv,
        )
        created = create_resp.json()
        return created[0] if isinstance(created, list) else new_conv


async def _update_conversation(conv_id: str, updates: dict) -> None:
    async with httpx.AsyncClient(timeout=10) as client:
        await client.patch(
            _supabase(f"whatsapp_conversations?id=eq.{conv_id}"),
            headers=SUPABASE_HEADERS,
            json=updates,
        )


async def _call_claude(messages: list[dict], stage: str) -> str:
    """Call Claude claude-sonnet-4-6 with conversation history."""
    if not ANTHROPIC_API_KEY:
        return "Hi! I'm Priya from Tharaga. What's your budget for your Chennai home?"
    client = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)
    try:
        response = client.messages.create(
            model="claude-sonnet-4-6",
            max_tokens=300,
            system=SYSTEM_PROMPT,
            messages=messages,
        )
        return response.content[0].text
    except Exception as exc:
        logger.error("Claude error: %s", exc)
        return "Sorry, I faced a technical issue. Could you please repeat?"


async def _complete_qualification(conv: dict, phone: str) -> None:
    """When all fields collected — create or update lead and trigger N8N."""
    data = conv.get("extracted_data", {})
    from .leads import normalize_phone, _rule_based_initial_score, _classify
    from pydantic import BaseModel as BM

    # Parse budget (e.g., "80-100 lakhs" → 90)
    budget_str = str(data.get("budget", "0"))
    budget_nums = re.findall(r"\d+", budget_str)
    budget_val = sum(int(x) for x in budget_nums) / max(len(budget_nums), 1) if budget_nums else None

    # Parse timeline
    timeline_raw = str(data.get("timeline", "")).lower()
    timeline_months = 6  # default
    for key, val in TIMELINE_MAP.items():
        if key in timeline_raw:
            timeline_months = val
            break

    # Parse purpose
    purpose_raw = str(data.get("purpose", "")).lower()
    purpose = "self_use"
    for key, val in PURPOSE_MAP.items():
        if key in purpose_raw:
            purpose = val
            break

    loan_required = "yes" in str(data.get("loan", "")).lower() or "need" in str(data.get("loan", "")).lower()

    async with httpx.AsyncClient(timeout=10) as client:
        # Check if lead already exists for this phone
        norm_phone = normalize_phone(phone)
        resp = await client.get(
            _supabase("leads"),
            headers=SUPABASE_HEADERS,
            params={"phone_normalized": f"eq.{norm_phone}", "select": "id", "limit": "1"},
        )
        existing = resp.json()
        if existing and isinstance(existing, list) and len(existing) > 0:
            lead_id = existing[0]["id"]
            # Update with qualification data
            score = 50  # default if we can't compute
            await client.patch(
                _supabase(f"leads?id=eq.{lead_id}"),
                headers=SUPABASE_HEADERS,
                json={
                    "whatsapp_qualified": True,
                    "qualification_data": data,
                    "budget": budget_val,
                    "preferred_location": data.get("location"),
                    "timeline_months": timeline_months,
                    "property_type_interest": data.get("property_type"),
                    "purpose": purpose,
                    "loan_required": loan_required,
                    "status": "qualified",
                    "updated_at": datetime.now(timezone.utc).isoformat(),
                },
            )
        else:
            # Create new lead from WhatsApp qualification
            lead_id = str(uuid.uuid4())
            await client.post(
                _supabase("leads"),
                headers=SUPABASE_HEADERS,
                json={
                    "id": lead_id,
                    "name": data.get("name", "WhatsApp Lead"),
                    "phone": phone,
                    "phone_normalized": norm_phone,
                    "source": "whatsapp",
                    "utm_source": "whatsapp",
                    "budget": budget_val,
                    "preferred_location": data.get("location"),
                    "timeline_months": timeline_months,
                    "property_type_interest": data.get("property_type"),
                    "purpose": purpose,
                    "loan_required": loan_required,
                    "whatsapp_qualified": True,
                    "qualification_data": data,
                    "status": "qualified",
                    "smartscore": 0,
                },
            )

        # Mark conversation complete
        await _update_conversation(conv["id"], {
            "qualification_stage": "complete",
            "lead_id": lead_id,
            "is_active": False,
        })

        # Trigger N8N qualified lead workflow
        if N8N_WEBHOOK_QUALIFIED:
            try:
                await client.post(N8N_WEBHOOK_QUALIFIED, json={"lead_id": lead_id, "phone": phone, "data": data})
            except Exception:
                pass


# ── TwiML Webhook (Twilio sends POST here) ────────────────────────────────────
@router.post("/webhook", response_class=PlainTextResponse)
async def whatsapp_webhook(
    From: str = Form(...),
    Body: str = Form(...),
    ProfileName: str = Form(default=""),
) -> str:
    """
    Twilio TwiML webhook for incoming WhatsApp messages.
    Returns TwiML XML with Priya's reply.
    """
    phone = From.replace("whatsapp:", "").strip()
    user_message = Body.strip()

    # Get/create conversation
    conv = await _get_or_create_conversation(phone)
    messages: list[dict] = conv.get("messages", []) or []
    extracted_data: dict = conv.get("extracted_data", {}) or {}

    # Check 24h window
    window_exp = conv.get("window_expires_at")
    if window_exp:
        try:
            exp_dt = datetime.fromisoformat(window_exp.replace("Z", "+00:00"))
            if datetime.now(timezone.utc) > exp_dt:
                # Window expired — reset
                conv = await _get_or_create_conversation(phone + "_new_" + str(uuid.uuid4())[:8])
                messages = []
                extracted_data = {}
        except Exception:
            pass

    # Add user message to history
    messages.append({"role": "user", "content": user_message})

    # Get AI response from Claude
    ai_response = await _call_claude(messages, conv.get("qualification_stage", "greeting"))

    # Extract structured data from AI response
    extracted = _extract_json_block(ai_response)
    if extracted:
        if extracted.get("stage") == "complete":
            conv["extracted_data"] = extracted_data
            await _complete_qualification(conv, phone)
        elif "field" in extracted and "value" in extracted:
            field = extracted["field"]
            extracted_data[field] = extracted["value"]

    # Clean response for user
    clean_response = _clean_ai_response(ai_response)

    # Determine next stage
    next_stage = "complete" if extracted and extracted.get("stage") == "complete" else _next_stage(
        conv.get("qualification_stage", "greeting"), extracted_data
    )

    # Add AI message to history
    messages.append({"role": "assistant", "content": ai_response})

    # Update conversation state
    await _update_conversation(conv["id"], {
        "messages": messages[-40:],  # keep last 40 messages
        "extracted_data": extracted_data,
        "qualification_stage": next_stage,
        "last_message_at": datetime.now(timezone.utc).isoformat(),
        "window_expires_at": (datetime.now(timezone.utc) + timedelta(hours=24)).isoformat(),
    })

    # Return TwiML
    twiml = f"""<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Message to="{From}">{clean_response}</Message>
</Response>"""
    return Response(content=twiml, media_type="application/xml")


# ── Outbound sender ───────────────────────────────────────────────────────────
class OutboundMessagePayload(BaseModel):
    to_phone: str      # E.164 without "whatsapp:" prefix
    template: str      # template key
    variables: dict = {}

    class Config:
        extra = "allow"


from pydantic import BaseModel


TEMPLATES = {
    "welcome": "Namaste {name}! 🙏 I'm Priya from Tharaga. You've expressed interest in Chennai properties. I'd love to help you find your dream home. What's your budget range? (e.g., 60-80 lakhs)",
    "lion_alert": "🎯 Great news, {name}! We have found {count} exclusive properties matching your profile in {location}. Our senior advisor will call you within 15 minutes. Please keep your phone available.",
    "visit_reminder": "📅 Reminder: Your site visit is scheduled for {date} at {time}. Property: {property_name}, {address}. Please bring your ID proof. Questions? Reply here!",
    "post_visit": "Hello {name}! How was your visit to {property_name}? We'd love to hear your feedback. If you're interested, our advisor can help with next steps, including loan assistance.",
    "booking_link": "🏠 {name}, to confirm your site visit booking, please pay the refundable token of ₹25,000 here: {link}\n\n(100% refundable if you don't proceed with the purchase)",
}


@router.post("/send")
async def send_whatsapp(payload: OutboundMessagePayload) -> dict:
    """Send outbound WhatsApp message using a pre-approved template."""
    if not TWILIO_ACCOUNT_SID or not TWILIO_AUTH_TOKEN:
        return {"status": "error", "detail": "Twilio credentials not configured"}

    template_text = TEMPLATES.get(payload.template)
    if not template_text:
        return {"status": "error", "detail": f"Unknown template: {payload.template}"}

    # Interpolate variables
    try:
        message_body = template_text.format(**payload.variables)
    except KeyError as e:
        return {"status": "error", "detail": f"Missing template variable: {e}"}

    phone = payload.to_phone.replace("whatsapp:", "").strip()
    if not phone.startswith("+"):
        phone = f"+{phone}"

    async with httpx.AsyncClient(
        auth=(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN), timeout=15
    ) as client:
        resp = await client.post(
            f"https://api.twilio.com/2010-04-01/Accounts/{TWILIO_ACCOUNT_SID}/Messages.json",
            data={
                "From": TWILIO_WHATSAPP_NUMBER,
                "To": f"whatsapp:{phone}",
                "Body": message_body,
            },
        )
        if resp.status_code in (200, 201):
            return {"status": "sent", "sid": resp.json().get("sid")}
        else:
            logger.error("Twilio send failed: %s", resp.text)
            return {"status": "error", "detail": resp.text}
