# =============================================
# FEATURE 8: AI-POWERED SELLER OPTIMIZATION ENGINE
# Comprehensive real-time optimization system
# =============================================
import os
import re
import asyncio
from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta
import httpx
from supabase import create_client, Client
import logging
from collections import defaultdict

# =============================================
# CONFIGURATION
# =============================================
logger = logging.getLogger(__name__)

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

# AI Models
OLLAMA_URL = os.getenv("OLLAMA_URL", "http://localhost:11434")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "llama3.1:8b")

# Optimization thresholds
THRESHOLDS = {
    "low_views": 50,  # Views in 30 days
    "high_bounce_rate": 60,  # %
    "low_engagement": 2,  # %
    "low_leads": 3,  # Leads in 30 days
    "days_on_market_critical": 60
}

class SellerOptimizationEngine:
    """
    AI-powered listing optimization engine
    Analyzes performance and generates actionable recommendations
    """
    
    def __init__(self):
        self.supabase = get_supabase_client()
    
    async def analyze_and_optimize(self, property_id: str) -> Dict[str, Any]:
        """
        Main optimization pipeline
        1. Calculate performance metrics (done by DB trigger)
        2. Run competitive analysis
        3. Analyze images
        4. Generate pricing recommendations
        5. Create content suggestions
        6. Compile optimization suggestions
        """
        
        try:
            # Ensure performance metrics are current
            result = self.supabase.rpc("calculate_listing_performance", {
                "p_property_id": property_id
            }).execute()
            
            # Get current performance
            performance = self.supabase.table("listing_performance_metrics")\
                .select("*")\
                .eq("property_id", property_id)\
                .maybe_single()\
                .execute()
            
            perf_data = performance.data if performance.data else {}
            
            # Get property details
            property_data = self.supabase.table("properties")\
                .select("*, property_media(*)")\
                .eq("id", property_id)\
                .maybe_single()\
                .execute()
            
            if not property_data.data:
                raise ValueError("Property not found")
            
            prop = property_data.data
            
            # Run parallel analyses
            tasks = [
                self.competitive_analysis(property_id, prop),
                self.image_quality_analysis(property_id, prop.get("property_media", [])),
                self.pricing_analysis(property_id, prop, perf_data),
                self.content_analysis(property_id, prop)
            ]
            
            competitive, image_issues, pricing_rec, content_suggestions = await asyncio.gather(*tasks, return_exceptions=True)
            
            # Handle exceptions
            competitive = competitive if not isinstance(competitive, Exception) else {}
            image_issues = image_issues if not isinstance(image_issues, Exception) else []
            pricing_rec = pricing_rec if not isinstance(pricing_rec, Exception) else {}
            content_suggestions = content_suggestions if not isinstance(content_suggestions, Exception) else []
            
            # Generate comprehensive suggestions
            suggestions = await self.generate_suggestions(
                property_id,
                prop,
                perf_data,
                competitive,
                image_issues,
                pricing_rec,
                content_suggestions
            )
            
            return {
                "property_id": property_id,
                "performance_score": perf_data.get("overall_score", 0),
                "market_position": perf_data.get("market_position", "N/A"),
                "total_suggestions": len(suggestions),
                "critical_count": sum(1 for s in suggestions if s.get("priority") == "critical"),
                "high_priority_count": sum(1 for s in suggestions if s.get("priority") == "high"),
                "suggestions": suggestions,
                "competitive_insights": competitive,
                "estimated_impact": self._calculate_total_impact(suggestions)
            }
            
        except Exception as e:
            logger.error(f"Optimization failed: {str(e)}", exc_info=True)
            raise
    
    async def competitive_analysis(
        self,
        property_id: str,
        property_data: Dict
    ) -> Dict[str, Any]:
        """Analyze property vs market competitors"""
        
        try:
            location = property_data.get("location") or property_data.get("locality") or property_data.get("city", "")
            property_type = property_data.get("property_type", "")
            bedrooms = property_data.get("bedrooms")
            
            if not location or not property_type:
                return {
                    "competitors_found": 0,
                    "insights": "Insufficient data for competitive analysis"
                }
            
            # Find similar properties
            query = self.supabase.table("properties")\
                .select("id, price, price_inr, bedrooms, amenities, property_media(*), listing_performance_metrics(*)")\
                .eq("location", location)\
                .eq("property_type", property_type)\
                .eq("status", "active")
            
            if bedrooms:
                query = query.eq("bedrooms", bedrooms)
            
            similar_props = query.neq("id", property_id).limit(20).execute()
            
            if not similar_props.data or len(similar_props.data) == 0:
                return {
                    "competitors_found": 0,
                    "insights": "No direct competitors found in the same location"
                }
            
            competitors = similar_props.data
            
            # Calculate market averages
            prices = []
            views = []
            for p in competitors:
                price = float(p.get("price") or p.get("price_inr") or 0)
                if price > 0:
                    prices.append(price)
                
                if p.get("listing_performance_metrics") and len(p["listing_performance_metrics"]) > 0:
                    perf = p["listing_performance_metrics"][0]
                    views.append(perf.get("total_views", 0))
            
            market_avg_price = sum(prices) / len(prices) if prices else 0
            market_median_price = sorted(prices)[len(prices) // 2] if prices else 0
            market_avg_views = sum(views) / len(views) if views else 0
            
            # Calculate property's position
            property_price = float(property_data.get("price") or property_data.get("price_inr") or 0)
            price_percentile = sum(1 for p in prices if p < property_price) / len(prices) * 100 if prices else 50
            
            # Get property views
            prop_perf = self.supabase.table("listing_performance_metrics")\
                .select("total_views")\
                .eq("property_id", property_id)\
                .maybe_single()\
                .execute()
            
            property_views = prop_perf.data.get("total_views", 0) if prop_perf.data else 0
            view_performance_index = (property_views / market_avg_views * 100) if market_avg_views > 0 else 0
            
            # Identify competitive advantages/disadvantages
            advantages = []
            disadvantages = []
            
            if property_price > 0:
                if property_price < market_avg_price * 0.95:
                    advantages.append("Competitively priced below market average")
                elif property_price > market_avg_price * 1.1:
                    disadvantages.append("Priced above market average")
            
            # Compare amenities count
            prop_amenities = len(property_data.get("amenities", []) or [])
            competitor_amenities = [len(c.get("amenities", []) or []) for c in competitors]
            avg_amenities = sum(competitor_amenities) / len(competitor_amenities) if competitor_amenities else 0
            
            if prop_amenities > avg_amenities * 1.2:
                advantages.append(f"More amenities than average ({prop_amenities} vs {avg_amenities:.0f})")
            elif prop_amenities < avg_amenities * 0.8 and avg_amenities > 0:
                disadvantages.append(f"Fewer amenities than competitors")
            
            # Compare image count
            prop_images = len(property_data.get("property_media", []) or [])
            competitor_images = [len(c.get("property_media", []) or []) for c in competitors]
            avg_images = sum(competitor_images) / len(competitor_images) if competitor_images else 0
            
            if prop_images < avg_images * 0.7 and avg_images > 0:
                disadvantages.append(f"Fewer images than market average ({prop_images} vs {avg_images:.0f})")
            
            # Save to database
            competitive_data = {
                "property_id": property_id,
                "location": location,
                "property_type": property_type,
                "bedrooms": bedrooms,
                "total_competitors": len(competitors),
                "market_avg_price": market_avg_price,
                "market_median_price": market_median_price,
                "property_price": property_price,
                "price_percentile": price_percentile,
                "avg_market_views_per_week": market_avg_views / 4.0,
                "property_views_per_week": property_views / 4.0,
                "view_performance_index": view_performance_index,
                "competitive_advantages": advantages,
                "competitive_disadvantages": disadvantages,
                "analyzed_at": datetime.utcnow().isoformat()
            }
            
            # Use upsert to avoid conflicts
            self.supabase.table("competitive_analysis_new")\
                .upsert(competitive_data, on_conflict="property_id")\
                .execute()
            
            return competitive_data
            
        except Exception as e:
            logger.error(f"Competitive analysis failed: {str(e)}", exc_info=True)
            return {"error": str(e)}
    
    async def image_quality_analysis(
        self,
        property_id: str,
        media_list: List[Dict]
    ) -> List[Dict[str, Any]]:
        """Analyze image quality and detect issues"""
        
        issues = []
        
        # Check image count
        image_count = len([m for m in media_list if m.get("media_type") == "image"])
        
        if image_count == 0:
            issues.append({
                "severity": "critical",
                "issue": "No images uploaded",
                "fix": "Add at least 5-10 high-quality images showing different rooms",
                "impact_score": 95
            })
        elif image_count < 5:
            issues.append({
                "severity": "high",
                "issue": f"Only {image_count} images - below market standard",
                "fix": "Add more images to showcase all rooms and key features",
                "impact_score": 70
            })
        
        # Check for primary image
        has_primary = any(m.get("is_primary") for m in media_list)
        if not has_primary and image_count > 0:
            issues.append({
                "severity": "medium",
                "issue": "No primary image set",
                "fix": "Set your best, most appealing image as the primary listing photo",
                "impact_score": 45
            })
        
        # Check for virtual staging
        has_staging = any(
            m.get("is_staged") or (m.get("metadata", {}).get("is_staged") if isinstance(m.get("metadata"), dict) else False)
            for m in media_list
        )
        
        if not has_staging and image_count > 0:
            issues.append({
                "severity": "medium",
                "issue": "No virtually staged images",
                "fix": "Use our AI Virtual Staging to make empty rooms more appealing",
                "impact_score": 60
            })
        
        return issues
    
    async def pricing_analysis(
        self,
        property_id: str,
        property_data: Dict,
        performance_data: Dict
    ) -> Dict[str, Any]:
        """AI-powered pricing recommendations"""
        
        try:
            current_price = float(property_data.get("price") or property_data.get("price_inr") or 0)
            
            if current_price == 0:
                return {
                    "needs_pricing": True,
                    "message": "No price set for this property"
                }
            
            # Get competitive analysis
            comp = self.supabase.table("competitive_analysis_new")\
                .select("*")\
                .eq("property_id", property_id)\
                .order("analyzed_at", desc=True)\
                .limit(1)\
                .maybe_single()\
                .execute()
            
            if not comp.data:
                return {"error": "Competitive analysis required first"}
            
            comp_data = comp.data
            
            # Calculate days on market
            created_at_str = property_data.get("created_at") or property_data.get("listed_at")
            days_on_market = 0
            if created_at_str:
                try:
                    created_at = datetime.fromisoformat(created_at_str.replace('Z', '+00:00'))
                    days_on_market = (datetime.utcnow() - created_at.replace(tzinfo=None)).days
                except:
                    pass
            
            # Get view velocity (views per day in last 7 days)
            view_velocity = performance_data.get("last_7_days_views", 0) / 7.0
            
            # Determine pricing strategy
            strategy = "competitive"
            reasoning = []
            recommended_price = current_price
            price_percentile = comp_data.get("price_percentile", 50)
            
            # Check if overpriced
            if price_percentile > 75:
                if performance_data.get("total_views", 0) < THRESHOLDS["low_views"]:
                    strategy = "urgent"
                    reasoning.append("High price relative to market with low views suggests overpricing")
                    recommended_price = current_price * 0.92  # 8% reduction
                else:
                    strategy = "premium"
                    reasoning.append("Premium pricing but generating interest")
                    recommended_price = current_price * 0.98  # Small adjustment
            
            # Check if underpriced with high demand
            elif price_percentile < 25:
                if view_velocity > 10 and performance_data.get("view_to_contact_rate", 0) > 5:
                    strategy = "value"
                    reasoning.append("Strong demand at current price - room for increase")
                    recommended_price = current_price * 1.05  # 5% increase
                else:
                    strategy = "competitive"
                    reasoning.append("Competitive pricing maintains market position")
                    recommended_price = current_price
            
            # Market-aligned pricing
            else:
                if days_on_market > THRESHOLDS["days_on_market_critical"]:
                    strategy = "urgent"
                    reasoning.append("Extended time on market - price adjustment needed")
                    market_median = comp_data.get("market_median_price", current_price)
                    recommended_price = market_median * 0.97
                else:
                    strategy = "competitive"
                    reasoning.append("Market-aligned pricing")
                    recommended_price = current_price
            
            price_adjustment_pct = ((recommended_price - current_price) / current_price * 100) if current_price > 0 else 0
            
            # Save recommendation
            pricing_rec = {
                "property_id": property_id,
                "current_price": current_price,
                "recommended_price": recommended_price,
                "price_adjustment_pct": price_adjustment_pct,
                "strategy": strategy,
                "reasoning": reasoning,
                "days_on_market": days_on_market,
                "view_velocity": view_velocity,
                "market_demand_score": min(100, view_velocity * 5),
                "confidence_level": 75.0,
                "created_at": datetime.utcnow().isoformat(),
                "expires_at": (datetime.utcnow() + timedelta(days=7)).isoformat()
            }
            
            self.supabase.table("pricing_recommendations").insert(pricing_rec).execute()
            
            return pricing_rec
            
        except Exception as e:
            logger.error(f"Pricing analysis failed: {str(e)}", exc_info=True)
            return {"error": str(e)}
    
    async def content_analysis(
        self,
        property_id: str,
        property_data: Dict
    ) -> List[Dict[str, Any]]:
        """Analyze and improve listing content using AI"""
        
        suggestions = []
        
        # Check title quality
        title = property_data.get("title", "")
        if len(title) < 20:
            # Generate better title
            improved_title = await self._generate_improved_title(property_data)
            suggestions.append({
                "content_type": "title",
                "original": title,
                "improved": improved_title,
                "reason": "Title too short - not SEO optimized"
            })
        
        # Check description quality
        description = property_data.get("description", "")
        if len(description) < 100:
            # Generate better description
            improved_desc = await self._generate_improved_description(property_data)
            suggestions.append({
                "content_type": "description",
                "original": description,
                "improved": improved_desc,
                "reason": "Description lacks detail and emotional appeal"
            })
        
        # Check for missing highlights
        if not property_data.get("highlights") or len(property_data.get("highlights", [])) < 3:
            highlights = await self._generate_highlights(property_data)
            suggestions.append({
                "content_type": "highlights",
                "original": property_data.get("highlights", []),
                "improved": highlights,
                "reason": "Property highlights help buyers quickly understand value"
            })
        
        return suggestions
    
    async def _generate_improved_title(self, property_data: Dict) -> str:
        """Generate SEO-optimized title using AI"""
        
        prompt = f"""Create a compelling, SEO-optimized property listing title for:
- Type: {property_data.get('bedrooms')}BHK {property_data.get('property_type')}
- Location: {property_data.get('location')}
- Price: ₹{property_data.get('price', property_data.get('price_inr', 0)):,.0f}
- Area: {property_data.get('sqft') or property_data.get('area', 'N/A')} sq.ft

Requirements:
- 50-70 characters
- Include key selling points
- Include location
- Appealing and professional
- Use Indian English

Generate only the title, nothing else:"""
        
        title = await self._call_llm(prompt, max_tokens=50)
        return title.strip()
    
    async def _generate_improved_description(self, property_data: Dict) -> str:
        """Generate engaging property description"""
        
        amenities_str = ", ".join((property_data.get("amenities", []) or [])[:5])
        
        prompt = f"""Write a compelling property description for:
Property Details:
- Type: {property_data.get('bedrooms')}BHK {property_data.get('property_type')}
- Location: {property_data.get('location')}
- Price: ₹{property_data.get('price', property_data.get('price_inr', 0)):,.0f}
- Area: {property_data.get('sqft') or property_data.get('area')} sq.ft
- Amenities: {amenities_str}

Requirements:
- 150-250 words
- Highlight lifestyle benefits, not just features
- Create emotional appeal
- Include call-to-action
- Use Indian English
- Professional yet warm tone

Generate the description:"""
        
        description = await self._call_llm(prompt, max_tokens=300)
        return description.strip()
    
    async def _generate_highlights(self, property_data: Dict) -> List[str]:
        """Generate key property highlights"""
        
        prompt = f"""List 5-7 compelling highlights for this property:
- {property_data.get('bedrooms')}BHK in {property_data.get('location')}
- {property_data.get('sqft') or property_data.get('area')} sq.ft
- Amenities: {', '.join((property_data.get('amenities', []) or [])[:5])}

Format: Return only a comma-separated list of highlights, each 3-8 words.

Example: "Prime location near IT hub, Modern amenities with gym, 24/7 security"

Generate:"""
        
        highlights_str = await self._call_llm(prompt, max_tokens=100)
        highlights = [h.strip() for h in highlights_str.split(',') if h.strip()]
        return highlights[:7]
    
    async def generate_suggestions(
        self,
        property_id: str,
        property_data: Dict,
        performance_data: Dict,
        competitive_data: Dict,
        image_issues: List[Dict],
        pricing_rec: Dict,
        content_suggestions: List[Dict]
    ) -> List[Dict[str, Any]]:
        """Compile all analyses into prioritized suggestions"""
        
        suggestions = []
        
        # === CRITICAL SUGGESTIONS ===
        
        # Low views - critical
        total_views = performance_data.get("total_views", 0)
        if total_views < THRESHOLDS["low_views"]:
            view_index = competitive_data.get("view_performance_index", 0)
            suggestions.append({
                "property_id": property_id,
                "category": "marketing",
                "suggestion_type": "low_visibility",
                "priority": "critical",
                "impact_score": 90,
                "title": "⚠️ Very Low Visibility",
                "description": f"Your listing has only {total_views} views in 30 days, which is {view_index:.0f}% of market average.",
                "detailed_analysis": {
                    "current_views": total_views,
                    "market_average": competitive_data.get("avg_market_views_per_week", 0) * 4,
                    "performance_gap": 100 - view_index
                },
                "action_steps": [
                    {"step": 1, "action": "Improve images - add professional photos", "difficulty": "medium"},
                    {"step": 2, "action": "Optimize title and description for SEO", "difficulty": "easy"},
                    {"step": 3, "action": "Adjust pricing to market competitive level", "difficulty": "easy"},
                    {"step": 4, "action": "Share listing on social media", "difficulty": "easy"}
                ],
                "estimated_view_increase_pct": 150,
                "estimated_lead_increase_pct": 200,
                "expected_timeframe_days": 14,
                "ai_model_used": OLLAMA_MODEL,
                "confidence_score": 85,
                "status": "pending"
            })
        
        # Image issues - critical if no images
        for issue in image_issues:
            if issue.get("severity") == "critical":
                suggestions.append({
                    "property_id": property_id,
                    "category": "images",
                    "suggestion_type": "missing_images",
                    "priority": "critical",
                    "impact_score": issue.get("impact_score", 90),
                    "title": f"🖼️ {issue.get('issue')}",
                    "description": issue.get("fix"),
                    "action_steps": [
                        {"step": 1, "action": "Take photos of all rooms with good lighting", "difficulty": "easy"},
                        {"step": 2, "action": "Upload at least 8-10 images", "difficulty": "easy"},
                        {"step": 3, "action": "Use AI Virtual Staging for empty rooms", "difficulty": "easy"}
                    ],
                    "estimated_view_increase_pct": 80,
                    "expected_timeframe_days": 3,
                    "confidence_score": 95,
                    "status": "pending"
                })
        
        # === HIGH PRIORITY SUGGESTIONS ===
        
        # Pricing optimization
        price_adj_pct = abs(pricing_rec.get("price_adjustment_pct", 0))
        if price_adj_pct > 5:
            suggestions.append({
                "property_id": property_id,
                "category": "pricing",
                "suggestion_type": "price_optimization",
                "priority": "high",
                "impact_score": 85,
                "title": f"💰 Price Adjustment Recommended",
                "description": f"AI suggests {pricing_rec.get('strategy')} pricing strategy with {price_adj_pct:.1f}% adjustment to ₹{pricing_rec.get('recommended_price', 0):,.0f}",
                "detailed_analysis": {
                    "current_price": pricing_rec.get("current_price"),
                    "recommended_price": pricing_rec.get("recommended_price"),
                    "market_position": competitive_data.get("price_percentile"),
                    "reasoning": pricing_rec.get("reasoning", [])
                },
                "action_steps": [
                    {"step": 1, "action": f"Update price to ₹{pricing_rec.get('recommended_price', 0):,.0f}", "difficulty": "easy"},
                    {"step": 2, "action": "Monitor views/leads for 7 days", "difficulty": "easy"},
                    {"step": 3, "action": "Adjust further if needed", "difficulty": "easy"}
                ],
                "estimated_view_increase_pct": 40,
                "estimated_lead_increase_pct": 50,
                "expected_timeframe_days": 7,
                "confidence_score": pricing_rec.get("confidence_level", 75),
                "status": "pending"
            })
        
        # High bounce rate
        bounce_rate = performance_data.get("bounce_rate", 0)
        if bounce_rate > THRESHOLDS["high_bounce_rate"]:
            suggestions.append({
                "property_id": property_id,
                "category": "marketing",
                "suggestion_type": "high_bounce_rate",
                "priority": "high",
                "impact_score": 75,
                "title": "📊 High Bounce Rate",
                "description": f"{bounce_rate:.1f}% of visitors leave immediately - listing not engaging enough",
                "action_steps": [
                    {"step": 1, "action": "Set your best image as primary photo", "difficulty": "easy"},
                    {"step": 2, "action": "Improve the first 2 lines of description", "difficulty": "easy"},
                    {"step": 3, "action": "Add video tour if possible", "difficulty": "medium"}
                ],
                "estimated_view_increase_pct": 30,
                "expected_timeframe_days": 5,
                "confidence_score": 70,
                "status": "pending"
            })
        
        # Content improvements
        for content in content_suggestions:
            content_type = content.get("content_type")
            if content_type in ["title", "description"]:
                suggestions.append({
                    "property_id": property_id,
                    "category": "description",
                    "suggestion_type": f"improve_{content_type}",
                    "priority": "high" if content_type == "title" else "medium",
                    "impact_score": 70 if content_type == "title" else 55,
                    "title": f"✍️ Improve {content_type.title()}",
                    "description": content.get("reason"),
                    "detailed_analysis": {
                        "original": content.get("original"),
                        "ai_improved": content.get("improved")
                    },
                    "action_steps": [
                        {"step": 1, "action": f"Replace {content_type} with AI-generated version", "difficulty": "easy"},
                        {"step": 2, "action": "Review and customize if needed", "difficulty": "easy"}
                    ],
                    "estimated_view_increase_pct": 25,
                    "expected_timeframe_days": 1,
                    "confidence_score": 80,
                    "status": "pending"
                })
        
        # === MEDIUM PRIORITY ===
        
        # Add more images
        for issue in image_issues:
            severity = issue.get("severity")
            if severity in ["high", "medium"]:
                suggestions.append({
                    "property_id": property_id,
                    "category": "images",
                    "suggestion_type": "image_improvement",
                    "priority": "medium",
                    "impact_score": issue.get("impact_score", 60),
                    "title": f"📸 {issue.get('issue')}",
                    "description": issue.get("fix"),
                    "action_steps": [
                        {"step": 1, "action": issue.get("fix"), "difficulty": "easy"}
                    ],
                    "estimated_view_increase_pct": 20,
                    "expected_timeframe_days": 3,
                    "confidence_score": 75,
                    "status": "pending"
                })
        
        # Low engagement rate
        view_to_contact = performance_data.get("view_to_contact_rate", 0)
        if view_to_contact < THRESHOLDS["low_engagement"]:
            suggestions.append({
                "property_id": property_id,
                "category": "marketing",
                "suggestion_type": "low_conversion",
                "priority": "medium",
                "impact_score": 65,
                "title": "📞 Low Contact Rate",
                "description": f"Only {view_to_contact:.1f}% of viewers contact you - improve trust signals",
                "action_steps": [
                    {"step": 1, "action": "Add RERA certificate to documents", "difficulty": "easy"},
                    {"step": 2, "action": "Include floor plans", "difficulty": "medium"},
                    {"step": 3, "action": "Add clear contact CTA in description", "difficulty": "easy"}
                ],
                "estimated_lead_increase_pct": 40,
                "expected_timeframe_days": 7,
                "confidence_score": 65,
                "status": "pending"
            })
        
        # Save all suggestions to database
        for suggestion in suggestions:
            try:
                self.supabase.table("ai_optimization_suggestions").insert(suggestion).execute()
            except Exception as e:
                logger.warning(f"Failed to save suggestion: {str(e)}")
        
        return suggestions
    
    async def _call_llm(
        self,
        prompt: str,
        max_tokens: int = 300,
        temperature: float = 0.7
    ) -> str:
        """Call LLM for content generation"""
        
        try:
            async with httpx.AsyncClient(timeout=60.0) as client:
                response = await client.post(
                    f"{OLLAMA_URL}/api/generate",
                    json={
                        "model": OLLAMA_MODEL,
                        "prompt": prompt,
                        "stream": False,
                        "options": {
                            "temperature": temperature,
                            "num_predict": max_tokens
                        }
                    }
                )
                
                if response.status_code == 200:
                    result = response.json()
                    return result.get("response", "AI service unavailable")
        except Exception as e:
            logger.warning(f"LLM call failed: {str(e)}")
        
        return "AI service unavailable"
    
    def _calculate_total_impact(self, suggestions: List[Dict]) -> Dict[str, Any]:
        """Calculate cumulative impact of all suggestions"""
        
        total_view_increase = sum(s.get("estimated_view_increase_pct", 0) for s in suggestions)
        total_lead_increase = sum(s.get("estimated_lead_increase_pct", 0) for s in suggestions)
        
        # Cap at realistic maximums
        total_view_increase = min(total_view_increase, 200)
        total_lead_increase = min(total_lead_increase, 300)
        
        return {
            "estimated_view_increase_pct": total_view_increase,
            "estimated_lead_increase_pct": total_lead_increase,
            "implementation_difficulty": "medium",
            "estimated_timeframe_days": 14
        }

# Create singleton instance
_optimizer_instance: Optional[SellerOptimizationEngine] = None

def get_optimizer() -> SellerOptimizationEngine:
    """Get singleton optimizer instance"""
    global _optimizer_instance
    if _optimizer_instance is None:
        _optimizer_instance = SellerOptimizationEngine()
    return _optimizer_instance



