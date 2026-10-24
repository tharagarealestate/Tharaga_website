// =============================================
// WORKFLOW EXECUTION API ROUTE
// POST /api/workflows/[id]/execute
// =============================================
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const workflowId = params.id;
    const { lead_ids, force_execute = false } = await request.json();

    if (!lead_ids || !Array.isArray(lead_ids) || lead_ids.length === 0) {
      return NextResponse.json(
        { error: 'lead_ids array is required' },
        { status: 400 }
      );
    }

    const cookieStore = cookies();
    const supabase = createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify workflow access
    const { data: workflow } = await supabase
      .from('workflow_templates')
      .select('builder_id, name, is_active')
      .eq('id', workflowId)
      .single();

    if (!workflow) {
      return NextResponse.json(
        { error: 'Workflow not found' },
        { status: 404 }
      );
    }

    if (workflow.builder_id !== user.id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    if (!workflow.is_active && !force_execute) {
      return NextResponse.json(
        { error: 'Workflow is inactive. Set force_execute=true to override.' },
        { status: 400 }
      );
    }

    // Call workflow engine service
    const WORKFLOW_ENGINE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    
    const executions = [];
    const errors = [];

    for (const lead_id of lead_ids) {
      try {
        const response = await fetch(`${WORKFLOW_ENGINE_URL}/api/workflows/execute`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            workflow_id: workflowId,
            lead_id: parseInt(lead_id), // Convert to int for BIGINT
            trigger_type: 'manual',
            trigger_payload: {
              executed_by: user.id,
              executed_at: new Date().toISOString()
            },
            force_execute
          })
        });

        const data = await response.json();

        if (response.ok) {
          executions.push({
            lead_id,
            execution_id: data.execution_id,
            status: 'queued'
          });
        } else {
          errors.push({
            lead_id,
            error: data.error || data.detail || 'Execution failed'
          });
        }
      } catch (err) {
        errors.push({
          lead_id,
          error: err instanceof Error ? err.message : 'Unknown error'
        });
      }
    }

    // Log activity
    await supabase.from('activity_logs').insert({
      user_id: user.id,
      action: 'execute_workflow',
      resource_type: 'workflow_templates',
      resource_id: workflowId,
      metadata: {
        workflow_name: workflow.name,
        lead_count: lead_ids.length,
        successful: executions.length,
        failed: errors.length
      }
    }).catch(err => console.error('Activity log failed:', err));

    return NextResponse.json({
      success: true,
      executions,
      errors,
      summary: {
        total: lead_ids.length,
        successful: executions.length,
        failed: errors.length
      }
    });
  } catch (error) {
    console.error('Workflow execution error:', error);
    return NextResponse.json(
      { error: 'Failed to execute workflow', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

