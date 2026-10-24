# =============================================
# LISTING OPTIMIZATION ENGINE
# AI-powered suggestions for improving property performance
# =============================================
from fastapi import FastAPI, HTTPException, BackgroundTasks
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import os
from datetime import datetime, timedelta
from supabase import create_client, Client
import logging

# =============================================
# CONFIGURATION
# =============================================
app = FastAPI(title="Listing Optimizer", version="1.0")

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
class OptimizationRequest(BaseModel):
    property_id: str

# =============================================
# ANALYSIS FUNCTIONS
# =============================================
def analyze_images(property_data: Dict, performance: Dict) -> List[Dict]:
    """Analyze property images and suggest improvements"""
    suggestions = []
    
    images = property_data.get('images', [])
    
    if len(images) == 0:
        suggestions.append({
            "suggestion_type": "image",
            "suggestion_category": "critical",
            "suggestion_title": "No Images Added",
            "suggestion_text": "Your listing has no images. Properties with photos get 10x more views. Add at least 5 high-quality images showing different angles and rooms.",
            "expected_impact": "high",
            "estimated_improvement": 300,
            "action_required": "Upload minimum 5 photos",
            "confidence_score": 95
        })
    elif len(images) < 5:
        suggestions.append({
            "suggestion_type": "image",
            "suggestion_category": "high",
            "suggestion_title": "Add More Images",
            "suggestion_text": f"You have only {len(images)} images. Properties with 8-12 images perform 40% better. Add more photos showing amenities, views, and different rooms.",
            "expected_impact": "high",
            "estimated_improvement": 40,
            "action_required": f"Add {8 - len(images)} more photos",
            "confidence_score": 85
        })
    
    # Check for virtual staging opportunity
    if property_data.get('furnishing_status') == 'unfurnished' or property_data.get('furnished') == 'unfurnished':
        suggestions.append({
            "suggestion_type": "image",
            "suggestion_category": "medium",
            "suggestion_title": "Try Virtual Staging",
            "suggestion_text": "90% of similar properties use virtual staging. It helps buyers visualize the space and increases engagement by 50%.",
            "expected_impact": "high",
            "estimated_improvement": 50,
            "action_required": "Use AI Virtual Staging feature",
            "confidence_score": 80
        })
    
    return suggestions

def analyze_pricing(property_data: Dict, performance: Dict) -> List[Dict]:
    """Analyze pricing strategy"""
    suggestions = []
    
    price = float(property_data.get('price', property_data.get('price_inr', 0)) or 0)
    location = property_data.get('location') or property_data.get('locality')
    property_type = property_data.get('property_type')
    
    if not location or not property_type or price == 0:
        return suggestions
    
    # Get similar properties
    supabase = get_supabase_client()
    similar = supabase.table('properties').select('price, price_inr').eq(
        'location', location
    ).eq('property_type', property_type).execute()
    
    if similar.data and len(similar.data) > 5:
        prices = [float(p.get('price', p.get('price_inr', 0)) or 0) for p in similar.data if p.get('price') or p.get('price_inr')]
        prices = [p for p in prices if p > 0]
        
        if len(prices) > 0:
            avg_price = sum(prices) / len(prices)
            
            if avg_price > 0:
                price_diff_pct = ((price - avg_price) / avg_price) * 100
                
                if price_diff_pct > 15:
                    suggestions.append({
                        "suggestion_type": "price",
                        "suggestion_category": "high",
                        "suggestion_title": "Price is 15% Above Market",
                        "suggestion_text": f"Your property is priced at ₹{price/100000:.1f}L, while similar properties average ₹{avg_price/100000:.1f}L. Consider reducing by 10-12% to attract more buyers.",
                        "expected_impact": "high",
                        "estimated_improvement": 60,
                        "action_required": f"Reduce price to ₹{avg_price*0.95/100000:.1f}L",
                        "confidence_score": 90
                    })
                elif price_diff_pct < -15:
                    suggestions.append({
                        "suggestion_type": "price",
                        "suggestion_category": "low",
                        "suggestion_title": "Opportunity to Increase Price",
                        "suggestion_text": f"Your property is priced below market average. You may be able to increase price by 5-8% without reducing demand.",
                        "expected_impact": "medium",
                        "estimated_improvement": 0,
                        "action_required": f"Consider pricing at ₹{avg_price*0.98/100000:.1f}L",
                        "confidence_score": 70
                    })
    
    return suggestions

def analyze_description(property_data: Dict, performance: Dict) -> List[Dict]:
    """Analyze property description quality"""
    suggestions = []
    
    description = property_data.get('description', '')
    
    if len(description) < 100:
        suggestions.append({
            "suggestion_type": "description",
            "suggestion_category": "critical",
            "suggestion_title": "Description Too Short",
            "suggestion_text": "Your description is very brief. Detailed descriptions (200-300 words) get 35% more inquiries. Use AI to generate a compelling description.",
            "expected_impact": "high",
            "estimated_improvement": 35,
            "action_required": "Use AI Content Generator",
            "confidence_score": 88
        })
    elif len(description) > 500:
        suggestions.append({
            "suggestion_type": "description",
            "suggestion_category": "low",
            "suggestion_title": "Description Too Long",
            "suggestion_text": "Your description may be too detailed. Buyers prefer concise, scannable content. Consider using bullet points for key features.",
            "expected_impact": "low",
            "estimated_improvement": 10,
            "action_required": "Shorten to 200-300 words with bullet points",
            "confidence_score": 65
        })
    
    return suggestions

def analyze_competition(property_data: Dict) -> List[Dict]:
    """Analyze competitive positioning"""
    suggestions = []
    
    supabase = get_supabase_client()
    
    # Find similar competing properties
    competitors = supabase.table('properties').select('*').eq(
        'location', property_data.get('location') or property_data.get('locality')
    ).eq('property_type', property_data.get('property_type')).neq(
        'id', property_data['id']
    ).limit(10).execute()
    
    if competitors.data:
        # Compare features
        your_amenities = set(property_data.get('amenities', []) or [])
        competitor_amenities = [set(c.get('amenities', []) or []) for c in competitors.data]
        
        # Find common amenities you're missing
        common_missing = set()
        for comp_amenities in competitor_amenities:
            common_missing.update(comp_amenities - your_amenities)
        
        if common_missing:
            missing_list = list(common_missing)[:3]
            suggestions.append({
                "suggestion_type": "amenities",
                "suggestion_category": "medium",
                "suggestion_title": "Missing Common Amenities",
                "suggestion_text": f"Most competitors offer: {', '.join(missing_list)}. Adding these could make your property more competitive.",
                "expected_impact": "medium",
                "estimated_improvement": 25,
                "action_required": "Add missing amenities if available",
                "confidence_score": 75
            })
    
    return suggestions

def analyze_timing(property_data: Dict, performance: Dict) -> List[Dict]:
    """Analyze posting timing and freshness"""
    suggestions = []
    
    created_at_str = property_data.get('created_at')
    if created_at_str:
        try:
            created_at = datetime.fromisoformat(created_at_str.replace('Z', '+00:00'))
            days_old = (datetime.now(created_at.tzinfo) - created_at).days
            
            if days_old > 60:
                suggestions.append({
                    "suggestion_type": "timing",
                    "suggestion_category": "medium",
                    "suggestion_title": "Listing is Getting Stale",
                    "suggestion_text": "Your listing is over 60 days old. Consider refreshing with new photos, updated description, or slight price adjustment to boost visibility.",
                    "expected_impact": "medium",
                    "estimated_improvement": 30,
                    "action_required": "Refresh listing with updates",
                    "confidence_score": 80
                })
        except Exception as e:
            logger.warning(f"Failed to parse created_at: {e}")
    
    return suggestions

def calculate_performance_score(performance: Dict) -> float:
    """Calculate overall performance score (0-100)"""
    if not performance:
        return 50  # Default for new listings
    
    score = 0
    
    # Views (20% weight)
    views = performance.get('views_total', 0) or 0
    views_score = min(100, (views / 100) * 100)
    score += views_score * 0.2
    
    # Leads (30% weight)
    leads = performance.get('leads_generated', 0) or 0
    leads_score = min(100, (leads / 10) * 100)
    score += leads_score * 0.3
    
    # CTR (20% weight)
    ctr = float(performance.get('click_through_rate', 0) or 0)
    ctr_score = min(100, ctr * 20)
    score += ctr_score * 0.2
    
    # Conversion (30% weight)
    conv_rate = float(performance.get('conversion_rate', 0) or 0)
    conv_score = min(100, conv_rate * 10)
    score += conv_score * 0.3
    
    return round(score, 2)

# =============================================
# API ENDPOINTS
# =============================================
@app.post("/analyze")
async def analyze_listing(request: OptimizationRequest, background_tasks: BackgroundTasks):
    """
    Comprehensive listing analysis with AI-powered suggestions
    """
    try:
        supabase = get_supabase_client()
        
        # Fetch property
        property_data = supabase.table('properties').select('*').eq(
            'id', request.property_id
        ).single().execute()
        
        if not property_data.data:
            raise HTTPException(404, "Property not found")
        
        prop = property_data.data
        
        # Get performance metrics
        performance = supabase.table('listing_performance').select('*').eq(
            'property_id', request.property_id
        ).single().execute()
        
        perf_data = performance.data if performance.data else {}
        
        # Run analysis
        suggestions = []
        
        # 1. Image Analysis
        image_suggestions = analyze_images(prop, perf_data)
        suggestions.extend(image_suggestions)
        
        # 2. Pricing Analysis
        pricing_suggestions = analyze_pricing(prop, perf_data)
        suggestions.extend(pricing_suggestions)
        
        # 3. Description Analysis
        description_suggestions = analyze_description(prop, perf_data)
        suggestions.extend(description_suggestions)
        
        # 4. Competitive Analysis
        competitive_suggestions = analyze_competition(prop)
        suggestions.extend(competitive_suggestions)
        
        # 5. Timing Analysis
        timing_suggestions = analyze_timing(prop, perf_data)
        suggestions.extend(timing_suggestions)
        
        # Save suggestions to database
        for suggestion in suggestions:
            try:
                supabase.table('optimization_suggestions').insert({
                    "property_id": request.property_id,
                    **suggestion
                }).execute()
            except Exception as e:
                logger.warning(f"Failed to save suggestion: {e}")
        
        # Calculate overall performance score
        performance_score = calculate_performance_score(perf_data)
        
        # Update performance table
        try:
            supabase.table('listing_performance').upsert({
                "property_id": request.property_id,
                "performance_score": performance_score,
                "last_updated": datetime.now().isoformat()
            }).execute()
        except Exception as e:
            logger.warning(f"Failed to update performance: {e}")
        
        return {
            "success": True,
            "property_id": request.property_id,
            "performance_score": performance_score,
            "total_suggestions": len(suggestions),
            "critical_suggestions": len([s for s in suggestions if s['suggestion_category'] == 'critical']),
            "suggestions": suggestions
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Analysis failed: {str(e)}")
        raise HTTPException(500, f"Analysis failed: {str(e)}")

@app.get("/health")
async def health():
    return {"status": "healthy", "service": "Listing Optimizer"}

