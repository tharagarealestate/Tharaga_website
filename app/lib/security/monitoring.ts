// Security monitoring and alerting system

import { getSupabase } from '../supabase'
import { resendClient } from '../integrations/email/resendClient'

export type AlertSeverity = 'low' | 'medium' | 'high' | 'critical'

export interface SecurityAlert {
  type: string
  severity: AlertSeverity
  title: string
  message: string
  metadata?: Record<string, any>
  user_id?: string
  ip_address?: string
}

/**
 * Create a security alert
 */
export async function createSecurityAlert(alert: SecurityAlert): Promise<string | null> {
  try {
    const supabase = getSupabase()
    
    const { data, error } = await supabase
      .from('security_alerts')
      .insert({
        type: alert.type,
        severity: alert.severity,
        title: alert.title,
        message: alert.message,
        metadata: alert.metadata || {},
        user_id: alert.user_id || null,
        ip_address: alert.ip_address || null,
        acknowledged: false,
        created_at: new Date().toISOString()
      })
      .select('id')
      .single()

    if (error) {
      console.error('[SecurityMonitoring] Failed to create alert:', error)
      return null
    }

    // Send email notification for critical/high alerts
    if (alert.severity === 'critical' || alert.severity === 'high') {
      await sendSecurityAlertEmail(alert)
    }

    return data.id
  } catch (error) {
    console.error('[SecurityMonitoring] Error creating alert:', error)
    return null
  }
}

/**
 * Send security alert email to admins
 */
async function sendSecurityAlertEmail(alert: SecurityAlert): Promise<void> {
  try {
    const adminEmail = process.env.ADMIN_EMAIL || 'tharagarealestate@gmail.com'
    
    const severityEmoji = {
      critical: '🔴',
      high: '🟠',
      medium: '🟡',
      low: '🔵'
    }[alert.severity]

    await resendClient.sendEmail({
      to: adminEmail,
      subject: `${severityEmoji} Security Alert: ${alert.title}`,
      html: `
        <h2>Security Alert</h2>
        <p><strong>Severity:</strong> ${alert.severity.toUpperCase()}</p>
        <p><strong>Type:</strong> ${alert.type}</p>
        <p><strong>Title:</strong> ${alert.title}</p>
        <p><strong>Message:</strong> ${alert.message}</p>
        ${alert.metadata ? `<pre>${JSON.stringify(alert.metadata, null, 2)}</pre>` : ''}
        <p><strong>Time:</strong> ${new Date().toISOString()}</p>
        <p><a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://tharaga.co.in'}/admin/security">View in Dashboard</a></p>
      `
    })
  } catch (error) {
    console.error('[SecurityMonitoring] Failed to send alert email:', error)
  }
}

/**
 * Monitor failed login attempts and create alerts
 */
export async function monitorFailedLogins(): Promise<void> {
  try {
    const supabase = getSupabase()
    const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000)

    // Get failed login attempts in last 24h grouped by IP
    const { data: failedAttempts } = await supabase
      .from('login_attempts')
      .select('ip_address, email, attempted_at')
      .eq('success', false)
      .gte('attempted_at', last24h.toISOString())
      .not('ip_address', 'is', null)

    if (!failedAttempts || failedAttempts.length === 0) return

    // Group by IP
    const ipGroups: Record<string, typeof failedAttempts> = {}
    failedAttempts.forEach(attempt => {
      if (attempt.ip_address) {
        if (!ipGroups[attempt.ip_address]) {
          ipGroups[attempt.ip_address] = []
        }
        ipGroups[attempt.ip_address].push(attempt)
      }
    })

    // Check for suspicious patterns
    for (const [ip, attempts] of Object.entries(ipGroups)) {
      const count = attempts.length
      
      // Critical: 20+ failed attempts from same IP
      if (count >= 20) {
        await createSecurityAlert({
          type: 'brute_force_attack',
          severity: 'critical',
          title: 'Potential Brute Force Attack Detected',
          message: `${count} failed login attempts from IP ${ip} in the last 24 hours`,
          metadata: {
            ip_address: ip,
            attempt_count: count,
            time_range: '24h',
            emails_attempted: [...new Set(attempts.map(a => a.email))]
          },
          ip_address: ip
        })
      }
      // High: 10-19 failed attempts
      else if (count >= 10) {
        await createSecurityAlert({
          type: 'suspicious_login_activity',
          severity: 'high',
          title: 'Suspicious Login Activity',
          message: `${count} failed login attempts from IP ${ip} in the last 24 hours`,
          metadata: {
            ip_address: ip,
            attempt_count: count
          },
          ip_address: ip
        })
      }
    }

    // Check for account lockouts
    const { data: lockedAccounts } = await supabase
      .from('failed_login_tracking')
      .select('email, locked_until')
      .eq('is_locked', true)
      .not('locked_until', 'is', null)

    if (lockedAccounts && lockedAccounts.length > 0) {
      await createSecurityAlert({
        type: 'account_lockouts',
        severity: 'medium',
        title: `${lockedAccounts.length} Account(s) Locked`,
        message: `${lockedAccounts.length} account(s) have been locked due to failed login attempts`,
        metadata: {
          locked_count: lockedAccounts.length,
          accounts: lockedAccounts.map(a => a.email)
        }
      })
    }
  } catch (error) {
    console.error('[SecurityMonitoring] Error monitoring failed logins:', error)
  }
}

/**
 * Monitor suspicious activity patterns
 */
export async function monitorSuspiciousActivity(): Promise<void> {
  try {
    const supabase = getSupabase()
    const last1h = new Date(Date.now() - 60 * 60 * 1000)

    // Check for rapid role changes
    const { data: roleChanges } = await supabase
      .from('audit_logs')
      .select('user_id, created_at, metadata')
      .eq('action', 'role_change')
      .gte('created_at', last1h.toISOString())

    if (roleChanges && roleChanges.length >= 5) {
      await createSecurityAlert({
        type: 'rapid_role_changes',
        severity: 'high',
        title: 'Rapid Role Changes Detected',
        message: `${roleChanges.length} role changes in the last hour`,
        metadata: {
          change_count: roleChanges.length,
          time_range: '1h'
        }
      })
    }

    // Check for multiple account deletions
    const { data: accountDeletions } = await supabase
      .from('audit_logs')
      .select('user_id, created_at')
      .eq('action', 'user_delete')
      .gte('created_at', last1h.toISOString())

    if (accountDeletions && accountDeletions.length >= 3) {
      await createSecurityAlert({
        type: 'mass_account_deletions',
        severity: 'critical',
        title: 'Multiple Account Deletions Detected',
        message: `${accountDeletions.length} account deletions in the last hour`,
        metadata: {
          deletion_count: accountDeletions.length,
          time_range: '1h'
        }
      })
    }

    // Check for unusual IP activity (same user from multiple IPs)
    const { data: recentLogins } = await supabase
      .from('audit_logs')
      .select('user_id, ip_address, created_at')
      .eq('action', 'login')
      .gte('created_at', last1h.toISOString())
      .not('ip_address', 'is', null)

    if (recentLogins && recentLogins.length > 0) {
      const userIPs: Record<string, Set<string>> = {}
      recentLogins.forEach(log => {
        if (log.user_id && log.ip_address) {
          if (!userIPs[log.user_id]) {
            userIPs[log.user_id] = new Set()
          }
          userIPs[log.user_id].add(log.ip_address)
        }
      })

      for (const [userId, ips] of Object.entries(userIPs)) {
        if (ips.size >= 5) {
          await createSecurityAlert({
            type: 'unusual_ip_activity',
            severity: 'high',
            title: 'Unusual IP Activity Detected',
            message: `User ${userId.substring(0, 8)}... logged in from ${ips.size} different IPs in the last hour`,
            metadata: {
              user_id: userId,
              ip_count: ips.size,
              ips: Array.from(ips)
            },
            user_id: userId
          })
        }
      }
    }
  } catch (error) {
    console.error('[SecurityMonitoring] Error monitoring suspicious activity:', error)
  }
}

/**
 * Run all security monitoring checks
 */
export async function runSecurityMonitoring(): Promise<void> {
  await Promise.all([
    monitorFailedLogins(),
    monitorSuspiciousActivity()
  ])
}

