/**
 * Monitoring and Error Handling Service
 * Tracks system health and errors
 */

import { getSupabase } from '../supabase';

export interface SystemHealth {
  status: 'healthy' | 'degraded' | 'down';
  timestamp: string;
  metrics: {
    pendingProperties: number;
    processingProperties: number;
    failedProperties: number;
    completedToday: number;
    averageProcessingTime: number;
    emailDeliveryRate: number;
    smsDeliveryRate: number;
  };
  errors: Array<{
    type: string;
    message: string;
    timestamp: string;
  }>;
}

/**
 * Get system health metrics
 */
export async function getSystemHealth(): Promise<SystemHealth> {
  const supabase = getSupabase();
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  try {
    // Get property processing stats
    const { count: pendingCount } = await supabase
      .from('properties')
      .select('*', { count: 'exact', head: true })
      .eq('processing_status', 'pending');

    const { count: processingCount } = await supabase
      .from('properties')
      .select('*', { count: 'exact', head: true })
      .eq('processing_status', 'processing');

    const { count: failedCount } = await supabase
      .from('properties')
      .select('*', { count: 'exact', head: true })
      .eq('processing_status', 'failed');

    // Get completed today
    const { count: completedToday } = await supabase
      .from('properties')
      .select('*', { count: 'exact', head: true })
      .eq('processing_status', 'completed')
      .gte('updated_at', todayStart.toISOString());

    // Get average processing time from jobs
    const { data: completedJobs } = await supabase
      .from('processing_jobs')
      .select('duration_ms, started_at, completed_at')
      .eq('status', 'completed')
      .not('duration_ms', 'is', null)
      .order('completed_at', { ascending: false })
      .limit(100);

    const avgProcessingTime = completedJobs && completedJobs.length > 0
      ? completedJobs.reduce((sum, job) => {
          if (job.duration_ms) return sum + job.duration_ms;
          // Calculate from timestamps if duration_ms not available
          if (job.started_at && job.completed_at) {
            const duration = new Date(job.completed_at).getTime() - new Date(job.started_at).getTime();
            return sum + duration;
          }
          return sum;
        }, 0) / completedJobs.length
      : 0;

    // Get email delivery stats
    const { count: totalEmails } = await supabase
      .from('email_delivery_logs')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', todayStart.toISOString());

    const { count: sentEmails } = await supabase
      .from('email_delivery_logs')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'sent')
      .gte('created_at', todayStart.toISOString());

    const emailDeliveryRate = totalEmails && totalEmails > 0
      ? (sentEmails || 0) / totalEmails
      : 1.0;

    // Get SMS delivery stats
    const { count: totalSMS } = await supabase
      .from('sms_delivery_logs')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', todayStart.toISOString());

    const { count: sentSMS } = await supabase
      .from('sms_delivery_logs')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'sent')
      .gte('created_at', todayStart.toISOString());

    const smsDeliveryRate = totalSMS && totalSMS > 0
      ? (sentSMS || 0) / totalSMS
      : 1.0;

    // Get recent errors
    const { data: failedJobs } = await supabase
      .from('processing_jobs')
      .select('error_message, updated_at')
      .eq('status', 'failed')
      .order('updated_at', { ascending: false })
      .limit(10);

    const errors = (failedJobs || []).map(job => ({
      type: 'processing_job',
      message: job.error_message || 'Unknown error',
      timestamp: job.updated_at || new Date().toISOString()
    }));

    // Determine overall status
    let status: 'healthy' | 'degraded' | 'down' = 'healthy';
    if (failedCount && failedCount > 10) status = 'degraded';
    if (emailDeliveryRate < 0.8 || smsDeliveryRate < 0.8) status = 'degraded';
    if (processingCount && processingCount > 50) status = 'degraded';

    return {
      status,
      timestamp: new Date().toISOString(),
      metrics: {
        pendingProperties: pendingCount || 0,
        processingProperties: processingCount || 0,
        failedProperties: failedCount || 0,
        completedToday: completedToday || 0,
        averageProcessingTime: Math.round(avgProcessingTime),
        emailDeliveryRate: Math.round(emailDeliveryRate * 100) / 100,
        smsDeliveryRate: Math.round(smsDeliveryRate * 100) / 100
      },
      errors: errors.slice(0, 5)
    };

  } catch (error) {
    console.error('[Monitoring] Error getting system health:', error);
    return {
      status: 'down',
      timestamp: new Date().toISOString(),
      metrics: {
        pendingProperties: 0,
        processingProperties: 0,
        failedProperties: 0,
        completedToday: 0,
        averageProcessingTime: 0,
        emailDeliveryRate: 0,
        smsDeliveryRate: 0
      },
      errors: [{
        type: 'monitoring_error',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      }]
    };
  }
}

/**
 * Log error to monitoring system
 */
export async function logError(
  type: string,
  message: string,
  metadata?: Record<string, any>
): Promise<void> {
  try {
    const supabase = getSupabase();

    // Log to processing_jobs if it's a property processing error
    if (type === 'property_processing') {
      // This would be handled by the processing job itself
      return;
    }

    // Could also log to a dedicated errors table if needed
    console.error(`[${type}] ${message}`, metadata);

  } catch (error) {
    console.error('[Monitoring] Error logging error:', error);
  }
}

/**
 * Get processing statistics for a builder
 */
export async function getBuilderStats(builderId: string): Promise<{
  totalProperties: number;
  processedProperties: number;
  totalLeadsGenerated: number;
  averageLeadsPerProperty: number;
  emailDeliveryRate: number;
  smsDeliveryRate: number;
}> {
  const supabase = getSupabase();

  try {
    // Get property counts
    const { count: totalProperties } = await supabase
      .from('properties')
      .select('*', { count: 'exact', head: true })
      .eq('builder_id', builderId);

    const { count: processedProperties } = await supabase
      .from('properties')
      .select('*', { count: 'exact', head: true })
      .eq('builder_id', builderId)
      .eq('processing_status', 'completed');

    // Get total leads generated
    const { count: totalLeadsGenerated } = await supabase
      .from('generated_leads')
      .select('*', { count: 'exact', head: true })
      .eq('builder_id', builderId);

    // Get email stats
    const { count: totalEmails } = await supabase
      .from('email_delivery_logs')
      .select('*', { count: 'exact', head: true })
      .eq('builder_id', builderId);

    const { count: sentEmails } = await supabase
      .from('email_delivery_logs')
      .select('*', { count: 'exact', head: true })
      .eq('builder_id', builderId)
      .eq('status', 'sent');

    const emailDeliveryRate = totalEmails && totalEmails > 0
      ? (sentEmails || 0) / totalEmails
      : 1.0;

    // Get SMS stats
    const { count: totalSMS } = await supabase
      .from('sms_delivery_logs')
      .select('*', { count: 'exact', head: true })
      .eq('builder_id', builderId);

    const { count: sentSMS } = await supabase
      .from('sms_delivery_logs')
      .select('*', { count: 'exact', head: true })
      .eq('builder_id', builderId)
      .eq('status', 'sent');

    const smsDeliveryRate = totalSMS && totalSMS > 0
      ? (sentSMS || 0) / totalSMS
      : 1.0;

    const averageLeadsPerProperty = processedProperties && processedProperties > 0
      ? (totalLeadsGenerated || 0) / processedProperties
      : 0;

    return {
      totalProperties: totalProperties || 0,
      processedProperties: processedProperties || 0,
      totalLeadsGenerated: totalLeadsGenerated || 0,
      averageLeadsPerProperty: Math.round(averageLeadsPerProperty * 10) / 10,
      emailDeliveryRate: Math.round(emailDeliveryRate * 100) / 100,
      smsDeliveryRate: Math.round(smsDeliveryRate * 100) / 100
    };

  } catch (error) {
    console.error('[Monitoring] Error getting builder stats:', error);
    return {
      totalProperties: 0,
      processedProperties: 0,
      totalLeadsGenerated: 0,
      averageLeadsPerProperty: 0,
      emailDeliveryRate: 0,
      smsDeliveryRate: 0
    };
  }
}

