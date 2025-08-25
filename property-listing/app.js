/* app.js — lazy supabase init + helpers */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

let CFG = (typeof window !== "undefined" && window.CONFIG) || {};
let supabase = null;
export const MAX_SCORE = 40;
const SHEET_CSV_URL = () => (CFG.SHEET_CSV_URL || null);
const METRO_JSON_URL = () => (CFG.METRO_JSON_URL || "./metro.json");

export async function initConfig(){
  // If window.CONFIG already contains keys, use them
  if (typeof window !== "undefined" && window.CONFIG && window.CONFIG.SUPABASE_ANON_KEY) {
    CFG = Object.assign({}, window.CONFIG, CFG);
  } else {
    // try fetching from Netlify function / server endpoint
    try {
      const r = await fetch('/.netlify/functions/config');
      if (r.ok) {
        const json = await r.json();
        CFG = Object.assign({}, CFG, json);
      }
    } catch(e){
      // ignore — will fallback to local json
      console.warn('config fetch failed', e);
    }
  }

  // build supabase client if we have creds
  if (CFG.SUPABASE_URL && CFG.SUPABASE_ANON_KEY && !supabase) {
    try {
      supabase = createClient(CFG.SUPABASE_URL, CFG.SUPABASE_ANON_KEY);
    } catch(e){ console.warn('supabase init failed', e); supabase = null; }
  }
  return { cfg: CFG, supabasePresent: !!supabase };
}

/* ---------- utils ---------- */
export const currency = (n) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);

function toNumber(v){ if(v===null||v===undefined||v==="") return undefined; const n=Number(String(v).replace(/[^\d.-]/g,"").trim()); return Number.isFinite(n)?n:undefined; }
function toArray(val){
  if (Array.isArray(val)) return val.filter(Boolean);
  if (!val) return [];
  try { const p = JSON.parse(val); if (Array.isArray(p)) return p.filter(Boolean); } catch {}
  return String(val).split(",").map(s=>s.trim()).filter(Boolean);
}

/* ---------- normalizer ---------- */
export function normalizeRow(row = {}) {
  const r = (k) => row[k] ?? row[k.replace(/[A-Z]/g, m => "_"+m.toLowerCase())] ?? row[k.replace(/_([a-z])/g,(_,c)=>c.toUpperCase())];
  const price_inr = toNumber(r("priceINR")) ?? toNumber(r("price_inr"));
  const sqft = toNumber(r("carpetAreaSqft")) ?? toNumber(r("sqft"));
  const pricePerSqft =
    toNumber(r("pricePerSqftINR")) ?? toNumber(r("price_per_sqft")) ??
    (price_inr && sqft ? Math.round(price_inr / Math.max(1, sqft)) : undefined);

  return {
    id: r("id") || undefined,
    title: r("title") || r("property_title") || "",
    project: r("project") || "",
    builder: r("builder") || "",
    is_verified: r("is_verified") === true,
    listingStatus: r("listing_status") || "",
    category: r("category") || "",
    type: r("property_type") || r("type") || "",
    bhk: toNumber(r("bedrooms")) ?? toNumber(r("bhk")),
    bathrooms: toNumber(r("bathrooms")),
    furnished: r("furnished") || "",
    carpetAreaSqft: sqft,
    priceINR: price_inr,
    priceDisplay: r("price_display") || (price_inr ? currency(price_inr) : ""),
    pricePerSqftINR: pricePerSqft,
    facing: r("facing") || "",
    floor: toNumber(r("floor")) ?? undefined,
    floorsTotal: toNumber(r("floors_total")) ?? toNumber(r("floorsTotal")),
    city: r("city") || "",
    locality: r("locality") || "",
    state: r("state") || "",
    address: r("address") || "",
    lat: toNumber(r("lat")) ?? toNumber(r("latitude")),
    lng: toNumber(r("lng")) ?? toNumber(r("longitude")),
    images: toArray(r("images") || r("images_json") || r("images_array")),
    amenities: toArray(r("amenities") || r("amenities_array")),
    rera: r("rera") || "",
    docsLink: r("docs_link") || r("docsLink") || "",
    owner: {
      name: r("owner_name") || r("ownerName") || r("owner") || "Owner",
      phone: r("owner_phone") || r("ownerPhone") || "",
      whatsapp: ""
    },
    postedAt: r("listed_at") || r("postedAt") || r("listedAt") || undefined,
    summary: r("description") || r("summary") || ""
  };
}

/* ---------- fetchers ---------- */
async function fetchFromSupabase({ limit = 1000 } = {}) {
  if (!supabase) return [];
  const { data, error } = await supabase.from("properties").select("*").limit(limit);
  if (error) { console.warn("Supabase fetch error:", error); return []; }
  return (data || []).map(normalizeRow);
}
async function fetchFromSheetCSV() {
  const url = CFG.SHEET_CSV_URL || null;
  if (!url) return [];
  try {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) throw new Error("CSV fetch failed");
    const csv = await res.text();
    const lines = csv.trim().split(/\r?\n/);
    const headers = lines.shift().split(",").map(h => h.trim());
    const rows = lines.map(line => {
      const cells = line.split(",").map(c => c.trim());
      const obj = {}; headers.forEach((h, i) => obj[h] = cells[i] || "");
      return normalizeRow(obj);
    });
    return rows;
  } catch(e){ console.warn("Sheet CSV fallback failed:", e); return []; }
}
async function fetchFromLocalJSON() {
  try {
    const res = await fetch("./data.json", { cache: "no-store" });
    if (!res.ok) throw new Error("data.json fetch failed");
    const json = await res.json();
    const arr = Array.isArray(json) ? json : (Array.isArray(json.properties) ? json.properties : []);
    return arr.map(normalizeRow);
  } catch(e){ console.warn("Local JSON fallback failed:", e); return []; }
}

export async function fetchProperties(){
  // priority: supabase -> sheet -> local
  const supa = await fetchFromSupabase(); if (supa.length) return supa;
  const sheet = await fetchFromSheetCSV(); if (sheet.length) return sheet;
  return await fetchFromLocalJSON();
}

/* ---------- metro support ---------- */
let METRO = null;
export async function loadMetro(){
  if (METRO !== null) return METRO;
  try {
    const res = await fetch(METRO_JSON_URL(), { cache: "no-store" });
    if (!res.ok) { METRO = []; return METRO; }
    const j = await res.json();
    METRO = Array.isArray(j) ? j : (j.stations || []);
    return METRO;
  } catch { METRO = []; return METRO; }
}
export function haversineKm(lat1, lon1, lat2, lon2){
  const toRad = d => d * Math.PI/180, R = 6371;
  const dLat = toRad(lat2-lat1), dLon = toRad(lon2-lon1);
  const a = Math.sin(dLat/2)**2 + Math.cos(toRad(lat1))*Math.cos(toRad(lat2))*Math.sin(dLon/2)**2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); return R*c;
}
export function nearestMetroKm(lat, lng){
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || !METRO?.length) return null;
  let best = Infinity;
  for (const s of METRO){
    const stationLat = Number(s.lat ?? s.latitude);
    const stationLng = Number(s.lng ?? s.longitude);
    if (!Number.isFinite(stationLat) || !Number.isFinite(stationLng)) continue;
    const km = haversineKm(lat, lng, stationLat, stationLng);
    if (km < best) best = km;
  }
  return Number.isFinite(best) ? best : null;
}

/* ---------- score + card ---------- */
export function score(p, q = "", amenity = "", opts = {}){
  if (typeof q === "object" && q) { opts = q; amenity = q.amenity || ""; q = q.q || ""; }

  let s = 0;
  const text = ((p.title||"")+" "+(p.project||"")+" "+(p.city||"")+" "+(p.locality||"")+" "+(p.summary||"")).toLowerCase();
  if (q) q.toLowerCase().split(/\s+/).filter(Boolean).forEach(tok => { if (text.includes(tok)) s += 8; });

  if (p.postedAt) {
    const days = (Date.now() - new Date(p.postedAt).getTime()) / 86400000;
    s += Math.max(0, 6 - Math.min(6, days/5));
  }

  if (p.pricePerSqftINR) { const v=p.pricePerSqftINR; if (v>0) s += 6*(1/(1+Math.exp((v-6000)/800))); }

  if (amenity && p.amenities?.some(a=>a.toLowerCase().includes(amenity.toLowerCase()))) s += 5;

  if (p.is_verified) s += 3;

  const wantMetro = !!opts.wantMetro, maxWalk = Math.max(1, Number(opts.maxWalk||10));
  const km = Number.isFinite(p._metroKm) ? p._metroKm : null;
  if (wantMetro && km !== null) {
    const minutes = km * 12;
    const metroScore = Math.max(0, 1 - (minutes / maxWalk));
    s += 5 * metroScore;
  }

  return Math.max(0, Math.min(MAX_SCORE, s));
}

function escapeHtml(s){ if(!s && s!==0) return ""; return String(s).replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;"); }

export function cardHTML(p, s) {
  const img = (p.images && p.images[0]) || "";
  const meta = [`${p.bhk||''} BHK`, `${p.carpetAreaSqft||'-'} sqft`, p.furnished||'', p.facing?`Facing ${p.facing}`:'' ].filter(Boolean)
    .map(t=>`<span class="tag">${escapeHtml(t)}</span>`).join(' ');
  const price = p.priceDisplay || (p.priceINR ? currency(p.priceINR) : 'Price on request');
  const pps = p.pricePerSqftINR ? `₹${Number(p.pricePerSqftINR).toLocaleString('en-IN')}/sqft` : '';
  const badge = p.is_verified ? 'Verified' : (p.listingStatus && p.listingStatus.toLowerCase() !== 'changed' ? p.listingStatus : '');
  const metroChip = Number.isFinite(p._metroKm) ? `<span class="tag">${Math.round(p._metroKm*12)} min to metro</span>` : '';

  return `<article class="card" data-id="${escapeHtml(p.id)}">
    <div class="card-img">
      <img src="${escapeHtml(img)}" alt="${escapeHtml(p.title)}" loading="lazy">
      ${badge ? `<div class="badge">${escapeHtml(badge)}</div>` : ''}
      <div class="score">Match ${Math.round((s/ MAX_SCORE)*100)}%</div>
    </div>
    <div class="card-body">
      <div>
        <div style="font-weight:700;font-size:16px">${escapeHtml(p.title)}</div>
        <div class="meta">${escapeHtml((p.locality||'') + (p.city ? ', ' + p.city : ''))}</div>
      </div>
      <div class="row-space">
        <div style="font-weight:800">${escapeHtml(price)}</div>
        <div style="color:var(--muted);font-size:12px">${escapeHtml(pps)}</div>
      </div>
      <div>${metroChip} ${meta}</div>
      <div style="display:flex;gap:8px"><a class="btn" href="./details.html?id=${encodeURIComponent(p.id)}">View details</a></div>
    </div>
  </article>`;
}
