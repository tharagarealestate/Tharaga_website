// Supabase Edge Function (Deno) to send Web Push notifications
// Deploy with Supabase CLI: supabase functions deploy send-push

import webpush from 'npm:web-push'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || Deno.env.get('SUPABASE_SERVICE_ROLE')!
const VAPID_PUBLIC_KEY = Deno.env.get('VAPID_PUBLIC_KEY')!
const VAPID_PRIVATE_KEY = Deno.env.get('VAPID_PRIVATE_KEY')!

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

webpush.setVapidDetails('mailto:support@tharaga.co.in', VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY)

type PushPayload = { title: string; message: string; url?: string }

async function sendToUser(userId: string, payload: PushPayload) {
  const { data, error } = await supabase
    .from('push_subscriptions')
    .select('subscription')
    .eq('user_id', userId)
  if (error) throw error
  if (!data || data.length === 0) return { sent: 0 }
  let sent = 0
  for (const row of data) {
    try {
      const sub = row.subscription
      await webpush.sendNotification(sub, JSON.stringify(payload))
      sent++
    } catch (_) {
      // Ignore per-subscription errors; could delete invalid endpoints in future
    }
  }
  return { sent }
}

serve(async (req: Request) => {
  if (req.method !== 'POST') return new Response('Method Not Allowed', { status: 405 })
  try {
    const { user_id, title, message, url } = await req.json()
    if (!user_id || !title || !message) return new Response('Bad Request', { status: 400 })
    const result = await sendToUser(String(user_id), { title: String(title), message: String(message), url: url ? String(url) : undefined })
    return new Response(JSON.stringify({ ok: true, ...result }), { headers: { 'content-type': 'application/json' } })
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: String(e) }), { status: 500, headers: { 'content-type': 'application/json' } })
  }
})


