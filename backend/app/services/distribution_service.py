"""
Distribution Service - Auto-assign leads based on tier and capacity
"""
import logging
from typing import Optional
from datetime import datetime
from ..database import get_supabase
from ..models.lead import LeadTier
from ..config import settings

logger = logging.getLogger(__name__)

class DistributionService:
    """Service for automatic lead distribution"""
    
    @staticmethod
    async def distribute_lead(lead_id: str, tier: LeadTier) -> Optional[str]:
        """
        Auto-distribute lead to sales team based on tier
        Returns: assigned_user_id or None
        """
        supabase = get_supabase()
        
        try:
            # Determine SLA based on tier
            sla_minutes = DistributionService._get_sla_for_tier(tier)
            
            # Get available sales person based on tier
            assigned_to = await DistributionService._find_best_sales_person(tier)
            
            if not assigned_to:
                logger.warning(f"No available sales person for lead {lead_id}")
                return None
            
            # Assign lead
            update_data = {
                'assigned_to': assigned_to,
                'assigned_at': datetime.utcnow().isoformat()
            }
            supabase.table('leads').update(update_data).eq('id', lead_id).execute()
            
            # Create assignment record
            assignment_data = {
                'lead_id': lead_id,
                'assigned_to': assigned_to,
                'reason': f'Auto-distributed based on {tier.value} tier',
                'sla_minutes': sla_minutes
            }
            supabase.table('lead_assignments').insert(assignment_data).execute()
            
            # Update sales team current leads count
            supabase.rpc('increment_current_leads', {'user_id': assigned_to}).execute()
            
            # Create activity
            activity = {
                'lead_id': lead_id,
                'activity_type': 'lead_assigned',
                'description': f'Auto-assigned to sales exec (SLA: {sla_minutes}min)',
                'performed_by': None,
                'metadata': {
                    'assigned_to': assigned_to,
                    'tier': tier.value,
                    'sla_minutes': sla_minutes
                }
            }
            supabase.table('lead_activities').insert(activity).execute()
            
            logger.info(f"Lead {lead_id} assigned to {assigned_to} with {sla_minutes}min SLA")
            return assigned_to
            
        except Exception as e:
            logger.error(f"Error distributing lead: {str(e)}")
            return None
    
    @staticmethod
    def _get_sla_for_tier(tier: LeadTier) -> int:
        """Get SLA minutes based on tier"""
        sla_map = {
            LeadTier.lion: settings.LION_SLA_MINUTES,
            LeadTier.monkey: settings.MONKEY_SLA_MINUTES,
            LeadTier.dog: settings.DOG_SLA_MINUTES
        }
        return sla_map.get(tier, 60)
    
    @staticmethod
    async def _find_best_sales_person(tier: LeadTier) -> Optional[str]:
        """
        Find best available sales person for the lead
        Lion -> Senior exec
        Monkey -> Round robin among all
        Dog -> Channel partners
        """
        supabase = get_supabase()
        
        try:
            if tier == LeadTier.lion:
                # Assign to senior exec with lowest current leads
                result = supabase.table('sales_team')\
                    .select('id, current_leads, max_concurrent_leads')\
                    .eq('status', 'active')\
                    .in_('role', ['admin', 'senior'])\
                    .order('current_leads', desc=False)\
                    .limit(1)\
                    .execute()
                
            elif tier == LeadTier.monkey:
                # Round robin among all active team members
                result = supabase.table('sales_team')\
                    .select('id, current_leads, max_concurrent_leads')\
                    .eq('status', 'active')\
                    .in_('role', ['admin', 'senior', 'junior'])\
                    .order('current_leads', desc=False)\
                    .limit(1)\
                    .execute()
                
            else:  # Dog
                # Assign to channel partners or junior if no partners
                result = supabase.table('sales_team')\
                    .select('id, current_leads, max_concurrent_leads')\
                    .eq('status', 'active')\
                    .in_('role', ['channel_partner', 'junior'])\
                    .order('current_leads', desc=False)\
                    .limit(1)\
                    .execute()
            
            if result.data and len(result.data) > 0:
                person = result.data[0]
                # Check capacity
                if person['current_leads'] < person['max_concurrent_leads']:
                    return person['id']
                else:
                    logger.warning(f"Selected person at capacity, assigning anyway")
                    return person['id']
            
            return None
            
        except Exception as e:
            logger.error(f"Error finding sales person: {str(e)}")
            return None
    
    @staticmethod
    async def mark_responded(assignment_id: str) -> bool:
        """Mark assignment as responded"""
        supabase = get_supabase()
        
        try:
            # Get assignment
            result = supabase.table('lead_assignments')\
                .select('*')\
                .eq('id', assignment_id)\
                .execute()
            
            if not result.data:
                return False
            
            assignment = result.data[0]
            created_at = datetime.fromisoformat(assignment['created_at'].replace('Z', '+00:00'))
            responded_at = datetime.utcnow()
            
            # Calculate if SLA was met
            response_time_minutes = (responded_at - created_at).total_seconds() / 60
            sla_met = response_time_minutes <= assignment['sla_minutes']
            
            # Update assignment
            update_data = {
                'responded_at': responded_at.isoformat(),
                'sla_met': sla_met
            }
            supabase.table('lead_assignments').update(update_data).eq('id', assignment_id).execute()
            
            logger.info(f"Assignment {assignment_id} marked as responded (SLA met: {sla_met})")
            return True
            
        except Exception as e:
            logger.error(f"Error marking responded: {str(e)}")
            return False
    
    @staticmethod
    async def reassign_lead(lead_id: str, from_user: str, to_user: str, reason: str) -> bool:
        """Reassign lead to different sales person"""
        supabase = get_supabase()
        
        try:
            # Update lead assignment
            supabase.table('leads').update({
                'assigned_to': to_user,
                'assigned_at': datetime.utcnow().isoformat()
            }).eq('id', lead_id).execute()
            
            # Create new assignment record
            assignment_data = {
                'lead_id': lead_id,
                'assigned_from': from_user,
                'assigned_to': to_user,
                'reason': reason,
                'sla_minutes': 60  # Default SLA for reassignment
            }
            supabase.table('lead_assignments').insert(assignment_data).execute()
            
            # Update counts
            supabase.rpc('decrement_current_leads', {'user_id': from_user}).execute()
            supabase.rpc('increment_current_leads', {'user_id': to_user}).execute()
            
            # Create activity
            activity = {
                'lead_id': lead_id,
                'activity_type': 'lead_reassigned',
                'description': f'Reassigned from {from_user} to {to_user}',
                'metadata': {'reason': reason}
            }
            supabase.table('lead_activities').insert(activity).execute()
            
            logger.info(f"Lead {lead_id} reassigned to {to_user}")
            return True
            
        except Exception as e:
            logger.error(f"Error reassigning lead: {str(e)}")
            return False
