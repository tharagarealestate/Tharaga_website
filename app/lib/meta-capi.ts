import crypto from 'crypto'

/**
 * Meta Conversions API (CAPI) Integration
 * USP 4: Send highly qualified leads (Lion Tier / Score >= 75) to Meta
 * to optimize ad delivery for actual buyers, not just clickers.
 */

// Function to hash user data as required by Meta (SHA256, normalized)
const hashData = (data: string): string => {
  if (!data) return ''
  return crypto.createHash('sha256').update(data.trim().toLowerCase()).digest('hex')
}

export async function sendMetaConversionEvent({
  eventName = 'Lion_Lead_Qualified',
  email,
  phone,
  firstName,
  sourceUrl,
  clientIp,
  userAgent,
  fbp,
  fbc
}: {
  eventName?: string
  email?: string
  phone?: string
  firstName?: string
  sourceUrl?: string
  clientIp?: string
  userAgent?: string
  fbp?: string
  fbc?: string
}) {
  const PIXEL_ID = process.env.META_PIXEL_ID
  const ACCESS_TOKEN = process.env.META_CAPI_ACCESS_TOKEN

  if (!PIXEL_ID || !ACCESS_TOKEN) {
    console.warn('[Meta CAPI] Missing Pixel ID or Access Token. Event not logged.')
    return false
  }

  try {
    const timestamp = Math.floor(Date.now() / 1000)
    
    // Normalize phone (ensure strictly digits, optionally keep country code + if we were stricter, but standard is numbers only or E.164 without '+')
    const cleanPhone = phone ? phone.replace(/[^\d]/g, '') : undefined

    const payload = {
      data: [
        {
          event_name: eventName,
          event_time: timestamp,
          action_source: 'system_generated',
          event_source_url: sourceUrl || process.env.NEXT_PUBLIC_APP_URL || 'https://tharaga.co.in',
          user_data: {
            em: email ? [hashData(email)] : [],
            ph: cleanPhone ? [hashData(cleanPhone)] : [],
            fn: firstName ? [hashData(firstName)] : [],
            client_ip_address: clientIp,
            client_user_agent: userAgent,
            fbp: fbp,
            fbc: fbc
          },
          custom_data: {
            currency: 'INR',
            value: 7999 // Representing the value of a hot lead / subscription value
          }
        }
      ]
    }

    const res = await fetch(`https://graph.facebook.com/v19.0/${PIXEL_ID}/events?access_token=${ACCESS_TOKEN}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    })

    const result = await res.json()
    
    if (!res.ok) {
      console.error('[Meta CAPI] Graph API Error:', result)
      return false
    }

    console.log(`[Meta CAPI] Successfully logged ${eventName} to Pixel ${PIXEL_ID}`)
    return true
  } catch (err) {
    console.error('[Meta CAPI] Network or parsing error:', err)
    return false
  }
}
