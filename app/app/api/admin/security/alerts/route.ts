import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { secureApiRoute } from '@/lib/security/api-security';
import { Permissions } from '@/lib/security/permissions';
import { AuditActions, AuditResourceTypes } from '@/lib/security/audit';
import { z } from 'zod';

const acknowledgeAlertSchema = z.object({
  alert_id: z.string().uuid(),
  acknowledged: z.boolean()
});

/**
 * GET /api/admin/security/alerts
 * Get security alerts
 */
export const GET = secureApiRoute(
  async (request: NextRequest, user) => {
    const supabase = createRouteHandlerClient({ cookies });
    
    const url = new URL(request.url);
    const acknowledged = url.searchParams.get('acknowledged');
    const severity = url.searchParams.get('severity');
    const limit = parseInt(url.searchParams.get('limit') || '50', 10);

    let query = supabase
      .from('security_alerts')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (acknowledged !== null) {
      query = query.eq('acknowledged', acknowledged === 'true');
    }
    if (severity) {
      query = query.eq('severity', severity);
    }

    const { data: alerts, error } = await query;

    if (error) {
      console.error('[Admin/SecurityAlerts] Query error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch alerts', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: alerts || []
    });
  },
  {
    requireAuth: true,
    requireRole: ['admin'],
    requirePermission: Permissions.ADMIN_ACCESS,
    rateLimit: 'api',
    auditAction: AuditActions.VIEW,
    auditResourceType: AuditResourceTypes.ADMIN
  }
);

/**
 * PATCH /api/admin/security/alerts
 * Acknowledge an alert
 */
export const PATCH = secureApiRoute(
  async (request: NextRequest, user) => {
    const supabase = createRouteHandlerClient({ cookies });
    
    const body = await request.json();
    const { alert_id, acknowledged } = acknowledgeAlertSchema.parse(body);

    const { data, error } = await supabase
      .from('security_alerts')
      .update({ 
        acknowledged,
        acknowledged_at: acknowledged ? new Date().toISOString() : null,
        acknowledged_by: acknowledged ? user.id : null
      })
      .eq('id', alert_id)
      .select()
      .single();

    if (error) {
      console.error('[Admin/SecurityAlerts] Update error:', error);
      return NextResponse.json(
        { error: 'Failed to update alert', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data
    });
  },
  {
    requireAuth: true,
    requireRole: ['admin'],
    requirePermission: Permissions.ADMIN_ACCESS,
    rateLimit: 'api',
    validateSchema: acknowledgeAlertSchema,
    auditAction: AuditActions.UPDATE,
    auditResourceType: AuditResourceTypes.ADMIN
  }
);

