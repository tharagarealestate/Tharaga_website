/**
 * app.js — Supabase-first property loader + UI glue
 * - ES module (use with <script type="module">)
 * - Exports: fetchProperties, score, cardHTML, currency
 *
 * NOTE: Provide config via window.CONFIG { SUPABASE_URL, SUPABASE_ANON_KEY, SHEET_CSV_URL? }
 */

import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

/* -------------------------- Configuration -------------------------- */
const CFG = (typeof window !== "undefined" && window.CONFIG) || {};
const SUPABASE_URL = CFG.SUPABASE_URL || "https://wedevtjjmdvngyshqdro.supabase.co";
const SUPABASE_ANON_KEY = CFG.SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndlZGV2dGpqbWR2bmd5c2hxZHJvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU0NzYwMzgsImV4cCI6MjA3MTA1MjAzOH0.Ex2c_sx358dFdygUGMVBohyTVto6fdEQ5nydDRh9m6M";
const SHEET_CSV_URL = CFG.SHEET_CSV_URL || null;

/* -------------------------- Supabase client ------------------------ */
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/* -------------------------- Utilities ------------------------------ */
/** Currency formatter for INR (top-level) */
const currency = (n) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n);

/** Safely parse number or return undefined */
function toNumber(v) {
  if (v === null || v === undefined || v === "") return undefined;
  const n = Number(String(v).toString().replace(/[^\d.-]/g, "").trim());
  return Number.isFinite(n) ? n : undefined;
}

/** Normalize arrays stored as Postgres text[] or CSV string */
function toArray(val) {
  if (Array.isArray(val)) return val.filter(Boolean);
  if (!val) return [];
  // try JSON parse (if client stored JSON string)
  try {
    const parsed = JSON.parse(val);
    if (Array.isArray(parsed)) return parsed.filter(Boolean);
  } catch (e) {
    // ignore
  }
  // fallback: CSV string
  return String(val).split(",").map((s) => s.trim()).filter(Boolean);
}

/* -------------------------- Normalizer ----------------------------- */
/**
 * Convert a Supabase row (or legacy JSON object) into the UI-friendly shape:
 * {
 *   id, title, project, builder, listingStatus, category, type,
 *   bhk, bathrooms, furnished, carpetAreaSqft, priceINR, priceDisplay,
 *   pricePerSqftINR, facing, floor, floorsTotal, city, locality, state,
 *   address, lat, lng, images[], amenities[], rera, docsLink,
 *   owner: {name, phone, whatsapp}, postedAt, summary
 * }
 */
function normalizeRow(row = {}) {
  // Accept both snake_case and camelCase
  const r = (k) => row[k] ?? row[camelToSnake(k)] ?? row[snakeToCamel(k)];

  // helpers for name variants
  function camelToSnake(s) {
    return s.replace(/[A-Z]/g, (m) => "_" + m.toLowerCase());
  }
  function snakeToCamel(s) {
    return s.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
  }

  const price_inr = toNumber(r("priceINR")) ?? toNumber(r("price_inr"));
  const sqft = toNumber(r("carpetAreaSqft")) ?? toNumber(r("sqft"));
  const pricePerSqft =
    toNumber(r("pricePerSqftINR")) ?? toNumber(r("price_per_sqft")) ??
    (price_inr && sqft ? Math.round(price_inr / Math.max(1, sqft)) : undefined);

  return {
    id: r("id") || r("id") || undefined,
    title: r("title") || r("property_title") || "",
    project: r("project") || "",
    builder: r("builder") || "",
    listingStatus: r("listingStatus") || r("listing_status") || (r("is_verified") ? (r("is_verified") === true ? "Verified" : "Verified") : ""),
    category: r("category") || "",
    type: r("type") || r("property_type") || "",
    bhk: toNumber(r("bhk")) ?? toNumber(r("bedrooms")),
    bathrooms: toNumber(r("bathrooms")),
    furnished: r("furnished") || "",
    carpetAreaSqft: sqft,
    priceINR: price_inr,
    priceDisplay: r("priceDisplay") || r("price_display") || (price_inr ? currency(price_inr) : ""),
    pricePerSqftINR: pricePerSqft,
    facing: r("facing") || "",
    floor: toNumber(r("floor")) ?? undefined,
    floorsTotal: toNumber(r("floorsTotal")) ?? toNumber(r("floors_total")),
    city: r("city") || "",
    locality: r("locality") || "",
    state: r("state") || "",
    address: r("address") || "",
    lat: toNumber(r("lat")) ?? toNumber(r("latitude")),
    lng: toNumber(r("lng")) ?? toNumber(r("longitude")),
    images: toArray(r("images") || r("images_json") || r("images_array")),
    amenities: toArray(r("amenities") || r("amenities_array")),
    rera: r("rera") || "",
    docsLink: r("docsLink") || r("docs_link") || "",
    owner: {
      name: r("ownerName") || r("owner_name") || r("owner") || "Owner",
      phone: r("ownerPhone") || r("owner_phone") || "",
      whatsapp: r("ownerWhatsapp") || r("owner_whatsapp") || ""
    },
    postedAt: r("postedAt") || r("listed_at") || r("listedAt") || undefined,
    summary: r("summary") || r("description") || ""
  };
}

/* -------------------------- Fetchers ------------------------------- */
/** Primary: fetch from Supabase -> returns array of normalized properties */
async function fetchFromSupabase({ limit = 1000 } = {}) {
  // We load all columns (*) — if your table is huge, implement pagination.
  const { data, error } = await supabase
    .from("properties")
    .select("*")
    .limit(limit)
    //.order("listed_at", { ascending: false });

  if (error) {
    console.warn("Supabase fetch error:", error);
    throw error;
  }
  if (!Array.isArray(data)) return [];

  return data.map(normalizeRow);
}

/** Fallback: fetch from Google Sheet CSV (if provided) */
async function fetchFromSheetCSV() {
  if (!SHEET_CSV_URL) return [];
  try {
    const res = await fetch(SHEET_CSV_URL, { cache: "no-store" });
    if (!res.ok) throw new Error("CSV fetch failed");
    const csv = await res.text();
    // simple CSV parser (same as your previous)
    const lines = csv.trim().split(/\r?\n/);
    const headers = lines.shift().split(",").map(h => h.trim());
    const rows = lines.map(line => {
      const cells = line.split(",").map(c => c.trim());
      const obj = {};
      headers.forEach((h, i) => obj[h] = cells[i] || "");
      return normalizeRow(obj);
    });
    return rows;
  } catch (e) {
    console.warn("Sheet CSV fallback failed:", e);
    return [];
  }
}

/** Final fallback: local data.json (for dev) */
async function fetchFromLocalJSON() {
  try {
    const res = await fetch("./data.json");
    if (!res.ok) throw new Error("data.json fetch failed");
    const json = await res.json();
    // if json is { properties: [..] } or array
    const arr = Array.isArray(json) ? json : (Array.isArray(json.properties) ? json.properties : []);
    return arr.map(normalizeRow);
  } catch (e) {
    console.warn("Local JSON fallback failed:", e);
    return [];
  }
}

/**
 * fetchProperties()
 * - primary: supabase
 * - fallbacks: sheet csv, local json
 * returns Array of normalized properties (not wrapped)
 */
async function fetchProperties() {
  // Unified: first try our Netlify function (Supabase-backed), then fallbacks
  try {
    const res = await fetch('/api/properties-list', { cache: 'no-store' })
    if (res.ok) {
      const list = await res.json()
      if (Array.isArray(list) && list.length) return list.map(normalizeRow)
    }
  } catch (_) {}

  // try supabase directly (anon) as fallback
  try {
    const supa = await fetchFromSupabase();
    if (supa && supa.length) return supa;
  } catch (_) {}

  const sheet = await fetchFromSheetCSV();
  if (sheet && sheet.length) return sheet;
  return await fetchFromLocalJSON();
}

/* ---------- metro helpers ---------- */
let METRO = null;
export async function loadMetro() {
  if (METRO !== null) return METRO;
  try {
    const res = await fetch(METRO_JSON_URL(), { cache: "no-store" });
    if (!res.ok) { METRO = []; return METRO; }
    const j = await res.json();
    METRO = Array.isArray(j) ? j : (j.stations || []);
    return METRO;
  } catch { METRO = []; return METRO; }
}
export function haversineKm(lat1, lon1, lat2, lon2) {
  const toRad = d => d * Math.PI/180, R = 6371;
  const dLat = toRad(lat2-lat1), dLon = toRad(lon2-lon1);
  const a = Math.sin(dLat/2)**2 + Math.cos(toRad(lat1))*Math.cos(toRad(lat2))*Math.sin(dLon/2)**2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); return R*c;
}
export function nearestMetroKm(lat, lng) {
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || !METRO?.length) return null;
  let best = Infinity;
  for (const s of METRO) {
    const stationLat = Number(s.lat ?? s.latitude);
    const stationLng = Number(s.lng ?? s.longitude);
    if (!Number.isFinite(stationLat) || !Number.isFinite(stationLng)) continue;
    const km = haversineKm(lat, lng, stationLat, stationLng);
    if (km < best) best = km;
  }
  return Number.isFinite(best) ? best : null;
}


/* -------------------------- In-memory cache ------------------------ */
let PROPERTIES_CACHE = [];   // array of normalized property objects

/* -------------------------- Filtering & rendering ------------------ */
/**
 * Personalizable scoring with explainable components.
 * Components (0-10 each): text, recency, value, amenity, metro.
 * Final score = sum(component * weight).
 */
function getWeights(){
  try { const j = JSON.parse(localStorage.getItem('thg_weights')||'null'); if (j) return j; } catch(_){ }
  return { text: 1.0, recency: 0.9, value: 1.1, amenity: 0.6, metro: 0.8 };
}
function setWeights(upd){
  try {
    const cur = getWeights();
    const next = { ...cur, ...upd };
    localStorage.setItem('thg_weights', JSON.stringify(next));
    return next;
  } catch(_) { return getWeights(); }
}

function clamp01(x){ return x < 0 ? 0 : (x > 1 ? 1 : x); }

function componentScores(p, q = "", amenity = ""){
  const textHay = (p.title + " " + p.project + " " + p.city + " " + p.locality + " " + (p.summary||"")).toLowerCase();
  let textC = 0; if (q){ const toks = String(q).toLowerCase().split(/\s+/).filter(Boolean); let hits = 0; toks.forEach(t=>{ if (textHay.includes(t)) hits++; }); textC = clamp01(hits / Math.max(1, toks.length)) * 10; }

  let recencyC = 5; // default mid if unknown
  if (p.postedAt){
    const days = (Date.now() - new Date(p.postedAt).getTime())/86400000;
    // 0 days -> 10, 30 days -> 0
    recencyC = clamp01(1 - (days/30)) * 10;
  }

  let valueC = 0;
  if (p.pricePerSqftINR) {
    const v = p.pricePerSqftINR;
    // logistic into 0..1 centered around 6k with slope 800
    valueC = clamp01(1/(1 + Math.exp((v - 6000)/800))) * 10;
  }

  let amenityC = 0;
  if (amenity && p.amenities) {
    const hit = p.amenities.some(a => a.toLowerCase().includes(String(amenity).toLowerCase()));
    amenityC = hit ? 10 : 0;
  }

  let metroC = 0;
  if (Number.isFinite(p._metroKm)) {
    // 0 km -> 10, 2km -> ~6, 5km -> ~3, >8km -> ~1
    const km = Math.max(0, Number(p._metroKm));
    metroC = clamp01(1/(1 + (km/2))) * 10;
  }

  return { textC, recencyC, valueC, amenityC, metroC };
}

function score(p, q = "", amenity = "") {
  const w = getWeights();
  const { textC, recencyC, valueC, amenityC, metroC } = componentScores(p, q, amenity);
  const s = (textC * w.text) + (recencyC * w.recency) + (valueC * w.value) + (amenityC * w.amenity) + (metroC * w.metro);
  return s;
}

function explainScore(p, q = "", amenity = ""){
  const w = getWeights();
  const c = componentScores(p, q, amenity);
  const total = (c.textC*w.text)+(c.recencyC*w.recency)+(c.valueC*w.value)+(c.amenityC*w.amenity)+(c.metroC*w.metro);
  return { ...c, weights: w, total };
}

/** Card HTML generator — unchanged shape so your UI remains the same */
function cardHTML(p, s) {
  const img = (p.images && p.images[0]) || "./noimg.svg";
  const tags = [`${p.bhk||''} BHK`, `${p.carpetAreaSqft||'-'} sqft`, p.furnished||'', p.facing?`Facing ${p.facing}`:'' ]
    .filter(Boolean).map(t=>`<span class="tag">${t}</span>`).join(' ');
  const price = p.priceDisplay || (p.priceINR ? currency(p.priceINR) : 'Price on request');
  const pps = p.pricePerSqftINR ? `₹${p.pricePerSqftINR.toLocaleString('en-IN')}/sqft` : '';
  return `<article class="card" style="display:flex;flex-direction:column" data-prop-id="${escapeHtml(p.id)}">
    <div class="card-img">
      <img class="blur-up squeeze-img" loading="lazy" src="${escapeHtml(img)}" alt="${escapeHtml(p.title)}" onload="this.classList.remove('blur-up')" onerror="this.onerror=null;this.src='./noimg.svg'">
      <div class="badge ribbon">${p.listingStatus || "Verified"}</div>
      <div class="tag score">Match ${Math.round((s/30)*100)}%</div>
    </div>
    <div style="padding:14px;display:flex;gap:12px;flex-direction:column">
      <div>
        <div class="loc-loud">${escapeHtml((p.locality||'') + (p.city ? ', ' + p.city : ''))}</div>
        <div style="color:var(--muted);font-size:13px">${escapeHtml(p.title)}</div>
      </div>
      <div class="row" style="justify-content:space-between">
        <div class="price-loud">${escapeHtml(price)}</div>
        <div style="color:var(--muted);font-size:12px">${escapeHtml(pps)}</div>
      </div>
      <div class="row" style="gap:8px;flex-wrap:wrap">${tags}</div>
      <div class="explain-inline" aria-hidden="true"></div>
      <div style="display:flex;gap:8px;margin-top:10px">
        <a class="btn" href="./details.html?id=${encodeURIComponent(p.id)}">View details</a>
        <button class="btn" data-lead-id="${encodeURIComponent(p.id)}">Request details</button>
      </div>
    </div>
  </article>`;
}

/** Small HTML escape to avoid broken HTML when rendering user data */
function escapeHtml(s) {
  if (!s && s !== 0) return "";
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

/** Render listing array into given container selector */
function renderListings(listings = [], containerSelector = "#results") {
  const container = document.querySelector(containerSelector);
  if (!container) {
    console.warn("renderListings: container not found:", containerSelector);
    return;
  }
  // Build HTML
  const html = listings.map(p => {
    const s = score(p, (document.getElementById('q')?.value || ""), "");
    return cardHTML(p, s);
  }).join("\n");
  container.innerHTML = html || `<div class="empty">No properties found</div>`;
}

// === PRICE RANGE SLIDER HANDLER ===
// === PRICE RANGE SLIDER – full functionality ===
document.addEventListener('DOMContentLoaded', () => {
  const root = document.querySelector('.price-range');
  if (!root || root.dataset.initialized === '1') return;
  root.dataset.initialized = '1';

  const RANGE_MIN = Number(root.dataset.min ?? 0);
  const RANGE_MAX = Number(root.dataset.max ?? 20000000);
  const STEP      = Number(root.dataset.step ?? 100000);
  const GAP       = Number(root.dataset.gap ?? 200000);

  const minSlider = document.getElementById('priceMinSlider');
  const maxSlider = document.getElementById('priceMaxSlider');
  const progress  = root.querySelector('.range-progress');

  const minValueDisplay = document.getElementById('minPriceValue');
  const maxValueDisplay = document.getElementById('maxPriceValue');

  const minHidden = document.getElementById('minPrice');
  const maxHidden = document.getElementById('maxPrice');

  [minSlider, maxSlider].forEach(sl => {
    sl.min = RANGE_MIN;
    sl.max = RANGE_MAX;
    sl.step = STEP;
  });

  const startMin = Number(minHidden?.value || RANGE_MIN);
  const startMax = Number(maxHidden?.value || RANGE_MAX);
  minSlider.value = Math.max(RANGE_MIN, Math.min(startMin, RANGE_MAX));
  maxSlider.value = Math.max(RANGE_MIN, Math.min(startMax, RANGE_MAX));

  function formatINRShort(num) {
    if (num >= 10000000) return `₹${Math.round((num/10000000)*10)/10}Cr`;
    if (num >= 100000)   return `₹${Math.round(num/100000)}L`;
    return `₹${num.toLocaleString('en-IN')}`;
  }

  function clampWithGap(which) {
    let a = Number(minSlider.value);
    let b = Number(maxSlider.value);
    if (b - a < GAP) {
      if (which === 'min') {
        a = Math.min(a, RANGE_MAX - GAP);
        b = a + GAP;
        maxSlider.value = b;
      } else {
        b = Math.max(b, RANGE_MIN + GAP);
        a = b - GAP;
        minSlider.value = a;
      }
    }
  }

  function updateUI() {
    const a = Number(minSlider.value);
    const b = Number(maxSlider.value);

    const leftPct  = ((a - RANGE_MIN) / (RANGE_MAX - RANGE_MIN)) * 100;
    const rightPct = 100 - ((b - RANGE_MIN) / (RANGE_MAX - RANGE_MIN)) * 100;
    if (progress) {
      progress.style.left  = `${leftPct}%`;
      progress.style.right = `${rightPct}%`;
    }

    if (minValueDisplay) minValueDisplay.textContent = formatINRShort(a);
    if (maxValueDisplay) maxValueDisplay.textContent = formatINRShort(b);

    if (minHidden) minHidden.value = a;
    if (maxHidden) maxHidden.value = b;

    // notify filters listening on input/change
    minHidden?.dispatchEvent(new Event('input',  { bubbles: true }));
    maxHidden?.dispatchEvent(new Event('input',  { bubbles: true }));
    minHidden?.dispatchEvent(new Event('change', { bubbles: true }));
    maxHidden?.dispatchEvent(new Event('change', { bubbles: true }));
  }

  function onMinSlide() { clampWithGap('min'); updateUI(); }
  function onMaxSlide() { clampWithGap('max'); updateUI(); }

  minSlider.addEventListener('input', onMinSlide);
  maxSlider.addEventListener('input', onMaxSlide);

  clampWithGap('max');
  updateUI();
});

// -------------------------- URL Hydration (baseline) --------------------------
function titleCase(str){ return String(str||'').toLowerCase().replace(/(^|\s)([a-z])/g,(m,p1,c)=>p1+c.toUpperCase()); }

function hydrateFromQueryParamsBasic(){
  try {
    const params = new URLSearchParams(location.search);
    const qVal = (params.get('q') || params.get('location') || params.get('locality') || '').trim();
    const priceMin = parseInt(params.get('price_min')||params.get('minPrice')||'',10);
    const priceMax = parseInt(params.get('price_max')||params.get('maxPrice')||'',10);
    const bhk = params.get('bhk') || params.get('bedrooms');
    const ptype = params.get('ptype') || params.get('type');
    const furnished = params.get('furnished');
    const facing = params.get('facing');
    const areaMin = parseInt(params.get('area_min')||params.get('minArea')||'',10);
    const areaMax = parseInt(params.get('area_max')||params.get('maxArea')||'',10);
    const amenity = params.get('amenity') || params.get('amenities');
    const nearMetro = params.get('near_metro') || params.get('metro');
    const maxWalk = parseInt(params.get('max_walk')||params.get('walk')||params.get('maxWalk')||'',10);
    const sortParam = params.get('sort');

    const qEl = document.getElementById('q');
    if (qEl && qVal) { qEl.value = qVal; qEl.dispatchEvent(new Event('input', { bubbles:true })); }

    const minHidden = document.getElementById('minPrice');
    const maxHidden = document.getElementById('maxPrice');
    const minSlider = document.getElementById('priceMinSlider');
    const maxSlider = document.getElementById('priceMaxSlider');
    if (Number.isFinite(priceMin) && minHidden) minHidden.value = String(priceMin);
    if (Number.isFinite(priceMax) && maxHidden) maxHidden.value = String(priceMax);
    // if sliders present already, sync them; otherwise the slider init reads hidden values
    try { if (Number.isFinite(priceMin) && minSlider) { minSlider.value = String(priceMin); minSlider.dispatchEvent(new Event('input', { bubbles:true })); } } catch(_){ }
    try { if (Number.isFinite(priceMax) && maxSlider) { maxSlider.value = String(priceMax); maxSlider.dispatchEvent(new Event('input', { bubbles:true })); } } catch(_){ }

    const setSel = (id, val) => { const el = document.getElementById(id); if (el && val!=null && val!=='') { el.value = titleCase(String(val)); el.dispatchEvent(new Event('change', { bubbles:true })); } };
    setSel('ptype', ptype);
    setSel('bhk', bhk);
    setSel('furnished', furnished);
    setSel('facing', facing);
    const minAreaEl = document.getElementById('minArea'); if (minAreaEl && Number.isFinite(areaMin)) { minAreaEl.value = String(areaMin); minAreaEl.dispatchEvent(new Event('input', { bubbles:true })); }
    const maxAreaEl = document.getElementById('maxArea'); if (maxAreaEl && Number.isFinite(areaMax)) { maxAreaEl.value = String(areaMax); maxAreaEl.dispatchEvent(new Event('input', { bubbles:true })); }
    const amenEl = document.getElementById('amenity'); if (amenEl && amenity) { amenEl.value = amenity.split(',')[0]; amenEl.dispatchEvent(new Event('input', { bubbles:true })); }
    const metroEl = document.getElementById('wantMetro'); if (metroEl && (nearMetro==='1' || /^(true|yes|on)$/i.test(String(nearMetro||'')))) { metroEl.checked = true; metroEl.dispatchEvent(new Event('change', { bubbles:true })); }
    const mwEl = document.getElementById('maxWalk'); if (mwEl && Number.isFinite(maxWalk)) { mwEl.value = String(maxWalk); mwEl.dispatchEvent(new Event('change', { bubbles:true })); }
    const sortEl = document.getElementById('sort'); if (sortEl && sortParam) { sortEl.value = (sortParam==='ai_relevance' ? 'relevance' : sortParam); sortEl.dispatchEvent(new Event('change', { bubbles:true })); }
  } catch (e) {
    console.warn('hydrateFromQueryParamsBasic failed', e);
  }
}

/* -------------------------- Filtering logic ------------------------ */
/**
 * Apply filters based on UI controls:
 * - price range (hidden inputs with ids: minPrice, maxPrice)
 * - search text (input#searchInput)
 * - city/locality filters (optional)
 */
function applyFiltersAndRender() {
  const minHidden = document.getElementById("minPrice");
  const maxHidden = document.getElementById("maxPrice");
  const searchInput = document.getElementById('q');
  const min = toNumber(minHidden?.value) ?? 0;
  const max = toNumber(maxHidden?.value) ?? Number.POSITIVE_INFINITY;
  const q = (searchInput?.value || "").trim().toLowerCase();

  const filtered = PROPERTIES_CACHE.filter(p => {
    const price = p.priceINR ?? 0;
    if (price < min || price > max) return false;
    if (q) {
      const hay = (p.title + " " + p.project + " " + p.locality + " " + p.city + " " + (p.summary || "")).toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });

  // sort by score descending
  filtered.sort((a, b) => score(b, q) - score(a, q));

  renderListings(filtered);
}

/* Debounce helper */
function debounce(fn, wait = 200) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), wait);
  };
}

/* -------------------------- Bootstrapping -------------------------- */
async function initAndRender() {
  try {
  const test = await supabase.from("properties").select("id, title").limit(1);
  console.log("TEST select:", test);
} catch (e) {
  console.error("TEST select error:", e);
}
  try {
    // Load data once and cache
    PROPERTIES_CACHE = await fetchProperties();
  } catch (e) {
    console.error("Failed to load properties:", e);
    PROPERTIES_CACHE = [];
  }
  // Hydrate from URL before first render for parity with deep links
  hydrateFromQueryParamsBasic();
  // initial render
  applyFiltersAndRender();

  // Hook UI events for live updates:
  const minHidden = document.getElementById("minPrice");
  const maxHidden = document.getElementById("maxPrice");
  const searchInput = document.getElementById("q");

  // The price slider logic dispatches 'input' events on minHidden/maxHidden already.
  if (minHidden) minHidden.addEventListener("input", debounce(applyFiltersAndRender, 50));
  if (maxHidden) maxHidden.addEventListener("input", debounce(applyFiltersAndRender, 50));
  if (searchInput) searchInput.addEventListener("input", debounce(applyFiltersAndRender, 200));

  // Lead CTA wiring
  document.addEventListener('click', async (e)=>{
    const btn = e.target.closest && e.target.closest('button[data-lead-id]'); if (!btn) return;
    const property_id = btn.getAttribute('data-lead-id');
    const name = prompt('Your name'); if (!name) return;
    const phone = prompt('Phone (optional)') || '';
    const email = prompt('Email (optional)') || '';
    try{
      const res = await fetch('/api/leads', { method:'POST', headers:{ 'Content-Type':'application/json' }, body: JSON.stringify({ property_id, name, phone, email }) })
      const j = await res.json();
      alert(j?.ok ? 'Thanks! We will contact you shortly.' : (j?.error || 'Failed'))
    } catch(err){ alert('Failed') }
  });
}

/* Init on DOM ready */
if (typeof document !== "undefined") {
  document.addEventListener("DOMContentLoaded", () => {
    // safe init
    initAndRender().catch(err => console.error("init error:", err));
  });
}

/* -------------------------- Exports ------------------------------- */
export { fetchProperties, score, cardHTML, currency, normalizeRow, explainScore, getWeights, setWeights };

