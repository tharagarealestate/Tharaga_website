"""
Lead Service - Comprehensive lead management
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
from ..config import settings

logger = logging.getLogger(__name__)

class LeadService:
    """Service for lead management operations"""
    
    @staticmethod
    async def create_lead(lead_data: LeadCreate) -> Tuple[LeadResponse, LeadScoreResponse]:
        """
        Create a new lead with automatic scoring
        Returns: (lead, score_data)
        """
        supabase = get_supabase()
        
        # Calculate SmartScore
        lead_dict = lead_data.model_dump()
        score, tier, factors = ScoringService.calculate_lead_score(lead_dict)
        
        # Prepare lead data
        insert_data = {
            **lead_dict,
            'score': score,
            'tier': tier.value,
            'status': LeadStatus.new.value,
            'is_qualified': False,
            'last_activity_at': datetime.utcnow().isoformat()
        }
        
        # Remove None values
        insert_data = {k: v for k, v in insert_data.items() if v is not None}
        
        try:
            # Insert lead
            result = supabase.table('leads').insert(insert_data).execute()
            
            if not result.data:
                raise Exception("Failed to create lead")
            
            lead_id = result.data[0]['id']
            
            # Insert score history
            score_data = {
                'lead_id': lead_id,
                'score': score,
                'tier': tier.value,
                'factors': factors,
                'model_version': 'v1'
            }
            supabase.table('lead_scores').insert(score_data).execute()
            
            # Create activity
            activity = {
                'lead_id': lead_id,
                'activity_type': 'lead_created',
                'description': f'Lead captured from {lead_data.source.value}',
                'metadata': {'initial_score': score, 'tier': tier.value}
            }
            supabase.table('lead_activities').insert(activity).execute()
            
            logger.info(f"Lead created: {lead_id} with score {score} ({tier.value})")
            
            # Prepare response
            lead_response = LeadResponse(**result.data[0])
            score_response = LeadScoreResponse(
                lead_id=lead_id,
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
            result = supabase.table('leads').select('*').eq('id', lead_id).execute()
            
            if not result.data:
                return None
            
            return LeadResponse(**result.data[0])
        except Exception as e:
            logger.error(f"Error fetching lead: {str(e)}")
            return None
    
    @staticmethod
    async def update_lead_status(lead_id: str, status: LeadStatus, notes: str = None) -> bool:
        """Update lead status"""
        supabase = get_supabase()
        
        try:
            # Update lead
            update_data = {
                'status': status.value,
                'updated_at': datetime.utcnow().isoformat()
            }
            supabase.table('leads').update(update_data).eq('id', lead_id).execute()
            
            # Create activity
            activity = {
                'lead_id': lead_id,
                'activity_type': 'status_changed',
                'description': f'Status changed to {status.value}',
                'metadata': {'new_status': status.value, 'notes': notes}
            }
            supabase.table('lead_activities').insert(activity).execute()
            
            logger.info(f"Lead {lead_id} status updated to {status.value}")
            return True
            
        except Exception as e:
            logger.error(f"Error updating lead status: {str(e)}")
            return False
    
    @staticmethod
    async def qualify_lead(lead_id: str, qualification_data: dict) -> bool:
        """Mark lead as qualified with qualification data"""
        supabase = get_supabase()
        
        try:
            # Update lead
            update_data = {
                'is_qualified': True,
                'qualification_data': qualification_data,
                'qualification_completed_at': datetime.utcnow().isoformat(),
                'status': LeadStatus.qualified.value
            }
            supabase.table('leads').update(update_data).eq('id', lead_id).execute()
            
            # Re-score with qualification data
            lead_result = supabase.table('leads').select('*').eq('id', lead_id).execute()
            if lead_result.data:
                lead_dict = lead_result.data[0]
                score, tier, factors = ScoringService.calculate_lead_score(lead_dict)
                
                # Update score
                supabase.table('leads').update({
                    'score': score,
                    'tier': tier.value
                }).eq('id', lead_id).execute()
                
                # Insert new score
                score_data = {
                    'lead_id': lead_id,
                    'score': score,
                    'tier': tier.value,
                    'factors': factors,
                    'model_version': 'v1'
                }
                supabase.table('lead_scores').insert(score_data).execute()
            
            # Create activity
            activity = {
                'lead_id': lead_id,
                'activity_type': 'lead_qualified',
                'description': 'Lead qualified via AI',
                'metadata': qualification_data
            }
            supabase.table('lead_activities').insert(activity).execute()
            
            logger.info(f"Lead {lead_id} qualified")
            return True
            
        except Exception as e:
            logger.error(f"Error qualifying lead: {str(e)}")
            return False
    
    @staticmethod
    async def get_lead_activities(lead_id: str) -> List[Dict]:
        """Get all activities for a lead"""
        supabase = get_supabase()
        
        try:
            result = supabase.table('lead_activities')\
                .select('*')\
                .eq('lead_id', lead_id)\
                .order('created_at', desc=True)\
                .execute()
            
            return result.data or []
        except Exception as e:
            logger.error(f"Error fetching activities: {str(e)}")
            return []
    
    @staticmethod
    async def add_lead_activity(activity: LeadActivityCreate) -> bool:
        """Add activity to lead"""
        supabase = get_supabase()
        
        try:
            activity_data = activity.model_dump()
            supabase.table('lead_activities').insert(activity_data).execute()
            logger.info(f"Activity added to lead {activity.lead_id}")
            return True
        except Exception as e:
            logger.error(f"Error adding activity: {str(e)}")
            return False
    
    @staticmethod
    async def get_leads_by_tier(tier: LeadTier, limit: int = 50) -> List[LeadResponse]:
        """Get leads by tier"""
        supabase = get_supabase()
        
        try:
            result = supabase.table('leads')\
                .select('*')\
                .eq('tier', tier.value)\
                .order('created_at', desc=True)\
                .limit(limit)\
                .execute()
            
            return [LeadResponse(**item) for item in result.data] if result.data else []
        except Exception as e:
            logger.error(f"Error fetching leads by tier: {str(e)}")
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
                query = query.eq('tier', tier.value)
            if source:
                query = query.eq('source', source)
            if assigned_to:
                query = query.eq('assigned_to', assigned_to)
            
            result = query.order('created_at', desc=True)\
                .range(offset, offset + limit - 1)\
                .execute()
            
            return [LeadResponse(**item) for item in result.data] if result.data else []
        except Exception as e:
            logger.error(f"Error searching leads: {str(e)}")
            return []
