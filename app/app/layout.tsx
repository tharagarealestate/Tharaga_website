import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Tharaga — Premium Real Estate',
  description: 'AI-powered real estate assistant',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.webmanifest" />
        <meta name="theme-color" content="#6e0d25" />
      </head>
      <body className="font-inter bg-brandWhite text-plum">
        <script dangerouslySetInnerHTML={{ __html: `
          (function(){
            if ('serviceWorker' in navigator) {
              window.addEventListener('load', function(){
                navigator.serviceWorker.register('/sw.js').catch(function(){});
              });
            }
          })();
        `}} />
        <header className="border-b border-plum/10 bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60">
          <nav className="mx-auto max-w-6xl px-6 py-3 flex gap-4 text-sm">
            <a href="/" className="font-bold">Tharaga</a>
            <a href="/property-listing/" className="hover:underline">Browse</a>
            <a href="/tools/cost-calculator" className="hover:underline">Cost</a>
            <a href="/pricing/" className="hover:underline">Pricing</a>
            <a href="/tools/currency-risk" className="hover:underline">FX Risk</a>
            <a href="/tools/vastu" className="hover:underline">Vastu</a>
            <a href="/tools/voice-tamil" className="hover:underline">தமிழ் Voice</a>
            <a href="/tours" className="hover:underline">Tours</a>
            <a href="/dashboard/map" className="hover:underline">Map</a>
            <a href="/dashboard/market" className="hover:underline">Market</a>
            <a href="/saved" className="hover:underline">Saved</a>
            <a href="/tools/roi" className="hover:underline">ROI</a>
            <a href="/tools/environment" className="hover:underline">Env</a>
            <a href="/filters/radial" className="hover:underline">Filters</a>
          </nav>
        </header>
        {children}
        {/* Web Vitals reporting */}
        <script dangerouslySetInnerHTML={{ __html: `
          (function(){
            function report(name, value){
              try{ navigator.sendBeacon && navigator.sendBeacon('/api/__vitals', JSON.stringify({ name, value, t: Date.now() })); }catch(_){ }
            }
            try{
              if ('PerformanceObserver' in window) {
                new PerformanceObserver((list) => { for (const entry of list.getEntries()) report(entry.name, entry.value) }).observe({ type: 'largest-contentful-paint', buffered: true });
                new PerformanceObserver((list) => { for (const entry of list.getEntries()) report('CLS', entry.value) }).observe({ type: 'layout-shift', buffered: true });
              }
            }catch(_){ }
          })();
        `}} />
      </body>
    </html>
  )
}

