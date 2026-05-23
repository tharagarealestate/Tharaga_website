"""
Builder Service - Builder management and dashboard
"""
import logging
from typing import Optional, Dict, List
from datetime import datetime, timedelta
from ..database import get_supabase
from ..models.builder import BuilderCreate, BuilderResponse, BuilderDashboard

logger = logging.getLogger(__name__)

class BuilderService:
    """Service for builder operations"""
    
    @staticmethod
    async def create_builder(builder_data: BuilderCreate, user_id: str) -> BuilderResponse:
        """Create new builder profile"""
        supabase = get_supabase()
        
        try:
            insert_data = {
                **builder_data.model_dump(),
                'user_id': user_id,
                'is_verified': False,
                'trust_score': 70  # Default trust score
            }
            
            result = supabase.table('builders').insert(insert_data).execute()
            
            if not result.data:
                raise Exception("Failed to create builder")
            
            logger.info(f"Builder created: {result.data[0]['id']}")
            return BuilderResponse(**result.data[0])
            
        except Exception as e:
            logger.error(f"Error creating builder: {str(e)}")
            raise
    
    @staticmethod
    async def get_builder(builder_id: str) -> Optional[BuilderResponse]:
        """Get builder by ID"""
        supabase = get_supabase()
        
        try:
            result = supabase.table('builders').select('*').eq('id', builder_id).execute()
            
            if not result.data:
                return None
            
            return BuilderResponse(**result.data[0])
        except Exception as e:
            logger.error(f"Error fetching builder: {str(e)}")
            return None
    
    @staticmethod
    async def get_builder_dashboard(builder_id: str) -> BuilderDashboard:
        """Get comprehensive dashboard data for builder"""
        supabase = get_supabase()
        
        try:
            # Get today's leads
            today = datetime.utcnow().date()
            leads_result = supabase.table('leads')\
                .select('tier, status')\
                .gte('created_at', today.isoformat())\
                .execute()
            
            leads = leads_result.data or []
            
            # Count by tier
            lion_leads = sum(1 for l in leads if l.get('tier') == 'lion')
            monkey_leads = sum(1 for l in leads if l.get('tier') == 'monkey')
            dog_leads = sum(1 for l in leads if l.get('tier') == 'dog')
            active_leads = len(leads)
            
            # Get converted leads today
            converted_today = sum(1 for l in leads if l.get('status') == 'converted')
            
            # Get converted leads this week
            week_ago = today - timedelta(days=7)
            week_leads = supabase.table('leads')\
                .select('status')\
                .gte('created_at', week_ago.isoformat())\
                .eq('status', 'converted')\
                .execute()
            converted_week = len(week_leads.data) if week_leads.data else 0
            
            # Calculate conversion rate
            total_leads = supabase.table('leads').select('id', count='exact').execute()
            total_converted = supabase.table('leads')\
                .select('id', count='exact')\
                .eq('status', 'converted')\
                .execute()
            
            total_count = total_leads.count or 0
            converted_count = total_converted.count or 0
            conversion_rate = (converted_count / total_count * 100) if total_count > 0 else 0
            
            # Get pipeline value (sum of budget_max for active qualified leads)
            pipeline_result = supabase.table('leads')\
                .select('budget_max')\
                .eq('is_qualified', True)\
                .in_('status', ['qualified', 'contacted', 'nurturing'])\
                .execute()
            
            pipeline_value = sum(
                float(l.get('budget_max', 0)) 
                for l in (pipeline_result.data or []) 
                if l.get('budget_max')
            )
            
            # Get response metrics from builder analytics
            analytics = supabase.table('builder_analytics')\
                .select('avg_response_time_minutes, sla_met_percentage')\
                .eq('builder_id', builder_id)\
                .order('date', desc=True)\
                .limit(7)\
                .execute()
            
            avg_response_time = None
            sla_met_percentage = None
            if analytics.data:
                response_times = [a.get('avg_response_time_minutes') for a in analytics.data if a.get('avg_response_time_minutes')]
                sla_percentages = [a.get('sla_met_percentage') for a in analytics.data if a.get('sla_met_percentage')]
                
                if response_times:
                    avg_response_time = sum(response_times) / len(response_times)
                if sla_percentages:
                    sla_met_percentage = sum(sla_percentages) / len(sla_percentages)
            
            # Get property counts
            properties = supabase.table('properties')\
                .select('status', count='exact')\
                .eq('builder_id', builder_id)\
                .execute()
            total_properties = properties.count or 0
            
            active_properties = supabase.table('properties')\
                .select('id', count='exact')\
                .eq('builder_id', builder_id)\
                .eq('status', 'available')\
                .execute()
            active_count = active_properties.count or 0
            
            return BuilderDashboard(
                builder_id=builder_id,
                active_leads=active_leads,
                lion_leads=lion_leads,
                monkey_leads=monkey_leads,
                dog_leads=dog_leads,
                pipeline_value=pipeline_value,
                leads_converted_today=converted_today,
                leads_converted_week=converted_week,
                conversion_rate=round(conversion_rate, 2),
                avg_response_time_minutes=round(avg_response_time, 2) if avg_response_time else None,
                sla_met_percentage=round(sla_met_percentage, 2) if sla_met_percentage else None,
                total_properties=total_properties,
                active_properties=active_count
            )
            
        except Exception as e:
            logger.error(f"Error fetching builder dashboard: {str(e)}")
            raise
    
    @staticmethod
    async def get_builder_properties(builder_id: str, limit: int = 50) -> List[Dict]:
        """Get all properties for a builder"""
        supabase = get_supabase()
        
        try:
            result = supabase.table('properties')\
                .select('*')\
                .eq('builder_id', builder_id)\
                .order('created_at', desc=True)\
                .limit(limit)\
                .execute()
            
            return result.data or []
        except Exception as e:
            logger.error(f"Error fetching builder properties: {str(e)}")
            return []
    
    @staticmethod
    async def update_builder(builder_id: str, update_data: Dict) -> bool:
        """Update builder information"""
        supabase = get_supabase()
        
        try:
            supabase.table('builders').update(update_data).eq('id', builder_id).execute()
            logger.info(f"Builder {builder_id} updated")
            return True
        except Exception as e:
            logger.error(f"Error updating builder: {str(e)}")
            return False