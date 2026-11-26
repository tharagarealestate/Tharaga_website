# =============================================
# RECOMMENDATION ENGINE FOR PERSONALIZED BUYER EXPERIENCE
# Hybrid approach: Collaborative + Content-based filtering
# =============================================
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import os
from datetime import datetime, timedelta
from supabase import create_client, Client
import logging

# =============================================
# CONFIGURATION
# =============================================
app = FastAPI(title="Recommendation Engine", version="1.0")

# Supabase connection - lazy initialization
_supabase_client: Optional[Client] = None

def get_supabase_client() -> Client:
    """Lazy initialization of Supabase client"""
    global _supabase_client
    if _supabase_client is None:
        SUPABASE_URL = os.getenv("SUPABASE_URL")
        SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
        
        if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
            raise ValueError("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set")
        
        _supabase_client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
    return _supabase_client

# Logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# =============================================
# PYDANTIC MODELS
# =============================================
class RecommendationRequest(BaseModel):
    buyer_id: str
    limit: int = 10
    algorithm: str = "hybrid"  # collaborative, content_based, hybrid

class RecommendationResponse(BaseModel):
    property_id: str
    recommendation_score: float
    fit_score: float  # 0-100
    reason: str
    factors: Dict[str, float]

# =============================================
# RECOMMENDATION FUNCTIONS
# =============================================
async def collaborative_filtering(buyer_id: str, limit: int) -> List[RecommendationResponse]:
    """
    Collaborative filtering: "Users like you also liked..."
    Based on similar buyer behavior patterns
    """
    supabase = get_supabase_client()
    
    # Get current buyer's interactions (using user_behavior table)
    buyer_interactions = supabase.table('user_behavior').select(
        'property_id, metadata'
    ).eq('user_id', buyer_id).eq('behavior_type', 'property_view').execute()
    
    if not buyer_interactions.data:
        # No history, fall back to content-based
        return await content_based_filtering(buyer_id, limit)
    
    viewed_property_ids = [
        b.get('property_id') or (b.get('metadata', {}).get('property_id') if isinstance(b.get('metadata'), dict) else None)
        for b in buyer_interactions.data
        if b.get('property_id') or (b.get('metadata', {}).get('property_id') if isinstance(b.get('metadata'), dict) else None)
    ]
    
    if not viewed_property_ids:
        return await content_based_filtering(buyer_id, limit)
    
    # Find similar buyers (who viewed same properties)
    similar_buyers_query = supabase.table('user_behavior').select(
        'user_id'
    ).in_('property_id', viewed_property_ids).neq(
        'user_id', buyer_id
    ).limit(100).execute()
    
    similar_buyer_ids = list(set([b['user_id'] for b in similar_buyers_query.data if b.get('user_id')]))
    
    if not similar_buyer_ids:
        return await content_based_filtering(buyer_id, limit)
    
    # Get what similar buyers also viewed
    similar_buyer_views = supabase.table('user_behavior').select(
        'property_id'
    ).in_('user_id', similar_buyer_ids).eq(
        'behavior_type', 'property_view'
    ).execute()
    
    # Count property views from similar buyers
    property_counts = {}
    for view in similar_buyer_views.data:
        prop_id = view.get('property_id')
        if prop_id and prop_id not in viewed_property_ids:
            property_counts[prop_id] = property_counts.get(prop_id, 0) + 1
    
    # Sort by popularity among similar buyers
    recommended_ids = sorted(
        property_counts.items(), 
        key=lambda x: x[1], 
        reverse=True
    )[:limit]
    
    # Fetch property details and calculate scores
    recommendations = []
    for prop_id, view_count in recommended_ids:
        try:
            prop = supabase.table('properties').select('*').eq('id', prop_id).single().execute()
            if prop.data:
                score = min(100, (view_count / len(similar_buyer_ids)) * 100)
                recommendations.append(RecommendationResponse(
                    property_id=prop_id,
                    recommendation_score=score,
                    fit_score=score,
                    reason=f"{view_count} similar buyers viewed this property",
                    factors={
                        "collaborative_score": score,
                        "similar_buyers": len(similar_buyer_ids),
                        "view_count": view_count
                    }
                ))
        except Exception as e:
            logger.warning(f"Failed to fetch property {prop_id}: {e}")
            continue
    
    return recommendations

async def content_based_filtering(buyer_id: str, limit: int) -> List[RecommendationResponse]:
    """
    Content-based filtering: Match property features to buyer preferences
    """
    supabase = get_supabase_client()
    
    # Get buyer preferences
    prefs_query = supabase.table('buyer_preferences').select('*').eq(
        'buyer_id', buyer_id
    ).single().execute()
    
    if not prefs_query.data:
        # Try to calculate preferences from behavior
        try:
            prefs_result = supabase.rpc('calculate_buyer_preferences', {'p_buyer_id': buyer_id}).execute()
            if prefs_result.data and len(prefs_result.data) > 0:
                prefs_data = prefs_result.data[0]
            else:
                return []
        except Exception as e:
            logger.warning(f"Failed to calculate preferences: {e}")
            return []
    else:
        prefs_data = prefs_query.data
    
    # Build query to match preferences
    properties_query = supabase.table('properties').select('*')
    
    # Apply filters
    if prefs_data.get('budget_min'):
        properties_query = properties_query.gte('price', float(prefs_data['budget_min']))
    if prefs_data.get('budget_max'):
        properties_query = properties_query.lte('price', float(prefs_data['budget_max']))
    
    if prefs_data.get('property_types') and len(prefs_data['property_types']) > 0:
        properties_query = properties_query.in_('property_type', prefs_data['property_types'])
    
    if prefs_data.get('preferred_locations') and len(prefs_data['preferred_locations']) > 0:
        properties_query = properties_query.in_('location', prefs_data['preferred_locations'])
    
    properties = properties_query.limit(100).execute()
    
    # Calculate fit scores
    recommendations = []
    for prop in properties.data:
        score, factors = calculate_fit_score(prop, prefs_data)
        
        if score >= 50:  # Minimum threshold
            reason = generate_recommendation_reason(factors)
            recommendations.append(RecommendationResponse(
                property_id=prop['id'],
                recommendation_score=score,
                fit_score=score,
                reason=reason,
                factors=factors
            ))
    
    # Sort by score
    recommendations.sort(key=lambda x: x.recommendation_score, reverse=True)
    return recommendations[:limit]

async def hybrid_recommendations(buyer_id: str, limit: int) -> List[RecommendationResponse]:
    """
    Hybrid approach: Combine collaborative and content-based
    """
    # Get both types
    collaborative = await collaborative_filtering(buyer_id, limit * 2)
    content_based = await content_based_filtering(buyer_id, limit * 2)
    
    # Merge and rerank
    all_recs = {}
    
    # Add collaborative (60% weight)
    for rec in collaborative:
        all_recs[rec.property_id] = rec
        all_recs[rec.property_id].recommendation_score *= 0.6
    
    # Add content-based (40% weight)
    for rec in content_based:
        if rec.property_id in all_recs:
            # Boost score if in both
            all_recs[rec.property_id].recommendation_score += rec.recommendation_score * 0.4
            all_recs[rec.property_id].reason = f"Great match + Popular with similar buyers"
        else:
            all_recs[rec.property_id] = rec
            all_recs[rec.property_id].recommendation_score *= 0.4
    
    # Sort and return top recommendations
    final_recs = sorted(
        all_recs.values(),
        key=lambda x: x.recommendation_score,
        reverse=True
    )[:limit]
    
    # Log recommendations for learning
    supabase = get_supabase_client()
    for i, rec in enumerate(final_recs):
        try:
            supabase.table('recommendation_history').insert({
                "buyer_id": buyer_id,
                "property_id": rec.property_id,
                "recommendation_score": rec.recommendation_score,
                "recommendation_reason": rec.reason,
                "recommendation_factors": rec.factors,
                "algorithm_used": "hybrid",
                "position_shown": i + 1
            }).execute()
        except Exception as e:
            logger.warning(f"Failed to log recommendation: {e}")
    
    return final_recs

def calculate_fit_score(property_data: Dict, preferences: Dict) -> tuple:
    """Calculate how well property matches buyer preferences"""
    score = 0
    factors = {}
    
    # Budget match (30% weight)
    if preferences.get('budget_min') and preferences.get('budget_max'):
        budget_mid = (float(preferences['budget_min']) + float(preferences['budget_max'])) / 2
        price = float(property_data.get('price', property_data.get('price_inr', 0)) or 0)
        if budget_mid > 0:
            budget_diff = abs(price - budget_mid) / budget_mid
            budget_score = max(0, 100 - (budget_diff * 100))
            score += budget_score * 0.3
            factors['budget_match'] = budget_score
    
    # Location match (25% weight)
    if preferences.get('preferred_locations') and len(preferences['preferred_locations']) > 0:
        prop_location = property_data.get('location') or property_data.get('locality')
        if prop_location in preferences['preferred_locations']:
            location_score = 100
        else:
            location_score = 0
        score += location_score * 0.25
        factors['location_match'] = location_score
    
    # Property type match (20% weight)
    if preferences.get('property_types') and len(preferences['property_types']) > 0:
        if property_data.get('property_type') in preferences['property_types']:
            type_score = 100
        else:
            type_score = 50  # Partial credit
        score += type_score * 0.2
        factors['property_type_match'] = type_score
    
    # Size match (15% weight)
    if preferences.get('size_min_sqft') and preferences.get('size_max_sqft'):
        size = float(property_data.get('sqft', property_data.get('size_sqft', 0)) or 0)
        size_min = float(preferences['size_min_sqft'])
        size_max = float(preferences['size_max_sqft'])
        if size_min <= size <= size_max:
            size_score = 100
        else:
            size_diff = min(
                abs(size - size_min),
                abs(size - size_max)
            )
            size_score = max(0, 100 - (size_diff / size * 100)) if size > 0 else 0
        score += size_score * 0.15
        factors['size_match'] = size_score
    
    # Amenities match (10% weight)
    if preferences.get('must_have_amenities') and len(preferences['must_have_amenities']) > 0:
        property_amenities = set(property_data.get('amenities', []) or [])
        required_amenities = set(preferences['must_have_amenities'])
        matched = property_amenities.intersection(required_amenities)
        amenity_score = (len(matched) / len(required_amenities)) * 100 if required_amenities else 100
        score += amenity_score * 0.1
        factors['amenities_match'] = amenity_score
    
    return score, factors

def generate_recommendation_reason(factors: Dict) -> str:
    """Generate human-readable reason for recommendation"""
    top_factors = sorted(factors.items(), key=lambda x: x[1], reverse=True)[:3]
    
    reasons = []
    for factor, score in top_factors:
        if score >= 90:
            if factor == 'budget_match':
                reasons.append("Perfect price range")
            elif factor == 'location_match':
                reasons.append("Your preferred location")
            elif factor == 'property_type_match':
                reasons.append("Matches your property type preference")
            elif factor == 'size_match':
                reasons.append("Ideal size for you")
            elif factor == 'amenities_match':
                reasons.append("Has all your must-have amenities")
    
    return " • ".join(reasons) if reasons else "Good overall match for your profile"

# =============================================
# API ENDPOINTS
# =============================================
@app.post("/recommend", response_model=List[RecommendationResponse])
async def get_recommendations(request: RecommendationRequest):
    """
    Generate personalized property recommendations
    Real-time hybrid recommendation system
    """
    try:
        if request.algorithm == "collaborative":
            return await collaborative_filtering(request.buyer_id, request.limit)
        elif request.algorithm == "content_based":
            return await content_based_filtering(request.buyer_id, request.limit)
        else:
            return await hybrid_recommendations(request.buyer_id, request.limit)
    except Exception as e:
        logger.error(f"Recommendation failed: {str(e)}")
        raise HTTPException(500, f"Recommendation failed: {str(e)}")

@app.get("/health")
async def health():
    return {"status": "healthy", "service": "Recommendation Engine"}

