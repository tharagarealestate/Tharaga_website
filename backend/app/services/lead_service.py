"""
Lead Service - Works with existing Tharaga production schema
Adapts to existing leads table (bigint id, phone_number column, etc.)
"""
import logging
from typing import List, Dict, Optional, Tuple
from datetime import datetime
from ..database import get_supabase
from ..models.lead import (
    LeadCreate, LeadResponse, LeadTier, LeadStatus,
    LeadScoreResponse, LeadActivityCreate
)
from .scoring_service import ScoringService

logger = logging.getLogger(__name__)


class LeadService:
    """Service for lead management - adapted to existing schema"""
    
    @staticmethod
    def _to_db_format(lead_data: dict) -> dict:
        """Convert our model format to existing DB schema"""
        db_data = {}
        
        # Map fields to existing schema
        if 'name' in lead_data:
            db_data['name'] = lead_data['name']
        if 'email' in lead_data:
            db_data['email'] = lead_data['email']
        if 'phone' in lead_data:
            db_data['phone_number'] = lead_data['phone']  # existing column
            db_data['phone'] = lead_data['phone']  # backup column also exists
        if 'source' in lead_data:
            db_data['source'] = lead_data['source']
        if 'budget_max' in lead_data:
            db_data['budget'] = lead_data['budget_max']
        if 'preferred_localities' in lead_data:
            db_data['preferred_location'] = ','.join(lead_data['preferred_localities']) if lead_data['preferred_localities'] else None
        if 'property_type' in lead_data:
            db_data['property_type_interest'] = lead_data['property_type']
        if 'timeline' in lead_data:
            db_data['purchase_timeline'] = lead_data['timeline']
        if 'utm_source' in lead_data:
            db_data['utm_source'] = lead_data['utm_source']
        if 'utm_medium' in lead_data:
            db_data['utm_medium'] = lead_data['utm_medium']
        if 'utm_campaign' in lead_data:
            db_data['utm_campaign'] = lead_data['utm_campaign']
        if 'utm_content' in lead_data:
            db_data['utm_content'] = lead_data['utm_content']
        if 'fbp' in lead_data:
            db_data['fbp'] = lead_data['fbp']
        if 'fbc' in lead_data:
            db_data['fbc'] = lead_data['fbc']
        
        # Status mapping
        db_data['status'] = 'new'
        
        # Remove None values
        return {k: v for k, v in db_data.items() if v is not None}
    
    @staticmethod
    def _from_db_format(db_row: dict) -> dict:
        """Convert DB row to our model format"""
        return {
            'id': str(db_row.get('id')),
            'name': db_row.get('name') or 'Unknown',
            'email': db_row.get('email'),
            'phone': db_row.get('phone_number') or db_row.get('phone') or '',
            'source': db_row.get('source') or 'web',
            'score': int(db_row.get('smart_score') or db_row.get('score') or 0),
            'tier': db_row.get('smart_tier') or 'monkey',
            'status': db_row.get('status') or 'new',
            'is_qualified': bool(db_row.get('whatsapp_qualified', False)),
            'created_at': db_row.get('created_at') or datetime.utcnow().isoformat()
        }
    
    @staticmethod
    async def create_lead(lead_data: LeadCreate) -> Tuple[LeadResponse, LeadScoreResponse]:
        """Create new lead with SmartScore AI"""
        supabase = get_supabase()
        
        lead_dict = lead_data.model_dump()
        
        # Calculate SmartScore
        score, tier, factors = ScoringService.calculate_lead_score(lead_dict)
        
        # Prepare DB data (existing schema)
        db_data = LeadService._to_db_format(lead_dict)
        
        # Add SmartScore data (new columns - try, fallback if not exists)
        smart_score_data = {
            'smart_score': score,
            'smart_tier': tier.value,
            'smart_score_factors': factors,
            'smart_score_at': datetime.utcnow().isoformat()
        }
        
        try:
            # Try with smart_score columns
            result = supabase.table('leads').insert({**db_data, **smart_score_data}).execute()
        except Exception as e:
            err_str = str(e).lower()
            if 'smart_score' in err_str or 'smart_tier' in err_str:
                logger.warning("smart_score columns not yet added - inserting without them. Please run SUPABASE_SETUP.sql")
                # Fallback: existing 'score' has 0-10 constraint, so normalize
                # Just skip setting score to avoid constraint issues
                try:
                    result = supabase.table('leads').insert(db_data).execute()
                except Exception as e2:
                    logger.error(f"Final lead insert failed: {e2}")
                    raise
            else:
                raise
            
            if not result.data:
                raise Exception("Failed to create lead")
            
            lead_id = result.data[0]['id']
            
            # Log activity
            try:
                supabase.table('lead_activities').insert({
                    'lead_id': lead_id,
                    'activity_type': 'lead_created',
                    'description': f'Lead created with SmartScore {score} ({tier.value})'
                }).execute()
            except Exception as e:
                logger.warning(f"Failed to log activity: {e}")
            
            logger.info(f"Lead created: {lead_id} with score {score} ({tier.value})")
            
            lead_response = LeadResponse(**LeadService._from_db_format(result.data[0]))
            score_response = LeadScoreResponse(
                lead_id=str(lead_id),
                score=score,
                tier=tier,
                factors=factors,
                confidence=factors.get('confidence', 0.5)
            )
            
            return lead_response, score_response
            
        except Exception as e:
            logger.error(f"Error creating lead: {str(e)}")
            raise
    
    @staticmethod
    async def get_lead(lead_id: str) -> Optional[LeadResponse]:
        """Get lead by ID"""
        supabase = get_supabase()
        
        try:
            # leads.id is bigint, but we accept string
            lookup_id = int(lead_id) if lead_id.isdigit() else lead_id
            result = supabase.table('leads').select('*').eq('id', lookup_id).execute()
            
            if not result.data:
                return None
            
            return LeadResponse(**LeadService._from_db_format(result.data[0]))
        except Exception as e:
            logger.error(f"Error fetching lead: {str(e)}")
            return None
    
    @staticmethod
    async def update_lead_status(lead_id: str, status: LeadStatus, notes: str = None) -> bool:
        """Update lead status"""
        supabase = get_supabase()
        
        try:
            lookup_id = int(lead_id) if lead_id.isdigit() else lead_id
            
            supabase.table('leads').update({
                'status': status.value,
                'updated_at': datetime.utcnow().isoformat()
            }).eq('id', lookup_id).execute()
            
            # Log activity
            try:
                supabase.table('lead_activities').insert({
                    'lead_id': lookup_id,
                    'activity_type': 'status_changed',
                    'description': f'Status changed to {status.value}' + (f' - {notes}' if notes else '')
                }).execute()
            except Exception:
                pass
            
            return True
        except Exception as e:
            logger.error(f"Error updating status: {e}")
            return False
    
    @staticmethod
    async def qualify_lead(lead_id: str, qualification_data: dict) -> bool:
        """Mark lead as qualified"""
        supabase = get_supabase()
        
        try:
            lookup_id = int(lead_id) if lead_id.isdigit() else lead_id
            
            # Update with existing schema fields
            supabase.table('leads').update({
                'whatsapp_qualified': True,
                'qualification_data': qualification_data,
                'status': 'qualified'
            }).eq('id', lookup_id).execute()
            
            # Re-score
            lead_result = supabase.table('leads').select('*').eq('id', lookup_id).execute()
            if lead_result.data:
                lead_dict = {
                    'budget_max': lead_result.data[0].get('budget'),
                    'timeline': lead_result.data[0].get('purchase_timeline'),
                    'source': lead_result.data[0].get('source'),
                    'is_qualified': True,
                    'qualification_data': qualification_data
                }
                score, tier, factors = ScoringService.calculate_lead_score(lead_dict)
                
                supabase.table('leads').update({
                    'smart_score': score,
                    'smart_tier': tier.value,
                    'smart_score_factors': factors,
                    'smart_score_at': datetime.utcnow().isoformat()
                }).eq('id', lookup_id).execute()
            
            try:
                supabase.table('lead_activities').insert({
                    'lead_id': lookup_id,
                    'activity_type': 'lead_qualified',
                    'description': 'Lead qualified via AI'
                }).execute()
            except Exception:
                pass
            
            return True
        except Exception as e:
            logger.error(f"Error qualifying lead: {e}")
            return False
    
    @staticmethod
    async def get_lead_activities(lead_id: str) -> List[Dict]:
        """Get lead activity timeline"""
        supabase = get_supabase()
        
        try:
            lookup_id = int(lead_id) if lead_id.isdigit() else lead_id
            result = supabase.table('lead_activities')\
                .select('*')\
                .eq('lead_id', lookup_id)\
                .order('created_at', desc=True)\
                .execute()
            return result.data or []
        except Exception as e:
            logger.error(f"Error fetching activities: {e}")
            return []
    
    @staticmethod
    async def add_lead_activity(activity: LeadActivityCreate) -> bool:
        """Add activity to lead"""
        supabase = get_supabase()
        
        try:
            lookup_id = int(activity.lead_id) if activity.lead_id.isdigit() else activity.lead_id
            
            supabase.table('lead_activities').insert({
                'lead_id': lookup_id,
                'activity_type': activity.activity_type,
                'description': activity.description
            }).execute()
            return True
        except Exception as e:
            logger.error(f"Error adding activity: {e}")
            return False
    
    @staticmethod
    async def get_leads_by_tier(tier: LeadTier, limit: int = 50) -> List[LeadResponse]:
        """Get leads by SmartScore tier"""
        supabase = get_supabase()
        
        try:
            result = supabase.table('leads')\
                .select('*')\
                .eq('smart_tier', tier.value)\
                .order('created_at', desc=True)\
                .limit(limit)\
                .execute()
            
            return [LeadResponse(**LeadService._from_db_format(item)) for item in (result.data or [])]
        except Exception as e:
            logger.error(f"Error fetching by tier: {e}")
            return []
    
    @staticmethod
    async def search_leads(
        status: Optional[LeadStatus] = None,
        tier: Optional[LeadTier] = None,
        source: Optional[str] = None,
        assigned_to: Optional[str] = None,
        limit: int = 50,
        offset: int = 0
    ) -> List[LeadResponse]:
        """Search leads with filters"""
        supabase = get_supabase()
        
        try:
            query = supabase.table('leads').select('*')
            
            if status:
                query = query.eq('status', status.value)
            if tier:
                query = query.eq('smart_tier', tier.value)
            if source:
                query = query.eq('source', source)
            if assigned_to:
                query = query.eq('assigned_to', assigned_to)
            
            result = query.order('created_at', desc=True)\
                .range(offset, offset + limit - 1)\
                .execute()
            
            return [LeadResponse(**LeadService._from_db_format(item)) for item in (result.data or [])]
        except Exception as e:
            logger.error(f"Error searching leads: {e}")
            return []
