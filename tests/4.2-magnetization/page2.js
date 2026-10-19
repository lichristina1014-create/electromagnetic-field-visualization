/* ============================================================================
   4.2 磁介质的磁化 —— 页面专属（二）：讲解卡 / 面板装配 / 数据条 / 主循环 / 交互
   ⚠️ 所有进 DOM 的串都必须过 richHTML()（只认 @{...} 与 _x，**不认 Markdown 星号**）。
   ⚠️ page1.js 里被引用的符号（本文件负责定义）：
      renderPanel / updateReadout / updateModeTag / syncNotes / updatePlayBtn /
      updateAll / needsRender / draw / tick / resize / NAV / CARDS
   ============================================================================ */
const CARDS={
  molecular:[
    {k:'1',tab:'1. 磁介质 = 无数分子电流',cls:'c1',body:
      '把一块磁介质放大到分子尺度，看到的不是颗粒，而是<b>无数多个绕着小圈流动的电流</b>'+
      '—— 分子电流（原子内电荷运动的经典图像）：'+
      '<div class="frm">一块磁介质 = 无数个分子电流小环</div>'+
      '<ul><li>每个环流使分子获得一个<b>磁矩</b> @{m} —— 它是带方向的矢量</li>'+
      '<li>方向用<b>右手定则</b>：四指顺环流方向，拇指指 @{m}</li>'+
      '<li>拖 <b>i</b>（电流大小）或 <b>r_c</b>（环半径）：@{m} 随之改变，'+
      '画面上的紫色箭头长度就是 @{m} 的相对大小</li></ul>'+
      '<div class="ex-note">页面为看得见把环放得极大：真实分子电流是<b>原子尺度</b>（Å），'+
      '画面大小只是示意，卡片读数按滑块上的真实值算。</div>'},
    {k:'2',tab:'2. 磁矩 @{m} = i·S',cls:'c2',body:
      '环流的磁矩只由"流多少、流多大圈"决定：'+
      '<div class="frm">@{m} = i·S = i·πr_c²　　单位 A·m²</div>'+
      '<ul><li>默认 i = 1.00 µA、r_c = 10 Å ⇒ @{m} ≈ 3.1×10'+'⁻²⁴'+' A·m² ≈ 0.34 µ_B'+
      '（玻尔磁子量级）</li>'+
      '<li><b>i 翻倍 ⇒ @{m} 翻倍；r_c 翻倍 ⇒ @{m} 翻四倍</b>（S 按 r_c² 涨）</li>'+
      '<li>按「翻转电流方向」：@{m} 精确反向 —— 箭头与场线同时反过来</li></ul>'+
      '<div class="frm">整块介质的磁化强度上限：M = n·m　（n = 10²⁸ /m³）</div>'+
      '<div class="ex-note">⭐ 记住这条链：<b>i、r_c → @{m} → M</b>。'+
      '③ 页签的磁化强度就是由这两个滑块算出来的。</div>'},
    {k:'3',tab:'3. 环流的磁场 · 右手定则',cls:'c3',body:
      '一个环流的磁场（画面上的紫色细线）：'+
      '<div class="frm">右手定则：四指顺电流，拇指指 @{m} = 环"这一面"出磁场的方向</div>'+
      '<ul><li>环的 <b>+@{m} 一侧</b>：场线向外穿出，像一块小磁铁的 N 极</li>'+
      '<li>另一侧：场线绕一圈回来穿入，像 S 极</li>'+
      '<li>贴着环导线处最强，远处迅速衰减</li></ul>'+
      '<div class="ex-note">⟶ ②③ 页签里那 95 个小环<b>每一个都在产生这样的场</b>：'+
      '杂乱无章时互相抵消，取向排列时叠加成可观的宏观磁场 —— 这就是本页剩下的全部故事。</div>'},
  ],
  nofield:[
    {k:'1',tab:'1. 无外场：分子电流杂乱无章',cls:'c1',body:
      '没有外加磁场时，分子电流的取向<b>杂乱无章</b>：'+
      '<ul><li>每一个小环<b>都在流</b> —— 分子电流是物质自身的属性，与加不加外场无关</li>'+
      '<li>但环面的朝向、环流的转向<b>处处不同</b>（统计上均匀分布）</li>'+
      '<li>按「重新随机」换一种摆法：画面全变，<b>结论一点不变</b></li></ul>'+
      '<div class="ex-note">⚠️ 别把"无外场"读成"没有电流"：变的是<b>取向</b>，不是环流本身。</div>'},
    {k:'2',tab:'2. 为什么宏观上不显磁性',cls:'c2',body:
      '两个尺度上同时抵消：'+
      '<div class="frm">接触点：相邻两环的电流方向相反 ⇒ 微观上抵消</div>'+
      '<ul><li>任意相邻两环的接触点上，两边电流<b>大小相等、方向相反</b></li>'+
      '<li>对所有分子磁矩求平均：⟨@{m}⟩ = 0 ⇒ <b>磁化强度 M = 0</b></li>'+
      '<li>外表面<b>凑不出一圈同向环流</b> ⇒ 束缚电流 @{K}_b = 0</li>'+
      '<li>于是磁化磁场 @{B}′ = 0；此时也没有外加场 ⇒ <b>总场 @{B} = 0</b></li></ul>'+
      '<div class="ex-note">⭐ 左下角「表层放大」画的就是这件事：投影成椭圆的环顺逆各异，'+
      '接触点的电流互相抵消，边界上没有任何宏观环流剩下。</div>'},
    {k:'3',tab:'3. 和 2.3 的电介质对照记',cls:'c3',body:
      '磁介质的磁化与 2.3 电介质的极化，结构完全平行：'+
      '<div class="frm">分子电流 ↔ 取向电偶极子　　束缚电流 ↔ 极化电荷</div>'+
      '<ul><li>无外场：分子电流杂乱无章 ↔ 取向偶极子杂乱无章，都不显宏观效应</li>'+
      '<li>加外场：分子电流取向排列 ↔ 偶极子取向排列</li>'+
      '<li>表面束缚电流 @{K}_b ↔ 表面极化电荷；磁化磁场 @{B}′ ↔ 极化电场</li>'+
      '<li>µ_r 与 ε_r 是同一件事在磁 / 电两边的对应参数</li></ul>'+
      '<div class="ex-note">⟶ 2.3 讲"电荷被拉开"，本页讲"环流被排齐" —— '+
      '记住这张对偶表，两边都只需记一半。</div>'},
  ],
  poling:[
    {k:'1',tab:'1. 加外场：分子电流取向排列',cls:'c1',body:
      '沿 +z（绿轴）加一个外加磁场 @{B}₀，分子电流开始<b>取向排列</b>：'+
      '<ul><li>每个环受到"让 @{m} 转向 @{B}₀"的力矩 ⇒ 环面逐渐趴倒到垂直于 +z</li>'+
      '<li>拖 <b>t 进度条</b>可停在任意时刻：0~18% 还没加场，18%→100% 外场从零建到设定值</li>'+
      '<li>按 <b>▶</b> 播放全过程：外场、分子取向、表面电流、磁化场<b>一起长出来</b></li></ul>'+
      '<div class="ex-note">⚠️ 画面取向度是<b>示意放大</b>的（s_视 = min(1, 1.8×10⁴·a)，'+
      'a = mB/k_BT）。真实顺磁质的取向度只有 ~10⁻⁵，卡片「真实取向度 L(a)」一行'+
      '按未放大的真实值如实报告；参数按"强磁性材料"设，只为让 µ_r 明显大于 1。</div>'},
    {k:'2',tab:'2. 外表面合成宏观环形电流',cls:'c2',body:
      '取向排齐后，环与环在接触点上<b>反向抵消</b>，只剩最外圈：'+
      '<div class="frm">内部：相邻环流在接触点抵消 ⇒ 外表面剩一圈同向环流</div>'+
      '<ul><li>这圈外表面环流就是<b>束缚电流</b> @{K}_b（也叫磁化电流）</li>'+
      '<li>@{K}_b = M×n̂；圆柱侧面 n̂ = ρ̂ ⇒ @{K}_b 沿 φ̂ 方向，<b>数值上 = M</b></li>'+
      '<li>它相当于一个<b>螺线管</b>：一圈圈 φ̂ 向环流沿着棒排过去</li>'+
      '<li>左下「表层放大」：内部接触点的 ✕ 逐渐淡化（抵消），边界环逐渐变实（剩下）</li></ul>'+
      '<div class="ex-note">⭐ 这是全页最核心的一幅图：<b>无数分子电流 → 外表面一圈宏观环流</b>，'+
      '中间的每一步都在插图上看得见。</div>'},
    {k:'3',tab:'3. 总场 = 外加磁场 + 磁化磁场',cls:'c3',body:
      '束缚电流产生<b>磁化磁场</b>，空间总场是两者叠加：'+
      '<div class="frm">@{B}′ = µ₀M　　⇒　　@{B} = @{B}₀ + @{B}′　　µ_r = @{B}/@{B}₀</div>'+
      '<ul><li>螺线管式的 @{K}_b 产生沿 +z 的 @{B}′，与 @{B}₀ <b>同向</b></li>'+
      '<li>浅灰直线 = 只有 @{B}₀ 时的场线路径；<b>实线弯掉的部分就是 @{B}′ 的贡献</b></li>'+
      '<li>µ_r &gt; 1 表示介质让磁场变强了（顺磁 / 铁磁）；µ_r = 1 就是没有磁化</li></ul>'+
      '<div class="ex-note">⟶ 拖大 @{B}₀：分子逐渐被"排满"（取向度饱和），@{B}′ 越涨越慢，'+
      'µ_r 随之趋近 1；把 <b>i / r_c</b> 拖大：M 直接涨，@{B}′ 与 µ_r 一起涨。</div>'},
  ],
};
function renderExplain(sec){
  sec.innerHTML='';
  const list=CARDS[state.mode];
  sec.appendChild(h('<div class="sec-title">讲解</div>'));
  const tabs=h('<div class="card-tabs"></div>').firstChild;
  list.forEach(c=>{
    /* ⚠️ 页签名里也有 @{m}/@{K}_b 这类矢量标记 ⇒ 必须过 richHTML，
       否则按钮上会字面显示 "@{m}"（3.1 的页签名是纯文本，没这个坑） */
    const b=h('<button class="card-tab '+c.cls+(c.k===state.cardTab?' on':'')+'">'+richHTML(c.tab)+'</button>').firstChild;
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
/* page1.js 的 t 滑块 after 钩子：进程变化 ⇒ 刷新底部结论与播放按钮文案 */
function syncNotes(){
  const n=document.getElementById('polNote'); if(n) n.innerHTML=richHTML(polNote());
}
function updatePlayBtn(){
  const b=document.getElementById('btnPlay'); if(!b) return;
  b.textContent=(state.anim&&state.anim.playing)?'⏸ 暂停':'▶ 播放全过程';
}

/* ══════════════════════════ 画布下方实时数据条 ══════════════════════════ */
function updateReadout(){
  const strip=document.getElementById('coordStrip'); if(!strip) return;
  if(!state.showReadout){ strip.innerHTML=''; placeLegend(); return; }
  const lgT=document.getElementById('lgTitle'), lgN=document.getElementById('lgNote');
  let html='';
  if(state.mode==='molecular'){
    const m=mMol(), S=Math.PI*Math.pow(state.rC*1e-10,2);
    html += kchip('@{m} = i·S =', (m/1e-24).toFixed(2)+'×10'+supStr(-24)+' A·m²','acc');
    html += kchip('环面积 S = πr_c² =', (S/1e-18).toFixed(2)+'×10'+supStr(-18)+' m²');
    html += kchip('折合玻尔磁子 =', (m/9.2740100783e-24).toFixed(2)+' µ_B');
    html += kchip('全部同向 M = n·m =', (mMax()/1e3).toFixed(1)+' kA/m','warn');
    html += kchip('届时 @{B}′ = µ₀M =', (MU0*mMax()*1e3).toFixed(1)+' mT');
    lgT.textContent='一个分子电流（放大）';
    lgN.innerHTML=richHTML('@{m} = i·S，方向按右手定则；紫线 = 它的磁场（示意比例）');
  } else if(state.mode==='nofield'){
    html += kchip('外加磁场 @{B}₀ =', '0 mT');
    html += kchip('磁化强度 M =', '0 kA/m');
    html += kchip('表面束缚电流 @{K}_b =', '0 kA/m');
    html += kchip('磁化磁场 @{B}′ =', '0 mT');
    html += kchip('总磁场 @{B} =', '0 mT');
    html += kchip('宏观结论 =', '不显磁性','warn');
    lgT.textContent='分子点阵 · 杂乱无章';
    lgN.innerHTML=richHTML('接触点反向抵消 ⇒ M = 0、@{K}_b = 0、@{B}′ = 0');
  } else {
    const B0e=B0eff(), M=Mval(), a=aParam(B0e);
    html += kchip('外场终值 @{B}₀ =', state.B0.toFixed(0)+' mT');
    html += kchip('当前外场 @{B}₀·g =', B0e.toFixed(1)+' mT');
    html += kchip('进程 t =', Math.round(state.t*100)+'%');
    html += kchip('取向度 s（示意）=', (sVis()*100).toFixed(0)+'%');
    html += kchip('真实取向度 L(a) =', (sReal()*100).toExponential(1)+'%');
    html += kchip('M = n·m·s =', (M/1e3).toFixed(1)+' kA/m','warn');
    html += kchip('@{K}_b = M =', (M/1e3).toFixed(1)+' kA/m');
    html += kchip('@{B}′ = µ₀M =', BpMT().toFixed(1)+' mT');
    html += kchip('@{B} = @{B}₀+@{B}′ =', BtMT().toFixed(1)+' mT','acc');
    html += kchip('µ_r = @{B}/@{B}₀ =', isFinite(muR())?muR().toFixed(2):'—');
    lgT.textContent='取向排列 · 磁化 · 总场';
    lgN.innerHTML=richHTML('实线 = @{B}₀+@{B}′；灰直线 = 只有 @{B}₀；橙虚线 = @{B}′');
  }
  strip.innerHTML=html;
  placeLegend();
}
function updateModeTag(){
  const t=document.getElementById('modeTag'); if(!t) return;
  const sb=document.getElementById('moduleSub');
  if(state.mode==='molecular'){
    const m=mMol();
    t.innerHTML=richHTML('① 分子电流 · @{m} = i·S = <b>'+(m/1e-24).toFixed(2)+'×10'+supStr(-24)+
      ' A·m²</b>（'+(m/9.2740100783e-24).toFixed(2)+' µ_B）');
    if(sb) sb.innerHTML=richHTML('磁介质由<b>无数分子电流</b>组成');
  } else if(state.mode==='nofield'){
    t.innerHTML=richHTML('② 无外加磁场 · M = 0 ⇒ <b>不显磁性</b>');
    if(sb) sb.innerHTML=richHTML('无外场：分子电流<b>杂乱无章</b>，宏观互相抵消');
  } else {
    const B0e=B0eff();
    t.innerHTML=richHTML('③ 加外场 · µ_r = <b>'+(isFinite(muR())?muR().toFixed(2):'—')+
      '</b>（@{B} = '+BtMT().toFixed(1)+' mT = '+B0e.toFixed(1)+' + '+BpMT().toFixed(1)+'）');
    if(sb) sb.innerHTML=richHTML('取向排列 ⇒ 表面束缚电流 ⇒ <b>总场 = 外场 + 磁化场</b>');
  }
}

/* ══════════════════════════════ 主循环 ══════════════════════════════ */
let needsRender=true;
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
    loopPhase=(loopPhase+dt*0.28)%1;               /* 分子环上滑落的小箭头（只表方向） */
    if(state.anim){
      const r=stepAnim(dt);
      if(r==='end'){ updatePlayBtn(); syncNotes(); updateReadout(); updateModeTag(); }
      else if(r) { syncNotes(); updateReadout(); updateModeTag(); }
    }
    needsRender=true;                               /* 环上箭头在动 ⇒ 每帧都要重画 */
    if(state.autoRotate){ cam.az+=0.0045; }
    draw();
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
  if(save){ try{ localStorage.setItem('em42-panel-w', String(w)); }catch(e){} }
  return w;
}
(()=>{ let v=0; try{ v=parseInt(localStorage.getItem('em42-panel-w')||'0',10)||0; }catch(e){}
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
   ★ 每个页签有自己的预设（分子尺寸 / 外场与进程）⇒ 每个演示的起点都可复现。 */
const MT=[{k:'molecular', t:'① 分子电流'},
          {k:'nofield',  t:'② 无外加磁场'},
          {k:'poling',   t:'③ 加外场 · 磁化 · 总场'}];
const modeTabs=document.getElementById('modeTabs');
MT.forEach(m=>{const b=document.createElement('button');b.textContent=m.t;b.dataset.k=m.k;
  b.onclick=()=>{ stopAnim(); state.mode=m.k; state.cardTab='1';
    Object.assign(state, JSON.parse(JSON.stringify(PRESET[m.k])));
    clampState();                       /* ★ 见 phys.js：防"按钮把量设到量程外"的静默不一致 */
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
tick(0);
