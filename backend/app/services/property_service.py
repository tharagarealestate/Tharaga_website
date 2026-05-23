"""
Property Service - Property management and search
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
    """Service for property operations"""
    
    @staticmethod
    async def create_property(property_data: PropertyCreate) -> PropertyResponse:
        """Create new property with AI scoring"""
        supabase = get_supabase()
        
        try:
            # Get locality data if available
            locality_data = None
            if property_data.city and property_data.locality:
                locality_result = await PropertyService._get_locality_data(
                    property_data.city,
                    property_data.locality
                )
                locality_data = locality_result
            
            # Calculate property AI score
            property_dict = property_data.model_dump()
            ai_score, factors = ScoringService.calculate_property_score(
                property_dict,
                locality_data
            )
            
            # Prepare insert data
            insert_data = {
                **property_dict,
                'ai_score': ai_score,
                'ai_score_factors': factors,
                'status': 'available',
                'view_count': 0,
                'favorite_count': 0,
                'contact_count': 0
            }
            
            # Remove None values
            insert_data = {k: v for k, v in insert_data.items() if v is not None}
            
            # Insert property
            result = supabase.table('properties').insert(insert_data).execute()
            
            if not result.data:
                raise Exception("Failed to create property")
            
            logger.info(f"Property created: {result.data[0]['id']} with score {ai_score}")
            return PropertyResponse(**result.data[0])
            
        except Exception as e:
            logger.error(f"Error creating property: {str(e)}")
            raise
    
    @staticmethod
    async def get_property(property_id: str) -> Optional[PropertyResponse]:
        """Get property by ID"""
        supabase = get_supabase()
        
        try:
            result = supabase.table('properties')\
                .select('*')\
                .eq('id', property_id)\
                .execute()
            
            if not result.data:
                return None
            
            # Increment view count
            supabase.table('properties')\
                .update({'view_count': result.data[0]['view_count'] + 1})\
                .eq('id', property_id)\
                .execute()
            
            return PropertyResponse(**result.data[0])
        except Exception as e:
            logger.error(f"Error fetching property: {str(e)}")
            return None
    
    @staticmethod
    async def search_properties(filters: PropertySearchFilters) -> List[PropertyResponse]:
        """Search properties with advanced filters"""
        supabase = get_supabase()
        
        try:
            query = supabase.table('properties').select('*')
            
            # Apply filters
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
            if filters.furnishing:
                query = query.eq('furnishing', filters.furnishing)
            if filters.rera_verified_only:
                query = query.eq('is_rera_verified', True)
            
            # Sorting
            if filters.sort_by == 'price_asc':
                query = query.order('price_inr', desc=False)
            elif filters.sort_by == 'price_desc':
                query = query.order('price_inr', desc=True)
            elif filters.sort_by == 'ai_score':
                query = query.order('ai_score', desc=True)
            else:  # created_at
                query = query.order('created_at', desc=True)
            
            # Pagination
            query = query.range(filters.offset, filters.offset + filters.limit - 1)
            
            result = query.execute()
            
            return [PropertyResponse(**item) for item in result.data] if result.data else []
            
        except Exception as e:
            logger.error(f"Error searching properties: {str(e)}")
            return []
    
    @staticmethod
    async def get_property_score(property_id: str) -> Optional[PropertyScoreResponse]:
        """Get detailed AI score for property"""
        supabase = get_supabase()
        
        try:
            result = supabase.table('properties')\
                .select('*')\
                .eq('id', property_id)\
                .execute()
            
            if not result.data:
                return None
            
            property_data = result.data[0]
            
            # Get locality data
            locality_data = None
            if property_data.get('city') and property_data.get('locality'):
                locality_data = await PropertyService._get_locality_data(
                    property_data['city'],
                    property_data['locality']
                )
            
            # Recalculate score with latest data
            ai_score, factors = ScoringService.calculate_property_score(
                property_data,
                locality_data
            )
            
            # Generate reasons
            reasons = PropertyService._generate_score_reasons(factors, locality_data)
            
            return PropertyScoreResponse(
                property_id=property_id,
                ai_score=ai_score,
                factors=factors,
                reasons=reasons
            )
            
        except Exception as e:
            logger.error(f"Error getting property score: {str(e)}")
            return None
    
    @staticmethod
    async def verify_rera(rera_id: str) -> bool:
        """Verify RERA ID (mock implementation)"""
        supabase = get_supabase()
        
        try:
            # Check if already verified
            result = supabase.table('rera_verification')\
                .select('*')\
                .eq('rera_id', rera_id)\
                .execute()
            
            if result.data and len(result.data) > 0:
                return result.data[0].get('is_valid', False)
            
            # In production, call actual RERA API
            # For now, return True for any valid format
            is_valid = len(rera_id) > 5
            
            # Store verification
            verification_data = {
                'rera_id': rera_id,
                'is_valid': is_valid,
                'verification_status': 'verified' if is_valid else 'invalid',
                'verified_at': 'now()',
                'last_checked_at': 'now()',
                'verification_source': 'mock_api'
            }
            supabase.table('rera_verification').upsert(verification_data).execute()
            
            return is_valid
            
        except Exception as e:
            logger.error(f"Error verifying RERA: {str(e)}")
            return False
    
    @staticmethod
    async def _get_locality_data(city: str, locality: str) -> Optional[Dict]:
        """Get locality insights data"""
        supabase = get_supabase()
        
        try:
            result = supabase.table('locality_insights')\
                .select('*')\
                .eq('city', city)\
                .eq('locality', locality)\
                .execute()
            
            return result.data[0] if result.data else None
        except Exception as e:
            logger.error(f"Error fetching locality data: {str(e)}")
            return None
    
    @staticmethod
    def _generate_score_reasons(factors: Dict, locality_data: Optional[Dict]) -> List[str]:
        """Generate human-readable reasons for property score"""
        reasons = []
        
        # Location reasons
        if locality_data:
            demand = locality_data.get('demand_level', '').lower()
            if demand in ['high', 'very_high']:
                reasons.append(f"Located in a {demand.replace('_', ' ')} demand area")
            
            price_trend = locality_data.get('price_trend_percentage')
            if price_trend and price_trend > 5:
                reasons.append(f"Area showing strong price appreciation (+{price_trend}%)")
        
        # Price reasons
        if factors.get('price', 0) >= 85:
            reasons.append("Competitively priced compared to market average")
        elif factors.get('price', 0) >= 95:
            reasons.append("Excellent value - below market price")
        
        # RERA
        if factors.get('rera', 0) >= 15:
            reasons.append("RERA verified for buyer protection")
        
        # Amenities
        if factors.get('amenities', 0) >= 70:
            reasons.append("Excellent amenities and facilities")
        
        return reasons[:3]  # Top 3 reasons
