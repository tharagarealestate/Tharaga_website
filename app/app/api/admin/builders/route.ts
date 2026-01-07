/**
 * Admin Builders API
 * Get list of all builders for admin management
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';
import { secureApiRoute } from '@/lib/security/api-security';
import { Permissions } from '@/lib/security/permissions';

export const runtime = 'edge';
export const maxDuration = 30;

/**
 * GET /api/admin/builders
 * Get all builders with stats
 */
export const GET = secureApiRoute(
  async (request: NextRequest, user) => {
    const supabase = getSupabase();
    
    // Get all builders
    const { data: builders, error: buildersError } = await supabase
      .from('builders')
      .select('id, name, email, phone, logo_url, status, created_at');
    
    if (buildersError) {
      return NextResponse.json(
        { error: buildersError.message },
        { status: 500 }
      );
    }
    
    if (!builders || builders.length === 0) {
      return NextResponse.json({ builders: [] });
    }
    
    // Get stats for each builder
    const buildersWithStats = await Promise.all(
      builders.map(async (builder) => {
        // Get property counts
        const { count: totalProperties } = await supabase
          .from('properties')
          .select('*', { count: 'exact', head: true })
          .eq('builder_id', builder.id);
        
        const { count: activeProperties } = await supabase
          .from('properties')
          .select('*', { count: 'exact', head: true })
          .eq('builder_id', builder.id)
          .eq('status', 'active');
        
        // Get lead count
        const { count: totalLeads } = await supabase
          .from('leads')
          .select('*', { count: 'exact', head: true })
          .eq('builder_id', builder.id);
        
        return {
          ...builder,
          total_properties: totalProperties || 0,
          active_properties: activeProperties || 0,
          total_leads: totalLeads || 0,
        };
      })
    );
    
    return NextResponse.json({
      builders: buildersWithStats,
      total: buildersWithStats.length,
    });
  },
  {
    requireAuth: true,
    requireRole: ['admin'],
    requirePermission: Permissions.ADMIN_ACCESS,
  }
);





















