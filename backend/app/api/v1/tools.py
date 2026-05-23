"""
AI Tools API Routes - Calculators
"""
from fastapi import APIRouter, HTTPException
from ...services.tools_service import (
    ToolsService,
    ROICalculatorRequest, ROICalculatorResponse,
    EMICalculatorRequest, EMICalculatorResponse,
    BudgetPlannerRequest, BudgetPlannerResponse,
    LoanEligibilityRequest, LoanEligibilityResponse,
    PropertyValuationRequest, PropertyValuationResponse
)
from ...services.analytics_service import AnalyticsService

router = APIRouter()

@router.post("/roi-calculator", response_model=ROICalculatorResponse)
async def calculate_roi(request: ROICalculatorRequest):
    """Calculate ROI for property investment"""
    try:
        result = ToolsService.calculate_roi(request)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/emi-calculator", response_model=EMICalculatorResponse)
async def calculate_emi(request: EMICalculatorRequest):
    """Calculate EMI for home loan"""
    try:
        result = ToolsService.calculate_emi(request)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/budget-planner", response_model=BudgetPlannerResponse)
async def plan_budget(request: BudgetPlannerRequest):
    """Plan home buying budget"""
    try:
        result = ToolsService.plan_budget(request)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/loan-eligibility", response_model=LoanEligibilityResponse)
async def check_eligibility(request: LoanEligibilityRequest):
    """Check loan eligibility"""
    try:
        result = ToolsService.check_loan_eligibility(request)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/property-valuation", response_model=PropertyValuationResponse)
async def value_property(request: PropertyValuationRequest):
    """AI-powered property valuation"""
    try:
        result = await ToolsService.value_property(request)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/locality-insights")
async def get_locality_tool(city: str, locality: str):
    """Get locality insights (alternative endpoint for tools)"""
    try:
        insights = await AnalyticsService.get_locality_insights(city, locality)
        if not insights:
            raise HTTPException(status_code=404, detail="Locality not found")
        return insights
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))