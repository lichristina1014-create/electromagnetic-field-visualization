/* ============================================================================
   5.1 变化的磁场激发电场 —— 页面专属（二）：讲解卡 / 面板装配 / 数据条 / 主循环 / 交互
   ============================================================================ */
const CARDS=[
  {k:'1',tab:'1. 磁通一变，就有电动势',cls:'c1',body:
    '穿过导体环的磁通 Φ 一变，环里就出现感应电动势（法拉第电磁感应定律）：'+
    '<div class="frm">ℰ = −dΦ/dt　　Φ = ∫ @{B}·d@{S}</div>'+
    '<ul><li>这里的磁场变化是"感生"情形：<b>环不动、磁场自己在变</b>（PPT 5.1 第 5 页的分类①）</li>'+
    '<li>环电流 I = ℰ/R —— 载流子的快慢和方向都跟着 ℰ 走</li>'+
    '<li>负号 = <b>楞次定律</b>：感应电流激发的磁场总是阻碍原磁通的变化</li></ul>'+
    '<div class="ex-note">⟶ 把 f 调大：B 变得快 ⇒ ℰ 和 I 同步变大（∝ dB/dt，不是 ∝ B）。</div>'},
  {k:'2',tab:'2. 感应电场：非保守场',cls:'c2',body:
    '电动势的背后是一种真实存在的电场——<b>感应电场 @{E}_i</b>：'+
    '<div class="frm">∮ @{E}_i·d@{l} = −dΦ/dt ≠ 0　　∇×@{E}_i = −∂@{B}/∂t</div>'+
    '<ul><li>它的场线是<b>闭合涡旋</b>（红环），没有起点终点 —— 和静电场的"从 + 到 −"完全不同</li>'+
    '<li>绕闭合环一圈电场力做功 <b>≠ 0</b>（这就是电动势）⇒ <b>非保守场</b>，没有电位概念</li>'+
    '<li>对照 3.2：驻立电荷的库仑场 ∮@{E}·d@{l} = 0 —— <b>保守与非保守的分水岭就在这一页</b></li>'+
    '<li>@{E}_i 不附着于导体：把导体环拿走（关"导体环"层），红环照样在转</li></ul>'+
    '<div class="ex-note">⭐ PPT 第 6 页："感应电场是非保守场"——方框里的关键词就是这里画出来的东西。</div>'},
  {k:'3',tab:'3. 环在磁区内 vs 磁区外',cls:'c3',body:
    '把环半径从 0.05 拖到 0.35，看读数里 ℰ 的变化：'+
    '<div class="frm">r&lt;R：E_i = −(r/2)·dB/dt　　r≥R：E_i = −(R²/2r)·dB/dt</div>'+
    '<ul><li><b>环在磁区内</b>：Φ = B·πr² ⇒ ℰ ∝ r²，越大的环电动势越大</li>'+
    '<li><b>环套住整个磁区后</b>：磁通被磁区截断 ⇒ <b>ℰ 饱和</b>，环再变大 ℰ 不变</li>'+
    '<li>但环上的 E_i 反而按 1/r 变小 —— "电动势"是 E_i 绕环一圈的累计，两者别混</li></ul>'+
    '<div class="ex-note">🔑 关键问句：环外的空间明明没有磁场，为什么会有电场？——变化的磁场在<b>整个空间</b>激发涡旋电场，不限于磁区。</div>'},
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
  html += kchip('B(t) =', Bt(state.t).toFixed(3)+' T','warn');
  html += kchip('dB/dt =', dBdt(state.t).toFixed(2)+' T/s');
  html += kchip('Φ =', (fluxAt(state.rLoop,state.t)*1000).toFixed(2)+' mWb');
  html += kchip('ℰ =', fmtEmf(),'acc');
  html += kchip('I =', (ringI(state.t)*1000).toFixed(1)+' mA');
  html += kchip('r环 vs R =', state.rLoop.toFixed(2)+' vs '+R_B+' m');
  lgT.textContent='∮E_i·dl = −dΦ/dt（非保守场）';
  lgN.innerHTML=richHTML('变化的磁场在整个空间激发涡旋电场；导体环只是"接住"它');
  strip.innerHTML=html;
  placeLegend();
}
function updateModeTag(){
  const t=document.getElementById('modeTag'); if(!t) return;
  const sb=document.getElementById('moduleSub');
  t.innerHTML=richHTML('法拉第电磁感应定律 · ℰ = <b>'+fmtEmf()+'</b> · B₀='+state.B0.toFixed(2)+' T · f='+state.fHz.toFixed(1)+' Hz');
  if(sb) sb.innerHTML=richHTML('感生电动势 · 感应电场 · 楞次定律');
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
      state.flow+=ringI(state.t)*K_FLOW*dt;      /* 载流子角位移 ∝ I（负号=换向） */
      if(state.flow>1e6) state.flow%=(2*Math.PI);
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
  if(save){ try{ localStorage.setItem('em51-panel-w', String(w)); }catch(e){} }
  return w;
}
(()=>{ let v=0; try{ v=parseInt(localStorage.getItem('em51-panel-w')||'0',10)||0; }catch(e){}
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
const CAM0={az:-1.45, el:1.30};

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
