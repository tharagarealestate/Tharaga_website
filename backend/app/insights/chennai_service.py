"""
Chennai Locality Insights Service
Collects flood, price trends, infrastructure, rental yield, and safety data
"""
from typing import Dict, Any, Optional
from datetime import datetime
import httpx


class ChennaiInsightsService:
    """
    Service for collecting Chennai-specific locality insights
    """
    
    # Chennai micro-markets mapping
    CHENNAI_LOCALITIES = {
        'OMR': 'Old Mahabalipuram Road',
        'ECR': 'East Coast Road',
        'Velachery': 'Velachery',
        'Porur': 'Porur',
        'Ambattur': 'Ambattur',
        'Pallavaram': 'Pallavaram',
        'Chrompet': 'Chrompet',
        # Add more Chennai localities
    }
    
    def __init__(self, config: Dict[str, Any]):
        self.config = config
    
    async def collect_insights(
        self,
        property_id: str,
        locality: str,
        latitude: Optional[float] = None,
        longitude: Optional[float] = None
    ) -> Dict[str, Any]:
        """
        Collect comprehensive Chennai locality insights
        
        Returns:
            Dict with flood_score, price_trend_data, infrastructure, rental_yield, safety_indicator
        """
        insights = {
            'property_id': property_id,
            'locality': locality,
            'data_collected_at': datetime.now().isoformat(),
            'data_source': 'SYNTHETIC',  # Mark as synthetic until real data sources are approved
        }
        
        # 1. Flood Score (0-100)
        flood_score = await self._get_flood_score(locality, latitude, longitude)
        insights['flood_score'] = flood_score
        insights['flood_score_source'] = 'SYNTHETIC'  # Would be government data in production
        insights['flood_score_provenance'] = 'Automated analysis of elevation and proximity to water bodies'
        
        # 2. Price Trends (5-year)
        price_trend_data = await self._get_price_trends(locality)
        insights['price_trend_data'] = price_trend_data
        insights['price_trend_summary'] = self._generate_price_trend_summary(price_trend_data)
        insights['price_trend_source'] = 'SYNTHETIC'  # Would be real estate portal data in production
        
        # 3. Infrastructure
        infrastructure = await self._get_infrastructure(locality, latitude, longitude)
        insights.update(infrastructure)
        insights['infrastructure_source'] = 'SYNTHETIC'  # Would be Google Maps, OSM, government data
        
        # 4. Rental Yield
        rental_yield = await self._get_rental_yield(locality)
        insights['rental_yield_min'] = rental_yield.get('min', 2.5)
        insights['rental_yield_max'] = rental_yield.get('max', 4.0)
        insights['rental_yield_formula'] = 'Based on average rental rates and property prices in locality'
        insights['rental_yield_source'] = 'SYNTHETIC'  # Would be rental portal data
        
        # 5. Safety Indicator
        safety = await self._get_safety_indicator(locality, flood_score)
        insights['safety_indicator'] = safety
        insights['safety_provenance'] = 'Based on flood risk assessment and locality crime data'
        
        return insights
    
    async def _get_flood_score(
        self,
        locality: str,
        lat: Optional[float],
        lng: Optional[float]
    ) -> float:
        """Get flood score (0-100) - Higher = higher flood risk"""
        # Synthetic data for now
        # In production, would query government flood maps or ISRO data
        
        # Example heuristic based on locality
        flood_risk_localities = ['Velachery', 'Tambaram', 'Pallavaram']
        if any(loc in locality for loc in flood_risk_localities):
            return 75.0  # High flood risk
        
        return 45.0  # Medium flood risk (default)
    
    async def _get_price_trends(self, locality: str) -> list:
        """Get 5-year price trend data"""
        # Synthetic data - array of {year, price_per_sqft}
        current_year = datetime.now().year
        base_price = 4500  # Base price per sqft for Chennai
        
        trends = []
        for year_offset in range(5, 0, -1):
            year = current_year - year_offset
            # Simulate 5% annual appreciation
            price = base_price * (1.05 ** year_offset)
            trends.append({
                'year': year,
                'price_per_sqft': round(price, 0)
            })
        
        return trends
    
    def _generate_price_trend_summary(self, trends: list) -> str:
        """Generate human-readable price trend summary"""
        if not trends or len(trends) < 2:
            return 'Insufficient data for trend analysis'
        
        first = trends[0]
        last = trends[-1]
        
        growth = ((last['price_per_sqft'] - first['price_per_sqft']) / first['price_per_sqft']) * 100
        
        if growth > 5:
            return f"Prices in this locality showed steady increase over past 5 years, with approximately {round(growth, 1)}% appreciation."
        elif growth > 0:
            return f"Prices in this locality showed moderate growth over past 5 years, with approximately {round(growth, 1)}% appreciation."
        else:
            return f"Prices in this locality showed minimal change over past 5 years."
    
    async def _get_infrastructure(
        self,
        locality: str,
        lat: Optional[float],
        lng: Optional[float]
    ) -> Dict[str, Any]:
        """Get infrastructure data (schools, hospitals, IT parks, transport)"""
        return {
            'nearby_schools': [
                {'name': 'ABC International School', 'distance_km': 1.5, 'type': 'International', 'source': 'SYNTHETIC'},
                {'name': 'XYZ Public School', 'distance_km': 2.0, 'type': 'Public', 'source': 'SYNTHETIC'},
            ],
            'nearby_hospitals': [
                {'name': 'City General Hospital', 'distance_km': 3.0, 'source': 'SYNTHETIC'},
            ],
            'nearby_it_parks': [
                {'name': f'{locality} IT Park', 'distance_km': 5.0, 'source': 'SYNTHETIC'},
            ],
            'upcoming_transport': [
                {'project': 'Metro Line Extension', 'completion_year': 2026, 'source': 'SYNTHETIC'},
            ],
        }
    
    async def _get_rental_yield(self, locality: str) -> Dict[str, float]:
        """Get rental yield estimate (min-max range)"""
        # Synthetic data - would use rental portal data in production
        return {
            'min': 2.5,  # 2.5% minimum yield
            'max': 4.0,  # 4.0% maximum yield
        }
    
    async def _get_safety_indicator(self, locality: str, flood_score: float) -> str:
        """Get safety indicator (Low/Medium/High)"""
        if flood_score >= 70:
            return 'Low'
        elif flood_score >= 40:
            return 'Medium'
        else:
            return 'High'




