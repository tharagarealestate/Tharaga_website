(function(){
  'use strict';
  const $ = (sel, root=document) => root.querySelector(sel);
  const $$ = (sel, root=document) => Array.from(root.querySelectorAll(sel));

  const toggle = $('#toggleAnnual');
  const growthPrice = $('#growthPrice');
  const scalePrice = $('#scalePrice');
  const growthStrike = $('#growthStrike');
  const scaleStrike = $('#scaleStrike');
  const planSelect = $('#plan');

  function fmtINR(n){ if (!Number.isFinite(n)) return '—'; return '₹' + Math.round(n).toLocaleString('en-IN'); }

  function applyBillingMode(){
    const annual = !!(toggle && toggle.checked);
    const gp = growthPrice?.dataset[annual ? 'priceAnnual' : 'priceMonthly'];
    const sp = scalePrice?.dataset[annual ? 'priceAnnual' : 'priceMonthly'];
    if (growthPrice) growthPrice.textContent = fmtINR(Number(gp||0));
    if (scalePrice) scalePrice.textContent = fmtINR(Number(sp||0));
    if (growthStrike) growthStrike.textContent = annual ? fmtINR(Number(growthPrice?.dataset.priceMonthly||0)) : '';
    if (scaleStrike) scaleStrike.textContent = annual ? fmtINR(Number(scalePrice?.dataset.priceMonthly||0)) : '';
    if (planSelect) planSelect.value = annual ? String(Number(planSelect.value)*0.8) : (planSelect.value === '0' ? '0' : String(Number(planSelect.value)/0.8));
    computeROI();
  }

  function computeROI(){
    const leads = Number($('#leads')?.value||0);
    const qual = Number($('#qual')?.value||0)/100;
    const close = Number($('#close')?.value||0)/100;
    const rev = Number($('#rev')?.value||0);
    const plan = Number($('#plan')?.value||0);

    const qualified = leads * qual;
    const wins = qualified * close;
    const gross = wins * rev;
    const margin = 0.6; // assumption
    const net = (gross * margin) - plan;

    $('#payback').textContent = net > 0 ? 'Within 1 month' : 'More than 1 month';
    $('#roi').textContent = fmtINR(net);
  }

  toggle?.addEventListener('change', applyBillingMode);
  $$('#leads,#qual,#close,#rev,#plan').forEach(el=> el.addEventListener('input', computeROI));

  // Checkout wiring
  function postJSON(url, body){
    return fetch(url, { method:'POST', headers:{ 'content-type':'application/json' }, body: JSON.stringify(body) })
  }
  function go(u){ location.assign(u) }
  function toBool(v){ return v === true || v === 'true' || v === '1' }

  function startCheckout(plan){
    const annual = !!(toggle && toggle.checked)
    const email = (window.__thgUserEmail) || null
    postJSON('/api/checkout', {
      plan, annual, email,
      success_url: location.origin + '/pricing/?success=1',
      cancel_url: location.origin + '/pricing/?canceled=1',
      metadata: { source: 'pricing_page' }
    })
    .then(r=>r.json()).then(j=>{ if (j.url) go(j.url); else alert('Unable to start checkout') })
    .catch(()=> alert('Unable to start checkout'))
  }
  document.getElementById('growthCta')?.addEventListener('click', (e)=>{ e.preventDefault(); startCheckout('growth') })
  document.getElementById('scaleCta')?.addEventListener('click', (e)=>{ e.preventDefault(); startCheckout('scale') })

  // init defaults
  applyBillingMode();
  computeROI();
})();
