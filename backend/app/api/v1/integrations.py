"""
Integrations API Routes - Webhooks & External Services
"""
from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel, Field
from typing import Optional, Dict
from ...integrations import MetaCAPIService, WhatsAppService, ZohoCRMService
from ...config import settings

router = APIRouter()


# Request Models
class MetaEventRequest(BaseModel):
    event_name: str = Field(..., min_length=1)
    lead_id: Optional[str] = None
    user_data: Optional[Dict] = None
    custom_data: Optional[Dict] = None


class WhatsAppSendRequest(BaseModel):
    phone: str = Field(..., min_length=10)
    message: str = Field(..., min_length=1, max_length=4000)
    lead_id: Optional[str] = None


class ZohoSyncRequest(BaseModel):
    lead_data: Dict


@router.post("/meta-capi/event")
async def send_meta_event(request: MetaEventRequest):
    """Send event to Meta Conversion API"""
    result = await MetaCAPIService.send_event(
        request.event_name,
        request.lead_id,
        request.user_data,
        request.custom_data
    )
    return result


@router.post("/whatsapp/send")
async def send_whatsapp_message(request: WhatsAppSendRequest):
    """Send WhatsApp message"""
    result = await WhatsAppService.send_message(request.phone, request.message, request.lead_id)
    return result


@router.get("/whatsapp/webhook")
async def whatsapp_webhook_verify(request: Request):
    """Verify WhatsApp webhook (GET request)"""
    mode = request.query_params.get('hub.mode')
    token = request.query_params.get('hub.verify_token')
    challenge = request.query_params.get('hub.challenge')
    
    if mode == 'subscribe' and token == settings.WHATSAPP_VERIFY_TOKEN:
        return int(challenge) if challenge else 0
    else:
        raise HTTPException(status_code=403, detail="Verification failed")


@router.post("/whatsapp/webhook")
async def whatsapp_webhook_handler(payload: dict):
    """Handle incoming WhatsApp webhook"""
    result = await WhatsAppService.handle_webhook(payload)
    return result


@router.post("/zoho-crm/sync-lead")
async def sync_lead_to_zoho(request: ZohoSyncRequest):
    """Sync lead to Zoho CRM"""
    result = await ZohoCRMService.sync_lead(request.lead_data)
    return result
