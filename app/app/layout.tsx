import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Tharaga — Premium Real Estate',
  description: 'AI-powered real estate assistant',
}

import { EntitlementsProvider } from '@/components/ui/FeatureGate'

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
        {/* Durable auth header config + loader */}
        <script dangerouslySetInnerHTML={{ __html: `
          try{ window.AUTH_HIDE_HEADER = false; window.AUTH_OPEN_ON_LOAD = false; }catch(_){}
          try{ window.AUTH_NAV = Object.assign({ profile: '/profile', dashboard: '/dashboard' }, window.AUTH_NAV || {}); }catch(_){}
        `}} />
        <script src="/js/durable-auth-head.js" defer></script>
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
        <header id="durable-head" className="nav">
          <div className="inner">
            <div className="row"><a className="brand" href="/" style={{ fontSize: 26 }}>THARAGA</a><span className="pill" id="home_pill_trust">Verified • Broker‑free</span></div>
            <nav className="row" aria-label="Primary">
              <span className="menu-group">
                <details className="dropdown">
                  <summary>Features</summary>
                  <div className="menu" role="menu">
                    <a href="/tools/vastu/">Vastu</a>
                    <a href="/tools/environment/">Climate & environment</a>
                    <a href="/tools/voice-tamil/">Voice (Tamil)</a>
                    <a href="/tools/verification/">Verification</a>
                    <a href="/tools/roi/">ROI</a>
                    <a href="/tools/currency-risk/">Currency risk</a>
                    <span className="divider show-mobile-only" aria-hidden="true"></span>
                    <a className="show-mobile-only" href="/pricing/">Pricing</a>
                    <a className="show-mobile-only" href="/about/">About</a>
                  </div>
                </details>
                <span className="divider" aria-hidden="true"></span>
                <a href="/builder">Builder</a>
                <a href="/pricing/">Pricing</a>
              </span>
              <span className="divider" aria-hidden="true"></span>
              <a href="/about/">About</a>
            </nav>
            <a className="about-mobile-link" href="/about/">About</a>
          </div>
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

