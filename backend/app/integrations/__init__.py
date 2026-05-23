"""
Integration Services - Meta CAPI, WhatsApp, Zoho CRM
With circuit breakers, retries, and proper error handling
"""
import logging
import hashlib
import aiohttp
from typing import Dict, Optional
from datetime import datetime
from ..config import settings
from ..database import get_supabase
from ..utils import meta_circuit_breaker, whatsapp_circuit_breaker, async_retry

logger = logging.getLogger(__name__)


# ============================================
# META CAPI SERVICE
# ============================================
class MetaCAPIService:
    """Meta Conversion API Integration"""
    BASE_URL = "https://graph.facebook.com/v18.0"
    
    @staticmethod
    async def send_event(
        event_name: str,
        lead_id: Optional[str] = None,
        user_data: Optional[Dict] = None,
        custom_data: Optional[Dict] = None
    ) -> Dict:
        """Send event to Meta Conversion API"""
        if not settings.META_ACCESS_TOKEN or not settings.META_PIXEL_ID:
            logger.warning("Meta CAPI credentials not configured")
            return {'success': False, 'error': 'Credentials not configured'}
        
        try:
            return await meta_circuit_breaker.call(
                MetaCAPIService._send_event_impl,
                event_name, lead_id, user_data, custom_data
            )
        except Exception as e:
            logger.error(f"Meta CAPI error: {str(e)}")
            return {'success': False, 'error': str(e)}
    
    @staticmethod
    async def _send_event_impl(
        event_name: str,
        lead_id: Optional[str],
        user_data: Optional[Dict],
        custom_data: Optional[Dict]
    ) -> Dict:
        """Internal implementation with retry"""
        event_id = f"{lead_id or 'anon'}_{event_name}_{int(datetime.utcnow().timestamp())}"
        event_time = int(datetime.utcnow().timestamp())
        
        hashed_user_data = {}
        if user_data:
            if user_data.get('email'):
                hashed_user_data['em'] = [MetaCAPIService._hash_data(user_data['email'])]
            if user_data.get('phone'):
                phone = ''.join(filter(str.isdigit, user_data['phone']))
                hashed_user_data['ph'] = [MetaCAPIService._hash_data(phone)]
            if user_data.get('first_name'):
                hashed_user_data['fn'] = [MetaCAPIService._hash_data(user_data['first_name'])]
            if user_data.get('last_name'):
                hashed_user_data['ln'] = [MetaCAPIService._hash_data(user_data['last_name'])]
            if user_data.get('city'):
                hashed_user_data['ct'] = [MetaCAPIService._hash_data(user_data['city'])]
            
            for key in ['fbp', 'fbc', 'client_ip_address', 'client_user_agent']:
                if user_data.get(key):
                    hashed_user_data[key] = user_data[key]
        
        event_data = {
            'event_name': event_name,
            'event_time': event_time,
            'event_id': event_id,
            'event_source_url': custom_data.get('source_url', 'https://tharaga.co.in') if custom_data else 'https://tharaga.co.in',
            'action_source': 'website',
            'user_data': hashed_user_data
        }
        
        if custom_data:
            # Remove source_url from custom_data as it's used elsewhere
            cd = {k: v for k, v in custom_data.items() if k != 'source_url'}
            if cd:
                event_data['custom_data'] = cd
        
        payload = {
            'data': [event_data],
            'access_token': settings.META_ACCESS_TOKEN
        }
        
        url = f"{MetaCAPIService.BASE_URL}/{settings.META_PIXEL_ID}/events"
        
        timeout = aiohttp.ClientTimeout(total=10)
        async with aiohttp.ClientSession(timeout=timeout) as session:
            async with session.post(url, json=payload) as response:
                result = await response.json()
                
                # Store event
                try:
                    supabase = get_supabase()
                    event_record = {
                        'lead_id': lead_id,
                        'event_name': event_name,
                        'event_id': event_id,
                        'event_time': datetime.utcfromtimestamp(event_time).isoformat(),
                        'fbp': user_data.get('fbp') if user_data else None,
                        'fbc': user_data.get('fbc') if user_data else None,
                        'user_data': hashed_user_data,
                        'custom_data': custom_data,
                        'fb_response': result,
                        'events_received': result.get('events_received', 0),
                        'events_dropped': 0,
                        'sent_to_meta': True,
                        'sent_at': datetime.utcnow().isoformat()
                    }
                    supabase.table('meta_events').insert(event_record).execute()
                except Exception as e:
                    logger.warning(f"Failed to log Meta event to DB: {e}")
                
                logger.info(f"Meta CAPI event sent: {event_name} (Lead: {lead_id}, Status: {response.status})")
                return {'success': response.status < 400, 'result': result, 'status': response.status}
    
    @staticmethod
    def _hash_data(value: str) -> str:
        """Hash data using SHA256 (Meta requirement)"""
        return hashlib.sha256(value.lower().strip().encode()).hexdigest()


# ============================================
# WHATSAPP SERVICE
# ============================================
class WhatsAppService:
    """WhatsApp Business API Integration"""
    BASE_URL = "https://graph.facebook.com/v18.0"
    
    @staticmethod
    async def send_message(phone: str, message: str, lead_id: Optional[str] = None) -> Dict:
        """Send WhatsApp message"""
        if not settings.WHATSAPP_ACCESS_TOKEN or not settings.WHATSAPP_PHONE_NUMBER_ID:
            logger.warning("WhatsApp credentials not configured")
            return {'success': False, 'error': 'Credentials not configured'}
        
        try:
            return await whatsapp_circuit_breaker.call(
                WhatsAppService._send_message_impl,
                phone, message, lead_id
            )
        except Exception as e:
            logger.error(f"WhatsApp error: {str(e)}")
            return {'success': False, 'error': str(e)}
    
    @staticmethod
    async def _send_message_impl(phone: str, message: str, lead_id: Optional[str]) -> Dict:
        """Internal implementation"""
        formatted_phone = ''.join(filter(str.isdigit, phone))
        if not formatted_phone.startswith('91') and len(formatted_phone) == 10:
            formatted_phone = f"91{formatted_phone}"
        
        payload = {
            'messaging_product': 'whatsapp',
            'to': formatted_phone,
            'type': 'text',
            'text': {'body': message}
        }
        
        url = f"{WhatsAppService.BASE_URL}/{settings.WHATSAPP_PHONE_NUMBER_ID}/messages"
        headers = {
            'Authorization': f'Bearer {settings.WHATSAPP_ACCESS_TOKEN}',
            'Content-Type': 'application/json'
        }
        
        timeout = aiohttp.ClientTimeout(total=10)
        async with aiohttp.ClientSession(timeout=timeout) as session:
            async with session.post(url, json=payload, headers=headers) as response:
                result = await response.json()
                
                # Log to database
                if lead_id:
                    try:
                        WhatsAppService._log_message(lead_id, phone, message, 'outbound', result)
                    except Exception as e:
                        logger.warning(f"Failed to log WhatsApp message: {e}")
                
                logger.info(f"WhatsApp message sent to {phone} (Status: {response.status})")
                return {'success': response.status < 400, 'result': result}
    
    @staticmethod
    def _log_message(lead_id: str, phone: str, message: str, direction: str, response: Dict = None):
        """Log WhatsApp message to database"""
        supabase = get_supabase()
        conversation = supabase.table('whatsapp_conversations')\
            .select('*').eq('lead_id', lead_id).execute()
        
        messages_log = []
        if conversation.data:
            messages_log = conversation.data[0].get('messages', []) or []
        
        messages_log.append({
            'type': direction,
            'message': message,
            'timestamp': datetime.utcnow().isoformat(),
            'status': 'sent' if response and response.get('messages') else 'received'
        })
        
        if conversation.data:
            supabase.table('whatsapp_conversations').update({
                'messages': messages_log,
                'last_message_at': datetime.utcnow().isoformat()
            }).eq('lead_id', lead_id).execute()
        else:
            supabase.table('whatsapp_conversations').insert({
                'lead_id': lead_id,
                'phone': phone,
                'messages': messages_log,
                'last_message_at': datetime.utcnow().isoformat()
            }).execute()
    
    @staticmethod
    async def handle_webhook(payload: Dict) -> Dict:
        """Handle incoming WhatsApp webhook"""
        try:
            entry = payload.get('entry', [])
            if not entry:
                return {'success': True, 'message': 'No entry'}
            
            changes = entry[0].get('changes', [])
            if not changes:
                return {'success': True, 'message': 'No changes'}
            
            value = changes[0].get('value', {})
            messages = value.get('messages', [])
            
            if not messages:
                return {'success': True, 'message': 'No messages'}
            
            message = messages[0]
            from_phone = message.get('from')
            message_text = message.get('text', {}).get('body', '')
            
            supabase = get_supabase()
            lead_result = supabase.table('leads')\
                .select('*').eq('phone', from_phone).execute()
            
            lead_id = lead_result.data[0]['id'] if lead_result.data else None
            
            if lead_id:
                WhatsAppService._log_message(lead_id, from_phone, message_text, 'inbound')
                
                supabase.table('lead_activities').insert({
                    'lead_id': lead_id,
                    'activity_type': 'whatsapp_message_received',
                    'description': f'Received WhatsApp: {message_text[:50]}',
                    'metadata': {'message': message_text}
                }).execute()
            
            logger.info(f"WhatsApp webhook processed for {from_phone}")
            return {'success': True, 'lead_id': lead_id}
            
        except Exception as e:
            logger.error(f"WhatsApp webhook error: {str(e)}")
            return {'success': False, 'error': str(e)}


# ============================================
# ZOHO CRM SERVICE
# ============================================
class ZohoCRMService:
    """Zoho CRM Integration"""
    BASE_URL = "https://www.zohoapis.in/crm/v3"
    
    @staticmethod
    async def sync_lead(lead_data: Dict) -> Dict:
        """Sync lead to Zoho CRM"""
        if not settings.ZOHO_REFRESH_TOKEN:
            logger.warning("Zoho CRM credentials not configured")
            return {'success': False, 'error': 'Credentials not configured'}
        
        try:
            access_token = await ZohoCRMService._get_access_token()
            if not access_token:
                return {'success': False, 'error': 'Failed to get access token'}
            
            name_parts = (lead_data.get('name', '') or 'Unknown Lead').split()
            zoho_lead = {
                'First_Name': name_parts[0] if name_parts else 'Unknown',
                'Last_Name': ' '.join(name_parts[1:]) if len(name_parts) > 1 else 'Lead',
                'Email': lead_data.get('email'),
                'Phone': lead_data.get('phone'),
                'Lead_Source': lead_data.get('source', 'Website').title(),
                'Lead_Status': 'Not Contacted',
                'Description': f"Score: {lead_data.get('score')}, Tier: {lead_data.get('tier')}"
            }
            
            payload = {'data': [zoho_lead]}
            url = f"{ZohoCRMService.BASE_URL}/Leads"
            headers = {
                'Authorization': f'Bearer {access_token}',
                'Content-Type': 'application/json'
            }
            
            timeout = aiohttp.ClientTimeout(total=15)
            async with aiohttp.ClientSession(timeout=timeout) as session:
                async with session.post(url, json=payload, headers=headers) as response:
                    result = await response.json()
                    
                    # Log sync
                    try:
                        supabase = get_supabase()
                        sync_log = {
                            'entity_type': 'lead',
                            'entity_id': lead_data.get('id'),
                            'crm_entity_id': result.get('data', [{}])[0].get('details', {}).get('id') if result.get('data') else None,
                            'operation': 'create',
                            'sync_status': 'success' if response.status < 400 else 'failed',
                            'request_payload': zoho_lead,
                            'response_payload': result,
                            'synced_at': datetime.utcnow().isoformat()
                        }
                        supabase.table('crm_sync_log').insert(sync_log).execute()
                    except Exception as e:
                        logger.warning(f"Failed to log CRM sync: {e}")
                    
                    return {'success': response.status < 400, 'result': result}
                    
        except Exception as e:
            logger.error(f"Zoho CRM error: {str(e)}")
            return {'success': False, 'error': str(e)}
    
    @staticmethod
    async def _get_access_token() -> Optional[str]:
        """Get Zoho access token using refresh token"""
        if not settings.ZOHO_CLIENT_ID or not settings.ZOHO_CLIENT_SECRET:
            return None
        
        try:
            url = "https://accounts.zoho.in/oauth/v2/token"
            params = {
                'refresh_token': settings.ZOHO_REFRESH_TOKEN,
                'client_id': settings.ZOHO_CLIENT_ID,
                'client_secret': settings.ZOHO_CLIENT_SECRET,
                'grant_type': 'refresh_token'
            }
            
            timeout = aiohttp.ClientTimeout(total=10)
            async with aiohttp.ClientSession(timeout=timeout) as session:
                async with session.post(url, params=params) as response:
                    data = await response.json()
                    return data.get('access_token')
        except Exception as e:
            logger.error(f"Error getting Zoho token: {e}")
            return None
