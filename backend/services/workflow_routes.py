# =============================================
# WORKFLOW ENGINE API ROUTES
# =============================================
from fastapi import APIRouter, HTTPException, BackgroundTasks
from typing import Dict, Any
import logging

from services.workflow_engine import (
    workflow_engine,
    ExecuteWorkflowRequest,
    get_supabase_client,
    TriggerType
)
from datetime import datetime

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/workflows", tags=["Workflows"])

@router.post("/execute")
async def execute_workflow(request: ExecuteWorkflowRequest):
    """
    Execute a workflow for a lead
    """
    try:
        result = await workflow_engine.execute_workflow(
            workflow_id=request.workflow_id,
            lead_id=request.lead_id,
            trigger_type=request.trigger_type.value,
            trigger_payload=request.trigger_payload,
            force_execute=request.force_execute
        )
        return result
    except Exception as e:
        logger.error(f"Workflow execution failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Execution failed: {str(e)}")

@router.post("/process-pending")
async def process_pending_actions(background_tasks: BackgroundTasks):
    """
    Process all pending workflow actions (called by cron)
    """
    try:
        supabase = get_supabase_client()
        
        # Fetch pending actions due now
        actions_result = supabase.table('workflow_actions').select(
            '*, workflow_executions!inner(*), leads:lead_id(*)'
        ).eq('status', 'pending').lte(
            'scheduled_for', datetime.now().isoformat()
        ).limit(100).execute()
        
        if not actions_result.data or len(actions_result.data) == 0:
            return {"status": "no_pending_actions"}
        
        # Group by execution
        executions = {}
        for action in actions_result.data:
            exec_id = action['execution_id']
            exec_data = action.get('workflow_executions', {})
            lead_data = exec_data.get('leads', {})
            
            if exec_id not in executions:
                executions[exec_id] = {
                    'execution': exec_data,
                    'lead_data': lead_data,
                    'actions': []
                }
            executions[exec_id]['actions'].append(action)
        
        # Process each execution
        for exec_id, data in executions.items():
            background_tasks.add_task(
                workflow_engine._process_actions,
                exec_id,
                data['lead_data']
            )
        
        return {
            "status": "processing",
            "executions_queued": len(executions),
            "actions_total": len(actions_result.data)
        }
        
    except Exception as e:
        logger.error(f"Pending actions processing failed: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{workflow_id}/stats")
async def get_workflow_stats(workflow_id: str):
    """
    Get workflow execution statistics
    """
    try:
        supabase = get_supabase_client()
        
        # Fetch workflow
        workflow = supabase.table('workflow_templates').select(
            '*'
        ).eq('id', workflow_id).single().execute()
        
        if not workflow.data:
            raise HTTPException(status_code=404, detail="Workflow not found")
        
        # Fetch recent executions
        executions = supabase.table('workflow_executions').select(
            'status, created_at, execution_time_ms'
        ).eq('workflow_template_id', workflow_id).order(
            'created_at', desc=True
        ).limit(100).execute()
        
        # Calculate stats
        executions_data = executions.data or []
        total = len(executions_data)
        completed = len([e for e in executions_data if e['status'] == 'completed'])
        failed = len([e for e in executions_data if e['status'] == 'failed'])
        
        return {
            "workflow_id": workflow_id,
            "total_executions": total,
            "success_rate": (completed / total * 100) if total > 0 else 0,
            "completed": completed,
            "failed": failed,
            "avg_execution_time_ms": workflow.data.get('avg_execution_time_ms', 0)
        }
        
    except Exception as e:
        logger.error(f"Stats fetch failed: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "Workflow Engine",
        "version": "1.0"
    }

