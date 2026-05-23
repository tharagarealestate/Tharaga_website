"""
Analytics Service - Live metrics and market intelligence
"""
import logging
from typing import Dict, List, Optional
from datetime import datetime, timedelta
from ..database import get_supabase
from ..models.analytics import LiveMetrics, LocalityInsight, MarketDataResponse

logger = logging.getLogger(__name__)

class AnalyticsService:
    """Service for analytics and live metrics"""
    
    @staticmethod
    async def get_live_metrics() -> LiveMetrics:
        """Get real-time dashboard metrics"""
        supabase = get_supabase()
        
        try:
            # Check cache first
            cache = supabase.table('live_metrics').select('*').eq('id', 'dashboard').execute()
            
            if cache.data:
                cached_data = cache.data[0]
                cache_time = datetime.fromisoformat(cached_data['updated_at'].replace('Z', '+00:00'))
                
                # Use cache if less than 5 minutes old
                if (datetime.utcnow() - cache_time.replace(tzinfo=None)).seconds < 300:
                    metrics = cached_data['metrics']
                    return LiveMetrics(**metrics)
            
            # Calculate fresh metrics
            today = datetime.utcnow().date()
            week_ago = today - timedelta(days=7)
            
            # Active leads by tier
            leads = supabase.table('leads')\
                .select('tier, status')\
                .in_('status', ['new', 'contacted', 'qualified', 'nurturing'])\
                .execute()
            
            all_leads = leads.data or []
            lion_leads = sum(1 for l in all_leads if l.get('tier') == 'lion')
            monkey_leads = sum(1 for l in all_leads if l.get('tier') == 'monkey')
            dog_leads = sum(1 for l in all_leads if l.get('tier') == 'dog')
            
            # Pipeline value
            pipeline = supabase.table('leads')\
                .select('budget_max')\
                .eq('is_qualified', True)\
                .in_('status', ['qualified', 'contacted', 'nurturing'])\
                .execute()
            
            pipeline_value = sum(
                float(l.get('budget_max', 0))
                for l in (pipeline.data or [])
                if l.get('budget_max')
            )
            
            # Conversions
            converted_today = supabase.table('leads')\
                .select('id', count='exact')\
                .gte('created_at', today.isoformat())\
                .eq('status', 'converted')\
                .execute()
            
            converted_week = supabase.table('leads')\
                .select('id', count='exact')\
                .gte('created_at', week_ago.isoformat())\
                .eq('status', 'converted')\
                .execute()
            
            # Conversion rate
            total_leads = supabase.table('leads').select('id', count='exact').execute()
            total_converted = supabase.table('leads')\
                .select('id', count='exact')\
                .eq('status', 'converted')\
                .execute()
            
            total_count = total_leads.count or 0
            converted_count = total_converted.count or 0
            conversion_rate = (converted_count / total_count * 100) if total_count > 0 else 0
            
            # Average response time (from assignments)
            assignments = supabase.table('lead_assignments')\
                .select('sla_met, sla_minutes, responded_at, created_at')\
                .not_.is_('responded_at', 'null')\
                .gte('created_at', week_ago.isoformat())\
                .execute()
            
            response_times = []
            for a in (assignments.data or []):
                if a.get('responded_at') and a.get('created_at'):
                    created = datetime.fromisoformat(a['created_at'].replace('Z', '+00:00'))
                    responded = datetime.fromisoformat(a['responded_at'].replace('Z', '+00:00'))
                    minutes = (responded - created).total_seconds() / 60
                    response_times.append(minutes)
            
            avg_response_time = sum(response_times) / len(response_times) if response_times else None
            
            # Properties count
            properties_count = supabase.table('properties')\
                .select('id', count='exact')\
                .eq('status', 'available')\
                .execute()
            
            metrics_data = {
                'active_leads': len(all_leads),
                'lion_leads': lion_leads,
                'monkey_leads': monkey_leads,
                'dog_leads': dog_leads,
                'pipeline_value': pipeline_value,
                'leads_converted_today': converted_today.count or 0,
                'leads_converted_week': converted_week.count or 0,
                'conversion_rate': round(conversion_rate, 2),
                'avg_response_time_minutes': round(avg_response_time, 2) if avg_response_time else None,
                'properties_listed': properties_count.count or 0,
                'updated_at': datetime.utcnow().isoformat()
            }
            
            # Cache the metrics
            supabase.table('live_metrics').upsert({
                'id': 'dashboard',
                'metrics': metrics_data,
                'updated_at': datetime.utcnow().isoformat()
            }).execute()
            
            return LiveMetrics(**metrics_data)
            
        except Exception as e:
            logger.error(f"Error fetching live metrics: {str(e)}")
            raise
    
    @staticmethod
    async def get_market_data(city: str = 'Chennai') -> MarketDataResponse:
        """Get market intelligence for a city"""
        supabase = get_supabase()
        
        try:
            # Get locality insights
            localities_result = supabase.table('locality_insights')\
                .select('*')\
                .eq('city', city)\
                .order('demand_level', desc=True)\
                .execute()
            
            localities = [
                LocalityInsight(**loc)
                for loc in (localities_result.data or [])
            ]
            
            # Total properties in city
            properties_count = supabase.table('properties')\
                .select('id', count='exact')\
                .eq('city', city)\
                .eq('status', 'available')\
                .execute()
            
            # Calculate average city price
            properties = supabase.table('properties')\
                .select('price_inr, sqft')\
                .eq('city', city)\
                .not_.is_('sqft', 'null')\
                .execute()
            
            avg_price = None
            if properties.data:
                price_per_sqft = [
                    float(p['price_inr']) / float(p['sqft'])
                    for p in properties.data
                    if p.get('price_inr') and p.get('sqft') and float(p['sqft']) > 0
                ]
                if price_per_sqft:
                    avg_price = sum(price_per_sqft) / len(price_per_sqft)
            
            # Get trending localities (high demand + price appreciation)
            trending = [
                loc.locality
                for loc in localities
                if loc.demand_level in ['high', 'very_high'] and 
                   loc.price_trend_percentage and loc.price_trend_percentage > 5
            ][:5]
            
            return MarketDataResponse(
                localities=localities,
                total_properties=properties_count.count or 0,
                avg_price_city=round(avg_price, 2) if avg_price else None,
                trending_localities=trending
            )
            
        except Exception as e:
            logger.error(f"Error fetching market data: {str(e)}")
            raise
    
    @staticmethod
    async def get_locality_insights(city: str, locality: str) -> Optional[LocalityInsight]:
        """Get detailed insights for a specific locality"""
        supabase = get_supabase()
        
        try:
            result = supabase.table('locality_insights')\
                .select('*')\
                .eq('city', city)\
                .eq('locality', locality)\
                .execute()
            
            if not result.data:
                return None
            
            return LocalityInsight(**result.data[0])
            
        except Exception as e:
            logger.error(f"Error fetching locality insights: {str(e)}")
            return None