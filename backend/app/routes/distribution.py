"""
Module 5: Lead Distribution Engine
Lion (≥70) → top exec by conversion_rate
Monkey (40-69) → round-robin by last_assigned_at
Dog (<40) → channel partner network
SLA: Lion=15min, Monkey=2h → breach triggers re-assignment + WhatsApp alert
"""
from __future__ import annotations

import asyncio
import logging
import os
from datetime import datetime, timedelta, timezone
from typing import Any

import httpx
from fastapi import APIRouter, BackgroundTasks, HTTPException
from pydantic import BaseModel

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/distribution", tags=["distribution"])

SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")
N8N_WEBHOOK_SLA_BREACH = os.getenv("N8N_WEBHOOK_SLA_BREACH", "")

SUPABASE_HEADERS = {
    "apikey": SUPABASE_SERVICE_ROLE_KEY,
    "Authorization": f"Bearer {SUPABASE_SERVICE_ROLE_KEY}",
    "Content-Type": "application/json",
    "Prefer": "return=representation",
}

SLA_MINUTES = {"lion": 15, "monkey": 120, "dog": 480}


def _supabase(path: str) -> str:
    return f"{SUPABASE_URL}/rest/v1/{path}"


# ── Models ────────────────────────────────────────────────────────────────────
class DistributeRequest(BaseModel):
    lead_id: str


class DistributeResponse(BaseModel):
    lead_id: str
    assigned_to: str | None
    assignment_type: str | None
    classification: str
    sla_deadline: str | None


# ── Core distribution logic ───────────────────────────────────────────────────
async def _get_lead(lead_id: str) -> dict | None:
    async with httpx.AsyncClient(timeout=10) as client:
        resp = await client.get(
            _supabase("leads"),
            headers=SUPABASE_HEADERS,
            params={"id": f"eq.{lead_id}", "select": "*", "limit": "1"},
        )
        data = resp.json()
        return data[0] if data and isinstance(data, list) else None


async def _assign_to_top_exec(lead: dict) -> dict | None:
    """Lion tier: assign to exec with highest conversion_rate."""
    async with httpx.AsyncClient(timeout=10) as client:
        resp = await client.get(
            _supabase("sales_team"),
            headers=SUPABASE_HEADERS,
            params={
                "is_active": "eq.true",
                "select": "id,name,phone,whatsapp_number,conversion_rate",
                "order": "conversion_rate.desc",
                "limit": "5",
            },
        )
        execs = resp.json()
        if not execs or not isinstance(execs, list):
            return None
        # Pick first available (capacity check)
        for exec_rec in execs:
            cap_resp = await client.get(
                _supabase("sales_team"),
                headers=SUPABASE_HEADERS,
                params={
                    "id": f"eq.{exec_rec['id']}",
                    "select": "max_daily_leads,current_daily_count,count_reset_date",
                    "limit": "1",
                },
            )
            cap = cap_resp.json()
            if not cap:
                continue
            cap = cap[0]
            today = datetime.now(timezone.utc).date().isoformat()
            if cap.get("count_reset_date") != today:
                # Reset counter
                await client.patch(
                    _supabase(f"sales_team?id=eq.{exec_rec['id']}"),
                    headers=SUPABASE_HEADERS,
                    json={"current_daily_count": 0, "count_reset_date": today},
                )
                cap["current_daily_count"] = 0
            if cap.get("current_daily_count", 0) < cap.get("max_daily_leads", 20):
                return exec_rec
        return execs[0] if execs else None  # fallback to top exec


async def _assign_round_robin(lead: dict) -> dict | None:
    """Monkey tier: round-robin by last_assigned_at (nulls first)."""
    async with httpx.AsyncClient(timeout=10) as client:
        resp = await client.get(
            _supabase("sales_team"),
            headers=SUPABASE_HEADERS,
            params={
                "is_active": "eq.true",
                "select": "id,name,phone,whatsapp_number",
                "order": "last_assigned_at.asc.nullsfirst",
                "limit": "1",
            },
        )
        execs = resp.json()
        return execs[0] if execs and isinstance(execs, list) else None


async def _assign_to_cp_network(lead: dict) -> dict | None:
    """Dog tier: channel partner round-robin."""
    async with httpx.AsyncClient(timeout=10) as client:
        resp = await client.get(
            _supabase("channel_partners"),
            headers=SUPABASE_HEADERS,
            params={
                "is_active": "eq.true",
                "select": "id,name,phone,whatsapp_number",
                "order": "last_assigned_at.asc.nullsfirst",
                "limit": "1",
            },
        )
        partners = resp.json()
        return partners[0] if partners and isinstance(partners, list) else None


async def _update_assignee(assignee_id: str, table: str, lead_id: str) -> None:
    """Increment assignment count and update last_assigned_at."""
    async with httpx.AsyncClient(timeout=10) as client:
        # Update last_assigned_at
        await client.patch(
            _supabase(f"{table}?id=eq.{assignee_id}"),
            headers=SUPABASE_HEADERS,
            json={
                "last_assigned_at": datetime.now(timezone.utc).isoformat(),
                "leads_handled": None,  # DB trigger increments
            },
        )
        # For sales_team: increment current_daily_count
        if table == "sales_team":
            # Use rpc or just patch with increment
            resp = await client.get(
                _supabase(f"sales_team?id=eq.{assignee_id}&select=current_daily_count"),
                headers=SUPABASE_HEADERS,
            )
            data = resp.json()
            if data:
                count = data[0].get("current_daily_count", 0)
                await client.patch(
                    _supabase(f"sales_team?id=eq.{assignee_id}"),
                    headers=SUPABASE_HEADERS,
                    json={"current_daily_count": count + 1},
                )


async def _log_lead_event(lead_id: str, event_type: str, new_value: dict) -> None:
    async with httpx.AsyncClient(timeout=5) as client:
        await client.post(
            _supabase("lead_events"),
            headers=SUPABASE_HEADERS,
            json={
                "lead_id": lead_id,
                "event_type": event_type,
                "actor_type": "system",
                "new_value": new_value,
            },
        )


async def _send_whatsapp_alert(phone: str, message: str) -> None:
    """Send WhatsApp via internal route (fire and forget)."""
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            await client.post(
                "http://localhost:8000/api/whatsapp/send",
                json={
                    "to_phone": phone,
                    "template": "lion_alert",
                    "variables": {"message": message, "name": "Team"},
                },
            )
    except Exception as exc:
        logger.warning("WhatsApp alert failed: %s", exc)


async def _check_sla_breach(lead_id: str, classification: str, assignee_phone: str | None) -> None:
    """Wait for SLA duration, then check if lead is still 'new' and re-assign."""
    sla_minutes = SLA_MINUTES.get(classification, 120)
    await asyncio.sleep(sla_minutes * 60)

    lead = await _get_lead(lead_id)
    if not lead or lead.get("status") not in ("new",):
        return  # Already contacted — no breach

    logger.warning("SLA breach for lead %s (classification=%s)", lead_id, classification)

    # Log breach event
    await _log_lead_event(lead_id, "sla_breach", {"sla_minutes": sla_minutes, "classification": classification})

    # Send N8N SLA breach workflow
    if N8N_WEBHOOK_SLA_BREACH:
        try:
            async with httpx.AsyncClient(timeout=10) as client:
                await client.post(
                    N8N_WEBHOOK_SLA_BREACH,
                    json={"lead_id": lead_id, "classification": classification, "sla_minutes": sla_minutes},
                )
        except Exception:
            pass

    # Re-assign: rotate to next available person
    await distribute_lead_internal(lead_id, force_reassign=True)


# ── Main distribution function ────────────────────────────────────────────────
async def distribute_lead_internal(lead_id: str, force_reassign: bool = False) -> dict:
    lead = await _get_lead(lead_id)
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")

    classification = lead.get("classification", "dog")
    assignee = None
    assignment_type = None
    table = "sales_team"

    if classification == "lion":
        assignee = await _assign_to_top_exec(lead)
        assignment_type = "sales_exec"
        table = "sales_team"
    elif classification == "monkey":
        assignee = await _assign_round_robin(lead)
        assignment_type = "sales_exec"
        table = "sales_team"
    else:  # dog
        assignee = await _assign_to_cp_network(lead)
        assignment_type = "channel_partner"
        table = "channel_partners"

    now = datetime.now(timezone.utc)
    sla_deadline = (now + timedelta(minutes=SLA_MINUTES.get(classification, 120))).isoformat()

    if assignee:
        assigned_id = assignee["id"]
        async with httpx.AsyncClient(timeout=10) as client:
            await client.patch(
                _supabase(f"leads?id=eq.{lead_id}"),
                headers=SUPABASE_HEADERS,
                json={
                    "assigned_to": assigned_id,
                    "assignment_type": assignment_type,
                    "sla_deadline": sla_deadline,
                    "updated_at": now.isoformat(),
                },
            )
        await _update_assignee(assigned_id, table, lead_id)
        await _log_lead_event(lead_id, "assigned", {
            "assignee_id": assigned_id,
            "assignment_type": assignment_type,
            "classification": classification,
        })

        # Schedule SLA breach check (fire and forget)
        assignee_phone = assignee.get("whatsapp_number") or assignee.get("phone")
        asyncio.create_task(_check_sla_breach(lead_id, classification, assignee_phone))

        # Send WhatsApp alert for Lion leads
        if classification == "lion" and assignee_phone:
            await _send_whatsapp_alert(assignee_phone, f"🦁 HIGH PRIORITY lead assigned: {lead.get('name')} — {lead.get('phone')}. Budget: {lead.get('budget')} lakhs. Respond within 15 minutes!")

    return {
        "lead_id": lead_id,
        "assigned_to": assignee["id"] if assignee else None,
        "assignment_type": assignment_type,
        "classification": classification,
        "sla_deadline": sla_deadline,
    }


# ── Routes ────────────────────────────────────────────────────────────────────
@router.post("/distribute", response_model=DistributeResponse)
async def distribute_lead(
    payload: DistributeRequest,
    background_tasks: BackgroundTasks,
) -> DistributeResponse:
    """Distribute a scored lead to the appropriate sales exec or channel partner."""
    result = await distribute_lead_internal(payload.lead_id)
    return DistributeResponse(**result)


@router.get("/stats")
async def distribution_stats() -> dict:
    """Get distribution pipeline stats."""
    async with httpx.AsyncClient(timeout=10) as client:
        lion_resp = await client.get(
            _supabase("leads"),
            headers=SUPABASE_HEADERS,
            params={"classification": "eq.lion", "select": "id", "head": "true"},
        )
        monkey_resp = await client.get(
            _supabase("leads"),
            headers=SUPABASE_HEADERS,
            params={"classification": "eq.monkey", "select": "id", "head": "true"},
        )
        dog_resp = await client.get(
            _supabase("leads"),
            headers=SUPABASE_HEADERS,
            params={"classification": "eq.dog", "select": "id", "head": "true"},
        )
        sales_resp = await client.get(
            _supabase("sales_team"),
            headers=SUPABASE_HEADERS,
            params={"is_active": "eq.true", "select": "id,name,leads_handled,conversion_rate"},
        )
        return {
            "pipeline": {
                "lion_count": lion_resp.headers.get("Content-Range", "0").split("/")[-1],
                "monkey_count": monkey_resp.headers.get("Content-Range", "0").split("/")[-1],
                "dog_count": dog_resp.headers.get("Content-Range", "0").split("/")[-1],
            },
            "sales_team": sales_resp.json() if sales_resp.status_code == 200 else [],
        }
