/* ============================================================================
   5.2 变化的电场激发磁场 —— 页面专属（二）：讲解卡 / 面板装配 / 数据条 / 主循环 / 交互
   ============================================================================ */
const CARDS=[
  {k:'1',tab:'1. 矛盾：同一个环，两个答案？',cls:'c1',body:
    '恒定磁场的安培环路定律说 ∮@{H}·d@{l} = 穿过的传导电流。但"穿过"哪个面？'+
    '<div class="frm">环 L_1 配平盘 S_1：导线穿过 ⇒ ∮@{H}·d@{l} = I_c</div>'+
    '<div class="frm">环 L_1 配鼓膜 S_2：从极板间穿过，<b>没有电荷穿过它</b> ⇒ ∮@{H}·d@{l} = 0 ?!</div>'+
    '<ul><li>同一个环、同一个 @{B}，选面不同答案就不同 —— <b>时变场里安培定律自相矛盾</b></li>'+
    '<li>切"曲面选择"按钮：S_1 平盘 ↔ S_2 鼓起，亲眼看这个矛盾</li></ul>'+
    '<div class="ex-note">⚠️ 矛盾出在"恒定"两个字上：充电时极板电荷在变，电流不再连续（PPT 5.2 第 14 页的推导）。</div>'},
  {k:'2',tab:'2. 麦克斯韦的补丁：位移电流',cls:'c2',body:
    '麦克斯韦发现：极板间虽然没有电荷穿过，但 @{E} 在增长 —— 它提供了"穿过 S_2 的电流"：'+
    '<div class="frm">@{J}_d = ∂@{D}/∂t　　I_d = ∫ @{J}_d·d@{S} = ε₀S·dE/dt ≡ I_c</div>'+
    '<ul><li>位移电流 = <b>变化的电场本身</b>，不是电荷的位移、不伴随焦耳热</li>'+
    '<li>补上它之后：两个曲面给出<b>同一个 B</b>（看读数卡 I_c 与 I_d 逐秒相等）</li>'+
    '<li>全电流定律：∮@{H}·d@{l} = I_c + I_d —— 时变场里永远自洽</li></ul>'+
    '<div class="ex-note">🔑 "变化的电场激发磁场"就是这么来的 —— 与 5.1"变化的磁场激发电场"正好对偶。</div>'},
  {k:'3',tab:'3. 传导电流 vs 位移电流',cls:'c3',body:
    '两者都能激发涡旋磁场，但本质完全不同（PPT 第 24 页的对照表）：'+
    '<div class="frm">传导：电荷定向移动 · 有焦耳热 · 导体内<br>位移：电场的变化率 · 无焦耳热 · 真空/介质里都行</div>'+
    '<ul><li>本页数值是真实的：I ~ nA、B ~ pT —— <b>位移电流极微弱</b>，但高频下不可忽略</li>'+
    '<li>没有位移电流，电容器"隔直流"就会成为安培定律的反例</li></ul>'+
    '<div class="ex-note">⟶ 下一页 5.8：变化的 @{E} 激发 @{B}、变化的 @{B} 又激发 @{E} —— 互相激发就传成了电磁波。</div>'},
];
function renderExplain(sec){
  sec.innerHTML='';
  sec.appendChild(h('<div class="sec-title">讲解</div>'));
  const tabs=h('<div class="card-tabs"></div>').firstChild;
  CARDS.forEach(c=>{
    const b=h('<button class="card-tab '+c.cls+(c.k===state.cardTab?' on':'')+'">'+c.tab+'</button>').firstChild;
    b.onclick=()=>{ state.cardTab=c.k; renderPanel(); };
    tabs.appendChild(b);
  });
  sec.appendChild(tabs);
  const cur=CARDS.find(c=>c.k===state.cardTab)||CARDS[0];
  const body=h('<div class="card-body '+cur.cls+'"><div class="ex-title">'+richHTML(cur.tab)+'</div></div>').firstChild;
  body.appendChild(h('<div class="ex-body">'+richHTML(cur.body)+'</div>').firstChild);
  sec.appendChild(body);
}
function renderPanel(){
  ['subSec','sliderSec','explainSec'].forEach(id=>{const el=document.getElementById(id);if(el)el.remove();});
  const mk=id=>{const d=document.createElement('div');d.className='panel-sec';d.id=id;return d;};
  let tog=document.getElementById('toggleSec');
  if(!tog){
    tog=mk('toggleSec');
    tog.appendChild(h('<label class="readout-toggle"><input type="checkbox" id="showReadoutCb"'+(state.showReadout?' checked':'')+'><span>在<b>画布下方</b>显示<b>实时数据</b>条</span></label>'));
    tog.querySelector('#showReadoutCb').onchange=e=>{state.showReadout=e.target.checked;updateReadout();};
    panel.appendChild(tog);
  }else tog.querySelector('#showReadoutCb').checked=state.showReadout;
  const s=mk('subSec'), sl=mk('sliderSec'), ex=mk('explainSec');
  panel.appendChild(s); panel.appendChild(sl); panel.appendChild(ex);
  renderSubSec(s); renderSliders(sl); renderExplain(ex);
  updateReadout(); updateModeTag();
}
function placeLegend(){
  const st=document.getElementById('coordStrip'), lg=document.getElementById('legend');
  if(!st||!lg) return;
  lg.style.bottom=(st.offsetHeight+14)+'px';
}

/* ══════════════════════════ 画布下方实时数据条 ══════════════════════════ */
function updateReadout(){
  const strip=document.getElementById('coordStrip'); if(!strip) return;
  if(!state.showReadout){ strip.innerHTML=''; placeLegend(); return; }
  const lgT=document.getElementById('lgTitle'), lgN=document.getElementById('lgNote');
  let html='';
  html += kchip('E(t) =', (gapE(state.t)/1e3).toFixed(1)+' kV/m','warn');
  html += kchip('I_c =', (conductionI(state.t)*1e9).toFixed(2)+' nA','acc');
  html += kchip('I_d =', (displaceI(state.t)*1e9).toFixed(2)+' nA','acc');
  html += kchip('I_c − I_d =', '0','');
  html += kchip('B(r) =', (bLoop(state.rLoop,state.t)*1e12).toFixed(3)+' pT');
  html += kchip('曲面', state.surf==='S1'?'S_1 平盘':'S_2 鼓膜');
  lgT.textContent='全电流定律：I_c ≡ I_d';
  lgN.innerHTML=richHTML('@{J}_d = ∂@{D}/∂t —— 变化的电场本身就是"电流"，一样激发磁场');
  strip.innerHTML=html;
  placeLegend();
}
function updateModeTag(){
  const t=document.getElementById('modeTag'); if(!t) return;
  const sb=document.getElementById('moduleSub');
  t.innerHTML=richHTML('电容器充电 · I_c = I_d = <b>'+(conductionI(state.t)*1e9).toFixed(2)+' nA</b> · E₀='+state.E0.toFixed(0)+' kV/m');
  if(sb) sb.innerHTML=richHTML('位移电流与全电流定律');
}

/* ══════════════════════════════ 主循环 ══════════════════════════════ */
let needsRender=true;
function draw(){
  setupCamera(); ctx.clearRect(0,0,W,H);
  buildScene();
  prims.sort((a,b)=>a.z-b.z);
  for(const p of prims) p.draw(ctx);
  drawOverlays();
  const tg=document.getElementById('panTag');
  if(tg) tg.classList.toggle('show',Math.abs(cam.px)>2||Math.abs(cam.py)>2);
  needsRender=false;
}
let _lastT=0;
function tick(ts){
  try{
    const dt=_lastT?Math.min(0.05,(ts-_lastT)/1000):0.016; _lastT=ts||0;
    if(state.playing){
      state.t+=dt;
      if(state.t>=periodT()) state.t-=periodT();
      state.flow+=conductionI(state.t)*K_FLOW*dt;
      if(state.flow>1e6) state.flow%=1;
      if(state.flow<0) state.flow+=1;         /* ⚠️ 哈希/取模坑：保持非负 */
      needsRender=true;
    }
    if(state.autoRotate){ cam.az+=0.0045; needsRender=true; }
    if(needsRender) draw();
  }catch(err){ needsRender=false; console.error('draw/tick error:',err); }
  requestAnimationFrame(tick);
}
function updateAll(){ needsRender=true; syncSliders(); updateReadout(); updateModeTag(); }
function playPause(){ state.playing=!state.playing; }

/* ══════════════════════════════ 交互 ══════════════════════════════ */
let drag=null;
function localPos(ev){const r=canvas.getBoundingClientRect();return{x:ev.clientX-r.left,y:ev.clientY-r.top};}
canvas=document.getElementById('cv');
ctx=canvas.getContext('2d');
canvas.addEventListener('pointerdown',ev=>{
  try{ canvas.setPointerCapture(ev.pointerId); }catch(e){}
  const m=localPos(ev);
  drag={x:m.x,y:m.y,btn:ev.button,mode:(ev.button===2||ev.ctrlKey)?'pan':'rot'};
  ev.preventDefault();
});
canvas.addEventListener('pointermove',ev=>{
  const m=localPos(ev);
  if(!drag) return;
  const dx=m.x-drag.x, dy=m.y-drag.y; drag.x=m.x; drag.y=m.y;
  if(drag.mode==='pan'){ cam.px+=dx; cam.py+=dy; needsRender=true; }
  else { cam.az-=dx*0.0075; cam.el=Math.max(-1.45,Math.min(1.45,cam.el+dy*0.0062)); needsRender=true; }
});
canvas.addEventListener('pointerup',()=>{ drag=null; });
canvas.addEventListener('pointercancel',()=>{ drag=null; });
canvas.addEventListener('contextmenu',e=>e.preventDefault());
canvas.addEventListener('wheel',e=>{e.preventDefault();cam.zoom=Math.max(.45,Math.min(3.2,cam.zoom*(e.deltaY<0?1.09:1/1.09)));needsRender=true;},{passive:false});
document.getElementById('btnViewReset').onclick=()=>{ cam.az=CAM0.az; cam.el=CAM0.el; cam.zoom=1.1; cam.px=0; cam.py=0; needsRender=true; };
document.getElementById('btnRotate').onclick=e=>{state.autoRotate=!state.autoRotate;e.target.classList.toggle('on',state.autoRotate);};
document.getElementById('btnPanReset').onclick=()=>{cam.px=0;cam.py=0;needsRender=true;};
function bindFold(bid,cls){document.getElementById(bid).onclick=()=>{document.body.classList.toggle(cls);setTimeout(resize,60);setTimeout(resize,260);};}
bindFold('foldNav','nav-off'); bindFold('foldPanel','panel-off');
document.getElementById('tglNav').onclick=()=>{document.body.classList.toggle('nav-off');setTimeout(resize,260);};
document.getElementById('tglPanel').onclick=()=>{document.body.classList.toggle('panel-off');setTimeout(resize,260);};
window.addEventListener('keydown',e=>{if(e.target.tagName==='INPUT')return;
  if(e.key==='['){document.body.classList.toggle('nav-off');setTimeout(resize,260);}
  if(e.key===']'){document.body.classList.toggle('panel-off');setTimeout(resize,260);}});

/* ══════════ 面板拖宽 ══════════ */
const PANEL_W0=398, PANEL_WMIN=260;
const panelEl=document.getElementById('panel'), panelRz=document.getElementById('panelResizer');
function panelMaxW(){
  const navW=document.body.classList.contains('nav-off')?0:236;
  return Math.max(PANEL_WMIN+60, Math.min(760, window.innerWidth-navW-330));
}
function setPanelW(px,save){
  const w=Math.max(PANEL_WMIN, Math.min(panelMaxW(), Math.round(px)));
  document.documentElement.style.setProperty('--panel-w', w+'px');
  if(save){ try{ localStorage.setItem('em52-panel-w', String(w)); }catch(e){} }
  return w;
}
(()=>{ let v=0; try{ v=parseInt(localStorage.getItem('em52-panel-w')||'0',10)||0; }catch(e){}
      if(v>=PANEL_WMIN) setPanelW(v,false); })();
let _rz=null;
function rzEnd(){
  if(_rz) setPanelW(panelEl.getBoundingClientRect().width,true);
  _rz=null; document.body.classList.remove('resizing'); panelRz.classList.remove('dragging');
}
panelRz.addEventListener('pointerdown',ev=>{
  if(document.body.classList.contains('panel-off')) return;
  try{ panelRz.setPointerCapture(ev.pointerId); }catch(e){}
  _rz={x:ev.clientX, w:panelEl.getBoundingClientRect().width};
  document.body.classList.add('resizing'); panelRz.classList.add('dragging');
  ev.preventDefault();
});
panelRz.addEventListener('pointermove',ev=>{ if(!_rz) return; setPanelW(_rz.w-(ev.clientX-_rz.x), false); });
panelRz.addEventListener('pointerup',rzEnd);
panelRz.addEventListener('pointercancel',rzEnd);
panelRz.addEventListener('dblclick',()=>setPanelW(PANEL_W0,true));
window.addEventListener('resize',()=>{ const cur=panelEl.getBoundingClientRect().width;
  if(cur>panelMaxW()) setPanelW(cur,true); });

/* ══════════════════════════════ 相机与启动 ══════════════════════════════ */
const CAM0={az:-0.9, el:0.5};

function resize(){
  const r=canvas.getBoundingClientRect();
  const nw=Math.max(60,Math.round(r.width)),nh=Math.max(60,Math.round(r.height));
  DPR=Math.min(2,window.devicePixelRatio||1);
  if(nw===W&&nh===H&&canvas.width===Math.round(nw*DPR))return;
  W=nw;H=nh;canvas.width=Math.round(W*DPR);canvas.height=Math.round(H*DPR);
  ctx.setTransform(DPR,0,0,DPR,0,0); needsRender=true;
  placeLegend();
}
new ResizeObserver(()=>resize()).observe(canvas);

const nav=document.getElementById('nav');
NAV.forEach(g=>{nav.appendChild(h('<div class="nav-ch">'+g.ch+'</div>'));
  g.items.forEach(it=>{const cls='nav-item'+(it.active?' active':'')+(it.ready?'':' soon');
    nav.appendChild(h('<a class="'+cls+'" '+(it.href?'href="'+it.href+'"':'')+'><span class="dot"></span>'+it.t+'</a>'));});});

cam.az=CAM0.az; cam.el=CAM0.el; cam.zoom=1.1;
resize();
renderPanel();
updateAll();
tick(0);
