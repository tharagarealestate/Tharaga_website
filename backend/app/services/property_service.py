"""
Property Service - Adapted to existing Tharaga production schema
The properties table has 150+ columns - we use what's relevant
"""
import logging
from typing import List, Optional, Tuple, Dict
from ..database import get_supabase
from ..models.property import (
    PropertyCreate, PropertyResponse, PropertySearchFilters,
    PropertyScoreResponse
)
from .scoring_service import ScoringService

logger = logging.getLogger(__name__)


class PropertyService:
    """Property service adapted to existing rich schema"""
    
    @staticmethod
    def _from_db_format(db_row: dict) -> dict:
        """Convert DB row to our model format"""
        return {
            'id': str(db_row.get('id')),
            'title': db_row.get('title') or 'Property',
            'description': db_row.get('description'),
            'city': db_row.get('city') or 'Chennai',
            'locality': db_row.get('locality'),
            'property_type': db_row.get('property_type') or db_row.get('category') or 'apartment',
            'bedrooms': db_row.get('bedrooms'),
            'bathrooms': db_row.get('bathrooms'),
            'price_inr': float(db_row.get('price_inr') or db_row.get('price') or 0),
            'sqft': float(db_row.get('sqft') or db_row.get('builtup_area') or 0) if (db_row.get('sqft') or db_row.get('builtup_area')) else None,
            'lat': db_row.get('lat') or db_row.get('latitude'),
            'lng': db_row.get('lng') or db_row.get('longitude'),
            'ai_score': db_row.get('ai_score'),
            'is_rera_verified': bool(db_row.get('rera_verified') or db_row.get('is_verified', False)),
            'images': db_row.get('images') or [],
            'amenities': db_row.get('amenities') or [],
            'status': db_row.get('status') or db_row.get('listing_status') or 'available',
            'created_at': db_row.get('created_at') or db_row.get('listed_at')
        }
    
    @staticmethod
    async def create_property(property_data: PropertyCreate) -> PropertyResponse:
        """Create new property with AI scoring"""
        supabase = get_supabase()
        
        try:
            # Get locality data
            locality_data = await PropertyService._get_locality_data(
                property_data.city,
                property_data.locality
            )
            
            # Calculate AI score
            property_dict = property_data.model_dump()
            ai_score, factors = ScoringService.calculate_property_score(property_dict, locality_data)
            
            # Map to existing schema
            insert_data = {
                'title': property_data.title,
                'description': property_data.description,
                'city': property_data.city,
                'locality': property_data.locality,
                'property_type': property_data.property_type,
                'bedrooms': property_data.bedrooms,
                'bathrooms': property_data.bathrooms,
                'price_inr': property_data.price_inr,
                'sqft': property_data.sqft,
                'lat': property_data.lat,
                'lng': property_data.lng,
                'ai_score': ai_score,
                'amenities': property_data.amenities,
                'images': property_data.images,
                'rera_id': property_data.rera_id,
                'builder_id': property_data.builder_id,
                'status': 'available',
                'listing_status': 'active'
            }
            
            # Remove None values
            insert_data = {k: v for k, v in insert_data.items() if v is not None}
            
            result = supabase.table('properties').insert(insert_data).execute()
            
            if not result.data:
                raise Exception("Failed to create property")
            
            logger.info(f"Property created: {result.data[0]['id']} with score {ai_score}")
            return PropertyResponse(**PropertyService._from_db_format(result.data[0]))
            
        except Exception as e:
            logger.error(f"Error creating property: {e}")
            raise
    
    @staticmethod
    async def get_property(property_id: str) -> Optional[PropertyResponse]:
        """Get property by ID"""
        supabase = get_supabase()
        
        try:
            result = supabase.table('properties')\
                .select('*').eq('id', property_id).execute()
            
            if not result.data:
                return None
            
            # Increment view count
            try:
                current_views = result.data[0].get('view_count', 0) or 0
                supabase.table('properties').update({
                    'view_count': current_views + 1
                }).eq('id', property_id).execute()
            except Exception:
                pass
            
            return PropertyResponse(**PropertyService._from_db_format(result.data[0]))
        except Exception as e:
            logger.error(f"Error fetching property: {e}")
            return None
    
    @staticmethod
    async def search_properties(filters: PropertySearchFilters) -> List[PropertyResponse]:
        """Search properties with advanced filters"""
        supabase = get_supabase()
        
        try:
            query = supabase.table('properties').select('*')
            
            if filters.city:
                query = query.eq('city', filters.city)
            if filters.locality:
                query = query.eq('locality', filters.locality)
            if filters.property_type:
                query = query.eq('property_type', filters.property_type)
            if filters.min_price:
                query = query.gte('price_inr', filters.min_price)
            if filters.max_price:
                query = query.lte('price_inr', filters.max_price)
            if filters.bedrooms:
                query = query.eq('bedrooms', filters.bedrooms)
            if filters.min_sqft:
                query = query.gte('sqft', filters.min_sqft)
            if filters.max_sqft:
                query = query.lte('sqft', filters.max_sqft)
            if filters.rera_verified_only:
                query = query.eq('rera_verified', True)
            
            # Sorting
            if filters.sort_by == 'price_asc':
                query = query.order('price_inr', desc=False)
            elif filters.sort_by == 'price_desc':
                query = query.order('price_inr', desc=True)
            elif filters.sort_by == 'ai_score':
                query = query.order('ai_score', desc=True, nullsfirst=False)
            else:
                query = query.order('created_at', desc=True)
            
            query = query.range(filters.offset, filters.offset + filters.limit - 1)
            
            result = query.execute()
            
            return [
                PropertyResponse(**PropertyService._from_db_format(item))
                for item in (result.data or [])
            ]
        except Exception as e:
            logger.error(f"Error searching properties: {e}")
            return []
    
    @staticmethod
    async def get_property_score(property_id: str) -> Optional[PropertyScoreResponse]:
        """Get AI score breakdown"""
        supabase = get_supabase()
        
        try:
            result = supabase.table('properties').select('*').eq('id', property_id).execute()
            
            if not result.data:
                return None
            
            property_data = result.data[0]
            
            locality_data = None
            if property_data.get('city') and property_data.get('locality'):
                locality_data = await PropertyService._get_locality_data(
                    property_data['city'],
                    property_data['locality']
                )
            
            # Normalize keys for scoring
            scoring_data = {
                'city': property_data.get('city'),
                'locality': property_data.get('locality'),
                'price_inr': property_data.get('price_inr') or property_data.get('price'),
                'sqft': property_data.get('sqft') or property_data.get('builtup_area'),
                'amenities': property_data.get('amenities'),
                'parking': property_data.get('parking'),
                'furnishing': property_data.get('furnishing_status') or property_data.get('furnished'),
                'is_rera_verified': property_data.get('rera_verified') or property_data.get('is_verified', False)
            }
            
            ai_score, factors = ScoringService.calculate_property_score(scoring_data, locality_data)
            
            reasons = PropertyService._generate_score_reasons(factors, locality_data)
            
            return PropertyScoreResponse(
                property_id=property_id,
                ai_score=ai_score,
                factors=factors,
                reasons=reasons
            )
        except Exception as e:
            logger.error(f"Error getting property score: {e}")
            return None
    
    @staticmethod
    async def verify_rera(rera_id: str) -> bool:
        """Verify RERA ID"""
        supabase = get_supabase()
        
        try:
            # Check cache
            result = supabase.table('rera_verification').select('*').eq('rera_id', rera_id).execute()
            
            if result.data:
                return result.data[0].get('is_valid', False)
            
            # Mock verification (in production, call RERA API)
            is_valid = len(rera_id) > 5
            
            try:
                supabase.table('rera_verification').insert({
                    'rera_id': rera_id,
                    'is_valid': is_valid,
                    'verification_status': 'verified' if is_valid else 'invalid',
                    'verified_at': 'now()',
                    'last_checked_at': 'now()',
                    'verification_source': 'mock_api'
                }).execute()
            except Exception as e:
                logger.warning(f"Failed to cache RERA verification: {e}")
            
            return is_valid
        except Exception as e:
            logger.error(f"Error verifying RERA: {e}")
            return False
    
    @staticmethod
    async def _get_locality_data(city: str, locality: str) -> Optional[Dict]:
        """Get locality insights - try multiple tables for graceful fallback"""
        if not city or not locality:
            return None
        
        supabase = get_supabase()
        
        # Try locality_insights first
        try:
            result = supabase.table('locality_insights')\
                .select('*')\
                .eq('city', city)\
                .eq('locality', locality)\
                .execute()
            
            if result.data:
                return result.data[0]
        except Exception:
            pass
        
        # Fallback: hardcoded Chennai data
        chennai_fallback = {
            'Anna Nagar': {'avg_price_sqft': 8200, 'demand_level': 'high', 'price_trend_percentage': 2.4, 'connectivity_score': 92},
            'T Nagar': {'avg_price_sqft': 9500, 'demand_level': 'very_high', 'price_trend_percentage': 5.8, 'connectivity_score': 95},
            'Adyar': {'avg_price_sqft': 8400, 'demand_level': 'high', 'price_trend_percentage': 1.2, 'connectivity_score': 88},
            'Velachery': {'avg_price_sqft': 7200, 'demand_level': 'very_high', 'price_trend_percentage': 11.2, 'connectivity_score': 85},
            'OMR': {'avg_price_sqft': 6800, 'demand_level': 'very_high', 'price_trend_percentage': 15.3, 'connectivity_score': 90},
            'Porur': {'avg_price_sqft': 6500, 'demand_level': 'high', 'price_trend_percentage': 8.5, 'connectivity_score': 82},
        }
        if city == 'Chennai' and locality in chennai_fallback:
            return chennai_fallback[locality]
        
        return None
    
    @staticmethod
    def _generate_score_reasons(factors: Dict, locality_data: Optional[Dict]) -> List[str]:
        """Generate human-readable reasons"""
        reasons = []
        
        if locality_data:
            demand = locality_data.get('demand_level', '').lower()
            if demand in ['high', 'very_high']:
                reasons.append(f"Located in a {demand.replace('_', ' ')} demand area")
            
            price_trend = locality_data.get('price_trend_percentage')
            if price_trend and price_trend > 5:
                reasons.append(f"Area showing strong price appreciation (+{price_trend}%)")
        
        if factors.get('price', 0) >= 20:
            reasons.append("Competitively priced compared to market average")
        
        if factors.get('rera', 0) >= 12:
            reasons.append("RERA verified for buyer protection")
        
        if factors.get('amenities', 0) >= 15:
            reasons.append("Excellent amenities and facilities")
        
        return reasons[:3]
