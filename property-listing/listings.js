// listings.js — v3 (replace existing file)
// Version: 3
// Notes: stable debouncer, accessible & persistent "pill" UI, same filtering logic.

import * as App from './app.js?v=20251002';

const PAGE_SIZE = 9;
let ALL = [];
let PAGE = 1;
let FROM_PREFS = false; // indicates filters came from URL/localStorage prefs

const deb = (fn, ms = 150) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; };

function setLocalityAllSelected(){
  const el = document.querySelector('#locality');
  if (!el) return;
  Array.from(el.options).forEach(o => o.selected = (o.value === 'All'));
}
function hydrateCityOptions(){
  const sel = document.querySelector('#city');
  if (!sel) return;
  const cities = Array.from(new Set(ALL.map(p=>p.city).filter(Boolean))).sort();
  sel.innerHTML = cities.map(c=>`<option value="${c}">${c}</option>`).join('');
  sel.addEventListener('change', ()=>{
    const selectedCities = Array.from(sel.selectedOptions).map(o=>o.value);
    hydrateLocalityOptions(selectedCities);
    PAGE=1; apply();
  });
}
function hydrateLocalityOptions(selectedCities){
  const localitySelect = document.querySelector('#locality');
  if (!localitySelect) return;
  const scope = (!selectedCities || selectedCities.length===0) ? ALL : ALL.filter(p=> selectedCities.includes(p.city));
  const localities = Array.from(new Set(scope.map(p=>p.locality).filter(Boolean))).sort();
  localitySelect.innerHTML = `<option value="All" selected>All</option>` + localities.map(l=>`<option value="${l}">${l}</option>`).join('');
  setLocalityAllSelected();
}
function activeFilterBadges(filters){
  const wrap = document.querySelector('#activeFilters'); if(!wrap) return;
  const parts = [];
  if (FROM_PREFS) parts.push(`<span class="tag" style="background:#fef3c7;color:#92400e">Filtered by your preferences</span>`);
  Object.entries(filters).forEach(([k,v])=>{
    if(!v) return;
    const has = Array.isArray(v) ? v.length>0 : String(v).trim()!=='';
    if(!has) return;
    const label = Array.isArray(v)? v.join(', ') : v;
    const chip = `<button class="chip-rem" data-key="${k}" type="button" aria-label="Remove ${k}"><span>${k}: ${label}</span> ✕</button>`;
    parts.push(chip);
  });
  wrap.innerHTML = parts.join(' ');

  // Wire remove handlers (clear specific filter then apply)
  wrap.querySelectorAll('.chip-rem').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      const key = btn.getAttribute('data-key');
      switch(key){
        case 'q': { const el=document.getElementById('q'); if(el) el.value=''; break; }
        case 'city': { const el=document.getElementById('city'); if(el) Array.from(el.options).forEach(o=>o.selected=false); break; }
        case 'locality': { setLocalityAllSelected(); break; }
        case 'price': { const a=document.getElementById('minPrice'); const b=document.getElementById('maxPrice'); if(a) a.value=''; if(b) b.value=''; try{ document.getElementById('priceMinSlider').dispatchEvent(new Event('input',{bubbles:true})); document.getElementById('priceMaxSlider').dispatchEvent(new Event('input',{bubbles:true})); } catch(_){} break; }
        case 'type': { const el=document.getElementById('ptype'); if(el) el.value=''; break; }
        case 'bhk': { const el=document.getElementById('bhk'); if(el) el.value=''; break; }
        case 'furnished': { const el=document.getElementById('furnished'); if(el) el.value=''; break; }
        case 'facing': { const el=document.getElementById('facing'); if(el) el.value=''; break; }
        case 'area': { const a=document.getElementById('minArea'); const b=document.getElementById('maxArea'); if(a) a.value=''; if(b) b.value=''; break; }
        case 'amenity': { const el=document.getElementById('amenity'); if(el) el.value=''; break; }
        case 'metro': { const wm=document.getElementById('wantMetro'); const mw=document.getElementById('maxWalk'); if(wm) wm.checked=false; if(mw) mw.value=10; break; }
      }
      PAGE=1; apply(); syncUrlWithFilters();
    });
  });
}

function collectFilters(){
  const q = (document.querySelector('#q')?.value || "").trim();

  const activePill = document.querySelector('.filter-pill.active');
  const mode = activePill && activePill.dataset.type?.toLowerCase() !== 'all'
    ? (activePill.dataset.type || '').toLowerCase()
    : '';

  const cityEl = document.querySelector('#city');
  const citySel = cityEl ? Array.from(cityEl.selectedOptions).map(o=>o.value) : [];

  const localitySel = document.querySelector('#locality')
    ? Array.from(document.querySelector('#locality').selectedOptions).map(o=>o.value)
    : [];

  const minP = parseInt(document.querySelector('#minPrice')?.value||0) || 0;
  const maxP = parseInt(document.querySelector('#maxPrice')?.value||0) || 0;
  const ptype = document.querySelector('#ptype')?.value || '';
  const bhk = document.querySelector('#bhk')?.value || '';
  const furnished = document.querySelector('#furnished')?.value || '';
  const facing = document.querySelector('#facing')?.value || '';
  const minA = parseInt(document.querySelector('#minArea')?.value||0) || 0;
  const maxA = parseInt(document.querySelector('#maxArea')?.value||0) || 0;
  const amenity = (document.querySelector('#amenity')?.value || "").trim();
  const wantMetro = !!document.querySelector('#wantMetro')?.checked;
  const maxWalk = parseInt(document.querySelector('#maxWalk')?.value||10) || 10;
  const sort = document.querySelector('#sort')?.value || 'relevance';

  activeFilterBadges({
    q,
    city: citySel,
    locality: localitySel,
    price:`${minP||''}-${maxP||''}`,
    type: ptype, bhk, furnished, facing,
    area:`${minA||''}-${maxA||''}`,
    amenity,
    metro: wantMetro ? `≤ ${maxWalk} min walk` : ''
  });

  return { q, mode, citySel, localitySel, minP, maxP, ptype, bhk, furnished, facing, minA, maxA, amenity, wantMetro, maxWalk, sort };
}

// ---- New: Parse and apply incoming URL params/session filters ----
function parseBudgetLabelToRange(label){
  if (!label) return { min: null, max: null };
  const s = String(label).trim();

  // Helper to parse "40L", "1.25Cr", plain integers (assume INR)
  function parseINRToken(tok){
    tok = String(tok).trim();
    // Crores
    let m = tok.match(/^(₹?\s*)?(\d+(?:\.\d+)?)\s*(cr|crore)s?/i);
    if (m) return Math.round(parseFloat(m[2]) * 10000000);
    // Lakhs
    m = tok.match(/^(₹?\s*)?(\d+(?:\.\d+)?)\s*(l|lac|lakh)s?/i);
    if (m) return Math.round(parseFloat(m[2]) * 100000);
    // Plain number (already INR)
    const n = parseInt(tok.replace(/[^0-9]/g, ''), 10);
    return Number.isFinite(n) ? n : null;
  }

  // Common shortcuts
  if (/3\s*Cr\s*\+/.test(s)) return { min: 30000000, max: null };

  // Normalize common separators: en-dash, hyphen, "to"
  const parts = s
    .replace(/–/g, '-')
    .replace(/—/g, '-')
    .replace(/to/i, '-')
    .split('-')
    .map(t => t.trim())
    .filter(Boolean);

  if (parts.length === 2){
    const min = parseINRToken(parts[0]);
    const max = parseINRToken(parts[1]);
    return { min: Number.isFinite(min) ? min : null, max: Number.isFinite(max) ? max : null };
  }
  if (parts.length === 1){
    const only = parseINRToken(parts[0]);
    return { min: Number.isFinite(only) ? only : null, max: null };
  }
  return { min: null, max: null };
}

function titleCase(str){
  return String(str||'').toLowerCase().replace(/(^|\s)([a-z])/g, (m, p1, c)=> p1 + c.toUpperCase());
}

function applyQueryParams(){
  try {
    const params = new URLSearchParams(location.search);

    // Support both buyer-form and home-search param names
    const qParam = params.get('q') || params.get('location') || params.get('locality') || '';
    const typeParam = (params.get('ptype') || params.get('type') || params.get('property_type') || '').toLowerCase();
    const budgetLabel = params.get('budget') || '';
    const cityParam = params.get('city') || '';
    const localityParam = params.get('locality') || '';
    const priceMinParam = parseInt(params.get('price_min')||'',10);
    const priceMaxParam = parseInt(params.get('price_max')||'',10);
    const sortParam = (params.get('sort') || '').toLowerCase();

    // Fallback to sessionStorage meta if URL empty
    if (!qParam && !typeParam && !budgetLabel) {
      try {
        const saved = JSON.parse(sessionStorage.getItem('tharaga_matches_v1')||'null');
        if (saved && saved.meta && saved.meta.search) {
          if (!params.get('q') && saved.meta.search.location) params.set('q', saved.meta.search.location);
          if (!params.get('property_type') && saved.meta.search.property_type) params.set('property_type', saved.meta.search.property_type);
          if (!params.get('budget') && saved.meta.search.budget) params.set('budget', saved.meta.search.budget);
        }
      } catch(_){}
    }

    // Progressive enhancement: fallback to stored preferences if URL is empty
    if (![...params.keys()].length) {
      try {
        const prefs = JSON.parse(localStorage.getItem('tharaga_user_prefs')||'null');
        if (prefs) {
          if (prefs.locality) params.set('locality', prefs.locality);
          if (prefs.property_type) params.set('type', String(prefs.property_type).toLowerCase());
          if (prefs.budget) params.set('budget', prefs.budget);
          if (prefs.timeline && /asap/i.test(prefs.timeline)) params.set('sort','newest');
        }
      } catch(_) {}
    }

    // Apply search text: prefer q, else location or city
    const qEl = document.querySelector('#q');
    const qValue = (params.get('q') || params.get('location') || params.get('locality') || cityParam || '').trim();
    if (qEl && qValue) {
      qEl.value = qValue;
      qEl.dispatchEvent(new Event('input', { bubbles: true }));
    }

    // Apply property type select
    const ptypeEl = document.querySelector('#ptype');
    let ptypeVal = '';
    if (typeParam) {
      // If param looks like UI type (Apartment/Villa/Plot/Independent House)
      const maybeUi = titleCase(typeParam);
      const options = ptypeEl ? Array.from(ptypeEl.options).map(o=>o.value) : [];
      if (options.includes(maybeUi)) ptypeVal = maybeUi;
    }
    // Also map buy/rent/commercial pill into mode (handled by pills below)
    const pillType = ['buy','rent','commercial'].includes(typeParam) ? typeParam : '';

    if (ptypeEl && ptypeVal) {
      ptypeEl.value = ptypeVal;
      ptypeEl.dispatchEvent(new Event('change', { bubbles: true }));
    }

    // Apply pills (Buy/Rent/Commercial)
    if (pillType) {
      // Persist desired pill so wireUI picks it up reliably even if not yet bound
      try { localStorage.setItem('activeFilterType', pillType); } catch(_) {}
      const pill = document.querySelector(`.filter-pill[data-type="${pillType}"]`);
      if (pill) { try { pill.click(); } catch(_) {} }
    } else {
      // If deep-link has filters but no explicit pill, default to 'buy'
      const hasFilterSignal = !!(qParam || budgetLabel || localityParam || Number.isFinite(priceMinParam) || Number.isFinite(priceMaxParam) || sortParam);
      if (hasFilterSignal) {
        try { localStorage.setItem('activeFilterType', 'buy'); } catch(_) {}
        const pill = document.querySelector(`.filter-pill[data-type="buy"]`);
        if (pill) { try { pill.click(); } catch(_) {} }
      }
    }

    // Budget handling: supports label like "₹1Cr – ₹2Cr" or numeric minPrice/maxPrice or price_min/price_max
    const minFromQuery = parseInt(params.get('minPrice')||'',10) || (Number.isFinite(priceMinParam) ? priceMinParam : NaN);
    const maxFromQuery = parseInt(params.get('maxPrice')||'',10) || (Number.isFinite(priceMaxParam) ? priceMaxParam : NaN);
    let minPrice = Number.isFinite(minFromQuery) ? minFromQuery : null;
    let maxPrice = Number.isFinite(maxFromQuery) ? maxFromQuery : null;
    if (!minPrice && !maxPrice && budgetLabel) {
      const rng = parseBudgetLabelToRange(budgetLabel);
      minPrice = rng.min; maxPrice = rng.max;
    }

    // Push into hidden inputs and sliders if present
    const minHidden = document.getElementById('minPrice');
    const maxHidden = document.getElementById('maxPrice');
    const minSlider = document.getElementById('priceMinSlider');
    const maxSlider = document.getElementById('priceMaxSlider');

    if (minPrice != null && minHidden) { minHidden.value = String(minPrice); }
    if (maxPrice != null && maxHidden) { maxHidden.value = String(maxPrice); }

    // Update slider UI first so app.js can sync hidden + progress, then fire change
    if (minPrice != null && minSlider) { try { minSlider.value = String(minPrice); minSlider.dispatchEvent(new Event('input', { bubbles: true })); } catch(_){} }
    if (maxPrice != null && maxSlider) { try { maxSlider.value = String(maxPrice); maxSlider.dispatchEvent(new Event('input', { bubbles: true })); } catch(_){} }

    // Apply locality selection if provided (supports comma separated list)
    if (localityParam) {
      const locEl = document.querySelector('#locality');
      if (locEl) {
        const wanted = String(localityParam).split(',').map(s=>s.trim().toLowerCase()).filter(Boolean);
        let matched = 0;
        Array.from(locEl.options).forEach(o => {
          const val = String(o.value||'').toLowerCase();
          if (wanted.includes(val)) { o.selected = true; matched++; }
        });
        if (matched>0) locEl.dispatchEvent(new Event('change', { bubbles: true }));
      }
    }

    // ---- Additional URL params hydration (from buyer form / links) ----
    // BHK
    const bhkParam = params.get('bhk') || params.get('bedrooms');
    if (bhkParam) {
      const el = document.querySelector('#bhk');
      if (el) { el.value = String(bhkParam); el.dispatchEvent(new Event('change', { bubbles: true })); }
    }
    // Furnished
    const furnishedParam = params.get('furnished');
    if (furnishedParam) {
      const el = document.querySelector('#furnished');
      if (el) { el.value = titleCase(furnishedParam); el.dispatchEvent(new Event('change', { bubbles: true })); }
    }
    // Facing
    const facingParam = params.get('facing');
    if (facingParam) {
      const el = document.querySelector('#facing');
      if (el) { el.value = titleCase(facingParam); el.dispatchEvent(new Event('change', { bubbles: true })); }
    }
    // Area
    const minAreaParam = parseInt(params.get('area_min')||params.get('minArea')||'',10);
    const maxAreaParam = parseInt(params.get('area_max')||params.get('maxArea')||'',10);
    if (Number.isFinite(minAreaParam)) { const el = document.querySelector('#minArea'); if (el) { el.value = String(minAreaParam); el.dispatchEvent(new Event('input', { bubbles: true })); } }
    if (Number.isFinite(maxAreaParam)) { const el = document.querySelector('#maxArea'); if (el) { el.value = String(maxAreaParam); el.dispatchEvent(new Event('input', { bubbles: true })); } }
    // Amenity
    const amenityParam = params.get('amenity') || params.get('amenities');
    if (amenityParam) { const el = document.querySelector('#amenity'); if (el) { el.value = amenityParam.split(',')[0]; el.dispatchEvent(new Event('input', { bubbles: true })); } }
    // Metro proximity
    const nearMetroParam = params.get('near_metro') || params.get('metro');
    const maxWalkParam = parseInt(params.get('max_walk')||params.get('walk')||params.get('maxWalk')||'',10);
    const wantMetroEl = document.getElementById('wantMetro');
    const maxWalkEl = document.getElementById('maxWalk');
    if (wantMetroEl && (nearMetroParam === '1' || /^(true|yes|on)$/i.test(String(nearMetroParam||'')))) {
      wantMetroEl.checked = true;
      wantMetroEl.dispatchEvent(new Event('change', { bubbles: true }));
    }
    if (Number.isFinite(maxWalkParam) && maxWalkEl) {
      maxWalkEl.value = String(maxWalkParam);
      maxWalkEl.dispatchEvent(new Event('change', { bubbles: true }));
    }

    // Map sort param: ai_relevance -> relevance
    if (sortParam) {
      const sortEl = document.querySelector('#sort');
      if (sortEl) {
        const mapped = (sortParam === 'ai_relevance') ? 'relevance' : sortParam;
        if (Array.from(sortEl.options).some(o=>o.value===mapped)) {
          sortEl.value = mapped; sortEl.dispatchEvent(new Event('change', { bubbles: true }));
        }
      }
    }

    // Finally, ensure apply happens at least once with new values
    document.querySelector('#apply')?.dispatchEvent(new Event('click', { bubbles: true }));

    // Mark deep link application and track
    FROM_PREFS = !!(qParam || typeParam || budgetLabel || localityParam || Number.isFinite(priceMinParam) || Number.isFinite(priceMaxParam) || sortParam);
    try { if (window.gtag && FROM_PREFS) window.gtag('event','listings_filters_applied',{ source:'deep_link' }); } catch(_) {}
  } catch (e) {
    console.warn('applyQueryParams failed', e);
  }
}

function apply(){
  const F = collectFilters();

  let filtered = ALL.filter(p=>{
    if (F.mode) {
      const lc = String(p.category || p.propertyCategory || p.type || '').toLowerCase();
      const isRent = /(rent|lease)/.test(lc);
      const isCommercial = /(commercial|office|shop|retail|industrial)/.test(lc);
      if (F.mode === 'rent') { if (!isRent) return false; }
      else if (F.mode === 'commercial') { if (!isCommercial) return false; }
      // For 'buy', do not hard-exclude unless explicitly marked as rent
      else if (F.mode === 'buy') { if (isRent) return false; }
    }
    if (F.q) {
      const t = (p.title+' '+p.project+' '+p.city+' '+p.locality+' '+(p.address||'')+' '+(p.summary||'')).toLowerCase();
      const toks = F.q.toLowerCase().split(/\s+/).filter(Boolean);
      if (!toks.every(tok => t.includes(tok))) return false;
    }
    if (F.citySel.length && !F.citySel.includes(p.city)) return false;
    if (F.localitySel.length && !(F.localitySel.includes("All") || F.localitySel.includes(p.locality))) return false;
    if (F.minP && (p.priceINR||0) < F.minP) return false;
    if (F.maxP && (p.priceINR||0) > F.maxP) return false;
    if (F.ptype && String(p.type||'').toLowerCase() !== String(F.ptype||'').toLowerCase()) return false;
    if (F.bhk && String(p.bhk)!==String(F.bhk)) return false;
    if (F.furnished && String(p.furnished||'').toLowerCase() !== String(F.furnished||'').toLowerCase()) return false;
    if (F.facing && String(p.facing||'').toLowerCase() !== String(F.facing||'').toLowerCase()) return false;
    if (F.minA && (p.carpetAreaSqft||0) < F.minA) return false;
    if (F.maxA && (p.carpetAreaSqft||0) > F.maxA) return false;
    if (F.amenity && !(p.amenities||[]).some(a=>a.toLowerCase().includes(F.amenity.toLowerCase()))) return false;
    if (F.wantMetro && !Number.isFinite(p._metroKm)) return false;
    if (F.wantMetro && Number.isFinite(p._metroKm) && (p._metroKm*12) > F.maxWalk) return false;
    return true;
  }).map(p=>({ p, s: App.score(p, F.q, F.amenity) }));

  switch(F.sort){
    case 'relevance': filtered.sort((a,b)=> b.s - a.s); break;
    case 'newest':    filtered.sort((a,b)=> new Date(b.p.postedAt||0) - new Date(a.p.postedAt||0)); break;
    case 'priceLow':  filtered.sort((a,b)=> (a.p.priceINR||0) - (b.p.priceINR||0)); break;
    case 'priceHigh': filtered.sort((a,b)=> (b.p.priceINR||0) - (a.p.priceINR||0)); break;
    case 'areaHigh':  filtered.sort((a,b)=> (b.p.carpetAreaSqft||0) - (a.p.carpetAreaSqft||0)); break;
  }

  const total = filtered.length;
  const countEl = document.querySelector('#count'); if (countEl) countEl.textContent = `${total} result${total!==1?'s':''}`;
  try {
    const notice = document.getElementById('resultNotice');
    if (notice) {
      notice.hidden = false;
      notice.textContent = `Showing ${Math.min(PAGE_SIZE, total)} of ${total} results`;
      clearTimeout(notice.__t);
      notice.__t = setTimeout(()=>{ try { notice.hidden = true; } catch(_){} }, 1500);
    }
  } catch(_){ }

  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  PAGE = Math.min(PAGE, pages);
  const start = (PAGE-1)*PAGE_SIZE;
  const slice = filtered.slice(start, start+PAGE_SIZE);

  const res = document.querySelector('#results');
  if (res) {
    res.setAttribute('aria-live','polite');
    res.setAttribute('role','region');
    res.innerHTML = slice.map(({p,s})=> App.cardHTML(p, s)).join('') || `<div class="empty">No properties found</div>`;
    // Inject explain bars
    try {
      const cards = res.querySelectorAll('article.card');
      cards.forEach((card, idx)=>{
        const item = slice[idx]?.p; if (!item) return;
        const explain = App.explainScore(item, F.q, F.amenity);
        const host = card.querySelector('.explain-inline'); if (!host) return;
        const parts = [
          { key:'text', label:'Match', val:explain.textC, w:explain.weights.text },
          { key:'recency', label:'Freshness', val:explain.recencyC, w:explain.weights.recency },
          { key:'value', label:'Value', val:explain.valueC, w:explain.weights.value },
          { key:'metro', label:'Metro', val:explain.metroC, w:explain.weights.metro },
        ];
        host.innerHTML = '<div class="explain-row">' + parts.map(p=>{
          const pct = Math.round((p.val/10)*100);
          return `<div class="explain-row" title="${p.label}"><div class="bar"><div style="width:${pct}%;"></div></div><span class="chip">${p.label}</span></div>`;
        }).join('') + '</div>' +
        `<div class="row" style="gap:6px;margin-top:6px"><small style="color:var(--muted)">Tune:</small>
          <button class="chip" data-tune="value+">More value</button>
          <button class="chip" data-tune="recency+">Newer</button>
          <button class="chip" data-tune="metro+">Closer to metro</button>
        </div>`;
        // Tuners
        host.querySelectorAll('[data-tune]').forEach(btn=>{
          btn.addEventListener('click', ()=>{
            const t = btn.getAttribute('data-tune');
            const cur = App.getWeights();
            const step = 0.1;
            if (t==='value+') App.setWeights({ value: cur.value + step });
            if (t==='recency+') App.setWeights({ recency: cur.recency + step });
            if (t==='metro+') App.setWeights({ metro: cur.metro + step });
            PAGE = 1; apply();
          });
        });
      });
    } catch(_) {}
  }

  const pager = document.querySelector('#pager');
  if (pager) {
    pager.innerHTML = Array.from({length: pages}, (_,i)=>{
      const n = i+1; const cls = n===PAGE ? 'page active' : 'page';
      return `<button class="${cls}" data-page="${n}">${n}</button>`;
    }).join('');
  }

  // Compare feature removed — ensure any legacy localStorage is cleared and buttons do nothing
  try {
    localStorage.removeItem('thg_compare_ids');
    document.querySelectorAll('.btn-compare').forEach(btn=>{
      btn.style.display = 'none';
      btn.replaceWith(btn.cloneNode(false));
    });
  } catch(_) {}
}

function goto(n){ PAGE = n; apply(); }
window.goto = goto;

function wireUI(){
  const applyBtn = document.querySelector('#apply');
  if (applyBtn) {
    applyBtn.addEventListener('click', ()=>{
      PAGE=1;
      // UX: brief loading state + smooth scroll to results
      const res = document.querySelector('#results');
      const prev = applyBtn.textContent;
      applyBtn.disabled = true; applyBtn.textContent = 'Applying…';
      apply(); syncUrlWithFilters();
      try { if (res) res.classList.add('highlight'); } catch(_) {}
      try { if (res && res.scrollIntoView) res.scrollIntoView({ behavior:'smooth', block:'start' }); } catch(_) {}
      setTimeout(()=>{ try { if (res) res.classList.remove('highlight'); } catch(_) {} applyBtn.disabled = false; applyBtn.textContent = prev; }, 300);
      // Toast for saved search match state refresh
      try { const saveBtn=document.getElementById('saveSearch'); saveBtn && saveBtn.dispatchEvent(new Event('thg-refresh-saved', { bubbles:false })); } catch(_) {}
      try{ const pill=document.getElementById('newResultsPill'); pill.hidden=true; } catch(_){}
    });
  }

  const debApply = deb(()=>{ PAGE=1; apply(); }, 120);
  const autoToggle = document.getElementById('autoApplyToggle');
  const handleInput = ()=>{ if (autoToggle?.checked){ PAGE=1; apply(); syncUrlWithFilters(); } else { debApply(); } };
  ['#minPrice','#maxPrice','#minArea','#maxArea','#amenity','#q'].forEach(sel=>
    document.querySelector(sel)?.addEventListener('input', handleInput)
  );
  const handleChange = ()=>{ PAGE=1; apply(); syncUrlWithFilters(); try{ const pill=document.getElementById('newResultsPill'); pill.hidden=false; clearTimeout(pill.__t); pill.__t=setTimeout(()=>{ pill.hidden=true; }, 1800); } catch(_){} };
  ['#sort','#ptype','#bhk','#furnished','#facing','#city','#locality','#wantMetro','#maxWalk'].forEach(sel=>
    document.querySelector(sel)?.addEventListener('change', ()=>{ if (autoToggle?.checked){ PAGE=1; apply(); syncUrlWithFilters(); } else { handleChange(); } })
  );

  // Natural language quick filter trigger
  const nlBtn = document.getElementById('nlQuick');
  if (nlBtn){
    nlBtn.addEventListener('click', ()=>{
      const qEl = document.getElementById('q');
      const text = (qEl?.value || '').trim();
      if (!text) { try { qEl?.focus(); } catch(_) {} return; }
      applyNaturalLanguage(text);
    });
  }

  document.querySelector('#pager')?.addEventListener('click', (e)=>{
    const b=e.target.closest('button'); if(!b) return;
    const n=Number(b.dataset.page||b.textContent); if(n) goto(n);
  });

  // ======== v3 pill logic: accessibility + persistence + keyboard ========
  (function setupPills(){
    const pills = document.querySelectorAll('.filter-pill');
    if (!pills.length) return;

    const STORAGE_KEY = 'activeFilterType';
    const savedType = localStorage.getItem(STORAGE_KEY) || 'all';

    function setActivePill(pill){
      pills.forEach(p => {
        p.classList.remove('active');
        p.setAttribute('aria-pressed','false');
      });
      pill.classList.add('active');
      pill.setAttribute('aria-pressed','true');
      const type = pill.dataset.type || 'all';
      localStorage.setItem(STORAGE_KEY, type);
    }

    // Initialize ARIA / keyboard and events
    pills.forEach(pill => {
      pill.setAttribute('role','button');
      pill.setAttribute('tabindex','0');
      pill.setAttribute('aria-pressed','false');

      pill.addEventListener('click', () => {
        setActivePill(pill);
        debApply();
      });

      pill.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          setActivePill(pill);
          debApply();
        }
      });
    });

    // Activate saved pill on load (fallback to "all")
    const toActivate =
      document.querySelector(`.filter-pill[data-type="${savedType}"]`) ||
      document.querySelector('.filter-pill[data-type="all"]') ||
      pills[0];

    if (toActivate) setActivePill(toActivate);
  })();

  // ======== Preset chips (budget/BHK) & recent searches ========
  (function setupPresetsAndSaved(){
    const PRESETS = {
      budget: [
        { label:'₹40L–₹50L', min:4000000, max:5000000 },
        { label:'₹50L–₹75L', min:5000000, max:7500000 },
        { label:'₹75L–₹1Cr', min:7500000, max:10000000 },
        { label:'₹1Cr–₹1.5Cr', min:10000000, max:15000000 }
      ],
      bhk: ['1','2','3','4'],
      personas: [
        { id:'near_metro', label:'Near Metro', apply(){ const wm=document.getElementById('wantMetro'); const mw=document.getElementById('maxWalk'); if (wm) wm.checked=true; if (mw) mw.value=10; } },
        { id:'value', label:'Best Value', apply(){ const s=document.getElementById('sort'); if (s) s.value='priceLow'; } },
        { id:'luxury', label:'Luxury Homes', apply(){ const a=document.getElementById('minPrice'); if (a) a.value=String(20000000); const s=document.getElementById('sort'); if (s) s.value='newest'; } },
      ]
    };

    const presetWrap = document.getElementById('presetChips');
    if (presetWrap && !presetWrap.dataset.ready){
      presetWrap.dataset.ready='1';
      // Budget
      PRESETS.budget.forEach(b=>{
        const btn = document.createElement('button');
        btn.className = 'chip';
        btn.textContent = `Budget: ${b.label}`;
        btn.addEventListener('click', ()=>{
          const a=document.getElementById('minPrice'); const c=document.getElementById('maxPrice');
          if (a) a.value = String(b.min);
          if (c) c.value = String(b.max);
          try{ document.getElementById('priceMinSlider').value = String(b.min); document.getElementById('priceMinSlider').dispatchEvent(new Event('input',{bubbles:true})); } catch(_){}
          try{ document.getElementById('priceMaxSlider').value = String(b.max); document.getElementById('priceMaxSlider').dispatchEvent(new Event('input',{bubbles:true})); } catch(_){}
          PAGE=1; apply(); syncUrlWithFilters();
        });
        presetWrap.appendChild(btn);
      });
      // BHK
      PRESETS.bhk.forEach(n=>{
        const btn = document.createElement('button');
        btn.className = 'chip';
        btn.textContent = `${n} BHK`;
        btn.addEventListener('click', ()=>{
          const el=document.getElementById('bhk'); if(el){ el.value=String(n); el.dispatchEvent(new Event('change',{bubbles:true})); }
          PAGE=1; apply(); syncUrlWithFilters();
        });
        presetWrap.appendChild(btn);
      });

      // Personas
      PRESETS.personas.forEach(p=>{
        const btn = document.createElement('button');
        btn.className = 'chip';
        btn.textContent = p.label;
        btn.title = 'Quick preference';
        btn.addEventListener('click', ()=>{
          try { p.apply(); } catch(_) {}
          PAGE=1; apply(); syncUrlWithFilters();
        });
        presetWrap.appendChild(btn);
      });
    }

    // Save search
    const saveBtn = document.getElementById('saveSearch');
    const recentWrap = document.getElementById('recentChips');
    function snapshotFilters(){
      const F = collectFilters();
      return {
        q: F.q, locality: F.localitySel, minP: F.minP, maxP: F.maxP, ptype: F.ptype, bhk: F.bhk,
        furnished: F.furnished, facing: F.facing, minA: F.minA, maxA: F.maxA, amenity: F.amenity,
        wantMetro: F.wantMetro, maxWalk: F.maxWalk, sort: F.sort
      };
    }
    function filtersToLabel(f){
      const parts = [];
      if (f.q) parts.push(f.q);
      if (f.locality && f.locality.length) parts.push(f.locality.join(','));
      if (f.minP || f.maxP) parts.push(`₹${(f.minP||0).toLocaleString('en-IN')}-${(f.maxP||0).toLocaleString('en-IN')}`);
      if (f.ptype) parts.push(f.ptype);
      if (f.bhk) parts.push(`${f.bhk} BHK`);
      return parts.join(' • ') || 'All properties';
    }
    function loadSaved(){ try { return JSON.parse(localStorage.getItem('tharaga_saved_searches')||'[]'); } catch(_) { return []; } }
    function saveSaved(list){ try { localStorage.setItem('tharaga_saved_searches', JSON.stringify(list.slice(0,8))); } catch(_){} }
    function same(a,b){ try { return JSON.stringify(a)===JSON.stringify(b); } catch(_) { return false; } }
    function hydrateRecent(){
      if (!recentWrap) return;
      recentWrap.innerHTML = '';
      const arr = loadSaved();
      arr.forEach((item, idx)=>{
        const btn = document.createElement('button');
        btn.className = 'chip';
        btn.textContent = filtersToLabel(item);
        btn.title = 'Apply saved search';
        btn.addEventListener('click', ()=>{
          // Push into URL then re-hydrate controls via applyQueryParams
          const params = new URLSearchParams(location.search);
          params.set('q', item.q||''); if (!item.q) params.delete('q');
          if (item.locality && item.locality.length) params.set('locality', item.locality.join(',')); else params.delete('locality');
          if (item.minP) params.set('price_min', String(item.minP)); else params.delete('price_min');
          if (item.maxP) params.set('price_max', String(item.maxP)); else params.delete('price_max');
          if (item.ptype) params.set('ptype', String(item.ptype).toLowerCase()); else params.delete('ptype');
          if (item.bhk) params.set('bhk', String(item.bhk)); else params.delete('bhk');
          if (item.furnished) params.set('furnished', String(item.furnished).toLowerCase()); else params.delete('furnished');
          if (item.facing) params.set('facing', String(item.facing).toLowerCase()); else params.delete('facing');
          if (item.minA) params.set('area_min', String(item.minA)); else params.delete('area_min');
          if (item.maxA) params.set('area_max', String(item.maxA)); else params.delete('area_max');
          if (item.amenity) params.set('amenity', item.amenity); else params.delete('amenity');
          if (item.wantMetro) params.set('near_metro','1'); else params.delete('near_metro');
          if (item.maxWalk) params.set('max_walk', String(item.maxWalk)); else params.delete('max_walk');
          if (item.sort && item.sort!=='relevance') params.set('sort', item.sort); else params.delete('sort');
          history.replaceState(null, '', `${location.pathname}?${params.toString()}`);
          applyQueryParams(); apply();
        });
        recentWrap.appendChild(btn);
      });
      if (saveBtn){
        const current = snapshotFilters();
        const arr2 = loadSaved();
        const already = arr2.some(s => same(s, current));
        saveBtn.disabled = already;
        saveBtn.textContent = already ? 'Saved ✓' : 'Save search';
      }
    }
    hydrateRecent();
    if (saveBtn){
      saveBtn.addEventListener('click', ()=>{
        const s = snapshotFilters();
        const arr = loadSaved();
        if (!arr.some(x => same(x, s))){ arr.unshift(s); saveSaved(arr); }
        hydrateRecent();
        try { 
          const t=document.getElementById('toast'); 
          if (t){ 
            t.innerHTML='Search saved <span class="actions"><button class="link" id="toastUndo">Undo</button></span>';
            t.hidden=false; clearTimeout(t.__t); t.__t=setTimeout(()=>{ t.hidden=true; }, 4000);
            // Undo: remove the very latest saved search
            const undo = ()=>{ const cur = loadSaved(); cur.shift(); saveSaved(cur); hydrateRecent(); t.hidden=true; };
            const btn = document.getElementById('toastUndo'); if (btn) btn.onclick = undo;
          }
        } catch(_){}
      });
      // Allow other flows to refresh saved-button state
      saveBtn.addEventListener('thg-refresh-saved', hydrateRecent);
    }
  })();

  document.querySelector('#reset')?.addEventListener('click', ()=>{
    ['q','minPrice','maxPrice','ptype','bhk','furnished','facing','minArea','maxArea','amenity'].forEach(id=>{
      const el=document.getElementById(id); if(el) el.value='';
    });
    if (document.querySelector('#city')) Array.from(document.querySelector('#city').options).forEach(o=> o.selected=false);
    setLocalityAllSelected();
    const wm = document.getElementById('wantMetro'); if (wm) wm.checked = false;
    const mw = document.getElementById('maxWalk'); if (mw) mw.value = 10;

    // Default back to 'buy' pill since there is no 'all' pill in UI
    const buyPill = document.querySelector('.filter-pill[data-type="buy"]') || document.querySelector('.filter-pill');
    if (buyPill) {
      document.querySelectorAll('.filter-pill').forEach(p => {
        p.classList.remove('active');
        p.setAttribute('aria-pressed','false');
      });
      buyPill.classList.add('active');
      buyPill.setAttribute('aria-pressed','true');
      localStorage.setItem('activeFilterType', 'buy');
    }

    PAGE=1; apply();
  });
}

function syncUrlWithFilters(){
  try{
    const F = collectFilters();
    const params = new URLSearchParams(location.search);
    // Search text
    if (F.q) { params.set('q', F.q); params.set('location', F.q); }
    else { params.delete('q'); params.delete('location'); }

    // Mode (pill)
    const pill = document.querySelector('.filter-pill.active');
    const mode = pill?.dataset?.type || 'buy';
    if (mode && mode !== 'all') params.set('type', mode); else params.delete('type');

    // Locality multi-select
    const locs = (F.localitySel||[]).filter(v=>v && v!=='All');
    if (locs.length) params.set('locality', locs.join(',')); else params.delete('locality');

    // Price
    if (F.minP) params.set('price_min', String(F.minP)); else params.delete('price_min');
    if (F.maxP) params.set('price_max', String(F.maxP)); else params.delete('price_max');

    // Other structured filters
    if (F.ptype) params.set('ptype', String(F.ptype).toLowerCase()); else params.delete('ptype');
    if (F.bhk) params.set('bhk', String(F.bhk)); else params.delete('bhk');
    if (F.furnished) params.set('furnished', String(F.furnished).toLowerCase()); else params.delete('furnished');
    if (F.facing) params.set('facing', String(F.facing).toLowerCase()); else params.delete('facing');
    if (F.minA) params.set('area_min', String(F.minA)); else params.delete('area_min');
    if (F.maxA) params.set('area_max', String(F.maxA)); else params.delete('area_max');
    if (F.amenity) params.set('amenity', F.amenity); else params.delete('amenity');
    if (F.wantMetro) params.set('near_metro', '1'); else params.delete('near_metro');
    if (F.maxWalk) params.set('max_walk', String(F.maxWalk)); else params.delete('max_walk');
    if (F.sort && F.sort !== 'relevance') params.set('sort', F.sort); else params.delete('sort');

    const newUrl = `${location.pathname}?${params.toString()}`;
    history.replaceState(null, '', newUrl);
  } catch(e) { /* no-op */ }
}

// === Natural language quick filter ===
function parseNatural(text){
  const out = {};
  const t = String(text||'').toLowerCase();
  // bhk
  const bhk = t.match(/(\d+)\s*bhk/); if (bhk) out.bhk = bhk[1];
  // price
  const crore = t.match(/under\s*(\d+(?:\.\d+)?)\s*cr/); if (crore) { out.maxPrice = Math.round(parseFloat(crore[1])*10000000); }
  const lakh = t.match(/under\s*(\d+(?:\.\d+)?)\s*l/); if (lakh) { out.maxPrice = Math.round(parseFloat(lakh[1])*100000); }
  // near metro
  if (/near\s*metro|close\s*to\s*metro/.test(t)) { out.wantMetro = true; out.maxWalk = 10; }
  // locality/city — last word or after 'in'
  const loc = t.match(/in\s+([a-z\s]+)$/); if (loc) out.q = loc[1].trim();
  return out;
}

function applyNaturalLanguage(text){
  const f = parseNatural(text);
  if (f.bhk){ const el=document.getElementById('bhk'); if (el){ el.value = f.bhk; el.dispatchEvent(new Event('change',{bubbles:true})); } }
  if (f.maxPrice){ const a=document.getElementById('maxPrice'); if (a){ a.value = String(f.maxPrice); a.dispatchEvent(new Event('input',{bubbles:true})); } try{ document.getElementById('priceMaxSlider').value = String(f.maxPrice); document.getElementById('priceMaxSlider').dispatchEvent(new Event('input',{bubbles:true})); } catch(_){} }
  if (f.wantMetro){ const wm=document.getElementById('wantMetro'); if (wm){ wm.checked = true; wm.dispatchEvent(new Event('change',{bubbles:true})); } const mw=document.getElementById('maxWalk'); if (mw){ mw.value = String(f.maxWalk||10); mw.dispatchEvent(new Event('change',{bubbles:true})); } }
  if (f.q){ const qEl=document.getElementById('q'); if (qEl){ qEl.value = f.q; qEl.dispatchEvent(new Event('input',{bubbles:true})); } }
  PAGE=1; apply(); syncUrlWithFilters();
}

async function enrichWithMetro(){
  const stations = await App.loadMetro();
  if (!stations.length) return; // no metro dataset → skip
  for (const p of ALL){
    if (Number.isFinite(p.lat) && Number.isFinite(p.lng)){
      p._metroKm = App.nearestMetroKm(p.lat, p.lng);
    } else {
      p._metroKm = null;
    }
  }
}

async function init(){
  try{
    // Early: hydrate from URL so visible controls reflect deep link immediately
    try { applyQueryParams(); } catch(_) {}

    // Show premium skeletons while loading
    try {
      const res = document.querySelector('#results');
      if (res) {
        res.innerHTML = Array.from({length: 6}).map(()=>
          '<div class="skeleton-card">\
             <div class="skeleton-img"></div>\
             <div class="skeleton-body">\
               <div class="skeleton-line w70"></div>\
               <div class="skeleton-line w50"></div>\
               <div class="skeleton-line w30"></div>\
             </div>\
           </div>'
        ).join('');
      }
    } catch(_) {}

    ALL = await App.fetchProperties();
    hydrateCityOptions(); hydrateLocalityOptions([]);
    await enrichWithMetro();
    // If the URL has city/locality but no explicit q, prefer locality as search text for better matching
    try {
      const params = new URLSearchParams(location.search);
      const qMissing = !((params.get('q') || '').trim());
      const localityParam = params.get('locality') || '';
      if (qMissing && localityParam) {
        const qEl = document.querySelector('#q');
        if (qEl) { qEl.value = localityParam; qEl.dispatchEvent(new Event('input', { bubbles: true })); }
      }
    } catch(_) {}
  } catch(e){
    console.error("Init failed:", e);
  }
  // Re-apply hydration after options and data are ready (ensures locality/select mapping)
  applyQueryParams();
  wireUI();
  apply();

  // Safety: re-run hydration a couple of times to catch any late-bound UI/async
  try {
    [200, 500, 900].forEach((ms)=> setTimeout(()=>{ try { applyQueryParams(); apply(); } catch(_){} }, ms));
  } catch(_) {}
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  // DOM is already parsed (e.g., scripts loaded late or tests fast) — run immediately
  init();
}
