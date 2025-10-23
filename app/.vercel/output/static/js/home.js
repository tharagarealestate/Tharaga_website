(function(){
  'use strict';
  const $ = (sel, root=document) => root.querySelector(sel);
  const $$ = (sel, root=document) => Array.from(root.querySelectorAll(sel));

  // Persist lightweight buyer profile in localStorage
  const KEY = '__thg_buyer_profile_v1';
  function loadProfile(){ try { return JSON.parse(localStorage.getItem(KEY)||'null')||{} } catch(_) { return {} } }
  function saveProfile(p){ try { localStorage.setItem(KEY, JSON.stringify(p)); } catch(_){} }

  const profile = loadProfile();

  // Personalize hero line and trust pill
  try {
    const city = profile.city || 'Tamil Nadu';
    const budget = profile.maxPrice ? ` under ₹${Number(profile.maxPrice).toLocaleString('en-IN')}` : '';
    const hero = $('#hero_title');
    const sub = $('#hero_sub');
    const trust = $('#home_pill_trust');
    if (hero) hero.textContent = `Find Your Dream Home in ${city}${budget}—Zero Brokers, Zero Commissions`;
    if (sub && profile.metro) sub.textContent = 'Near‑metro picks, price/ft² value, climate & vastu insights. Culture‑aware tools for India & NRIs.';
    if (trust && profile.metro) trust.textContent = 'Verified • Near‑Metro Focus';
  } catch(_){ }

  // Quick select chips toggle + write preferences
  $$(".chip").forEach(ch => {
    ch.addEventListener('click', () => {
      const on = ch.getAttribute('aria-pressed') === 'true';
      ch.setAttribute('aria-pressed', on ? 'false' : 'true');
      const bhk = ch.dataset.bhk; const type = ch.dataset.type; const metro = ch.dataset.metro;
      const p = loadProfile();
      if (bhk) p.bhk = on ? undefined : Number(bhk);
      if (type) p.type = on ? undefined : type;
      if (metro) p.metro = !on;
      saveProfile(p);
    });
  });

  // Resume button visibility
  try { if (profile && (profile.city || profile.maxPrice || profile.bhk || profile.type)) $('#resumeBtn').hidden = false; } catch(_){}

  // Browsing flow — send to property-listing with query params for hydration
  function toListings(resume){
    const p = loadProfile();
    const q = $('#q')?.value || p.city || '';
    const min = Number($('#minPrice')?.value || p.minPrice || '') || '';
    const max = Number($('#maxPrice')?.value || p.maxPrice || '') || '';
    const bhk = p.bhk || '';
    const type = p.type || '';
    const metro = p.metro ? '1' : '';
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    if (min) params.set('minPrice', String(min));
    if (max) params.set('maxPrice', String(max));
    if (bhk) params.set('bhk', String(bhk));
    if (type) params.set('ptype', String(type));
    if (metro) params.set('near_metro', '1');
    // Save for resume
    saveProfile({ ...p, city: q || p.city, minPrice: min || p.minPrice, maxPrice: max || p.maxPrice });
    const url = '/property-listing/?' + params.toString();
    location.href = url;
  }

  $('#browseBtn')?.addEventListener('click', () => toListings(false));
  $('#resumeBtn')?.addEventListener('click', () => toListings(true));

  // Auth open from header
  $('#openAuthBtn')?.addEventListener('click', () => { try { window.__thgOpenAuthModal && window.__thgOpenAuthModal(); } catch(_){} });

  // Hook buttons that should open the assistant inline if present on the page
  ['openAssistant','openAssistant2'].forEach(id=>{
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener('click', ()=>{
      try { typeof window.openAssistant === 'function' ? window.openAssistant() : (document.getElementById(id).dataset.fallback='1'); }
      catch(_) { location.href = '/cta-embed.html?embed=cta&open=1'; }
    });
  });
})();
