// =============================================
// MESSAGE TEMPLATES API
// GET /api/messaging/templates - List templates
// POST /api/messaging/templates - Create template
// =============================================
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

const createTemplateSchema = z.object({
  name: z.string().min(1).max(100),
  type: z.enum(['sms', 'whatsapp']),
  body: z.string().min(1).max(2000),
  variables: z.array(z.string()).optional(),
});

export async function GET(req: NextRequest) {
  try {
    const supabase = createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(req.url);
    const type = url.searchParams.get('type'); // 'sms' or 'whatsapp'

    let query = supabase
      .from('message_templates')
      .select('*')
      .or(`user_id.eq.${user.id},builder_id.eq.${user.id}`)
      .order('created_at', { ascending: false });

    if (type && (type === 'sms' || type === 'whatsapp')) {
      query = query.eq('type', type);
    }

    const { data: templates, error } = await query;

    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch templates', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ templates: templates || [] });
  } catch (error: any) {
    console.error('Error fetching templates:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    const validated = createTemplateSchema.safeParse(body);
    if (!validated.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validated.error.errors },
        { status: 400 }
      );
    }

    // Check if user is a builder (for builder_id)
    const { data: userRole } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('is_primary', true)
      .single();

    const isBuilder = userRole?.role === 'builder';

    const templateData = {
      user_id: user.id,
      builder_id: isBuilder ? user.id : null,
      name: validated.data.name,
      type: validated.data.type,
      body: validated.data.body,
      variables: validated.data.variables || [],
      is_active: true,
    };

    const { data: template, error } = await supabase
      .from('message_templates')
      .insert(templateData)
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: 'Failed to create template', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ template }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating template:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

