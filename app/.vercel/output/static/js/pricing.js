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

  // Checkout wiring (Razorpay)
  function postJSON(url, body){
    return fetch(url, { method:'POST', headers:{ 'content-type':'application/json' }, body: JSON.stringify(body) })
  }
  function go(u){ location.assign(u) }

  async function startCheckout(plan){
    const annual = !!(toggle && toggle.checked)
    const email = (window.__thgUserEmail) || null
    try {
      const res = await postJSON('/api/rzp/create-subscription', { plan, annual, email, notes: { source: 'pricing_page' } })
      const j = await res.json()
      if (!j || !j.id) { alert('Unable to start checkout'); return }
      const options = {
        key: (window.RAZORPAY_KEY_ID || undefined),
        subscription_id: j.id,
        name: 'Tharaga',
        description: plan.charAt(0).toUpperCase()+plan.slice(1) + (annual ? ' • Annual' : ' • Monthly'),
        prefill: { email: email || '' },
        notes: { plan, annual: String(annual) },
        theme: { color: '#6e0d25' },
        handler: function () { go('/pricing/?success=1') },
        modal: { ondismiss: function(){ go('/pricing/?canceled=1') } }
      }
      const rzp = new window.Razorpay(options)
      rzp.open()
    } catch(_) {
      alert('Unable to start checkout')
    }
  }
  document.getElementById('growthCta')?.addEventListener('click', (e)=>{ e.preventDefault(); startCheckout('growth') })
  document.getElementById('scaleCta')?.addEventListener('click', (e)=>{ e.preventDefault(); startCheckout('scale') })

  // Surface manage billing CTA when success
  try {
    const params = new URLSearchParams(location.search)
    if (params.get('success') === '1') {
      const box = document.createElement('div')
      box.className = 'card'
      box.style.marginTop = '12px'
      box.innerHTML = '<div class="kpi">Payment received</div><div class="sub">We’ve emailed your receipt. You can manage your subscription from the Billing Portal.</div><div style="margin-top:10px"><button class="btn" id="openPortal">Open Billing Portal</button></div>'
      document.querySelector('main.container')?.prepend(box)
      document.getElementById('openPortal')?.addEventListener('click', async () => {
        try {
          // Razorpay offers a hosted subscription management link via APIs in some plans.
          // For now, guide via email to support or expose an internal page.
          location.href = 'mailto:support@tharaga.co.in?subject=Billing%20assistance'
        } catch(_) { alert('Unable to open portal') }
      })
    }
  } catch(_){ }

  // init defaults
  applyBillingMode();
  computeROI();
})();
