/* ============================================================================
   5.8 电磁波传播实验室 —— 页面专属（二）：讲解卡 / 面板装配 / 数据条 / 主循环 / 交互
   ⚠️ 所有进 DOM 的串都必须过 richHTML()（只认 @{...} 与 _x，**不认 Markdown 星号**）。
   ============================================================================ */
const CARDS=[
  {k:'1',tab:'1. 三个方向，两两垂直',cls:'c1',body:
    '均匀平面电磁波里：<b>@{E} 沿 y（红）、@{H} 沿 z（蓝）、传播沿 x（绿）</b>，三者两两垂直。'+
    '<div class="frm">@{S} = @{E}×@{H}　⇒　能流方向 = 传播方向（+x）</div>'+
    '<ul><li>@{E} 与 @{H} 的量值由<b>波阻抗</b>联系：E/H = η = √(μ/ε)（无耗时）</li>'+
    '<li>ε_r 越大 ⇒ η 越小 ⇒ 同样的 E，H 越强（蓝箭头更长）</li>'+
    '<li>左下角的三脚架就是给"谁沿哪个方向"备的参照</li></ul>'+
    '<div class="ex-note">⟶ 关掉"波形曲线"只看箭头列：红蓝箭头各自在自己的方向上生长。</div>'},
  {k:'2',tab:'2. 振荡 ≠ 跑动',cls:'c2',body:
    '最容易误解的一点：<b>电场箭头并没有沿 x 方向"跑"</b>。'+
    '<div class="frm">E_y(x,t) = E₀·e^(−αx)·cos(ωt − kx)</div>'+
    '<ul><li>固定一个位置 x：箭头只在自己的 y / z 方向<b>原地振荡</b>（拖 t 滑块慢慢看）</li>'+
    '<li>固定一个相位（紫色<b>相位点</b>，如某个波峰）：它随时间向 +x 匀速前进 —— 前进的是<b>相位</b></li>'+
    '<li>跟着相位一起前进的还有<b>能量</b>：橙色 @{S} 箭头始终指向 +x</li></ul>'+
    '<div class="ex-note">🔑 "波"= 相位与能量的传递；介质中的电荷只在原地附近振动，没有宏观迁移。</div>'},
  {k:'3',tab:'3. 介质改变了什么',cls:'c3',body:
    '换 ε_r 和"无耗 / 有耗"，盯住数据条的四个读数：'+
    '<div class="frm">v = 1/√(με)　λ = v/f　η = √(μ/ε)　S_avg = E₀²/(2|η|)·cosφ_η</div>'+
    '<ul><li>ε_r ↑ ⇒ v ↓、λ ↓（波列变密）、η ↓ —— 同一介质里 f ↑ 则 λ ↓</li>'+
    '<li><b>有耗介质</b>（tanδ=0.3）：振幅按 e^(−αx) 沿程衰减，@{E} 超前 @{H} 一个相位 φ_η = ½·atan(tanδ) ≈ 13.3°</li>'+
    '<li>有耗时平均能流还要多乘一个 cosφ_η，并沿 x 按 e^(−2αx) 衰减 —— 能量被介质吃掉了</li></ul>'+
    '<div class="ex-note">⟶ 切到"有耗介质"再拖 t：看红蓝箭头列末端一起变短、且峰值位置错开。</div>'},
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
/* ⚠️ 图例（.cv-legend）absolute + bottom:14，而 .canvas-card 里还有一条数据条（.coord-strip）
   也贴在底部 ⇒ 图例默认会压在数据条上。修法：bottom = 数据条高度 + 14。 */
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
  const p=waveParams();
  let html='';
  html += kchip('f =', FREQS[state.freqIdx]+' MHz','warn');
  html += kchip('v =', fmtV());
  html += kchip('λ =', p.lam.toFixed(2)+' m','acc');
  html += kchip(state.lossy?'|η| =':'η =', p.eta.toFixed(1)+' Ω');
  if(state.lossy){
    html += kchip('α =', p.alpha.toFixed(3)+' Np/m','warn');
    html += kchip('φ_η =', (p.phiEta*57.2958).toFixed(1)+'°','acc');
  }
  html += kchip('S_avg(源面) =', (sAvg(X0)*1000).toFixed(3)+' mW/m²');
  lgT.textContent=state.lossy?'有耗介质：振幅沿程衰减':'无耗介质：E、H、传播方向两两垂直';
  lgN.innerHTML=richHTML(state.lossy
    ? '振幅 e^(−αx) 衰减 · @{E} 超前 @{H} φ_η ≈ 13.3° · 能量被介质吸收'
    : '@{E}（红·y）⊥ @{H}（蓝·z）⊥ 传播（绿·x）· 同相 · @{S}=@{E}×@{H}');
  strip.innerHTML=html;
  placeLegend();
}
function updateModeTag(){
  const t=document.getElementById('modeTag'); if(!t) return;
  const sb=document.getElementById('moduleSub');
  t.innerHTML=richHTML('均匀平面波 · f = <b>'+FREQS[state.freqIdx]+' MHz</b> · ε_r = '+state.epsr+
    ' · '+(state.lossy?'有耗':'无耗')+' · λ = <b>'+waveParams().lam.toFixed(2)+' m</b>');
  if(sb) sb.innerHTML=richHTML('均匀平面波 · 主仿真');
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
/* ⚠️ tick 里的 draw 必须包 try/catch：任何一帧抛异常 ⇒ 渲染循环永久停摆。 */
let _lastT=0;
function tick(ts){
  try{
    const dt=_lastT?Math.min(0.05,(ts-_lastT)/1000):0.016; _lastT=ts||0;
    if(state.playing){
      state.t+=dt;
      if(state.t>=T_D) state.t-=T_D;
      needsRender=true;                       /* 波在动 ⇒ 每帧都要重画 */
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
function resetView(){ cam.az=CAM0.az; cam.el=CAM0.el; cam.zoom=1.05; cam.px=0; cam.py=0; needsRender=true; }
document.getElementById('btnViewReset').onclick=resetView;
document.getElementById('btnRotate').onclick=e=>{state.autoRotate=!state.autoRotate;e.target.classList.toggle('on',state.autoRotate);};
document.getElementById('btnPanReset').onclick=()=>{cam.px=0;cam.py=0;needsRender=true;};
function bindFold(bid,cls){document.getElementById(bid).onclick=()=>{document.body.classList.toggle(cls);setTimeout(resize,60);setTimeout(resize,260);};}
bindFold('foldNav','nav-off'); bindFold('foldPanel','panel-off');
document.getElementById('tglNav').onclick=()=>{document.body.classList.toggle('nav-off');setTimeout(resize,260);};
document.getElementById('tglPanel').onclick=()=>{document.body.classList.toggle('panel-off');setTimeout(resize,260);};
window.addEventListener('keydown',e=>{if(e.target.tagName==='INPUT')return;
  if(e.key==='['){document.body.classList.toggle('nav-off');setTimeout(resize,260);}
  if(e.key===']'){document.body.classList.toggle('panel-off');setTimeout(resize,260);}});

/* ══════════ 右侧面板：拖动抓取条自由调整宽度 ══════════ */
const PANEL_W0=398, PANEL_WMIN=260;
const panelEl=document.getElementById('panel'), panelRz=document.getElementById('panelResizer');
function panelMaxW(){
  const navW=document.body.classList.contains('nav-off')?0:236;
  return Math.max(PANEL_WMIN+60, Math.min(760, window.innerWidth-navW-330));
}
function setPanelW(px,save){
  const w=Math.max(PANEL_WMIN, Math.min(panelMaxW(), Math.round(px)));
  document.documentElement.style.setProperty('--panel-w', w+'px');
  if(save){ try{ localStorage.setItem('em58-panel-w', String(w)); }catch(e){} }
  return w;
}
(()=>{ let v=0; try{ v=parseInt(localStorage.getItem('em58-panel-w')||'0',10)||0; }catch(e){}
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
const CAM0={az:-0.95, el:0.42};

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

cam.az=CAM0.az; cam.el=CAM0.el; cam.zoom=1.05;
resize();
renderPanel();
updateAll();
tick(0);
