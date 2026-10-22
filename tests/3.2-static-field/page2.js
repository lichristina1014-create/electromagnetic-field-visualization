/* ============================================================================
   3.2 恒定电场的特点 —— 页面专属（二）：讲解卡 / 面板装配 / 数据条 / 主循环 / 交互
   ⚠️ 所有进 DOM 的串都必须过 richHTML()（只认 @{...} 与 _x，**不认 Markdown 星号**）。
   ============================================================================ */
const CARDS={
  nosrc:[
    {k:'1',tab:'1. 没有电源：电流转瞬即逝',cls:'c1',body:
      '把一对<b>充了电的极板</b>用导线接起来：库仑场 @{E} 立刻驱动正电荷沿导线从 + 极流向 − 极。'+
      '<div class="frm">Q(t) = Q₀·e^(−t/τ)　　I(t) = −dQ/dt = (Q₀/τ)·e^(−t/τ)</div>'+
      '<ul><li>每流过去一份电荷，极板上的电荷就少一份 ⇒ <b>场的来源在被消耗</b></li>'+
      '<li>E 变弱 ⇒ 电流跟着变小 ⇒ 电荷消耗得越来越慢，但<b>方向不变、总量在减</b></li>'+
      '<li>拖 t 滑块到 4τ：Q 只剩 e⁻⁴ ≈ 1.8%，电流表基本归零</li></ul>'+
      '<div class="ex-note">🔑 这就是"为什么静电场维持不了恒定电流"：<b>它驱动电荷去中和的，正是它自己的来源</b>。</div>'},
    {k:'2',tab:'2. 恒定电流需要"把电荷搬回去"',cls:'c2',body:
      '恒定电流的定义是<b>不随时间变化</b> ⇒ 空间各处的电荷分布必须<b>不随时间变化</b>'+
      '（否则场就跟着变）：'+
      '<div class="frm">恒定电流 ⇒ 电荷分布不变 ⇒ 恒定电场</div>'+
      '<ul><li>但电荷沿导线流动，本身就<b>改变</b>着各处的电荷分布</li>'+
      '<li>要"分布不变"，必须有一股<b>非静电的力</b>，把流到 − 极的电荷<b>再搬回 + 极</b></li>'+
      '<li>这股力只能来自电源内部 —— 它就是<b>局外力</b>，对应的场强叫<b>局外场强 @{E}_e</b></li></ul>'+
      '<div class="ex-note">⟶ 切到 ② 页签，看局外场强怎样把电荷"搬上楼"。</div>'},
    {k:'3',tab:'3. 电流连续性：电流线必须闭合',cls:'c3',body:
      '恒定电场中电荷分布不随时间变化 ⇒ 任何闭合面里电荷不增不减：'+
      '<div class="frm">∮ @{J}·d@{S} = 0　⇒　电流线是无头无尾的闭合曲线</div>'+
      '<ul><li>这就是<b>电流连续性定理</b>：恒定电流只能走闭合回路</li>'+
      '<li>所以恒定电流的回路里必须有一段"电荷爬坡"的路程 —— 那段就在电源内部</li>'+
      '<li>没有电源（没有局外场），闭合回路的"爬坡段"没人负责 ⇒ 闭合不起来 ⇒ 只能暂态放电</li></ul>'+
      '<div class="ex-note">⚠️ ① 的画面里电流看起来也在"转圈"：那是因为<b>极板在被消耗</b>，'+
      '每一步都不是恒定状态 —— 判别标准是"能不能一直这样流下去"。</div>'},
  ],
  source:[
    {k:'1',tab:'1. 局外力与局外场强',cls:'c1',body:
      '<b>局外力</b>：电源内部把正电荷从负极搬向正极的<b>非静电力</b>（化学的、磁的、热的……）。'+
      '<div class="frm">局外场强 @{E}_e = @{F}_局外 / q　（只在电源内部存在）</div>'+
      '<ul><li>方向：电源内部由 − 极指向 + 极（橙色箭头）</li>'+
      '<li>同一处，驻立电荷的库仑场 @{E} 由 + 极指向 − 极（青色箭头）—— <b>两股力对着干</b></li>'+
      '<li>开路平衡时两者等大反向；接上回路后 @{E}_e 略占上风，把电荷持续搬上去</li></ul>'+
      '<div class="ex-note">⭐ 单位电动势的定义就写在这里：ℰ = ∫_−^+ @{E}_e·d@{l}（电源内部从负极到正极）。</div>'},
    {k:'2',tab:'2. 动态建立过程（拖 t 滑块）',cls:'c2',body:
      '接通瞬间（t = 0）极板还没来得及堆电荷；之后局外场搬运、库仑场消耗，两边趋近平衡：'+
      '<div class="frm">Q(t) = Q∞(1−e^(−t/τ))　　I(t) = I∞(1−e^(−t/τ))</div>'+
      '<ul><li>t 很小时：Q 在涨、I 在涨 —— 这一段<b>不是</b>恒定电场</li>'+
      '<li>t ≳ 3τ 后：Q→Q∞、I→I∞ = ℰ/R，进入<b>稳态</b></li>'+
      '<li>稳态的判决：任意闭合面里电荷不增不减（搬运 = 消耗）</li></ul>'+
      '<div class="ex-note">⟶ 拖 t 从 0 到 4τ：数极板上的 + 号、看载流子加速、看读数条的三行同步爬升。</div>'},
    {k:'3',tab:'3. 为什么此时电场是"恒定"的',cls:'c3',body:
      '稳态时电荷在流，但<b>分布不变</b>：每个位置"流走多少、补来多少"：'+
      '<div class="frm">电荷分布不变 ⇒ 驻立电荷的场不变 ⇒ @{E} 是恒定电场</div>'+
      '<ul><li>@{E} 由<b>相对静止的驻立电荷</b>产生 ⇒ 与静电场有<b>相同的环量特性</b>：∇×@{E} = 0</li>'+
      '<li>载流子流动的动力是 @{E}（导线里）与 @{E}_e（电源里）的接力</li>'+
      '<li>能量账：@{E}_e 在电源里做功（化学能 → 电能），@{E} 在导线里把电能交给电阻（→ 热）</li></ul>'+
      '<div class="ex-note">⟶ ③ 页签用环路积分把"环量特性"算给你看。</div>'},
  ],
  loop:[
    {k:'1',tab:'1. 回路不经电源：∮E·dl = 0',cls:'c1',body:
      '恒定电场的 @{E} 是<b>驻立电荷</b>产生的库仑场 ⇒ 与静电场一样是<b>保守场</b>：'+
      '<div class="frm">∮_l @{E}·d@{l} = 0　　∇×@{E} = 0</div>'+
      '<ul><li>路径 A 是回路内部一个不经电源的小环：动点 P 走一圈，∮ 的累计值最终回到 0</li>'+
      '<li>物理意义：绕一圈回到出发点，<b>电位必须回到原值</b>（否则电位就不是位置的函数了）</li>'+
      '<li>本页的积分是<b>真算出来的</b>：沿路径 720 段中点规则数值积分，残差如实显示</li></ul>'+
      '<div class="ex-note">⚠️ 这就是"3.2 标题为什么叫恒定电场的<b>特点</b>"：它首先是一场"环量等于零"的场。</div>'},
    {k:'2',tab:'2. 回路穿过电源：多出来的 ℰ',cls:'c2',body:
      '把试探路径换成<b>沿导线一整圈</b>（路径 B，会穿过电源内部）：'+
      '<div class="frm">∮ @{E}·d@{l} = 0　　∮ (@{E}+@{E}_e)·d@{l} = ℰ</div>'+
      '<ul><li>@{E} 的部分仍然是 0（保守场与路径无关）</li>'+
      '<li>@{E}_e 只在电源段有贡献：∫_−^+ @{E}_e·d@{l} = ℰ（电动势的定义）</li>'+
      '<li>所以总场的环量 = ℰ ≠ 0 —— <b>恒定电场的"有源性"全部来自局外场</b></li></ul>'+
      '<div class="ex-note">🔑 这正是 PPT 第 16 页的话：积分回路<b>不经过外源</b>时 ∮@{E}·d@{l} = 0、∇×@{E} = 0。</div>'},
    {k:'3',tab:'3. 一张图总结这一节',cls:'c3',body:
      '三个页签合起来就是恒定电场的完整图像：'+
      '<div class="frm">没电源 ⇒ 放电归零　｜　有电源 ⇒ 局外场维持恒定</div>'+
      '<ul><li>电流连续性：∮@{J}·d@{S} = 0 ⇒ 电流线闭合 ⇒ 必须有"爬坡段"</li>'+
      '<li>局外场强 @{E}_e 负责爬坡（电源内部，− 极 → + 极）</li>'+
      '<li>环量特性：@{E} 保守（∮=0）；电动势 ℰ = ∫@{E}_e·d@{l} 是回路"有源性"的全部来源</li></ul>'+
      '<div class="ex-note">⭐ 往后 3.3 的边值问题、3.4 的静电比拟，都建立在"@{E} 保守 + @{J} 连续"这两条上。</div>'},
  ],
};
function renderExplain(sec){
  sec.innerHTML='';
  const list=CARDS[state.mode];
  sec.appendChild(h('<div class="sec-title">讲解</div>'));
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
  let html='';
  if(state.mode==='nosrc'){
    html += kchip('Q(t) =', Qnow().toFixed(2)+' µC','warn');
    html += kchip('E(t) =', Eplates().toFixed(1)+' V/m');
    html += kchip('I(t) =', fmtI(),'acc');
    html += kchip('t/τ =', (state.t/state.TAU).toFixed(2));
    html += kchip('衰减规律', 'e^(−t/τ)');
    lgT.textContent='没有电源：放电暂态';
    lgN.innerHTML=richHTML('Q、E、I 同步按 e^(−t/τ) 衰减 ⇒ 没有局外力，电流转瞬即逝');
  } else if(state.mode==='source'){
    html += kchip('ℰ =', state.EMF.toFixed(1)+' V','warn');
    html += kchip('@{E}_e = ℰ/d =', EeVal().toFixed(1)+' V/m','acc');
    html += kchip('Q(t) → Q∞ =', Qnow().toFixed(2)+' → '+qInf().toFixed(1)+' µC');
    html += kchip('I(t) → I∞ =', fmtI()+' → '+iInf().toFixed(3)+' mA','acc');
    html += kchip('t/τ =', (state.t/state.TAU).toFixed(2));
    lgT.textContent='有电源：局外场强维持恒定';
    lgN.innerHTML=richHTML('@{E}_e 把正电荷从 − 极搬回 + 极 ⇒ 电荷分布不变 ⇒ 恒定电场');
  } else {
    const iE=intE(state.path), iEe=intEe(state.path);
    html += kchip('路径', state.path==='A'?'A · 不经电源':'B · 穿过电源','warn');
    html += kchip('进度 s =', (state.s*100).toFixed(0)+' %');
    html += kchip('∮ @{E}·d@{l} 累计 =', intE_upto(state.s).toFixed(3)+' V');
    if(state.path==='B') html += kchip('∫ @{E}_e·d@{l} 累计 =', intEe_upto(state.s).toFixed(2)+' V','acc');
    html += kchip('走完整圈：∮ @{E}·d@{l} =', iE.toFixed(3)+' V');
    html += kchip('∮ (@{E}+@{E}_e)·d@{l} =', (iE+iEe).toFixed(2)+' V','warn');
    lgT.textContent='环量：恒定电场是保守场';
    lgN.innerHTML=richHTML('@{E} 保守（∮=0）· ℰ 全部来自局外场 @{E}_e');
  }
  strip.innerHTML=html;
  placeLegend();
}
function updateModeTag(){
  const t=document.getElementById('modeTag'); if(!t) return;
  const sb=document.getElementById('moduleSub');
  if(state.mode==='nosrc'){
    t.innerHTML=richHTML('① 没电源 · I(t) = <b>'+fmtI()+'</b>　按 e^(−t/τ) 衰减');
    if(sb) sb.innerHTML=richHTML('静电场一次性：驱动电荷去中和自己的来源');
  } else if(state.mode==='source'){
    t.innerHTML=richHTML('② 有电源 · @{E}_e = <b>'+EeVal().toFixed(1)+' V/m</b>　I → ℰ/R = '+iInf().toFixed(3)+' mA');
    if(sb) sb.innerHTML=richHTML('局外力把正电荷从负极搬回正极 ⇒ 维持恒定');
  } else {
    t.innerHTML=richHTML('③ 环量 · ∮@{E}·d@{l} = <b>0</b>（保守场）　∮(@{E}+@{E}_e)·d@{l} = ℰ');
    if(sb) sb.innerHTML=richHTML('驻立电荷的场与静电场环量特性相同');
  }
}

/* ══════════════════════════════ 主循环 ══════════════════════════════ */
let needsRender=true;
/* ⏱ 载流子流速的显示比例：① 的电流是 µA 量级、②③ 是 mA 量级 ⇒ 两套比例。
   读数一律按真实公式算，与动画快慢无关（3.1 的口径）。 */
function flowSpeed(){ return state.mode==='nosrc' ? Inow()*0.05 : Inow()*0.033; }   /* 世界 m/s */
let _lastT=0;
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
/* ⚠️ tick 里的 draw 必须包 try/catch：下一帧是在函数末尾排的，
   任何一帧抛异常 ⇒ 整个渲染循环永久停摆（症状是"画面卡住、点什么都没反应"）。 */
function tick(ts){
  try{
    const dt=_lastT?Math.min(0.05,(ts-_lastT)/1000):0.016; _lastT=ts||0;
    state.flow += flowSpeed()*dt;
    if(state.flow>1e6) state.flow%=LP_L;              /* 防累积溢出 */
    if(state.anim) stepAnim(dt);
    needsRender=true;                                 /* 载流子在动 ⇒ 每帧都要重画 */
    if(state.autoRotate){ cam.az+=0.0045; }
    draw();
  }catch(err){ needsRender=false; console.error('draw/tick error:',err); }
  requestAnimationFrame(tick);
}
function updateAll(){ needsRender=true; syncSliders(); updateReadout(); updateModeTag(); }

/* ══════════ 播放（①② 的 t 进程 / ③ 的 s 进程） ══════════
   ★ 拖滑块必须 state.anim=null（4.2 踩过：anim.u 与 state.t 失配）。
   ★ 播放全程 6 s 走完 [0, 4τ] / [0,1]；到顶自动停。 */
function playT(){ state.anim={playing:true, kind:'t'}; }
function playS(){ state.anim={playing:true, kind:'s'}; }
function stopAnim(){ if(state.anim) state.anim.playing=false; state.anim=null; }
function stepAnim(dt){
  if(!state.anim||!state.anim.playing) return;
  if(state.anim.kind==='t'){
    state.t=Math.min(tMax(), state.t+dt*tMax()/6);
    if(state.t>=tMax()){ stopAnim(); renderPanel(); }
  } else {
    state.s=Math.min(1, state.s+dt/5);
    if(state.s>=1){ stopAnim(); renderPanel(); }
  }
  syncSliders(); updateReadout(); updateModeTag();
}

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
  if(save){ try{ localStorage.setItem('em32-panel-w', String(w)); }catch(e){} }
  return w;
}
(()=>{ let v=0; try{ v=parseInt(localStorage.getItem('em32-panel-w')||'0',10)||0; }catch(e){}
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

/* ══════════════════════════════ 页签 ══════════════════════════════
   ★ 每个页签有自己的预设 ⇒ 每个演示的起点都可复现。
   ★ 相机：电路图视角（近正对 +z 俯视 xy 平面，微倾看出立体感）。 */
const CAM0={az:-1.45, el:1.32};
const MT=[{k:'nosrc', t:'① 没电源 · 放电'},
          {k:'source',t:'② 有电源 · 局外场'},
          {k:'loop',  t:'③ 环量 · 保守场'}];
const modeTabs=document.getElementById('modeTabs');
MT.forEach(m=>{const b=document.createElement('button');b.textContent=m.t;b.dataset.k=m.k;
  b.onclick=()=>{ stopAnim(); state.mode=m.k; state.cardTab='1';
    Object.assign(state, JSON.parse(JSON.stringify(PRESET[m.k])));
    clampState();                       /* ★ 防"按钮把量设到量程外"的静默不一致 */
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
