import { cookies } from 'next/headers'

function generateSessionId(): string {
  // Simple URL-safe random id
  const rand = Math.random().toString(36).slice(2)
  const time = Date.now().toString(36)
  return `sid_${time}_${rand}`
}

export function getOrCreateSessionId(): string {
  const store = cookies()
  const existing = store.get('thg_sid')?.value
  if (existing && existing.length > 0) {
    return existing
  }
  const sid = generateSessionId()
  // 180 days, Secure, Lax
  const maxAge = 60 * 60 * 24 * 180
  store.set('thg_sid', sid, {
    httpOnly: false,
    sameSite: 'lax',
    secure: true,
    path: '/',
    maxAge,
  })
  return sid
}

