(function(){
  function safeQueue(){
    try { return JSON.parse(localStorage.getItem('__thg_events')||'[]'); } catch(_) { return []; }
  }
  function saveQueue(q){ try { localStorage.setItem('__thg_events', JSON.stringify(q.slice(-200))); } catch(_){}
  }
  function emit(event, props){
    try{
      const payload = { event, ts: Date.now(), props: props||{} };
      if (Array.isArray(window.dataLayer)) {
        window.dataLayer.push({ event, ...payload.props });
      }
      if (typeof window.gtag === 'function') {
        try { window.gtag('event', event, payload.props); } catch(_){ }
      }
      const q = safeQueue(); q.push(payload); saveQueue(q);
      if (typeof console !== 'undefined' && console.debug) console.debug('[thgTrack]', payload);
    } catch(_){}
  }
  window.thgTrack = emit;
})();
