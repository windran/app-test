// ===== Canvas FX (simple floating glow) =====
const reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const canvas = document.getElementById('fx'); const ctx = canvas?.getContext('2d');
let dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
function sizeCanvas(){ if(!canvas || !ctx) return; canvas.width=Math.floor(innerWidth*dpr);canvas.height=Math.floor(innerHeight*dpr);ctx.setTransform(dpr,0,0,dpr,0,0) }
sizeCanvas(); addEventListener('resize', sizeCanvas);
const PARTICLES = 60, balls = Array.from({length:PARTICLES},()=>spawn());
function rand(a,b){return Math.random()*(b-a)+a}; function spawn(){return {x:rand(-.1*innerWidth,1.1*innerWidth),y:rand(innerHeight*.2,innerHeight*1.2),r:rand(6,26),vy:rand(-.6,-.2),g:rand(.25,.75)}}
let ended=false, animId=null;
function draw(){ if(ended || !ctx) return;
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
const boot = document.getElementById('bootSfx'); // backsound
const introPhoto = document.getElementById('introPhoto');
const loading = document.getElementById('loadingRow');

// Photo interaction: single click pulse, double click spin
introPhoto?.addEventListener('click',()=>{introPhoto.classList.remove('spin');introPhoto.classList.add('pulse');setTimeout(()=>introPhoto.classList.remove('pulse'),100)});
introPhoto?.addEventListener('dblclick',()=>{introPhoto.classList.remove('pulse');introPhoto.classList.add('spin');setTimeout(()=>introPhoto.classList.remove('spin'),100)});

// ===== Helpers for nav active state =====
function setActiveHref(href){
  const links = document.querySelectorAll('.bnav a');
  links.forEach(a=>a.classList.toggle('active', a.getAttribute('href')===href));
}
function scrollToId(id){
  const el = document.getElementById(id);
  if(el){
    markProgrammaticScroll();
    el.scrollIntoView({behavior:'smooth', block:'start'});
  }
}

// Fungsi untuk menutup intro
function closeIntro(){
  ended = true;
  intro?.classList.add('hide');
  if(animId) cancelAnimationFrame(animId);
  // backsound dibiarkan berjalan
}

// ===== Auto-scroll controller =====
let autoTimer = null;            // interval id
let autoOn = false;              // state
let progScrollUntil = 0;         // timestamp untuk menandai scroll programatik
const AUTO_INTERVAL_MS = 5000;   // 5 detik

// daftar section yang akan dirotasi (ubah sesuai struktur kamu)
const ROTATE_SECTIONS = ["opening","agenda","gallery","closing"]; 
let rotateIdx = 0;

function markProgrammaticScroll(){
  // tandai 800ms ke depan sebagai scroll programatik
  progScrollUntil = Date.now() + 800;
}
function isUserScroll(e){
  // scroll dianggap user jika sekarang > progScrollUntil
  return Date.now() > progScrollUntil;
}
function startAutoScroll(){
  if(autoOn) return; autoOn = true;
  // langsung mulai dari section berikutnya agar tidak diam 5 detik di opening
  autoTimer = setInterval(()=>{
    rotateIdx = (rotateIdx + 1) % ROTATE_SECTIONS.length;
    const id = ROTATE_SECTIONS[rotateIdx];
    scrollToId(id);
    setActiveHref('#'+id);
  }, AUTO_INTERVAL_MS);
}
function stopAutoScroll(){
  if(!autoOn) return; autoOn=false; if(autoTimer){ clearInterval(autoTimer); autoTimer=null; }
}

// ===== Deteksi interaksi user untuk menghentikan auto-scroll =====
(function attachUserInterruptionHandlers(){
  // gesture & device input
  addEventListener('wheel',    (e)=>{ if(isUserScroll(e)) stopAutoScroll(); }, {passive:true});
  addEventListener('touchstart',(e)=>{ if(isUserScroll(e)) stopAutoScroll(); }, {passive:true});
  addEventListener('pointerdown',(e)=>{ if(isUserScroll(e)) stopAutoScroll(); }, {passive:true});
  addEventListener('keydown',  (e)=>{
    const keys = ['PageDown','PageUp','ArrowDown','ArrowUp','ArrowLeft','ArrowRight','Home','End','Space'];
    if(keys.includes(e.code) || keys.includes(e.key)) stopAutoScroll();
  });
  addEventListener('scroll',   (e)=>{ if(isUserScroll(e)) stopAutoScroll(); }, {passive:true});

  // klik nav/link manual → hentikan auto
  document.addEventListener('click',(e)=>{
    const a = e.target.closest('.bnav a, .side-dock a');
    if(a){ stopAutoScroll(); }
  });
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
    if(!a) return; const href = a.getAttribute('href') || '';
    if(href.startsWith('#')){ e.preventDefault(); go(href); }
  });
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

// ===== UI Click sound after intro is closed =====
const uiClick = document.getElementById('uiClick');
function playClick(){ try{uiClick.currentTime=0; uiClick.play();}catch(e){} }
document.addEventListener('click', (e)=>{
  if(document.getElementById('intro')?.classList.contains('hide')){
    if(e.target.closest('[data-click-sound]')) playClick();
  }
});

// ===== Add to Calendar (ICS quick link) =====
(function(){
  const addCal = document.getElementById('addCal');
  if(!addCal) return;
  const dtStart = '20250831T100000'; const dtEnd = '20250831T120000';
  const ics = `BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//Undangan Khitan//ID\nBEGIN:VEVENT\nUID:${Date.now()}@undangan\nDTSTAMP:${new Date().toISOString().replace(/[-:]/g,'').replace(/\..*/,'Z')}\nDTSTART:${dtStart}\nDTEND:${dtEnd}\nSUMMARY:Undangan Khitan – El Gathfaan Saghara Aslan\nLOCATION:Perumahan Cibarusah Indah, Blok C11 No.25\nDESCRIPTION:Syukuran & doa bersama.\nEND:VEVENT\nEND:VCALENDAR`;
  const href = 'data:text/calendar;charset=utf-8,' + encodeURIComponent(ics);
  addCal.setAttribute('href', href);
  addCal.setAttribute('download', 'Undangan-Khitan.ics');
})();

// ===== Start sequence (intro → close → scroll opening → auto-rotate) =====
startBtn?.addEventListener('click', ()=> {
  intro?.classList.add('run'); // tampilkan baris loading
  // backsound loop
  if (boot) {
    try { boot.loop = true; boot.currentTime = 0; boot.play().catch(()=>{}); } catch(e) { console.error('Failed to play audio:', e); }
  }
  // selesai intro setelah 3 detik (ubah jika perlu)
  let closed = false;
  function finish(){
    if (!closed) {
      closed = true;
      closeIntro();
      // Reset indeks supaya pertama kali berhenti di opening
      rotateIdx = 0;
      scrollToId('opening');
      setActiveHref('#opening');
      // Mulai auto scroll 5 detik sekali
      startAutoScroll();
    }
  }
  setTimeout(finish, 3000);
});

// ===== Optional: tombol untuk resume auto-scroll (gunakan <button id="resumeAuto">Mulai Auto</button>) =====
(function(){
  const btn = document.getElementById('resumeAuto');
  if(!btn) return;
  btn.addEventListener('click', ()=>{ startAutoScroll(); });
})();
