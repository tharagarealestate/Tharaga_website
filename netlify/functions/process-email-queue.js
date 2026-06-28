/**
 * Netlify Scheduled Function — process-email-queue
 * Runs every 30 minutes to send due drip emails from email_sequence_queue.
 *
 * Netlify cron syntax (in netlify.toml):
 *   schedule = "*/30 * * * *"
 *
 * This function calls the Next.js API route that processes the queue.
 * Using a separate Netlify function for scheduling keeps the Next.js route
 * usable as a regular endpoint too (for manual triggers / health checks).
 */

exports.handler = async function (event) {
  const baseUrl = process.env.DEPLOY_URL || process.env.URL || 'https://tharaga.co.in'
  const endpoint = `${baseUrl}/api/automation/email/process-sequence-queue`
  const secret = process.env.CRON_SECRET

  console.log('[EmailQueueCron] Triggering sequence queue processor at:', endpoint)

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(secret ? { Authorization: `Bearer ${secret}` } : {}),
      },
      body: JSON.stringify({ source: 'netlify-cron' }),
    })

    let body = {}
    try { body = await res.json() } catch { body = { raw: await res.text() } }

    if (res.ok) {
      console.log(`[EmailQueueCron] ✅ Processed: ${body.processed ?? 0} emails (sent: ${body.sent ?? 0}, failed: ${body.failed ?? 0})`)
      return { statusCode: 200, body: JSON.stringify(body) }
    } else {
      console.error('[EmailQueueCron] ❌ Processor returned error:', res.status, body)
      return { statusCode: res.status, body: JSON.stringify(body) }
    }
  } catch (err) {
    console.error('[EmailQueueCron] ❌ Fetch failed:', err.message)
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) }
  }
}
