"""  
SmartScore AI - Advanced Lead Scoring System
Scores leads 0-100 based on multiple factors
"""
import logging
from typing import Dict, Tuple
from ..models.lead import LeadTier
from ..config import settings

logger = logging.getLogger(__name__)

class ScoringService:
    """Advanced AI-based scoring for leads and properties"""
    
    @staticmethod
    def calculate_lead_score(lead_data: dict) -> Tuple[int, LeadTier, Dict]:
        """
        SmartScore AI: Calculate lead score 0-100
        Returns: (score, tier, factors_breakdown)
        """
        score = 0
        factors = {}
        
        # 1. Budget Score (25 points)
        budget_score = ScoringService._score_budget(
            lead_data.get('budget_min'),
            lead_data.get('budget_max')
        )
        score += budget_score * settings.LEAD_SCORE_BUDGET_WEIGHT
        factors['budget'] = {
            'score': round(budget_score, 2),
            'weight': settings.LEAD_SCORE_BUDGET_WEIGHT,
            'contribution': round(budget_score * settings.LEAD_SCORE_BUDGET_WEIGHT, 2)
        }
        
        # 2. Timeline Score (20 points)
        timeline_score = ScoringService._score_timeline(lead_data.get('timeline'))
        score += timeline_score * settings.LEAD_SCORE_TIMELINE_WEIGHT
        factors['timeline'] = {
            'score': round(timeline_score, 2),
            'weight': settings.LEAD_SCORE_TIMELINE_WEIGHT,
            'contribution': round(timeline_score * settings.LEAD_SCORE_TIMELINE_WEIGHT, 2)
        }
        
        # 3. Engagement Score (20 points)
        engagement_score = ScoringService._score_engagement(
            lead_data.get('source'),
            lead_data.get('landing_page'),
            lead_data.get('utm_campaign')
        )
        score += engagement_score * settings.LEAD_SCORE_ENGAGEMENT_WEIGHT
        factors['engagement'] = {
            'score': round(engagement_score, 2),
            'weight': settings.LEAD_SCORE_ENGAGEMENT_WEIGHT,
            'contribution': round(engagement_score * settings.LEAD_SCORE_ENGAGEMENT_WEIGHT, 2)
        }
        
        # 4. Source Quality Score (15 points)
        source_score = ScoringService._score_source(lead_data.get('source'))
        score += source_score * settings.LEAD_SCORE_SOURCE_WEIGHT
        factors['source'] = {
            'score': round(source_score, 2),
            'weight': settings.LEAD_SCORE_SOURCE_WEIGHT,
            'contribution': round(source_score * settings.LEAD_SCORE_SOURCE_WEIGHT, 2)
        }
        
        # 5. Qualification Score (20 points)
        qualification_score = ScoringService._score_qualification(
            lead_data.get('is_qualified', False),
            lead_data.get('qualification_data')
        )
        score += qualification_score * settings.LEAD_SCORE_QUALIFICATION_WEIGHT
        factors['qualification'] = {
            'score': round(qualification_score, 2),
            'weight': settings.LEAD_SCORE_QUALIFICATION_WEIGHT,
            'contribution': round(qualification_score * settings.LEAD_SCORE_QUALIFICATION_WEIGHT, 2)
        }
        
        # Normalize to 0-100
        final_score = max(0, min(100, int(score)))
        
        # Determine tier
        if final_score >= settings.LION_THRESHOLD:
            tier = LeadTier.lion
        elif final_score >= settings.MONKEY_THRESHOLD:
            tier = LeadTier.monkey
        else:
            tier = LeadTier.dog
        
        factors['final_score'] = final_score
        factors['tier'] = tier.value
        factors['confidence'] = ScoringService._calculate_confidence(lead_data)
        
        logger.info(f"Lead scored: {final_score} ({tier.value})")
        return final_score, tier, factors
    
    @staticmethod
    def _score_budget(budget_min: float, budget_max: float) -> float:
        """Score based on budget range (0-100)"""
        if not budget_min or not budget_max:
            return 50  # Neutral score for missing budget
        
        avg_budget = (budget_min + budget_max) / 2
        
        # Higher budgets = higher scores
        if avg_budget >= 10000000:  # 1Cr+
            return 100
        elif avg_budget >= 5000000:  # 50L+
            return 85
        elif avg_budget >= 3000000:  # 30L+
            return 70
        elif avg_budget >= 2000000:  # 20L+
            return 55
        else:
            return 40
    
    @staticmethod
    def _score_timeline(timeline: str) -> float:
        """Score based on purchase timeline (0-100)"""
        if not timeline:
            return 50
        
        timeline_scores = {
            'immediate': 100,
            '1-3months': 85,
            '3-6months': 65,
            '6-12months': 45,
            '12+months': 25
        }
        return timeline_scores.get(timeline.lower(), 50)
    
    @staticmethod
    def _score_engagement(source: str, landing_page: str, utm_campaign: str) -> float:
        """Score based on engagement signals (0-100)"""
        score = 50  # Base score
        
        # High-intent landing pages
        if landing_page:
            if 'contact' in landing_page.lower() or 'schedule' in landing_page.lower():
                score += 25
            elif 'property-listing' in landing_page.lower():
                score += 15
        
        # Campaign quality
        if utm_campaign:
            if 'brand' in utm_campaign.lower():
                score += 15
            elif 'retargeting' in utm_campaign.lower():
                score += 10
        
        return min(100, score)
    
    @staticmethod
    def _score_source(source: str) -> float:
        """Score based on lead source quality (0-100)"""
        source_scores = {
            'referral': 95,
            'direct': 85,
            'organic': 75,
            'meta': 70,
            'google': 70,
            'whatsapp': 80,
            'web': 65
        }
        return source_scores.get(source, 50)
    
    @staticmethod
    def _score_qualification(is_qualified: bool, qualification_data: dict) -> float:
        """Score based on AI qualification status (0-100)"""
        if not is_qualified:
            return 30  # Base score for unqualified
        
        if not qualification_data:
            return 70  # Qualified but no detailed data
        
        # Analyze qualification responses
        score = 70
        
        # Check for complete qualification
        if qualification_data.get('completion_rate', 0) >= 0.8:
            score += 20
        
        # Check for positive signals
        if qualification_data.get('serious_buyer', False):
            score += 10
        
        return min(100, score)
    
    @staticmethod
    def _calculate_confidence(lead_data: dict) -> float:
        """Calculate confidence score based on data completeness (0-1)"""
        total_fields = 10
        filled_fields = 0
        
        key_fields = [
            'name', 'phone', 'email', 'budget_min', 'budget_max',
            'property_type', 'timeline', 'preferred_localities',
            'source', 'bedrooms'
        ]
        
        for field in key_fields:
            if lead_data.get(field):
                filled_fields += 1
        
        return round(filled_fields / total_fields, 2)
    
    @staticmethod
    def calculate_property_score(property_data: dict, locality_data: dict = None) -> Tuple[int, Dict]:
        """
        AI Property Score: Calculate property attractiveness 0-100
        Returns: (score, factors_breakdown)
        """
        score = 0
        factors = {}
        
        # 1. Location Score (30 points)
        location_score = ScoringService._score_property_location(
            property_data.get('city'),
            property_data.get('locality'),
            locality_data
        )
        score += location_score * settings.PROPERTY_SCORE_LOCATION_WEIGHT
        factors['location'] = round(location_score * settings.PROPERTY_SCORE_LOCATION_WEIGHT, 2)
        
        # 2. Price Score (25 points)
        price_score = ScoringService._score_property_price(
            property_data.get('price_inr'),
            property_data.get('sqft'),
            locality_data
        )
        score += price_score * settings.PROPERTY_SCORE_PRICE_WEIGHT
        factors['price'] = round(price_score * settings.PROPERTY_SCORE_PRICE_WEIGHT, 2)
        
        # 3. Amenities Score (20 points)
        amenities_score = ScoringService._score_property_amenities(
            property_data.get('amenities', []),
            property_data.get('parking'),
            property_data.get('furnishing')
        )
        score += amenities_score * settings.PROPERTY_SCORE_AMENITIES_WEIGHT
        factors['amenities'] = round(amenities_score * settings.PROPERTY_SCORE_AMENITIES_WEIGHT, 2)
        
        # 4. RERA Score (15 points)
        rera_score = 100 if property_data.get('is_rera_verified') else 40
        score += rera_score * settings.PROPERTY_SCORE_RERA_WEIGHT
        factors['rera'] = round(rera_score * settings.PROPERTY_SCORE_RERA_WEIGHT, 2)
        
        # 5. Builder Trust Score (10 points)
        builder_score = property_data.get('builder_trust_score', 70)
        score += builder_score * settings.PROPERTY_SCORE_BUILDER_WEIGHT
        factors['builder'] = round(builder_score * settings.PROPERTY_SCORE_BUILDER_WEIGHT, 2)
        
        final_score = max(0, min(100, int(score)))
        factors['final_score'] = final_score
        
        return final_score, factors
    
    @staticmethod
    def _score_property_location(city: str, locality: str, locality_data: dict) -> float:
        """Score property location (0-100)"""
        score = 50  # Base score
        
        if not locality_data:
            return score
        
        # Demand level
        demand_level = locality_data.get('demand_level', '').lower()
        demand_scores = {
            'very_high': 95,
            'high': 80,
            'medium': 60,
            'low': 40
        }
        if demand_level:
            score = demand_scores.get(demand_level, 50)
        
        # Connectivity bonus
        connectivity = locality_data.get('connectivity_score', 0)
        if connectivity >= 90:
            score = min(100, score + 10)
        elif connectivity >= 80:
            score = min(100, score + 5)
        
        return score
    
    @staticmethod
    def _score_property_price(price: float, sqft: float, locality_data: dict) -> float:
        """Score property price competitiveness (0-100)"""
        if not price or not sqft:
            return 50
        
        price_per_sqft = price / sqft
        
        if not locality_data:
            return 65  # Neutral when no market data
        
        avg_price_sqft = locality_data.get('avg_price_sqft', price_per_sqft)
        
        # Compare to market average
        ratio = price_per_sqft / avg_price_sqft if avg_price_sqft > 0 else 1
        
        if ratio <= 0.85:  # 15% below market
            return 95  # Great deal
        elif ratio <= 0.95:  # 5% below market
            return 85
        elif ratio <= 1.05:  # At market
            return 75
        elif ratio <= 1.15:  # 15% above market
            return 55
        else:
            return 35  # Overpriced
    
    @staticmethod
    def _score_property_amenities(amenities: list, parking: int, furnishing: str) -> float:
        """Score property amenities (0-100)"""
        score = 40  # Base score
        
        # Premium amenities
        premium_amenities = {'gym', 'pool', 'clubhouse', 'security', 'playground', 'garden'}
        if amenities:
            matches = len(set([a.lower() for a in amenities]) & premium_amenities)
            score += min(30, matches * 6)
        
        # Parking
        if parking and parking > 0:
            score += 15
        
        # Furnishing
        if furnishing:
            furnishing_scores = {
                'furnished': 15,
                'semi-furnished': 10,
                'unfurnished': 0
            }
            score += furnishing_scores.get(furnishing.lower(), 0)
        
        return min(100, score)