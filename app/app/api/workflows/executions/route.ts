// =============================================
// WORKFLOW EXECUTIONS LIST API
// GET /api/workflows/executions?workflow_id=xxx&status=xxx
// =============================================
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const workflow_id = searchParams.get('workflow_id');
    const status = searchParams.get('status');
    const lead_id = searchParams.get('lead_id');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    const cookieStore = cookies();
    const supabase = createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Build query
    let query = supabase
      .from('workflow_executions')
      .select(`
        *,
        workflow_templates!inner(
          id,
          name,
          category,
          builder_id
        ),
        leads!inner(
          id,
          profiles!buyer_id(
            full_name,
            email,
            phone
          ),
          properties!inner(
            title,
            location
          )
        ),
        workflow_actions(
          id,
          action_type,
          status,
          scheduled_for
        )
      `)
      .eq('workflow_templates.builder_id', user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Apply filters
    if (workflow_id) {
      query = query.eq('workflow_template_id', workflow_id);
    }

    if (status) {
      query = query.eq('status', status);
    }

    if (lead_id) {
      query = query.eq('lead_id', parseInt(lead_id)); // Convert to int for BIGINT
    }

    const { data: executions, error } = await query;

    if (error) throw error;

    return NextResponse.json({
      success: true,
      executions: executions || [],
      pagination: {
        total: executions?.length || 0,
        limit,
        offset,
        has_more: (executions?.length || 0) === limit
      }
    });
  } catch (error) {
    console.error('Executions fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch executions', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

