(function(){
  'use strict';

  const SUPABASE_URL = 'https://wedevtjjmdvngyshqdro.supabase.co';
  const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndlZGV2dGpqbWR2bmd5c2hxZHJvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU0NzYwMzgsImV4cCI6MjA3MTA1MjAzOH0.Ex2c_sx358dFdygUGMVBohyTVto6fdEQ5nydDRh9m6M';

  const template = document.createElement('template');
  template.innerHTML = `
    <style>
      :host{ display:inline-block; font-family: Inter, system-ui, -apple-system, Segoe UI, Roboto, Arial; }
      .btn{ display:inline-flex; align-items:center; gap:8px; padding:8px 12px; border-radius:999px; border:1px solid #e5e7eb; background:#fff; color:#111; font-weight:700; cursor:pointer; box-shadow:0 2px 8px rgba(0,0,0,.06); transition: transform .08s ease, background .2s ease, box-shadow .2s ease; }
      .btn:hover{ background:#f8fafc; box-shadow:0 6px 20px rgba(0,0,0,.08); }
      .btn:active{ transform: translateY(1px); }
      .btn.gold{ border-color: rgba(212,175,55,.45); background: linear-gradient(180deg, #f9f5e7, #f3e6b6); color:#111; }
      .btn.gold:hover{ background: linear-gradient(180deg, #fff7d6, #f0de9a); }
      .spinner{ width:14px; height:14px; border:2px solid rgba(0,0,0,.15); border-top-color:#111; border-radius:50%; animation:spin .8s linear infinite }
      @keyframes spin{ to{ transform: rotate(360deg);} }
      .avatar{ width:28px; height:28px; border-radius:50%; background: #111827; color:#f9fafb; display:inline-flex; align-items:center; justify-content:center; font-size:13px; font-weight:800;}
      .wrap{ position: relative; }
      .menu{ position:absolute; top: calc(100% + 8px); right:0; min-width:220px; background:#fff; border:1px solid #e5e7eb; border-radius:12px; box-shadow:0 16px 40px rgba(0,0,0,.12); padding:8px; display:none; }
      .menu[open]{ display:block; animation:fadey .12s ease-out; }
      @keyframes fadey{ from{ opacity:0; transform: translateY(-4px);} to{ opacity:1; transform:none;} }
      .item{ display:flex; align-items:center; gap:10px; padding:10px; border-radius:10px; cursor:pointer; color:#111; text-decoration:none; }
      .item:hover{ background:#f8fafc; }
      .meta{ padding:10px 10px 6px; font-size:12px; color:#6b7280; }
      .divider{ height:1px; background:linear-gradient(90deg, transparent, #e5e7eb, transparent); margin:6px 0; }
      .sr-only{ position:absolute; width:1px; height:1px; padding:0; margin:-1px; overflow:hidden; clip:rect(0,0,0,0); white-space:nowrap; border:0; }
    </style>
    <div class="wrap">
      <button part="button" class="btn gold" id="authBtn"><span id="btnIcon">🔐</span><span id="btnText">Sign in</span></button>
      <div class="menu" id="menu" role="menu" aria-hidden="true">
        <div id="userMeta" class="meta"></div>
        <div class="divider"></div>
        <a class="item" id="viewProfile" href="#" role="menuitem">Account</a>
        <button class="item" id="signOut" role="menuitem">Sign out</button>
      </div>
      <span class="sr-only" aria-live="polite" id="sr"></span>
    </div>
  `;

  class TharagaAuthHeader extends HTMLElement {
    constructor(){
      super();
      this.attachShadow({ mode: 'open' });
      this.shadowRoot.appendChild(template.content.cloneNode(true));
      this.$btn = this.shadowRoot.getElementById('authBtn');
      this.$btnText = this.shadowRoot.getElementById('btnText');
      this.$btnIcon = this.shadowRoot.getElementById('btnIcon');
      this.$menu = this.shadowRoot.getElementById('menu');
      this.$userMeta = this.shadowRoot.getElementById('userMeta');
      this.$sr = this.shadowRoot.getElementById('sr');
      this._menuOpen = false;
      this._loading = false;
      this._user = null;
      this._subscription = null;
      this._onDocClick = this._onDocClick.bind(this);
    }

    connectedCallback(){
      this.$btn.addEventListener('click', () => this._onPrimary());
      this.shadowRoot.getElementById('signOut').addEventListener('click', () => this._signOut());
      this.shadowRoot.getElementById('viewProfile').addEventListener('click', (e)=>{ e.preventDefault(); this._openAccount(); });
      document.addEventListener('click', this._onDocClick);
      this._init();
    }

    disconnectedCallback(){
      document.removeEventListener('click', this._onDocClick);
      try { this._subscription && this._subscription.unsubscribe && this._subscription.unsubscribe(); } catch(_){ }
    }

    async _ensureSupabase(){
      if (window.supabase && window.supabase.auth) return window.supabase;
      try {
        const mod = await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm');
        const c = mod.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } });
        window.supabase = c;
        return c;
      } catch (e) { return null; }
    }

    async _init(){
      await this._setLoading(true);
      const supabase = await this._ensureSupabase();
      if (!supabase) { this._renderSignedOut(); await this._setLoading(false); return; }

      try {
        const { data } = await supabase.auth.getSession();
        const session = data && data.session;
        this._user = session ? (session.user || null) : null;
      } catch(_) { this._user = null; }
      this._render();

      try {
        const sub = supabase.auth.onAuthStateChange((event, session) => {
          this._user = session && session.user ? session.user : null;
          this._render();
        });
        this._subscription = sub && sub.data && sub.data.subscription ? sub.data.subscription : sub;
      } catch(_) {}

      // cross-tab: listen for broadcast/storage signals from existing flows
      try {
        if ('BroadcastChannel' in window) {
          const bc = new BroadcastChannel('tharaga-auth');
          bc.addEventListener('message', (ev) => {
            if (ev && ev.data && ev.data.type === 'THARAGA_AUTH_SUCCESS') {
              this._refreshSession();
            }
          });
        }
      } catch(_) {}
      window.addEventListener('storage', (ev) => {
        try {
          if (ev && ev.key === '__tharaga_magic_confirmed') this._refreshSession();
          if (ev && ev.key === '__tharaga_magic_continue') this._refreshSession();
        } catch(_) {}
      });
      await this._setLoading(false);
    }

    async _refreshSession(){
      try {
        const supabase = await this._ensureSupabase();
        if (!supabase) return;
        const { data } = await supabase.auth.getSession();
        const session = data && data.session;
        this._user = session ? (session.user || null) : null;
        this._render();
      } catch(_) {}
    }

    _onDocClick(e){
      if (!this._menuOpen) return;
      const path = e.composedPath ? e.composedPath() : [];
      if (path.indexOf(this) === -1) this._toggleMenu(false);
    }

    _render(){
      if (this._loading) { this._renderLoading(); return; }
      if (this._user) { this._renderAuthed(); } else { this._renderSignedOut(); }
    }

    _renderLoading(){
      this.$btn.disabled = true;
      this.$btnIcon.innerHTML = '<span class="spinner" aria-hidden="true"></span>';
      this.$btnText.textContent = 'Loading…';
    }

    _renderSignedOut(){
      this.$btn.disabled = false;
      this.$btn.classList.add('gold');
      this.$btnIcon.textContent = '🔐';
      this.$btnText.textContent = 'Sign in';
      this.$menu.removeAttribute('open');
      this.$menu.setAttribute('aria-hidden','true');
      this._menuOpen = false;
    }

    _renderAuthed(){
      this.$btn.disabled = false;
      this.$btn.classList.remove('gold');
      const letter = (this._user.email || 'U').slice(0,1).toUpperCase();
      this.$btnIcon.innerHTML = `<span class="avatar" aria-hidden="true">${letter}</span>`;
      this.$btnText.textContent = this._user.email || 'Account';
      this.$userMeta.textContent = this._user.email || '';
    }

    async _onPrimary(){
      if (this._loading) return;
      if (!this._user) {
        // open modal via authGate if available, else redirect
        try {
          if (window.authGate && window.authGate.openLoginModal) {
            await window.authGate.openLoginModal({ next: location.pathname + location.search });
            return;
          }
        } catch(_) {}
        // fallback: navigate to login page
        location.href = '/login_signup_glassdrop/?embed=0&next=' + encodeURIComponent(location.pathname + location.search);
        return;
      }
      this._toggleMenu();
    }

    _toggleMenu(force){
      const next = typeof force === 'boolean' ? force : !this._menuOpen;
      this._menuOpen = next;
      if (next) {
        this.$menu.setAttribute('open','');
        this.$menu.setAttribute('aria-hidden','false');
      } else {
        this.$menu.removeAttribute('open');
        this.$menu.setAttribute('aria-hidden','true');
      }
    }

    async _signOut(){
      const supabase = await this._ensureSupabase();
      if (!supabase) return;
      this._setLoading(true);
      try {
        await supabase.auth.signOut();
        this._user = null;
        this._sr.textContent = 'Signed out';
      } catch(_) {}
      this._toggleMenu(false);
      this._setLoading(false);
      this._renderSignedOut();
    }

    async _openAccount(){
      this._toggleMenu(false);
      try { location.href = '/account'; } catch(_) {}
    }

    async _setLoading(v){
      this._loading = !!v;
      this._render();
    }
  }

  if (!customElements.get('auth-header')) {
    customElements.define('auth-header', TharagaAuthHeader);
  }
})();

