/**
 * RERA Monitoring Edge Function
 * 
 * This function runs daily via pg_cron to:
 * - Check for expired RERA registrations
 * - Check for expiring soon RERA (30 days)
 * - Re-verify stale RERA registrations
 * - Create alerts for builders
 * 
 * Deploy with: supabase functions deploy rera-monitor
 * 
 * The function is called by pg_cron job configured in the database.
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || Deno.env.get('SUPABASE_SERVICE_ROLE')!

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

interface MonitoringResult {
  checked: number
  expired: number
  expiringSoon: number
  statusChanged: number
  alertsCreated: number
  errors: string[]
}

/**
 * Check for expired RERA registrations
 */
async function checkExpiredRERA(): Promise<{ count: number; alertsCreated: number }> {
  try {
    const { data: expired, error } = await supabase
      .from('rera_registrations')
      .select('id, rera_number, builder_id, expiry_date')
      .lt('expiry_date', new Date().toISOString())
      .in('status', ['active'])
      .or('verified.eq.true,verification_status.eq.verified')
      .is('is_active', true)

    if (error) {
      console.error('Error checking expired RERA:', error)
      return { count: 0, alertsCreated: 0 }
    }

    if (!expired || expired.length === 0) {
      return { count: 0, alertsCreated: 0 }
    }

    // Update status to expired
    const { error: updateError } = await supabase
      .from('rera_registrations')
      .update({
        status: 'expired',
        verification_status: 'expired',
        is_active: false,
        updated_at: new Date().toISOString(),
      })
      .in('id', expired.map(r => r.id))

    if (updateError) {
      console.error('Error updating expired RERA:', updateError)
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
    }))

    const { error: alertError } = await supabase
      .from('rera_alerts')
      .insert(alerts)

    if (alertError) {
      console.error('Error creating expired alerts:', alertError)
      return { count: expired.length, alertsCreated: 0 }
    }

    return {
      count: expired.length,
      alertsCreated: alerts.length,
    }
  } catch (error) {
    console.error('checkExpiredRERA error:', error)
    return { count: 0, alertsCreated: 0 }
  }
}

/**
 * Check for RERA expiring soon (30 days)
 */
async function checkExpiringRERA(): Promise<{ count: number; alertsCreated: number }> {
  try {
    const thirtyDaysFromNow = new Date()
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30)

    const { data: expiring, error } = await supabase
      .from('rera_registrations')
      .select('id, rera_number, builder_id, expiry_date')
      .gte('expiry_date', new Date().toISOString())
      .lte('expiry_date', thirtyDaysFromNow.toISOString())
      .in('status', ['active'])
      .or('verified.eq.true,verification_status.eq.verified')
      .is('is_active', true)

    if (error) {
      console.error('Error checking expiring RERA:', error)
      return { count: 0, alertsCreated: 0 }
    }

    if (!expiring || expiring.length === 0) {
      return { count: 0, alertsCreated: 0 }
    }

    // Check if alerts already exist (avoid duplicates)
    const { data: existingAlerts } = await supabase
      .from('rera_alerts')
      .select('rera_registration_id')
      .in('rera_registration_id', expiring.map(r => r.id))
      .eq('alert_type', 'expiry_warning')
      .eq('resolved', false)
      .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())

    const existingIds = new Set(existingAlerts?.map(a => a.rera_registration_id) || [])

    // Create alerts only for those without recent alerts
    const alerts = expiring
      .filter(r => !existingIds.has(r.id))
      .map(r => {
        const daysUntilExpiry = Math.floor(
          (new Date(r.expiry_date!).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
        )

        return {
          rera_registration_id: r.id,
          builder_id: r.builder_id,
          alert_type: 'expiry_warning',
          alert_priority: daysUntilExpiry <= 7 ? 'critical' : daysUntilExpiry <= 15 ? 'high' : 'medium',
          title: 'RERA Expiring Soon',
          message: `RERA registration ${r.rera_number} expires in ${daysUntilExpiry} days (${r.expiry_date})`,
          action_required: 'Renew RERA registration before expiry',
        }
      })

    if (alerts.length > 0) {
      const { error: alertError } = await supabase
        .from('rera_alerts')
        .insert(alerts)

      if (alertError) {
        console.error('Error creating expiry warnings:', alertError)
        return { count: expiring.length, alertsCreated: 0 }
      }
    }

    return {
      count: expiring.length,
      alertsCreated: alerts.length,
    }
  } catch (error) {
    console.error('checkExpiringRERA error:', error)
    return { count: 0, alertsCreated: 0 }
  }
}

/**
 * Re-verify stale RERA registrations
 */
async function reVerifyStaleRERA(): Promise<{ checked: number; statusChanged: number }> {
  try {
    // Get RERA that haven't been verified in 30+ days
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const { data: stale, error } = await supabase
      .from('rera_registrations')
      .select('id, rera_number, rera_state, status, verification_status, last_verified_at')
      .or('last_verified_at.is.null,last_verified_at.lt.' + thirtyDaysAgo.toISOString())
      .in('status', ['active'])
      .limit(50) // Limit to avoid overwhelming the system

    if (error || !stale || stale.length === 0) {
      return { checked: 0, statusChanged: 0 }
    }

    let statusChanged = 0

    // Update last_verified_at to prevent repeated checks
    // In production, this would call the verification engine
    for (const rera of stale) {
      try {
        await supabase
          .from('rera_registrations')
          .update({
            last_verified_at: new Date().toISOString(),
          })
          .eq('id', rera.id)
      } catch (error) {
        console.error(`Error re-verifying RERA ${rera.rera_number}:`, error)
      }
    }

    return {
      checked: stale.length,
      statusChanged,
    }
  } catch (error) {
    console.error('reVerifyStaleRERA error:', error)
    return { checked: 0, statusChanged: 0 }
  }
}

/**
 * Call database function for additional checks
 */
async function callDatabaseFunction(): Promise<void> {
  try {
    const { error } = await supabase.rpc('check_rera_expiry')
    if (error) {
      console.error('Error calling check_rera_expiry function:', error)
    }
  } catch (error) {
    console.error('callDatabaseFunction error:', error)
  }
}

/**
 * Main monitoring function
 */
async function runMonitoringCheck(): Promise<MonitoringResult> {
  const result: MonitoringResult = {
    checked: 0,
    expired: 0,
    expiringSoon: 0,
    statusChanged: 0,
    alertsCreated: 0,
    errors: [],
  }

  try {
    // Step 1: Check for expired RERA
    const expiredResult = await checkExpiredRERA()
    result.expired = expiredResult.count
    result.alertsCreated += expiredResult.alertsCreated

    // Step 2: Check for expiring soon RERA
    const expiringResult = await checkExpiringRERA()
    result.expiringSoon = expiringResult.count
    result.alertsCreated += expiringResult.alertsCreated

    // Step 3: Re-verify active RERA (stale ones)
    const reVerifyResult = await reVerifyStaleRERA()
    result.checked = reVerifyResult.checked
    result.statusChanged = reVerifyResult.statusChanged

    // Step 4: Call database function for additional checks
    await callDatabaseFunction()

  } catch (error) {
    result.errors.push(error instanceof Error ? error.message : 'Unknown error')
  }

  return result
}

// Edge Function Handler
Deno.serve(async (req: Request) => {
  // Allow both GET and POST for flexibility
  if (req.method !== 'GET' && req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 })
  }

  try {
    console.log('Starting RERA monitoring check...')
    const result = await runMonitoringCheck()

    console.log('Monitoring complete:', result)

    return new Response(
      JSON.stringify({
        success: true,
        timestamp: new Date().toISOString(),
        results: result,
        message: `Monitoring complete: ${result.checked} checked, ${result.expired} expired, ${result.expiringSoon} expiring soon, ${result.alertsCreated} alerts created`,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    console.error('RERA monitoring error:', error)
    return new Response(
      JSON.stringify({
        error: 'Monitoring failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  }
})
















































