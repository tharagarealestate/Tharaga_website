import React from 'react'
import BuilderUploadingIllustration from './illustrations/BuilderUploadingIllustration'
import AIMatchingIllustration from './illustrations/AIMatchingIllustration'
import DealClosedIllustration from './illustrations/DealClosedIllustration'

export default function HowItWorks() {
  return (
    <section
      aria-labelledby="how-title"
      style={{
        borderTop: '1px solid #eee',
        borderBottom: '1px solid #eee',
        background: 'linear-gradient(180deg, rgba(17,17,17,0.02), rgba(17,17,17,0.01))',
      }}
    >
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '24px 16px' }}>
        <h2 id="how-title" style={{ fontWeight: 800, fontSize: 22, margin: '0 0 16px' }}>
          How it works
        </h2>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: 14,
          }}
        >
          <div style={{ background: '#fff', border: '1px solid #eee', borderRadius: 16, padding: 16 }}>
            <div style={{ height: 160 }}>
              <BuilderUploadingIllustration />
            </div>
            <h3 style={{ fontWeight: 700, fontSize: 16, margin: '8px 0 6px' }}>1) Upload your project</h3>
            <p style={{ color: '#444', margin: 0 }}>
              Add photos, videos, and floor plans. Our AI preps a builder‑grade story.
            </p>
          </div>

          <div style={{ background: '#fff', border: '1px solid #eee', borderRadius: 16, padding: 16 }}>
            <div style={{ height: 160 }}>
              <AIMatchingIllustration />
            </div>
            <h3 style={{ fontWeight: 700, fontSize: 16, margin: '8px 0 6px' }}>2) AI matches buyers</h3>
            <p style={{ color: '#444', margin: 0 }}>
              Neural matching routes intent‑fit buyers and qualifies them automatically.
            </p>
          </div>

          <div style={{ background: '#fff', border: '1px solid #eee', borderRadius: 16, padding: 16 }}>
            <div style={{ height: 160 }}>
              <DealClosedIllustration />
            </div>
            <h3 style={{ fontWeight: 700, fontSize: 16, margin: '8px 0 6px' }}>3) Close deals faster</h3>
            <p style={{ color: '#444', margin: 0 }}>
              Share a clean dashboard, handshake on price, and notify on mobile.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
