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
  // New: inline login UI rendered into the iframe via srcdoc when true
  const USE_INLINE_LOGIN = false;
  const MAGIC_CONFIRM_URL = new URL('/magic-confirm.html', location.origin).href;
  const AUTO_RESUME_PENDING = false;

  // Build allowed origin list robustly (supports absolute AND relative LOGIN_IFRAME_URL)
  let ALLOWED_IFRAME_ORIGINS = [];
  try {
    ALLOWED_IFRAME_ORIGINS = [ new URL(LOGIN_IFRAME_URL, location.origin).origin ];
  } catch (e) {
    ALLOWED_IFRAME_ORIGINS = [ location.origin ];
    console.warn('auth-gate: invalid LOGIN_IFRAME_URL — falling back to current origin', e);
  }
  // Allow same-origin messages when rendering inline login
  try {
    if (USE_INLINE_LOGIN && ALLOWED_IFRAME_ORIGINS.indexOf(location.origin) === -1) {
      ALLOWED_IFRAME_ORIGINS.push(location.origin);
    }
  } catch(_) {}

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
        <div class="authgate-success" id="authGateSuccess" aria-live="polite" hidden>
          <span class="authgate-check">✅</span>
          <span id="authGateSuccessText">Welcome!</span>
        </div>
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
      background: rgba(10,10,10,.35);
      backdrop-filter: blur(8px) saturate(120%);
      -webkit-backdrop-filter: blur(8px) saturate(120%);
    }
    #authGateModal .authgate-dialog { width: min(1100px, 98%); height: min(850px, 92%); position:relative; display:flex; flex-direction:column; overflow:hidden; }
    #authGateModal .authgate-close { position:absolute; top:10px; right:12px; z-index:3; border:none; font-size:20px; cursor:pointer; padding:6px; display:none; }
    #authGateModal .authgate-frame-wrap { display:flex; align-items:center; justify-content:center; padding:28px; flex:1; min-height:0; } 
    #authGateModal iframe#authGateIframe { width:100%; height:100%; border:0; display:block; border-radius:12px; }
    #authGateModal .authgate-success { position:absolute; left:12px; right:12px; top:12px; display:flex; align-items:center; gap:8px; background:#f0fdf4; color:#166534; border:1px solid #bbf7d0; border-radius:10px; padding:10px 12px; box-shadow:0 6px 18px rgba(0,0,0,.08); z-index:4; animation: authfade .35s ease; }
    #authGateModal .authgate-check { font-size:18px; }
    @keyframes authfade { from { opacity:0; transform: translateY(-6px); } to { opacity:1; transform: none; } }
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
  let successBanner = overlay.querySelector('#authGateSuccess');
  let successText = overlay.querySelector('#authGateSuccessText');

  if (!modal || !dialog || !iframe || !closeBtn) {
    // Ensure they are obtained once DOMContentLoaded runs
    document.addEventListener('DOMContentLoaded', function findElementsOnce() {
      document.removeEventListener('DOMContentLoaded', findElementsOnce);
      modal = overlay.querySelector('.authgate-backdrop');
      dialog = overlay.querySelector('.authgate-dialog');
      iframe = overlay.querySelector('#authGateIframe');
      closeBtn = overlay.querySelector('.authgate-close');
      successBanner = overlay.querySelector('#authGateSuccess');
      successText = overlay.querySelector('#authGateSuccessText');
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

      if (USE_INLINE_LOGIN) {
        // Render a minimal login form directly inside the iframe (same-origin)
        iframe.removeAttribute('src');
        iframe.srcdoc = buildInlineLoginHTML({
          supabaseUrl: SUPABASE_URL,
          supabaseAnonKey: SUPABASE_ANON_KEY,
          magicConfirmUrl: MAGIC_CONFIRM_URL,
          next: next || '',
        });
        // If the user is already signed in on this page, reflect success and close
        (async () => {
          try {
            const client = await ensureParentSupabaseClient();
            const { data } = await client.auth.getSession();
            if (data?.session?.user) {
              showParentSuccess(data.session.user.email || null);
              setTimeout(() => { try { closeLoginModal(); } catch(_) {} }, 1800);
            }
          } catch(_) {}
        })();
      } else {
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
      }
    } catch (e) {
      if (!USE_INLINE_LOGIN) iframe.src = LOGIN_IFRAME_URL;
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
    if (successBanner) { try { successBanner.hidden = true; } catch(_) {} }
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
        try { showParentSuccess(msg?.user?.email || null); } catch(_) {}
        if (signInResolve) { try { signInResolve({ signedIn: true, user: msg.user || null }); } catch (_) {} signInPromise = signInResolve = signInReject = null; }
        setTimeout(() => { try { closeLoginModal(); } catch(_) {} }, 1800);
        return;
      }

      if (msg.type === 'tharaga_verify_failed') {
      try {
      if (successBanner && successText) {
      successText.textContent = (msg.error_description || msg.message || 'Login link expired. Please request a new link.');
      successBanner.style.background = '#fef2f2';
      successBanner.style.border = '1px solid #fecaca';
      successBanner.style.color ='#991b1b';
      successBanner.hidden = false;
      }
      } catch (_) {}
      setTimeout(() => { try { closeLoginModal(); } catch(_) {}}, 1200);
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

  function showParentSuccess(email) {
    // Disabled: do not show the green "Welcome" banner in the parent modal
    // Keeping this function as a no-op ensures existing flows that call it
    // (message events, cross-tab sync) still work without UI side effects.
    return;
  }

  // Build inline login HTML for iframe.srcdoc
  function buildInlineLoginHTML({ supabaseUrl, supabaseAnonKey, magicConfirmUrl, next }) {
    const safeNext = typeof next === 'string' ? next : '';
    // NOTE: keep this minimal to avoid CSP issues
    return `<!doctype html><html><head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <title>Sign in</title>
      <style>
        body{margin:0;font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial;color:#111;}
        .wrap{display:flex;align-items:center;justify-content:center;min-height:100vh;background:#f6f7f9}
        .card{background:#fff;border:1px solid #e5e7eb;border-radius:12px;box-shadow:0 6px 22px rgba(0,0,0,.08);padding:22px;width:min(420px,95vw)}
        h1{font-size:20px;margin:0 0 8px}
        p{margin:0 0 12px;color:#444}
        label{display:block;font-size:13px;margin:10px 0 6px;color:#222}
        input{width:100%;padding:12px;border:1px solid #d0d7de;border-radius:10px;outline:none}
        input:disabled{background:#f3f4f6}
        .row{display:flex;gap:10px;margin-top:12px}
        button{cursor:pointer;border:0;border-radius:10px;padding:12px 14px;font-weight:700}
        .primary{background:#16a34a;color:#fff}
        .ghost{background:#eef2ff;color:#1e293b}
        .msg{margin-top:10px;font-size:14px}
        .ok{color:#16a34a}
        .err{color:#dc2626}
        .success{display:none;margin-top:12px;padding:12px;border:1px solid #bbf7d0;background:#f0fdf4;border-radius:10px;color:#166534}
        .success.show{display:block;animation:fade .35s ease}
        .check{font-size:20px;margin-right:6px}
        @keyframes fade{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:none}}
      </style>
    </head>
    <body>
      <div class="wrap">
        <div class="card" aria-live="polite">
          <h1>Login / Sign up</h1>
          <p>Use your email. We'll send you a secure magic link.</p>
          <form id="f" autocomplete="on">
            <label for="em">Email</label>
            <input id="em" name="email" type="email" placeholder="you@domain.com" required autocomplete="email" />
            <div class="row">
              <button id="go" class="primary" type="submit">Send Magic Link</button>
              <button id="cancel" class="ghost" type="button">Cancel</button>
            </div>
            <div id="m" class="msg" role="status"></div>
          </form>
          <div id="s" class="success"><span class="check">✅</span><strong>Welcome!</strong> You're signed in. This will close…</div>
        </div>
      </div>
      <script type="module">
        import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';
        const SUPABASE_URL = ${JSON.stringify(supabaseUrl)};
        const SUPABASE_ANON_KEY = ${JSON.stringify(supabaseAnonKey)};
        const MAGIC_CONFIRM_URL = ${JSON.stringify(magicConfirmUrl)};
        const NEXT = ${JSON.stringify(safeNext)};
        const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

        const f = document.getElementById('f');
        const em = document.getElementById('em');
        const go = document.getElementById('go');
        const cancelBtn = document.getElementById('cancel');
        const msg = document.getElementById('m');
        const success = document.getElementById('s');

        function setMsg(t, ok){ msg.textContent = t||''; msg.className='msg'+(t? (ok?' ok':' err'):''); }
        function disableForm(d){ em.disabled=d; go.disabled=d; }

        cancelBtn.addEventListener('click', ()=>{
          try { window.parent.postMessage({ type: 'close_login_modal' }, '*'); } catch(_) {}
        });

        f.addEventListener('submit', async (e)=>{
          e.preventDefault();
          const email = (em.value||'').trim();
          if (!email) { setMsg('Enter a valid email'); em.focus(); return; }
          disableForm(true);
          setMsg('Check your email for a login link ✉️', true);
          try {
            const emailRedirectTo = MAGIC_CONFIRM_URL + (NEXT? ('?next='+encodeURIComponent(NEXT)) : '');
            const { error } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo } });
            if (error) { setMsg(error.message); disableForm(false); return; }
          } catch (err) {
            setMsg('Failed to send magic link. Try again.');
            disableForm(false);
          }
        });

        // Reflect login state in this modal (same-origin session sync)
        supabase.auth.onAuthStateChange((event, session)=>{
          if (event === 'SIGNED_IN' && session?.user) {
            try { setMsg(''); success.classList.add('show'); } catch(_) {}
            setTimeout(()=>{
              try { window.parent.postMessage({ type: 'close_login_modal' }, '*'); } catch(_) {}
            }, 1800);
          }
        });
      </script>
    </body></html>`;
  }

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
        try { window.supabase = sClient; } catch(_) {}
      } else {
        try { window.supabase = sClient; } catch(_) {}
      }

      sClient.auth.onAuthStateChange((event, session) => {
        if (event === 'SIGNED_IN' || session?.access_token) {
          try {
            window.__authGateRemoteSignedIn = true;
            window.__authGateLoggedIn = true;
            showParentSuccess(session?.user?.email || null);
            // Auto-close shortly after success on parent
            setTimeout(() => { try { closeLoginModal(); } catch(_) {} }, 1800);
          } catch (e) {
            console.warn('authGate cross-tab handler error', e);
          }
        }
      });

      window.addEventListener('storage', (ev) => {
        if (!ev || !ev.key) return;

        if (ev.key === '__tharaga_magic_confirmed') {
            window.__authGateLoggedIn = true;
            try {
              const payload = JSON.parse(ev.newValue||'null');
              showParentSuccess(payload?.user?.email || null);
            } catch(_) {}
            if (signInResolve) { try { signInResolve({ signedIn: true }); } catch (_) {} signInPromise = signInResolve = signInReject = null; }
            setTimeout(() => { try { closeLoginModal(); } catch(_) {} }, 1800);
            return;
        }

        if (ev.key === '__tharaga_magic_continue') {
          window.__authGateLoggedIn = true;
          try {
            const payload = JSON.parse(ev.newValue||'null');
            showParentSuccess(payload?.user?.email || null);
          } catch(_) {}
          if (signInResolve) { try { signInResolve({ signedIn: true }); } catch (_) {} signInPromise = signInResolve = signInReject = null; }
          setTimeout(() => { try { closeLoginModal(); } catch(_) {} }, 1800);
          return;
        }

      });

    } catch (e) {
      console.warn('authGate: setupAuthCrossTabSync failed', e);
    }
  })();

  console.debug && console.debug('authGate injected — use authGate.attachAuthGate(selector, actionFn)');
})();