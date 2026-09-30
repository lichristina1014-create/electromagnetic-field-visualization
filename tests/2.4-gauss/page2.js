/* ============================================================================
   2.4 高斯定理及其应用 —— 页面专属（二）：讲解卡 / 面板装配 / 数据条 / 主循环 / 交互
   ⚠️ 所有进 DOM 或进画布的串都必须走 richHTML()/parseRich()：本引擎只认 @{...}（矢量上划线）
      与 _x（下标），**不认 Markdown 的星号** ⇒ 要加粗只能用 <b>。
   ============================================================================ */
const CARDS={
  inside:[
    {k:'1',tab:'1. 为什么可以"数根数"',cls:'c1',body:
      '<b>把每一条场线看成一根"通量管"</b>：本页约定它代表固定的一小份电荷 q₀ = 0.125 µC。'+
      '因为场线处处与 @{E} 相切，穿过任意曲面的<b>条数</b>就与 @{E} 的通量成正比：'+
      '<div class="frm">Φ = ∮_S @{E}·d@{S} = (穿出 − 穿入) × q₀/ε₀ = Q内/ε₀</div>'+
      '<ul><li>显示比例挑成 q₀ = 0.125 µC ⇒ <b>净根数恰好等于 Q内/q₀</b>，一根不多、一根不少</li>'+
      '<li>⚠️ 场线的<b>疏密</b>只是示意，但<b>净根数</b>是按真实场逐点追踪算出来的'+
      '（含格点自校正）⇒ 画面上的穿越点、读数条、右上卡片三者严格一致</li>'+
      '<li>把 q₁ 拖一格（0.25 µC）正好多 <b>2</b> 根线 —— 这个「整数感」正是离散化的意义</li></ul>'+
      '<div class="ex-note">对照 1.4：那里的 ∇·@{E} = ρ/ε₀ 是「<b>逐点</b>」的说法；'+
      '这里数根数是「<b>整块</b>」的说法。两者是同一条定理的微分形式与积分形式。</div>'},
    {k:'2',tab:'2. 同一事实的三种写法',cls:'c2',body:
      '<b>积分形式、离散形式、反推场强：</b>'+
      '<div class="frm">积分： Φ = ∮_S @{E}·d@{S} = Q内/ε₀</div>'+
      '<div class="frm">离散： 净穿出根数 × q₀ = Q内</div>'+
      '<div class="frm">反推： 对称时 |@{E}| = Q内/(4πε₀r²)</div>'+
      '<ul><li>前两行是「同一个式子的两种语言」。q₀ 取得越小（线越密），离散版越贴近积分版</li>'+
      '<li>第三行是高斯定理最常见的<b>用途</b>：<b>只要对称性够</b>，不用积分就能把场强写出来'+
      '（球对称 → 球面；轴对称 → 圆柱面；面对称 → 平行板）</li></ul>'+
      '<div class="ex-note">⚠️ 本页是「<b>球形高斯面 + 任意布置的电荷</b>」，它<b>不能</b>用第三行反推场强 —— '+
      '反推的前提是「球面上 |@{E}| 处处相等、方向处处沿法向」。本页特意让球外电荷把这个前提弄脏，'+
      '就是为了看「通量仍然守恒、场强却早已不均匀」。</div>'},
    {k:'3',tab:'3. Φ 的符号怎么定',cls:'c3',body:
      '<b>穿出记 +1、穿入记 −1，代数和才是净根数。</b>'+
      '<ul><li>q₁ = +2.00 µC ⇒ 净根数 = +8，穿越点全是<b>红圈</b>（沿 @{E} 穿出）</li>'+
      '<li>把 q₁ 拖成负值 ⇒ 场线从远处来、<b>穿进球面后落到负电荷上</b> ⇒ 全是蓝圈，净根数为负</li>'+
      '<li>q₁ = 0、只留 q₂ ⇒ 穿出与穿入条数相等，净根数 = 0 ⇒ Φ = 0</li></ul>'+
      '<div class="ex-note">Φ 的正负就是「<b>净穿出</b>」的方向感：球内净正电荷 ⇒ 向外溢（Φ &gt; 0）；'+
      '球内净负电荷 ⇒ 向内吸（Φ &lt; 0）。它跟"画了多少条线"无关，只看<b>代数和</b>。</div>'},
  ],
  outside:[
    {k:'1',tab:'1. 球外的线要穿两次',cls:'c1',body:
      '<b>球外每一条能碰到球面的场线，都必须在球面上穿两次。</b>'+
      '<ul><li>球外的正电荷发出场线：一部分飞向无穷远（<b>不碰球面</b>），'+
      '另一部分指向球面 ⇒ <b>穿入</b>（蓝圈）</li>'+
      '<li>既然球内没有「能把线吃掉」的净负电荷，它们就必须从另一边<b>穿出</b>（红圈）</li>'+
      '<li>一条线贡献 +1 与 −1 ⇒ 代数和恒为 <b>0</b>。球外电荷再多，也只是让红、蓝圈同时变密</li></ul>'+
      '<div class="ex-note">⚠️ 唯一的例外：球内若有个大负电荷「接住」了这些线，红蓝就不再成对 —— '+
      '但那已经属于「球内电荷变了」这一支；净根数<b>照样</b>等于 Q内/q₀，定理毫发无损。</div>'},
    {k:'2',tab:'2. 换个面也不变',cls:'c2',body:
      '<b>把球面放大、缩小、改成随便什么形状，净根数都不变。</b>背后是一条极重要的局部性质：'+
      '<div class="frm">无电荷处  ∇·@{E} = 0</div>'+
      '<ul><li>散度为零 ⇒ 场线<b>不会在空间里凭空产生或消失</b> ⇒ 它只能「穿进去、再穿出来」</li>'+
      '<li>于是穿出多少、穿入多少，只取决于<b>面里包住了哪些源</b>，与面选在哪儿、什么形状无关</li>'+
      '<li>这正是「数根数」这种土办法能等同于高斯定理的原因：<b>根数守恒 = 通量守恒</b></li></ul>'+
      '<div class="ex-note">⟶ 试着拖「球面半径 R」：净根数<b>始终</b>等于 Q内/q₀。'+
      'R 只改变球面的位置，不改变它包住了谁。</div>'},
  ],
  allfield:[
    {k:'1',tab:'1. 叠加：E = ΣEᵢ',cls:'c1',body:
      '<b>点电荷的场是可加的：</b>'+
      '<div class="frm">@{E}(@{r}) = Σ_i @{E}_i(@{r})　，　@{E}_i = (1/4πε₀)·q_i(@{r}−@{r}_i)/|@{r}−@{r}_i|³</div>'+
      '也就是说，P 点的场<b>由空间中所有电荷共同决定</b>，少算谁都不对。'+
      '<ul><li>画面上 P 处的三支箭头就是这句公式的图像：<b>红（总）= 青（球内）+ 紫（球外）</b></li>'+
      '<li>把球外电荷拖到 0 ⇒ 紫箭头消失、红箭头缩回去与青<b>重合</b> —— '+
      '这就证明了球外电荷在 P 点<b>确实有贡献</b></li>'+
      '<li>再把 P 挪到球面各处：红、青、紫三支的大小方向都变，仍然满足「红 = 青 + 紫」</li></ul>'+
      '<div class="ex-note">本页的电荷位置是固定的，所以「谁在内、谁在外」不随 R 变 —— '+
      '内外分组不会来回跳，这个分解才始终有明确含义。</div>'},
    {k:'2',tab:'2. 场强 ≠ 通量',cls:'c2',body:
      '<b>但「通量」是另一个层面的量 —— 它不关心某一点。</b>'+
      '<div class="frm">Φ = ∮_S @{E}·d@{S} = Q内/ε₀</div>'+
      '<ul><li>球面上每一处的 @{E} 都被球外电荷改得不一样（大小、方向都变）</li>'+
      '<li>可是<b>法向分量</b> @{E}·@{n} 在球面上<b>有正有负</b>：'+
      '被「推」出球面的地方多一些、被「压」进球面的地方少一些，按面积加权求和之后，'+
      '球外电荷的贡献被<b>全部抵消</b></li>'+
      '<li>打开 <b>球面 @{E}·@{n} 采样</b> 就能看到这一幕：箭头红蓝相间、长短悬殊，'+
      '但求和结果永远是 Φ = Q内/ε₀</li></ul>'+
      '<div class="ex-note">这正是学高斯定理最容易栽的地方：把「某一点的场强」当成「整块面的通量」。'+
      '<b>场强逐点定义、通量整块定义</b>；球外电荷改得了前者，改不了后者。</div>'},
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
  const body=h('<div class="card-body '+cur.cls+'"><div class="ex-title">'+cur.tab+'</div></div>').firstChild;
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
/* ⚠️ 图例（.cv-legend）是 absolute + bottom:14px，而 .canvas-card 里**还有一条数据条**
   （.coord-strip）也贴在底部 ⇒ 图例默认会压在数据条上面。修法：bottom = 数据条高度 + 14。 */
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
  const c=crossNow(), Qi=qInside(), Qo=qOutside(), want=Math.round(Qi/Q0);
  if(state.mode==='allfield'){
    const P=Ppoint();
    const Lall=vlen(Efield(P)), Lin=vlen(EfieldOf(IDX_IN,P)), Lout=vlen(EfieldOf(IDX_OUT,P));
    html += kchip('球内 Q内 =', sgnTxt(Qi,2)+' µC');
    html += kchip('球外 Q外 =', sgnTxt(Qo,2)+' µC','acc');
    html += kchip('P（θ, φ）=', state.Pth.toFixed(0)+'°, '+state.Pph.toFixed(0)+'°');
    html += kchip('P 点 总 |@{E}| =', Lall.toFixed(1)+' kV/m','warn');
    html += kchip('　只算球内 =', Lin.toFixed(1)+' kV/m');
    html += kchip('　只算球外 =', Lout.toFixed(1)+' kV/m','acc');
    html += kchip('净穿出根数 =', c.net+'（Q内/q₀ = '+want+'）', c.net===want?'acc':'warn');
    html += kchip('Φ = Q内/ε₀ =', fmtSci(PHI_V(Qi))+' V·m','acc');
    lgT.textContent='球面上 P 点的场 vs 整个球面的通量';
    lgN.innerHTML=richHTML('红 = 青 + 紫（总场 = 球内 + 球外）　·　但 Φ 只认球内电荷');
    strip.innerHTML=html; placeLegend(); return;
  }
  html += kchip('球内电荷 Q内 =', sgnTxt(Qi,2)+' µC');
  html += kchip('球外电荷 Q外 =', sgnTxt(Qo,2)+' µC','acc');
  html += kchip('每条场线 ≡ q₀ =', Q0.toFixed(3)+' µC');
  html += kchip('理论净根数 Q内/q₀ =', want+' 根');
  html += kchip('穿出 / 穿入 =', c.out+' / '+c.inn);
  html += kchip('净穿出根数 =', c.net+' 根', c.net===want?'acc':'warn');
  html += kchip('净根数 × q₀ =', (c.net*Q0).toFixed(2)+' µC', c.net===want?'acc':'warn');
  html += kchip('Φ = Q内/ε₀ =', fmtSci(PHI_V(Qi))+' V·m');
  /* 打开"球面 @{E}·@{n} 采样"时，顺手把**采样求和**与解析 Φ 摆在一起 ——
     "球面上箭头有进有出、长短悬殊，加起来却恰好是 Φ"这句话就落到了数字上。 */
  if(state.show.flux){
    const fsum=fluxSumExact(), phi=PHI_V(Qi);
    const rel=Math.abs(fsum-phi)/Math.max(1e-9,Math.abs(phi))*100;
    html += kchip('球面采样 Σ(@{E}·@{n})ΔS ≈', fmtSci(fsum)+' V·m（差 '+rel.toFixed(2)+'%）','acc');
  }
  if(state.mode==='inside'){
    lgT.textContent='球内电荷 ⇒ 净根数跟着变';
    lgN.innerHTML=richHTML('@{E} 的场线从球内电荷发出、一路穿出球面　·　穿出 − 穿入 ≡ Q内/q₀');
  } else {
    lgT.textContent='球外电荷 ⇒ 净根数不变';
    lgN.innerHTML=richHTML('球外的线每一条都穿进又穿出（代数和 0）　·　'+
      '所以 穿出、穿入同步变大，净根数纹丝不动');
  }
  strip.innerHTML=html;
  placeLegend();
}
function updateModeTag(){
  const t=document.getElementById('modeTag'); if(!t) return;
  const sb=document.getElementById('moduleSub');
  const Qi=qInside(), c=crossNow(), want=Math.round(Qi/Q0);
  if(state.mode==='inside'){
    t.innerHTML=richHTML('① 只有球内电荷 · R = '+state.R.toFixed(3)+' m　'+
      'Q内 = '+sgnTxt(Qi,2)+' µC　净穿出 = '+c.net+' 根');
    if(sb) sb.textContent='改变球内电荷 ⇒ 穿过球面的场线根数跟着变';
  } else if(state.mode==='outside'){
    t.innerHTML=richHTML('② 球外也有电荷 · Q外 = '+sgnTxt(qOutside(),2)+' µC　'+
      '净穿出 = '+c.net+' 根（= Q内/q₀ = '+want+'，不随球外电荷变）');
    if(sb) sb.textContent='改变球外电荷 ⇒ 净穿出根数不变，穿出与穿入同步增大';
  } else {
    t.innerHTML=richHTML('③ 任意一点的场由全体电荷决定 · P（'+state.Pth.toFixed(0)+'°, '+
      state.Pph.toFixed(0)+'°）　而 Φ 仍 = Q内/ε₀');
    if(sb) sb.textContent='球面上每一点的 |@{E}| 都被球外电荷改写，通量却纹丝不动';
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
/* ⚠️ tick 里的 draw 必须包 try/catch：下一帧是在函数末尾排的，
   任何一帧抛异常 ⇒ 整个渲染循环永久停摆（症状是"画面卡住、点什么都没反应"）。 */
function tick(){
  try{
    if(state.autoRotate){ cam.az+=0.0045; needsRender=true; }
    if(needsRender) draw();
  }catch(err){ needsRender=false; console.error('draw/tick error:',err); }
  requestAnimationFrame(tick);
}
function updateAll(){ needsRender=true; syncSliders(); updateReadout(); updateModeTag(); }

/* ══════════════════════════════ 交互 ══════════════════════════════ */
let drag=null;
function localPos(ev){const r=canvas.getBoundingClientRect();return{x:ev.clientX-r.left,y:ev.clientY-r.top};}
canvas=document.getElementById('cv');
ctx=canvas.getContext('2d');
canvas.addEventListener('pointerdown',ev=>{
  canvas.setPointerCapture(ev.pointerId);
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
/* ⚠️ 这个按钮的 id 是 btnViewReset 而**不是** btnReset —— 面板里若顺手写 btnReset 会重名，
   getElementById 只会返回文档里靠前的那一个（2.2 踩过：点了没反应且不报错）。 */
document.getElementById('btnViewReset').onclick=()=>{ cam.az=.62; cam.el=.40; cam.zoom=1; cam.px=0; cam.py=0; needsRender=true; };
document.getElementById('btnRotate').onclick=e=>{state.autoRotate=!state.autoRotate;e.target.classList.toggle('on',state.autoRotate);};
document.getElementById('btnPanReset').onclick=()=>{cam.px=0;cam.py=0;needsRender=true;};
function bindFold(bid,cls){document.getElementById(bid).onclick=()=>{document.body.classList.toggle(cls);setTimeout(resize,60);setTimeout(resize,260);};}
bindFold('foldNav','nav-off'); bindFold('foldPanel','panel-off');
document.getElementById('tglNav').onclick=()=>{document.body.classList.toggle('nav-off');setTimeout(resize,260);};
document.getElementById('tglPanel').onclick=()=>{document.body.classList.toggle('panel-off');setTimeout(resize,260);};
window.addEventListener('keydown',e=>{if(e.target.tagName==='INPUT')return;
  if(e.key==='['){document.body.classList.toggle('nav-off');setTimeout(resize,260);}
  if(e.key===']'){document.body.classList.toggle('panel-off');setTimeout(resize,260);}});

/* ══════════ 右侧面板：拖动抓取条自由调整宽度 ══════════
   · 宽度写在 CSS 变量 --panel-w 上 —— body.panel-off 的 width:0 优先级更高，两者不打架；
   · ⚠️ 拖动期间给 body 加 .resizing 把 .panel 的 transition:width 关掉，
     否则宽度带 0.22s 缓动，鼠标跑得越快面板越"追不上"。 */
const PANEL_W0=398, PANEL_WMIN=260;
const panelEl=document.getElementById('panel'), panelRz=document.getElementById('panelResizer');
function panelMaxW(){
  const navW=document.body.classList.contains('nav-off')?0:236;
  return Math.max(PANEL_WMIN+60, Math.min(760, window.innerWidth-navW-330));
}
function setPanelW(px,save){
  const w=Math.max(PANEL_WMIN, Math.min(panelMaxW(), Math.round(px)));
  document.documentElement.style.setProperty('--panel-w', w+'px');
  if(save){ try{ localStorage.setItem('em24-panel-w', String(w)); }catch(e){} }
  return w;
}
(()=>{ let v=0; try{ v=parseInt(localStorage.getItem('em24-panel-w')||'0',10)||0; }catch(e){}
      if(v>=PANEL_WMIN) setPanelW(v,false); })();
let _rz=null;
function rzEnd(){
  if(_rz) setPanelW(panelEl.getBoundingClientRect().width,true);
  _rz=null; document.body.classList.remove('resizing'); panelRz.classList.remove('dragging');
}
panelRz.addEventListener('pointerdown',ev=>{
  if(document.body.classList.contains('panel-off')) return;
  /* ⚠️ setPointerCapture 对"并不存在的 pointerId"会抛 NotFoundError
     （合成 PointerEvent 做自检时必然遇到）⇒ 必须兜住，否则拖动逻辑整个不执行。 */
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
   ★ 每页签有各自的"电荷预设"：① 只有球内、②③ 球内 + 球外。
     切页签就装载预设 —— 这样每个演示的起点都是可复现的（自检也才有确定的期望值）。 */
const MT=[{k:'inside',  t:'① 球内电荷 → 根数'},
          {k:'outside', t:'② 球外电荷 → 净不变'},
          {k:'allfield',t:'③ 任意一点的场'}];
const PRESET={
  inside:  {q:[Q_IN0, 0, 0, 0]},
  outside: {q:[Q_IN0, 0, Q3_0, Q4_0]},
  allfield:{q:[Q_IN0, 0, Q3_0, Q4_0]},
};
const modeTabs=document.getElementById('modeTabs');
MT.forEach(m=>{const b=document.createElement('button');b.textContent=m.t;b.dataset.k=m.k;
  b.onclick=()=>{ state.mode=m.k; state.cardTab='1';
    state.q=PRESET[m.k].q.slice();
    syncModeTabs(); cam.az=.62; cam.el=.40; cam.px=0; cam.py=0;
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

syncModeTabs();
resize();
renderPanel();
updateAll();
tick();
