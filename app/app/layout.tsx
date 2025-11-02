import './globals.css'
import type { Metadata } from 'next'
export const runtime = 'edge'

export const metadata: Metadata = {
  title: 'Tharaga — Premium Real Estate',
  description: 'AI-powered real estate assistant',
}

import { EntitlementsProvider } from '@/components/ui/FeatureGate'
import { AppI18nProvider } from '@/components/providers/AppI18nProvider'
import SiteHeader from '@/components/SiteHeader'
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
        {/* Normalize header typography, spacing, and dividers to match homepage */}
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
        <AppI18nProvider>
          <SiteHeader />
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

