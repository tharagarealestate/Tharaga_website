"""
Explainable ML Appreciation Band Model
Returns LOW/MEDIUM/HIGH bands with feature explanations
"""
from typing import Dict, Any, List, Tuple
import numpy as np


class AppreciationBandModel:
    """
    Explainable ML model for property appreciation prediction
    Returns LOW/MEDIUM/HIGH bands with feature importance explanations
    """
    
    def __init__(self, config: Dict[str, Any]):
        self.config = config
        self.model_version = 'v1'
        self.training_data_provenance = 'SYNTHETIC'  # Real data would be documented here
        self.model_limitations = (
            'This model uses synthetic training data and heuristics. '
            'Predictions are for informational purposes only and should not be used '
            'as the sole basis for investment decisions. Real estate markets are '
            'subject to various factors that may affect actual appreciation.'
        )
    
    def predict(
        self,
        property_data: Dict[str, Any],
        locality_insights: Dict[str, Any] = None,
        infrastructure_data: Dict[str, Any] = None
    ) -> Dict[str, Any]:
        """
        Predict appreciation band (LOW/MEDIUM/HIGH) with explanations
        
        Returns:
            Dict with appreciation_band, confidence_label, top_features
        """
        locality_insights = locality_insights or {}
        infrastructure_data = infrastructure_data or {}
        
        # Extract features
        features = self._extract_features(property_data, locality_insights, infrastructure_data)
        
        # Calculate appreciation score (heuristic-based)
        appreciation_score = self._calculate_appreciation_score(features)
        
        # Determine band
        if appreciation_score >= 70:
            band = 'HIGH'
        elif appreciation_score >= 40:
            band = 'MEDIUM'
        else:
            band = 'LOW'
        
        # Calculate confidence
        confidence = self._calculate_confidence(features)
        if confidence >= 70:
            confidence_label = 'HIGH'
        elif confidence >= 40:
            confidence_label = 'MEDIUM'
        else:
            confidence_label = 'LOW'
        
        # Generate feature explanations (top 3)
        top_features = self._get_top_features(features)
        
        return {
            'appreciation_band': band,
            'confidence_label': confidence_label,
            'top_features': top_features,
            'methodology_version': self.model_version,
            'model_type': 'EXPLAINABLE_BAND',
            'training_data_provenance': self.training_data_provenance,
            'model_limitations': self.model_limitations,
        }
    
    def _extract_features(
        self,
        property_data: Dict[str, Any],
        locality_insights: Dict[str, Any],
        infrastructure_data: Dict[str, Any]
    ) -> Dict[str, float]:
        """Extract features for prediction"""
        features = {}
        
        # Infrastructure features
        features['infrastructure_growth'] = 0.0
        upcoming_transport = locality_insights.get('upcoming_transport', [])
        if upcoming_transport:
            features['infrastructure_growth'] = min(len(upcoming_transport) * 20, 100)
        
        # Flood risk (negative impact)
        flood_score = locality_insights.get('flood_score', 50)
        features['flood_risk'] = -flood_score  # Negative impact
        
        # Price trend (positive if growing)
        price_trends = locality_insights.get('price_trend_data', [])
        if len(price_trends) >= 2:
            first = price_trends[0]
            last = price_trends[-1]
            growth = ((last['price_per_sqft'] - first['price_per_sqft']) / first['price_per_sqft']) * 100
            features['price_growth'] = growth
        else:
            features['price_growth'] = 0.0
        
        # Rental yield (positive if good)
        rental_yield_avg = (locality_insights.get('rental_yield_min', 0) + locality_insights.get('rental_yield_max', 0)) / 2
        features['rental_yield'] = (rental_yield_avg - 2.0) * 50  # Normalize around 2%
        
        # Safety (positive if high)
        safety = locality_insights.get('safety_indicator', 'Medium')
        safety_map = {'High': 50, 'Medium': 25, 'Low': 0}
        features['safety'] = safety_map.get(safety, 25)
        
        return features
    
    def _calculate_appreciation_score(self, features: Dict[str, float]) -> float:
        """Calculate appreciation score (0-100)"""
        # Weighted sum of features
        weights = {
            'infrastructure_growth': 0.3,
            'flood_risk': 0.2,  # Negative weight
            'price_growth': 0.3,
            'rental_yield': 0.15,
            'safety': 0.05,
        }
        
        score = 50.0  # Base score
        
        for feature_name, weight in weights.items():
            feature_value = features.get(feature_name, 0)
            score += feature_value * weight
        
        # Normalize to 0-100
        score = max(0, min(100, score))
        
        return score
    
    def _calculate_confidence(self, features: Dict[str, float]) -> float:
        """Calculate confidence level (0-100)"""
        # Confidence based on data completeness
        non_zero_features = sum(1 for v in features.values() if v != 0)
        total_features = len(features)
        
        if total_features == 0:
            return 0.0
        
        completeness = (non_zero_features / total_features) * 100
        return completeness
    
    def _get_top_features(self, features: Dict[str, float]) -> List[Dict[str, Any]]:
        """Get top 3 features with explanations"""
        # Sort features by absolute impact
        sorted_features = sorted(
            features.items(),
            key=lambda x: abs(x[1]),
            reverse=True
        )[:3]
        
        explanations = []
        for feature_name, impact in sorted_features:
            explanations.append({
                'feature_name': feature_name.replace('_', ' ').title(),
                'impact_score': round(impact, 2),
                'explanation': self._get_feature_explanation(feature_name, impact)
            })
        
        return explanations
    
    def _get_feature_explanation(self, feature_name: str, impact: float) -> str:
        """Generate human-readable feature explanation"""
        explanations = {
            'infrastructure_growth': 'Infrastructure growth' + (' boosts' if impact > 0 else ' limits') + ' appreciation potential',
            'flood_risk': 'Flood risk' + (' reduces' if impact < 0 else ' affects') + ' property value',
            'price_growth': 'Historical price growth indicates' + (' strong' if impact > 0 else ' moderate') + ' market momentum',
            'rental_yield': 'Rental yield' + (' supports' if impact > 0 else ' indicates') + ' investment viability',
            'safety': 'Safety indicators' + (' favor' if impact > 0 else ' affect') + ' long-term value',
        }
        
        base = explanations.get(feature_name, f'{feature_name.replace("_", " ")} affects appreciation')
        impact_str = f' ({abs(impact):.1f} impact)' if abs(impact) > 0 else ''
        
        return base + impact_str




