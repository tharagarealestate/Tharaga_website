(function(){
  class ThgCta extends HTMLElement {
    static get observedAttributes(){ return ['city','budget','open','phone','bg','height']; }
    connectedCallback(){ this.render(); }
    attributeChangedCallback(){ this.render(); }
    render(){
      const city = this.getAttribute('city') || '';
      const budget = this.getAttribute('budget') || '';
      const phone = this.getAttribute('phone') || '';
      const open = this.hasAttribute('open') ? '1' : '';
      const bg = this.getAttribute('bg') || '';
      const src = `/cta-embed.html?embed=cta${city?`&city=${encodeURIComponent(city)}`:''}${budget?`&budget=${encodeURIComponent(budget)}`:''}${phone?`&phone=${encodeURIComponent(phone)}`:''}${open?`&open=${open}`:''}${bg?`&bg=${encodeURIComponent(bg)}`:''}`;
      const iframe = document.createElement('iframe');
      iframe.src = src; iframe.loading = 'lazy'; iframe.style.width = '100%'; iframe.style.border = '0'; iframe.style.height = '360px'; iframe.style.display = 'block'; iframe.setAttribute('title','Tharaga CTA');
      const heightAttr = this.getAttribute('height');
      if (heightAttr) iframe.style.height = /px|vh|%/.test(heightAttr) ? heightAttr : `${parseInt(heightAttr,10)||360}px`;
      this.innerHTML=''; this.appendChild(iframe);
    }
  }
  customElements.define('thg-cta', ThgCta);
})();
