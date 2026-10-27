/* ============================================================================
   5.6 电磁能量如何传播 —— 页面专属（二）：讲解卡 / 面板装配 / 数据条 / 主循环 / 交互
   ============================================================================ */
const CARDS=[
  {k:'1',tab:'1. 坡印廷矢量：能流密度',cls:'c1',body:
    '电场和磁场各自储存能量，能量密度（PPT 第 51 页）：'+
    '<div class="frm">w = ½(εE² + μH²)　　@{S} = @{E}×@{H}</div>'+
    '<ul><li>@{S} 的大小 = 单位时间穿过单位面积的电磁能量；方向 = 能量流动的方向</li>'+
    '<li>平面波里 @{S} 恒沿传播方向（+x）—— 能量跟着相位一起走</li>'+
    '<li>同一位置 @{S}(t) 随相位起伏（∝cos²），取时间平均得 S_avg</li></ul>'+
    '<div class="ex-note">⟶ 看橙色箭头：左面（流入）永远比右面（流出）长 —— 差额就是 V 里发生的事。</div>'},
  {k:'2',tab:'2. 坡印廷定理：能量收支',cls:'c2',body:
    '对任意体积 V，电磁能量严格守恒（PPT 第 53–56 页）：'+
    '<div class="frm">−∂W/∂t = ∫ σE² dV + ∮ @{S}·d@{A}</div>'+
    '<div class="frm">本页写法：S_in − S_out = dW/dt + P_loss</div>'+
    '<ul><li><b>流入 − 流出</b> = <b>储能的涨落</b> + <b>损耗层的消耗</b>，逐秒平衡（左下能量条）</li>'+
    '<li>右上信息卡的"收支残差"是损耗层低耗近似（α≈σ/2）的网格误差，如实显示（σ 越大越明显）</li>'+
    '<li>把 σ 拖到 0：损耗归零、进出相等，储能条独自起伏（净收支一个周期归零）</li></ul>'+
    '<div class="ex-note">🔑 严格坡印廷定理见 PPT 第 53–56 页；本页用低耗近似场演示收支平衡，残差量级 ~tan²δ。</div>'},
  {k:'3',tab:'3. 能量在"场"里走',cls:'c3',body:
    '最容易误解的一点：电路里能量<b>不是</b>沿导线内部的电流跑，而是在<b>空间电磁场</b>中传播：'+
    '<div class="frm">导线的作用 = 引导 @{E}、@{H} 的分布 ⇒ 引导 @{S} 的流向</div>'+
    '<ul><li>载流子漂移极慢（~10⁻⁴ m/s），能量却以光速沿场传递</li>'+
    '<li>5.2 的位移电流、5.1 的感应电场、本页的能流 —— 合起来就是"场是能量的载体"</li>'+
    '<li>主仿真 5.8 里那条橙色 @{S} 箭头列，就是这股能流的"快递单"</li></ul>'+
    '<div class="ex-note">⭐ 思考题：若 V 内无耗（σ=0），一个周期里流入 V 的净能量是多少？（答案：零 —— 拖 t 看储能条正负抵消）</div>'},
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
  const b=energyBooks(state.t);
  let html='';
  html += kchip('S_in =', b.Sin.toFixed(3),'warn');
  html += kchip('S_out =', b.Sout.toFixed(3));
  html += kchip('dW/dt =', dWdt(state.t).toFixed(3),'acc');
  html += kchip('P_loss =', b.Ploss.toFixed(3),'warn');
  html += kchip('残差 =', poyntingResidual(state.t).toFixed(4));
  lgT.textContent='坡印廷定理：流入−流出=储能变化+损耗';
  lgN.innerHTML=richHTML('@{S}=@{E}×@{H} · 能量在场里传播，不在导线里');
  strip.innerHTML=html;
  placeLegend();
}
function updateModeTag(){
  const t=document.getElementById('modeTag'); if(!t) return;
  const sb=document.getElementById('moduleSub');
  t.innerHTML=richHTML('坡印廷矢量 · σ = '+state.sigma.toFixed(1)+' · 残差 <b>'+poyntingResidual(state.t).toFixed(4)+'</b>');
  if(sb) sb.innerHTML=richHTML('坡印廷矢量与坡印廷定理');
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
document.getElementById('btnViewReset').onclick=()=>{ cam.az=CAM0.az; cam.el=CAM0.el; cam.zoom=1.05; cam.px=0; cam.py=0; needsRender=true; };
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
  if(save){ try{ localStorage.setItem('em56-panel-w', String(w)); }catch(e){} }
  return w;
}
(()=>{ let v=0; try{ v=parseInt(localStorage.getItem('em56-panel-w')||'0',10)||0; }catch(e){}
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
