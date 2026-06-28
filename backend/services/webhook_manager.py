# =============================================
# WEBHOOK MANAGEMENT SYSTEM
# Handle incoming and outgoing webhooks with security
# =============================================
from fastapi import FastAPI, Request, HTTPException, Header
from pydantic import BaseModel
from typing import Optional, Dict, Any
import hmac
import hashlib
import httpx
from datetime import datetime
from supabase import create_client, Client
import os
import logging

# =============================================
# CONFIGURATION
# =============================================
app = FastAPI(title="Webhook Manager", version="1.0")

# Supabase connection - lazy initialization
_supabase_client: Optional[Client] = None

def get_supabase_client() -> Client:
    """Lazy initialization of Supabase client"""
    global _supabase_client
    if _supabase_client is None:
        SUPABASE_URL = os.getenv("SUPABASE_URL")
        SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
        
        if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
            raise ValueError("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set")
        
        _supabase_client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
    return _supabase_client

# Logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# =============================================
# PYDANTIC MODELS
# =============================================
class WebhookEndpoint(BaseModel):
    url: str
    events: list
    secret: str
    is_active: bool = True

# =============================================
# WEBHOOK FUNCTIONS
# =============================================
def generate_signature(payload: Dict, secret: str) -> str:
    """Generate HMAC signature for webhook"""
    import json
    message = json.dumps(payload, sort_keys=True).encode()
    signature = hmac.new(
        secret.encode(),
        message,
        hashlib.sha256
    ).hexdigest()
    return signature

# =============================================
# API ENDPOINTS
# =============================================
@app.post("/webhooks/register")
async def register_webhook(endpoint: WebhookEndpoint, user_id: Optional[str] = None):
    """Register a new webhook endpoint"""
    try:
        supabase = get_supabase_client()
        
        result = supabase.table('webhook_endpoints').insert({
            "url": endpoint.url,
            "events": endpoint.events,
            "secret": endpoint.secret,
            "is_active": endpoint.is_active,
            "created_by": user_id
        }).execute()
        
        if not result.data:
            raise HTTPException(500, "Failed to create webhook endpoint")
        
        return {"success": True, "webhook_id": result.data[0]['id']}
    except Exception as e:
        logger.error(f"Webhook registration failed: {str(e)}")
        raise HTTPException(500, f"Registration failed: {str(e)}")

@app.post("/webhooks/trigger")
async def trigger_webhook(event_type: str, payload: Dict[str, Any]):
    """
    Trigger webhooks for an event
    Called internally when events occur
    """
    try:
        supabase = get_supabase_client()
        
        # Get all active webhooks for this event
        webhooks = supabase.table('webhook_endpoints').select('*').eq(
            'is_active', True
        ).execute()
        
        # Filter webhooks that subscribe to this event
        relevant_webhooks = [
            w for w in webhooks.data
            if event_type in (w.get('events', []) or [])
        ]
        
        results = []
        
        for webhook in relevant_webhooks:
            try:
                # Generate HMAC signature
                signature = generate_signature(payload, webhook['secret'])
                
                # Send webhook
                async with httpx.AsyncClient() as client:
                    response = await client.post(
                        webhook['url'],
                        json=payload,
                        headers={
                            'X-Webhook-Signature': signature,
                            'X-Webhook-Event': event_type
                        },
                        timeout=10.0
                    )
                
                # Log delivery
                try:
                    supabase.table('webhook_deliveries').insert({
                        "webhook_id": webhook['id'],
                        "event_type": event_type,
                        "payload": payload,
                        "status_code": response.status_code,
                        "response_body": response.text[:1000] if response.text else None,
                        "status": "delivered" if response.status_code < 400 else "failed",
                        "created_at": datetime.now().isoformat()
                    }).execute()
                except Exception as e:
                    logger.warning(f"Failed to log delivery: {e}")
                
                results.append({
                    "webhook_id": webhook['id'],
                    "success": response.status_code < 400
                })
                
            except Exception as e:
                logger.error(f"Webhook delivery failed for {webhook['id']}: {e}")
                results.append({
                    "webhook_id": webhook['id'],
                    "success": False,
                    "error": str(e)
                })
        
        return {"triggered": len(results), "results": results}
    except Exception as e:
        logger.error(f"Webhook trigger failed: {str(e)}")
        raise HTTPException(500, f"Trigger failed: {str(e)}")

@app.post("/webhooks/receive/{provider}")
async def receive_webhook(
    provider: str,
    request: Request,
    x_webhook_signature: Optional[str] = Header(None, alias="X-Webhook-Signature")
):
    """
    Receive webhooks from external providers
    """
    try:
        supabase = get_supabase_client()
        
        body = await request.body()
        payload = await request.json()
        
        # Log receipt
        try:
            supabase.table('webhook_receipts').insert({
                "provider": provider,
                "payload": payload,
                "signature": x_webhook_signature,
                "received_at": datetime.now().isoformat()
            }).execute()
        except Exception as e:
            logger.warning(f"Failed to log webhook receipt: {e}")
        
        # Process webhook based on provider and type
        # This would be extended based on specific provider requirements
        
        return {"success": True, "provider": provider}
    except Exception as e:
        logger.error(f"Webhook receipt failed: {str(e)}")
        raise HTTPException(500, f"Receipt failed: {str(e)}")

@app.get("/health")
async def health():
    return {"status": "healthy", "service": "Webhook Manager"}

