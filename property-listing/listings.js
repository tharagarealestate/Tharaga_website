// listings.js — the renderer
import * as App from './app.js?v=20250825';

const PAGE_SIZE = 9;
let ALL = [];
let PAGE = 1;

const deb = (fn, ms=150)=>{ let t; return (...a)=>{ clearTimeout(t); t=setTimeout(()=>fn(...a),ms); }; };

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
    if(v && (Array.isArray(v) ? v.length : String(v).trim()!=='')){
      parts.push(`<span class="tag">${k}: ${Array.isArray(v)? v.join(', '): v}</span>`);
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
    if (F.wantMetro && !Number.isFinite(p._metroKm)) return false; // require metro distance known
    // also hard filter by metro max walk if enabled
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

  document.querySelectorAll('.filter-pill').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      document.querySelectorAll('.filter-pill').forEach(b=>b.classList.remove('active'));
      btn.classList.add('active'); PAGE=1; apply();
    });
  });

  document.querySelector('#reset')?.addEventListener('click', ()=>{
    ['q','minPrice','maxPrice','ptype','bhk','furnished','facing','minArea','maxArea','amenity'].forEach(id=>{
      const el=document.getElementById(id); if(el) el.value='';
    });
    if (document.querySelector('#city')) Array.from(document.querySelector('#city').options).forEach(o=> o.selected=false);
    setLocalityAllSelected();
    const wm = document.getElementById('wantMetro'); if (wm) wm.checked = false;
    const mw = document.getElementById('maxWalk'); if (mw) mw.value = 10;
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
  wireUI();
  apply();
}

document.addEventListener('DOMContentLoaded', init);
