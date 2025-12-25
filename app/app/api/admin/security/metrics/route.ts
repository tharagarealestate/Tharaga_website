import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { secureApiRoute } from '@/lib/security/api-security';
import { Permissions } from '@/lib/security/permissions';
import { AuditActions, AuditResourceTypes } from '@/lib/security/audit';

/**
 * GET /api/admin/security/metrics
 * Get security monitoring metrics
 */
export const GET = secureApiRoute(
  async (request: NextRequest, user) => {
    const supabase = createRouteHandlerClient({ cookies });
    
    // User is already authenticated and has admin role via secureApiRoute
    const now = new Date();
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const last7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Failed logins in last 24h
    const { count: failedLogins24h } = await supabase
      .from('login_attempts')
      .select('*', { count: 'exact', head: true })
      .eq('success', false)
      .gte('attempted_at', last24h.toISOString());

    // Suspicious IPs (IPs with 5+ failed attempts in 24h)
    const { data: suspiciousIPsData } = await supabase
      .from('login_attempts')
      .select('ip_address')
      .eq('success', false)
      .gte('attempted_at', last24h.toISOString())
      .not('ip_address', 'is', null);

    const ipCounts: Record<string, number> = {};
    suspiciousIPsData?.forEach(attempt => {
      if (attempt.ip_address) {
        ipCounts[attempt.ip_address] = (ipCounts[attempt.ip_address] || 0) + 1;
      }
    });

    const suspiciousIPs = Object.entries(ipCounts)
      .filter(([_, count]) => count >= 5)
      .map(([ip, count]) => ({ ip, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Account lockouts (from failed_login_tracking)
    const { count: accountLockouts } = await supabase
      .from('failed_login_tracking')
      .select('*', { count: 'exact', head: true })
      .eq('is_locked', true);

    // Security events in last 24h
    const { count: securityEvents24h } = await supabase
      .from('audit_logs')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', last24h.toISOString())
      .in('action', [
        AuditActions.LOGIN_FAILED,
        AuditActions.ROLE_CHANGE,
        AuditActions.USER_DELETE,
        AuditActions.PASSWORD_CHANGE,
        AuditActions.TWO_FA_ENABLE,
        AuditActions.TWO_FA_DISABLE
      ]);

    // Recent security alerts
    const { data: recentAlerts } = await supabase
      .from('security_alerts')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5)
      .eq('acknowledged', false);

    return NextResponse.json({
      success: true,
      data: {
        failed_logins_24h: failedLogins24h || 0,
        suspicious_ips: suspiciousIPs.length,
        account_lockouts: accountLockouts || 0,
        security_events_24h: securityEvents24h || 0,
        top_failed_ips: suspiciousIPs,
        recent_alerts: recentAlerts || []
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

