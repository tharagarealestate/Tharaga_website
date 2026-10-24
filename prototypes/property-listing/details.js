// details.js — page logic for details.html
// assumes app.js exported fetchSheetOrLocal / currency helpers

function qs(n){ return document.querySelector(n); }
function el(html){ const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstChild; }

function row(k,v){ 
  return `<div class="spec-row">
    <div style="color:rgb(148, 163, 184);font-weight:500;font-size:13px">${k}</div>
    <div style="color:rgb(255, 255, 255);font-weight:600;text-align:right">${v||'—'}</div>
  </div>`; 
}

function smartSummary(p){
  const bits = [];
  if(p.city) bits.push(`Located in ${p.locality? p.locality+', ':''}${p.city}.`);
  if(p.bhk) bits.push(`${p.bhk} BHK ${p.type||'home'} with ${p.carpetAreaSqft||'-'} sqft.`);
  if(p.furnished) bits.push(`${p.furnished}.`);
  if(p.facing) bits.push(`Vaastu: ${p.facing}-facing.`);
  if(p.amenities && p.amenities.length) bits.push(`Key amenities: ${p.amenities.slice(0,5).join(', ')}.`);
  return bits.join(' ');
}

function cardMini(p){
  const img = (p.images&&p.images[0]) || '';
  const price = p.priceDisplay || (p.priceINR? App.currency(p.priceINR) : '—');
  return `<a class="card" href="./details.html?id=${encodeURIComponent(p.id)}" style="overflow:hidden">
    <div class="card-img"><img src="${img}" alt="${p.title}"></div>
    <div style="padding:14px">
      <div style="font-weight:600;color:rgb(255, 255, 255);font-size:14px">${p.title}</div>
      <div style="color:rgb(226, 232, 240);font-size:12px">${(p.locality||'')}${p.city? ', '+p.city:''}</div>
      <div style="margin-top:6px;font-weight:700;color:rgb(252, 211, 77);font-size:16px">${price}</div>
    </div>
  </a>`;
}

async function init(){
  try {
    await App.initConfig();
  } catch (e) {
    // not fatal
  }

  const id = new URLSearchParams(location.search).get('id');
  const data = await App.fetchSheetOrLocal();
  const all = data.properties || [];
  const p = all.find(x=>x.id===id) || all[0];
  if(!p){ document.body.innerHTML = '<p style="padding:24px">Property not found.</p>'; return; }

  // Gallery
  const imgs = (p.images||[]);
  const main = imgs[0] || '';
  const thumbs = imgs.slice(1,5).map(u=>`<img src="${u}" class="details-thumb">`).join('');
  qs('#gallery').innerHTML = `<div><img src="${main}" alt="${p.title}" style="width:100%;height:100%;object-fit:cover;border-radius:16px"></div>
                              <div class="grid" style="grid-template-columns:1fr;gap:10px">${thumbs}</div>`;

  // Headline & meta
  qs('#title').textContent = `${p.id} — ${p.title}`;
  qs('#title').style.color = 'rgb(255, 255, 255)'; /* text-white */
  qs('#meta').textContent = `${p.type||''} • ${p.category||''} • ${(p.locality||'')}${p.city?', '+p.city:''}`;
  qs('#price').textContent = p.priceDisplay || (p.priceINR? App.currency(p.priceINR) : 'Price on request');
  qs('#price').style.color = 'rgb(252, 211, 77)'; /* text-amber-300 */
  qs('#pps').textContent = p.pricePerSqftINR? `₹${p.pricePerSqftINR.toLocaleString('en-IN')}/sqft` : '';
  qs('#pps').style.color = 'rgb(226, 232, 240)'; /* text-slate-200 */
  qs('#match').textContent = `Match ${Math.round(Math.random()*20+80)}%`;
  qs('#match').style.color = 'rgb(255, 255, 255)'; /* text-white */

  // Tags
  const tags = [`${p.bhk||''} BHK`, `${p.carpetAreaSqft||'-'} sqft`, p.furnished||'', p.facing?`Facing ${p.facing}`:'', p.floor&&p.floorsTotal?`Floor ${p.floor}/${p.floorsTotal}`:'' ]
    .filter(Boolean).map(t=> `<span class="tag">${t}</span>`).join(' ');
  qs('#tags').innerHTML = tags;

  // Overview
  const ov = qs('#overview');
  ov.innerHTML = [
    row('Address', p.address),
    row('RERA', p.rera),
    row('Listing Status', p.listingStatus),
    row('Bathrooms', p.bathrooms),
    row('Project', p.project),
    row('Builder', p.builder),
  ].join('');

  // Summary + Smart Summary
  const summaryEl = qs('#summary');
  if (summaryEl) {
    summaryEl.textContent = p.summary || '';
    summaryEl.style.color = 'rgb(226, 232, 240)'; /* text-slate-200 */
  }
  const smartSummaryEl = qs('#smartSummary');
  if (smartSummaryEl) {
    smartSummaryEl.textContent = smartSummary(p);
    smartSummaryEl.style.color = 'rgb(148, 163, 184)'; /* text-slate-400 */
  }

  // Docs
  if(p.docsLink){
    qs('#docs').innerHTML = `<p><a class="btn secondary" href="${p.docsLink}" target="_blank" rel="noopener">View Documents</a></p>`;
  }

  // Map
  const mapWrap = qs('#map');
  const gmap = qs('#gmap');
  const openMaps = qs('#openMaps');

  if (p.address && p.address.trim()) {
    const q = encodeURIComponent(p.address);
    if (gmap) gmap.src = `https://www.google.com/maps?q=${q}&hl=en&z=15&output=embed`;
    if (openMaps) openMaps.href = `https://www.google.com/maps/search/?api=1&query=${q}`;
  } else if (Number.isFinite(p.lat) && Number.isFinite(p.lng)) {
    const q = `${p.lat},${p.lng}`;
    if (gmap) gmap.src = `https://www.google.com/maps?q=${q}&hl=en&z=15&output=embed`;
    if (openMaps) openMaps.href = `https://www.google.com/maps/search/?api=1&query=${q}`;
  } else {
    if (mapWrap) mapWrap.style.display = 'none';
  }

  // Owner
  const wa = (p.owner&&p.owner.whatsapp) || p.ownerWhatsapp || '';
  qs('#ownerName').textContent = (p.owner&&p.owner.name) || p.ownerName || 'Owner';
  if (qs('#waBtn')) {
    if (wa) qs('#waBtn').href = `https://wa.me/${wa.replace(/\D/g,'')}?text=Hi%2C%20I%20am%20interested%20in%20${encodeURIComponent(p.title)}%20(${encodeURIComponent(p.id)})`;
    else qs('#waBtn').style.display = 'none';
  }

  // Enquiry Modal
  const modal = document.querySelector('#modal');
  const contactBtn = document.querySelector('#contactBtn');
  const closeModal = document.querySelector('#closeModal');
  if (contactBtn) contactBtn.addEventListener('click', ()=> {
    const propField = document.querySelector('#propIdField');
    if (propField) propField.value = p.id;
    if (modal) modal.classList.remove('hidden');
  });
  const closeModalHandler = ()=> {
    if (modal) modal.classList.add('hidden');
  };
  if (closeModal) closeModal.addEventListener('click', closeModalHandler);
  const closeModalBottom = document.querySelector('#closeModalBottom');
  if (closeModalBottom) closeModalBottom.addEventListener('click', closeModalHandler);

  // EMI calc
  const calc = ()=> {
    const P = parseFloat(document.querySelector('#loan').value||0);
    const r = parseFloat(document.querySelector('#rate').value||0)/1200;
    const n = parseInt(document.querySelector('#tenure').value||0)*12;
    if(P>0 && r>0 && n>0){
      const emi = (P*r*Math.pow(1+r,n))/(Math.pow(1+r,n)-1);
      document.querySelector('#emi').textContent = 'Estimated EMI: ' + App.currency(Math.round(emi));
    } else {
      const emiEl = document.querySelector('#emi');
      if (emiEl) {
        emiEl.textContent = '';
      }
    }
  };
  ['loan','rate','tenure'].forEach(id=> {
    const el = document.querySelector('#'+id);
    if (el) el.addEventListener('input', calc);
  });

  // Similar
  const pool = all.filter(x=> x.id!==p.id);
  let sim = pool.filter(x=> x.city===p.city && x.type===p.type);
  if(sim.length<3) sim = pool.filter(x=> x.city===p.city);
  if(sim.length<3) sim = pool.slice(0,3);
  qs('#similar').innerHTML = sim.slice(0,6).map(cardMini).join('');

  // "AI-style" enhance
  const enhanceBtn = document.querySelector('#enhanceBtn');
  if (enhanceBtn) enhanceBtn.addEventListener('click', ()=>{
    const base = p.summary || smartSummary(p);
    const enhanced = base
      .replace(/\s+/g,' ')
      .replace(/(^\w|\.\s+\w)/g, m => m.toUpperCase())
      .concat(' Ideal for end-use and investment. Schedule a visit today.');
    qs('#summary').textContent = enhanced;
  });

  // JSON-LD
  const ld = {
    "@context":"https://schema.org",
    "@type": p.type || "Apartment",
    "name": p.title,
    "address": p.address,
    "geo": (Number.isFinite(p.lat) && Number.isFinite(p.lng)) ? { "@type":"GeoCoordinates", "latitude":p.lat, "longitude":p.lng } : undefined,
    "numberOfRooms": p.bhk,
    "floorSize": { "@type":"QuantitativeValue", "value": p.carpetAreaSqft, "unitCode":"FTK" },
    "offers": { "@type":"Offer", "price": p.priceINR, "priceCurrency":"INR", "availability":"https://schema.org/InStock" },
    "seller": { "@type":"Person", "name": (p.owner&&p.owner.name) || "Owner" }
  };
  const s = document.createElement('script'); s.type='application/ld+json'; s.textContent = JSON.stringify(ld); document.head.appendChild(s);

  // Highlight map if hash
  if (location.hash === "#map") {
    const mapEl = document.querySelector("#map");
    if (mapEl) {
      mapEl.scrollIntoView({ behavior: "smooth", block: "center" });
      mapEl.classList.add("highlight");
      setTimeout(() => mapEl.classList.remove("highlight"), 2000);
    }
  }
}

init();
