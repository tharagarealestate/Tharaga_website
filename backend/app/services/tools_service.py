"""
AI Tools Service - Financial calculators and property tools
"""
import logging
import math
from typing import Dict, List, Optional
from pydantic import BaseModel

logger = logging.getLogger(__name__)

# Request/Response Models for Tools
class ROICalculatorRequest(BaseModel):
    purchase_price: float
    rental_income_monthly: float
    maintenance_cost_monthly: float
    property_tax_yearly: float
    appreciation_rate_yearly: float = 5.0  # Default 5%
    holding_period_years: int = 5

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
    loan_amount: float
    interest_rate_yearly: float  # Annual interest rate
    tenure_months: int

class EMICalculatorResponse(BaseModel):
    emi: float
    total_payment: float
    total_interest: float
    principal_amount: float
    monthly_breakdown: List[Dict]  # First few months

class BudgetPlannerRequest(BaseModel):
    monthly_income: float
    existing_emis: float
    down_payment_available: float
    interest_rate: float = 8.5
    tenure_years: int = 20

class BudgetPlannerResponse(BaseModel):
    max_affordable_emi: float
    max_loan_amount: float
    max_property_price: float
    recommended_down_payment: float
    budget_breakdown: Dict

class LoanEligibilityRequest(BaseModel):
    monthly_income: float
    existing_obligations: float
    age: int
    employment_type: str  # salaried, self_employed
    credit_score: Optional[int] = None

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
    bedrooms: int
    sqft: float
    age_years: Optional[int] = None
    amenities: Optional[List[str]] = None

class PropertyValuationResponse(BaseModel):
    estimated_price: float
    price_per_sqft: float
    market_comparison: str  # below_market, at_market, above_market
    valuation_factors: Dict


class ToolsService:
    """Service for AI-powered real estate tools"""
    
    @staticmethod
    def calculate_roi(request: ROICalculatorRequest) -> ROICalculatorResponse:
        """Calculate ROI for property investment"""
        try:
            # Annual rental income
            annual_rental = request.rental_income_monthly * 12
            
            # Annual expenses
            annual_maintenance = request.maintenance_cost_monthly * 12
            annual_expenses = annual_maintenance + request.property_tax_yearly
            
            # Calculate for holding period
            total_rental_income = annual_rental * request.holding_period_years
            total_expenses = annual_expenses * request.holding_period_years
            
            # Appreciation calculation
            future_value = request.purchase_price * math.pow(
                1 + (request.appreciation_rate_yearly / 100),
                request.holding_period_years
            )
            appreciation_value = future_value - request.purchase_price
            
            # Net profit
            net_profit = total_rental_income - total_expenses + appreciation_value
            
            # ROI calculation
            total_investment = request.purchase_price + total_expenses
            roi_percentage = (net_profit / total_investment) * 100
            roi_yearly = roi_percentage / request.holding_period_years
            
            # Breakeven calculation
            net_annual_income = annual_rental - annual_expenses
            breakeven_years = None
            if net_annual_income > 0:
                breakeven_years = request.purchase_price / net_annual_income
            
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
            
        except Exception as e:
            logger.error(f"Error calculating ROI: {str(e)}")
            raise
    
    @staticmethod
    def calculate_emi(request: EMICalculatorRequest) -> EMICalculatorResponse:
        """Calculate EMI for home loan"""
        try:
            P = request.loan_amount
            r = request.interest_rate_yearly / 12 / 100  # Monthly interest rate
            n = request.tenure_months
            
            # EMI formula: P * r * (1+r)^n / ((1+r)^n - 1)
            if r == 0:
                emi = P / n
            else:
                emi = P * r * math.pow(1 + r, n) / (math.pow(1 + r, n) - 1)
            
            total_payment = emi * n
            total_interest = total_payment - P
            
            # Generate monthly breakdown for first 12 months
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
                    'balance': round(balance, 2)
                })
            
            return EMICalculatorResponse(
                emi=round(emi, 2),
                total_payment=round(total_payment, 2),
                total_interest=round(total_interest, 2),
                principal_amount=P,
                monthly_breakdown=monthly_breakdown
            )
            
        except Exception as e:
            logger.error(f"Error calculating EMI: {str(e)}")
            raise
    
    @staticmethod
    def plan_budget(request: BudgetPlannerRequest) -> BudgetPlannerResponse:
        """Plan home buying budget based on income"""
        try:
            # Maximum EMI (40% of monthly income minus existing obligations)
            max_affordable_emi = (request.monthly_income * 0.40) - request.existing_emis
            
            # Calculate max loan amount based on EMI
            tenure_months = request.tenure_years * 12
            r = request.interest_rate / 12 / 100
            
            # Loan amount from EMI: EMI * ((1+r)^n - 1) / (r * (1+r)^n)
            if r == 0:
                max_loan = max_affordable_emi * tenure_months
            else:
                max_loan = max_affordable_emi * (math.pow(1 + r, tenure_months) - 1) / (r * math.pow(1 + r, tenure_months))
            
            # Max property price (loan + down payment)
            max_property_price = max_loan + request.down_payment_available
            
            # Recommended down payment (20% of property value)
            recommended_down = max_property_price * 0.20
            
            # Budget breakdown
            breakdown = {\n                'monthly_income': request.monthly_income,\n                'max_emi_limit': round(request.monthly_income * 0.40, 2),\n                'existing_emis': request.existing_emis,\n                'available_for_home_emi': round(max_affordable_emi, 2),\n                'down_payment_available': request.down_payment_available,\n                'stamp_duty_estimate': round(max_property_price * 0.07, 2),  # 7% estimate\n                'registration_charges': round(max_property_price * 0.01, 2),  # 1% estimate\n                'total_upfront_needed': round(request.down_payment_available + (max_property_price * 0.08), 2)\n            }\n            \n            return BudgetPlannerResponse(\n                max_affordable_emi=round(max_affordable_emi, 2),\n                max_loan_amount=round(max_loan, 2),\n                max_property_price=round(max_property_price, 2),\n                recommended_down_payment=round(recommended_down, 2),\n                budget_breakdown=breakdown\n            )\n            \n        except Exception as e:\n            logger.error(f\"Error planning budget: {str(e)}\")\n            raise\n    \n    @staticmethod\n    def check_loan_eligibility(request: LoanEligibilityRequest) -> LoanEligibilityResponse:\n        \"\"\"Check loan eligibility and calculate max loan\"\"\"\n        try:\n            # Base eligibility multiplier\n            multiplier = 60  # Base: 60x monthly income\n            \n            # Adjust based on employment type\n            if request.employment_type == 'salaried':\n                multiplier = 70\n            elif request.employment_type == 'self_employed':\n                multiplier = 50\n            \n            # Adjust based on age (better terms for younger borrowers)\n            if request.age < 30:\n                multiplier += 10\n            elif request.age > 50:\n                multiplier -= 10\n            \n            # Adjust based on credit score\n            if request.credit_score:\n                if request.credit_score >= 750:\n                    multiplier += 15\n                elif request.credit_score >= 700:\n                    multiplier += 5\n                elif request.credit_score < 650:\n                    multiplier -= 20\n            \n            # Calculate max loan\n            net_income = request.monthly_income - request.existing_obligations\n            max_loan = net_income * multiplier\n            \n            # Eligibility check\n            eligible = (\n                request.monthly_income >= 25000 and\n                net_income >= 15000 and\n                (request.credit_score is None or request.credit_score >= 650) and\n                request.age >= 21 and\n                request.age <= 65\n            )\n            \n            # Recommended tenure based on age\n            max_tenure = 65 - request.age\n            recommended_tenure = min(20, max_tenure)\n            \n            # Calculate EMI for max loan\n            if eligible:\n                tenure_months = recommended_tenure * 12\n                interest_rate = 8.5 / 12 / 100\n                monthly_emi = max_loan * interest_rate * math.pow(1 + interest_rate, tenure_months) / (math.pow(1 + interest_rate, tenure_months) - 1)\n            else:\n                monthly_emi = 0\n            \n            # Eligibility factors\n            factors = {\n                'income_adequacy': 'Good' if request.monthly_income >= 50000 else 'Fair' if request.monthly_income >= 25000 else 'Low',\n                'obligation_ratio': round((request.existing_obligations / request.monthly_income) * 100, 2) if request.monthly_income > 0 else 0,\n                'age_factor': 'Excellent' if request.age < 35 else 'Good' if request.age < 50 else 'Fair',\n                'credit_factor': 'Excellent' if request.credit_score and request.credit_score >= 750 else 'Good' if request.credit_score and request.credit_score >= 700 else 'Unknown',\n                'employment_stability': 'High' if request.employment_type == 'salaried' else 'Medium'\n            }\n            \n            return LoanEligibilityResponse(\n                eligible=eligible,\n                max_loan_amount=round(max_loan, 2) if eligible else 0,\n                recommended_tenure_years=recommended_tenure,\n                monthly_emi=round(monthly_emi, 2) if eligible else 0,\n                eligibility_factors=factors\n            )\n            \n        except Exception as e:\n            logger.error(f\"Error checking eligibility: {str(e)}\")\n            raise\n    \n    @staticmethod\n    async def value_property(request: PropertyValuationRequest) -> PropertyValuationResponse:\n        \"\"\"AI-powered property valuation\"\"\"\n        from ..database import get_supabase\n        \n        try:\n            supabase = get_supabase()\n            \n            # Get locality data\n            locality = supabase.table('locality_insights')\\\n                .select('avg_price_sqft')\\\n                .eq('city', request.city)\\\n                .eq('locality', request.locality)\\\n                .execute()\n            \n            base_price_sqft = 7000  # Default\n            if locality.data and locality.data[0].get('avg_price_sqft'):\n                base_price_sqft = float(locality.data[0]['avg_price_sqft'])\n            \n            # Adjust for property type\n            type_multipliers = {\n                'apartment': 1.0,\n                'villa': 1.3,\n                'plot': 0.7,\n                'penthouse': 1.5,\n                'studio': 0.85\n            }\n            price_sqft = base_price_sqft * type_multipliers.get(request.property_type.lower(), 1.0)\n            \n            # Age depreciation\n            if request.age_years:\n                if request.age_years > 10:\n                    price_sqft *= 0.85\n                elif request.age_years > 5:\n                    price_sqft *= 0.92\n            \n            # Amenities bonus\n            if request.amenities:\n                premium_amenities = {'gym', 'pool', 'clubhouse', 'security', 'garden'}\n                matches = len(set([a.lower() for a in request.amenities]) & premium_amenities)\n                if matches >= 3:\n                    price_sqft *= 1.08\n                elif matches >= 1:\n                    price_sqft *= 1.03\n            \n            # Calculate estimated price\n            estimated_price = price_sqft * request.sqft\n            \n            # Market comparison\n            ratio = price_sqft / base_price_sqft\n            if ratio <= 0.95:\n                comparison = 'below_market'\n            elif ratio <= 1.05:\n                comparison = 'at_market'\n            else:\n                comparison = 'above_market'\n            \n            # Valuation factors\n            factors = {\n                'base_rate_sqft': round(base_price_sqft, 2),\n                'adjusted_rate_sqft': round(price_sqft, 2),\n                'location_factor': 'Good',\n                'property_type_adjustment': type_multipliers.get(request.property_type.lower(), 1.0),\n                'age_depreciation': f\"{request.age_years} years\" if request.age_years else 'New',\n                'amenities_bonus': f\"{len(request.amenities)} premium\" if request.amenities else 'Basic'\n            }\n            \n            return PropertyValuationResponse(\n                estimated_price=round(estimated_price, 2),\n                price_per_sqft=round(price_sqft, 2),\n                market_comparison=comparison,\n                valuation_factors=factors\n            )\n            \n        except Exception as e:\n            logger.error(f\"Error valuing property: {str(e)}\")\n            raise
