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
          /* Header base styles */
          header.nav { position:sticky; top:0; z-index:20; color:#fff; backdrop-filter: blur(12px) saturate(1.25); background: linear-gradient(180deg, rgba(110,13,37,.82), rgba(110,13,37,.66)); border-bottom:1px solid rgba(255,255,255,.12) }
          header.nav .inner { max-width:1100px; margin:0 auto; padding:10px 16px; display:flex; align-items:center; justify-content:space-between; gap:10px; position:relative; padding-right: clamp(130px, 10vw, 200px) }
          .brand { font-family: var(--font-display); font-weight:800; letter-spacing:.2px; font-size:24px }
          header.nav .brand{ color:#fff }
          header.nav a, header.nav summary{ color:#fff }
          .pill { display:inline-flex; align-items:center; gap:8px; padding:6px 10px; border-radius:999px; background:#fff; border:1px solid #eee; font-size:12px; color:#111 }

          /* Header nav layout */
          header.nav nav.row { gap:12px; align-items:center; flex-wrap:nowrap; margin-left:auto }
          header.nav nav.row a, header.nav nav.row summary { font-weight:700 }
          .menu-group{ display:inline-flex; align-items:center; gap:12px }
          .divider{ width:1px; height:16px; background:#e5e7eb; border-radius:1px; display:inline-block }

          /* Dropdown styling from index.html */
          details.dropdown{ position:relative }
          details.dropdown > summary{ list-style:none; cursor:pointer; display:inline-flex; align-items:center; gap:6px; padding:6px 10px; border-radius:999px; font-size:16px; }
          details.dropdown > summary::-webkit-details-marker{ display:none }
          details.dropdown > summary::after{ content:""; width:0; height:0; border-left:5px solid transparent; border-right:5px solid transparent; border-top:6px solid currentColor; opacity:.8; transition:transform .18s ease }
          details.dropdown[open] > summary::after{ transform:rotate(180deg) }
          details.dropdown .menu{ position:absolute; top:calc(100% + 8px); right:0; min-width:240px; background:linear-gradient(180deg,#ffffff, #fffafc); color:#111; border:1px solid rgba(110,13,37,.14); border-radius:12px; padding:12px 8px 8px; box-shadow:0 18px 40px rgba(110,13,37,.16); z-index:60; opacity:0; transform:translateY(-6px) scale(.98); visibility:hidden; pointer-events:none; transition:opacity .18s ease, transform .18s ease, visibility 0s linear .18s }
          details.dropdown .menu::before{ content:""; position:absolute; top:0; left:0; right:0; height:3px; border-radius:12px 12px 0 0; background:linear-gradient(90deg, var(--gold), var(--brand)); }
          details.dropdown[open] .menu{ opacity:1; transform:translateY(0) scale(1); visibility:visible; pointer-events:auto; transition:opacity .18s ease, transform .18s ease, visibility 0s linear 0s }
          details.dropdown .menu a{ display:block; padding:10px 12px; border-radius:10px; color:inherit; text-decoration:none; text-align:center; transition: background .15s ease, transform .06s ease, color .15s ease, box-shadow .12s ease }
          details.dropdown .menu a + a{ border-top:1px solid #f0f2f4 }
          details.dropdown .menu a:hover{ background:linear-gradient(90deg, rgba(110,13,37,.12), rgba(110,13,37,.06)); color:var(--brand); box-shadow: inset 0 0 0 1px rgba(110,13,37,.18) }
          details.dropdown .menu a:focus-visible{ outline:0; box-shadow:0 0 0 2px var(--ring), inset 0 0 0 1px rgba(110,13,37,.24) }
          details.dropdown .menu a:active{ transform:translateY(1px); background:linear-gradient(180deg, rgba(110,13,37,.20), rgba(110,13,37,.10)) }
          details.dropdown .menu .divider{ display:block; width:auto; height:1px; background:rgba(110,13,37,.14); margin:6px 6px; border-radius:1px }
          details.dropdown .menu .show-mobile-only{ display:none }

          /* Auth button styling */
          header.nav .thg-auth-wrap{ display:flex; align-items:center; gap:12px }
          header.nav .thg-auth-wrap::before{ content:""; display:inline-block; width:1px; height:16px; background:rgba(255,255,255,.22); border-radius:1px }
          header.nav .thg-auth-btn{ background:rgba(255,255,255,.12) !important; color:#fff !important; border-color:rgba(255,255,255,.85) !important }
          header.nav .thg-auth-btn:hover{ background:rgba(255,255,255,.2) !important }
          header.nav .thg-auth-btn.is-auth::after{ border-top-color:#fff !important }
          header.nav .divider{ background:rgba(255,255,255,.18) }
          #site-header-auth-container{ display:flex; align-items:center; gap:12px }

          /* Mobile adjustments */
          @media (max-width: 1080px) {
            #home_pill_trust{ display:none }
            header.nav .inner{ padding-right:200px }
          }
          @media (max-width: 880px) {
            header.nav .inner { padding-right:160px; flex-wrap:nowrap; gap:8px }
            .brand { font-size:22px }
            header.nav .inner .row { flex:0 0 auto; justify-content:flex-start }
            header.nav nav.row { white-space:nowrap; gap:10px }
            header.nav nav.row a, header.nav nav.row summary { padding:4px 0; font-size:13px }
            details.dropdown > summary{ font-size:16px; padding:6px 10px }
            .divider{ height:14px }
            header.nav nav.row .menu-group > a[href='/pricing/']{ display:none }
            header.nav nav.row .menu-group > .divider{ display:none }
            header.nav nav.row > a[href='/about/']{ display:none }
            details.dropdown .menu .show-mobile-only{ display:block }
            header.nav .thg-auth-wrap{ position:absolute; top:10px; right:12px; padding:0; gap:10px }
            header.nav .thg-auth-wrap::before{ height:14px }
            #home_pill_trust{ display:none }
            details.dropdown .menu{ position:absolute; left:auto; right:0; top:calc(100% + 8px); min-width:230px; border-radius:12px; }
            details.dropdown .menu a{ padding:8px 10px }
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
        {/* Static header - matches index.html exactly */}
        <header className="nav sticky top-0 text-white border-b" style={{
          zIndex: 20,
          backdropFilter: 'blur(12px) saturate(1.25)',
          background: 'linear-gradient(180deg, rgba(110,13,37,.82), rgba(110,13,37,.66))',
          borderBottomColor: 'rgba(255,255,255,.12)'
        }}>
          <div className="inner" style={{
            maxWidth: '1100px',
            margin: '0 auto',
            padding: '10px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '10px',
            position: 'relative',
            paddingRight: 'clamp(130px, 10vw, 200px)'
          }}>
            <div className="row" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <a href="/" className="brand" style={{
                fontFamily: 'var(--font-display)',
                fontWeight: 800,
                letterSpacing: '.2px',
                fontSize: '24px',
                color: '#fff'
              }}>
                THARAGA
              </a>
              <span className="pill" id="home_pill_trust" style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 10px',
                borderRadius: '999px',
                background: '#fff',
                border: '1px solid #eee',
                fontSize: '12px',
                color: '#111'
              }}>
                <span>Verified</span>
                <span>•</span>
                <span>Broker‑free</span>
              </span>
            </div>
            <nav className="row" aria-label="Primary" style={{
              gap: '12px',
              alignItems: 'center',
              flexWrap: 'nowrap',
              marginLeft: 'auto',
              display: 'flex'
            }}>
              <span className="menu-group">
                <details className="dropdown">
                  <summary>
                    <span>Features</span>
                  </summary>
                  <div className="menu">
                    <a href="/tools/vastu/">Vastu</a>
                    <a href="/tools/environment/">Climate &amp; environment</a>
                    <a href="/tools/voice-tamil/">Voice (Tamil)</a>
                    <a href="/tools/verification/">Verification</a>
                    <a href="/tools/roi/">ROI</a>
                    <a href="/tools/currency-risk/">Currency risk</a>
                    <div className="divider show-mobile-only" aria-hidden="true" />
                    <a className="show-mobile-only" href="/pricing/">Pricing</a>
                    <a className="show-mobile-only" href="/about/">About</a>
                  </div>
                </details>
                <span className="divider" aria-hidden="true" />
                <details className="dropdown">
                  <summary>
                    <span>Portal</span>
                  </summary>
                  <div className="menu">
                    <a href="/builder">Builder Dashboard</a>
                    <a href="/my-dashboard">Buyer Dashboard</a>
                  </div>
                </details>
                <span className="divider" aria-hidden="true" />
                <a href="/pricing/">Pricing</a>
              </span>
              <span className="divider" aria-hidden="true" />
              <a href="/about/">About</a>
            </nav>
            {/* Auth button container - populated by auth-gate.js */}
            <div id="site-header-auth-container"></div>
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

