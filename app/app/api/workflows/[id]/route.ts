// =============================================
// INDIVIDUAL WORKFLOW API ROUTE
// GET /api/workflows/[id] - Get workflow
// PATCH /api/workflows/[id] - Update workflow
// DELETE /api/workflows/[id] - Delete workflow
// =============================================
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';

// =============================================
// GET - Get Workflow
// =============================================
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const workflowId = params.id;
    const cookieStore = cookies();
    const supabase = createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch workflow with executions
    const { data: workflow, error } = await supabase
      .from('workflow_templates')
      .select(`
        *,
        workflow_executions (
          id,
          status,
          created_at,
          completed_at
        )
      `)
      .eq('id', workflowId)
      .single();

    if (error || !workflow) {
      return NextResponse.json(
        { error: 'Workflow not found' },
        { status: 404 }
      );
    }

    // Verify access (workflow uses builder_id)
    if (workflow.builder_id !== user.id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    return NextResponse.json({
      success: true,
      workflow
    });
  } catch (error) {
    console.error('Workflow fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch workflow' },
      { status: 500 }
    );
  }
}

// =============================================
// PATCH - Update Workflow
// =============================================
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const workflowId = params.id;
    const updates = await request.json();
    const cookieStore = cookies();
    const supabase = createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch existing workflow
    const { data: existingWorkflow } = await supabase
      .from('workflow_templates')
      .select('builder_id')
      .eq('id', workflowId)
      .single();

    if (!existingWorkflow) {
      return NextResponse.json(
        { error: 'Workflow not found' },
        { status: 404 }
      );
    }

    // Verify access
    if (existingWorkflow.builder_id !== user.id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Update workflow
    const { data: workflow, error: updateError } = await supabase
      .from('workflow_templates')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', workflowId)
      .select()
      .single();

    if (updateError) throw updateError;

    // Log activity
    await supabase.from('activity_logs').insert({
      user_id: user.id,
      action: 'update_workflow',
      resource_type: 'workflow_templates',
      resource_id: workflowId,
      metadata: { updated_fields: Object.keys(updates) }
    }).catch(err => console.error('Activity log failed:', err));

    return NextResponse.json({
      success: true,
      workflow,
      message: 'Workflow updated successfully'
    });
  } catch (error) {
    console.error('Workflow update error:', error);
    return NextResponse.json(
      { error: 'Failed to update workflow', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// =============================================
// DELETE - Delete Workflow
// =============================================
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const workflowId = params.id;
    const cookieStore = cookies();
    const supabase = createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch workflow
    const { data: workflow } = await supabase
      .from('workflow_templates')
      .select('builder_id, name')
      .eq('id', workflowId)
      .single();

    if (!workflow) {
      return NextResponse.json(
        { error: 'Workflow not found' },
        { status: 404 }
      );
    }

    // Verify access
    if (workflow.builder_id !== user.id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Delete workflow (cascade will handle related records)
    const { error: deleteError } = await supabase
      .from('workflow_templates')
      .delete()
      .eq('id', workflowId);

    if (deleteError) throw deleteError;

    // Log activity
    await supabase.from('activity_logs').insert({
      user_id: user.id,
      action: 'delete_workflow',
      resource_type: 'workflow_templates',
      resource_id: workflowId,
      metadata: { workflow_name: workflow.name }
    }).catch(err => console.error('Activity log failed:', err));

    return NextResponse.json({
      success: true,
      message: 'Workflow deleted successfully'
    });
  } catch (error) {
    console.error('Workflow deletion error:', error);
    return NextResponse.json(
      { error: 'Failed to delete workflow', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

