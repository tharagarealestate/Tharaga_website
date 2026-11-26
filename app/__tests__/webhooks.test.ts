import { describe, expect, it } from 'vitest'
import { WebhookManager, type WebhookPayload } from '@/lib/webhooks/manager'

const stubClient = {
  from: () => stubClient,
  select: () => stubClient,
  eq: () => stubClient,
  order: () => stubClient,
  limit: () => stubClient,
  contains: () => stubClient,
  insert: () => ({ select: () => ({ single: async () => ({ data: null, error: null }) }) }),
  update: () => ({ eq: () => ({ select: () => ({ single: async () => ({ data: null, error: null }) }) }) }),
  delete: () => ({ eq: () => ({ error: null }) }),
  rpc: async () => ({ data: null, error: null }),
} as any

describe('WebhookManager security helpers', () => {
  const manager = new WebhookManager(stubClient, stubClient)

  it('generates deterministic signatures for identical payloads', () => {
    const payload: WebhookPayload = {
      event: 'lead.created',
      timestamp: '2025-01-01T00:00:00.000Z',
      data: { id: '123', email: 'demo@example.com' },
    }

    const secret = 'test-secret'
    const sig1 = (manager as any).generateSignature(payload, secret)
    const sig2 = (manager as any).generateSignature(payload, secret)

    expect(sig1).toBe(sig2)
    expect(sig1.startsWith('sha256=')).toBe(true)
  })

  it('validates signatures using timing-safe comparison', () => {
    const payload = JSON.stringify({
      event: 'lead.scored',
      timestamp: '2025-01-02T10:00:00.000Z',
      data: { score: 9 },
    })
    const secret = 'another-secret'
    const signature = (manager as any).generateSignature(JSON.parse(payload), secret)

    expect(manager.verifySignature(payload, signature, secret)).toBe(true)
    expect(manager.verifySignature(payload, signature, 'wrong-secret')).toBe(false)
    expect(manager.verifySignature(payload, 'sha256=invalid', secret)).toBe(false)
  })

  it('evaluates filter matching correctly', () => {
    const data = { score: 9, stage: 'hot', city: 'Chennai' }
    const filters = { score_min: 8, stage: ['hot', 'warm'], city: 'Chennai' }
    const mismatchFilters = { score_max: 5 }

    expect((manager as any).matchesFilters(data, filters)).toBe(true)
    expect((manager as any).matchesFilters(data, mismatchFilters)).toBe(false)
  })
})

