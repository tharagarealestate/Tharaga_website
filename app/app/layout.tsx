import './globals.css'
import type { Metadata } from 'next'
export const runtime = 'edge'

export const metadata: Metadata = {
  title: 'Tharaga — Premium Real Estate',
  description: 'AI-powered real estate assistant',
}

import { EntitlementsProvider } from '@/components/ui/FeatureGate'
import { AppI18nProvider } from '@/components/providers/AppI18nProvider'
import MobileBottomNav from '@/components/MobileBottomNav'
import { PrefetchRoutes } from '@/components/providers/PrefetchRoutes'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.webmanifest" />
        <meta name="theme-color" content="#ffffff" />
        {/* Durable Auth modal support across all pages */}
        <script dangerouslySetInnerHTML={{ __html: `window.DURABLE_AUTH_URL='/login_signup_glassdrop/';window.AUTH_HIDE_HEADER=false;` }} />
        <script src="/login_signup_glassdrop/auth-gate.js" defer />
        {/* Global auth helper for easy access */}
        <script dangerouslySetInnerHTML={{ __html: `
          window.__thgOpenAuthModal = function(opts) {
            try {
              if (window.authGate && typeof window.authGate.openLoginModal === 'function') {
                window.authGate.openLoginModal(opts || {});
                return true;
              }
              console.warn('authGate not ready yet');
              return false;
            } catch(e) {
              console.error('Failed to open auth modal:', e);
              return false;
            }
          };
        ` }} />
        {/* Static header styles from index.html */}
        <style
          dangerouslySetInnerHTML={{ __html: `
          /* Desktop header nav layout and emphasis */
          [role='banner'] nav[aria-label='Primary']{ gap:12px; align-items:center; flex-wrap:nowrap }
          [role='banner'] nav[aria-label='Primary'] a,
          [role='banner'] nav[aria-label='Primary'] summary{ font-weight:700 }
          /* Summary affordance to match homepage button-like appearance */
          [role='banner'] details > summary{ list-style:none; cursor:pointer; display:inline-flex; align-items:center; gap:6px; padding:6px 10px; border-radius:999px; font-size:16px }
          [role='banner'] details > summary::-webkit-details-marker{ display:none }
          /* Vertical dividers (match tone and size) */
          [role='banner'] nav[aria-label='Primary'] span[aria-hidden='true']{ width:1px; height:16px; background:rgba(255,255,255,.18) !important; display:inline-block; border-radius:1px }

          /* Dropdown styling from index.html */
          details.dropdown{ position:relative }
          details.dropdown > summary{ list-style:none; cursor:pointer; display:inline-flex; align-items:center; gap:6px; padding:6px 10px; border-radius:999px; font-size:16px }
          details.dropdown > summary::-webkit-details-marker{ display:none }
          details.dropdown > summary::after{ content:""; width:0; height:0; border-left:5px solid transparent; border-right:5px solid transparent; border-top:6px solid currentColor; opacity:.8; transition:transform .18s ease }
          details.dropdown[open] > summary::after{ transform:rotate(180deg) }
          details.dropdown .menu{ position:absolute; top:calc(100% + 8px); right:0; min-width:240px; background:linear-gradient(180deg,#ffffff, #fffafc); color:#111; border:1px solid rgba(110,13,37,.14); border-radius:12px; padding:12px 8px 8px; box-shadow:0 18px 40px rgba(110,13,37,.16); z-index:60; opacity:0; transform:translateY(-6px) scale(.98); visibility:hidden; pointer-events:none; transition:opacity .18s ease, transform .18s ease, visibility 0s linear .18s }
          details.dropdown .menu::before{ content:""; position:absolute; top:0; left:0; right:0; height:3px; border-radius:12px 12px 0 0; background:linear-gradient(90deg, rgb(var(--gold-500)), rgb(var(--rose-700))) }
          details.dropdown[open] .menu{ opacity:1; transform:translateY(0) scale(1); visibility:visible; pointer-events:auto; transition:opacity .18s ease, transform .18s ease, visibility 0s linear 0s }
          details.dropdown .menu a{ display:block; padding:10px 12px; border-radius:10px; color:inherit; text-decoration:none; text-align:center; transition: background .15s ease, transform .06s ease, color .15s ease, box-shadow .12s ease }
          details.dropdown .menu a + a{ border-top:1px solid #f0f2f4 }
          details.dropdown .menu a:hover{ background:linear-gradient(90deg, rgba(110,13,37,.12), rgba(110,13,37,.06)); color:rgb(var(--rose-700)); box-shadow: inset 0 0 0 1px rgba(110,13,37,.18) }
          details.dropdown .menu a:active{ transform:translateY(1px); background:linear-gradient(180deg, rgba(110,13,37,.20), rgba(110,13,37,.10)) }

          /* Right-side auth container - positioned in flex layout */
          #site-header-auth-container{ display:flex; align-items:center; gap:12px }
          /* Auth button styling within header */
          [role='banner'] .thg-auth-wrap{ display:flex !important; align-items:center; gap:8px; position:relative !important }
          [role='banner'] .thg-auth-btn{ background:rgba(255,255,255,.12) !important; color:#fff !important; border-color:rgba(255,255,255,.85) !important; font-size:14px; padding:8px 14px }
          [role='banner'] .thg-auth-btn:hover{ background:rgba(255,255,255,.2) !important }
          /* Ensure dropdown menu appears correctly */
          [role='banner'] .thg-auth-menu{ position:absolute !important; top:calc(100% + 10px) !important; right:0 !important }

          /* Mobile adjustments */
          @media (max-width:880px){
            [role='banner'] nav[aria-label='Primary']{ white-space:nowrap; gap:10px }
            [role='banner'] nav[aria-label='Primary'] a,
            [role='banner'] nav[aria-label='Primary'] summary{ padding:4px 0; font-size:13px }
            /* Keep summary slightly larger to match Login/Signup */
            [role='banner'] details > summary{ font-size:16px; padding:6px 10px }
            /* Hide top-level Pricing/About on mobile; provided in Features menu */
            [role='banner'] nav[aria-label='Primary'] a[href='/pricing/'],
            [role='banner'] nav[aria-label='Primary'] a[href='/about/']{ display:none }
            /* Auth container positioning on mobile */
            #site-header-auth-container{ position:absolute; top:10px; right:12px; padding:0; gap:10px }
            [role='banner'] .thg-auth-wrap{ position:relative !important; padding:0; gap:8px }
            [role='banner'] nav[aria-label='Primary'] span[aria-hidden='true']{ height:14px }
          }
        ` }}
        />
        <script dangerouslySetInnerHTML={{ __html: `
          (function(){
            function safeQueue(){
              try { return JSON.parse(localStorage.getItem('__thg_events')||'[]'); } catch(_) { return []; }
            }
            function saveQueue(q){ try { localStorage.setItem('__thg_events', JSON.stringify(q.slice(-200))); } catch(_){}}
            function emit(event, props){
              try{
                var payload = { event: event, ts: Date.now(), props: props||{} };
                if (Array.isArray(window.dataLayer)) { window.dataLayer.push({ event: event, ...(payload.props||{}) }); }
                if (typeof window.gtag === 'function') { try { window.gtag('event', event, payload.props||{}); } catch(_){ } }
                var q = safeQueue(); q.push(payload); saveQueue(q);
              } catch(_){ }
            }
            try { if (!window.thgTrack) window.thgTrack = emit } catch(_){ }

            // Periodically flush events to backend for AI learning
            async function flush(){
              try{
                var q = safeQueue(); if (!q.length) return;
                var userId = localStorage.getItem('thg_user_id') || ('U_'+Math.random().toString(36).slice(2)+'_'+Date.now());
                localStorage.setItem('thg_user_id', userId);
                var sessionId = sessionStorage.getItem('thg_session_id') || ('S_'+Math.random().toString(36).slice(2)+'_'+Date.now());
                sessionStorage.setItem('thg_session_id', sessionId);
                var events = q.map(function(e){ return {
                  user_id: userId,
                  session_id: sessionId,
                  property_id: String(e.props && e.props.property_id || ''),
                  event: String(e.event||'custom'),
                  value: Number(e.props && e.props.value || 1),
                  ts: Number(e.ts||Date.now()),
                }}).filter(function(ev){ return !!ev.property_id && !!ev.event; });
                if (!events.length) { return; }
                var res = await fetch('/api/interactions', { method:'POST', headers: { 'Content-Type':'application/json' }, body: JSON.stringify({ events }) });
                if (res.ok) saveQueue([]);
              }catch(_){ }
            }
            setInterval(flush, 15000);
          })();
        `}} />
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
        {/* Static header - injected from root index.html styling */}
        <header role="banner" className="sticky top-0 z-50 text-white border-b border-white/10" style={{
          background: 'linear-gradient(180deg, rgba(110,13,37,.82), rgba(110,13,37,.66))',
          backdropFilter: 'blur(12px) saturate(1.25)'
        }}>
          <div className="mx-auto max-w-[1100px] px-4 sm:px-6">
            <div className="flex items-center justify-between gap-3 py-2" style={{ position: 'relative', paddingRight: 'clamp(130px, 10vw, 200px)' }}>
              <div className="flex items-center gap-3">
                <a href="/" className="font-extrabold tracking-wide" style={{ fontFamily: 'var(--font-display, inherit)', fontSize: '24px' }}>
                  THARAGA
                </a>
                <span className="hidden md:inline-flex items-center gap-2 rounded-full bg-white text-black border border-white/80 px-2 py-1 text-[12px]">
                  <span>Verified</span>
                  <span aria-hidden>•</span>
                  <span>Broker‑free</span>
                </span>
              </div>
              <nav className="flex items-center gap-3 sm:gap-4 text-sm font-bold" aria-label="Primary" style={{ gap: '12px', alignItems: 'center', flexWrap: 'nowrap', marginLeft: 'auto' }}>
                <span className="menu-group">
                  <details className="dropdown relative group">
                    <summary className="list-none cursor-pointer inline-flex items-center gap-1 px-2 py-1 rounded-full hover:bg-white/10" style={{ padding: '6px 10px', borderRadius: '999px', fontSize: '16px' }}>
                      <span>Features</span>
                      <span className="w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-t-[6px] border-t-white/90 transition-transform group-open:-rotate-180" aria-hidden="true" />
                    </summary>
                    <div className="absolute right-0 mt-2 min-w-[240px] bg-white/98 text-black rounded-xl border border-white/20 shadow-xl p-2 z-50 opacity-0 -translate-y-1 scale-95 invisible transition group-open:opacity-100 group-open:translate-y-0 group-open:scale-100 group-open:visible">
                      <div className="h-[3px] rounded-t-xl bg-gradient-to-r from-gold-500 to-rose-700" aria-hidden="true" />
                      <a className="block px-3 py-2 rounded-lg hover:bg-black/5" href="/tools/vastu/">Vastu</a>
                      <a className="block px-3 py-2 rounded-lg hover:bg-black/5" href="/tools/environment/">Climate & environment</a>
                      <a className="block px-3 py-2 rounded-lg hover:bg-black/5" href="/tools/voice-tamil/">Voice (Tamil)</a>
                      <a className="block px-3 py-2 rounded-lg hover:bg-black/5" href="/tools/verification/">Verification</a>
                      <a className="block px-3 py-2 rounded-lg hover:bg-black/5" href="/tools/roi/">ROI</a>
                      <a className="block px-3 py-2 rounded-lg hover:bg-black/5" href="/tools/currency-risk/">Currency risk</a>
                      <div className="my-1 h-px bg-black/10 md:hidden" aria-hidden="true" />
                      <a className="block px-3 py-2 rounded-lg hover:bg-black/5 md:hidden" href="/pricing/">Pricing</a>
                      <a className="block px-3 py-2 rounded-lg hover:bg-black/5 md:hidden" href="/about/">About</a>
                    </div>
                  </details>
                  <span className="hidden md:inline-block w-px h-4 bg-white/30" aria-hidden="true" style={{ width: '1px', height: '16px', background: 'rgba(255,255,255,.18)', display: 'inline-block', borderRadius: '1px' }} />
                  <details className="dropdown relative group">
                    <summary className="list-none cursor-pointer inline-flex items-center gap-1 px-2 py-1 rounded-full hover:bg-white/10" aria-haspopup="menu" style={{ padding: '6px 10px', borderRadius: '999px', fontSize: '16px' }}>
                      <span>Portal</span>
                      <span className="w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-t-[6px] border-t-white/90 transition-transform group-open:-rotate-180" aria-hidden="true" />
                    </summary>
                    <div role="menu" aria-label="Portal menu" className="absolute right-0 mt-2 min-w-[240px] bg-white/98 text-black rounded-xl border border-white/20 shadow-xl p-2 z-50 opacity-0 -translate-y-1 scale-95 invisible transition group-open:opacity-100 group-open:translate-y-0 group-open:scale-100 group-open:visible">
                      <div className="h-[3px] rounded-t-xl bg-gradient-to-r from-gold-500 to-rose-700" aria-hidden="true" />
                      <a role="menuitem" tabIndex={0} className="block px-3 py-2 rounded-lg hover:bg-black/5 focus:outline-none focus:ring-2 focus:ring-rose-600/40" href="/builder">Builder Dashboard</a>
                      <a role="menuitem" tabIndex={0} className="block px-3 py-2 rounded-lg hover:bg-black/5 focus:outline-none focus:ring-2 focus:ring-rose-600/40" href="/my-dashboard">Buyer Dashboard</a>
                    </div>
                  </details>
                  <span className="hidden md:inline-block w-px h-4 bg-white/30" aria-hidden="true" style={{ width: '1px', height: '16px', background: 'rgba(255,255,255,.18)', display: 'inline-block', borderRadius: '1px' }} />
                  <a href="/pricing/" className="hover:underline">Pricing</a>
                </span>
                <span className="hidden md:inline-block w-px h-4 bg-white/30" aria-hidden="true" style={{ width: '1px', height: '16px', background: 'rgba(255,255,255,.18)', display: 'inline-block', borderRadius: '1px' }} />
                <a href="/about/" className="hover:underline">About</a>
              </nav>
              {/* Auth button container - populated by auth-gate.js */}
              <div id="site-header-auth-container"></div>
            </div>
          </div>
        </header>
        <AppI18nProvider>
          <EntitlementsProvider>
            <PrefetchRoutes />
            {children}
          </EntitlementsProvider>
        </AppI18nProvider>
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
        <MobileBottomNav />
      </body>
    </html>
  )
}

