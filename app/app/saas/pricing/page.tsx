"use client"
import { FeatureGate, useEntitlements } from '@/components/ui/FeatureGate'
import { PayButton } from '@/components/ui/PayButton'

const rows = [
  { name: 'Listings', free: '1', growth: '5', pro: 'Unlimited' },
  { name: 'Leads/month', free: '10', growth: '100', pro: '500' },
  { name: 'AI image enhancement', free: '—', growth: 'Yes', pro: 'Yes' },
  { name: 'AI video walkthrough', free: '—', growth: '—', pro: 'Yes' },
  { name: 'Microsite 3D + EMI', free: '—', growth: 'Yes', pro: 'Yes' },
  { name: 'Automation (WA/Email/SMS)', free: '—', growth: 'Basic', pro: 'Advanced' },
  { name: 'Analytics', free: '—', growth: 'Basic', pro: 'Advanced' },
]

export default function Pricing(){
  const { tier } = useEntitlements()
  return (
    <main className="mx-auto max-w-5xl px-6 py-8">
      <h1 className="text-2xl font-bold mb-4">Pricing</h1>
      <p className="text-sm text-fgMuted mb-6">Current tier: <b>{tier}</b>. Annual discount on Growth: 20%.</p>
      <div className="overflow-auto border border-border rounded">
        <table className="min-w-[720px] w-full text-sm">
          <thead>
            <tr className="bg-muted/40">
              <th className="text-left p-3">Feature</th>
              <th className="text-left p-3">Free</th>
              <th className="text-left p-3">Growth</th>
              <th className="text-left p-3">Pro</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(r => (
              <tr key={r.name} className="border-t border-border">
                <td className="p-3 font-medium">{r.name}</td>
                <td className="p-3">{r.free}</td>
                <td className="p-3">{r.growth}</td>
                <td className="p-3">{r.pro}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-4 flex gap-3 items-center">
        <PayButton tier="growth" />
        <PayButton tier="pro" />
        <span className="text-xs text-fgMuted">Annual discount on Growth: 20%.</span>
      </div>
      <div className="mt-6 text-xs text-fgMuted">Free trial includes Growth for 14 days. Grace period for past‑due: 30 days.</div>
    </main>
  )
}
