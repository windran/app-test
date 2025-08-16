// ===================== UTIL =====================
function readVar(name, fallback){
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  const n = parseInt(v, 10);
  return Number.isFinite(n) ? n : fallback;
}
function offsetScrollToId(id){
  const el = document.getElementById(id);
  if(!el) return;
  const bnav = readVar('--bnav-h', 68);
  const pad  = readVar('--corner-pad', 96);
  const top  = el.getBoundingClientRect().top + window.scrollY - (bnav + pad + 12);
  window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
}
function setActiveHref(href){
  document.querySelectorAll('.bnav a').forEach(a=>{
    a.classList.toggle('active', a.getAttribute('href')===href);
  });
}

// Disable browser scroll restore & clear hash at load
(function(){
  try { if ('scrollRestoration' in history) history.scrollRestoration = 'manual'; } catch(e){}
  const base = location.href.split('#')[0];
  try { history.replaceState(null, '', base); } catch(e){}
  window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
})();

// ===================== CANVAS FX =====================
(function(){
  const reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const canvas = document.getElementById('fx'); if(!canvas) return;
  const ctx = canvas.getContext('2d');
  let dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
  function sizeCanvas(){ canvas.width=Math.floor(innerWidth*dpr); canvas.height=Math.floor(innerHeight*dpr); ctx.setTransform(dpr,0,0,dpr,0,0); }
  sizeCanvas(); addEventListener('resize', sizeCanvas, {passive:true});
  const PARTICLES = 60, balls = Array.from({length:PARTICLES},()=>spawn());
  function rand(a,b){return Math.random()*(b-a)+a}
  function spawn(){return {x:rand(-.1*innerWidth,1.1*innerWidth),y:rand(innerHeight*.2,innerHeight*1.2),r:rand(6,26),vy:rand(-.6,-.2),g:rand(.25,.75)}}
  let ended=false, animId=null;
  function draw(){ if(ended) return;
    ctx.clearRect(0,0,innerWidth,innerHeight);
    const grad=ctx.createRadialGradient(innerWidth*.5,innerHeight*.6,40,innerWidth*.5,innerHeight*.6,Math.max(innerWidth,innerHeight));
    grad.addColorStop(0,'rgba(87,140,255,0.08)'); grad.addColorStop(1,'rgba(0,0,0,0)'); ctx.fillStyle=grad; ctx.fillRect(0,0,innerWidth,innerHeight);
    for(const b of balls){ b.y+=b.vy; if(b.y<-40){Object.assign(b,spawn());b.y=innerHeight+rand(0,100)} const g=ctx.createRadialGradient(b.x,b.y,b.r*.1,b.x,b.y,b.r);
      g.addColorStop(0,`rgba(255,255,255,${0.35*b.g})`); g.addColorStop(1,'rgba(122,167,255,0.05)'); ctx.fillStyle=g; ctx.beginPath(); ctx.arc(b.x,b.y,b.r,0,Math.PI*2); ctx.fill(); }
    animId=requestAnimationFrame(draw);
  }
  if(!reduceMotion) draw();
  // expose stopper for intro
  window.__stopCanvas = () => { ended = true; cancelAnimationFrame(animId); };
})();

// ===================== INTRO CONTROL =====================
(function(){
  const intro = document.getElementById('intro');
  const startBtn = document.getElementById('startBtn');
  const boot = document.getElementById('bootSfx');
  const backsound = document.getElementById('backsound');
  const introPhoto = document.getElementById('introPhoto');
  const loading = document.getElementById('loadingRow');

  if (introPhoto){
    introPhoto.addEventListener('click',()=>{
      introPhoto.classList.remove('spin'); introPhoto.classList.add('pulse');
      setTimeout(()=>introPhoto.classList.remove('pulse'),1100);
    });
    introPhoto.addEventListener('dblclick',()=>{
      introPhoto.classList.remove('pulse'); introPhoto.classList.add('spin');
      setTimeout(()=>introPhoto.classList.remove('spin'),1200);
    });
  }

  function closeIntro(){
    if (window.__stopCanvas) window.__stopCanvas();
    if (intro){
      intro.classList.add('hide');           // CSS: pointer-events:none; opacity:0
      // optional: benar2 hilang setelah transisi
      intro.addEventListener('transitionend', ()=>{ intro.style.display='none'; }, {once:true});
    }
    try{ if(boot){ boot.pause(); boot.currentTime=0; } }catch(e){}
  }

  if (startBtn){
    startBtn.addEventListener('click', ()=>{
      if (intro) intro.classList.add('run'); // show loading row kalau ada
      // play boot sfx (optional)
      try{ if(boot){ boot.currentTime=0; boot.play().catch(()=>{}); } }catch(e){}
      // play backsound (user gesture → aman dari blokir autoplay)
      try{ if(backsound){ backsound.currentTime=0; backsound.play().catch(()=>{}); } }catch(e){}

      let closed=false;
      function finish(){
        if(closed) return;
        closed = true;
        closeIntro();
        offsetScrollToId('opening');         // arahkan ke section pembuka
        setActiveHref('#opening');
      }
      if (boot){ boot.onended = finish; }
      setTimeout(finish, 20000);             // fallback max 20s
    });
  }
})();

// ===================== CLICK SOUND SESUDAH INTRO =====================
(function(){
  const uiClick = document.getElementById('uiClick');
  function playClick(){ try{ uiClick.currentTime=0; uiClick.play(); }catch(e){} }
  document.addEventListener('click', (e)=>{
    const intro = document.getElementById('intro');
    if(intro && intro.classList.contains('hide')){
      if(e.target.closest('[data-click-sound]')) playClick();
    }
  });
})();

// ===================== NAV CLICK (SMOOTH + OFFSET + TOGGLE DOCK) =====================
(function(){
  const bnav = document.querySelector('.bnav');
  const dock = document.querySelector('.side-dock');
  function go(href){
    const id = href.replace('#','');
    offsetScrollToId(id);
    if(bnav && dock){ bnav.classList.add('hide'); dock.classList.add('show'); }
  }
  document.addEventListener('click', (e)=>{
    const a = e.target.closest('.bnav a, .side-dock a');
    if(!a) return;
    const href = a.getAttribute('href') || '';
    if(href.startsWith('#')){ e.preventDefault(); go(href); }
  });
})();

// ===================== NAV ACTIVE (IntersectionObserver) =====================
(function(){
  const links = Array.from(document.querySelectorAll('.bnav a[href^="#"]'));
  if(!links.length) return;
  const sections = links.map(a => {
    const sel = a.getAttribute('href');
    try{ return document.querySelector(sel); }catch(e){ return null; }
  }).filter(Boolean);
  if(!sections.length) return;

  const obs = new IntersectionObserver((entries)=>{
    entries.forEach(ent=>{
      if(ent.isIntersecting){
        const sel = '#' + ent.target.id;
        links.forEach(a=>a.classList.toggle('active', a.getAttribute('href')===sel));
      }
    });
  }, {root:null, rootMargin:'0px 0px -60% 0px', threshold:0});
  sections.forEach(sec=>obs.observe(sec));
})();

// ===================== AUTO HIDE BNAV ON SCROLL =====================
(function(){
  const bnav = document.querySelector('.bnav');
  const dock = document.querySelector('.side-dock');
  if(!bnav || !dock) return;
  let lastY = window.scrollY, t;
  function raf(fn){ cancelAnimationFrame(t); t = requestAnimationFrame(fn); }
  addEventListener('scroll', () => {
    raf(() => {
      const y = window.scrollY;
      const goingDown = y > lastY;
      const far = y > 160;
      if(goingDown && far){ bnav.classList.add('hide'); dock.classList.add('show'); }
      else if(!goingDown || y < 60){ bnav.classList.remove('hide'); dock.classList.remove('show'); }
      lastY = y;
    });
  }, {passive:true});
})();

// ===================== FORCE OFFSET UNTUK SEMUA ANCHOR =====================
(function(){
  document.addEventListener('click', function(e){
    const a = e.target.closest('a[href^="#"]');
    if(!a) return;
    const id = a.getAttribute('href').slice(1);
    if(!id) return;
    const target = document.getElementById(id);
    if(!target) return;  // biarkan default untuk href tidak valid
    e.preventDefault();
    offsetScrollToId(id);
  }, {passive:false});

  // Deep link saat load
  window.addEventListener('load', ()=>{
    if(location.hash){
      const id = location.hash.replace('#','');
      setTimeout(()=>offsetScrollToId(id), 60);
    }
  });
})();

// ===================== ADD TO CALENDAR (ICS) =====================
(function(){
  const addCal = document.getElementById('addCal');
  if(!addCal) return;
  const dtStart = '20250831T100000'; // ganti sesuai jadwal
  const dtEnd   = '20250831T120000';
  const ics = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Undangan Khitan//ID
BEGIN:VEVENT
UID:${Date.now()}@undangan
DTSTAMP:${new Date().toISOString().replace(/[-:]/g,'').replace(/\..*/,'Z')}
DTSTART:${dtStart}
DTEND:${dtEnd}
SUMMARY:Undangan Khitan – El Gathfaan Saghara Aslan
LOCATION:Perumahan Cibarusah Indah, Blok C11 No.25
DESCRIPTION:Syukuran & doa bersama.
END:VEVENT
END:VCALENDAR`;
  const href = 'data:text/calendar;charset=utf-8,' + encodeURIComponent(ics);
  addCal.setAttribute('href', href);
  addCal.setAttribute('download', 'Undangan-Khitan.ics');
})();
