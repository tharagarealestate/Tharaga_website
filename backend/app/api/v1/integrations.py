"""
Integrations API Routes - Webhooks & External Services
"""
from fastapi import APIRouter, HTTPException, Request
from ...integrations import MetaCAPIService, WhatsAppService, ZohoCRMService
from ...config import settings

router = APIRouter()

@router.post("/meta-capi/event")
async def send_meta_event(
    event_name: str,
    lead_id: str = None,
    user_data: dict = None,
    custom_data: dict = None
):
    """Send event to Meta Conversion API"""
    result = await MetaCAPIService.send_event(
        event_name, lead_id, user_data, custom_data
    )
    return result

@router.post("/whatsapp/send")
async def send_whatsapp_message(
    phone: str,
    message: str,
    lead_id: str = None
):
    """Send WhatsApp message"""
    result = await WhatsAppService.send_message(phone, message, lead_id)
    return result

@router.get("/whatsapp/webhook")
async def whatsapp_webhook_verify(request: Request):
    """Verify WhatsApp webhook (GET request)"""
    mode = request.query_params.get('hub.mode')
    token = request.query_params.get('hub.verify_token')
    challenge = request.query_params.get('hub.challenge')
    
    if mode == 'subscribe' and token == settings.WHATSAPP_VERIFY_TOKEN:
        return int(challenge)
    else:
        raise HTTPException(status_code=403, detail="Verification failed")

@router.post("/whatsapp/webhook")
async def whatsapp_webhook_handler(payload: dict):
    """Handle incoming WhatsApp webhook (POST request)"""
    result = await WhatsAppService.handle_webhook(payload)
    return result

@router.post("/zoho-crm/sync-lead")
async def sync_lead_to_zoho(lead_data: dict):
    """Sync lead to Zoho CRM"""
    result = await ZohoCRMService.sync_lead(lead_data)
    return result