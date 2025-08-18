// ===== Canvas FX (simple floating glow) =====
const reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const canvas = document.getElementById('fx'); const ctx = canvas.getContext('2d');
let dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
function sizeCanvas(){ if(!canvas) return; canvas.width=Math.floor(innerWidth*dpr);canvas.height=Math.floor(innerHeight*dpr);ctx.setTransform(dpr,0,0,dpr,0,0) }
sizeCanvas(); addEventListener('resize', sizeCanvas);
const PARTICLES = 60, balls = Array.from({length:PARTICLES},()=>spawn());
function rand(a,b){return Math.random()*(b-a)+a}; function spawn(){return {x:rand(-.1*innerWidth,1.1*innerWidth),y:rand(innerHeight*.2,innerHeight*1.2),r:rand(6,26),vy:rand(-.6,-.2),g:rand(.25,.75)}}
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

// ===== Intro Control =====
const intro = document.getElementById('intro');
const startBtn = document.getElementById('startBtn');
const boot = document.getElementById('bootSfx'); // Asumsi ini adalah backsound
const introPhoto = document.getElementById('introPhoto');
const loading = document.getElementById('loadingRow');

// Photo interaction: single click pulse, double click spin
introPhoto.addEventListener('click',()=>{introPhoto.classList.remove('spin');introPhoto.classList.add('pulse');setTimeout(()=>introPhoto.classList.remove('pulse'),100)});
introPhoto.addEventListener('dblclick',()=>{introPhoto.classList.remove('pulse');introPhoto.classList.add('spin');setTimeout(()=>introPhoto.classList.remove('spin'),100)});

// Fungsi untuk menutup intro
function closeIntro(){
  ended = true;
  intro.classList.add('hide');
  cancelAnimationFrame(animId);
  // Backsound tidak dihentikan
}

// Auto scroll section setiap 5 detik setelah intro selesai
function autoScrollSections(){
  const sections = ["event","maps","gift","galeri","thanks"]; // ganti sesuai ID section kamu
  let idx = 0;
  setInterval(()=>{
    idx = (idx + 1) % sections.length;
    scrollToId(sections[idx]);
    setActiveHref("#" + sections[idx]);
  }, 5000);
}


startBtn.addEventListener('click', ()=> {
  intro.classList.add('run'); // tampilkan baris loading
  
  // Putar backsound secara terus-menerus
  if (boot) {
    try {
      boot.loop = true; // Set audio untuk berulang
      boot.currentTime = 0;
      boot.play().then(() => {}).catch(() => {});
    } catch(e) {
      console.error("Failed to play audio:", e);
    }
  }

  // Set timeout untuk menutup intro setelah 5 detik
  let closed = false;
  function finish(){
    if (!closed) {
      closed = true;
      closeIntro();
      scrollToId('opening');
      setActiveHref('#opening');
    }
  }
  
  // Ubah durasi timeout menjadi 5000 milidetik (5 detik)
  setTimeout(finish, 3000);
});

// ===== UI Click sound after intro is closed =====
const uiClick = document.getElementById('uiClick');
function playClick(){ try{uiClick.currentTime=0; uiClick.play();}catch(e){} }
document.addEventListener('click', (e)=>{
  if(document.getElementById('intro').classList.contains('hide')){
    if(e.target.closest('[data-click-sound]')) playClick();
  }
});

// ===== Helpers for nav active state =====
function setActiveHref(href){
  const links = document.querySelectorAll('.bnav a');
  links.forEach(a=>a.classList.toggle('active', a.getAttribute('href')===href));
}
function scrollToId(id){
  const el = document.getElementById(id);
  if(el){ el.scrollIntoView({behavior:'smooth', block:'start'}); }
}

// ===== IntersectionObserver for bottom nav active =====
(function(){
  const links = Array.from(document.querySelectorAll('.bnav a'));
  if(!links.length) return;
  const sections = links.map(a => document.querySelector(a.getAttribute('href'))).filter(Boolean);
  const obs = new IntersectionObserver((entries)=>{
    entries.forEach(ent=>{
      if(ent.isIntersecting){
        links.forEach(a=>a.classList.toggle('active', a.getAttribute('href')==='#'+ent.target.id));
      }
    });
  }, {root:null, rootMargin:'0px 0px -60% 0px', threshold:0});
  sections.forEach(sec=>obs.observe(sec));
})();

// ===== Hide bottom nav on scroll; show side-dock =====
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

// ===== Force smooth scroll on nav click + hide bottom nav (show side dock) =====
(function(){
  const bnav = document.querySelector('.bnav');
  const dock = document.querySelector('.side-dock');
  function go(href){
    const id = href.replace('#','');
    scrollToId(id);
    if(bnav && dock){ bnav.classList.add('hide'); dock.classList.add('show'); }
  }
  document.addEventListener('click', (e)=>{
    const a = e.target.closest('.bnav a, .side-dock a');
    if(!a) return;
    const href = a.getAttribute('href') || '';
    if(href.startsWith('#')){ e.preventDefault(); go(href); }
  });
})();

// ===== Add to Calendar (ICS quick link) =====
(function(){
  const addCal = document.getElementById('addCal');
  if(!addCal) return;
  const dtStart = '20250831T100000'; const dtEnd = '20250831T120000';
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
