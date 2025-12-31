"use client"

import { useCallback, useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { TextArea } from '@/components/ui/TextArea'
import { Badge } from '@/components/ui/Badge'
import { BuilderPageWrapper } from '../_components/BuilderPageWrapper'

type WebhookRow = {
  id: string
  name: string
  url: string
  secret_key: string
  events: string[]
  is_active: boolean
  retry_count: number
  timeout_seconds: number
  filters?: Record<string, any> | null
  total_deliveries: number
  successful_deliveries: number
  failed_deliveries: number
  last_delivery_at?: string | null
  last_delivery_status?: string | null
}

type DeliveryLog = {
  id: string
  event_type: string
  status: string
  attempt_number: number
  status_code?: number | null
  response_time_ms?: number | null
  error_message?: string | null
  created_at: string
}

type BannerState = { type: 'success' | 'error'; message: string }

const EVENT_OPTIONS: Array<{ value: string; label: string; description: string }> = [
  { value: 'lead.created', label: 'Lead Created', description: 'Triggered when a new lead is captured' },
  { value: 'lead.updated', label: 'Lead Updated', description: 'Triggered when lead details change' },
  { value: 'lead.scored', label: 'Lead Scored', description: 'Triggered when AI recalculates the score' },
  { value: 'lead.converted', label: 'Lead Converted', description: 'Triggered when a lead converts to buyer' },
  { value: 'automation.run.started', label: 'Automation Started', description: 'Automation workflow kicked off' },
  { value: 'automation.run.completed', label: 'Automation Completed', description: 'Workflow finished all steps' },
  { value: 'campaign.email.sent', label: 'Email Sent', description: 'Email campaign dispatched to a contact' },
  { value: 'campaign.email.opened', label: 'Email Opened', description: 'Recipient opened the email campaign' },
]

const gradientBackground =
  'before:absolute before:inset-0 before:bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.12),_transparent_60%),radial-gradient(circle_at_bottom,_rgba(245,158,11,0.08),_transparent_55%)] before:pointer-events-none'

export default function BuilderCommunicationsPage() {
  const [webhooks, setWebhooks] = useState<WebhookRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedWebhookId, setSelectedWebhookId] = useState<string | null>(null)
  const [deliveries, setDeliveries] = useState<DeliveryLog[]>([])
  const [deliveriesState, setDeliveriesState] = useState<'idle' | 'loading' | 'error'>('idle')
  const [banner, setBanner] = useState<BannerState | null>(null)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)
  const [filtersInput, setFiltersInput] = useState('')
  const [eventSelections, setEventSelections] = useState<string[]>(['lead.created'])

  const [form, setForm] = useState({
    name: '',
    url: '',
    retry_count: 3,
    timeout_seconds: 30,
  })

  const selectedWebhook = useMemo(
    () => webhooks.find((hook) => hook.id === selectedWebhookId) ?? null,
    [webhooks, selectedWebhookId],
  )

  const successRate = useCallback((hook: WebhookRow) => {
    if (!hook.total_deliveries) return '—'
    const pct = (hook.successful_deliveries / hook.total_deliveries) * 100
    return `${pct.toFixed(1)}%`
  }, [])

  const fetchWebhooks = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/builder/webhooks', { cache: 'no-store' })
      if (!res.ok) {
        throw new Error((await res.json().catch(() => null))?.error ?? 'Failed to load webhooks')
      }
      const json = await res.json()
      const items: WebhookRow[] = json.webhooks ?? []
      setWebhooks(items)
      setSelectedWebhookId((prev) => {
        if (!items.length) return null
        if (prev && items.some((hook) => hook.id === prev)) {
          return prev
        }
        return items[0].id
      })
    } catch (err: any) {
      setError(err?.message ?? 'Unable to fetch webhooks')
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchDeliveries = useCallback(
    async (webhookId: string) => {
      setDeliveriesState('loading')
      try {
        const res = await fetch(`/api/builder/webhooks/${webhookId}/deliveries?limit=25`, { cache: 'no-store' })
        if (!res.ok) {
          throw new Error((await res.json().catch(() => null))?.error ?? 'Failed to load deliveries')
        }
        const json = await res.json()
        setDeliveries(json.deliveries ?? [])
        setDeliveriesState('idle')
      } catch (err) {
        console.error(err)
        setDeliveriesState('error')
      }
    },
    [],
  )

  useEffect(() => {
    fetchWebhooks()
  }, [fetchWebhooks])

  useEffect(() => {
    if (selectedWebhookId) {
      fetchDeliveries(selectedWebhookId)
    } else {
      setDeliveries([])
    }
  }, [selectedWebhookId, fetchDeliveries])

  useEffect(() => {
    if (!banner) return
    const timer = setTimeout(() => setBanner(null), 4000)
    return () => clearTimeout(timer)
  }, [banner])

  const handleCreateWebhook = async () => {
    setIsSubmitting(true)
    setCreateError(null)

    if (!form.name.trim() || !form.url.trim()) {
      setCreateError('Name and URL are required.')
      setIsSubmitting(false)
      return
    }

    if (!eventSelections.length) {
      setCreateError('Select at least one event to subscribe to.')
      setIsSubmitting(false)
      return
    }

    let filters: Record<string, any> | undefined
    if (filtersInput.trim()) {
      try {
        filters = JSON.parse(filtersInput)
      } catch (err: any) {
        setCreateError(`Filters JSON invalid: ${err?.message ?? 'Unknown error'}`)
        setIsSubmitting(false)
        return
      }
    }

    try {
      const retryCount = Math.min(5, Math.max(1, Number(form.retry_count) || 3))
      const timeoutSeconds = Math.min(90, Math.max(5, Number(form.timeout_seconds) || 30))

      const res = await fetch('/api/builder/webhooks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name.trim(),
          url: form.url.trim(),
          events: eventSelections,
          retry_count: retryCount,
          timeout_seconds: timeoutSeconds,
          filters,
        }),
      })

      if (!res.ok) {
        throw new Error((await res.json().catch(() => null))?.error ?? 'Unable to create webhook')
      }

      setBanner({ type: 'success', message: 'Webhook registered successfully' })
      setForm({ name: '', url: '', retry_count: 3, timeout_seconds: 30 })
      setFiltersInput('')
      setEventSelections(['lead.created'])
      setShowCreateForm(false)
      await fetchWebhooks()
    } catch (err: any) {
      setBanner({ type: 'error', message: err?.message ?? 'Failed to create webhook' })
    } finally {
      setIsSubmitting(false)
    }
  }

  const mutateWebhook = useCallback(
    async (webhookId: string, payload: Record<string, unknown>, successMessage: string) => {
      try {
        const res = await fetch(`/api/builder/webhooks/${webhookId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        if (!res.ok) {
          throw new Error((await res.json().catch(() => null))?.error ?? 'Request failed')
        }
        setBanner({ type: 'success', message: successMessage })
        await fetchWebhooks()
        if (selectedWebhookId) {
          await fetchDeliveries(selectedWebhookId)
        }
      } catch (err: any) {
        setBanner({ type: 'error', message: err?.message ?? 'Action failed' })
      }
    },
    [fetchDeliveries, fetchWebhooks, selectedWebhookId],
  )

  const handleToggleActive = (hook: WebhookRow) => {
    void mutateWebhook(
      hook.id,
      { is_active: !hook.is_active },
      !hook.is_active ? 'Webhook activated' : 'Webhook disabled',
    )
  }

  const handleRotateSecret = (hook: WebhookRow) => {
    void (async () => {
      try {
        const res = await fetch(`/api/builder/webhooks/${hook.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ rotate_secret: true }),
        })
        if (!res.ok) {
          throw new Error((await res.json().catch(() => null))?.error ?? 'Unable to rotate secret')
        }
        const json = await res.json()
        const newSecret = json.secret as string | undefined
        setBanner({
          type: 'success',
          message: newSecret
            ? `Secret regenerated. Update your integrations: ${newSecret}`
            : 'Secret regenerated. Update your integrations.',
        })
        await fetchWebhooks()
      } catch (err: any) {
        setBanner({ type: 'error', message: err?.message ?? 'Failed to rotate secret' })
      }
    })()
  }

  const handleDelete = (hook: WebhookRow) => {
    if (!confirm(`Delete webhook "${hook.name}"? This cannot be undone.`)) return
    void (async () => {
      try {
        const res = await fetch(`/api/builder/webhooks/${hook.id}`, { method: 'DELETE' })
        if (!res.ok) {
          throw new Error((await res.json().catch(() => null))?.error ?? 'Unable to delete webhook')
        }
        setBanner({ type: 'success', message: 'Webhook removed' })
        if (selectedWebhookId === hook.id) {
          setSelectedWebhookId(null)
          setDeliveries([])
        }
        await fetchWebhooks()
      } catch (err: any) {
        setBanner({ type: 'error', message: err?.message ?? 'Failed to delete webhook' })
      }
    })()
  }

  const handleTest = (hook: WebhookRow) => {
    void (async () => {
      try {
        const res = await fetch(`/api/builder/webhooks/${hook.id}/test`, { method: 'POST' })
        if (!res.ok) {
          throw new Error((await res.json().catch(() => null))?.result?.error ?? 'Test delivery failed')
        }
        const result = await res.json()
        setBanner({
          type: 'success',
          message: `Test delivered in ${result.result?.response_time_ms ?? 0}ms (status ${
            result.result?.status_code ?? 200
          })`,
        })
        if (selectedWebhookId === hook.id) {
          await fetchDeliveries(hook.id)
        }
        await fetchWebhooks()
      } catch (err: any) {
        setBanner({ type: 'error', message: err?.message ?? 'Test delivery failed' })
      }
    })()
  }

  const handleSelectWebhook = (hook: WebhookRow) => {
    setSelectedWebhookId(hook.id)
  }

  const formattedDate = (value?: string | null) => {
    if (!value) return 'Never'
    try {
      const date = new Date(value)
      return `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`
    } catch {
      return value
    }
  }

  const totalStats = useMemo(() => {
    const totals = webhooks.reduce(
      (acc, hook) => {
        acc.total += hook.total_deliveries ?? 0
        acc.success += hook.successful_deliveries ?? 0
        acc.failed += hook.failed_deliveries ?? 0
        return acc
      },
      { total: 0, success: 0, failed: 0 },
    )
    const pct = totals.total ? Math.round((totals.success / totals.total) * 100) : 0
    return { ...totals, pct }
  }, [webhooks])

  return (
    <BuilderPageWrapper 
      title="Real-Time Integrations Dashboard" 
      description="Manage webhooks and monitor delivery status"
      noContainer
    >
      <div className="space-y-6">
        {/* Status Badge - Design System */}
        <div className="inline-flex items-center rounded-full border border-amber-300/20 bg-amber-500/10 px-3 py-1 text-xs uppercase tracking-wide text-amber-300">
          Webhook Delivery Control Center
        </div>
                Manage webhook endpoints, monitor delivery health, and automate retries with the same clarity as our
                pricing experience. Built for mission-critical automations.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button variant="secondary" onClick={() => setShowCreateForm((prev) => !prev)}>
                {showCreateForm ? 'Close Webhook Form' : 'Register New Webhook'}
              </Button>
              <Button variant="primary" onClick={() => fetchWebhooks()} disabled={loading}>
                Refresh
              </Button>
            </div>
          </div>
          {banner && (
            <div
              className={`rounded-lg border px-4 py-3 text-sm shadow ${
                banner.type === 'success'
                  ? 'border-emerald-300/40 bg-emerald-500/10 text-emerald-100'
                  : 'border-rose-400/40 bg-rose-500/10 text-rose-100'
              }`}
            >
              {banner.message}
            </div>
          )}
        </header>

        {showCreateForm && (
          <section className="bg-gradient-to-br from-slate-800/95 via-slate-800/95 to-slate-900/95 glow-border rounded-xl overflow-hidden shadow-2xl p-6 space-y-6">
            <div>
              <h2 className="text-xl font-semibold">Webhook Registration</h2>
              <p className="text-sm text-white/70">
                Securely register destinations for events. Signature verification is enabled automatically.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-xs uppercase tracking-wide text-white/60">Display Name</label>
                <Input
                  value={form.name}
                  maxLength={120}
                  placeholder="e.g. CRM Lead Import"
                  onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs uppercase tracking-wide text-white/60">Destination URL</label>
                <Input
                  value={form.url}
                  placeholder="https://example.com/webhooks/leads"
                  onChange={(event) => setForm((prev) => ({ ...prev, url: event.target.value }))}
                />
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-3">
                <span className="text-xs uppercase tracking-wide text-white/60">Subscribed Events</span>
                <div className="grid gap-3">
                  {EVENT_OPTIONS.map((event) => {
                    const checked = eventSelections.includes(event.value)
                    return (
                      <label
                        key={event.value}
                        className={`flex cursor-pointer items-center justify-between rounded-lg border p-3 transition ${
                          checked ? 'bg-amber-500/20 border-amber-300/50' : 'bg-slate-700/30 border-slate-600/30 hover:border-slate-500/50'
                        }`}
                      >
                        <div>
                          <div className="text-sm font-medium">{event.label}</div>
                          <div className="text-xs text-white/60">{event.description}</div>
                        </div>
                        <input
                          type="checkbox"
                          className="h-4 w-4 accent-emerald-500"
                          checked={checked}
                          onChange={() =>
                            setEventSelections((prev) =>
                              checked ? prev.filter((val) => val !== event.value) : [...prev, event.value],
                            )
                          }
                        />
                      </label>
                    )
                  })}
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs uppercase tracking-wide text-white/60">Filter JSON (optional)</label>
                  <TextArea
                    rows={7}
                    value={filtersInput}
                    placeholder='{"score_min": 7, "stage": ["hot", "warm"]}'
                    onChange={(event) => setFiltersInput(event.target.value)}
                  />
                  <p className="text-xs text-white/50">
                    Use filters to control payload delivery. Example: `{{"score_min":8,"category":"hot"}}`
                  </p>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="text-xs uppercase tracking-wide text-white/60">Retries</label>
                  <Input type="number" min={1} max={5} value={form.retry_count} onChange={(event) => setForm((prev) => ({ ...prev, retry_count: Number(event.target.value) }))} />
                  </div>
                  <div>
                    <label className="text-xs uppercase tracking-wide text-white/60">Timeout (seconds)</label>
                  <Input type="number" min={5} max={90} value={form.timeout_seconds} onChange={(event) => setForm((prev) => ({ ...prev, timeout_seconds: Number(event.target.value) }))} />
                  </div>
                </div>
              </div>
            </div>

            {createError && <div className="rounded-md border border-rose-400/50 bg-rose-500/10 px-3 py-2 text-xs text-rose-100">{createError}</div>}

            <div className="flex flex-wrap gap-3">
              <Button variant="primary" onClick={handleCreateWebhook} disabled={isSubmitting}>
                {isSubmitting ? 'Registering…' : 'Register Webhook'}
              </Button>
              <Button variant="invisible" onClick={() => setShowCreateForm(false)}>
                Cancel
              </Button>
            </div>
          </section>
        )}

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-4 shadow-inner shadow-slate-900/30">
            <div className="text-xs uppercase text-white/60">Active Webhooks</div>
            <div className="mt-2 text-2xl font-semibold">{webhooks.filter((hook) => hook.is_active).length}</div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
            <div className="text-xs uppercase text-white/60">Deliveries</div>
            <div className="mt-2 text-2xl font-semibold">{totalStats.total}</div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
            <div className="text-xs uppercase text-white/60">Success Rate</div>
            <div className="mt-2 text-2xl font-semibold">{totalStats.pct}%</div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
            <div className="text-xs uppercase text-white/60">Failed Deliveries</div>
            <div className="mt-2 text-2xl font-semibold">{totalStats.failed}</div>
          </div>
        </section>

        <section className="bg-gradient-to-br from-slate-800/95 via-slate-800/95 to-slate-900/95 glow-border rounded-xl overflow-hidden shadow-2xl">
          <div className="overflow-auto">
            <table className="min-w-[820px] w-full text-sm text-white/90">
              <thead>
                <tr className="bg-slate-700/30 text-slate-300 uppercase text-xs">
                  <th className="px-4 py-3 text-left">Webhook</th>
                  <th className="px-4 py-3 text-left">Events</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left">Last Delivery</th>
                  <th className="px-4 py-3 text-left">Success Rate</th>
                  <th className="px-4 py-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-6 text-center text-white/60">
                      Loading webhook configuration…
                    </td>
                  </tr>
                ) : !webhooks.length ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-6 text-center text-white/60">
                      No webhooks registered yet. Use <strong>Register New Webhook</strong> to get started.
                    </td>
                  </tr>
                ) : (
                  webhooks.map((hook) => (
                    <tr
                      key={hook.id}
                      className={`border-t border-slate-700/50 transition hover:bg-slate-700/30 ${
                        selectedWebhookId === hook.id ? 'bg-white/[0.05]' : ''
                      }`}
                    >
                      <td className="px-4 py-3">
                        <button
                          className="text-left text-sm font-semibold text-white hover:underline"
                          onClick={() => handleSelectWebhook(hook)}
                        >
                          {hook.name}
                        </button>
                        <div className="mt-1 text-xs text-white/60 break-all">{hook.url}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-2">
                          {hook.events.map((event) => (
                            <Badge key={event} tone="default">
                              {event}
                            </Badge>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge tone={hook.is_active ? 'success' : 'danger'}>
                          {hook.is_active ? 'Active' : 'Disabled'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-sm">{formattedDate(hook.last_delivery_at)}</td>
                      <td className="px-4 py-3 text-sm">{successRate(hook)}</td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-2">
                          <Button size="sm" variant="secondary" onClick={() => handleSelectWebhook(hook)}>
                            Logs
                          </Button>
                          <Button size="sm" variant="secondary" onClick={() => handleTest(hook)}>
                            Test
                          </Button>
                          <Button size="sm" variant="invisible" onClick={() => handleToggleActive(hook)}>
                            {hook.is_active ? 'Disable' : 'Activate'}
                          </Button>
                          <Button size="sm" variant="invisible" onClick={() => handleRotateSecret(hook)}>
                            Rotate Secret
                          </Button>
                          <Button size="sm" variant="danger" onClick={() => handleDelete(hook)}>
                            Delete
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {error && (
            <div className="border-t border-rose-500/30 bg-rose-500/10 px-4 py-3 text-center text-sm text-rose-100">
              {error}
            </div>
          )}
        </section>

        {selectedWebhook && (
          <section className="grid gap-6 lg:grid-cols-[2.2fr_1fr]">
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold">{selectedWebhook.name}</h2>
                  <p className="text-xs text-white/60">Delivery history & retries</p>
                </div>
                <Badge tone="default">Webhook ID • {selectedWebhook.id.slice(0, 8)}...</Badge>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
                  <div className="text-xs uppercase text-white/60">Total Deliveries</div>
                  <div className="mt-2 text-xl font-semibold">{selectedWebhook.total_deliveries ?? 0}</div>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
                  <div className="text-xs uppercase text-white/60">Success</div>
                  <div className="mt-2 text-xl font-semibold text-emerald-300">
                    {selectedWebhook.successful_deliveries ?? 0}
                  </div>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
                  <div className="text-xs uppercase text-white/60">Failures</div>
                  <div className="mt-2 text-xl font-semibold text-rose-300">
                    {selectedWebhook.failed_deliveries ?? 0}
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-white/10 bg-white/[0.03]">
                <div className="overflow-hidden">
                  <table className="min-w-full text-sm text-white/80">
                    <thead className="bg-white/[0.05] text-xs uppercase text-white/60">
                      <tr>
                        <th className="px-3 py-2 text-left">Event</th>
                        <th className="px-3 py-2 text-left">Status</th>
                        <th className="px-3 py-2 text-left">Attempt</th>
                        <th className="px-3 py-2 text-left">HTTP</th>
                        <th className="px-3 py-2 text-left">Response Time</th>
                        <th className="px-3 py-2 text-left">Timestamp</th>
                      </tr>
                    </thead>
                    <tbody>
                      {deliveriesState === 'loading' ? (
                        <tr>
                          <td colSpan={6} className="px-3 py-4 text-center text-white/60">
                            Fetching delivery logs…
                          </td>
                        </tr>
                      ) : deliveriesState === 'error' ? (
                        <tr>
                          <td colSpan={6} className="px-3 py-4 text-center text-rose-200">
                            Unable to load delivery logs. Try refreshing.
                          </td>
                        </tr>
                      ) : !deliveries.length ? (
                        <tr>
                          <td colSpan={6} className="px-3 py-4 text-center text-white/60">
                            No deliveries recorded yet.
                          </td>
                        </tr>
                      ) : (
                        deliveries.map((log) => (
                          <tr key={log.id} className="border-t border-white/10">
                            <td className="px-3 py-2">{log.event_type}</td>
                            <td className="px-3 py-2">
                              <Badge
                                tone={
                                  log.status === 'success'
                                    ? 'success'
                                    : log.status === 'retrying'
                                    ? 'attention'
                                    : log.status === 'failed'
                                    ? 'danger'
                                    : 'default'
                                }
                              >
                                {log.status}
                              </Badge>
                            </td>
                            <td className="px-3 py-2">{log.attempt_number}</td>
                            <td className="px-3 py-2">{log.status_code ?? '—'}</td>
                            <td className="px-3 py-2">{log.response_time_ms ? `${log.response_time_ms}ms` : '—'}</td>
                            <td className="px-3 py-2 text-xs text-white/60">{formattedDate(log.created_at)}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <aside className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 space-y-4">
              <div>
                <h3 className="text-lg font-semibold">Endpoint configuration</h3>
                <p className="text-xs text-white/60">Keep this information in sync with your downstream integrations.</p>
              </div>
              <div className="space-y-3 text-sm">
                <div>
                  <div className="text-xs uppercase text-white/50">URL</div>
                  <div className="mt-1 break-all text-white/90">{selectedWebhook.url}</div>
                </div>
                <div>
                  <div className="text-xs uppercase text-white/50">Secret key</div>
                  <div className="mt-1 break-all font-mono text-xs tracking-wide text-emerald-200">
                    {selectedWebhook.secret_key}
                  </div>
                </div>
                <div>
                  <div className="text-xs uppercase text-white/50">Timeout • Retries</div>
                  <div className="mt-1">
                    {selectedWebhook.timeout_seconds}s timeout • {selectedWebhook.retry_count} retries
                  </div>
                </div>
                {selectedWebhook.filters && (
                  <div>
                    <div className="text-xs uppercase text-white/50">Filters</div>
                    <pre className="mt-1 whitespace-pre-wrap rounded-lg border border-white/10 bg-black/40 p-3 text-xs text-white/70">
                      {JSON.stringify(selectedWebhook.filters, null, 2)}
                    </pre>
                  </div>
                )}
                <div>
                  <div className="text-xs uppercase text-white/50">Last status</div>
                  <div className="mt-1 text-sm text-white/80">{selectedWebhook.last_delivery_status ?? '—'}</div>
                </div>
              </div>
              <div className="rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-3 text-xs text-emerald-100">
                Sign your payload with the provided secret using the header <code>X-Webhook-Signature</code>. We accept
                <code> HMAC-SHA256</code> signatures.
              </div>
            </aside>
          </section>
        )}
      </div>
    </div>
  )
}

