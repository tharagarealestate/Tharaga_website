export default function SaaSHome(){
  return (
    <main className="mx-auto max-w-5xl px-6 py-8">
      <h1 className="text-2xl font-bold mb-2">Builder SaaS</h1>
      <p className="text-fgMuted">Start your 14‑day Growth trial. Add a project, capture leads, and publish a microsite.</p>
      <div className="mt-4 flex gap-3">
        <a className="underline" href="/app/saas/pricing">See pricing</a>
        <a className="underline" href="/app/builders/add-property">Add a property</a>
        <a className="underline" href="/app/saas/dashboard">Open dashboard</a>
      </div>
    </main>
  )
}
