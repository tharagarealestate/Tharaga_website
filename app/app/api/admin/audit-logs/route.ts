import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { secureApiRoute } from '@/lib/security/api-security';
import { Permissions } from '@/lib/security/permissions';
import { AuditActions, AuditResourceTypes } from '@/lib/security/audit';
import { z } from 'zod';

const auditLogQuerySchema = z.object({
  page: z.string().optional().transform(val => val ? parseInt(val, 10) : 1),
  limit: z.string().optional().transform(val => val ? Math.min(parseInt(val || '50', 10), 100) : 50),
  action: z.string().optional(),
  resource_type: z.string().optional(),
  user_id: z.string().uuid().optional(),
  start_date: z.string().datetime().optional(),
  end_date: z.string().datetime().optional(),
  ip_address: z.string().optional(),
  search: z.string().optional()
});

/**
 * GET /api/admin/audit-logs
 * Retrieve audit logs with filtering and pagination
 * Admin only endpoint for security monitoring
 */
export const GET = secureApiRoute(
  async (request: NextRequest, user) => {
    const supabase = createRouteHandlerClient({ cookies });
    
    // User is already authenticated and has admin role via secureApiRoute
    const url = new URL(request.url);
    const queryParams = {
      page: url.searchParams.get('page') || '1',
      limit: url.searchParams.get('limit') || '50',
      action: url.searchParams.get('action') || undefined,
      resource_type: url.searchParams.get('resource_type') || undefined,
      user_id: url.searchParams.get('user_id') || undefined,
      start_date: url.searchParams.get('start_date') || undefined,
      end_date: url.searchParams.get('end_date') || undefined,
      ip_address: url.searchParams.get('ip_address') || undefined,
      search: url.searchParams.get('search') || undefined
    };

    const validatedQuery = auditLogQuerySchema.parse(queryParams);
    const { page, limit, action, resource_type, user_id, start_date, end_date, ip_address, search } = validatedQuery;
    const offset = (page - 1) * limit;

    // Build query
    let query = supabase
      .from('audit_logs')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Apply filters
    if (action) {
      query = query.eq('action', action);
    }
    if (resource_type) {
      query = query.eq('resource_type', resource_type);
    }
    if (user_id) {
      query = query.eq('user_id', user_id);
    }
    if (start_date) {
      query = query.gte('created_at', start_date);
    }
    if (end_date) {
      query = query.lte('created_at', end_date);
    }
    if (ip_address) {
      query = query.eq('ip_address', ip_address);
    }
    if (search) {
      query = query.or(`action.ilike.%${search}%,resource_type.ilike.%${search}%,metadata::text.ilike.%${search}%`);
    }

    const { data: logs, error, count } = await query;

    if (error) {
      console.error('[Admin/AuditLogs] Query error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch audit logs', details: error.message },
        { status: 500 }
      );
    }

    // Get summary statistics
    const { data: stats } = await supabase
      .from('audit_logs')
      .select('action, resource_type')
      .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()); // Last 7 days

    const actionCounts: Record<string, number> = {};
    const resourceCounts: Record<string, number> = {};
    
    stats?.forEach(log => {
      actionCounts[log.action] = (actionCounts[log.action] || 0) + 1;
      resourceCounts[log.resource_type] = (resourceCounts[log.resource_type] || 0) + 1;
    });

    return NextResponse.json({
      success: true,
      data: {
        logs: logs || [],
        pagination: {
          page,
          limit,
          total: count || 0,
          total_pages: Math.ceil((count || 0) / limit)
        },
        summary: {
          last_7_days: {
            total_events: stats?.length || 0,
            action_counts: actionCounts,
            resource_counts: resourceCounts
          }
        },
        filters_applied: {
          action,
          resource_type,
          user_id,
          start_date,
          end_date,
          ip_address,
          search
        }
      }
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

