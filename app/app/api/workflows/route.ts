// =============================================
// WORKFLOW TEMPLATES API ROUTE
// GET /api/workflows - List workflows
// POST /api/workflows - Create workflow
// =============================================
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';

// =============================================
// TYPES
// =============================================
interface WorkflowTemplate {
  name: string;
  description?: string;
  category: 'lead_nurture' | 'follow_up' | 'engagement' | 'conversion';
  trigger_type: 'lead_created' | 'score_change' | 'behavior' | 'time_based' | 'manual';
  trigger_config?: Record<string, any>;
  actions: Array<{
    type: 'send_whatsapp' | 'send_sms' | 'send_email' | 'update_lead' | 'create_task';
    delay_minutes: number;
    message_template_id?: string;
    email_template_id?: string;
    config?: Record<string, any>;
  }>;
  conditions?: Array<{
    field: string;
    operator: '=' | '!=' | '>' | '>=' | '<' | '<=' | 'in' | 'not_in' | 'contains';
    value: any;
  }>;
  is_active?: boolean;
  priority?: number;
}

// =============================================
// GET - List Workflows
// =============================================
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const is_active = searchParams.get('is_active');

    const cookieStore = cookies();
    const supabase = createClient();

    // Verify authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's builder_id (direct auth.uid() since workflow_templates uses builder_id)
    // Build query
    let query = supabase
      .from('workflow_templates')
      .select('*')
      .eq('builder_id', user.id)
      .order('created_at', { ascending: false });

    // Apply filters
    if (category) {
      query = query.eq('category', category);
    }

    if (is_active !== null) {
      query = query.eq('is_active', is_active === 'true');
    }

    const { data: workflows, error } = await query;

    if (error) throw error;

    return NextResponse.json({
      success: true,
      workflows: workflows || [],
      total: workflows?.length || 0
    });
  } catch (error) {
    console.error('Workflows fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch workflows' },
      { status: 500 }
    );
  }
}

// =============================================
// POST - Create Workflow
// =============================================
export async function POST(request: NextRequest) {
  try {
    const body: WorkflowTemplate = await request.json();

    // Validate required fields
    if (!body.name || !body.trigger_type || !body.actions || body.actions.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields: name, trigger_type, and actions are required' },
        { status: 400 }
      );
    }

    const cookieStore = cookies();
    const supabase = createClient();

    // Verify authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Validate actions
    for (const action of body.actions) {
      if (!action.type) {
        return NextResponse.json(
          { error: 'Invalid action configuration' },
          { status: 400 }
        );
      }

      // Validate message template exists for messaging actions
      if (['send_whatsapp', 'send_sms'].includes(action.type)) {
        if (!action.message_template_id) {
          return NextResponse.json(
            { error: `Message template required for ${action.type}` },
            { status: 400 }
          );
        }

        const { data: template } = await supabase
          .from('message_templates')
          .select('id')
          .eq('id', action.message_template_id)
          .eq('builder_id', user.id)
          .single();

        if (!template) {
          return NextResponse.json(
            { error: 'Message template not found or access denied' },
            { status: 404 }
          );
        }
      }
    }

    // Create workflow
    const { data: workflow, error: insertError } = await supabase
      .from('workflow_templates')
      .insert({
        builder_id: user.id,
        name: body.name,
        description: body.description,
        category: body.category,
        trigger_type: body.trigger_type,
        trigger_config: body.trigger_config || {},
        actions: body.actions,
        conditions: body.conditions || [],
        is_active: body.is_active ?? true,
        priority: body.priority || 5,
        created_by: user.id
      })
      .select()
      .single();

    if (insertError) throw insertError;

    // Log activity
    await supabase.from('activity_logs').insert({
      user_id: user.id,
      action: 'create_workflow',
      resource_type: 'workflow_templates',
      resource_id: workflow.id,
      metadata: { workflow_name: workflow.name }
    }).catch(err => console.error('Activity log failed:', err));

    return NextResponse.json({
      success: true,
      workflow,
      message: 'Workflow created successfully'
    }, { status: 201 });
  } catch (error) {
    console.error('Workflow creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create workflow', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

