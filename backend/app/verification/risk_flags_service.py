"""
Risk Flags Service
Automated detection of property risk flags
"""
from typing import Dict, Any, List
from datetime import datetime, date


class RiskFlagsService:
    """
    Service for detecting and managing property risk flags
    """
    
    # Risk flag definitions with actionable steps
    RISK_FLAG_DEFINITIONS = {
        'RERA_EXPIRED': {
            'title': 'RERA Registration Expired',
            'severity': 'high',
            'description': 'The RERA registration for this property has expired.',
            'actionable_steps': 'Request builder to renew RERA registration and verify expiry date.'
        },
        'RERA_MISSING': {
            'title': 'RERA Registration Not Found',
            'severity': 'high',
            'description': 'This property does not have a valid RERA registration number.',
            'actionable_steps': 'Request RERA registration number from builder. Manual verification recommended.'
        },
        'EC_MISSING': {
            'title': 'Encumbrance Certificate Missing',
            'severity': 'medium',
            'description': 'Encumbrance Certificate (EC) has not been uploaded for verification.',
            'actionable_steps': 'Request EC document from builder. Verify property has no legal encumbrances.'
        },
        'OC_MISSING': {
            'title': 'Occupancy Certificate Missing',
            'severity': 'high',
            'description': 'Occupancy Certificate (OC) has not been provided for this property.',
            'actionable_steps': 'Request OC from builder. Property may not be legally ready for occupation.'
        },
        'CC_MISSING': {
            'title': 'Completion Certificate Missing',
            'severity': 'medium',
            'description': 'Completion Certificate (CC) has not been uploaded.',
            'actionable_steps': 'Request CC document from builder to verify construction completion.'
        },
        'HIGH_FLOOD_RISK': {
            'title': 'High Flood Risk Area',
            'severity': 'high',
            'description': 'This property is located in a high flood risk zone based on government data.',
            'actionable_steps': 'Review flood risk assessment. Consider insurance coverage. Verify builder has taken necessary precautions.'
        },
        'SEISMIC_RISK': {
            'title': 'Seismic Risk Zone',
            'severity': 'medium',
            'description': 'Property is located in a seismic zone requiring earthquake-resistant construction.',
            'actionable_steps': 'Verify building meets seismic zone construction standards. Review structural certificates.'
        },
        'LEGAL_DISPUTE': {
            'title': 'Potential Legal Dispute',
            'severity': 'high',
            'description': 'Property may have ongoing legal disputes or encumbrances.',
            'actionable_steps': 'Conduct thorough legal title search. Consult property lawyer before purchase.'
        },
    }
    
    def __init__(self, config: Dict[str, Any]):
        self.config = config
    
    async def detect_risk_flags(
        self,
        property_id: str,
        property_data: Dict[str, Any],
        rera_snapshot: Dict[str, Any] = None,
        documents: List[Dict[str, Any]] = None,
        chennai_insights: Dict[str, Any] = None
    ) -> List[Dict[str, Any]]:
        """
        Detect risk flags for a property based on available data
        Returns list of risk flag objects
        """
        flags = []
        
        documents = documents or []
        chennai_insights = chennai_insights or {}
        
        # Check RERA status
        if not rera_snapshot:
            flags.append({
                'flag_type': 'RERA_MISSING',
                'severity': 'high',
                'title': self.RISK_FLAG_DEFINITIONS['RERA_MISSING']['title'],
                'description': self.RISK_FLAG_DEFINITIONS['RERA_MISSING']['description'],
                'actionable_steps': self.RISK_FLAG_DEFINITIONS['RERA_MISSING']['actionable_steps'],
                'source': 'AUTOMATED'
            })
        else:
            # Check if RERA expired
            expiry_date = rera_snapshot.get('expiry_date')
            if expiry_date:
                try:
                    if isinstance(expiry_date, str):
                        expiry = datetime.fromisoformat(expiry_date.replace('Z', '+00:00')).date()
                    else:
                        expiry = expiry_date if isinstance(expiry_date, date) else date.today()
                    
                    if expiry < date.today():
                        flags.append({
                            'flag_type': 'RERA_EXPIRED',
                            'severity': 'high',
                            'title': self.RISK_FLAG_DEFINITIONS['RERA_EXPIRED']['title'],
                            'description': self.RISK_FLAG_DEFINITIONS['RERA_EXPIRED']['description'],
                            'actionable_steps': self.RISK_FLAG_DEFINITIONS['RERA_EXPIRED']['actionable_steps'],
                            'source': 'AUTOMATED'
                        })
                except:
                    pass  # Ignore date parsing errors
        
        # Check required documents
        doc_types = {doc.get('document_type') for doc in documents}
        
        if 'EC' not in doc_types:
            flags.append({
                'flag_type': 'EC_MISSING',
                'severity': 'medium',
                'title': self.RISK_FLAG_DEFINITIONS['EC_MISSING']['title'],
                'description': self.RISK_FLAG_DEFINITIONS['EC_MISSING']['description'],
                'actionable_steps': self.RISK_FLAG_DEFINITIONS['EC_MISSING']['actionable_steps'],
                'source': 'AUTOMATED'
            })
        
        if 'OC' not in doc_types:
            flags.append({
                'flag_type': 'OC_MISSING',
                'severity': 'high',
                'title': self.RISK_FLAG_DEFINITIONS['OC_MISSING']['title'],
                'description': self.RISK_FLAG_DEFINITIONS['OC_MISSING']['description'],
                'actionable_steps': self.RISK_FLAG_DEFINITIONS['OC_MISSING']['actionable_steps'],
                'source': 'AUTOMATED'
            })
        
        if 'CC' not in doc_types:
            flags.append({
                'flag_type': 'CC_MISSING',
                'severity': 'medium',
                'title': self.RISK_FLAG_DEFINITIONS['CC_MISSING']['title'],
                'description': self.RISK_FLAG_DEFINITIONS['CC_MISSING']['description'],
                'actionable_steps': self.RISK_FLAG_DEFINITIONS['CC_MISSING']['actionable_steps'],
                'source': 'AUTOMATED'
            })
        
        # Check flood risk
        flood_score = chennai_insights.get('flood_score')
        if flood_score and flood_score >= 70:
            flags.append({
                'flag_type': 'HIGH_FLOOD_RISK',
                'severity': 'high',
                'title': self.RISK_FLAG_DEFINITIONS['HIGH_FLOOD_RISK']['title'],
                'description': self.RISK_FLAG_DEFINITIONS['HIGH_FLOOD_RISK']['description'],
                'actionable_steps': self.RISK_FLAG_DEFINITIONS['HIGH_FLOOD_RISK']['actionable_steps'],
                'source': 'AUTOMATED'
            })
        
        # Check seismic risk
        safety_indicator = chennai_insights.get('safety_indicator')
        if safety_indicator == 'Low':
            flags.append({
                'flag_type': 'SEISMIC_RISK',
                'severity': 'medium',
                'title': self.RISK_FLAG_DEFINITIONS['SEISMIC_RISK']['title'],
                'description': self.RISK_FLAG_DEFINITIONS['SEISMIC_RISK']['description'],
                'actionable_steps': self.RISK_FLAG_DEFINITIONS['SEISMIC_RISK']['actionable_steps'],
                'source': 'AUTOMATED'
            })
        
        return flags











