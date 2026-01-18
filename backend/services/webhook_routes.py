# =============================================
# WEBHOOK MANAGER API ROUTES
# =============================================
from fastapi import APIRouter, Request, HTTPException, Header
from pydantic import BaseModel
from typing import Optional, Dict, Any
import os
import sys
from pathlib import Path

# Add backend directory to path
backend_dir = Path(__file__).parent.parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from services.webhook_manager import (
    register_webhook,
    trigger_webhook,
    receive_webhook,
    WebhookEndpoint
)

router = APIRouter(prefix="/api/webhooks", tags=["webhooks"])

@router.post("/register")
async def register_route(endpoint: WebhookEndpoint, user_id: Optional[str] = None):
    """Register webhook endpoint"""
    return await register_webhook(endpoint, user_id)

@router.post("/trigger")
async def trigger_route(event_type: str, payload: Dict[str, Any]):
    """Trigger webhook endpoint"""
    return await trigger_webhook(event_type, payload)

@router.post("/receive/{provider}")
async def receive_route(
    provider: str,
    request: Request,
    x_webhook_signature: Optional[str] = Header(None, alias="X-Webhook-Signature")
):
    """Receive webhook endpoint"""
    return await receive_webhook(provider, request, x_webhook_signature)

@router.get("/health")
async def health_route():
    return {"status": "healthy", "service": "Webhook Manager"}

