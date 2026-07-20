'use strict';
/* ============================== basics ============================== */
const cv=document.getElementById('game');
let VW=innerWidth, VH=innerHeight;
const IS_TOUCH=('ontouchstart' in window)||matchMedia('(pointer:coarse)').matches||/[?&]touch=1/.test(location.search);
if(IS_TOUCH){
  document.body.classList.add('touch');
  document.getElementById('ctlText').innerHTML=
    '<b>left stick</b> move &nbsp;·&nbsp; <b>drag anywhere else</b> look &nbsp;·&nbsp; <b>tap / SMASH</b> swing mallet &nbsp;·&nbsp; <b>DASH</b> dash<br>'+
    'Smash everything. O₂ tanks explode. Kick buckets were made to be kicked.<br>'+
    'The staff will not help you. Watch the MOP RADAR. He is already walking.';
}
const rand=(a,b)=>a+Math.random()*(b-a);
const pick=a=>a[Math.floor(Math.random()*a.length)];
const clamp=(v,a,b)=>v<a?a:v>b?b:v;
const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y); // sim-space: y means world z

/* ============================== audio ============================== */
let AC=null, master=null;
function audioInit(){ if(AC) return; AC=new (window.AudioContext||window.webkitAudioContext)();
  master=AC.createGain(); master.gain.value=.5; master.connect(AC.destination); }
function env(g,t,a,peak,dec){ g.gain.setValueAtTime(0,t); g.gain.linearRampToValueAtTime(peak,t+a);
  g.gain.exponentialRampToValueAtTime(.0001,t+a+dec); }
function noiseBuf(len){ const b=AC.createBuffer(1,AC.sampleRate*len,AC.sampleRate), d=b.getChannelData(0);
  for(let i=0;i<d.length;i++) d[i]=Math.random()*2-1; return b; }
function sfxCrash(vol=1){ if(!AC) return; const t=AC.currentTime, s=AC.createBufferSource(); s.buffer=noiseBuf(.4);
  const f=AC.createBiquadFilter(); f.type='bandpass'; f.frequency.value=2600; f.Q.value=.6;
  const g=AC.createGain(); env(g,t,.005,.7*vol,.35); s.connect(f).connect(g).connect(master); s.start(t); }
function sfxGlass(){ if(!AC) return; const t=AC.currentTime;
  for(let i=0;i<5;i++){ const o=AC.createOscillator(); o.type='triangle'; o.frequency.value=rand(2200,5200);
    const g=AC.createGain(); env(g,t+i*.02,.002,.12,.18); o.connect(g).connect(master); o.start(t+i*.02); o.stop(t+.5);} sfxCrash(.5); }
function sfxClang(){ if(!AC) return; const t=AC.currentTime;
  [523,381,764].forEach(fr=>{ const o=AC.createOscillator(); o.type='square'; o.frequency.value=fr*rand(.95,1.05);
    const g=AC.createGain(); env(g,t,.003,.09,.3); o.connect(g).connect(master); o.start(t); o.stop(t+.5); }); }
function sfxThud(){ if(!AC) return; const t=AC.currentTime; const o=AC.createOscillator(); o.type='sine';
  o.frequency.setValueAtTime(120,t); o.frequency.exponentialRampToValueAtTime(38,t+.15);
  const g=AC.createGain(); env(g,t,.004,.5,.16); o.connect(g).connect(master); o.start(t); o.stop(t+.3); }
function sfxSplash(){ if(!AC) return; const t=AC.currentTime; const s=AC.createBufferSource(); s.buffer=noiseBuf(.3);
  const f=AC.createBiquadFilter(); f.type='lowpass'; f.frequency.value=900;
  const g=AC.createGain(); env(g,t,.01,.4,.28); s.connect(f).connect(g).connect(master); s.start(t); }
function sfxZap(){ if(!AC) return; const t=AC.currentTime; const o=AC.createOscillator(); o.type='sawtooth';
  o.frequency.setValueAtTime(1800,t); o.frequency.exponentialRampToValueAtTime(200,t+.2);
  const g=AC.createGain(); env(g,t,.003,.18,.2); o.connect(g).connect(master); o.start(t); o.stop(t+.3); }
function sfxBoom(){ if(!AC) return; const t=AC.currentTime; const s=AC.createBufferSource(); s.buffer=noiseBuf(.8);
  const f=AC.createBiquadFilter(); f.type='lowpass'; f.frequency.setValueAtTime(1200,t);
  f.frequency.exponentialRampToValueAtTime(60,t+.7); const g=AC.createGain(); env(g,t,.005,1,.7);
  s.connect(f).connect(g).connect(master); s.start(t);
  const o=AC.createOscillator(); o.type='sine'; o.frequency.setValueAtTime(70,t);
  o.frequency.exponentialRampToValueAtTime(28,t+.6); const g2=AC.createGain(); env(g2,t,.005,.8,.6);
  o.connect(g2).connect(master); o.start(t); o.stop(t+.8); }
function sfxBeep(fr=880,d=.07,v=.05){ if(!AC) return; const t=AC.currentTime; const o=AC.createOscillator();
  o.type='sine'; o.frequency.value=fr; const g=AC.createGain(); env(g,t,.005,v,d);
  o.connect(g).connect(master); o.start(t); o.stop(t+d+.1); }
function sfxFlatline(){ if(!AC) return; const t=AC.currentTime; const o=AC.createOscillator(); o.type='sine';
  o.frequency.value=880; const g=AC.createGain(); g.gain.setValueAtTime(.08,t);
  g.gain.setValueAtTime(.08,t+1.4); g.gain.linearRampToValueAtTime(0,t+1.9);
  o.connect(g).connect(master); o.start(t); o.stop(t+2); }
function sfxHeart(v){ if(!AC) return; const t=AC.currentTime;
  [0,.13].forEach((off,i)=>{ const o=AC.createOscillator(); o.type='sine';
    o.frequency.setValueAtTime(i?55:70,t+off); const g=AC.createGain(); env(g,t+off,.01,v*(i?.5:.8),.12);
    o.connect(g).connect(master); o.start(t+off); o.stop(t+off+.25); }); }
function sfxWhoosh(){ if(!AC) return; const t=AC.currentTime; const s=AC.createBufferSource(); s.buffer=noiseBuf(.25);
  const f=AC.createBiquadFilter(); f.type='bandpass'; f.Q.value=1.2;
  f.frequency.setValueAtTime(400,t); f.frequency.exponentialRampToValueAtTime(1800,t+.12);
  const g=AC.createGain(); env(g,t,.02,.16,.18); s.connect(f).connect(g).connect(master); s.start(t); }
function sfxStep(){ if(!AC) return; const t=AC.currentTime; const s=AC.createBufferSource(); s.buffer=noiseBuf(.08);
  const f=AC.createBiquadFilter(); f.type='lowpass'; f.frequency.value=500;
  const g=AC.createGain(); env(g,t,.003,.11,.07); s.connect(f).connect(g).connect(master); s.start(t); }
function sfxFee(){ if(!AC) return; const t=AC.currentTime;
  [1318,988,659].forEach((fr,i)=>{ const o=AC.createOscillator(); o.type='square'; o.frequency.value=fr;
    const g=AC.createGain(); env(g,t+i*.07,.005,.07,.09);
    o.connect(g).connect(master); o.start(t+i*.07); o.stop(t+i*.07+.18); }); }
function sfxFart(){ if(!AC) return; const t=AC.currentTime, dur=rand(.28,.5);
  const o=AC.createOscillator(); o.type='sawtooth';
  o.frequency.setValueAtTime(rand(68,95),t);
  o.frequency.exponentialRampToValueAtTime(rand(38,55),t+dur);
  const g=AC.createGain();
  const lfo=AC.createOscillator(); lfo.type='square';
  lfo.frequency.setValueAtTime(rand(14,26),t);
  lfo.frequency.linearRampToValueAtTime(rand(7,13),t+dur);
  const lg=AC.createGain(); lg.gain.value=.24; lfo.connect(lg).connect(g.gain);
  g.gain.setValueAtTime(.0001,t); g.gain.linearRampToValueAtTime(.45,t+.02);
  g.gain.exponentialRampToValueAtTime(.0001,t+dur);
  const f=AC.createBiquadFilter(); f.type='lowpass'; f.frequency.value=420;
  o.connect(f).connect(g).connect(master);
  o.start(t); o.stop(t+dur+.05); lfo.start(t); lfo.stop(t+dur+.05); }
function sfxSting(){ if(!AC) return; const t=AC.currentTime;
  [110,116,220,233].forEach(fr=>{ const o=AC.createOscillator(); o.type='sawtooth'; o.frequency.value=fr;
    const g=AC.createGain(); g.gain.setValueAtTime(.12,t); g.gain.linearRampToValueAtTime(0,t+1.6);
    o.connect(g).connect(master); o.start(t); o.stop(t+1.7); });
  const s=AC.createBufferSource(); s.buffer=noiseBuf(1); const f=AC.createBiquadFilter();
  f.type='lowpass'; f.frequency.value=300; const g=AC.createGain(); env(g,t,.02,.5,1.2);
  s.connect(f).connect(g).connect(master); s.start(t); }

/* ============================== sim world (2D under the hood) ============================== */
const W=2400, H=1500, WALL=26, CEIL=132;
const walls=[];
function buildWalls(){
  walls.length=0;
  walls.push({x:0,y:0,w:W,h:WALL},{x:0,y:H-WALL,w:W,h:WALL},{x:0,y:0,w:WALL,h:H},{x:W-WALL,y:0,w:WALL,h:H});
  const vx=W/2-13, hy=H/2-13;
  walls.push({x:vx,y:0,w:26,h:520},{x:vx,y:700,w:26,h:hy-700+26},{x:vx,y:hy+300,w:26,h:H-(hy+300)});
  walls.push({x:0,y:hy,w:420,h:26},{x:600,y:hy,w:vx-600,h:26},{x:vx+26+250,y:hy,w:W-(vx+26+250)-560,h:26},{x:W-380,y:hy,w:380,h:26});
}
buildWalls();
const ROOMS=[
  {name:'OR 1'},{name:'OR 2'},{name:'STERILE CORE'},{name:'PACU'},
];
function roomOf(p){ return p.x<W/2 ? (p.y<H/2?0:2) : (p.y<H/2?1:3); }

const PT={
  anesthesia:{w:70,h:48,hp:150,pts:500},
  carm:      {w:95,h:72,hp:230,pts:800},
  ortable:   {w:120,h:58,hp:210,pts:600},
  monitor:   {w:42,h:34,hp:70, pts:300},
  warmer:    {w:62,h:52,hp:110,pts:300},
  medcab:    {w:64,h:26,hp:90, pts:250},
  orlight:   {w:58,h:58,hp:90, pts:250},
  bovie:     {w:42,h:52,hp:85, pts:200},
  cow:       {w:46,h:42,hp:70, pts:200},
  sink:      {w:74,h:30,hp:100,pts:200},
  suction:   {w:28,h:36,hp:55, pts:150},
  cart:      {w:58,h:42,hp:75, pts:150},
  tray:      {w:48,h:22,hp:45, pts:100},
  sharps:    {w:24,h:28,hp:30, pts:100},
  mayo:      {w:36,h:28,hp:40, pts:75},
  backtable: {w:90,h:40,hp:90, pts:150},
  codecart:  {w:56,h:40,hp:100,pts:250},
  shelving:  {w:130,h:36,hp:160,pts:300},
  autoclave: {w:80,h:50,hp:180,pts:400},
  stretcher: {w:50,h:95,hp:120,pts:350},
  deskstation:{w:110,h:50,hp:130,pts:250},
  boom:      {w:40,h:40,hp:150,pts:350},
  headwall:  {w:70,h:12,hp:80, pts:300},
  clock:     {w:26,h:10,hp:20, pts:150},
  whiteboard:{w:80,h:10,hp:40, pts:150},
  glovebox:  {w:34,h:10,hp:15, pts:50},
  viewmon:   {w:60,h:10,hp:50, pts:200},
  apronrack: {w:60,h:16,hp:60, pts:100},
  o2tank:    {r:12,hp:35,pts:150,phys:true,boom:true},
  ivpole:    {r:10,hp:25,pts:50, phys:true},
  kickbucket:{r:11,hp:18,pts:60, phys:true,slide:.995},
  stool:     {r:14,hp:20,pts:30, phys:true},
  hamper:    {r:17,hp:22,pts:40, phys:true},
  ringstand: {r:12,hp:25,pts:75, phys:true},
};
function propsLayout(){
  const L=[]; const add=(t,x,y,rot)=>L.push({t,x,y,rot});
  const HPI=Math.PI/2;
  // ---- OR 1: table centered in the surgical zone, anesthesia at the head (north) ----
  add('ortable',600,380);
  add('anesthesia',500,225); add('monitor',690,240); add('suction',430,260);
  add('headwall',460,44); add('ivpole',700,300); add('ivpole',560,295);
  add('orlight',545,335); add('orlight',665,425); add('boom',750,330);
  add('mayo',680,450); add('backtable',780,540); add('backtable',880,450);
  add('ringstand',830,580); add('bovie',600,560);
  add('kickbucket',540,470); add('kickbucket',700,560);
  add('stool',480,440); add('stool',730,270); add('tray',900,380);
  add('codecart',140,660); add('warmer',80,450,HPI); add('cart',400,140);
  add('cart',1080,300,-HPI); add('cow',1040,610); add('sharps',1130,480,-HPI);
  add('hamper',200,680); add('hamper',258,695); add('o2tank',90,130); add('o2tank',122,112);
  add('clock',600,44); add('whiteboard',890,44); add('viewmon',300,44);
  add('glovebox',1120,200,-HPI); add('apronrack',1150,655,-HPI);
  // ---- OR 2: same anatomy plus the C-arm (imaging room), lead aprons by the door ----
  add('ortable',1800,380);
  add('anesthesia',1700,225); add('monitor',1890,240); add('suction',1630,260);
  add('headwall',1660,44); add('ivpole',1900,300); add('ivpole',1760,295);
  add('orlight',1745,335); add('orlight',1865,425); add('boom',1950,330);
  add('carm',2060,320); add('mayo',1880,450); add('backtable',1980,540);
  add('ringstand',2030,580); add('bovie',1800,560);
  add('kickbucket',1740,470); add('kickbucket',1900,560);
  add('stool',1680,440); add('stool',1930,270); add('tray',2130,470);
  add('codecart',2340,660,-HPI); add('warmer',1280,450,HPI);
  add('cart',2280,300,-HPI); add('cow',2240,610); add('sharps',2330,480,-HPI);
  add('hamper',1400,680); add('hamper',1458,695); add('o2tank',2290,130); add('o2tank',2322,112);
  add('clock',1800,44); add('whiteboard',2090,44); add('viewmon',1500,44);
  add('glovebox',1250,200,HPI); add('apronrack',2350,560,-HPI);
  // ---- STERILE CORE: wire shelving aisles, case carts, autoclave, warmers ----
  add('shelving',350,900); add('shelving',560,900); add('shelving',770,900);
  add('shelving',350,1070); add('shelving',560,1070); add('shelving',770,1070);
  add('cart',960,900); add('cart',960,1000);
  add('autoclave',95,905,HPI); add('warmer',90,1060,HPI); add('warmer',90,1170,HPI);
  add('sink',980,800); add('medcab',450,800); add('medcab',650,800);
  add('o2tank',80,1385); add('o2tank',112,1385); add('o2tank',80,1415); add('o2tank',112,1415);
  add('hamper',545,1400); add('hamper',605,1420); add('kickbucket',700,1260);
  add('stool',460,1240); add('sharps',1060,1090); add('cow',1010,1360);
  add('tray',900,1180); add('ivpole',900,1240); add('clock',600,792); add('glovebox',200,792);
  // ---- PACU: four bays along the north wall (headwall + stretcher + monitor + IV pole) ----
  for(const bx0 of [1400,1650,1900,2150]){
    add('headwall',bx0,792); add('stretcher',bx0,890);
    add('monitor',bx0+75,835); add('ivpole',bx0-65,850);
  }
  add('deskstation',1700,1260); add('codecart',1820,1265);
  add('warmer',2330,1050,-HPI); add('medcab',1320,1300,HPI); add('suction',2120,1010);
  add('stool',1620,1180); add('stool',1980,1300); add('hamper',2280,1280);
  add('kickbucket',1850,1350); add('sharps',1290,1100,HPI); add('o2tank',2330,1430);
  add('sink',1360,1445); add('tray',2050,1190); add('cow',1550,1410);
  add('clock',1780,792); add('glovebox',2260,792);
  return L;
}

/* ============================== dialogue ============================== */
const CIRC_IDLE=["That's not my job.","I JUST sat down.","We're out of those.","Take it up with charge.",
  "I'm on my break.","Not my room, not my problem.","I'm documenting all of this.","Ugh. Seriously?",
  "I don't lift anything. Policy.","Someone else can grab that."];
const CIRC_SMASH=["I'm NOT cleaning that.","That's coming out of YOUR check.","Incident report. Again.",
  "You're contaminating MY field.","Cool. More work for literally anyone but me."];
const CIRC_BUMP=["Excuse YOU.","Personal space!","I WILL write you up.","Do NOT touch me.","I'm sitting here."];
const SURG_IDLE=["WHERE IS MY 15 BLADE?!","I NEEDED THAT YESTERDAY!","WHO TOUCHED MY MUSIC?!",
  "IS ANYONE IN THIS ROOM STERILE?!","CALL THE NEXT CASE! NOW!","I HAVE A FLIGHT AT FIVE!",
  "THIS ROOM IS A DISASTER!","WHY IS NOTHING WHERE I PUT IT?!"];
const SURG_MAD=["STOP BREAKING MY OR!!","THAT COST MORE THAN YOUR CAR!!","SECURITY!! ...EVENTUALLY!!",
  "I AM WRITING A LETTER!!","DO YOU KNOW WHO I AM?!"];
const JAN_LINES=["i clean up... everything.","such a lovely mess...","the last one ran, too.",
  "i have so many mops.","don't mind me.","almost... time.","you're making my night... special.","tsk."];
const FART_LINES=["...that's on you.","I had beans at lunch.","Occupational hazard.",
  "You heard NOTHING.","Adding it to the incident report.","That one's HR's problem now."];
const ADMIN_IDLE=["Our margins are HURTING, team.","Have you tried resilience?","This quarter is critical.",
  "I moved your break to never.","Synergy, people. Synergy.","You're a hero! (unpaid)",
  "Pizza is basically a raise.","Great engagement out there!"];
const ADMIN_FEE=["Just a small facility fee.","This hurts me more than you.","Consider it an investment.",
  "The board thanks you.","It's in your contract. Somewhere."];
const ADMIN_HIT=["FEEDBACK RECEIVED!","There goes your bonus!","I'll remember this at review time!",
  "ASSAULT! ...I mean, engagement!"];
const FEES=['facility fee','parking validation','wellness program','uniform deduction','PTO adjustment'];
const GAS_IDLE=["Vitals are... vital.","I'll chart it later.","She's fine. Probably.",
  "Sevo is basically me-time.","This crossword is 90% of my job.","Don't touch my coffee.",
  "Pressure's soft. Eh.","MAC stands for Mostly Awake, Chill."];
const GAS_BUMP=["Careful. Charting.","You bumped my coffee.","Rude. I'm pre-oxygenating."];
const GAS_SMASH=["Whoa. Chill.","That was load-bearing.","I was leaning on that.","My machine!! ...well, the hospital's."];
const SKINS={ 'Deb':{skin:'#e8c9a8',hair:'#6a4a2a'}, 'Randy':{skin:'#8d5a3b',hair:'#171310'},
  'Pam':{skin:'#f0d8c0',hair:'#b8b0a0'}, 'Dr. Blade':{skin:'#c68642',hair:'#14100c'},
  'Dr. Yell':{skin:'#e8c9a8',hair:'#8a8a88'}, 'Brad, MBA':{skin:'#e0b890',hair:'#3a2e22'},
  'Gary, CRNA':{skin:'#dcb28c',hair:'#2c2620'} };

/* ============================== three.js scene ============================== */
const scene=new THREE.Scene();
scene.background=new THREE.Color(0x0a1514);
scene.fog=new THREE.Fog(0x0a1514, 850, 2600);
const camera=new THREE.PerspectiveCamera(78, VW/VH, 1, 5000);
camera.rotation.order='YXZ';
scene.add(camera);
const HQ=!IS_TOUCH;
const renderer=new THREE.WebGLRenderer({canvas:cv, antialias:true});
renderer.setPixelRatio(Math.min(devicePixelRatio||1, IS_TOUCH?1.5:2));
renderer.setSize(VW,VH,false);
renderer.outputEncoding=THREE.sRGBEncoding;
renderer.toneMapping=THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure=.88;
renderer.shadowMap.enabled=HQ;
renderer.shadowMap.type=THREE.PCFSoftShadowMap;
/* procedural environment map: a lit teal room, so steel and floor get real reflections */
{ const pmrem=new THREE.PMREMGenerator(renderer);
  const es=new THREE.Scene();
  es.add(new THREE.Mesh(new THREE.BoxGeometry(20,10,20),
    new THREE.MeshBasicMaterial({color:0x4a7a72, side:THREE.BackSide})));
  const lm=new THREE.MeshBasicMaterial({color:new THREE.Color(7,7,6.4)});
  for(const p of [[-5,4.9,-5],[5,4.9,-5],[-5,4.9,5],[5,4.9,5]]){
    const pl=new THREE.Mesh(new THREE.PlaneGeometry(3.2,1.5), lm);
    pl.position.set(p[0],p[1],p[2]); pl.rotation.x=Math.PI/2; es.add(pl); }
  const fl=new THREE.Mesh(new THREE.PlaneGeometry(20,20),
    new THREE.MeshBasicMaterial({color:0xc8d6d2}));
  fl.rotation.x=-Math.PI/2; fl.position.y=-5; es.add(fl);
  scene.environment=pmrem.fromScene(es,0.035).texture; pmrem.dispose(); }
/* brushed-steel micro-texture shared by all metal materials */
const steelCanvas=document.createElement('canvas'); steelCanvas.width=steelCanvas.height=128;
{ const c=steelCanvas.getContext('2d'); c.fillStyle='#ffffff'; c.fillRect(0,0,128,128);
  for(let i=0;i<900;i++){ c.fillStyle='rgba('+(180+Math.floor(Math.random()*60))+','+
    (185+Math.floor(Math.random()*55))+','+(185+Math.floor(Math.random()*55))+',.5)';
    c.fillRect(Math.random()*128,Math.random()*128,rand(6,30),1); } }
const steelTex=new THREE.CanvasTexture(steelCanvas);
steelTex.wrapS=steelTex.wrapT=THREE.RepeatWrapping; steelTex.encoding=THREE.sRGBEncoding;
/* photo textures (seam-fixed tiles served from /textures); procedural canvases remain the fallback */
const texImg={};
function loadTex(name,file,cb){ const im=new Image();
  im.onload=()=>{ texImg[name]=im; cb&&cb(im); }; im.onerror=()=>{}; im.src=file; }
loadTex('steel','textures/steel.jpg',im=>{ steelCanvas.width=steelCanvas.height=256;
  steelCanvas.getContext('2d').drawImage(im,0,0,256,256); steelTex.needsUpdate=true; });
addEventListener('resize',()=>{ VW=innerWidth; VH=innerHeight;
  camera.aspect=VW/VH; camera.updateProjectionMatrix(); renderer.setSize(VW,VH,false); });

const matCache={}, bmatCache={}, smatCache={};
function mat(c){ return matCache[c]||(matCache[c]=new THREE.MeshStandardMaterial({color:c,roughness:.82,metalness:.02})); }
function bmat(c){ return bmatCache[c]||(bmatCache[c]=new THREE.MeshBasicMaterial({color:c})); }
function smat(c){ return smatCache[c]||(smatCache[c]=new THREE.MeshStandardMaterial({color:c,roughness:.26,metalness:.88,map:steelTex,envMapIntensity:1})); }
function shiny(m){ m.material=smat('#'+m.material.color.getHexString()); return m; }
const shadowMat=new THREE.MeshBasicMaterial({color:0x02100d,transparent:true,opacity:.18});
function blob(g,r){ const m=new THREE.Mesh(new THREE.CircleGeometry(Math.min(r,60),16), shadowMat);
  m.rotation.x=-Math.PI/2; m.position.y=.5; m.userData.noCast=true; g.add(m); return m; }
function bx(g,w,h,d,c,x,y,z,basic){ const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d), basic?bmat(c):mat(c));
  m.position.set(x,y,z); g.add(m); return m; }
function cyl(g,rt,rb,h,c,x,y,z,basic,seg){ const m=new THREE.Mesh(new THREE.CylinderGeometry(rt,rb,h,seg||14), basic?bmat(c):mat(c));
  m.position.set(x,y,z); g.add(m); return m; }
function sph(g,r,c,x,y,z,basic){ const m=new THREE.Mesh(new THREE.SphereGeometry(r,12,10), basic?bmat(c):mat(c));
  m.position.set(x,y,z); g.add(m); return m; }

/* lights */
const hemiL=new THREE.HemisphereLight(0xd8f0e8, 0x2c4642, 0.3); scene.add(hemiL);
const dirL=new THREE.DirectionalLight(0xe8fff6, 0.18); dirL.position.set(0.4,1,0.3); scene.add(dirL);
const roomLights=[], spots=[];
[[600,375],[1800,375],[600,1125],[1800,1125]].forEach(p=>{
  const L=new THREE.PointLight(0xeafff2, 0.5, 1500, 1.6); L.position.set(p[0],CEIL-14,p[1]);
  scene.add(L); roomLights.push(L); });
// bright surgical pools over both OR tables (shadow-casting on desktop)
[[600,380],[1800,380]].forEach(p=>{
  const s=new THREE.SpotLight(0xfff2d8, 1.05, 900, 0.72, 0.55, 1.2);
  s.position.set(p[0],CEIL-6,p[1]); s.target.position.set(p[0],0,p[1]);
  if(HQ){ s.castShadow=true; s.shadow.mapSize.set(1024,1024); s.shadow.bias=-0.0005; }
  scene.add(s); scene.add(s.target); spots.push(s);
  // faint volumetric-look cone + drifting dust under the surgical field
  const cone=new THREE.Mesh(new THREE.ConeGeometry(165,110,24,1,true),
    new THREE.MeshBasicMaterial({color:0xfff6dc,transparent:true,opacity:.075,side:THREE.DoubleSide,depthWrite:false}));
  cone.position.set(p[0],72,p[1]); scene.add(cone); });
const dusts=[];
if(HQ){ const dg=new THREE.SphereGeometry(.75,6,5),
    dm=new THREE.MeshBasicMaterial({color:0xfff8e8,transparent:true,opacity:.5,depthWrite:false});
  for(const cx0 of [600,1800]) for(let i=0;i<26;i++){
    const m=new THREE.Mesh(dg,dm);
    const d={m,cx:cx0,x:cx0+rand(-220,220),h:rand(12,108),z:380+rand(-180,180),
      vx:rand(-4,4),vh:rand(-2.5,2.5),vz:rand(-4,4)};
    m.position.set(d.x,d.h,d.z); scene.add(m); dusts.push(d); } }

/* floor with painted canvas (tiles + labels + stains) */
const floorCanvas=document.createElement('canvas'); floorCanvas.width=W; floorCanvas.height=H;
const floorTex=new THREE.CanvasTexture(floorCanvas);
floorTex.minFilter=THREE.LinearFilter; floorTex.generateMipmaps=false; floorTex.anisotropy=4;
floorTex.encoding=THREE.sRGBEncoding;
function shadowify(g){ g.traverse(o=>{ if(o.isMesh&&!o.userData.noCast){ o.castShadow=HQ; o.receiveShadow=HQ; } }); }
let ceilMat=null;
/* animated patient-vitals texture shared by every monitor screen */
const monCanvas=document.createElement('canvas'); monCanvas.width=256; monCanvas.height=160;
const monTex=new THREE.CanvasTexture(monCanvas);
monTex.minFilter=THREE.LinearFilter; monTex.generateMipmaps=false; monTex.encoding=THREE.sRGBEncoding;
const monMat=new THREE.MeshBasicMaterial({map:monTex});
function drawMonitors(t){
  const c=monCanvas.getContext('2d');
  c.fillStyle='#04140c'; c.fillRect(0,0,256,160);
  c.strokeStyle='rgba(60,120,90,.16)'; c.lineWidth=1; c.beginPath();
  for(let x=0;x<=196;x+=28){ c.moveTo(x,0); c.lineTo(x,160); }
  for(let y=0;y<=160;y+=32){ c.moveTo(0,y); c.lineTo(196,y); }
  c.stroke();
  const trace=(y0,col,fn)=>{ c.strokeStyle=col; c.lineWidth=2; c.beginPath();
    for(let x=0;x<196;x+=2){ const u=x*.05+t*2.2;
      if(x===0) c.moveTo(x,y0-fn(u)); else c.lineTo(x,y0-fn(u)); } c.stroke(); };
  trace(36,'#4ade80',u=>{ const p=u%3;
    return p<.08?26*(p/.08) : p<.16?26-56*((p-.08)/.08) : p<.26?-14+14*((p-.16)/.1)
      : (p>2.2&&p<2.5)?4*Math.sin((p-2.2)/.3*Math.PI) : 0; });
  trace(80,'#f87171',u=>{ const s=Math.max(0,Math.sin(u*2.1));
    return 16*Math.pow(s,.8)+(s>.4&&s<.6?3:0); });
  trace(118,'#7dd3fc',u=>14*Math.pow(Math.max(0,Math.sin(u*2.1-.4)),1.5));
  trace(150,'#fde047',u=>{ const p=u%3; return p<.25?13*(p/.25) : p<1.7?13+Math.sin(p*6)*.8 : p<1.95?13*(1-(p-1.7)/.25) : 0; });
  c.textAlign='left'; c.font='900 20px Consolas,monospace';
  c.fillStyle='#4ade80'; c.fillText('72',204,34);
  c.fillStyle='#f87171'; c.fillText('118/76',200,80);
  c.fillStyle='#7dd3fc'; c.fillText('99',204,118);
  c.fillStyle='#fde047'; c.fillText('35',204,152);
  c.font='9px Consolas,monospace';
  c.fillStyle='#3f8f66'; c.fillText('HR',204,14);
  c.fillStyle='#a05656'; c.fillText('ART',204,58);
  c.fillStyle='#5a94ac'; c.fillText('SpO2',204,98);
  c.fillStyle='#a89a3f'; c.fillText('etCO2',204,132);
  monTex.needsUpdate=true;
}
drawMonitors(0);
function paintFloor(){
  const c=floorCanvas.getContext('2d');
  if(texImg.floor){
    // photo sheet vinyl, one repeat per 400 units
    const s=400/texImg.floor.width; c.save(); c.scale(s,s);
    c.fillStyle=c.createPattern(texImg.floor,'repeat'); c.fillRect(0,0,W/s,H/s); c.restore();
  }else{
    // seamless epoxy look: base + speckle + faint sheet seams
    c.fillStyle='#cfdcd8'; c.fillRect(0,0,W,H);
    for(let i=0;i<9000;i++){ c.fillStyle=Math.random()<.5?'rgba(90,120,115,.10)':'rgba(255,255,255,.13)';
      c.fillRect(Math.random()*W,Math.random()*H,2.4,2.4); }
    c.strokeStyle='rgba(100,130,125,.15)'; c.lineWidth=2; c.beginPath();
    for(let x=0;x<=W;x+=120){ c.moveTo(x,0); c.lineTo(x,H); }
    for(let y=0;y<=H;y+=120){ c.moveTo(0,y); c.lineTo(W,y); }
    c.stroke();
  }
  // contrasting surgical zones under both OR tables
  for(const t of [[600,380],[1800,380]]){
    c.fillStyle='rgba(122,166,158,.35)';
    c.beginPath(); c.ellipse(t[0],t[1],300,220,0,0,7); c.fill();
    c.strokeStyle='rgba(60,110,100,.45)'; c.lineWidth=6; c.stroke();
  }
  // PACU bay markings
  c.strokeStyle='rgba(90,130,150,.35)'; c.lineWidth=4;
  for(const bx0 of [1400,1650,1900,2150]) c.strokeRect(bx0-95,775,190,240);
  // core aisle
  c.fillStyle='rgba(120,150,145,.16)'; c.fillRect(180,955,780,64);
  c.font='900 70px Impact,sans-serif'; c.fillStyle='rgba(30,80,74,.13)';
  c.fillText('OR 1',70,130); c.fillText('OR 2',W/2+70,130);
  c.fillText('STERILE CORE',70,H/2+120); c.fillText('PACU',W/2+70,H/2+120);
  floorTex.needsUpdate=true;
}
paintFloor();
loadTex('floor','textures/floor.jpg',paintFloor);
{ const fl=new THREE.Mesh(new THREE.PlaneGeometry(W,H),
    new THREE.MeshStandardMaterial({map:floorTex,roughness:.4,metalness:.06,envMapIntensity:.45}));
  fl.rotation.x=-Math.PI/2; fl.position.set(W/2,0,H/2); fl.receiveShadow=true; scene.add(fl);
  const ceilCanvas=document.createElement('canvas'); ceilCanvas.width=1200; ceilCanvas.height=750;
  const ceilTex=new THREE.CanvasTexture(ceilCanvas);
  ceilTex.minFilter=THREE.LinearFilter; ceilTex.generateMipmaps=false;
  ceilTex.encoding=THREE.sRGBEncoding;
  const paintCeil=()=>{
    const cc=ceilCanvas.getContext('2d');
    if(texImg.ceil){
      // photo mineral-fiber tile, one repeat per 75px cell (rows line up with the troffer pitch)
      const s=75/texImg.ceil.width; cc.save(); cc.scale(s,s);
      cc.fillStyle=cc.createPattern(texImg.ceil,'repeat'); cc.fillRect(0,0,1200/s,750/s); cc.restore();
    }else{
      cc.fillStyle='#94a5a1'; cc.fillRect(0,0,1200,750);
      cc.strokeStyle='rgba(60,80,76,.55)'; cc.lineWidth=1.5; cc.beginPath();
      for(let x=0;x<=1200;x+=30){ cc.moveTo(x,0); cc.lineTo(x,750); }
      for(let y=0;y<=750;y+=30){ cc.moveTo(0,y); cc.lineTo(1200,y); }
      cc.stroke();
    }
    for(let x=45;x<1160;x+=180) for(let y=40;y<720;y+=150){
      cc.fillStyle='#f6fffa'; cc.fillRect(x,y,62,28);
      cc.strokeStyle='rgba(110,130,126,.9)'; cc.lineWidth=2; cc.strokeRect(x,y,62,28); }
    ceilTex.needsUpdate=true;
  };
  paintCeil();
  loadTex('ceil','textures/ceiling.jpg',paintCeil);
  ceilMat=new THREE.MeshBasicMaterial({map:ceilTex});
  const ce=new THREE.Mesh(new THREE.PlaneGeometry(W,H), ceilMat);
  ce.rotation.x=Math.PI/2; ce.position.set(W/2,CEIL,H/2); scene.add(ce); }
function stain(x,y,col,r){ const c=floorCanvas.getContext('2d'); c.save(); c.translate(x,y);
  c.fillStyle=col; c.globalAlpha=.5; for(let i=0;i<7;i++){ c.beginPath();
  c.arc(rand(-r,r),rand(-r,r),rand(4,r/2),0,7); c.fill(); } c.restore(); floorTex.needsUpdate=true; }

/* static walls: two-tone with integral cove base + bumper rail */
const wallMeshes=[];
for(const r of walls){ const m=new THREE.Mesh(new THREE.BoxGeometry(r.w,140,r.h), mat('#41706a'));
  m.position.set(r.x+r.w/2,70,r.y+r.h/2); m.castShadow=HQ; m.receiveShadow=true; scene.add(m);
  m.userData.wallLen=Math.max(r.w,r.h); wallMeshes.push(m);
  const upper=new THREE.Mesh(new THREE.BoxGeometry(r.w+1,50,r.h+1), mat('#578b83'));
  upper.position.set(r.x+r.w/2,110,r.y+r.h/2); scene.add(upper);
  const cove=new THREE.Mesh(new THREE.BoxGeometry(r.w+3,10,r.h+3), mat('#39605a'));
  cove.position.set(r.x+r.w/2,5,r.y+r.h/2); scene.add(cove);
  const rail=new THREE.Mesh(new THREE.BoxGeometry(r.w+6,9,r.h+6), mat('#8fb5ae'));
  rail.position.set(r.x+r.w/2,44,r.y+r.h/2); scene.add(rail); }
/* photo ceramic-tile wainscot on the walls, one texture repeat per 140 units of run */
loadTex('wall','textures/wall.jpg',im=>{
  const base=new THREE.Texture(im); base.encoding=THREE.sRGBEncoding;
  for(const m of wallMeshes){
    const t=base.clone(); t.image=im; t.wrapS=t.wrapT=THREE.RepeatWrapping;
    t.repeat.set(m.userData.wallLen/140,1); t.needsUpdate=true;
    m.material=new THREE.MeshStandardMaterial({color:0x9fc0b8,map:t,roughness:.32,metalness:.03,envMapIntensity:.5});
  }
});

/* static deco: PACU curtains, door frames w/ X-ray lights, wet floor sign */
{ const deco=new THREE.Group();
  const curtMat=new THREE.MeshLambertMaterial({color:0xbcd0dd,transparent:true,opacity:.85,side:THREE.DoubleSide});
  for(const cx0 of [1525,1775,2025]){
    const track=new THREE.Mesh(new THREE.BoxGeometry(4,3,244), mat('#9aa8a5'));
    track.position.set(cx0,CEIL-8,898); deco.add(track);
    const cur=new THREE.Mesh(new THREE.BoxGeometry(2.5,CEIL-52,232), curtMat);
    cur.position.set(cx0,(CEIL-52)/2+22,898); deco.add(cur);
  }
  const frames=[
    {x:1200,z:610,horiz:false,len:200,xray:true},
    {x:1200,z:900,horiz:false,len:294,xray:false},
    {x:510,z:750,horiz:true,len:200,xray:true},
    {x:1338,z:750,horiz:true,len:270,xray:false},
    {x:1930,z:750,horiz:true,len:200,xray:false},
  ];
  for(const f of frames){
    const hw2=f.len/2+8;
    const hdr=new THREE.Mesh(new THREE.BoxGeometry(f.horiz?f.len+20:32,24,f.horiz?32:f.len+20), mat('#dfe6e4'));
    hdr.position.set(f.x,122,f.z); deco.add(hdr);
    for(const s of [-1,1]){
      const j=new THREE.Mesh(new THREE.BoxGeometry(f.horiz?10:32,112,f.horiz?32:10), mat('#dfe6e4'));
      j.position.set(f.x+(f.horiz?s*hw2:0),56,f.z+(f.horiz?0:s*hw2)); deco.add(j); }
    if(f.xray){
      const xl=new THREE.Mesh(new THREE.BoxGeometry(f.horiz?26:8,10,f.horiz?8:26), bmat('#ff5544'));
      xl.position.set(f.x,138,f.z); deco.add(xl); }
  }
  const cone=new THREE.Mesh(new THREE.ConeGeometry(11,28,4), mat('#ffd23c'));
  cone.position.set(2290,14,1380); deco.add(cone);
  const coneBand=new THREE.Mesh(new THREE.ConeGeometry(7.5,12,4), mat('#b3122e'));
  coneBand.position.set(2290,20,1380); deco.add(coneBand);
  scene.add(deco); }

/* dynamic content root (props + npcs + debris), rebuilt on restart */
let dyn=new THREE.Group(); scene.add(dyn);

/* ============================== prop meshes ============================== */
function buildPropMesh(p){
  const g=new THREE.Group();
  switch(p.t){
    case 'anesthesia': {
      for(const wp of [[-26,-17],[26,-17],[-26,17],[26,17]]) cyl(g,3.5,3.5,7,'#22282e',wp[0],3.5,wp[1]);
      shiny(bx(g,60,6,40,'#aab8b6',0,9,0));
      bx(g,58,42,38,'#39485a',0,34,0);
      bx(g,50,10,2,'#4a5c72',0,26,19.5,true); bx(g,50,10,2,'#4a5c72',0,40,19.5,true);
      bx(g,8,2,2,'#c9d4d2',0,26,20.6,true); bx(g,8,2,2,'#c9d4d2',0,40,20.6,true);
      shiny(bx(g,64,4,44,'#c9d4d2',0,57,0));
      // flowmeter bank: O2 green / N2O blue / air yellow floats behind glass
      bx(g,22,26,5,'#1e2830',-18,71,15);
      bx(g,18,22,1.5,'#dfeef0',-18,71,18,true);
      bx(g,2.2,14,1,'#2e9e5b',-24,69,19,true);
      bx(g,2.2,10,1,'#3b82c4',-18,67,19,true);
      bx(g,2.2,7,1,'#e8c04f',-12,65.5,19,true);
      cyl(g,3.4,3.4,4,'#2e9e5b',-24,60,19,false,12);
      cyl(g,2.6,2.6,4,'#3b82c4',-16,60,19,false,12);
      // vaporizers: sevoflurane yellow + isoflurane purple
      cyl(g,6,6,15,'#e8c020',8,67,8,false,14); cyl(g,6.5,6.5,3,'#22282e',8,76,8,false,14);
      bx(g,4,4,1,'#f6f0d8',8,67,14.2,true);
      cyl(g,6,6,15,'#7a4a9e',22,67,8,false,14); cyl(g,6.5,6.5,3,'#22282e',22,76,8,false,14);
      bx(g,4,4,1,'#e8dff2',22,67,14.2,true);
      // ventilator bellows in clear housing
      bx(g,16,22,14,'#b8ccd4',-20,70,-11);
      for(let bi=0;bi<5;bi++) cyl(g,5,5,1.4,'#e8f0ee',-20,62+bi*3.4,-11,false,12);
      // CO2 absorber canister
      cyl(g,5,5,12,'#e8ece9',26,65,-12,false,12); cyl(g,5.2,5.2,2,'#8fb5ae',26,72,-12,false,12);
      // corrugated breathing circuit hoses
      { const h1=new THREE.Mesh(new THREE.TorusGeometry(9,1.7,6,14,Math.PI), mat('#7ec8c0'));
        h1.position.set(-4,58,21); h1.rotation.z=Math.PI; g.add(h1);
        const h2=new THREE.Mesh(new THREE.TorusGeometry(7,1.7,6,14,Math.PI), mat('#9ad4cc'));
        h2.position.set(5,58,21); h2.rotation.z=Math.PI; g.add(h2); }
      // live patient monitor up top + O2 cylinder yoked at back
      bx(g,30,22,6,'#1c2430',-10,93,0);
      { const scr=new THREE.Mesh(new THREE.PlaneGeometry(26,18), monMat);
        scr.position.set(-10,93,3.4); g.add(scr); }
      bx(g,10,6,10,'#39485a',18,86,-4);
      cyl(g,4.5,4.5,22,'#2e9e5b',18,52,-16,false,12);
      cyl(g,2,4.5,3,'#c9d4d2',18,64.5,-16,false,10);
    } break;
    case 'carm': bx(g,60,18,50,'#7c8288',-8,9,0); bx(g,16,64,16,'#9aa0a6',-20,50,0);
      { const arc=new THREE.Mesh(new THREE.TorusGeometry(34,7,8,18,Math.PI), mat('#c9ccd0'));
        arc.position.set(12,72,0); arc.rotation.z=-Math.PI/2; g.add(arc); }
      bx(g,20,12,20,'#7c8288',12,104,0); bx(g,20,12,20,'#7c8288',12,40,0); break;
    case 'ortable': bx(g,30,28,24,'#3a4a52',0,14,0); bx(g,116,10,54,'#55676f',0,52,0);
      bx(g,108,8,46,'#dfe8e6',0,61,0); bx(g,20,6,46,'#c3d2cf',-58,60,0); break;
    case 'monitor': bx(g,26,6,26,'#4a5560',0,3,0); cyl(g,3,3,70,'#7c8288',0,38,0);
      bx(g,40,28,7,'#2b3338',0,86,0);
      { const scr=new THREE.Mesh(new THREE.PlaneGeometry(34,22), monMat);
        scr.position.set(0,86,4.6); g.add(scr); } break;
    case 'warmer': bx(g,58,96,48,'#7d6f56',0,48,0);
      bx(g,46,26,2,'#e8dcc0',0,70,25,true); bx(g,46,26,2,'#e8dcc0',0,36,25,true); break;
    case 'medcab': cyl(g,2.5,2.5,40,'#7c8288',-24,20,0); cyl(g,2.5,2.5,40,'#7c8288',24,20,0);
      bx(g,60,70,22,'#4d6d84',0,75,0); bx(g,24,54,2,'#bfe9ff',-14,75,12,true);
      bx(g,24,54,2,'#bfe9ff',14,75,12,true); break;
    case 'orlight': cyl(g,3,3,26,'#8a9d99',0,CEIL-14,0);
      cyl(g,30,26,9,'#e8ecec',0,CEIL-32,0,false,20); cyl(g,23,23,2,'#fff6c8',0,CEIL-37,0,true,20);
      cyl(g,5,5,3,'#cfd6d4',0,CEIL-39,0); break;
    case 'bovie': bx(g,38,10,44,'#616e7a',0,5,0); cyl(g,4,4,50,'#4a5560',0,34,0);
      bx(g,36,28,40,'#4a5560',0,72,0); bx(g,28,10,2,'#7ecbff',0,76,21,true);
      bx(g,8,5,2,'#ffb52e',-10,64,21,true); break;
    case 'cow': bx(g,40,8,38,'#5a6266',0,4,0); cyl(g,3.5,3.5,58,'#737d82',0,36,0);
      bx(g,42,4,36,'#737d82',0,66,0); { const s=bx(g,36,24,3,'#2b3338',0,82,-6);
        s.rotation.x=-0.28; const f=bx(g,32,20,1,'#8affc1',0,82,-4,true); f.rotation.x=-0.28; } break;
    case 'sink': bx(g,70,42,28,'#9fb4be',0,21,0); bx(g,62,4,20,'#7d99a6',0,43,0);
      cyl(g,2,2,18,'#d8e8ee',0,52,-4); bx(g,2,2,10,'#d8e8ee',0,60,1); break;
    case 'suction': bx(g,24,6,30,'#616e7a',0,3,0); cyl(g,12,12,36,'#6a7d85',0,26,0);
      cyl(g,10,10,14,'#a01a2e',0,17,0,true); cyl(g,5,5,4,'#aab8b5',0,46,0); break;
    case 'cart': bx(g,54,66,38,'#8f4f5f',0,37,0); bx(g,46,9,2,'#e0c9cf',0,52,20,true);
      bx(g,46,9,2,'#e0c9cf',0,38,20,true); bx(g,46,9,2,'#e0c9cf',0,24,20,true); break;
    case 'tray': cyl(g,2.5,2.5,54,'#9aa8a5',-16,27,0); cyl(g,2.5,2.5,54,'#9aa8a5',16,27,0);
      bx(g,46,4,20,'#c4d0cd',0,56,0); bx(g,26,2,3,'#e8f0ee',-4,59,2,true);
      bx(g,20,2,3,'#e8f0ee',6,59,-4,true); break;
    case 'sharps': cyl(g,3,3,46,'#8a9d99',0,23,0); bx(g,22,26,20,'#c22a2a',0,58,0);
      bx(g,14,4,2,'#111111',0,66,11,true); break;
    case 'mayo': cyl(g,2.5,2.5,76,'#9aa8a5',0,38,0); bx(g,34,3,26,'#dfeae7',0,78,0);
      bx(g,18,1.6,2.4,'#e8f0ee',0,80,3,true); break;
    case 'o2tank': cyl(g,11,11,60,'#3e8f5c',0,30,0); cyl(g,6,11,10,'#4fa76e',0,64,0);
      bx(g,6,9,6,'#c9ccd0',0,72,0); break;
    case 'ivpole': cyl(g,9,9,3,'#7c8288',0,1.5,0); cyl(g,1.8,1.8,146,'#9aa8a5',0,74,0);
      bx(g,22,2,2,'#9aa8a5',0,142,0); bx(g,10,16,4,'#cfe6ff',8,132,0,true); break;
    case 'kickbucket': cyl(g,11,9,18,'#c9ccd0',0,9,0); cyl(g,9,9,2,'#a01a2e',0,18,0,true); break;
    case 'stool': cyl(g,10,10,3,'#2b3338',0,1.5,0); cyl(g,3,3,40,'#46525a',0,22,0);
      cyl(g,14,14,5,'#2b3338',0,44,0); break;
    case 'hamper': cyl(g,17,15,56,'#7a86b8',0,28,0);
      { const s=sph(g,13,'#cfd8ff',0,58,0,true); s.scale.y=.5; } break;
    case 'backtable':
      for(const sx2 of [-38,38]) for(const sz of [-14,14]) shiny(cyl(g,2.5,2.5,52,'#aab8b6',sx2,26,sz));
      shiny(bx(g,86,4,36,'#c9d4d2',0,54,0)); bx(g,80,2,32,'#9fc2e8',0,57,0,true);
      bx(g,20,3,12,'#e8f0ee',-20,60,4,true); bx(g,16,3,10,'#e8f0ee',14,60,-6,true); break;
    case 'ringstand': shiny(cyl(g,2.5,2.5,66,'#aab8b6',0,33,0));
      { const ring=new THREE.Mesh(new THREE.TorusGeometry(11,1.6,8,18), smat('#aab8b6'));
        ring.rotation.x=Math.PI/2; ring.position.y=68; g.add(ring); }
      shiny(cyl(g,10,6,10,'#c9d4d2',0,64,0)); break;
    case 'codecart': bx(g,52,70,38,'#c0392b',0,37,0);
      for(const dy of [24,38,52]) bx(g,44,9,2,'#e8b4ad',0,dy,20,true);
      bx(g,20,10,16,'#f1c40f',10,78,0); bx(g,10,4,10,'#2b3338',-14,76,0); break;
    case 'shelving':
      for(const sx2 of [-61,61]) for(const sz of [-15,15]) shiny(cyl(g,1.8,1.8,110,'#aab8b6',sx2,55,sz));
      for(const dy of [22,52,82,106]) shiny(bx(g,126,2.4,34,'#c9d4d2',0,dy,0));
      { const cols=['#4f86c0','#c05a4f','#4fc07a','#c0b44f','#7a5ac0'];
        for(const dy of [30,60,90]) for(let i=0;i<4;i++)
          bx(g,24,14,26,cols[(i+dy)%5],-45+i*30,dy,0,true); } break;
    case 'autoclave': shiny(bx(g,76,84,46,'#aab8b6',0,44,0));
      { const door=shiny(cyl(g,26,26,6,'#c9d4d2',0,48,24)); door.rotation.x=Math.PI/2;
        const wheel=new THREE.Mesh(new THREE.TorusGeometry(9,1.8,8,16), smat('#8a9d99'));
        wheel.position.set(0,48,28.5); g.add(wheel); }
      bx(g,18,26,2,'#2b3338',26,66,23.5); bx(g,4,4,1,'#4fc07a',22,72,24.7,true);
      bx(g,4,4,1,'#ffb52e',30,72,24.7,true); break;
    case 'stretcher':
      shiny(bx(g,44,5,88,'#8a9d99',0,28,0));
      bx(g,42,9,84,'#e8eef0',0,35,0); bx(g,36,5,16,'#f8fcfc',0,41,-30,true);
      for(const sx2 of [-22,22]){ shiny(bx(g,2,12,66,'#aab8b6',sx2,46,0)); }
      for(const sx2 of [-17,17]) for(const sz of [-36,36]){ cyl(g,3.5,3.5,7,'#2b3338',sx2,4,sz);
        shiny(cyl(g,1.5,1.5,20,'#8a9d99',sx2,16,sz)); } break;
    case 'deskstation': bx(g,106,5,46,'#7d97a6',0,42,0);
      bx(g,6,42,46,'#5d7786',-50,21,0); bx(g,6,42,46,'#5d7786',50,21,0);
      bx(g,26,20,4,'#2b3338',-18,56,-8); bx(g,22,16,1,'#8affc1',-18,56,-5.4,true);
      bx(g,18,1.5,12,'#f6fafa',18,45,4,true); bx(g,14,1.5,10,'#f6fafa',30,45,-8,true); break;
    case 'boom': shiny(cyl(g,7,7,60,'#c9ccd0',0,CEIL-30,0));
      shiny(bx(g,56,6,9,'#c9ccd0',24,CEIL-58,0));
      shiny(cyl(g,3.5,3.5,34,'#aab8b6',48,CEIL-77,0));
      bx(g,30,5,24,'#c9d4d2',48,CEIL-95,0);
      bx(g,22,12,16,'#3ec1d3',48,CEIL-103,0);
      bx(g,3,3,1.5,'#4fc07a',42,CEIL-92,12.2,true); bx(g,3,3,1.5,'#e8c04f',48,CEIL-92,12.2,true);
      bx(g,3,3,1.5,'#f6fafa',54,CEIL-92,12.2,true); break;
    case 'headwall': bx(g,66,36,6,'#dfe6e8',0,92,0);
      { const oc=[['#2e9e5b',-22],['#e8c04f',-8],['#f6fafa',6],['#f6fafa',20]];
        for(const [col,ox] of oc){ const o=cyl(g,3,3,2.5,col,ox,92,3.4,true,10); o.rotation.x=Math.PI/2; } }
      shiny(bx(g,50,3,10,'#aab8b6',0,72,4)); break;
    case 'clock': { const face=cyl(g,13,13,4,'#f4f8f7',0,100,0,true,20); face.rotation.x=Math.PI/2;
      const rim=cyl(g,14,14,3,'#8a9d99',0,100,-.8,false,20); rim.rotation.x=Math.PI/2;
      bx(g,1.5,9,1,'#16302c',0,103,2.4,true); bx(g,6,1.5,1,'#16302c',2,100,2.4,true);
      bx(g,1,10,.8,'#b3122e',-1,100,2.7,true); } break;
    case 'whiteboard': bx(g,80,40,3,'#9aa8a5',0,88,0); bx(g,74,34,1.6,'#f6fafa',0,88,1.4,true);
      bx(g,30,2,1,'#3f6ea8',-14,94,2.4,true); bx(g,24,2,1,'#c0392b',-10,86,2.4,true);
      bx(g,18,2,1,'#16302c',6,80,2.4,true); shiny(bx(g,60,3,6,'#aab8b6',0,66,2)); break;
    case 'glovebox':
      bx(g,28,10,8,'#7a86b8',0,86,0,true); bx(g,28,10,8,'#b87aa8',0,74,0,true);
      bx(g,28,10,8,'#e8e8e8',0,62,0,true); break;
    case 'viewmon': bx(g,56,36,5,'#1c2426',0,92,0); bx(g,48,28,1.6,'#cfe4ff',0,92,2.6,true);
      bx(g,20,20,1,'#8fa8c8',-8,92,3.2,true); bx(g,14,24,1,'#a8bcd8',14,92,3.2,true); break;
    case 'apronrack': shiny(bx(g,56,3,5,'#aab8b6',0,98,0));
      shiny(cyl(g,2,2,98,'#aab8b6',-26,49,0)); shiny(cyl(g,2,2,98,'#aab8b6',26,49,0));
      { const ac=['#3f6ea8','#4f86c0','#2c5c3c'];
        for(let i=0;i<3;i++){ const a=bx(g,15,42,3,ac[i],-16+i*16,74,2+i*1.5);
          a.rotation.z=rand(-.06,.06); } } break;
  }
  g.rotation.y=p.rot||0;
  const WALLMOUNT={orlight:1,boom:1,clock:1,whiteboard:1,glovebox:1,viewmon:1,headwall:1};
  if(!WALLMOUNT[p.t]) blob(g,(p.r||Math.min(p.w,p.h)/2)+6);
  shadowify(g);
  g.position.set(p.x,0,p.y);
  return g;
}
function buildDebris(p){
  const g=new THREE.Group();
  const base=(PT[p.t].w||PT[p.t].r*2);
  bx(g,base*.6,7,base*.4,'#5f6f6c',rand(-6,6),3.5,rand(-6,6)).rotation.y=rand(0,3);
  bx(g,base*.4,6,base*.5,'#48566a',rand(-8,8),3,rand(-8,8)).rotation.y=rand(0,3);
  bx(g,base*.3,5,base*.25,'#3c4a48',rand(-8,8),2.5,rand(-8,8)).rotation.y=rand(0,3);
  g.position.set(p.x,0,p.y);
  return g;
}

/* ============================== characters ============================== */
function mkLimb2(parent,x,y,z,upLen,loLen,r,upC,loC,endC,endR,shoe){
  const up=new THREE.Group(); up.position.set(x,y,z);
  const um=new THREE.Mesh(new THREE.CapsuleGeometry(r,Math.max(2,upLen-2*r),3,10), mat(upC));
  um.position.y=-upLen/2; up.add(um);
  const lo=new THREE.Group(); lo.position.y=-upLen;
  const lm=new THREE.Mesh(new THREE.CapsuleGeometry(r*.82,Math.max(2,loLen-2*r),3,10), mat(loC));
  lm.position.y=-loLen/2; lo.add(lm);
  if(shoe){ const s=new THREE.Mesh(new THREE.BoxGeometry(r*3.3,r*1.5,r*2.2), mat(endC));
    s.position.set(r*.95,-loLen,0); lo.add(s); }
  else if(endC){ const e=new THREE.Mesh(new THREE.SphereGeometry(endR||r*1.15,10,8), mat(endC));
    e.position.y=-loLen; lo.add(e); }
  up.add(lo); parent.add(up);
  return {up,lo};
}
function mkHead(g,U,y,r,skin,hair,capC,maskC){
  const hd=new THREE.Group(); hd.position.set(0,y,0);
  hd.add(new THREE.Mesh(new THREE.SphereGeometry(r,16,14), mat(skin)));
  { const jaw=new THREE.Mesh(new THREE.SphereGeometry(r*.8,12,10), mat(skin));
    jaw.position.set(r*.12,-r*.5,0); jaw.scale.set(1,.8,.9); hd.add(jaw); }
  sph(hd,r*.27,skin,-r*.05,-r*.06,-r*.96); sph(hd,r*.27,skin,-r*.05,-r*.06,r*.96);
  sph(hd,r*.2,skin,r*.98,-r*.14,0);
  U.eyeL=sph(hd,r*.22,'#f6f6f4',r*.8,r*.16,-r*.36);
  U.eyeR=sph(hd,r*.22,'#f6f6f4',r*.8,r*.16,r*.36);
  for(const e of [U.eyeL,U.eyeR]){
    const p=new THREE.Mesh(new THREE.SphereGeometry(r*.1,8,6), bmat('#1c1a18'));
    p.position.x=r*.16; e.add(p); }
  bx(hd,r*.16,r*.14,r*.5,hair,r*.84,r*.44,-r*.36);
  bx(hd,r*.16,r*.14,r*.5,hair,r*.84,r*.44,r*.36);
  { const hb=new THREE.Mesh(new THREE.SphereGeometry(r*.98,14,12), mat(hair));
    hb.position.set(-r*.22,r*.12,0); hb.scale.set(.95,.9,1.03); hd.add(hb); }
  if(capC){ const cap=new THREE.Mesh(new THREE.SphereGeometry(r*1.06,14,12), mat(capC));
    cap.position.set(-r*.04,r*.5,0); cap.scale.set(1.02,.62,1.05); hd.add(cap); }
  if(maskC){ bx(hd,r*.5,r*.7,r*1.15,maskC,r*.7,-r*.3,0);
    bx(hd,r*.52,r*.06,r*1.17,'#a8c4b8',r*.72,-r*.16,0,true);
    bx(hd,r*.52,r*.06,r*1.17,'#a8c4b8',r*.72,-r*.42,0,true);
    bx(hd,r*.06,r*.06,r*1.9,'#cfe4d8',r*.2,-r*.12,0); }
  U.head=hd; g.add(hd); return hd;
}
function buildCircMesh(o){
  const g=new THREE.Group(); blob(g,26); const U=g.userData;
  U.legL=mkLimb2(g,0,32,-8,16,16,4.8,'#33587f','#33587f','#2b3338',0,true);
  U.legR=mkLimb2(g,0,32,8,16,16,4.8,'#33587f','#33587f','#2b3338',0,true);
  { const t=new THREE.Mesh(new THREE.CylinderGeometry(13,16,30,16), mat('#3f6ea8'));
    t.position.y=47; t.scale.set(1.55,1,1.25); g.add(t); U.torso=t; }
  bx(g,1.5,8,9,'#2f5586',20,50,5);
  bx(g,1.5,7,6,'#f0f4f2',20,56,-8,true);
  U.armL=mkLimb2(g,0,59,-21,13,12,3.8,'#3f6ea8',o.skin,o.skin,4.1,false);
  U.armR=mkLimb2(g,0,59,21,13,12,3.8,'#3f6ea8',o.skin,o.skin,4.1,false);
  U.armL.up.rotation.x=-.55; U.armL.lo.rotation.x=1.2;
  U.armR.up.rotation.x=.55; U.armR.lo.rotation.x=-1.2;
  U.akimbo=true;
  mkHead(g,U,74,9,o.skin,o.hair,'#5b86b8',null);
  bx(U.head,1,.9,4.6,'#8a5a4a',8.6,-3.8,0,true);
  return g;
}
function buildSurgMesh(o){
  const g=new THREE.Group(); blob(g,15); const U=g.userData;
  U.legL=mkLimb2(g,0,36,-5.5,18,18,4,'#2c5c3c','#2c5c3c','#2b3338',0,true);
  U.legR=mkLimb2(g,0,36,5.5,18,18,4,'#2c5c3c','#2c5c3c','#2b3338',0,true);
  { const t=new THREE.Mesh(new THREE.CylinderGeometry(9.5,11.5,28,14), mat('#3e7d52'));
    t.position.y=50; t.scale.set(1.15,1,1); g.add(t); U.torso=t; }
  bx(g,1.5,7,6,'#8fd8c8',11.5,54,-7,true);
  U.armL=mkLimb2(g,0,62,-13,14,13,3.4,'#3e7d52',o.skin,'#d8e4e2',3.8,false);
  U.armR=mkLimb2(g,0,62,13,14,13,3.4,'#3e7d52',o.skin,'#d8e4e2',3.8,false);
  mkHead(g,U,78,8.6,o.skin,o.hair,'#2c5c3c','#cfe4d8');
  return g;
}
function buildAdminMesh(o){
  const g=new THREE.Group(); blob(g,16); const U=g.userData;
  U.legL=mkLimb2(g,0,36,-5.5,18,18,4,'#3a3f4a','#3a3f4a','#16161a',0,true);
  U.legR=mkLimb2(g,0,36,5.5,18,18,4,'#3a3f4a','#3a3f4a','#16161a',0,true);
  { const t=new THREE.Mesh(new THREE.CylinderGeometry(10,12,29,14), mat('#2e3a55'));
    t.position.y=50.5; t.scale.set(1.12,1,1); g.add(t); U.torso=t; }
  bx(g,1.5,10,6,'#f4f6f8',11.8,58,0);
  bx(g,1.6,11,3,'#b3122e',12.6,55,0); bx(g,2,2.4,3.6,'#8a0e22',12.8,61.5,0);
  bx(g,1.5,7,5,'#f0f4f2',12,50,-7,true);
  U.armL=mkLimb2(g,0,62,-14,14,13,3.5,'#2e3a55',o.skin,o.skin,3.8,false);
  U.armR=mkLimb2(g,0,62,14,14,13,3.5,'#2e3a55',o.skin,o.skin,3.8,false);
  U.armL.up.rotation.x=-.3; U.armL.lo.rotation.z=1.5; U.pinL=true;
  { const stack=new THREE.Group();
    for(let i=0;i<3;i++) bx(stack,15,2.4,15,i===1?'#d8b078':'#c9a06a',2,i*2.7,0);
    stack.position.set(0,-13,0); U.armL.lo.add(stack); }
  mkHead(g,U,79,8.4,o.skin,o.hair,null,null);
  bx(U.head,1.4,1.6,5,'#ffffff',8.4,-3.6,0,true);
  bx(U.head,1,.7,5.6,'#b07860',8.2,-4.7,0,true);
  return g;
}
function buildGasMesh(o){
  const g=new THREE.Group(); blob(g,17); const U=g.userData;
  // his stool is part of him; he is never getting up
  cyl(g,10,10,4,'#2b3338',0,26,0); cyl(g,2.6,2.6,24,'#46525a',0,13,0); cyl(g,8,8,2,'#22282e',0,1,0);
  U.legL=mkLimb2(g,2,30,-6,15,15,4,'#4a8f9e','#4a8f9e','#2b3338',0,true);
  U.legR=mkLimb2(g,2,30,6,15,15,4,'#4a8f9e','#4a8f9e','#2b3338',0,true);
  U.legL.up.rotation.z=-1.4; U.legL.lo.rotation.z=1.5;
  U.legR.up.rotation.z=-1.4; U.legR.lo.rotation.z=1.5;
  U.seated=true; U.akimbo=true;
  { const t=new THREE.Mesh(new THREE.CylinderGeometry(9.5,11,26,14), mat('#4a8f9e'));
    t.position.y=43; g.add(t); U.torso=t; }
  bx(g,1.5,7,6,'#f0f4f2',11,46,-7,true);
  U.armL=mkLimb2(g,0,54,-13,13,12,3.4,'#4a8f9e',o.skin,o.skin,3.7,false);
  U.armR=mkLimb2(g,0,54,13,13,12,3.4,'#4a8f9e',o.skin,o.skin,3.7,false);
  U.armL.up.rotation.z=-.55; U.armL.lo.rotation.z=-1.1; U.pinL=true;
  U.armR.up.rotation.z=-.35; U.armR.lo.rotation.z=-1.5;
  bx(U.armL.lo,10,8,1.2,'#f6fafa',1,-13,0,true);
  bx(U.armL.lo,7,5,1,'#c9ccd0',1,-12,.8,true);
  { const cup=cyl(U.armR.lo,2.4,2,5,'#f4f6f8',0,-13,0);
    cyl(U.armR.lo,2.2,2.2,1,'#5a3a22',0,-10.6,0,true); }
  mkHead(g,U,68,8.4,o.skin,o.hair,'#6aa8b5',null);
  bx(U.head,1,.8,4,'#8a5a4a',8.4,-3.9,0,true);
  return g;
}
function buildJanMesh(){
  // short, wide and wrong: stubby legs, a gut, and a too-big pale head
  const g=new THREE.Group(); blob(g,19); const U=g.userData;
  U.legL=mkLimb2(g,0,24,-6,12,12,4.4,'#1c2226','#1c2226','#111417',0,true);
  U.legR=mkLimb2(g,0,24,6,12,12,4.4,'#1c2226','#1c2226','#111417',0,true);
  { const t=new THREE.Mesh(new THREE.CylinderGeometry(11,14.5,26,14), mat('#232a2e'));
    t.position.set(1.5,37,0); t.rotation.z=-.1; t.scale.set(1.25,1,1.12); g.add(t); U.torso=t; }
  { const belly=new THREE.Mesh(new THREE.SphereGeometry(11.5,14,12), mat('#232a2e'));
    belly.position.set(6,30,0); belly.scale.set(1.05,.85,1.15); g.add(belly); }
  bx(g,1,5,4,'#171c1f',15.5,42,3); bx(g,1,4,5,'#171c1f',15,33,-4);
  bx(g,4.5,6,1.5,'#8a8f92',16.4,41,4,true);
  bx(g,1.4,3,1.2,'#c8b040',9,26,10,true); bx(g,1.2,2.4,1,'#9aa0a4',10.8,26,10.6,true);
  U.armL=mkLimb2(g,3,48,-16,12,12,3.4,'#232a2e','#232a2e','#e2ded2',3.6,false);
  U.armR=mkLimb2(g,3,48,16,12,12,3.4,'#232a2e','#232a2e','#e2ded2',3.6,false);
  { const mop=new THREE.Group();
    const h=cyl(mop,1.6,1.6,96,'#6a5a3a',0,10,0); h.rotation.z=-.2;
    const head=sph(mop,8.5,'#cfc8b8',10,-38,0); head.scale.y=.5;
    sph(mop,4,'#7d1424',13,-39,3);
    mop.scale.setScalar(.78); mop.position.set(6,-2,2); U.armR.lo.add(mop); }
  mkHead(g,U,60,9.5,'#e2ded2','#4a5054','#454e54',null);
  U.head.position.x=4;
  U.head.children[1].visible=false;                       // no jaw: the face texture owns the mouth
  U.head.children[7].visible=U.head.children[8].visible=false;  // ...and the brows
  U.head.children[4].visible=false;                             // ...and the nose ball: the painted face has one
  loadTex('face','textures/janitor-face.jpg',im=>{
    const t=new THREE.Texture(im); t.encoding=THREE.sRGBEncoding; t.needsUpdate=true;
    U.head.children[0].material=new THREE.MeshStandardMaterial({map:t,roughness:.55,metalness:0});
  });
  U.eyeL.material=bmat('#0a0c0d'); U.eyeR.material=bmat('#0a0c0d');
  return g;
}

/* mallet viewmodel */
const mallet=new THREE.Group();
{ const handle=cyl(mallet,1.7,1.7,30,'#7a5230',0,0,-15); handle.rotation.x=Math.PI/2;
  bx(mallet,11,8,8,'#4a4f52',0,0,-31); bx(mallet,11,2.6,8,'#6a7175',0,3.6,-31);
  const arm=cyl(mallet,3.2,4.2,20,'#2e8f86',4,-6,-1); arm.rotation.x=1.15; arm.rotation.z=-.35;
  sph(mallet,4,'#f0f4f2',0,-1,-8);
  mallet.scale.setScalar(0.55);
  mallet.position.set(11,-11,-13); mallet.rotation.set(0.6,-0.35,0.15);
  camera.add(mallet); }

/* ============================== DOM label helpers ============================== */
const labelsEl=document.getElementById('labels');
const tmpV=new THREE.Vector3(), tmpV2=new THREE.Vector3();
function projectTo(el,x,h,z,scaleRef){
  tmpV.set(x,h,z);
  tmpV2.copy(tmpV).applyMatrix4(camera.matrixWorldInverse);
  if(tmpV2.z>-4){ el.style.display='none'; return false; }
  tmpV.project(camera);
  el.style.display='block';
  el.style.left=((tmpV.x*.5+.5)*VW)+'px';
  el.style.top=((-tmpV.y*.5+.5)*VH)+'px';
  if(scaleRef){ const s=clamp(560/-tmpV2.z,.45,1.6); el.style.scale=s; }
  return true;
}
const pops=[];
function addPop(x,z,txt,col='#ffe9a8',size=20,h=70){
  const el=document.createElement('div'); el.className='pop';
  el.textContent=txt; el.style.color=col; el.style.fontSize=size+'px';
  labelsEl.appendChild(el);
  pops.push({x,h,z,el,t:0,ttl:1.15});
  if(pops.length>36){ const o=pops.shift(); o.el.remove(); }
}
function bubbleFor(n,cls){
  if(!n.bubEl){ n.bubEl=document.createElement('div'); n.bubEl.className='bub '+cls;
    labelsEl.appendChild(n.bubEl); }
  return n.bubEl;
}

/* ============================== particles ============================== */
const partPool=[]; const partGeo=new THREE.BoxGeometry(3.4,3.4,3.4);
function spawnPart(x,h,z,col,spd,life,grav=700){
  let p=partPool.find(q=>!q.on);
  if(!p){ if(partPool.length>260) return;
    p={mesh:new THREE.Mesh(partGeo, bmat(col)),on:false}; dynStatic.add(p.mesh); partPool.push(p); }
  p.on=true; p.mesh.visible=true; p.mesh.material=bmat(col);
  p.mesh.scale.setScalar(rand(.6,1.6));
  p.x=x; p.h=h; p.z=z; const a=rand(0,7);
  p.vx=Math.cos(a)*rand(.2,1)*spd; p.vz=Math.sin(a)*rand(.2,1)*spd;
  p.vh=grav<200?rand(6,55):rand(40,320); p.grav=grav;
  p.t=0; p.life=rand(.5,1)*life;
}
function burst(x,z,n,col,spd=200,life=.9,h=42,grav=700){ for(let i=0;i<n;i++) spawnPart(x,h+rand(-14,20),z,col,spd,life,grav); }
let dynStatic=new THREE.Group(); scene.add(dynStatic); // particles live outside rebuilds

/* ============================== game state ============================== */
let props=[], npcs=[], projs=[];
let player, janitor, score, combo, comboT, broken, total, shake, state='title';
let paused=false, freezeT=0, banner100=[false,false,false,false], allDone=false, deathT=0;
let camYaw=Math.PI, camPitch=0, headBob=0, stepT=0;
let evT=22, blackoutT=0, timeoutT=0;
const eyeGlow=new THREE.MeshBasicMaterial({color:0xff4045});
const keys={};
let locked=false, beepTimer=0, heartTimer=0;

const PROP_FX={
  monitor:{col:'#8affc1',sfx:()=>{sfxGlass();sfxFlatline();}},
  orlight:{col:'#fff6c8',sfx:sfxGlass}, medcab:{col:'#bfe9ff',sfx:sfxGlass},
  bovie:{col:'#7ecbff',sfx:sfxZap}, cow:{col:'#8affc1',sfx:sfxGlass},
  suction:{col:'#a01a2e',sfx:sfxSplash,st:'#7d1424'}, sink:{col:'#9fd4ff',sfx:sfxSplash,st:'#7fb8d8'},
  hamper:{col:'#cfd8ff',sfx:sfxThud}, sharps:{col:'#ff5555',sfx:sfxCrash,st:'#a01a2e'},
  o2tank:{col:'#b8ffd8',sfx:sfxBoom},
  backtable:{col:'#c9d4d2',sfx:sfxClang}, ringstand:{col:'#c9d4d2',sfx:sfxClang},
  codecart:{col:'#ff8f80',sfx:sfxCrash}, shelving:{col:'#7ecb8f',sfx:sfxCrash},
  autoclave:{col:'#e8f0ee',sfx:()=>{sfxClang();sfxSplash();}},
  stretcher:{col:'#e8eef0',sfx:sfxThud}, deskstation:{col:'#8affc1',sfx:sfxGlass},
  boom:{col:'#c9ccd0',sfx:()=>{sfxZap();sfxCrash();}},
  headwall:{col:'#ffd27a',sfx:sfxZap},
  clock:{col:'#f4f8f7',sfx:sfxGlass}, whiteboard:{col:'#f6fafa',sfx:sfxCrash},
  glovebox:{col:'#cfd8ff',sfx:sfxThud}, viewmon:{col:'#cfe4ff',sfx:sfxGlass},
  apronrack:{col:'#3f6ea8',sfx:sfxThud},
};

function init(){
  scene.remove(dyn);
  dyn.traverse(o=>{ if(o.isMesh) o.geometry.dispose(); });
  dyn=new THREE.Group(); scene.add(dyn);
  for(const p of pops) p.el.remove(); pops.length=0;
  document.querySelectorAll('.bub').forEach(e=>e.remove());
  paintFloor();
  props=propsLayout().map((p,i)=>{ const d=PT[p.t];
    const o={id:i,t:p.t,x:p.x,y:p.y,rot:p.rot||0,w:d.w||0,h:d.h||0,r:d.r||0,hp:d.hp,maxhp:d.hp,pts:d.pts,
      phys:!!d.phys,boom:!!d.boom,slide:d.slide||.97,vx:0,vy:0,dead:false,wob:0,seed:Math.random()*7};
    o.mesh=buildPropMesh(o); dyn.add(o.mesh); return o; });
  total=props.length; broken=0; projs=[];
  player={x:300,y:560,r:15,vx:0,vy:0,ang:0,swing:0,swingCd:0,dashT:0,dashCd:0,stun:0,inv:0};
  janitor={x:2250,y:1430,r:16,speed:42,bob:0,line:'',lineT:0};
  janitor.mesh=buildJanMesh(); dyn.add(janitor.mesh);
  npcs=[
    mkNPC('circ',700,630,'Deb'), mkNPC('circ',1520,620,'Randy'), mkNPC('circ',1850,1150,'Pam'),
    mkNPC('surg',600,300,'Dr. Blade'), mkNPC('surg',1940,420,'Dr. Yell'),
    mkNPC('admin',1100,900,'Brad, MBA'),
    mkNPC('gas',430,335,'Gary, CRNA'),
  ];
  npcs[6].ang=-1.0;
  for(const n of npcs){
    n.mesh=(n.kind==='circ'?buildCircMesh(SKINS[n.name])
      :n.kind==='admin'?buildAdminMesh(SKINS[n.name])
      :n.kind==='gas'?buildGasMesh(SKINS[n.name])
      :buildSurgMesh(SKINS[n.name]));
    shadowify(n.mesh); dyn.add(n.mesh); }
  shadowify(janitor.mesh);
  evT=22; blackoutT=0; timeoutT=0;
  hemiL.intensity=.3; dirL.intensity=.18; if(ceilMat) ceilMat.color.setScalar(1);
  for(const s of spots) s.intensity=1.05;
  for(const L of roomLights) L.intensity=.5;
  camYaw=Math.PI*0.9; camPitch=0;
  score=0; combo=1; comboT=0; freezeT=0; shake=0; allDone=false; deathT=0;
  banner100=[false,false,false,false];
  updateHUD();
}
function mkNPC(kind,x,y,name){
  return {kind,x,y,name,r:kind==='circ'?21:15,ang:rand(0,7),line:'',lineT:0,say:rand(2,6),
    tx:x,ty:y,moveT:rand(4,9),throwT:rand(3,6),feeT:0,bump:0,bob:Math.random()*7,knock:{x:0,y:0},vx:0,vy:0};
}

/* ============================== sim helpers ============================== */
function circRect(cx,cy,cr,r){ const nx=clamp(cx,r.x,r.x+r.w), ny=clamp(cy,r.y,r.y+r.h);
  const dx=cx-nx, dy=cy-ny, d2=dx*dx+dy*dy; if(d2>=cr*cr) return null;
  const d=Math.sqrt(d2)||.001; return {nx:dx/d,ny:dy/d,depth:cr-d}; }
function solidRects(){ const out=[...walls];
  for(const p of props) if(!p.dead && !p.phys) out.push({x:p.x-p.w/2,y:p.y-p.h/2,w:p.w,h:p.h,prop:p});
  return out; }
function moveCircle(e,dt){
  e.x+=e.vx*dt; e.y+=e.vy*dt;
  for(const r of solidRects()){ const c=circRect(e.x,e.y,e.r,r);
    if(c){ e.x+=c.nx*c.depth; e.y+=c.ny*c.depth;
      if(r.prop && e.spd && e.spd()>150){ hitProp(r.prop, e.spd()*.12, e.x, e.y, .3); e.vx*=-.4; e.vy*=-.4; } } }
  e.x=clamp(e.x,WALL+e.r,W-WALL-e.r); e.y=clamp(e.y,WALL+e.r,H-WALL-e.r);
}
function say(n,txt){ n.line=txt; n.lineT=2.8; }

function hitProp(p,dmg,fx,fy,imp=1){
  if(p.dead) return;
  p.hp-=dmg; p.wob=1;
  if(p.phys){ const d=Math.hypot(p.x-fx,p.y-fy)||1;
    p.vx+=(p.x-fx)/d*260*imp; p.vy+=(p.y-fy)/d*260*imp; }
  const fxd=PROP_FX[p.t];
  burst(p.x,p.y,6,fxd?fxd.col:'#cfe0dd',160,.5);
  if(p.hp<=0) breakProp(p); else sfxClang();
}
function breakProp(p){
  p.dead=true; broken++;
  const fxd=PROP_FX[p.t];
  const gain=Math.round(p.pts*combo);
  score+=gain; combo=Math.min(9,combo+.5); comboT=3; shake=Math.min(22,shake+5+p.pts/120);
  addPop(p.x,p.y,'+$'+gain, combo>=4?'#ffb52e':'#ffe9a8', 18+Math.min(16,p.pts/55), 78);
  if(combo>=6 && Math.random()<.4) addPop(p.x,p.y,pick(['UNSTERILE!','FLAGRANT!','CODE BROWN!','JCAHO WHO?']),'#8affc1',16,108);
  burst(p.x,p.y,28,fxd?fxd.col:'#cfe0dd',280,1);
  burst(p.x,p.y,10,'#5a6b68',140,.7,20);
  dyn.remove(p.mesh); p.mesh.traverse(o=>{ if(o.isMesh) o.geometry.dispose(); });
  p.mesh=buildDebris(p); shadowify(p.mesh); dyn.add(p.mesh);
  if(fxd&&fxd.st) stain(p.x,p.y,fxd.st,60);
  (fxd?fxd.sfx:sfxCrash)();
  if(p.boom) explode(p.x,p.y);
  if(p.t==='tray'||p.t==='mayo'){ sfxClang(); burst(p.x,p.y,8,'#e8f0ee',240,.8,58); }
  freezeT=Math.max(freezeT, p.pts>=500?.06:.02);
  for(const n of npcs){ if(dist(n,p)<330 && Math.random()<.5 && n.lineT<=0)
    say(n, n.kind==='circ'?pick(CIRC_SMASH)
      : n.kind==='gas'?pick(GAS_SMASH)
      : n.kind==='admin'?pick(["THAT'S A CAPITAL EXPENSE!!","DEPRECIATION!!"])
      : pick(SURG_MAD)); }
  checkRooms(p);
  updateHUD();
}
function explode(x,y){
  shake=30; freezeT=.09; sfxBoom();
  burst(x,y,50,'#ffd27a',460,1); burst(x,y,30,'#ff7a3c',330,.8); burst(x,y,24,'#3c3c3c',220,1.3,30);
  stain(x,y,'#2b2b2b',110);
  flashEl.style.opacity=.28; setTimeout(()=>flashEl.style.opacity=0,110);
  for(const p of props){ if(p.dead) continue; const d=dist(p,{x,y});
    if(d<170) hitProp(p, 95*(1-d/170)+20, x, y, 1.6); }
  for(const n of npcs){ const d=dist(n,{x,y}); if(d<220){ const k=(1-d/220)*400, dd=Math.max(d,1);
    n.knock.x+=(n.x-x)/dd*k; n.knock.y+=(n.y-y)/dd*k;
    say(n, n.kind==='circ'?"THAT one I'm reporting.":"MY EYEBROWS!!"); } }
  if(dist(janitor,{x,y})<260 && janitor.lineT<=0) say(janitor,'tsk.');
  if(dist(player,{x,y})<150) hurtPlayer();
}
function mkScalpel(x,y,ang,spd){
  const s={x,y,vx:Math.cos(ang)*spd,vy:Math.sin(ang)*spd,t:0,life:1.6};
  s.mesh=new THREE.Mesh(new THREE.BoxGeometry(16,2.4,3.6), mat('#d8e4e2'));
  s.mesh.position.set(x,56,y); s.mesh.rotation.y=-ang; dyn.add(s.mesh);
  return s;
}
function mkPizza(x,y,ang){
  const s={x,y,vx:Math.cos(ang)*260,vy:Math.sin(ang)*260,t:0,life:2.1,pizza:true};
  const g=new THREE.Group();
  g.add(new THREE.Mesh(new THREE.CylinderGeometry(9,9,1.6,16), mat('#e8c06a')));
  { const ring=new THREE.Mesh(new THREE.TorusGeometry(8.4,1.3,6,16), mat('#c89040'));
    ring.rotation.x=Math.PI/2; g.add(ring); }
  for(let i=0;i<5;i++){ const pep=new THREE.Mesh(new THREE.CylinderGeometry(1.6,1.6,.7,8), mat('#a02818'));
    pep.position.set(rand(-5,5),1.1,rand(-5,5)); g.add(pep); }
  g.position.set(x,58,y); s.mesh=g; dyn.add(g);
  return s;
}
function hurtPlayer(){
  if(player.inv>0) return;
  player.stun=.5; player.inv=1; combo=1; comboT=0; shake=Math.max(shake,16);
  flashEl.style.opacity=.35; setTimeout(()=>flashEl.style.opacity=0,90); sfxThud(); updateHUD();
}
function triggerEvent(){
  const ev=pick(['pizza','tantrum','blackout','timeout','codebrown']);
  if(ev==='pizza'){ const b=npcs.find(n=>n.kind==='admin');
    if(b){ showBanner('PIZZA PARTY! (IN LIEU OF RAISES)'); say(b,'MORALE. NOW.');
      const base=Math.atan2(player.y-b.y,player.x-b.x);
      for(let i=-2;i<=2;i++) projs.push(mkPizza(b.x,b.y,base+i*.22)); sfxThud(); } }
  else if(ev==='tantrum'){ showBanner('SURGEON TANTRUM');
    for(const n of npcs){ if(n.kind!=='surg') continue;
      say(n,pick(["WRONG. IMPLANT.","I ASKED FOR JAZZ!!","WHO SCHEDULED THIS?!"]));
      for(let i=0;i<6;i++) projs.push(mkScalpel(n.x,n.y,i/6*Math.PI*2,320)); }
    sfxZap(); sfxCrash(); }
  else if(ev==='blackout'){ blackoutT=1.7; showBanner('the lights');
    say(janitor,'the dark is clean.'); sfxThud(); sfxHeart(.9); }
  else if(ev==='timeout'){ timeoutT=4; showBanner('SURGICAL TIME-OUT. NOBODY MOVE.');
    for(const n of npcs){ if(n.kind==='circ') say(n,'Finally.'); }
    say(janitor,"i don't do time-outs."); }
  else { showBanner('CODE BROWN IN PACU');
    for(let i=0;i<4;i++) stain(rand(1300,2300),rand(850,1400),'#6a4a2a',34);
    for(const n of npcs){ if(n.kind==='circ'&&Math.random()<.7) say(n,'NOT it.'); }
    say(janitor,'...mine.'); sfxSplash(); }
}
function checkRooms(p){
  const ri=roomOf(p);
  if(!banner100[ri] && props.filter(q=>roomOf(q)===ri).every(q=>q.dead)){
    banner100[ri]=true; score+=2500; addPop(p.x,p.y,'ROOM CLEARED +$2500','#ffb52e',26,100);
    showBanner(ROOMS[ri].name+' — 100% TURNOVER'); sfxCrash(1);
  }
  if(!allDone && broken>=total){ allDone=true; score+=10000;
    showBanner('TOTAL TURNOVER! +$10,000 · HE IS RUNNING NOW'); janitor.speed+=90; sfxSting(); }
}

/* ============================== HUD ============================== */
const scoreEl=document.getElementById('score'), comboEl=document.getElementById('combo'),
  destrEl=document.getElementById('destr'), radarFill=document.getElementById('radarFill'),
  radarTxt=document.getElementById('radarTxt'), radarArrow=document.getElementById('radarArrow'),
  vigEl=document.getElementById('vignette'), flashEl=document.getElementById('flash'),
  bannerEl=document.getElementById('banner'), crossDot=document.getElementById('crossDot');
function updateHUD(){
  scoreEl.textContent='$'+score.toLocaleString('en-US');
  comboEl.textContent='×'+(combo%1?combo.toFixed(1):combo);
  comboEl.style.transform='scale('+(1+Math.min(.5,(combo-1)*.08))+')';
  comboEl.style.color=combo>=5?'#ff3350':combo>=3?'#ffb52e':'#ffe9a8';
  destrEl.textContent=Math.round(broken/total*100)+'%  ('+broken+'/'+total+' items)';
}
let bannerTO=null;
function showBanner(t){ bannerEl.textContent=t; bannerEl.classList.add('show');
  clearTimeout(bannerTO); bannerTO=setTimeout(()=>bannerEl.classList.remove('show'),2600); }

/* ============================== input ============================== */
addEventListener('keydown',e=>{
  keys[e.code]=true;
  if(e.code==='Space'){ e.preventDefault(); trySwing(); }
  if(e.code==='KeyP'&&state==='play') setPaused(!paused);
  if(e.code==='KeyR'&&state==='dead') restart();
});
addEventListener('keyup',e=>keys[e.code]=false);
let dragging=false;
cv.addEventListener('mousedown',e=>{ if(e.button===0&&state==='play'){ dragging=true; if(!locked) tryLock(); trySwing(); } });
addEventListener('mouseup',()=>dragging=false);
addEventListener('mousemove',e=>{
  if(state!=='play'||paused) return;
  if(locked||dragging){ camYaw-=e.movementX*.0024; camPitch=clamp(camPitch-e.movementY*.0022,-1.25,1.25); }
});
document.addEventListener('pointerlockchange',()=>{
  locked=(document.pointerLockElement===cv);
  if(!locked && state==='play' && !paused) setPaused(true);
});
document.addEventListener('pointerlockerror',()=>{ locked=false; });
function tryLock(){ if(IS_TOUCH) return; try{ cv.requestPointerLock(); }catch(err){} }
function setPaused(v){ paused=v;
  document.getElementById('pausedOv').style.display=v?'flex':'none';
  if(v&&locked) document.exitPointerLock();
}
document.getElementById('pausedOv').addEventListener('click',()=>{ setPaused(false); tryLock(); });
addEventListener('blur',()=>{ for(const k in keys) keys[k]=false;
  if(state==='play'&&!paused) setPaused(true); });
cv.addEventListener('contextmenu',e=>e.preventDefault());

/* ---- touch controls ---- */
let stickId=null, stickVec={x:0,y:0}, lookId=null, lookLast={x:0,y:0}, lookStart={x:0,y:0,t:0};
let swingHeld=false, wantDash=false;
const stickEl=document.getElementById('stick'), knobEl=document.getElementById('stickKnob'),
  btnSwing=document.getElementById('btnSwing'), btnDash=document.getElementById('btnDash');
function stickCenter(){ const r=stickEl.getBoundingClientRect();
  return {x:r.left+r.width/2, y:r.top+r.height/2, rad:r.width/2}; }
function stickMove(t){ const c=stickCenter(); let dx=t.clientX-c.x, dy=t.clientY-c.y;
  const m=Math.hypot(dx,dy); if(m>c.rad){ dx*=c.rad/m; dy*=c.rad/m; }
  knobEl.style.transform='translate(calc(-50% + '+dx+'px), calc(-50% + '+dy+'px))';
  stickVec={x:dx/c.rad, y:dy/c.rad}; }
stickEl.addEventListener('touchstart',e=>{ e.preventDefault();
  for(const t of e.changedTouches) if(stickId===null){ stickId=t.identifier; stickMove(t); } },{passive:false});
cv.addEventListener('touchstart',e=>{ e.preventDefault();
  for(const t of e.changedTouches) if(lookId===null&&t.identifier!==stickId){
    lookId=t.identifier; lookLast={x:t.clientX,y:t.clientY};
    lookStart={x:t.clientX,y:t.clientY,t:performance.now()}; } },{passive:false});
addEventListener('touchmove',e=>{
  for(const t of e.changedTouches){
    if(t.identifier===stickId){ if(e.cancelable) e.preventDefault(); stickMove(t); }
    else if(t.identifier===lookId){ if(e.cancelable) e.preventDefault();
      if(state==='play'&&!paused){
        camYaw-=(t.clientX-lookLast.x)*.006;
        camPitch=clamp(camPitch-(t.clientY-lookLast.y)*.005,-1.25,1.25); }
      lookLast={x:t.clientX,y:t.clientY}; } } },{passive:false});
function touchDone(e){
  for(const t of e.changedTouches){
    if(t.identifier===stickId){ stickId=null; stickVec={x:0,y:0};
      knobEl.style.transform='translate(-50%,-50%)'; }
    if(t.identifier===lookId){
      const held=performance.now()-lookStart.t,
        moved=Math.hypot(t.clientX-lookStart.x,t.clientY-lookStart.y);
      if(held<260&&moved<12) trySwing();
      lookId=null; } } }
addEventListener('touchend',touchDone); addEventListener('touchcancel',touchDone);
btnSwing.addEventListener('touchstart',e=>{ e.preventDefault(); swingHeld=true; trySwing(); },{passive:false});
btnSwing.addEventListener('touchend',e=>{ e.preventDefault(); swingHeld=false; },{passive:false});
btnDash.addEventListener('touchstart',e=>{ e.preventDefault(); wantDash=true; },{passive:false});

function aimTarget(){
  let best=null, bestD=1e9;
  for(const p of props){ if(p.dead) continue;
    const px=p.x-player.x, py=p.y-player.y;
    const d=Math.hypot(px,py)-(p.r||Math.min(p.w,p.h)/2);
    if(d<150){ const a=Math.atan2(py,px); let da=Math.abs(a-player.ang);
      da=Math.min(da,Math.PI*2-da);
      if(da<0.62 && d<bestD){ best=p; bestD=d; } } }
  return best;
}
function trySwing(){
  if(state!=='play'||paused) return;
  if(player.swingCd>0||player.stun>0) return;
  player.swing=.26; player.swingCd=.32; sfxWhoosh();
  let hitAny=false;
  for(const p of props){ if(p.dead) continue;
    const px=p.x-player.x, py=p.y-player.y;
    const d=Math.hypot(px,py)-(p.r||Math.min(p.w,p.h)/2);
    if(d<150){ const a=Math.atan2(py,px); let da=Math.abs(a-player.ang);
      da=Math.min(da,Math.PI*2-da);
      if(da<0.62){ hitProp(p,38,player.x,player.y,1); hitAny=true; } } }
  for(const n of npcs){ if(dist(n,player)<150+n.r){ const a=Math.atan2(n.y-player.y,n.x-player.x);
    let da=Math.abs(a-player.ang); da=Math.min(da,Math.PI*2-da);
    if(da<0.62) npcBumped(n,true); } }
  if(hitAny) shake=Math.max(shake,3.5);
  else sfxBeep(220,.04,.03);
}
function fart(n){
  sfxFart();
  const rx=n.x-Math.cos(n.ang)*16, rz=n.y-Math.sin(n.ang)*16;
  burst(rx,rz,7,'#9ecb6a',48,1.5,22,60); burst(rx,rz,6,'#c3de74',36,1.7,26,60);
  addPop(n.x,n.y,'BIOHAZARD!','#9ecb6a',15,64);
}
function npcBumped(n,hit){
  if(n.bump>0) return; n.bump=1.2;
  if(n.kind==='circ'){
    if(hit||Math.random()<.4){ fart(n); say(n,Math.random()<.55?pick(FART_LINES):pick(CIRC_BUMP)); }
    else say(n,pick(CIRC_BUMP));
  }
  else if(n.kind==='gas'){ say(n,pick(GAS_BUMP)); }
  else if(n.kind==='admin'){ say(n,pick(ADMIN_HIT));
    if(hit&&Math.random()<.35){ score+=150; updateHUD();
      addPop(n.x,n.y,'+$150 (petty cash)','#8affc1',15,70); } }
  else { say(n,pick(SURG_MAD)); n.throwT=Math.min(n.throwT,.5); }
  if(hit){ const d=Math.max(dist(n,player),1);
    n.knock.x+=(n.x-player.x)/d*(n.kind==='circ'?60:140);
    n.knock.y+=(n.y-player.y)/d*(n.kind==='circ'?60:140); sfxThud(); }
}

/* ============================== update ============================== */
function update(dt){
  if(freezeT>0){ freezeT-=dt; return; }
  const P=player;
  camera.rotation.set(camPitch,camYaw,0);
  camera.updateMatrixWorld();
  const fwd=camera.getWorldDirection(tmpV);
  const fl=Math.hypot(fwd.x,fwd.z)||1; const fx=fwd.x/fl, fz=fwd.z/fl;
  P.ang=Math.atan2(fz,fx);
  let mx=0,mz=0;
  if(keys.KeyW){ mx+=fx; mz+=fz; } if(keys.KeyS){ mx-=fx; mz-=fz; }
  if(keys.KeyD){ mx-=fz; mz+=fx; } if(keys.KeyA){ mx+=fz; mz-=fx; }
  const ml=Math.hypot(mx,mz)||1; mx/=ml; mz/=ml;
  if(stickId!==null&&Math.hypot(stickVec.x,stickVec.y)>.15){
    mx=fx*(-stickVec.y)+(-fz)*stickVec.x; mz=fz*(-stickVec.y)+fx*stickVec.x;
    const sl=Math.hypot(mx,mz)||1; mx/=sl; mz/=sl;
  }
  const moving=(mx||mz);
  const dashing=P.dashT>0;
  if((keys.ShiftLeft||keys.ShiftRight||wantDash)&&P.dashCd<=0&&moving){ P.dashT=.18; P.dashCd=1.1; P.inv=Math.max(P.inv,.3); sfxBeep(440,.05,.04); }
  wantDash=false;
  if(swingHeld) trySwing();
  const spd=(P.stun>0?90:dashing?640:245);
  P.vx=mx*spd*(moving?1:0); P.vy=mz*spd*(moving?1:0);
  P.spd=()=>Math.hypot(P.vx,P.vy);
  moveCircle(P,dt);
  stepT-=dt;
  if(moving&&stepT<=0){ stepT=dashing?.16:.34; sfxStep(); }
  const tgtFov=dashing?86:78;
  if(Math.abs(camera.fov-tgtFov)>.1){ camera.fov+=(tgtFov-camera.fov)*Math.min(1,dt*10); camera.updateProjectionMatrix(); }
  P.swing=Math.max(0,P.swing-dt); P.swingCd-=dt; P.dashT-=dt; P.dashCd-=dt; P.stun-=dt; P.inv-=dt;
  if(moving&&!dashing) headBob+=dt*(P.spd()>300?14:9); else headBob*=.9;
  // player vs physics props
  for(const p of props){ if(p.dead||!p.phys) continue;
    const d=dist(p,P), rr=p.r+P.r;
    if(d<rr){ const nx=(p.x-P.x)/(d||1), ny=(p.y-P.y)/(d||1);
      p.x+=nx*(rr-d); p.y+=ny*(rr-d);
      const push=dashing?520:130;
      p.vx+=nx*push; p.vy+=ny*push;
      if(dashing) hitProp(p,22,P.x,P.y,.4); } }
  // physics props
  for(const p of props){ if(p.dead||!p.phys) continue;
    const sp=Math.hypot(p.vx,p.vy);
    if(sp>4){ p.spd=()=>Math.hypot(p.vx,p.vy);
      moveCircle(p,dt); p.vx*=p.slide; p.vy*=p.slide;
      if(sp>170){ for(const q of props){ if(q===p||q.dead) continue;
        const rr=(q.r||Math.min(q.w,q.h)/2)+p.r;
        if(dist(p,q)<rr){ hitProp(q,sp*.09,p.x,p.y,.6); hitProp(p,sp*.05,q.x,q.y,0); p.vx*=-.5; p.vy*=-.5;
          if(Math.random()<.6){ combo=Math.min(9,combo+.25); comboT=3; addPop(q.x,q.y,'CHAIN!','#8affc1',14,54); } break; } } }
      p.wob=Math.min(1,sp/300); }
  }
  for(const n of npcs) updateNPC(n,dt);
  updateJanitor(dt);
  // projectiles: scalpels + pizzas
  for(let i=projs.length-1;i>=0;i--){ const s=projs[i]; s.t+=dt; s.x+=s.vx*dt; s.y+=s.vy*dt;
    s.mesh.position.set(s.x, s.pizza?58-(s.t/s.life)*26:56, s.y);
    s.mesh.rotation.y-=dt*(s.pizza?9:14);
    let dead=s.t>s.life;
    for(const r of walls){ if(s.x>r.x&&s.x<r.x+r.w&&s.y>r.y&&s.y<r.y+r.h){ dead=true;
      if(s.pizza){ stain(s.x,s.y,'#b0452a',26); sfxSplash(); } else sfxClang(); break; } }
    if(!dead&&dist(s,P)<P.r+(s.pizza?10:6)&&P.inv<=0){
      if(s.pizza){ P.stun=.55; P.inv=.8; combo=Math.max(1,combo-2); comboT=0; updateHUD();
        stain(P.x,P.y,'#b0452a',30); sfxSplash();
        addPop(P.x,P.y,"PIZZA'D! mandatory fun",'#ffb52e',15,80); }
      else { hurtPlayer(); addPop(P.x,P.y,"SCALPEL'D! combo lost",'#ff8888',15,80); }
      dead=true; }
    if(dead){ dyn.remove(s.mesh);
      s.mesh.traverse(o=>{ if(o.isMesh) o.geometry.dispose(); }); projs.splice(i,1); } }
  // combo decay
  comboT-=dt; if(comboT<=0&&combo>1){ combo=Math.max(1,combo-dt*2); updateHUD(); }
  shake=Math.max(0,shake-dt*40);
  // ambience
  beepTimer-=dt;
  if(beepTimer<=0){ beepTimer=1.4; if(props.some(p=>p.t==='monitor'&&!p.dead)) sfxBeep(880,.06,.028); }
  // janitor proximity fx
  const jd=dist(janitor,P);
  const near=clamp(1-jd/520,0,1);
  vigEl.style.opacity=near*.9;
  radarFill.style.width=(near*100)+'%';
  radarTxt.textContent= jd>800?'signal lost': jd>520?'he is walking': jd>300?'he sees you': jd>160?'RUN.':'—';
  const bearing=Math.atan2(janitor.y-P.y,janitor.x-P.x)-P.ang;
  radarArrow.style.transform='rotate('+bearing+'rad)';
  radarArrow.style.opacity=jd>800?.25:1;
  heartTimer-=dt;
  if(near>.25&&heartTimer<=0){ heartTimer=clamp(1.1-near,.28,1.1); sfxHeart(near*.55); }
  const rl=roomLights[roomOf(P)];
  for(const L of roomLights) L.intensity=.5;
  if(near>.35) rl.intensity=.5-(near-.35)*rand(.2,.55);
  // absurd hospital events
  evT-=dt;
  if(evT<=0){ evT=rand(26,42); triggerEvent(); }
  if(timeoutT>0) timeoutT-=dt;
  if(blackoutT>0){
    blackoutT-=dt;
    const M=janitor.mesh.userData;
    if(blackoutT>0){
      hemiL.intensity=.03; dirL.intensity=0; ceilMat.color.setScalar(.09);
      for(const L of roomLights) L.intensity=0;
      for(const s of spots) s.intensity=0;
      vigEl.style.opacity=1;
      M.eyeL.material=eyeGlow; M.eyeR.material=eyeGlow;
    } else {
      hemiL.intensity=.3; dirL.intensity=.18; ceilMat.color.setScalar(1);
      for(const s of spots) s.intensity=1.05;
      M.eyeL.material=bmat('#0a0c0d'); M.eyeR.material=bmat('#0a0c0d');
    }
  }
}

function updateNPC(n,dt){
  if(timeoutT>0){ n.lineT-=dt; return; }
  n.lineT-=dt; n.bump-=dt; n.say-=dt; n.moveT-=dt; n.bob+=dt;
  if(Math.hypot(n.knock.x,n.knock.y)>4){ n.vx=n.knock.x; n.vy=n.knock.y; moveCircle(n,dt); }
  n.knock.x*=.85; n.knock.y*=.85;
  const pd=dist(n,player);
  if(n.kind==='circ'){
    if(n.say<=0&&n.lineT<=0&&pd<420){ say(n,pick(CIRC_IDLE)); n.say=rand(5,9); }
    if(n.moveT<=0){ n.moveT=rand(7,14);
      if(Math.random()<.4){ n.tx=clamp(n.x+rand(-140,140),60,W-60); n.ty=clamp(n.y+rand(-140,140),60,H-60); } }
    const d=Math.hypot(n.tx-n.x,n.ty-n.y);
    if(d>6){ n.vx=(n.tx-n.x)/d*26; n.vy=(n.ty-n.y)/d*26; moveCircle(n,dt); n.ang=Math.atan2(n.vy,n.vx); }
    else { n.vx=0; n.vy=0; if(pd<260) n.ang=Math.atan2(player.y-n.y,player.x-n.x); }
  } else if(n.kind==='gas'){
    if(n.say<=0&&n.lineT<=0&&pd<380){ say(n,pick(GAS_IDLE)); n.say=rand(6,11); }
  } else if(n.kind==='admin'){
    if(n.say<=0&&n.lineT<=0){ say(n,pick(ADMIN_IDLE)); n.say=rand(6,10); }
    const d=Math.hypot(n.tx-n.x,n.ty-n.y);
    if(d<12||n.moveT<=0){ n.moveT=rand(5,9);
      n.tx=rand(90,W-90); n.ty=rand(90,H-90); }
    n.vx=(n.tx-n.x)/(d||1)*95; n.vy=(n.ty-n.y)/(d||1)*95; moveCircle(n,dt);
    n.ang=(pd<320)?Math.atan2(player.y-n.y,player.x-n.x):Math.atan2(n.vy,n.vx);
    n.throwT-=dt;
    if(n.throwT<=0&&pd<620){ n.throwT=rand(4.5,8);
      const a=Math.atan2(player.y-n.y,player.x-n.x)+rand(-.08,.08);
      projs.push(mkPizza(n.x,n.y,a));
      say(n,pick(["PIZZA PARTY!","MANDATORY FUN!","IN LIEU OF RAISES!"])); sfxThud(); }
    n.feeT-=dt;
    if(pd<150&&n.feeT<=0&&score>0){ n.feeT=1.3;
      const fee=Math.min(score,pick([120,180,260,420]));
      score-=fee; updateHUD(); sfxFee();
      addPop(player.x,player.y,'-$'+fee+' ('+pick(FEES)+')','#ff6a5a',15,84);
      if(n.lineT<=0) say(n,pick(ADMIN_FEE)); }
  } else {
    if(n.say<=0&&n.lineT<=0){ say(n,pick(SURG_IDLE)); n.say=rand(4,8); }
    const d=Math.hypot(n.tx-n.x,n.ty-n.y);
    if(d<10||n.moveT<=0){ n.moveT=rand(3,6);
      const ri=roomOf(n);
      const rx=ri%2? W/2+40 : WALL+40, ry=ri>1? H/2+40 : WALL+40;
      n.tx=rand(rx+30,rx+W/2-160); n.ty=rand(ry+30,ry+H/2-160); }
    n.vx=(n.tx-n.x)/(d||1)*150; n.vy=(n.ty-n.y)/(d||1)*150; moveCircle(n,dt);
    n.ang=Math.atan2(n.vy,n.vx);
    n.throwT-=dt;
    if(n.throwT<=0&&pd<560){ n.throwT=rand(3.5,6.5);
      const a=Math.atan2(player.y-n.y,player.x-n.x)+rand(-.1,.1);
      projs.push(mkScalpel(n.x,n.y,a,400)); say(n,pick(["TAKE THIS!","INSTRUMENT!","CATCH!!"])); sfxZap(); }
  }
  const rr=n.r+player.r, d2=dist(n,player);
  if(d2<rr){ const nx=(player.x-n.x)/(d2||1), ny=(player.y-n.y)/(d2||1);
    player.x+=nx*(rr-d2); player.y+=ny*(rr-d2);
    if(n.bump<=0&&Math.random()<.7) npcBumped(n,false); }
  // mesh sync
  n.mesh.position.set(n.x,0,n.y);
  n.mesh.rotation.y=-n.ang;
  if(n.kind==='surg') n.mesh.position.y=Math.abs(Math.sin(n.bob*10))*2;
  // limb animation (two-segment rig: forward stride = rotation about z)
  const M=n.mesh.userData;
  if(M.legL){
    const sp2=Math.hypot(n.vx||0,n.vy||0);
    n.walk=(n.walk||0)+dt*sp2*.062;
    const amp=Math.min(.55,sp2*.02);
    const th=Math.sin(n.walk);
    if(!M.seated){
      M.legL.up.rotation.z=th*amp; M.legR.up.rotation.z=-th*amp;
      M.legL.lo.rotation.z=-Math.max(0,-Math.sin(n.walk+.7))*amp*1.25;
      M.legR.lo.rotation.z=-Math.max(0,Math.sin(n.walk+.7))*amp*1.25;
    }
    if(!M.akimbo){
      const yell=n.kind==='surg'&&n.lineT>0;
      if(!M.pinL){ M.armL.up.rotation.z=-th*amp*.7+(yell?-1.1:0); M.armL.lo.rotation.z=.3+(yell?-.5:0); }
      M.armR.up.rotation.z=th*amp*.7+(yell?-1.3:0);
      M.armR.lo.rotation.z=.3+(yell?-.6:0);
    }
    if(M.torso) M.torso.scale.y=1+Math.sin(n.bob*1.7)*.014;
    n.blinkT=(n.blinkT===undefined?rand(1,4):n.blinkT-dt);
    if(n.blinkT<=0) n.blinkT=rand(2,5);
    const bl=n.blinkT<.1?.12:1;
    if(M.eyeL){ M.eyeL.scale.y=bl; M.eyeR.scale.y=bl; }
    if(M.head){ let rel=Math.atan2(player.y-n.y,player.x-n.x)-n.ang;
      while(rel>Math.PI)rel-=Math.PI*2; while(rel<-Math.PI)rel+=Math.PI*2;
      const tgt=pd<340?-clamp(rel,-.85,.85):0;
      M.head.rotation.y+=(tgt-M.head.rotation.y)*Math.min(1,dt*6); }
  }
}

function updateJanitor(dt){
  const J=janitor; J.bob+=dt; J.lineT-=dt;
  const spd=J.speed + Math.min(150, score/700) + (blackoutT>0?60:0);
  const d=dist(J,player)||1;
  J.vx=(player.x-J.x)/d*spd; J.vy=(player.y-J.y)/d*spd;
  moveCircle(J,dt);
  const fang=Math.atan2(player.y-J.y,player.x-J.x);
  J.mesh.position.set(J.x,0,J.y);
  J.mesh.rotation.y=-fang;
  J.mesh.rotation.z=Math.sin(J.bob*2.2)*.04;
  const M=J.mesh.userData;
  if(M.legL){
    J.walk=(J.walk||0)+dt*spd*.05;
    const amp=Math.min(.5,.1+spd*.0022);
    const th=Math.sin(J.walk);
    M.legL.up.rotation.z=th*amp; M.legR.up.rotation.z=-th*amp;
    M.legL.lo.rotation.z=-Math.max(0,-Math.sin(J.walk+.7))*amp;
    M.legR.lo.rotation.z=-Math.max(0,Math.sin(J.walk+.7))*amp;
    M.armL.up.rotation.z=th*amp*.35;
    M.armR.up.rotation.z=-.15+th*.05;
    if(M.torso) M.torso.scale.y=1+Math.sin(J.bob*.9)*.01;
    if(M.head) M.head.rotation.z=Math.sin(J.bob*.7)*.07;
  }
  if(J.lineT<=-rand(6,14)&&d<620) say(J,pick(JAN_LINES));
  if(d<J.r+player.r+4 && state==='play') die();
}

function die(){
  state='dying'; deathT=0; sfxSting();
  vigEl.style.opacity=1;
  if(locked) document.exitPointerLock();
}
function finishDeath(){
  state='dead';
  document.getElementById('deathScore').textContent='$'+score.toLocaleString('en-US')+' in damages · '+Math.round(broken/total*100)+'% turnover';
  document.getElementById('deathLine').textContent='"'+pick(["all messes end the same way.","you were the mess.","spotless, now.","i mopped where you stood."])+'" — the janitor';
  document.getElementById('deathOv').style.display='flex';
  lbOnDeath();
}

/* ============================== leaderboard ============================== */
const LB_KEY='turnover3d.name';
const lbNameEl=document.getElementById('lbName'), lbSubmitEl=document.getElementById('lbSubmit');
const lbStatusEl=document.getElementById('lbStatus'), lbListEl=document.getElementById('lbList');
let lbPosted=false;

function lbRender(scores, mine){
  lbListEl.innerHTML='';
  if(!scores||!scores.length) return;
  scores.forEach((s,i)=>{
    const li=document.createElement('li');
    if(mine && s.name===mine) li.className='me';
    const rk=document.createElement('span'); rk.className='rk'; rk.textContent=(i+1)+'.';
    const nm=document.createElement('span'); nm.className='nm'; nm.textContent=s.name;
    const sc=document.createElement('span'); sc.className='sc'; sc.textContent='$'+Number(s.score).toLocaleString('en-US');
    li.append(rk,nm,sc); lbListEl.appendChild(li);
  });
}

async function lbLoad(){
  try{
    const r=await fetch('/api/leaderboard?t='+Date.now(),{cache:'no-store'});
    if(!r.ok) throw 0;
    const d=await r.json();
    lbRender(d.scores, lbNameEl.value.trim().toUpperCase());
    return d.scores||[];
  }catch(e){ lbStatusEl.textContent='leaderboard offline'; return null; }
}

async function lbPost(){
  const name=lbNameEl.value.trim().toUpperCase();
  if(!name){ lbStatusEl.textContent='enter a name first'; lbNameEl.focus(); return; }
  lbSubmitEl.disabled=true; lbStatusEl.textContent='posting…';
  try{
    const r=await fetch('/api/leaderboard',{method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({name,score})});
    if(!r.ok) throw 0;
    const d=await r.json();
    try{ localStorage.setItem(LB_KEY,name); }catch(e){}
    lbPosted=true;
    lbStatusEl.textContent='posted · top 10';
    lbRender(d.scores, name);
    // The write can land a beat before it is readable; re-read if we're not in the list yet.
    if(!(d.scores||[]).some(s=>s.name===name)) setTimeout(lbLoad,1200);
  }catch(e){
    lbStatusEl.textContent='could not post — try again';
    lbSubmitEl.disabled=false;
  }
}

function lbOnDeath(){
  lbPosted=false; lbSubmitEl.disabled=false; lbStatusEl.textContent='';
  try{ lbNameEl.value=localStorage.getItem(LB_KEY)||''; }catch(e){}
  lbLoad();
}

lbSubmitEl.addEventListener('click',lbPost);
lbNameEl.addEventListener('keydown',e=>{
  e.stopPropagation(); // the game listens for R/P/space globally
  if(e.key==='Enter'&&!lbPosted) lbPost();
});
function restart(){ document.getElementById('deathOv').style.display='none';
  vigEl.style.opacity=0; init(); state='play'; tryLock(); }

/* ============================== per-frame visuals ============================== */
function syncVisuals(dt){
  // camera first, so every projected label uses this frame's view
  if(state==='play'||state==='title'){
    const bobY=Math.sin(headBob)*2.2;
    const sx=shake>0?rand(-shake,shake)*.35:0, sy2=shake>0?rand(-shake,shake)*.25:0;
    camera.position.set(player.x+sx, 66+bobY+sy2, player.y+(shake>0?rand(-shake,shake)*.35:0));
    camera.rotation.set(camPitch,camYaw,shake>0?rand(-1,1)*.004*shake:0);
  } else if(state==='dying'){
    camera.position.set(player.x,66,player.y);
    camera.lookAt(janitor.x,58,janitor.y);
  }
  camera.updateMatrixWorld();
  camera.matrixWorldInverse.copy(camera.matrixWorld).invert();
  // wobble + physics prop mesh positions
  for(const p of props){
    if(p.dead){ continue; }
    if(p.phys){ p.mesh.position.set(p.x,0,p.y);
      const sp=Math.hypot(p.vx,p.vy);
      p.mesh.rotation.z=clamp(sp/600,0,.5)*Math.sin(perf*30+p.seed); }
    if(p.wob>0){ p.mesh.rotation.y=(p.rot||0)+Math.sin(perf*40+p.seed)*.08*p.wob;
      p.wob=Math.max(0,p.wob-.05); if(p.wob===0) p.mesh.rotation.y=p.rot||0; }
  }
  // live vitals traces (shared texture, ~25fps)
  if(perf-(syncVisuals.lastMon||0)>.04){ drawMonitors(perf); syncVisuals.lastMon=perf; }
  // dust motes drifting in the surgical light
  for(const d of dusts){ d.x+=d.vx*dt; d.h+=d.vh*dt; d.z+=d.vz*dt;
    if(Math.abs(d.x-d.cx)>240) d.vx*=-1;
    if(d.h<8||d.h>112) d.vh*=-1;
    if(Math.abs(d.z-380)>200) d.vz*=-1;
    d.m.position.set(d.x,d.h,d.z); }
  // particles
  for(const q of partPool){ if(!q.on) continue;
    q.t+=dt; if(q.t>q.life||q.h<1){ q.on=false; q.mesh.visible=false; continue; }
    q.vh-=(q.grav||700)*dt; q.x+=q.vx*dt; q.z+=q.vz*dt; q.h+=q.vh*dt;
    q.mesh.position.set(q.x,Math.max(q.h,1),q.z);
    q.mesh.rotation.x+=dt*6; q.mesh.rotation.y+=dt*5; }
  // popups
  for(let i=pops.length-1;i>=0;i--){ const q=pops[i]; q.t+=dt; q.h+=30*dt;
    q.el.style.opacity=String(1-q.t/q.ttl);
    projectTo(q.el,q.x,q.h,q.z,true);
    if(q.t>q.ttl){ q.el.remove(); pops.splice(i,1); } }
  // bubbles
  for(const n of npcs){
    const el=bubbleFor(n, n.kind==='surg'?'angry':'');
    if(n.lineT>0){ el.textContent=(n.kind==='circ'||n.kind==='admin'? n.name+': ':'')+n.line;
      projectTo(el,n.x,94,n.y,true); }
    else el.style.display='none';
  }
  { const el=bubbleFor(janitor,'dark');
    if(janitor.lineT>0){ el.textContent=janitor.line; projectTo(el,janitor.x,82,janitor.y,true); }
    else el.style.display='none'; }
  // crosshair hint
  crossDot.style.opacity=aimTarget()?1:0;
  // mallet swing pose
  if(player){
    const sw=player.swing>0? Math.sin((0.26-player.swing)/0.26*Math.PI) : 0;
    mallet.rotation.x=0.6-sw*1.9;
    mallet.position.z=-13-sw*6;
    mallet.position.y=-11+Math.sin(headBob)*0.8;
  }
}

/* ============================== loop ============================== */
let last=0, perf=0;
function frame(ts){
  requestAnimationFrame(frame);
  const dt=Math.min(.033,(ts-last)/1000||0); last=ts; perf=ts/1000;
  if(state==='play'&&!paused) update(dt);
  if(state==='dying'){
    deathT+=dt;
    const J=janitor, d=dist(J,player);
    if(d>26){ J.x+=(player.x-J.x)/d*300*dt; J.y+=(player.y-J.y)/d*300*dt; }
    J.mesh.position.set(J.x,0,J.y);
    J.mesh.rotation.y=-Math.atan2(player.y-J.y,player.x-J.x);
    if(deathT>0.85) finishDeath();
  }
  syncVisuals(dt);
  renderer.render(scene,camera);
}
requestAnimationFrame(frame);

document.getElementById('startBtn').addEventListener('click',()=>{
  audioInit(); if(AC&&AC.resume) AC.resume();
  document.getElementById('titleOv').style.display='none';
  init(); state='play'; tryLock();
});
document.getElementById('againBtn').addEventListener('click',restart);
init(); // world visible behind the title screen
