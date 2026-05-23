"""
Lead Management API Routes
"""
from fastapi import APIRouter, HTTPException, BackgroundTasks
from typing import List, Optional
from ...models.lead import (
    LeadCreate, LeadResponse, LeadScoreResponse,
    LeadTier, LeadStatus, LeadActivityCreate
)
from ...services.lead_service import LeadService
from ...services.distribution_service import DistributionService
from ...integrations import MetaCAPIService

router = APIRouter()

@router.post("/", response_model=LeadResponse, status_code=201)
async def create_lead(
    lead: LeadCreate,
    background_tasks: BackgroundTasks
):
    """
    Create new lead with automatic SmartScore AI scoring
    """
    try:
        lead_response, score_response = await LeadService.create_lead(lead)
        
        # Background tasks
        background_tasks.add_task(
            DistributionService.distribute_lead,
            lead_response.id,
            score_response.tier
        )
        
        # Send Meta CAPI event
        if lead.fbp or lead.fbc:
            user_data = {
                'email': lead.email,
                'phone': lead.phone,
                'fbp': lead.fbp,
                'fbc': lead.fbc,
                'first_name': lead.name.split()[0] if lead.name else None
            }
            background_tasks.add_task(
                MetaCAPIService.send_event,
                'Lead',
                lead_response.id,
                user_data,
                {'score': score_response.score, 'tier': score_response.tier.value}
            )
        
        return lead_response
        
    except Exception as e:
        err_str = str(e)
        # Map known errors to proper HTTP codes
        if '23505' in err_str or 'duplicate' in err_str.lower() or 'unique' in err_str.lower():
            raise HTTPException(status_code=409, detail="A lead with this phone number already exists")
        if '23502' in err_str or 'not-null' in err_str.lower():
            raise HTTPException(status_code=400, detail="Required field is missing")
        if '23514' in err_str or 'check constraint' in err_str.lower():
            raise HTTPException(status_code=400, detail="Invalid field value")
        # Generic 500
        raise HTTPException(status_code=500, detail="Failed to create lead. Please try again.")

@router.get("/{lead_id}", response_model=LeadResponse)
async def get_lead(lead_id: str):
    """Get lead by ID"""
    lead = await LeadService.get_lead(lead_id)
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    return lead

@router.get("/{lead_id}/score", response_model=LeadScoreResponse)
async def get_lead_score(lead_id: str):
    """Get detailed score breakdown for lead"""
    lead = await LeadService.get_lead(lead_id)
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    
    from ...services.scoring_service import ScoringService
    from ...database import get_supabase
    
    supabase = get_supabase()
    result = supabase.table('leads').select('*').eq('id', lead_id).execute()
    
    if not result.data:
        raise HTTPException(status_code=404, detail="Lead not found")
    
    lead_data = result.data[0]
    score, tier, factors = ScoringService.calculate_lead_score(lead_data)
    
    return LeadScoreResponse(
        lead_id=lead_id,
        score=score,
        tier=tier,
        factors=factors,
        confidence=factors.get('confidence', 0.5)
    )

@router.put("/{lead_id}/status")
async def update_lead_status(
    lead_id: str,
    status: LeadStatus,
    notes: Optional[str] = None
):
    """Update lead status"""
    success = await LeadService.update_lead_status(lead_id, status, notes)
    if not success:
        raise HTTPException(status_code=500, detail="Failed to update status")
    return {"success": True, "message": f"Status updated to {status.value}"}

@router.post("/{lead_id}/qualify")
async def qualify_lead(
    lead_id: str,
    qualification_data: dict
):
    """Mark lead as qualified with AI qualification data"""
    success = await LeadService.qualify_lead(lead_id, qualification_data)
    if not success:
        raise HTTPException(status_code=500, detail="Failed to qualify lead")
    return {"success": True, "message": "Lead qualified successfully"}

@router.get("/{lead_id}/activities")
async def get_lead_activities(lead_id: str):
    """Get activity timeline for lead"""
    activities = await LeadService.get_lead_activities(lead_id)
    return {"activities": activities}

@router.post("/{lead_id}/activities")
async def add_lead_activity(lead_id: str, activity: LeadActivityCreate):
    """Add activity to lead"""
    success = await LeadService.add_lead_activity(activity)
    if not success:
        raise HTTPException(status_code=500, detail="Failed to add activity")
    return {"success": True}

@router.get("/tier/{tier}", response_model=List[LeadResponse])
async def get_leads_by_tier(
    tier: LeadTier,
    limit: int = 50
):
    """Get leads by tier (Lion/Monkey/Dog)"""
    leads = await LeadService.get_leads_by_tier(tier, limit)
    return leads

@router.get("/", response_model=List[LeadResponse])
async def search_leads(
    status: Optional[LeadStatus] = None,
    tier: Optional[LeadTier] = None,
    source: Optional[str] = None,
    assigned_to: Optional[str] = None,
    limit: int = 50,
    offset: int = 0
):
    """Search leads with filters"""
    leads = await LeadService.search_leads(
        status=status,
        tier=tier,
        source=source,
        assigned_to=assigned_to,
        limit=limit,
        offset=offset
    )
    return leads

@router.post("/{lead_id}/reassign")
async def reassign_lead(
    lead_id: str,
    from_user: str,
    to_user: str,
    reason: str
):
    """Reassign lead to different sales person"""
    success = await DistributionService.reassign_lead(
        lead_id, from_user, to_user, reason
    )
    if not success:
        raise HTTPException(status_code=500, detail="Failed to reassign lead")
    return {"success": True}