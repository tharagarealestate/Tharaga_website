// =============================================
// LEAD INTERACTIONS API - LOG INTERACTIONS
// POST /api/leads/[leadId]/interactions - Create interaction
// GET /api/leads/[leadId]/interactions - List interactions
// =============================================
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { z } from 'zod';

// =============================================
// VALIDATION SCHEMA
// =============================================
const createInteractionSchema = z.object({
  interaction_type: z.enum([
    'phone_call',
    'email_sent',
    'whatsapp_message',
    'site_visit_scheduled',
    'site_visit_completed',
    'negotiation_started',
    'offer_made',
    'offer_accepted',
    'offer_rejected',
    'deal_closed',
    'deal_lost',
  ]),
  property_id: z.string().uuid().optional().nullable(),
  scheduled_for: z.string().refine(
    (val) => !val || !isNaN(Date.parse(val)),
    { message: 'Invalid datetime format' }
  ).optional().nullable(),
  status: z.enum(['pending', 'completed', 'scheduled', 'cancelled']).default('completed'),
  notes: z.string().max(5000).optional().nullable(),
  outcome: z.enum([
    'interested',
    'not_interested',
    'follow_up',
    'converted',
    'lost',
    'on_hold',
  ]).optional().nullable(),
  next_follow_up: z.string().refine(
    (val) => !val || !isNaN(Date.parse(val)),
    { message: 'Invalid datetime format' }
  ).optional().nullable(),
});

type CreateInteractionInput = z.infer<typeof createInteractionSchema>;

// =============================================
// POST HANDLER - CREATE INTERACTION
// =============================================
export async function POST(
  request: NextRequest,
  { params }: { params: { leadId: string } }
) {
  try {
    const cookieStore = cookies();
    const supabase = createClient();
    
    // =============================================
    // AUTHENTICATION
    // =============================================
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Verify builder role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();
    
    if (profile?.role !== 'builder') {
      return NextResponse.json(
        { error: 'Forbidden - Builders only' },
        { status: 403 }
      );
    }
    
    // =============================================
    // VALIDATE LEAD EXISTS AND BELONGS TO BUILDER
    // =============================================
    const { leadId } = params;
    
    // Check if lead exists and belongs to this builder
    // Handle both bigint (leads.id) and uuid (if converted) cases
    let leadQuery = supabase
      .from('leads')
      .select('id, builder_id, created_at')
      .eq('builder_id', user.id);
    
    // Try to match as bigint first (leads.id is bigint)
    const leadIdAsNumber = parseInt(leadId, 10);
    if (!isNaN(leadIdAsNumber)) {
      leadQuery = leadQuery.eq('id', leadIdAsNumber);
    } else {
      // If not a number, try as string (might be UUID in some cases)
      leadQuery = leadQuery.eq('id', leadId);
    }
    
    const { data: lead, error: leadError } = await leadQuery.single();
    
    if (leadError || !lead) {
      return NextResponse.json(
        { error: 'Lead not found or access denied' },
        { status: 404 }
      );
    }
    
    // =============================================
    // PARSE AND VALIDATE REQUEST BODY
    // =============================================
    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON body' },
        { status: 400 }
      );
    }
    
    const validatedData = createInteractionSchema.parse(body);
    
    // =============================================
    // CALCULATE RESPONSE TIME
    // =============================================
    
    // Convert lead.id to string for querying interactions
    const leadIdForQuery = String(lead.id);
    
    // Get last interaction timestamp
    const { data: lastInteraction } = await supabase
      .from('lead_interactions')
      .select('timestamp')
      .eq('lead_id', leadIdForQuery)
      .eq('builder_id', user.id)
      .order('timestamp', { ascending: false })
      .limit(1)
      .maybeSingle();
    
    // Use last interaction time or lead creation time
    const lastTimestamp = lastInteraction?.timestamp || lead.created_at;
    const responseTimeMinutes = lastTimestamp
      ? Math.floor((Date.now() - new Date(lastTimestamp).getTime()) / (1000 * 60))
      : null;
    
    // =============================================
    // CREATE INTERACTION RECORD
    // =============================================
    
    const interactionData = {
      lead_id: leadIdForQuery,
      builder_id: user.id,
      interaction_type: validatedData.interaction_type,
      property_id: validatedData.property_id || null,
      timestamp: new Date().toISOString(),
      response_time_minutes: responseTimeMinutes,
      scheduled_for: validatedData.scheduled_for ? new Date(validatedData.scheduled_for).toISOString() : null,
      status: validatedData.status,
      notes: validatedData.notes || null,
      outcome: validatedData.outcome || null,
      next_follow_up: validatedData.next_follow_up ? new Date(validatedData.next_follow_up).toISOString() : null,
      metadata: {},
    };
    
    const { data: interaction, error: createError } = await supabase
      .from('lead_interactions')
      .insert(interactionData)
      .select()
      .single();
    
    if (createError) {
      console.error('[API/Interaction] Create error:', createError);
      return NextResponse.json(
        { error: 'Failed to create interaction', details: createError.message },
        { status: 500 }
      );
    }
    
    // =============================================
    // UPDATE LEAD STATUS IF DEAL CLOSED/LOST
    // =============================================
    
    if (validatedData.outcome === 'converted' || validatedData.interaction_type === 'deal_closed') {
      await supabase
        .from('leads')
        .update({ status: 'closed_won' })
        .eq('id', lead.id)
        .eq('builder_id', user.id);
    } else if (validatedData.outcome === 'lost' || validatedData.interaction_type === 'deal_lost') {
      await supabase
        .from('leads')
        .update({ status: 'closed_lost' })
        .eq('id', lead.id)
        .eq('builder_id', user.id);
    }
    
    // =============================================
    // TRIGGER SCORE RECALCULATION (if function exists)
    // =============================================
    
    try {
      // Try to trigger score recalculation if user_id exists
      const { data: leadUser } = await supabase
        .from('leads')
        .select('email')
        .eq('id', lead.id)
        .single();
      
      if (leadUser?.email) {
        const { data: userProfile } = await supabase
          .from('profiles')
          .select('id')
          .eq('email', leadUser.email)
          .maybeSingle();
        
        if (userProfile?.id) {
          await supabase.rpc('calculate_lead_score', { 
            p_user_id: userProfile.id 
          }).catch(() => {
            // Function might not exist, ignore
          });
        }
      }
    } catch (error) {
      // Score recalculation is optional, continue even if it fails
      console.log('[API/Interaction] Score recalculation skipped:', error);
    }
    
    // =============================================
    // TRIGGER SIDEBAR REFRESH
    // =============================================
    
    // Note: Frontend will handle this via query invalidation
    
    return NextResponse.json({
      success: true,
      data: interaction,
      message: 'Interaction logged successfully',
    }, {
      status: 201,
    });
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Validation error', 
          details: error.errors.map(e => ({
            path: e.path.join('.'),
            message: e.message,
          })),
        },
        { status: 400 }
      );
    }
    
    console.error('[API/Interaction] Server error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// =============================================
// GET HANDLER - LIST INTERACTIONS
// =============================================
export async function GET(
  request: NextRequest,
  { params }: { params: { leadId: string } }
) {
  try {
    const cookieStore = cookies();
    const supabase = createClient();
    
    // =============================================
    // AUTHENTICATION
    // =============================================
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Verify builder role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();
    
    if (profile?.role !== 'builder') {
      return NextResponse.json(
        { error: 'Forbidden - Builders only' },
        { status: 403 }
      );
    }
    
    const { leadId } = params;
    
    // =============================================
    // VERIFY LEAD ACCESS
    // =============================================
    let leadQuery = supabase
      .from('leads')
      .select('id')
      .eq('builder_id', user.id);
    
    const leadIdAsNumber = parseInt(leadId, 10);
    if (!isNaN(leadIdAsNumber)) {
      leadQuery = leadQuery.eq('id', leadIdAsNumber);
    } else {
      leadQuery = leadQuery.eq('id', leadId);
    }
    
    const { data: lead } = await leadQuery.single();
    
    if (!lead) {
      return NextResponse.json(
        { error: 'Lead not found or access denied' },
        { status: 404 }
      );
    }
    
    // Convert lead.id to string for querying interactions
    const leadIdForQuery = String(lead.id);
    
    // =============================================
    // FETCH INTERACTIONS
    // =============================================
    const { data: interactions, error } = await supabase
      .from('lead_interactions')
      .select(`
        id,
        interaction_type,
        timestamp,
        status,
        notes,
        outcome,
        response_time_minutes,
        scheduled_for,
        completed_at,
        next_follow_up,
        property_id,
        metadata,
        created_at,
        updated_at
      `)
      .eq('lead_id', leadIdForQuery)
      .eq('builder_id', user.id)
      .order('timestamp', { ascending: false });
    
    if (error) {
      console.error('[API/Interactions/List] Error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch interactions' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      data: interactions || [],
      count: interactions?.length || 0,
    });
    
  } catch (error) {
    console.error('[API/Interactions/List] Server error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

