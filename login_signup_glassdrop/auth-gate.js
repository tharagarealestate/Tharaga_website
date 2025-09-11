/* /js/auth-gate.js
   Drop this file in your site and include:
   <script src="/login_signup_glassdrop/auth-gate.js"></script>
   (No module/exports required - works as a plain script)
*/
(function () {
  'use strict';
  
  const SUPABASE_URL = 'https://wedevtjjmdvngyshqdro.supabase.co';
  const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndlZGV2dGpqbWR2bmd5c2hxZHJvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU0NzYwMzgsImV4cCI6MjA3MTA1MjAzOH0.Ex2c_sx358dFdygUGMVBohyTVto6fdEQ5nydDRh9m6M";

  /** CONFIG — update LOGIN_IFRAME_URL to your actual login/embed page */
  // make explicit to avoid directory/index surprises:
  const LOGIN_IFRAME_URL = "https://auth.tharaga.co.in/login_signup_glassdrop/";
  const AUTO_RESUME_PENDING = false;

  // Build allowed origin list robustly (supports absolute AND relative LOGIN_IFRAME_URL)
  let ALLOWED_IFRAME_ORIGINS = [];
  try {
    ALLOWED_IFRAME_ORIGINS = [ new URL(LOGIN_IFRAME_URL, location.origin).origin ];
  } catch (e) {
    ALLOWED_IFRAME_ORIGINS = [ location.origin ];
    console.warn('auth-gate: invalid LOGIN_IFRAME_URL — falling back to current origin', e);
  }

  // Prevent double injection
  if (window.__authGateInjected) return;
  window.__authGateInjected = true;

  // ------- DOM: overlay, frame, controls -------
  const overlay = document.createElement('div');
  overlay.id = 'authGateModal';
  overlay.setAttribute('aria-hidden', 'true');

  overlay.innerHTML = `
    <div class="authgate-backdrop" part="backdrop" aria-hidden="true">
      <div class="authgate-dialog" role="dialog" aria-modal="true" aria-label="Sign in / Sign up">
        <button class="authgate-close" aria-label="Close login modal" title="Close">✕</button>
        <div class="authgate-frame-wrap">
          <iframe id="authGateIframe" src="about:blank" frameborder="0" allow="clipboard-read; clipboard-write"></iframe>
        </div>
      </div>
    </div>
  `;

  const style = document.createElement('style');
  style.textContent = `
    #authGateModal { position: absolute; inset: 0; top: 0; 
    left: 0;
    width: 100%; 
    min-height: 100%; display: none; z-index: 2147483646; }
    #authGateModal .authgate-backdrop { display:flex; align-items:center; justify-content:center; inset:0;
      display:flex; 
      align-items:center; 
      justify-content:center; 
      position:absolute; 
      top:0; 
      left:0; 
      width:100%; 
      height:100%; 
      min-height: 100%;
    
    }
    #authGateModal .authgate-dialog { width: min(1100px, 98%); height: min(850px, 92%); position:relative; display:flex; flex-direction:column; overflow:hidden; }
    #authGateModal .authgate-close { position:absolute; top:10px; right:12px; z-index:3; background:transparent; border:none; font-size:20px; cursor:pointer; padding:6px; display:none; }
    #authGateModal .authgate-frame-wrap { display:flex; align-items:center; justify-content:center; padding:28px; flex:1; min-height:0; } 
    #authGateModal iframe#authGateIframe { width:100%; height:100%; border:0; display:block; background:transparent; border-radius:12px; }
    @media (max-width:420px) {
      #authGateModal .authgate-dialog { width:98%; height:98%; border-radius:6px; }
      #authGateModal .authgate-close { top:6px; right:8px; }
    }
  `;
    // ---------------- Safe DOM mount ----------------
  // Append style + overlay only once, and only when the DOM is ready.
  function mountAuthGateElements() {
    try {
      // avoid double-mounts
      if (document.getElementById('authGateModal')) return;

      // append style to head (if present)
      if (document.head) {
        document.head.appendChild(style);
      } else {
        // fallback: wait until DOM ready
        document.addEventListener('DOMContentLoaded', function addStyleOnce() {
          document.removeEventListener('DOMContentLoaded', addStyleOnce);
          document.head && document.head.appendChild(style);
        }, { once: true });
      }

      // append overlay when body is available
      if (document.body) {
        document.body.appendChild(overlay);
      } else {
        document.addEventListener('DOMContentLoaded', function addOverlayOnce() {
          document.removeEventListener('DOMContentLoaded', addOverlayOnce);
          document.body && document.body.appendChild(overlay);
        }, { once: true });
      }
    } catch (err) {
      console.warn('auth-gate: mount failed', err);
    }
  }

  mountAuthGateElements();

  // Now query nodes from the overlay (use overlay.querySelector so it works even before appended)
  // If the overlay hasn't been inserted yet, these will be null — so we also provide a fallback to wait.
  let modal = overlay.querySelector('.authgate-backdrop');
  let dialog = overlay.querySelector('.authgate-dialog');
  let iframe = overlay.querySelector('#authGateIframe');
  let closeBtn = overlay.querySelector('.authgate-close');

  if (!modal || !dialog || !iframe || !closeBtn) {
    // Ensure they are obtained once DOMContentLoaded runs
    document.addEventListener('DOMContentLoaded', function findElementsOnce() {
      document.removeEventListener('DOMContentLoaded', findElementsOnce);
      modal = overlay.querySelector('.authgate-backdrop');
      dialog = overlay.querySelector('.authgate-dialog');
      iframe = overlay.querySelector('#authGateIframe');
      closeBtn = overlay.querySelector('.authgate-close');
    }, { once: true });
  }

  try {
    iframe.setAttribute('allowtransparency', 'true');
    iframe.style.background = 'transparent';
    iframe.style.border = '0';
    iframe.style.borderRadius = '12px';
    iframe.style.overflow = 'hidden';
  } catch (e) { /* ignore */ }

  let lastFocused = null;
  let signInPromise = null;
  let signInResolve = null;
  let signInReject = null;
  window.__authGatePendingAction = null;
  window.__authGateLoggedIn = !!window.__authGateLoggedIn;

  function isAllowedOrigin(origin) {
    if (!origin) return false;
    return ALLOWED_IFRAME_ORIGINS.indexOf(origin) !== -1;
  }

  function trapFocus(e) {
    if (e.key !== 'Tab') return;
    const focusable = dialog.querySelectorAll('a[href], button, textarea, input, select, [tabindex]:not([tabindex="-1"])');
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (e.shiftKey) {
      if (document.activeElement === first) {
        e.preventDefault();
        last.focus();
      }
    } else {
      if (document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  }

  function openLoginModal(opts = {}) {
    const { next = null, waitForSignIn = false } = opts;
    try {
      // Generate a one-time state for cross-browser handoff
      const randomState = (()=>{
        try {
          const bytes = new Uint8Array(16);
          crypto.getRandomValues(bytes);
          return Array.from(bytes).map(b=>b.toString(16).padStart(2,'0')).join('');
        } catch (_) {
          return String(Date.now()) + Math.random().toString(36).slice(2);
        }
      })();
      try { localStorage.setItem('__tharaga_auth_state', JSON.stringify({ state: randomState, ts: Date.now() })); } catch(_) {}

      const params = new URLSearchParams();
      params.set('embed', '1');
      if (next) params.set('next', next);
      params.set('state', randomState);
      params.set('parent_origin', location.origin);
      iframe.src = LOGIN_IFRAME_URL + (params.toString() ? ('?' + params.toString()) : '');
      // debug
      console.debug('auth-gate: opening iframe ->', iframe.src);
      try {
        const tmpUrl = new URL(iframe.src, location.href);
        const iframeOrigin = tmpUrl.origin;
        if (ALLOWED_IFRAME_ORIGINS.indexOf(iframeOrigin) === -1) {
          ALLOWED_IFRAME_ORIGINS.push(iframeOrigin);
        }
      } catch (e) { /* ignore */ }
    } catch (e) {
      iframe.src = LOGIN_IFRAME_URL;
    }

    lastFocused = document.activeElement;
    overlay.style.display = 'block';
    overlay.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    setTimeout(() => { try { if (closeBtn) closeBtn.focus(); } catch(_) {} }, 50);
    document.addEventListener('keydown', onKeyDown);
    dialog.addEventListener('keydown', trapFocus);

    // Helper: ensure a Supabase client is available on this parent page
    async function ensureParentSupabaseClient() {
      try {
        if (window.supabase && window.supabase.auth) return window.supabase;
        const mod = await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm');
        const c = mod.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        window.supabase = c; // cache for later
        return c;
      } catch (_) { return null; }
    }

    // Start polling the Edge Function to retrieve tokens handed off by the email-click tab
    (async () => {
      try {
        const stateObj = JSON.parse(localStorage.getItem('__tharaga_auth_state')||'null');
        const state = stateObj?.state;
        if (!state) return;
        const result = await waitForHandoff(state, 120000);
        if (result && result.access_token && result.refresh_token) {
          // 1) Set session on this PARENT page so the user is actually logged in here
          try {
            const client = await ensureParentSupabaseClient();
            if (client && client.auth) {
              await client.auth.setSession({ access_token: result.access_token, refresh_token: result.refresh_token });
            }
          } catch (_) { /* ignore */ }

          // 2) Signal other tabs in this origin that login is complete
          try {
            const payload = { ts: Date.now(), next: next || null, user: result.user || null };
            localStorage.setItem('__tharaga_magic_continue', JSON.stringify(payload));
            localStorage.setItem('__tharaga_magic_confirmed', JSON.stringify(payload));
          } catch (_) { /* ignore */ }

          // 3) Post tokens to iframe so it can set its session and flip to Continue UI
          postMessageToIframe({
            type: 'tharaga_token_transfer',
            access_token: result.access_token,
            refresh_token: result.refresh_token,
            user: result.user || null,
            next: next || null
          });

          // 4) Auto-close the modal and resume the original page
          try {
            closeLoginModal();
          } catch (_) {}
          try {
            const safeNext = (function(){
              if (!next) return null;
              try { const u = new URL(next, location.origin); return u.origin === location.origin ? u.href : null; } catch { return null; }
            })();
            if (safeNext) {
              setTimeout(() => { location.href = safeNext; }, 150);
            } else {
              setTimeout(() => { location.reload(); }, 150);
            }
          } catch (_) {}
        }
      } catch (e) {
        console.warn('auth-gate: handoff polling failed', e);
      }
    })();

    if (waitForSignIn) {
      if (!signInPromise) {
        signInPromise = new Promise((resolve, reject) => { signInResolve = resolve; signInReject = reject; });
      }
      return signInPromise;
    }
    return Promise.resolve(true);
  }

  function closeLoginModal() {
    try { iframe.src = 'about:blank'; } catch (e) {}
    overlay.style.display = 'none';
    overlay.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    if (lastFocused && typeof lastFocused.focus === 'function') lastFocused.focus();
    document.removeEventListener('keydown', onKeyDown);
    dialog.removeEventListener('keydown', trapFocus);
    if (signInPromise && signInReject) {
      signInReject(new Error('Login modal closed'));
      signInPromise = null; signInResolve = null; signInReject = null;
    }
  }

  function onKeyDown(e) {
    if (e.key === 'Escape') {
      closeLoginModal();
      postMessageToIframe({ type: 'parent_closed' });
    }
  }

  function postMessageToIframe(msg) {
  try {
    const src = iframe && iframe.src ? iframe.src : '';
    if (!src) return;
    const url = new URL(src, location.href);
    const origin = url.origin;
    if (isAllowedOrigin(origin) && iframe.contentWindow) {
      iframe.contentWindow.postMessage(msg, origin);
    }
  } catch (e) {
    console.warn('auth-gate: postMessageToIframe failed', e);
  }
}


  async function attachAuthGate(selector, actionFn) {
    const nodes = (typeof selector === 'string') ? document.querySelectorAll(selector)
      : (selector instanceof Element ? [selector] : selector);

    if (!nodes || nodes.length === 0) return;

    nodes.forEach(el => {
      el.addEventListener('click', async (evt) => {
        let loggedIn = false;
        try {
          if (window.supabase && supabase.auth) {
            const res = await supabase.auth.getUser();
            if (res?.data?.user) loggedIn = true;
          }
        } catch (_) {}
        if (!loggedIn && window.__authGateLoggedIn) loggedIn = true;
        if (loggedIn) {
          try { await actionFn(evt); } catch (err) { console.error('authGate action error', err); }
          return;
        }

        evt.preventDefault && evt.preventDefault();

        if (AUTO_RESUME_PENDING) {
          window.__authGatePendingAction = async () => {
            try { await actionFn(evt); } catch (e) { console.error('pending action failed', e); }
          };
        } else {
          window.__authGatePendingAction = null;
        }

        const next = (location.pathname + location.search);
        openLoginModal({ next: next });
      }, { passive: false });
    });
  }

  if (closeBtn) closeBtn.addEventListener('click', closeLoginModal);
  if (modal) modal.addEventListener('click', (ev) => { /* backdrop click disabled */ });

  // Message receiver: only accept from configured origins
  window.addEventListener('message', (ev) => {
    const origin = ev.origin;
    if (!isAllowedOrigin(origin)) return;
    const msg = ev.data || {};
    if (typeof msg !== 'object') return;

    // expected: { type: 'signed_in' | 'close_login_modal' | 'ping', next?, user? }
    if (msg.type === 'signed_in') {
        window.__authGateLoggedIn = true;
        // Keep modal OPEN so iframe can show the “Continue” container
        if (signInResolve) {
          try { signInResolve({ signedIn: true, user: msg.user || null }); } catch (_) {}
          signInPromise = null; signInResolve = null; signInReject = null;
        }
        return;
      }
    if (msg.type === 'close_login_modal') {
        try { closeLoginModal(); } catch (_) {}
        return;
      }  
  }); // <-- THIS closes the message handler (was missing previously)

  // Expose API
  window.authGate = {
    openLoginModal: (opts) => openLoginModal(opts || {}),
    closeLoginModal,
    attachAuthGate
  };

  // Poll the Edge Function for a limited time to fetch tokens for a given state
  async function waitForHandoff(state, timeoutMs = 120000) {
    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
      try {
        const url = `${SUPABASE_URL}/functions/v1/auth-handoff?state=${encodeURIComponent(state)}`;
        const res = await fetch(url, { headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${SUPABASE_ANON_KEY}` } });
        if (res.status === 200) {
          const data = await res.json().catch(()=>null);
          if (data && data.access_token && data.refresh_token) return data;
        }
      } catch (_) {}
      await new Promise(r=>setTimeout(r, 1200));
    }
    return null;
  }

  // -------------------- Cross-tab auth sync --------------------
  (async function setupAuthCrossTabSync() {
    try {
      let sClient = window.supabase;
      if (!sClient) {
        if (typeof SUPABASE_URL === 'undefined' || typeof SUPABASE_ANON_KEY === 'undefined') {
          return;
        }
        const mod = await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm');
        sClient = mod.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
      }

      sClient.auth.onAuthStateChange((event, session) => {
        if (event === 'SIGNED_IN' || session?.access_token) {
          try {
            window.__authGateRemoteSignedIn = true;
            window.__authGateLoggedIn = true;
            console.debug('authGate: sign-in detected in another tab — waiting for explicit continue signal');
          } catch (e) {
            console.warn('authGate cross-tab handler error', e);
          }
        }
      });

      window.addEventListener('storage', (ev) => {
        if (!ev || !ev.key) return;

        if (ev.key === '__tharaga_magic_confirmed') {
            window.__authGateLoggedIn = true;
            // Keep modal OPEN so iframe shows “Continue”
            // Resolve any waiters if present
            if (signInResolve) { try { signInResolve({ signedIn: true }); } catch (_) {} signInPromise = signInResolve = signInReject = null; }
            return;
        }

        if (ev.key === '__tharaga_magic_continue') {
          window.__authGateLoggedIn = true;
          // Keep modal OPEN so iframe shows “Continue”
          if (signInResolve) { try { signInResolve({ signedIn: true }); } catch (_) {} signInPromise = signInResolve = signInReject = null; }
          return;
        }

      });

    } catch (e) {
      console.warn('authGate: setupAuthCrossTabSync failed', e);
    }
  })();

  console.debug && console.debug('authGate injected — use authGate.attachAuthGate(selector, actionFn)');
})();