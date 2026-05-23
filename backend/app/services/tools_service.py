"""
AI Tools Service - Financial calculators and property tools
"""
import logging
import math
from typing import Dict, List, Optional
from pydantic import BaseModel, Field

logger = logging.getLogger(__name__)


# ============================================
# REQUEST/RESPONSE MODELS
# ============================================
class ROICalculatorRequest(BaseModel):
    purchase_price: float = Field(..., gt=0)
    rental_income_monthly: float = Field(..., ge=0)
    maintenance_cost_monthly: float = Field(default=0, ge=0)
    property_tax_yearly: float = Field(default=0, ge=0)
    appreciation_rate_yearly: float = Field(default=5.0)
    holding_period_years: int = Field(default=5, ge=1, le=50)


class ROICalculatorResponse(BaseModel):
    total_investment: float
    total_rental_income: float
    total_expenses: float
    appreciation_value: float
    net_profit: float
    roi_percentage: float
    roi_yearly_percentage: float
    breakeven_years: Optional[float]


class EMICalculatorRequest(BaseModel):
    loan_amount: float = Field(..., gt=0)
    interest_rate_yearly: float = Field(..., gt=0, le=30)
    tenure_months: int = Field(..., ge=1, le=480)


class EMICalculatorResponse(BaseModel):
    emi: float
    total_payment: float
    total_interest: float
    principal_amount: float
    monthly_breakdown: List[Dict]


class BudgetPlannerRequest(BaseModel):
    monthly_income: float = Field(..., gt=0)
    existing_emis: float = Field(default=0, ge=0)
    down_payment_available: float = Field(default=0, ge=0)
    interest_rate: float = Field(default=8.5)
    tenure_years: int = Field(default=20, ge=1, le=30)


class BudgetPlannerResponse(BaseModel):
    max_affordable_emi: float
    max_loan_amount: float
    max_property_price: float
    recommended_down_payment: float
    budget_breakdown: Dict


class LoanEligibilityRequest(BaseModel):
    monthly_income: float = Field(..., gt=0)
    existing_obligations: float = Field(default=0, ge=0)
    age: int = Field(..., ge=18, le=70)
    employment_type: str = Field(default="salaried")
    credit_score: Optional[int] = Field(default=None, ge=300, le=900)


class LoanEligibilityResponse(BaseModel):
    eligible: bool
    max_loan_amount: float
    recommended_tenure_years: int
    monthly_emi: float
    eligibility_factors: Dict


class PropertyValuationRequest(BaseModel):
    city: str
    locality: str
    property_type: str
    bedrooms: int = Field(..., ge=0, le=10)
    sqft: float = Field(..., gt=0)
    age_years: Optional[int] = Field(default=0, ge=0)
    amenities: Optional[List[str]] = None


class PropertyValuationResponse(BaseModel):
    estimated_price: float
    price_per_sqft: float
    market_comparison: str
    valuation_factors: Dict


# ============================================
# SERVICE IMPLEMENTATION
# ============================================
class ToolsService:
    """Service for AI-powered real estate tools"""
    
    @staticmethod
    def calculate_roi(request: ROICalculatorRequest) -> ROICalculatorResponse:
        """Calculate ROI for property investment"""
        annual_rental = request.rental_income_monthly * 12
        annual_expenses = (request.maintenance_cost_monthly * 12) + request.property_tax_yearly
        
        total_rental_income = annual_rental * request.holding_period_years
        total_expenses = annual_expenses * request.holding_period_years
        
        future_value = request.purchase_price * math.pow(
            1 + (request.appreciation_rate_yearly / 100),
            request.holding_period_years
        )
        appreciation_value = future_value - request.purchase_price
        
        net_profit = total_rental_income - total_expenses + appreciation_value
        total_investment = request.purchase_price + total_expenses
        roi_percentage = (net_profit / total_investment) * 100 if total_investment > 0 else 0
        roi_yearly = roi_percentage / request.holding_period_years if request.holding_period_years > 0 else 0
        
        net_annual_income = annual_rental - annual_expenses
        breakeven_years = (request.purchase_price / net_annual_income) if net_annual_income > 0 else None
        
        return ROICalculatorResponse(
            total_investment=round(total_investment, 2),
            total_rental_income=round(total_rental_income, 2),
            total_expenses=round(total_expenses, 2),
            appreciation_value=round(appreciation_value, 2),
            net_profit=round(net_profit, 2),
            roi_percentage=round(roi_percentage, 2),
            roi_yearly_percentage=round(roi_yearly, 2),
            breakeven_years=round(breakeven_years, 2) if breakeven_years else None
        )
    
    @staticmethod
    def calculate_emi(request: EMICalculatorRequest) -> EMICalculatorResponse:
        """Calculate EMI for home loan"""
        P = request.loan_amount
        r = request.interest_rate_yearly / 12 / 100
        n = request.tenure_months
        
        if r == 0:
            emi = P / n
        else:
            emi = P * r * math.pow(1 + r, n) / (math.pow(1 + r, n) - 1)
        
        total_payment = emi * n
        total_interest = total_payment - P
        
        monthly_breakdown = []
        balance = P
        
        for month in range(min(12, n)):
            interest_component = balance * r
            principal_component = emi - interest_component
            balance -= principal_component
            
            monthly_breakdown.append({
                'month': month + 1,
                'emi': round(emi, 2),
                'principal': round(principal_component, 2),
                'interest': round(interest_component, 2),
                'balance': round(max(0, balance), 2)
            })
        
        return EMICalculatorResponse(
            emi=round(emi, 2),
            total_payment=round(total_payment, 2),
            total_interest=round(total_interest, 2),
            principal_amount=P,
            monthly_breakdown=monthly_breakdown
        )
    
    @staticmethod
    def plan_budget(request: BudgetPlannerRequest) -> BudgetPlannerResponse:
        """Plan home buying budget based on income"""
        max_affordable_emi = max(0, (request.monthly_income * 0.40) - request.existing_emis)
        
        tenure_months = request.tenure_years * 12
        r = request.interest_rate / 12 / 100
        
        if r == 0:
            max_loan = max_affordable_emi * tenure_months
        else:
            max_loan = max_affordable_emi * (math.pow(1 + r, tenure_months) - 1) / (r * math.pow(1 + r, tenure_months))
        
        max_property_price = max_loan + request.down_payment_available
        recommended_down = max_property_price * 0.20
        
        breakdown = {
            'monthly_income': request.monthly_income,
            'max_emi_limit_40pct': round(request.monthly_income * 0.40, 2),
            'existing_emis': request.existing_emis,
            'available_for_home_emi': round(max_affordable_emi, 2),
            'down_payment_available': request.down_payment_available,
            'stamp_duty_estimate_7pct': round(max_property_price * 0.07, 2),
            'registration_charges_1pct': round(max_property_price * 0.01, 2),
            'total_upfront_needed': round(request.down_payment_available + (max_property_price * 0.08), 2)
        }
        
        return BudgetPlannerResponse(
            max_affordable_emi=round(max_affordable_emi, 2),
            max_loan_amount=round(max_loan, 2),
            max_property_price=round(max_property_price, 2),
            recommended_down_payment=round(recommended_down, 2),
            budget_breakdown=breakdown
        )
    
    @staticmethod
    def check_loan_eligibility(request: LoanEligibilityRequest) -> LoanEligibilityResponse:
        """Check loan eligibility and calculate max loan"""
        multiplier = 60
        
        if request.employment_type == 'salaried':
            multiplier = 70
        elif request.employment_type == 'self_employed':
            multiplier = 50
        
        if request.age < 30:
            multiplier += 10
        elif request.age > 50:
            multiplier -= 10
        
        if request.credit_score:
            if request.credit_score >= 750:
                multiplier += 15
            elif request.credit_score >= 700:
                multiplier += 5
            elif request.credit_score < 650:
                multiplier -= 20
        
        net_income = request.monthly_income - request.existing_obligations
        max_loan = max(0, net_income * multiplier)
        
        eligible = (
            request.monthly_income >= 25000 and
            net_income >= 15000 and
            (request.credit_score is None or request.credit_score >= 650) and
            21 <= request.age <= 65
        )
        
        max_tenure = max(5, 65 - request.age)
        recommended_tenure = min(20, max_tenure)
        
        monthly_emi = 0
        if eligible and max_loan > 0:
            tenure_months = recommended_tenure * 12
            interest_rate = 8.5 / 12 / 100
            monthly_emi = max_loan * interest_rate * math.pow(1 + interest_rate, tenure_months) / (math.pow(1 + interest_rate, tenure_months) - 1)
        
        factors = {
            'income_adequacy': 'Good' if request.monthly_income >= 50000 else 'Fair' if request.monthly_income >= 25000 else 'Low',
            'obligation_ratio_pct': round((request.existing_obligations / request.monthly_income) * 100, 2) if request.monthly_income > 0 else 0,
            'age_factor': 'Excellent' if request.age < 35 else 'Good' if request.age < 50 else 'Fair',
            'credit_factor': 'Excellent' if request.credit_score and request.credit_score >= 750 else 'Good' if request.credit_score and request.credit_score >= 700 else 'Unknown',
            'employment_stability': 'High' if request.employment_type == 'salaried' else 'Medium'
        }
        
        return LoanEligibilityResponse(
            eligible=eligible,
            max_loan_amount=round(max_loan, 2) if eligible else 0,
            recommended_tenure_years=recommended_tenure,
            monthly_emi=round(monthly_emi, 2) if eligible else 0,
            eligibility_factors=factors
        )
    
    @staticmethod
    async def value_property(request: PropertyValuationRequest) -> PropertyValuationResponse:
        """AI-powered property valuation"""
        from ..database import get_supabase
        from .property_service import PropertyService
        
        # Use property service's locality fallback for resilience
        locality_data = await PropertyService._get_locality_data(request.city, request.locality)
        
        base_price_sqft = 7000
        if locality_data and locality_data.get('avg_price_sqft'):
            base_price_sqft = float(locality_data['avg_price_sqft'])
        
        type_multipliers = {
            'apartment': 1.0,
            'villa': 1.3,
            'plot': 0.7,
            'penthouse': 1.5,
            'studio': 0.85
        }
        price_sqft = base_price_sqft * type_multipliers.get(request.property_type.lower(), 1.0)
        
        if request.age_years and request.age_years > 0:
            if request.age_years > 10:
                price_sqft *= 0.85
            elif request.age_years > 5:
                price_sqft *= 0.92
        
        if request.amenities:
            premium_amenities = {'gym', 'pool', 'clubhouse', 'security', 'garden'}
            matches = len(set([a.lower() for a in request.amenities]) & premium_amenities)
            if matches >= 3:
                price_sqft *= 1.08
            elif matches >= 1:
                price_sqft *= 1.03
        
        estimated_price = price_sqft * request.sqft
        
        ratio = price_sqft / base_price_sqft if base_price_sqft > 0 else 1
        if ratio <= 0.95:
            comparison = 'below_market'
        elif ratio <= 1.05:
            comparison = 'at_market'
        else:
            comparison = 'above_market'
        
        factors = {
            'base_rate_sqft': round(base_price_sqft, 2),
            'adjusted_rate_sqft': round(price_sqft, 2),
            'location_factor': 'Good',
            'property_type_adjustment': type_multipliers.get(request.property_type.lower(), 1.0),
            'age_depreciation': f"{request.age_years} years" if request.age_years else 'New',
            'amenities_bonus': f"{len(request.amenities)} premium" if request.amenities else 'Basic'
        }
        
        return PropertyValuationResponse(
            estimated_price=round(estimated_price, 2),
            price_per_sqft=round(price_sqft, 2),
            market_comparison=comparison,
            valuation_factors=factors
        )
