import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const builderId = params.id;

    // Verify authentication
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify user has access to this builder's data
    const { data: userRole } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    // Check if user is admin or the builder themselves
    const { data: builderProfile } = await supabase
      .from('builder_profiles')
      .select('user_id')
      .eq('id', builderId)
      .single();

    const isAdmin = userRole?.role === 'admin';
    const isBuilderOwner = builderProfile?.user_id === user.id;

    if (!isAdmin && !isBuilderOwner) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get lead stats from leads table
    const { data: leads } = await supabase
      .from('leads')
      .select('*')
      .eq('builder_id', builderId);

    const totalLeads = leads?.length || 0;
    const qualifiedLeads = leads?.filter(l => l.status === 'qualified').length || 0;
    const convertedLeads = leads?.filter(l => l.status === 'won' || l.status === 'converted').length || 0;
    const conversionRate = totalLeads > 0 ? (convertedLeads / totalLeads) * 100 : 0;

    // Calculate avg response time from lead_interactions
    let avgResponseTime = 0;
    if (leads && leads.length > 0) {
      const leadIds = leads.map(l => l.id.toString());
      const { data: interactions } = await supabase
        .from('lead_interactions')
        .select('lead_id, response_time_minutes, timestamp, created_at')
        .in('lead_id', leadIds)
        .not('response_time_minutes', 'is', null);
      
      if (interactions && interactions.length > 0) {
        const totalMinutes = interactions.reduce((sum, i) => sum + (i.response_time_minutes || 0), 0);
        avgResponseTime = Math.round(totalMinutes / interactions.length);
      }
    }

    // Get top properties by lead count
    const { data: topProperties } = await supabase
      .from('properties')
      .select('id, title')
      .eq('builder_id', builderId)
      .limit(5);

    // Count leads per property
    const propertiesWithLeads = await Promise.all(
      (topProperties || []).map(async (property) => {
        const { count } = await supabase
          .from('leads')
          .select('*', { count: 'exact', head: true })
          .eq('property_id', property.id);
        return {
          ...property,
          lead_count: count || 0
        };
      })
    );

    const sortedProperties = propertiesWithLeads
      .sort((a, b) => b.lead_count - a.lead_count)
      .slice(0, 5);

    // Get lead sources from event properties or lead source field
    const leadSources: Record<string, number> = {};
    leads?.forEach((lead: any) => {
      const source = lead.source || lead.event_properties?.source || 'direct';
      leadSources[source] = (leadSources[source] || 0) + 1;
    });

    return NextResponse.json({
      totalLeads,
      qualifiedLeads,
      convertedLeads,
      conversionRate,
      avgResponseTime,
      topProperties: sortedProperties,
      leadSources: leadSources
    });

  } catch (error: any) {
    console.error('Analytics error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

