/* ============================================================================
   5.4 电磁场遇到介质边界会怎样 —— 页面专属（二）：讲解卡 / 面板装配 / 数据条 / 主循环 / 交互
   ============================================================================ */
const CARDS={
  bc:[
    {k:'1',tab:'1. 小回路压扁：E_t 连续',cls:'c1',body:
      '在分界面上任取一点，做一个<b>跨界面的小矩形回路</b>（PPT 第 40–43 页同款），用 ∮@{E}·d@{l} = −dΦ_B/dt：'+
      '<div class="frm">左端 = (E_1t − E_2t)·l　　右端 = −dB/dt·(l·h)</div>'+
      '<ul><li>右端正比于回路<b>面积</b> l·h —— 拖 h 滑块压扁回路，右端归零</li>'+
      '<li>左端与 h 无关 ⇒ 必然有 <b>E_1t = E_2t</b>（切向电场连续）</li>'+
      '<li>注意 ∇×@{E}=−∂@{B}/∂t ≠ 0 ⇒ <b>回路必须压扁</b>，不能像静电场那样随便取</li></ul>'+
      '<div class="ex-note">⟶ 把 h 从 0.20 拖到 0.02：看读数里"电磁项"随面积归零。</div>'},
    {k:'2',tab:'2. 扁盒穿界面：D_n 跳变',cls:'c2',body:
      '换用高斯定理 ∮@{D}·d@{S} = Q_自由，做一个跨界面<b>扁圆柱盒</b>（高→0）：'+
      '<div class="frm">D_2n − D_1n = σ_s（自由面电荷密度）</div>'+
      '<ul><li>盒子的侧面积随高归零 ⇒ 只有上下底面的 D_n 之差承担自由电荷</li>'+
      '<li>界面上没有自由电荷（σ_s=0）时 <b>D_n 连续</b>（E_n 按 ε 反比跳变）</li>'+
      '<li>拖 σ_s 看 E_2 的法向分量（紫色虚线箭头）随之改变</li></ul>'+
      '<div class="ex-note">🔑 时变场的边界条件与静态场<b>形式相同</b>（∂@{B}/∂t 项随面积消失）——PPT 第 39 页的结论。</div>'},
    {k:'3',tab:'3. 四条衔接条件总览',cls:'c3',body:
      '同样的"压扁/压扁盒"手法用到另外两条麦克斯韦方程上，得到完整的衔接条件：'+
      '<div class="frm">E_1t=E_2t　·　H_1t=H_2t（无面电流时）<br>B_1n=B_2n　·　D_2n−D_1n=σ_s</div>'+
      '<ul><li>切向看环路定理（@{E}、@{H}），法向看高斯定理（@{B}、@{D}）</li>'+
      '<li>有了它们，才能回答下一页的问题：波打到界面上会怎么分成两路</li></ul>'+
      '<div class="ex-note">⟶ 切到 ② 页签：边界条件在"反射与透射"里兑现成可看的射线。</div>'},
  ],
  rt:[
    {k:'1',tab:'1. 反射与透射',cls:'c1',body:
      '平面波斜射到介质界面，一分为二：'+
      '<div class="frm">θ_r = θ_i（反射）　　n₁sinθ_i = n₂sinθ_t（斯涅尔）</div>'+
      '<ul><li>光疏→光密（n₁<n₂）：透射波<b>折向法线</b>；光密→光疏：折离法线</li>'+
      '<li>三条射线上的相位脉冲显示传播方向；线宽 ∝ 场强幅值</li></ul>'+
      '<div class="ex-note">⟶ 拖 ε_r1 / ε_r2 换两侧折射率，看 θ_t 跟着弯。</div>'},
    {k:'2',tab:'2. 菲涅尔系数：分多少',cls:'c2',body:
      '分到两路的多少由菲涅尔系数决定（衔接条件解出来的，极化方式有关）：'+
      '<div class="frm">⊥：Γ=(η₂cosθ_i−η₁cosθ_t)/(η₂cosθ_i+η₁cosθ_t)</div>'+
      '<ul><li>能量守恒：R + T_能 = |Γ|² + (n₂cosθ_t/n₁cosθ_i)·|T|² = 1（读数卡逐秒核对）</li>'+
      '<li>切换 ⊥/∥ 极化：同一入射角下 Γ 不同 —— 这正是"边界条件"的力量</li></ul>'+
      '<div class="ex-note">🔑 边界条件（E_t、H_t 连续）在界面上逐点成立 ⇒ 唯一确定了 Γ 和 T。</div>'},
    {k:'3',tab:'3. 全反射',cls:'c3',body:
      'n₁>n₂ 时存在临界角 θ_c = asin(n₂/n₁)：'+
      '<div class="frm">θ_i > θ_c ⇒ sinθ_t>1 无实数解 ⇒ 全反射</div>'+
      '<ul><li>能量 100% 反射回介质 1（|Γ|=1）；介质 2 里只剩贴界面、不进能的<b>隐失波</b></li>'+
      '<li>把 ε_r1 调到 9、ε_r2 保持 1，拖 θ_i 过 θ_c ≈ 19.5° 亲眼看</li></ul>'+
      '<div class="ex-note">⭐ 光纤、内窥镜都靠它 —— 边界条件不是书斋公式，是工程地基。</div>'},
  ],
};
function renderExplain(sec){
  sec.innerHTML='';
  sec.appendChild(h('<div class="sec-title">讲解</div>'));
  const list=CARDS[state.mode];
  const tabs=h('<div class="card-tabs"></div>').firstChild;
  list.forEach(c=>{
    const b=h('<button class="card-tab '+c.cls+(c.k===state.cardTab?' on':'')+'">'+c.tab+'</button>').firstChild;
    b.onclick=()=>{ state.cardTab=c.k; renderPanel(); };
    tabs.appendChild(b);
  });
  sec.appendChild(tabs);
  const cur=list.find(c=>c.k===state.cardTab)||list[0];
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
  if(state.mode==='bc'){
    const {E1,E2}=bcFields();
    html += kchip('E_1t =', E1.t.toFixed(3),'warn');
    html += kchip('E_2t =', E2.t.toFixed(3),'acc');
    html += kchip('|E_1t−E_2t| =', '0','');
    html += kchip('h =', state.hLoop.toFixed(2)+' m');
    html += kchip('D_2n−D_1n =', (state.epsr2*E2.n-state.epsr1*E1.n).toFixed(2));
    lgT.textContent='衔接条件：E_t 连续 · D_n 跳 σ_s';
    lgN.innerHTML=richHTML('小回路压扁 ⇒ 切向连续；扁盒穿界面 ⇒ 法向跳变 = σ_s');
  } else {
    const F=fresnel(state.thI);
    html += kchip('θ_i = θ_r =', state.thI.toFixed(1)+'°','warn');
    html += kchip('θ_t =', F.thT!==null?F.thT.toFixed(1)+'°':'全反射','acc');
    html += kchip('Γ =', F.G.toFixed(3));
    html += kchip('R+T_能 =', (F.R+F.Te).toFixed(4),'');
    lgT.textContent='反射与透射：斯涅尔 + 菲涅尔';
    lgN.innerHTML=richHTML('n₁sinθ_i = n₂sinθ_t · 能量守恒 R+T_能=1');
  }
  strip.innerHTML=html;
  placeLegend();
}
function updateModeTag(){
  const t=document.getElementById('modeTag'); if(!t) return;
  const sb=document.getElementById('moduleSub');
  if(state.mode==='bc'){
    t.innerHTML=richHTML('① 衔接条件 · E_1t = E_2t · D_2n−D_1n = <b>σ_s</b>');
    if(sb) sb.innerHTML=richHTML('小回路压扁 ⇒ 切向连续');
  } else {
    const F=fresnel(state.thI);
    t.innerHTML=richHTML('② 反射与透射 · θ_t = <b>'+(F.thT!==null?F.thT.toFixed(1)+'°':'全反射')+'</b> · Γ = '+F.G.toFixed(2));
    if(sb) sb.innerHTML=richHTML('斯涅尔定律 · 菲涅尔系数 · 全反射');
  }
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
    if(state.playing && state.mode==='rt'){
      state.t+=dt*0.45;
      if(state.t>=1) state.t-=1;
      needsRender=true;
    }
    if(state.autoRotate){ cam.az+=0.0045; needsRender=true; }
    if(needsRender) draw();
  }catch(err){ needsRender=false; console.error('draw/tick error:',err); }
  requestAnimationFrame(tick);
}
function updateAll(){ needsRender=true; syncSliders(); updateReadout(); updateModeTag(); }
function playPause(){ state.playing=!state.playing; }
function stopAnim(){ state.playing=false; }

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
document.getElementById('btnViewReset').onclick=()=>{ cam.az=CAM0.az; cam.el=CAM0.el; cam.zoom=1.12; cam.px=0; cam.py=0; needsRender=true; };
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
  if(save){ try{ localStorage.setItem('em54-panel-w', String(w)); }catch(e){} }
  return w;
}
(()=>{ let v=0; try{ v=parseInt(localStorage.getItem('em54-panel-w')||'0',10)||0; }catch(e){}
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

/* ══════════════════════════════ 页签 / 相机 / 启动 ══════════════════════════════ */
const CAM0={az:-1.45, el:1.25};
const MT=[{k:'bc', t:'① 衔接条件（推导）'},
          {k:'rt', t:'② 反射与透射（扩展）'}];
const modeTabs=document.getElementById('modeTabs');
MT.forEach(m=>{const b=document.createElement('button');b.textContent=m.t;b.dataset.k=m.k;
  b.onclick=()=>{ stopAnim(); state.mode=m.k; state.cardTab='1';
    Object.assign(state, JSON.parse(JSON.stringify(PRESET[m.k])));
    clampState();
    syncModeTabs(); cam.az=CAM0.az; cam.el=CAM0.el; cam.zoom=1.12; cam.px=0; cam.py=0;
    renderPanel(); updateAll(); };
  modeTabs.appendChild(b);});
function syncModeTabs(){Array.from(modeTabs.children).forEach(b=>b.classList.toggle('on',b.dataset.k===state.mode));}

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

cam.az=CAM0.az; cam.el=CAM0.el; cam.zoom=1.12;
syncModeTabs();
resize();
renderPanel();
updateAll();
tick(0);
