"""
Analytics Service - Adapted to existing schema
"""
import logging
from typing import Optional
from datetime import datetime, timedelta
from ..database import get_supabase
from ..models.analytics import LiveMetrics, LocalityInsight, MarketDataResponse
from ..utils import cache

logger = logging.getLogger(__name__)


class AnalyticsService:
    """Analytics service for live metrics and market intelligence"""
    
    @staticmethod
    async def get_live_metrics() -> LiveMetrics:
        """Get real-time dashboard metrics with caching"""
        # Check cache first
        cached = cache.get('live_metrics')
        if cached:
            return LiveMetrics(**cached)
        
        supabase = get_supabase()
        
        try:
            today = datetime.utcnow().date()
            week_ago = today - timedelta(days=7)
            
            # Get active leads (not converted/lost)
            leads = supabase.table('leads')\
                .select('smart_tier, status, budget, whatsapp_qualified')\
                .execute()
            
            all_leads = leads.data or []
            
            # Active = not converted/lost/invalid
            active = [l for l in all_leads if l.get('status') not in ('converted', 'lost', 'invalid')]
            
            lion_leads = sum(1 for l in active if l.get('smart_tier') == 'lion')
            monkey_leads = sum(1 for l in active if l.get('smart_tier') == 'monkey')
            dog_leads = sum(1 for l in active if l.get('smart_tier') == 'dog')
            
            # Pipeline value - sum of budgets for qualified active leads
            pipeline_value = sum(
                float(l.get('budget', 0) or 0)
                for l in active
                if l.get('whatsapp_qualified') or l.get('status') == 'qualified'
            )
            
            # Conversions
            converted_today = sum(
                1 for l in all_leads
                if l.get('status') == 'converted'
            )
            
            # Get properties count
            try:
                props = supabase.table('properties').select('id', count='exact').execute()
                properties_count = props.count or 0
            except Exception:
                properties_count = 0
            
            # Calculate conversion rate
            total = len(all_leads)
            converted_total = sum(1 for l in all_leads if l.get('status') == 'converted')
            conversion_rate = (converted_total / total * 100) if total > 0 else 0
            
            metrics = LiveMetrics(
                active_leads=len(active),
                lion_leads=lion_leads,
                monkey_leads=monkey_leads,
                dog_leads=dog_leads,
                pipeline_value=pipeline_value,
                leads_converted_today=converted_today,
                leads_converted_week=converted_total,
                conversion_rate=round(conversion_rate, 2),
                avg_response_time_minutes=None,
                properties_listed=properties_count,
                updated_at=datetime.utcnow().isoformat()
            )
            
            # Cache for 60 seconds
            cache.set('live_metrics', metrics.model_dump(), ttl=60)
            
            return metrics
            
        except Exception as e:
            logger.error(f"Error fetching metrics: {e}")
            # Return empty metrics rather than failing
            return LiveMetrics(updated_at=datetime.utcnow().isoformat())
    
    @staticmethod
    async def get_market_data(city: str = 'Chennai') -> MarketDataResponse:
        """Get market intelligence for a city"""
        # Cache key
        cache_key = f'market_data:{city}'
        cached = cache.get(cache_key)
        if cached:
            return MarketDataResponse(**cached)
        
        supabase = get_supabase()
        
        try:
            # Try locality_insights first
            localities_result = supabase.table('locality_insights')\
                .select('*')\
                .eq('city', city)\
                .execute()
            
            localities = []
            for loc in (localities_result.data or []):
                localities.append(LocalityInsight(
                    city=loc.get('city', city),
                    locality=loc.get('locality', ''),
                    avg_price_sqft=loc.get('avg_price_sqft'),
                    price_trend_percentage=loc.get('price_trend_percentage'),
                    demand_level=loc.get('demand_level'),
                    demand_change_percentage=loc.get('demand_change_percentage'),
                    active_properties=loc.get('active_properties', 0),
                    connectivity_score=loc.get('connectivity_score'),
                    safety_score=loc.get('safety_score'),
                    lifestyle_score=loc.get('lifestyle_score'),
                    updated_at=loc.get('updated_at')
                ))
            
            # Total properties
            try:
                props = supabase.table('properties')\
                    .select('id', count='exact')\
                    .eq('city', city)\
                    .execute()
                total_props = props.count or 0
            except Exception:
                total_props = 0
            
            # Calculate average city price
            try:
                price_query = supabase.table('properties')\
                    .select('price_inr, sqft')\
                    .eq('city', city)\
                    .not_.is_('sqft', 'null')\
                    .execute()
                
                avg_price = None
                if price_query.data:
                    ratios = []
                    for p in price_query.data:
                        if p.get('price_inr') and p.get('sqft') and float(p['sqft']) > 0:
                            ratios.append(float(p['price_inr']) / float(p['sqft']))
                    if ratios:
                        avg_price = sum(ratios) / len(ratios)
            except Exception:
                avg_price = None
            
            trending = [
                loc.locality for loc in localities
                if loc.demand_level in ['high', 'very_high']
                and loc.price_trend_percentage and loc.price_trend_percentage > 5
            ][:5]
            
            response = MarketDataResponse(
                localities=localities,
                total_properties=total_props,
                avg_price_city=round(avg_price, 2) if avg_price else None,
                trending_localities=trending
            )
            
            cache.set(cache_key, response.model_dump(), ttl=300)  # 5 min cache
            return response
            
        except Exception as e:
            logger.error(f"Error fetching market data: {e}")
            return MarketDataResponse()
    
    @staticmethod
    async def get_locality_insights(city: str, locality: str) -> Optional[LocalityInsight]:
        """Get detailed insights for a locality"""
        supabase = get_supabase()
        
        try:
            result = supabase.table('locality_insights')\
                .select('*')\
                .eq('city', city)\
                .eq('locality', locality)\
                .execute()
            
            if not result.data:
                return None
            
            loc = result.data[0]
            return LocalityInsight(
                city=loc.get('city', city),
                locality=loc.get('locality', locality),
                avg_price_sqft=loc.get('avg_price_sqft'),
                price_trend_percentage=loc.get('price_trend_percentage'),
                demand_level=loc.get('demand_level'),
                demand_change_percentage=loc.get('demand_change_percentage'),
                active_properties=loc.get('active_properties', 0),
                connectivity_score=loc.get('connectivity_score'),
                safety_score=loc.get('safety_score'),
                lifestyle_score=loc.get('lifestyle_score'),
                updated_at=loc.get('updated_at')
            )
        except Exception as e:
            logger.error(f"Error fetching locality: {e}")
            return None
