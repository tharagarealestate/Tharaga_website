"""
Integration Services - Meta CAPI, WhatsApp, Zoho CRM
"""
import logging
import hashlib
import aiohttp
import json
from typing import Dict, Optional
from datetime import datetime
from ..config import settings
from ..database import get_supabase

logger = logging.getLogger(__name__)


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
            # Prepare event data
            event_id = f"{lead_id}_{event_name}_{int(datetime.utcnow().timestamp())}"
            event_time = int(datetime.utcnow().timestamp())
            
            # Hash user data (required by Meta)
            hashed_user_data = {}
            if user_data:
                if user_data.get('email'):
                    hashed_user_data['em'] = [MetaCAPIService._hash_data(user_data['email'])]
                if user_data.get('phone'):
                    # Remove +91 or any country code, keep numbers only
                    phone = ''.join(filter(str.isdigit, user_data['phone']))
                    hashed_user_data['ph'] = [MetaCAPIService._hash_data(phone)]
                if user_data.get('first_name'):
                    hashed_user_data['fn'] = [MetaCAPIService._hash_data(user_data['first_name'])]
                if user_data.get('last_name'):
                    hashed_user_data['ln'] = [MetaCAPIService._hash_data(user_data['last_name'])]
                if user_data.get('city'):
                    hashed_user_data['ct'] = [MetaCAPIService._hash_data(user_data['city'])]
                if user_data.get('country'):
                    hashed_user_data['country'] = [MetaCAPIService._hash_data(user_data['country'])]
                
                # Add client identifiers
                if user_data.get('fbp'):
                    hashed_user_data['fbp'] = user_data['fbp']
                if user_data.get('fbc'):
                    hashed_user_data['fbc'] = user_data['fbc']
                if user_data.get('client_ip_address'):
                    hashed_user_data['client_ip_address'] = user_data['client_ip_address']
                if user_data.get('client_user_agent'):
                    hashed_user_data['client_user_agent'] = user_data['client_user_agent']
            
            # Build event payload
            event_data = {
                'event_name': event_name,
                'event_time': event_time,
                'event_id': event_id,
                'event_source_url': custom_data.get('source_url', 'https://tharaga.co.in') if custom_data else 'https://tharaga.co.in',
                'action_source': 'website',
                'user_data': hashed_user_data
            }
            
            if custom_data:
                event_data['custom_data'] = custom_data
            
            # API payload
            payload = {
                'data': [event_data],
                'access_token': settings.META_ACCESS_TOKEN
            }
            
            # Send to Meta
            url = f"{MetaCAPIService.BASE_URL}/{settings.META_PIXEL_ID}/events"
            
            async with aiohttp.ClientSession() as session:
                async with session.post(url, json=payload) as response:
                    result = await response.json()
                    
                    # Store event in database
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
                        'events_dropped': result.get('events_dropped', 0),
                        'sent_to_meta': True,
                        'sent_at': datetime.utcnow().isoformat()
                    }
                    
                    supabase.table('meta_events').insert(event_record).execute()
                    
                    logger.info(f"Meta CAPI event sent: {event_name} (Lead: {lead_id})")
                    return {'success': True, 'result': result}
                    
        except Exception as e:
            logger.error(f"Error sending Meta CAPI event: {str(e)}")
            return {'success': False, 'error': str(e)}
    
    @staticmethod
    def _hash_data(value: str) -> str:
        """Hash data using SHA256 (Meta requirement)"""
        return hashlib.sha256(value.lower().strip().encode()).hexdigest()


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
            # Format phone (remove + and spaces)
            formatted_phone = ''.join(filter(str.isdigit, phone))
            if not formatted_phone.startswith('91'):  # Add country code if missing
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
            
            async with aiohttp.ClientSession() as session:
                async with session.post(url, json=payload, headers=headers) as response:
                    result = await response.json()
                    
                    # Log to database
                    if lead_id:
                        supabase = get_supabase()
                        # Update or create conversation
                        conversation = supabase.table('whatsapp_conversations')\\\n                            .select('*')\\\n                            .eq('lead_id', lead_id)\\\n                            .execute()
                        
                        messages_log = []
                        if conversation.data:
                            messages_log = conversation.data[0].get('messages', [])
                        
                        messages_log.append({
                            'type': 'outbound',
                            'message': message,
                            'timestamp': datetime.utcnow().isoformat(),
                            'status': 'sent' if result.get('messages') else 'failed'
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
                    
                    logger.info(f"WhatsApp message sent to {phone}")
                    return {'success': True, 'result': result}
                    
        except Exception as e:
            logger.error(f"Error sending WhatsApp message: {str(e)}")
            return {'success': False, 'error': str(e)}
    
    @staticmethod
    async def handle_webhook(payload: Dict) -> Dict:
        """Handle incoming WhatsApp webhook"""
        try:
            # Extract message data
            entry = payload.get('entry', [])[0] if payload.get('entry') else None
            if not entry:
                return {'success': False, 'error': 'No entry in payload'}
            
            changes = entry.get('changes', [])[0] if entry.get('changes') else None
            if not changes:
                return {'success': False, 'error': 'No changes in entry'}
            
            value = changes.get('value', {})
            messages = value.get('messages', [])
            
            if not messages:
                return {'success': True, 'message': 'No messages to process'}
            
            message = messages[0]
            from_phone = message.get('from')
            message_text = message.get('text', {}).get('body', '')
            
            # Find lead by phone
            supabase = get_supabase()
            lead_result = supabase.table('leads')\\\n                .select('*')\\\n                .eq('phone', from_phone)\\\n                .execute()
            
            lead_id = lead_result.data[0]['id'] if lead_result.data else None
            
            # Log message
            if lead_id:
                conversation = supabase.table('whatsapp_conversations')\\\n                    .select('*')\\\n                    .eq('lead_id', lead_id)\\\n                    .execute()
                
                messages_log = []
                if conversation.data:
                    messages_log = conversation.data[0].get('messages', [])
                
                messages_log.append({
                    'type': 'inbound',
                    'message': message_text,
                    'timestamp': datetime.utcnow().isoformat()
                })
                
                if conversation.data:
                    supabase.table('whatsapp_conversations').update({
                        'messages': messages_log,
                        'last_message_at': datetime.utcnow().isoformat()
                    }).eq('lead_id', lead_id).execute()
                else:
                    supabase.table('whatsapp_conversations').insert({
                        'lead_id': lead_id,
                        'phone': from_phone,
                        'messages': messages_log,
                        'last_message_at': datetime.utcnow().isoformat()
                    }).execute()
                
                # Add activity
                supabase.table('lead_activities').insert({
                    'lead_id': lead_id,
                    'activity_type': 'whatsapp_message_received',
                    'description': f'Received WhatsApp message: {message_text[:50]}...',
                    'metadata': {'message': message_text}
                }).execute()
            
            logger.info(f"WhatsApp webhook processed for {from_phone}")
            return {'success': True, 'lead_id': lead_id}
            
        except Exception as e:
            logger.error(f"Error handling WhatsApp webhook: {str(e)}")
            return {'success': False, 'error': str(e)}


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
            # Get access token (In production, implement proper token refresh)
            access_token = await ZohoCRMService._get_access_token()
            
            if not access_token:
                return {'success': False, 'error': 'Failed to get access token'}
            
            # Prepare lead data for Zoho
            zoho_lead = {
                'First_Name': lead_data.get('name', '').split()[0] if lead_data.get('name') else 'Unknown',
                'Last_Name': ' '.join(lead_data.get('name', '').split()[1:]) if len(lead_data.get('name', '').split()) > 1 else 'Lead',
                'Email': lead_data.get('email'),
                'Phone': lead_data.get('phone'),
                'Lead_Source': lead_data.get('source', 'Website'),
                'Lead_Status': 'Not Contacted',
                'Description': f\"Budget: {lead_data.get('budget_min')} - {lead_data.get('budget_max')}\\nLocality: {lead_data.get('preferred_localities')}\",
                'Tharaga_Score': lead_data.get('score'),
                'Tharaga_Tier': lead_data.get('tier', '').upper(),
                'Tharaga_Lead_ID': lead_data.get('id')
            }
            
            payload = {'data': [zoho_lead]}
            
            url = f"{ZohoCRMService.BASE_URL}/Leads"
            headers = {
                'Authorization': f'Bearer {access_token}',
                'Content-Type': 'application/json'
            }
            
            async with aiohttp.ClientSession() as session:
                async with session.post(url, json=payload, headers=headers) as response:
                    result = await response.json()
                    
                    # Log sync
                    supabase = get_supabase()
                    sync_log = {
                        'entity_type': 'lead',
                        'entity_id': lead_data.get('id'),
                        'crm_entity_id': result.get('data', [{}])[0].get('details', {}).get('id') if result.get('data') else None,
                        'operation': 'create',
                        'sync_status': 'success' if result.get('data') else 'failed',
                        'request_payload': zoho_lead,
                        'response_payload': result,
                        'synced_at': datetime.utcnow().isoformat()
                    }
                    
                    supabase.table('crm_sync_log').insert(sync_log).execute()
                    
                    logger.info(f\"Zoho CRM sync completed for lead {lead_data.get('id')}\")\n                    return {'success': True, 'result': result}
                    
        except Exception as e:
            logger.error(f"Error syncing to Zoho CRM: {str(e)}")
            return {'success': False, 'error': str(e)}
    
    @staticmethod
    async def _get_access_token() -> Optional[str]:
        """Get Zoho access token using refresh token"""
        # In production, implement proper OAuth2 token refresh
        # For now, return None (requires proper OAuth setup)
        return None
