(function(){
  class ThgCta extends HTMLElement {
    static get observedAttributes(){ return ['city','budget','open','phone','bg','image','blur','theme','accent','variant','wa','wa_autoplay','wa_to','whatsapp_to','height']; }
    connectedCallback(){ this.render(); }
    attributeChangedCallback(){ this.render(); }
    render(){
      const city = this.getAttribute('city') || '';
      const budget = this.getAttribute('budget') || '';
      const phone = this.getAttribute('phone') || '';
      const open = this.hasAttribute('open') ? '1' : '';
      const bg = this.getAttribute('bg') || '';
      const image = this.getAttribute('image') || '';
      const blur = this.getAttribute('blur') || this.getAttribute('bg_blur') || '';
      const theme = this.getAttribute('theme') || '';
      const accent = this.getAttribute('accent') || '';
      const variant = this.getAttribute('variant') || '';
      const wa = this.getAttribute('wa') || '';
      const waAutoplay = this.getAttribute('wa_autoplay') || '';
      const waTo = this.getAttribute('wa_to') || this.getAttribute('whatsapp_to') || '';
      const qs = [
        'embed=cta',
        city ? `city=${encodeURIComponent(city)}` : '',
        budget ? `budget=${encodeURIComponent(budget)}` : '',
        phone ? `phone=${encodeURIComponent(phone)}` : '',
        open ? `open=${open}` : '',
        bg ? `bg=${encodeURIComponent(bg)}` : '',
        image ? `image=${encodeURIComponent(image)}` : '',
        blur ? `blur=${encodeURIComponent(blur)}` : '',
        theme ? `theme=${encodeURIComponent(theme)}` : '',
        accent ? `accent=${encodeURIComponent(accent)}` : '',
        variant ? `variant=${encodeURIComponent(variant)}` : '',
        wa ? `wa=${encodeURIComponent(wa)}` : '',
        waAutoplay ? `wa_autoplay=${encodeURIComponent(waAutoplay)}` : '',
        waTo ? `wa_to=${encodeURIComponent(waTo)}` : ''
      ].filter(Boolean).join('&');
      const src = `/cta-embed.html?${qs}`;

      const iframe = document.createElement('iframe');
      iframe.src = src; iframe.loading = 'lazy'; iframe.style.width = '100%'; iframe.style.border = '0'; iframe.style.height = '360px'; iframe.style.display = 'block'; iframe.setAttribute('title','Tharaga CTA');
      const heightAttr = this.getAttribute('height');
      if (heightAttr) iframe.style.height = /px|vh|%/.test(heightAttr) ? heightAttr : `${parseInt(heightAttr,10)||360}px`;

      // Listen for auto-height messages from the iframe
      const onMsg = (ev)=>{
        try {
          if (!ev || !ev.data) return;
          const d = ev.data;
          if (d && d.type === 'tharaga_iframe_height' && typeof d.height === 'number' && d.height > 0 && d.height < 2000) {
            iframe.style.height = `${Math.ceil(d.height)}px`;
          }
        } catch(_){}
      };
      window.addEventListener('message', onMsg);

      // Cleanup existing children and append fresh iframe
      this.innerHTML=''; this.appendChild(iframe);
    }
  }
  customElements.define('thg-cta', ThgCta);
})();
