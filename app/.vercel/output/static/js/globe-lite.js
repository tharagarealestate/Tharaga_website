(function(){
  'use strict';
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  function setup(canvas){
    const parent = canvas.parentElement || document.body;
    const rect = parent.getBoundingClientRect();
    const width = Math.max(260, Math.min(420, rect.width));
    const height = Math.round(width * 0.7);
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    return canvas.getContext('2d');
  }
  function spherePoints(n){
    const a=[]; for(let i=0;i<n;i++){ const u=Math.random(), v=Math.random(); const th=2*Math.PI*u; const ph=Math.acos(2*v-1); a.push({ x:Math.sin(ph)*Math.cos(th), y:Math.cos(ph), z:Math.sin(ph)*Math.sin(th), s:0.6+Math.random()*0.6 }); } return a;
  }
  function animate(canvas){
    const ctx = setup(canvas);
    const W = canvas.width, H = canvas.height, R = Math.min(W,H)*0.36;
    const burgundy=[110,13,37], gold=[212,175,55];
    const pts = spherePoints(360);
    let rot=0, rafId=0;
    function mix(a,b,t){ return [ Math.round(a[0]+(b[0]-a[0])*t), Math.round(a[1]+(b[1]-a[1])*t), Math.round(a[2]+(b[2]-a[2])*t) ]; }
    function frame(){
      rafId = requestAnimationFrame(frame);
      if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      rot += 0.004;
      ctx.clearRect(0,0,W,H);
      const cx=W/2, cy=H/2;
      const g=ctx.createRadialGradient(cx-R*0.25, cy-R*0.25, R*0.2, cx, cy, R*1.05);
      g.addColorStop(0,'rgba(255,255,255,0.18)'); g.addColorStop(1,'rgba(0,0,0,0.10)');
      ctx.beginPath(); ctx.arc(cx,cy,R,0,Math.PI*2); ctx.fillStyle=g; ctx.fill();
      ctx.strokeStyle='rgba(212,175,55,0.25)'; ctx.lineWidth=Math.max(1,1.1*dpr); ctx.stroke();
      for (let i=0;i<pts.length;i++){
        const p=pts[i];
        const xr=p.x*Math.cos(rot)+p.z*Math.sin(rot);
        const yr=p.y;
        const zr=-p.x*Math.sin(rot)+p.z*Math.cos(rot);
        const px=cx + xr*R*0.98; const py=cy + yr*R*0.98;
        const t=(zr+1)/2; const s=Math.max(0.6, p.s*(0.7 + t*0.6)*dpr);
        const c=mix(burgundy,gold,t*0.9);
        ctx.fillStyle=`rgba(${c[0]},${c[1]},${c[2]},${0.5 + t*0.35})`;
        ctx.beginPath(); ctx.arc(px,py,s,0,Math.PI*2); ctx.fill();
      }
    }
    frame();
    const onResize=()=>setup(canvas); window.addEventListener('resize', onResize);
    const obs=new MutationObserver(()=>{ if(!document.body.contains(canvas)){ cancelAnimationFrame(rafId); window.removeEventListener('resize', onResize); obs.disconnect(); } });
    obs.observe(document.body,{childList:true,subtree:true});
  }
  function init(){ const el=document.getElementById('globeCanvas'); if(el && el.getContext) animate(el); }
  if(document.readyState==='complete'||document.readyState==='interactive'){ setTimeout(init,0);} else { document.addEventListener('DOMContentLoaded', init);} 
})();