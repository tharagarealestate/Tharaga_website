/**
 * RERA Monitoring Service
 * 
 * Monitors RERA registrations for:
 * - Expiry warnings
 * - Status changes
 * - Compliance issues
 * - Re-verification needs
 */

import { createClient } from '@supabase/supabase-js';

export interface MonitoringResult {
  checked: number;
  expired: number;
  expiringSoon: number;
  statusChanged: number;
  alertsCreated: number;
  errors: string[];
}

export class RERAMonitoringService {
  private supabase: ReturnType<typeof createClient>;

  constructor() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE;
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase URL and service role key are required');
    }
    
    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  /**
   * Run monitoring check (called by cron job)
   */
  async runMonitoringCheck(): Promise<MonitoringResult> {
    const result: MonitoringResult = {
      checked: 0,
      expired: 0,
      expiringSoon: 0,
      statusChanged: 0,
      alertsCreated: 0,
      errors: [],
    };

    try {
      // Step 1: Check for expired RERA
      const expiredResult = await this.checkExpiredRERA();
      result.expired = expiredResult.count;
      result.alertsCreated += expiredResult.alertsCreated;

      // Step 2: Check for expiring soon RERA
      const expiringResult = await this.checkExpiringRERA();
      result.expiringSoon = expiringResult.count;
      result.alertsCreated += expiringResult.alertsCreated;

      // Step 3: Re-verify active RERA (stale ones)
      const reVerifyResult = await this.reVerifyStaleRERA();
      result.checked = reVerifyResult.checked;
      result.statusChanged = reVerifyResult.statusChanged;

      // Step 4: Call database function for additional checks
      await this.supabase.rpc('check_rera_expiry');

    } catch (error) {
      result.errors.push(error instanceof Error ? error.message : 'Unknown error');
    }

    return result;
  }

  /**
   * Check for expired RERA registrations
   */
  private async checkExpiredRERA(): Promise<{ count: number; alertsCreated: number }> {
    const { data: expired, error } = await this.supabase
      .from('rera_registrations')
      .select('id, rera_number, builder_id, expiry_date')
      .lt('expiry_date', new Date().toISOString())
      .in('status', ['active'])
      .or('verified.eq.true,verification_status.eq.verified')
      .is('is_active', true);

    if (error) {
      console.error('Error checking expired RERA:', error);
      return { count: 0, alertsCreated: 0 };
    }

    if (!expired || expired.length === 0) {
      return { count: 0, alertsCreated: 0 };
    }

    // Update status to expired
    const { error: updateError } = await this.supabase
      .from('rera_registrations')
      .update({
        status: 'expired',
        verification_status: 'expired',
        is_active: false,
        updated_at: new Date().toISOString(),
      })
      .in('id', expired.map(r => r.id));

    if (updateError) {
      console.error('Error updating expired RERA:', updateError);
    }

    // Create alerts
    const alerts = expired.map(r => ({
      rera_registration_id: r.id,
      builder_id: r.builder_id,
      alert_type: 'expired',
      alert_priority: 'critical',
      title: 'RERA Registration Expired',
      message: `RERA registration ${r.rera_number} has expired on ${r.expiry_date}`,
      action_required: 'Renew RERA registration immediately to continue listing properties',
    }));

    const { error: alertError } = await this.supabase
      .from('rera_alerts')
      .insert(alerts);

    if (alertError) {
      console.error('Error creating expired alerts:', alertError);
    }

    return {
      count: expired.length,
      alertsCreated: alertError ? 0 : alerts.length,
    };
  }

  /**
   * Check for RERA expiring soon (30 days)
   */
  private async checkExpiringRERA(): Promise<{ count: number; alertsCreated: number }> {
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    const { data: expiring, error } = await this.supabase
      .from('rera_registrations')
      .select('id, rera_number, builder_id, expiry_date')
      .gte('expiry_date', new Date().toISOString())
      .lte('expiry_date', thirtyDaysFromNow.toISOString())
      .in('status', ['active'])
      .or('verified.eq.true,verification_status.eq.verified')
      .is('is_active', true);

    if (error) {
      console.error('Error checking expiring RERA:', error);
      return { count: 0, alertsCreated: 0 };
    }

    if (!expiring || expiring.length === 0) {
      return { count: 0, alertsCreated: 0 };
    }

    // Check if alerts already exist (avoid duplicates)
    const { data: existingAlerts } = await this.supabase
      .from('rera_alerts')
      .select('rera_registration_id')
      .in('rera_registration_id', expiring.map(r => r.id))
      .eq('alert_type', 'expiry_warning')
      .eq('resolved', false)
      .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

    const existingIds = new Set(existingAlerts?.map(a => a.rera_registration_id) || []);

    // Create alerts only for those without recent alerts
    const alerts = expiring
      .filter(r => !existingIds.has(r.id))
      .map(r => {
        const daysUntilExpiry = Math.floor(
          (new Date(r.expiry_date!).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
        );

        return {
          rera_registration_id: r.id,
          builder_id: r.builder_id,
          alert_type: 'expiry_warning',
          alert_priority: daysUntilExpiry <= 7 ? 'critical' : daysUntilExpiry <= 15 ? 'high' : 'medium',
          title: 'RERA Expiring Soon',
          message: `RERA registration ${r.rera_number} expires in ${daysUntilExpiry} days (${r.expiry_date})`,
          action_required: 'Renew RERA registration before expiry',
        };
      });

    if (alerts.length > 0) {
      const { error: alertError } = await this.supabase
        .from('rera_alerts')
        .insert(alerts);

      if (alertError) {
        console.error('Error creating expiry warnings:', alertError);
        return { count: expiring.length, alertsCreated: 0 };
      }
    }

    return {
      count: expiring.length,
      alertsCreated: alerts.length,
    };
  }

  /**
   * Re-verify stale RERA registrations
   */
  private async reVerifyStaleRERA(): Promise<{ checked: number; statusChanged: number }> {
    // Get RERA that haven't been verified in 30+ days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: stale, error } = await this.supabase
      .from('rera_registrations')
      .select('id, rera_number, rera_state, status, verification_status, last_verified_at')
      .or('last_verified_at.is.null,last_verified_at.lt.' + thirtyDaysAgo.toISOString())
      .in('status', ['active'])
      .limit(50); // Limit to avoid overwhelming the system

    if (error || !stale || stale.length === 0) {
      return { checked: 0, statusChanged: 0 };
    }

    let statusChanged = 0;

    // Re-verify each stale RERA (in production, this would call the verification engine)
    for (const rera of stale) {
      try {
        // TODO: Call verification engine here
        // For now, just update last_verified_at to prevent repeated checks
        await this.supabase
          .from('rera_registrations')
          .update({
            last_verified_at: new Date().toISOString(),
          })
          .eq('id', rera.id);
      } catch (error) {
        console.error(`Error re-verifying RERA ${rera.rera_number}:`, error);
      }
    }

    return {
      checked: stale.length,
      statusChanged,
    };
  }

  /**
   * Get monitoring statistics
   */
  async getMonitoringStats(): Promise<{
    total: number;
    verified: number;
    pending: number;
    expired: number;
    expiringSoon: number;
    alerts: number;
  }> {
    const { data: total } = await this.supabase
      .from('rera_registrations')
      .select('id', { count: 'exact', head: true });

    const { data: verified } = await this.supabase
      .from('rera_registrations')
      .select('id', { count: 'exact', head: true })
      .or('verified.eq.true,verification_status.eq.verified');

    const { data: pending } = await this.supabase
      .from('rera_registrations')
      .select('id', { count: 'exact', head: true })
      .eq('verification_status', 'pending');

    const { data: expired } = await this.supabase
      .from('rera_registrations')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'expired');

    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    const { data: expiringSoon } = await this.supabase
      .from('rera_registrations')
      .select('id', { count: 'exact', head: true })
      .gte('expiry_date', new Date().toISOString())
      .lte('expiry_date', thirtyDaysFromNow.toISOString())
      .eq('status', 'active');

    const { data: alerts } = await this.supabase
      .from('rera_alerts')
      .select('id', { count: 'exact', head: true })
      .eq('resolved', false);

    return {
      total: total?.count || 0,
      verified: verified?.count || 0,
      pending: pending?.count || 0,
      expired: expired?.count || 0,
      expiringSoon: expiringSoon?.count || 0,
      alerts: alerts?.count || 0,
    };
  }
}

// Export singleton instance
let monitoringInstance: RERAMonitoringService | null = null;

export const reraMonitoringService = {
  getInstance(): RERAMonitoringService {
    if (!monitoringInstance) {
      monitoringInstance = new RERAMonitoringService();
    }
    return monitoringInstance;
  },
  runMonitoringCheck: () => reraMonitoringService.getInstance().runMonitoringCheck(),
  getMonitoringStats: () => reraMonitoringService.getInstance().getMonitoringStats(),
};



