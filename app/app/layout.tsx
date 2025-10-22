import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Tharaga — Premium Real Estate',
  description: 'AI-powered real estate assistant',
}

import { EntitlementsProvider } from '@/components/ui/FeatureGate'
import LanguageSelector from '@/components/LanguageSelector'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.webmanifest" />
        <meta name="theme-color" content="#ffffff" />
        <script dangerouslySetInnerHTML={{ __html: `
          (function(){
            try {
              var stored = localStorage.getItem('thg.theme');
              var mode = stored || (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
              document.documentElement.setAttribute('data-color-mode', mode);
              var meta = document.querySelector('meta[name=\"theme-color\"]');
              if (meta) meta.setAttribute('content', mode === 'dark' ? '#0d1117' : '#ffffff');
            } catch(_){}
          })();
        `}} />
      </head>
      <body className="font-ui bg-canvas text-fg">
        <script dangerouslySetInnerHTML={{ __html: `
          (function(){
            if ('serviceWorker' in navigator) {
              window.addEventListener('load', function(){
                navigator.serviceWorker.register('/sw.js').catch(function(){});
              });
            }
          })();
        `}} />
        <header className="sticky top-0 z-50 bg-canvas/95 backdrop-blur supports-[backdrop-filter]:bg-canvas/80 border-b border-border">
          <nav className="mx-auto max-w-6xl px-4 sm:px-6 py-3 flex items-center gap-4 text-sm text-fg-muted">
            <a href="/" className="font-bold text-fg hover:text-accent">Tharaga</a>
            <a href="/property-listing/" className="hover:text-accent">Browse</a>
            <a href="/tools/cost-calculator" className="hover:text-accent">Cost</a>
            <a href="/pricing/" className="hover:text-accent">Pricing</a>
            <a href="/tools/currency-risk" className="hover:text-accent">FX Risk</a>
            <a href="/tools/vastu" className="hover:text-accent">Vastu</a>
            <a href="/tools/voice-tamil" className="hover:text-accent">தமிழ் Voice</a>
            <a href="/tours" className="hover:text-accent">Tours</a>
            <a href="/dashboard/map" className="hover:text-accent">Map</a>
            <a href="/dashboard/market" className="hover:text-accent">Market</a>
            <a href="/builder" className="hover:text-accent">Builder</a>
            <a href="/saved" className="hover:text-accent">Saved</a>
            <a href="/tools/roi" className="hover:text-accent">ROI</a>
            <a href="/tools/environment" className="hover:text-accent">Env</a>
            <a href="/filters/radial" className="hover:text-accent">Filters</a>
            <span className="grow" />
            <LanguageSelector className="rounded-md border border-border px-2 py-1 text-xs bg-canvas" />
            <button id="themeToggleBtn" className="rounded-md border border-border px-2 py-1 text-xs text-fg hover:text-accent">
              Toggle theme
            </button>
          </nav>
        </header>
        <EntitlementsProvider>
          {children}
        </EntitlementsProvider>
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
            var btn = document.getElementById('themeToggleBtn');
            if (btn) {
              btn.addEventListener('click', function(){
                try {
                  var current = document.documentElement.getAttribute('data-color-mode') || 'light';
                  var next = current === 'dark' ? 'light' : 'dark';
                  document.documentElement.setAttribute('data-color-mode', next);
                  localStorage.setItem('thg.theme', next);
                  var meta = document.querySelector('meta[name=\"theme-color\"]');
                  if (meta) meta.setAttribute('content', next === 'dark' ? '#0d1117' : '#ffffff');
                } catch(_){}
              });
            }
          })();
        `}} />
      </body>
    </html>
  )
}

