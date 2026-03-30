import { beforeEach, expect, test, vi } from 'vitest'

// Import dynamically to allow env changes between tests

beforeEach(() => {
  delete (process.env as any).NEXT_PUBLIC_SUPABASE_URL
  delete (process.env as any).NEXT_PUBLIC_SUPABASE_ANON_KEY
  vi.resetModules()
})

test('getSupabase throws when env is missing', async () => {
  const mod = await import('@/lib/supabase')
  expect(() => mod.getSupabase()).toThrow()
})

test('getSupabase returns client when env present', async () => {
  ;(process.env as any).NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co'
  ;(process.env as any).NEXT_PUBLIC_SUPABASE_ANON_KEY = 'anon'
  const mod = await import('@/lib/supabase')
  const client = mod.getSupabase()
  expect(client).toBeTruthy()
  expect(typeof (client as any).from).toBe('function')
})
