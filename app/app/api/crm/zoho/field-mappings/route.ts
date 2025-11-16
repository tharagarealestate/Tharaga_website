// =============================================
// ZOHO FIELD MAPPINGS
// Configure how fields sync between systems
// =============================================
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

// =============================================
// GET - List field mappings
// =============================================
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized', success: false },
        { status: 401 }
      );
    }

    // Get integration
    const { data: integration } = await supabase
      .from('integrations')
      .select('id')
      .eq('builder_id', user.id)
      .eq('integration_type', 'crm')
      .eq('provider', 'zoho')
      .single();

    if (!integration) {
      return NextResponse.json(
        { error: 'Zoho CRM not connected', success: false },
        { status: 404 }
      );
    }

    // Get field mappings
    const { data: mappings, error } = await supabase
      .from('crm_field_mappings')
      .select('*')
      .eq('integration_id', integration.id)
      .order('created_at', { ascending: true });

    if (error) throw error;

    return NextResponse.json({ 
      mappings: mappings || [],
      total: mappings?.length || 0,
      success: true,
    });
  } catch (error: any) {
    console.error('Error fetching field mappings:', error);
    return NextResponse.json(
      { 
        error: error.message || 'Failed to fetch field mappings',
        success: false,
      },
      { status: 500 }
    );
  }
}

// =============================================
// POST - Create field mapping
// =============================================
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized', success: false },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      tharaga_field,
      crm_field,
      transform_type = 'direct',
      transform_config,
      transform_rule,
      sync_direction = 'bidirectional',
    } = body;

    // Validate required fields
    if (!tharaga_field || !crm_field) {
      return NextResponse.json(
        { 
          error: 'Missing required fields: tharaga_field, crm_field',
          success: false,
        },
        { status: 400 }
      );
    }

    // Validate sync_direction
    if (!['to_crm', 'from_crm', 'bidirectional'].includes(sync_direction)) {
      return NextResponse.json(
        { 
          error: 'Invalid sync_direction. Must be: to_crm, from_crm, or bidirectional',
          success: false,
        },
        { status: 400 }
      );
    }

    // Validate transform_type
    if (!['direct', 'json_path', 'custom_function'].includes(transform_type)) {
      return NextResponse.json(
        { 
          error: 'Invalid transform_type. Must be: direct, json_path, or custom_function',
          success: false,
        },
        { status: 400 }
      );
    }

    // Get integration
    const { data: integration } = await supabase
      .from('integrations')
      .select('id')
      .eq('builder_id', user.id)
      .eq('integration_type', 'crm')
      .eq('provider', 'zoho')
      .single();

    if (!integration) {
      return NextResponse.json(
        { error: 'Zoho CRM not connected', success: false },
        { status: 404 }
      );
    }

    // Create mapping
    const { data: mapping, error } = await supabase
      .from('crm_field_mappings')
      .insert({
        integration_id: integration.id,
        tharaga_field,
        crm_field,
        transform_type,
        transform_rule: (transform_config || transform_rule || {}) as any,
        sync_direction,
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      // Handle unique constraint violation
      if (error.code === '23505') {
        return NextResponse.json(
          { 
            error: 'Field mapping already exists for this combination',
            success: false,
          },
          { status: 409 }
        );
      }
      throw error;
    }

    return NextResponse.json({ 
      success: true,
      mapping,
    });
  } catch (error: any) {
    console.error('Error creating field mapping:', error);
    return NextResponse.json(
      { 
        error: error.message || 'Failed to create field mapping',
        success: false,
      },
      { status: 500 }
    );
  }
}

// =============================================
// PATCH - Update field mapping
// =============================================
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized', success: false },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { mapping_id, ...updates } = body;

    if (!mapping_id) {
      return NextResponse.json(
        { error: 'mapping_id is required', success: false },
        { status: 400 }
      );
    }

    // Validate sync_direction if provided
    if (updates.sync_direction && !['to_crm', 'from_crm', 'bidirectional'].includes(updates.sync_direction)) {
      return NextResponse.json(
        { 
          error: 'Invalid sync_direction. Must be: to_crm, from_crm, or bidirectional',
          success: false,
        },
        { status: 400 }
      );
    }

    // Validate transform_type if provided
    if (updates.transform_type && !['direct', 'json_path', 'custom_function'].includes(updates.transform_type)) {
      return NextResponse.json(
        { 
          error: 'Invalid transform_type. Must be: direct, json_path, or custom_function',
          success: false,
        },
        { status: 400 }
      );
    }

    // Verify ownership
    const { data: integration } = await supabase
      .from('integrations')
      .select('id')
      .eq('builder_id', user.id)
      .eq('integration_type', 'crm')
      .eq('provider', 'zoho')
      .single();

    if (!integration) {
      return NextResponse.json(
        { error: 'Zoho CRM not connected', success: false },
        { status: 404 }
      );
    }

    // Update mapping
    const { data: mapping, error } = await supabase
      .from('crm_field_mappings')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', mapping_id)
      .eq('integration_id', integration.id)
      .select()
      .single();

    if (error) throw error;

    if (!mapping) {
      return NextResponse.json(
        { error: 'Field mapping not found', success: false },
        { status: 404 }
      );
    }

    return NextResponse.json({ 
      success: true,
      mapping,
    });
  } catch (error: any) {
    console.error('Error updating field mapping:', error);
    return NextResponse.json(
      { 
        error: error.message || 'Failed to update field mapping',
        success: false,
      },
      { status: 500 }
    );
  }
}

// =============================================
// DELETE - Remove field mapping
// =============================================
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized', success: false },
        { status: 401 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const mapping_id = searchParams.get('mapping_id');

    if (!mapping_id) {
      return NextResponse.json(
        { error: 'mapping_id is required', success: false },
        { status: 400 }
      );
    }

    // Verify ownership
    const { data: integration } = await supabase
      .from('integrations')
      .select('id')
      .eq('builder_id', user.id)
      .eq('integration_type', 'crm')
      .eq('provider', 'zoho')
      .single();

    if (!integration) {
      return NextResponse.json(
        { error: 'Zoho CRM not connected', success: false },
        { status: 404 }
      );
    }

    // Delete mapping
    const { error } = await supabase
      .from('crm_field_mappings')
      .delete()
      .eq('id', mapping_id)
      .eq('integration_id', integration.id);

    if (error) throw error;

    return NextResponse.json({ 
      success: true,
      message: 'Field mapping deleted successfully',
    });
  } catch (error: any) {
    console.error('Error deleting field mapping:', error);
    return NextResponse.json(
      { 
        error: error.message || 'Failed to delete field mapping',
        success: false,
      },
      { status: 500 }
    );
  }
}

