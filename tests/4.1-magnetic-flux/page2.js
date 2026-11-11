/* ============================================================================
   4.1 磁感应强度与磁通量 —— 页面专属（二）
   讲解卡 / 面板装配 / 画布下方数据条 / 主循环 / 交互 / 页签
   ----------------------------------------------------------------------------
   ⚠️ 所有进 DOM 的串都必须过 richHTML()（只认 @{...} 与 _x，**不认 Markdown 星号**）。
   ⚠️ page1.js 里被引用的符号（本文件负责定义）：
      renderPanel / updateReadout / updateModeTag / updateAll / needsRender /
      draw / tick / resize / NAV / CARDS
   ============================================================================ */
const CARDS={
  ampere:[
    {k:'1',tab:'1. 相吸与相斥',cls:'c1',body:
      '两根导线并排放、都通电，它们会互相推或拉。实验结果只有一句话：'+
      '<div class="frm">同向电流相吸，反向电流相斥</div>'+
      '<ul><li>把 <b>I₂ 的滑块拖过 0</b>（或点「翻转 I₂ 的符号」）：力的箭头立刻掉头，<b>大小一点不变</b></li>'+
      '<li>两根导线受到的力<b>等大反向</b>（牛顿第三定律），画面上两支橙箭头就是这样'+
      '（F₂₁ 与 F₁₂）</li>'+
      '<li>把 <b>d 拖小</b>：力迅速变大（按 1/d）；把 <b>L 拖大</b>：力按比例变大</li></ul>'+
      '<div class="ex-note">⚠️ 力不是"电流和电流直接拉"，中间<b>隔着一层场</b> —— '+
      '下一张卡把它拆成两步。</div>'},
    {k:'2',tab:'2. 力的来源',cls:'c2',body:
      '把"两根导线互相作用"拆成两件事：'+
      '<div class="frm">① 导线 1 在自己周围产生 @{B}₁　→　② 导线 2 在 @{B}₁ 里受力 @{F} = @{I}₂d@{l}₂ × @{B}₁</div>'+
      '<ul><li>画面上<b>半径正好等于 d 的那一圈圆恰好穿过导线 2</b> —— 那里的 @{B}₁₂ 就沿圆的切向</li>'+
      '<li>叉乘现场：d@{l}₂ 沿 +z、@{B}₁₂ 沿 −ŷ ⇒ @{F} 沿 +x，<b>正指向导线 1</b> ⇒ 相吸</li>'+
      '<li>翻转 @{I}₂ ⇒ d@{l}₂ 反号 ⇒ @{F} 反号 ⇒ 相斥。<b>方向全由叉乘定，不用背</b></li></ul>'+
      '<div class="ex-note">⭐ 这就是引入"场"的全部价值：<b>把两个电流之间的作用，'+
      '拆成"产生场"和"在场中受力"两件独立的事</b>。② 页签单独看第一件事。</div>'},
    {k:'3',tab:'3. 定量与量级',cls:'c3',body:
      '两根无限长平行导线之间，单位长度上的力：'+
      '<div class="frm">F/L = µ₀I₁I₂/(2πd) = 2×10⁻⁷ · I₁I₂ / d</div>'+
      '<ul><li>默认参数（10 A、10 A、d = 0.050 m）：F/L ≈ <b>400 µN/m</b> —— 确实很小</li>'+
      '<li>但短路电流上万安时，母线之间的电动力能以<b>吨</b>计 ⇒ 开关柜里必须加固支撑</li>'+
      '<li>那个 2×10⁻⁷ 就是 µ₀/2π —— 它曾是"安培"这个单位的定义来源</li></ul>'+
      '<div class="ex-note">💡 卡片里的 F 与 F/L 都按<b>真实值</b>算；画面上的橙箭头长度是'+
      '线性映射后再截在上下限内（只为看得见，别拿它当尺子）。</div>'},
  ],
  field:[
    {k:'1',tab:'1. 右手螺旋',cls:'c1',body:
      '<div class="frm">右手握住导线，拇指顺电流方向，四指绕的方向就是 @{B} 的方向</div>'+
      '<ul><li>@{B} 绕导线成<b>一圈一圈的闭合圆</b>：圆心在导线上、圆面垂直于导线</li>'+
      '<li>用柱坐标写：@{B} = (µ₀I/2πρ)·φ̂ —— <b>只有 φ 分量</b>，没有 ρ、z 分量</li>'+
      '<li>翻转电流 ⇒ 每一圈圆上的箭头同时反向</li></ul>'+
      '<div class="ex-note">⚠️ 别把这些圆圈看成"电场的涟漪"：磁感线<b>本来就是闭合的</b>'+
      '（④ 页签的 ∮@{B}·dS = 0 就靠这个）。</div>'},
    {k:'2',tab:'2. 1/r 衰减',cls:'c2',body:
      '<div class="frm">B = µ₀I/(2πr)　⇒　r 翻倍，B 减半</div>'+
      '<ul><li>方格上的箭头<b>一圈圈转起来</b>就是环绕导线，<b>近长远短</b>就是 1/r：'+
      'r = 0.100 / 0.160 / 0.250 m 处约 20.0 / 12.5 / 8.0 µT（默认 I = 10 A）</li>'+
      '<li>拖 <b>r</b> 滑块让 P 点在三圈之间走：卡片读数与箭头长度同步变</li>'+
      '<li>长直导线的场是<b>二维场</b>：沿导线方向平移，什么都不变</li></ul>'+
      '<div class="ex-note">💡 与点电荷的 1/r² 对比记：<b>球对称 ⇒ 1/r²；轴对称（线）⇒ 1/r</b>。'+
      '两者都是"通量摊在一个面上"的结果。</div>'},
    {k:'3',tab:'3. @{B} 的定义',cls:'c3',body:
      '上一张卡给了公式，但"@{B} 到底是什么"要靠受力来定义：'+
      '<div class="frm">B ≡ F_max /(I·dl)　　单位 T = N/(A·m)</div>'+
      '<ul><li>把一小段电流元放进场里，量它受到的<b>最大</b>力 —— 最大发生在 d@{l} ⊥ @{B} 时</li>'+
      '<li>P 点三支箭头：d@{l}₂（红，+z）、@{B}（蓝，切向）、@{F}（橙）—— <b>三者两两垂直</b></li>'+
      '<li>d@{l}₂ 与导线同向 ⇒ @{F} 指向导线 ⇒ 正好回勾 ① 页签的"同向相吸"</li></ul>'+
      '<div class="ex-note">⭐ 顺序很重要：<b>先有力，才有 @{B} 的定义</b>。@{B} 不是"想象出来的箭头"，'+
      '它是"单位电流元最多能受多大力"。</div>'},
  ],
  flux:[
    {k:'1',tab:'1. 数线根数',cls:'c1',body:
      '<div class="frm">Φ = B·A·cos θ　　单位 Wb（1 T·m² = 1 Wb）</div>'+
      '<ul><li><b>θ = 0°</b>（面垂直于场）：全穿，5 根</li>'+
      '<li><b>θ = 60°</b>：打折，3 根</li>'+
      '<li><b>θ = 90°</b>（面平行于场）：<b>一根不穿</b></li></ul>'+
      '<div class="ex-note">💡 单位按课堂习惯取 mT / dm² / mWb，数字好念：'+
      '40 mT × 1.2 dm² = <b>0.48 mWb</b>。板书时保留一次 1 T·m² = 1 Wb 的换算。</div>'+
      '<div class="ex-note">⚠️ 根数是<b>离散示意</b>（一行固定 13 根），Φ 是连续精确值；'+
      '线足够密时两者才一致 —— 学生若抠这一点，那正是"取极限"的加分题。</div>'},
    {k:'2',tab:'2. Φ=0 场还在',cls:'c2',body:
      '把面转到与场平行，画面上的 <b>13 根场线一根都没少</b>，只是没有一根被打中：'+
      '<div class="frm">Φ = B·A·cos 90° = 0，而 B ≠ 0</div>'+
      '<ul><li>类比：雨中把伞面转成与雨平行 —— <b>雨没停，只是没落到伞上</b></li>'+
      '<li>所以"Φ = 0"绝不能读成"这里没有磁场"</li>'+
      '<li>伏笔：法拉第定律里起作用的是 <b>dΦ/dt</b>，不是 Φ 本身（第 5 章）</li></ul>'+
      '<div class="ex-note">★ 这一句是本节最容易被学生记反的地方，所以页面上做成了按钮：'+
      '按「θ=90°」，看读数归零而箭头不变。</div>'},
    {k:'3',tab:'3. 负号是记账',cls:'c3',body:
      '把面继续转过去，Φ 变负。负的<b>不是"负的磁场"</b>：'+
      '<div class="frm">约定：从法线 n̂ 那一面穿出记为正 ⇒ 反向穿出就是负</div>'+
      '<ul><li>Φ 是<b>代数和</b>：穿出加、穿入减（画面上的"净根数"就是它）</li>'+
      '<li>把 n̂ 翻个方向，Φ 立刻变号 —— 说明 <b>Φ 的正负依赖人为约定的正方向</b></li>'+
      '<li>伏笔：电磁感应里 Φ 由正变负的过程，正是感应电动势出现的时候</li></ul>'+
      '<div class="ex-note">💡 页面初始就停在 <b>120°</b>（负通量区）—— 先让学生看到 Φ < 0 '+
      '并解释它，再拖回 0° / 90°，顺序反了就没有这个冲击。</div>'},
  ],
  closed:[
    {k:'1',tab:'1. 磁感线闭合',cls:'c1',body:
      '球内放一个小电流环，它的场线<b>一圈一圈闭合</b>，无头无尾：'+
      '<div class="frm">∮@{B}·dS = 0　（磁场的高斯定理）</div>'+
      '<ul><li>任何一条线只要穿进球面，就<b>一定从另一处穿出去</b>：'+
      '绿点（穿出）与玫红点（穿入）<b>成对出现</b></li>'+
      '<li>把 <b>R 从最小拖到最大</b>：<b>4 进 4 出，一个数都不变</b></li>'+
      '<li>把球挪到别处、捏成别的形状，结论也不变 —— 只要它是闭合面</li></ul>'+
      '<div class="ex-note">⚠️ 关键在于：这条定理的成立<b>完全不依赖于面里面有什么</b>。'+
      '球里放磁铁、放电线、什么都不放，∮@{B}·dS 都是 0。</div>'},
    {k:'2',tab:'2. 电力线有端点',cls:'c2',body:
      '同一张图的另一侧，把一个 +Q 包进闭合面：'+
      '<div class="frm">∮@{D}·dS = Q内　（第 2 章的高斯定理）</div>'+
      '<ul><li>6 根电力线全部<b>从电荷发出</b>：6 出 0 进 ⇒ 净 6 ≠ 0</li>'+
      '<li>这是"有源"：电荷是电力线的<b>源头</b>，线在电荷处<b>起头</b></li>'+
      '<li>磁感线没有源头 ⇒ 净通量恒为 0 ⇒ <b>不存在磁荷</b></li></ul>'+
      '<div class="ex-note">★ 两边的差别不在数学，在<b>场线有没有端点</b>：'+
      '这一句话就是本节要学生记住的全部。</div>'},
    {k:'3',tab:'3. 为何必须闭合',cls:'c3',body:
      '追问到底（口头考核的最后一问）：'+
      '<ul><li>因为至今<b>没有找到磁单极子</b>：磁铁掰成两半，每一半都有 N 和 S；'+
      'N、S 总是成对出现</li>'+
      '<li>电荷可以单独存在（电力线有纯源头），<b>磁极不行</b></li>'+
      '<li>所以 ∮@{B}·dS ≡ 0 不是数学巧合，而是"没有磁荷"这件事的数学表述</li></ul>'+
      '<div class="frm">假如哪天真找到磁单极子：∮@{B}·dS = µ₀Q_m —— 高斯定理就得改写</div>'+
      '<div class="ex-note">⟶ 那样麦克斯韦方程组会变得<b>完全对称</b>（第 6 章）。'+
      '这是物理学最美的一处伏笔，也是整套方程组里唯一一处"不对称"的来源。</div>'},
  ],
};
function renderExplain(sec){
  sec.innerHTML='';
  const list=CARDS[state.mode];
  sec.appendChild(h('<div class="sec-title">讲解</div>'));
  const tabs=h('<div class="card-tabs"></div>').firstChild;
  list.forEach(c=>{
    /* ⚠️ 页签名里也有 @{F}/@{B} 这类矢量标记 ⇒ 必须过 richHTML，否则按钮上字面显示 "@{F}" */
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
/* ⚠️ 图例（.cv-legend）是 absolute + bottom:14px，而 .canvas-card 里还有一条数据条（.coord-strip）
   也贴在底部 ⇒ 图例默认会压住数据条。修法：bottom = 数据条高度 + 14。 */
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
  if(state.mode==='ampere'){
    const B=bLine(state.I1,state.d), FL=fPerLen(state.I1,state.I2,state.d), F=FL*state.La;
    html += kchip('I₁ =', fmtI(state.I1));
    html += kchip('I₂ =', fmtI(state.I2)+'（'+(noCurrent()?'有一根为 0':(sameDir()?'同号':'异号'))+'）');
    html += kchip('d =', state.d.toFixed(3)+' m');
    html += kchip('L =', state.La.toFixed(2)+' m');
    html += kchip('B₁₂ = µ₀|I₁|/(2πd) =', fmtSmart(B*1e6,'µT'),'acc');
    html += kchip('F/L =', fmtSmart(FL*1e6,'µN/m'));
    html += kchip('F =', fmtSmart(F*1e6,'µN'),'warn');
    html += kchip('方向 =', noCurrent()?'无作用力':(sameDir()?'相吸':'相斥'));
    lgT.textContent='安培力 · 两根平行导线';
    lgN.innerHTML=richHTML('蓝圈 = @{B}₁；蓝箭头 = 导线 1 在导线 2 处的 @{B}₁₂；橙箭头 = 安培力');
  } else if(state.mode==='field'){
    const B=bLine(state.If,state.rp);
    html += kchip('I =', state.If.toFixed(1)+' A');
    html += kchip('r =', state.rp.toFixed(3)+' m');
    html += kchip('B = µ₀I/(2πr) =', fmtSmart(B*1e6,'µT'),'acc');
    html += kchip('r=0.100 m 处 =', fmtSmart(bLine(state.If,0.100)*1e6,'µT'));
    html += kchip('r=0.160 m 处 =', fmtSmart(bLine(state.If,0.160)*1e6,'µT'));
    html += kchip('r=0.250 m 处 =', fmtSmart(bLine(state.If,0.250)*1e6,'µT'));
    lgT.textContent='长直导线的磁场';
    lgN.innerHTML=richHTML('蓝箭头 = @{B}；红 = 测试电流元 d@{l}₂；橙 = 力 @{F}（指向导线）');
  } else if(state.mode==='flux'){
    const c=Math.cos(state.th*D2R), n=piercingXs(state.th,state.A3).length;
    html += kchip('θ =', state.th.toFixed(0)+'°');
    html += kchip('B =', state.B3.toFixed(0)+' mT');
    html += kchip('A =', state.A3.toFixed(2)+' dm²');
    html += kchip('cos θ =', (c<0?'−':'')+Math.abs(c).toFixed(3));
    html += kchip('Φ_max = B·A =', fluxM(state.B3,state.A3,0).toFixed(3)+' mWb');
    html += kchip('Φ =', (fluxM(state.B3,state.A3,state.th)<0?'−':'')+
      Math.abs(fluxM(state.B3,state.A3,state.th)).toFixed(3)+' mWb','acc');
    html += kchip('穿过根数 =', n+' / 13');
    lgT.textContent='磁通量 · 穿过一个面';
    lgN.innerHTML=richHTML('蓝线 = @{B} 场线（加粗的才算穿过面）；紫箭头 = 面法线 n̂');
  } else {
    const st=crossStats(state.R4);
    html += kchip('R =', state.R4.toFixed(3)+' m');
    html += kchip('磁感线：出 / 入 =', st.mOut+' / '+st.mIn);
    html += kchip('净根数 =', String(st.mNet),'acc');
    html += kchip('∮@{B}·dS =', '0 Wb','acc');
    html += kchip('电力线：出 / 入 =', st.eOut+' / '+st.eIn);
    html += kchip('净根数 =', String(st.eNet),'warn');
    html += kchip('∮@{D}·dS = Q内 =', '+2.00 nC','warn');
    lgT.textContent='闭合面的磁通量';
    lgN.innerHTML=richHTML('绿点 = 穿出，玫红点 = 穿入；磁感线上成对、电力线上只有绿点');
  }
  strip.innerHTML=html;
  placeLegend();
}
function updateModeTag(){
  const t=document.getElementById('modeTag'); if(!t) return;
  const sb=document.getElementById('moduleSub');
  if(state.mode==='ampere'){
    const F=fTotal(state.I1,state.I2,state.d,state.La);
    t.innerHTML=richHTML('① 安培力 · F = <b>'+fmtSmart(F*1e6,'µN')+'</b>'+
      '（'+(noCurrent()?'有一根为 0 ⇒ 无作用力':(sameDir()?'同号 ⇒ 相吸':'异号 ⇒ 相斥'))+'）');
    if(sb) sb.innerHTML=richHTML('两根平行载流导线：<b>同向相吸、反向相斥</b>');
  } else if(state.mode==='field'){
    const B=bLine(state.If,state.rp);
    t.innerHTML=richHTML('② 磁感应强度 · B = <b>'+fmtSmart(B*1e6,'µT')+'</b>'+
      '（r = '+state.rp.toFixed(3)+' m）');
    if(sb) sb.innerHTML=richHTML('长直导线周围：<b>方向右手螺旋、大小 1/r</b>');
  } else if(state.mode==='flux'){
    const f=fluxM(state.B3,state.A3,state.th);
    t.innerHTML=richHTML('③ 磁通量 · Φ = <b>'+(f<0?'−':'')+Math.abs(f).toFixed(3)+' mWb</b>'+
      '（θ = '+state.th.toFixed(0)+'°）');
    if(sb) sb.innerHTML=richHTML('数穿过面的磁感线：<b>Φ = B·A·cos θ</b>');
  } else {
    const st=crossStats(state.R4);
    t.innerHTML=richHTML('④ 闭合面 · ∮@{B}·dS = <b>0</b>，∮@{D}·dS = <b>Q内</b>'+
      '（磁感线 '+st.mIn+' 进 '+st.mOut+' 出）');
    if(sb) sb.innerHTML=richHTML('磁感线闭合 ⇒ <b>进多少出多少</b>');
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
   任何一帧抛异常 ⇒ 整个渲染循环永久停摆（症状是"画面卡住、点什么都没反应"）。
   ★ 本页的场景是静态的 ⇒ 只在 needsRender 时才重画（省电，也避免无谓的排序）。 */
function tick(ts){
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
document.getElementById('btnViewReset').onclick=()=>{
  const c=CAM41[state.mode]; cam.az=c.az; cam.el=c.el; cam.zoom=1; cam.px=0; cam.py=0; needsRender=true; };
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
  if(save){ try{ localStorage.setItem('em41-panel-w', String(w)); }catch(e){} }
  return w;
}
(()=>{ let v=0; try{ v=parseInt(localStorage.getItem('em41-panel-w')||'0',10)||0; }catch(e){}
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
   ★ 每个页签有自己的预设 + 自己的取景 ⇒ 每个演示的起点都可复现。
     ✓ el 的选择是"看得见那个物理要点"：① 低俯视看两根导线分开；
       ② 抬高看水平圆变成椭圆；③ 中等俯视看面怎么翻；④ 两球并排不叠。 */
const CAM41={
  ampere:{az:0.62, el:0.34, zoom:1},
  field: {az:0.62, el:0.55, zoom:1},
  flux:  {az:0.62, el:0.42, zoom:1},
  closed:{az:0.62, el:0.38, zoom:1},
};
const MT=[{k:'ampere', t:'① 安培力'},
          {k:'field',  t:'② 磁感应强度'},
          {k:'flux',   t:'③ 磁通量'},
          {k:'closed', t:'④ 闭合面的磁通量'}];
const modeTabs=document.getElementById('modeTabs');
MT.forEach(m=>{const b=document.createElement('button');b.textContent=m.t;b.dataset.k=m.k;
  b.onclick=()=>{ state.mode=m.k; state.cardTab='1';
    Object.assign(state, JSON.parse(JSON.stringify(PRESET[m.k])));
    clampState();                       /* ★ 见 phys.js：防"按钮把量设到量程外"的静默不一致 */
    syncModeTabs();
    const c=CAM41[m.k]; cam.az=c.az; cam.el=c.el; cam.zoom=c.zoom; cam.px=0; cam.py=0;
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
