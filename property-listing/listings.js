// listings.js — v3 (replace existing file)
// Version: 3
// Notes: stable debouncer, accessible & persistent "pill" UI, same filtering logic.

import * as App from './app.js?v=20250825';

const PAGE_SIZE = 9;
let ALL = [];
let PAGE = 1;

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
  Object.entries(filters).forEach(([k,v])=>{
    if(v && (Array.isArray(v) ? v.length : String(v).trim()!=='') ){
      parts.push(`<span class="tag">${k}: ${Array.isArray(v)? v.join(', ') : v}</span>`);
    }
  });
  wrap.innerHTML = parts.join(' ');
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
  const s = String(label);
  if (/3\s*Cr\s*\+/.test(s)) return { min: 30000000, max: null };
  if (/2\s*Cr\s*–\s*3\s*Cr/.test(s)) return { min: 20000000, max: 30000000 };
  if (/1\s*Cr\s*–\s*2\s*Cr/.test(s)) return { min: 10000000, max: 20000000 };
  if (/50\s*L\s*–\s*1\s*Cr/.test(s) || /₹?50\s*L/.test(s)) return { min: 5000000, max: 10000000 };
  // Generic fallback: pull digits (assume INR) "min-max"
  const nums = s.replace(/[^\d\-]+/g,'').split('-').map(n=>parseInt(n,10)).filter(Number.isFinite);
  if (nums.length === 2) return { min: nums[0], max: nums[1] };
  if (nums.length === 1) return { min: nums[0], max: null };
  return { min: null, max: null };
}

function titleCase(str){
  return String(str||'').toLowerCase().replace(/(^|\s)([a-z])/g, (m, p1, c)=> p1 + c.toUpperCase());
}

function applyQueryParams(){
  try {
    const params = new URLSearchParams(location.search);

    // Support both buyer-form and home-search param names
    const qParam = params.get('q') || params.get('location') || '';
    const typeParam = (params.get('ptype') || params.get('type') || params.get('property_type') || '').toLowerCase();
    const budgetLabel = params.get('budget') || '';
    const cityParam = params.get('city') || '';

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

    // Apply search text: prefer q, else location or city
    const qEl = document.querySelector('#q');
    const qValue = (params.get('q') || params.get('location') || cityParam || '').trim();
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
      const pill = document.querySelector(`.filter-pill[data-type="${pillType}"]`);
      if (pill) {
        pill.click(); // triggers debounced apply inside wireUI
      }
    }

    // Budget handling: supports label like "₹1Cr – ₹2Cr" or numeric minPrice/maxPrice
    const minFromQuery = parseInt(params.get('minPrice')||'',10);
    const maxFromQuery = parseInt(params.get('maxPrice')||'',10);
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

    // Finally, ensure apply happens at least once with new values
    document.querySelector('#apply')?.dispatchEvent(new Event('click', { bubbles: true }));
  } catch (e) {
    console.warn('applyQueryParams failed', e);
  }
}

function apply(){
  const F = collectFilters();

  let filtered = ALL.filter(p=>{
    if (F.mode) {
      const pc = String(p.category || p.propertyCategory || '').toLowerCase();
      if (pc !== F.mode) return false;
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
    if (F.ptype && p.type !== F.ptype) return false;
    if (F.bhk && String(p.bhk)!==String(F.bhk)) return false;
    if (F.furnished && p.furnished !== F.furnished) return false;
    if (F.facing && p.facing !== F.facing) return false;
    if (F.minA && (p.carpetAreaSqft||0) < F.minA) return false;
    if (F.maxA && (p.carpetAreaSqft||0) > F.maxA) return false;
    if (F.amenity && !(p.amenities||[]).some(a=>a.toLowerCase().includes(F.amenity.toLowerCase()))) return false;
    if (F.wantMetro && !Number.isFinite(p._metroKm)) return false;
    if (F.wantMetro && Number.isFinite(p._metroKm) && (p._metroKm*12) > F.maxWalk) return false;
    return true;
  }).map(p=>({ p, s: App.score(p, { q: F.q, amenity: F.amenity, wantMetro: F.wantMetro, maxWalk: F.maxWalk }) }));

  switch(F.sort){
    case 'relevance': filtered.sort((a,b)=> b.s - a.s); break;
    case 'newest':    filtered.sort((a,b)=> new Date(b.p.postedAt||0) - new Date(a.p.postedAt||0)); break;
    case 'priceLow':  filtered.sort((a,b)=> (a.p.priceINR||0) - (b.p.priceINR||0)); break;
    case 'priceHigh': filtered.sort((a,b)=> (b.p.priceINR||0) - (a.p.priceINR||0)); break;
    case 'areaHigh':  filtered.sort((a,b)=> (b.p.carpetAreaSqft||0) - (a.p.carpetAreaSqft||0)); break;
  }

  const total = filtered.length;
  const countEl = document.querySelector('#count'); if (countEl) countEl.textContent = `${total} result${total!==1?'s':''}`;

  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  PAGE = Math.min(PAGE, pages);
  const start = (PAGE-1)*PAGE_SIZE;
  const slice = filtered.slice(start, start+PAGE_SIZE);

  const res = document.querySelector('#results');
  if (res) res.innerHTML = slice.map(({p,s})=> App.cardHTML(p, s)).join('') || `<div class="empty">No properties found</div>`;

  const pager = document.querySelector('#pager');
  if (pager) {
    pager.innerHTML = Array.from({length: pages}, (_,i)=>{
      const n = i+1; const cls = n===PAGE ? 'page active' : 'page';
      return `<button class="${cls}" data-page="${n}">${n}</button>`;
    }).join('');
  }
}

function goto(n){ PAGE = n; apply(); }
window.goto = goto;

function wireUI(){
  document.querySelector('#apply')?.addEventListener('click', ()=>{ PAGE=1; apply(); });

  const debApply = deb(()=>{ PAGE=1; apply(); }, 120);
  ['#minPrice','#maxPrice','#minArea','#maxArea','#amenity','#q'].forEach(sel=>
    document.querySelector(sel)?.addEventListener('input', debApply)
  );
  ['#sort','#ptype','#bhk','#furnished','#facing','#city','#locality','#wantMetro','#maxWalk'].forEach(sel=>
    document.querySelector(sel)?.addEventListener('change', ()=>{ PAGE=1; apply(); })
  );

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

  document.querySelector('#reset')?.addEventListener('click', ()=>{
    ['q','minPrice','maxPrice','ptype','bhk','furnished','facing','minArea','maxArea','amenity'].forEach(id=>{
      const el=document.getElementById(id); if(el) el.value='';
    });
    if (document.querySelector('#city')) Array.from(document.querySelector('#city').options).forEach(o=> o.selected=false);
    setLocalityAllSelected();
    const wm = document.getElementById('wantMetro'); if (wm) wm.checked = false;
    const mw = document.getElementById('maxWalk'); if (mw) mw.value = 10;

    const allPill = document.querySelector('.filter-pill[data-type="all"]');
    if (allPill) {
      document.querySelectorAll('.filter-pill').forEach(p => {
        p.classList.remove('active');
        p.setAttribute('aria-pressed','false');
      });
      allPill.classList.add('active');
      allPill.setAttribute('aria-pressed','true');
      localStorage.setItem('activeFilterType', 'all');
    }

    PAGE=1; apply();
  });
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
    ALL = await App.fetchProperties();
    hydrateCityOptions(); hydrateLocalityOptions([]);
    await enrichWithMetro();
  } catch(e){
    console.error("Init failed:", e);
  }
  // Hydrate filters from URL/session BEFORE wiring UI and initial apply
  applyQueryParams();
  wireUI();
  apply();
}

document.addEventListener('DOMContentLoaded', init);
