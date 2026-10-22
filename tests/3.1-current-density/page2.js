/* ============================================================================
   3.1 电流的分类 —— 页面专属（二）：讲解卡 / 面板装配 / 数据条 / 主循环 / 交互
   ⚠️ 所有进 DOM 的串都必须过 richHTML()（只认 @{...} 与 _x，**不认 Markdown 星号**）。
   ============================================================================ */
const CARDS={
  volume:[
    {k:'1',tab:'1. 定义：单位时间垂直穿过单位面积',cls:'c1',body:
      '<b>体电流</b>指点电荷充满了<b>一块体积</b>（例如一段圆柱形导体）。电流要"穿过"的东西因此是一个<b>面</b>'+
      '—— 导体的<b>横截面</b>。于是密度要<b>再除一次面积</b>：'+
      '<div class="frm">J = dI/dS = dq/(dt·dS⊥)　　单位 A/m²</div>'+
      '<ul><li>本页的单位制让读数<b>数值上就是 ρ·u</b>：ρ 用 µC/m³、u 用 mm/s 时，'+
      'J 的数值 = ρ × u，单位 nA/m²</li>'+
      '<li>直观版：导体里<b>单位长度</b>的电荷是 ρ·S，它整段穿过截面要用时 1/u ⇒ '+
      '<b>单位时间穿过的电荷 = ρ·S·u</b>，再除掉 S 就是 ρ·u</li>'+
      '<li>把 <b>ρ 或 u 拖大一倍，J 精确翻一倍</b>（面板上有现成的翻倍按钮）</li></ul>'+
      '<div class="ex-note">对照 2.1：那里的 ρ / σ / τ 是<b>电荷</b>按体 / 面 / 线三种分布的量；'+
      '本页的 J / K / I 是<b>电流</b>按同样三种分布的量 —— 结构完全平行。</div>'},
    {k:'2',tab:'2. 为什么必须乘 cosθ',cls:'c2',body:
      '<b>J 是矢量</b>，方向规定为<b>正电荷</b>漂移的方向。把一个面元<b>倾斜</b> θ 角之后：'+
      '<div class="frm">dS⊥ = dS·cosθ　　⇒　穿过面元的电流 = J·dS·cosθ</div>'+
      '<ul><li>θ = 0°（面元正对漂移方向）⇒ 全部算数，电流最大</li>'+
      '<li>θ = 60° ⇒ 只剩一半；θ → 90° ⇒ <b>恰好为 0</b>：'+
      '电荷顺着面元<b>擦过去</b>，一个也不穿过</li>'+
      '<li>这正是把面元写成<b>矢量面元</b> d@{S} = n̂dS 的原因：'+
      'J·d@{S} 这个点积自动把 cosθ 带了进去</li></ul>'+
      '<div class="ex-note">⟶ 拖大 <b>θ</b> 滑块，看右上方卡片里「垂直投影 dS⊥」与「穿过 dS 的电流」'+
      '两行<b>同步往下掉</b> —— 掉的就是 cosθ。</div>'},
    {k:'3',tab:'3. 从密度回到总电流：I = ∬ J·dS',cls:'c3',body:
      '<b>密度是"逐点 / 逐块"的量，总电流要重新积分回来：</b>'+
      '<div class="frm">I = ∬_S @{J}·d@{S}</div>'+
      '<ul><li>本页导体里 J 处处相等（ρ、u 都是常数）⇒ '+
      '<b>I = J·S = J·πa²</b>，滑块上直接看得到</li>'+
      '<li>把 <b>半径 a</b> 拖大：S 按 a² 涨，I 也按 a² 涨（不是线性）</li>'+
      '<li>把 <b>面元 dS</b> 拖大：穿过<b>那一小块</b>的电流按 dS⊥ 涨，'+
      '但<b>总电流 I 一点不变</b> —— 面元只是"取哪一块来看"，不影响整根导体</li></ul>'+
      '<div class="ex-note">⚠️ 这句话是后面所有页的地基：<b>通量 / 电流都是"整块面"的事</b>，'+
      '而 J 是"每一点"的事。② 页的线元、③ 页的点，都是同一个道理的退化版。</div>'},
  ],
  surface:[
    {k:'1',tab:'1. 横截面退化成一条线',cls:'c1',body:
      '<b>面电流</b>指电荷只分布在<b>一个面</b>上（例如圆柱形导体的薄壳、或者一张金属箔）。'+
      '电流要"穿过"的东西不再是面，而是这条面被切开后的<b>一条线</b>：'+
      '<div class="frm">K = dI/dl　　单位 A/m</div>'+
      '<ul><li>圆柱壳的<b>横截线</b>就是 z = 0 处的那一圈<b>圆周</b>，长度 l = 2πb</li>'+
      '<li>本页同样让读数<b>数值上就是 σ·u</b>（σ 用 µC/m²、u 用 mm/s ⇒ nA/m）</li>'+
      '<li>把 <b>壳半径 b</b> 拖大 ⇒ 横截线 l = 2πb 变长 ⇒ 总电流 I = K·l 跟着变大</li></ul>'+
      '<div class="ex-note">⚠️ 常见错误：把面电流的"线"理解成"电流沿着一条线流"。'+
      '恰恰相反 —— 电流是<b>沿着面</b>铺开流的，被"穿过"的才是那条线。</div>'},
    {k:'2',tab:'2. K 也是矢量，也要看垂直分量',cls:'c2',body:
      '<b>K 与 J 一样是矢量</b>，方向是面上正电荷漂移的方向：'+
      '<div class="frm">K = σ·u　，　K 的方向 = 面上正电荷漂移方向</div>'+
      '<ul><li>横截线上取一小段 <b>dl</b>：只有<b>垂直于 dl</b> 的那部分漂移才"穿过"它</li>'+
      '<li>本页壳上的电流沿轴向（+z），而横截线是圆周方向 ⇒ <b>本来就处处垂直</b>，'+
      '所以画面上直接就是 K·dl，不必再乘 cos</li>'+
      '<li>若让电流斜着流过一张箔，就要写成 K·(n̂ × dl) —— 与 J·d@{S} 是同一个思想降一维</li></ul>'+
      '<div class="ex-note">⟶ 拖 <b>dl</b> 滑块：占整条横截线的百分比、穿过它的电流，<b>严格成正比</b>。</div>'},
    {k:'3',tab:'3. 从 J 到 K：把体积压成一个面',cls:'c3',body:
      '<b>面电流不是新东西，是体电流被压薄后的样子：</b>'+
      '<div class="frm">厚度 δ 的薄层：σ = ρ·δ　⇒　K = σ·u = J·δ</div>'+
      '<ul><li>δ → 0 就是理想的面电流（电荷无限薄地贴在一个面上）</li>'+
      '<li>于是 <b>K 与 J 的单位正好差一个长度</b>：A/m 对 A/m²</li>'+
      '<li>反过来，已知 K 和 δ 也能还原出等效的 J —— 工程上常这么处理'+
      '"铜皮里的电流"（皮肤效应就是一例）</li></ul>'+
      '<div class="ex-note">⭐ 记住这条退化链：<b>体 → 面 → 线</b>，'+
      '每一步把电荷分布的维度减一，电流密度的定义口径<b>一步都没变</b>：'+
      '永远是"单位时间、垂直穿过、单位几何量"。</div>'},
  ],
  line:[
    {k:'1',tab:'1. 横截面退化成一个点',cls:'c1',body:
      '<b>线电流</b>指电荷只在<b>一条线</b>上流动（细导线就是它的理想模型）。'+
      '截面已经退化成一个<b>点</b>，再也没有可除的几何量：'+
      '<div class="frm">I = dq/dt　　单位 A</div>'+
      '<ul><li>读法就是最朴素的那句：<b>单位时间内，垂直穿过这一个点的电荷量</b></li>'+
      '<li>本页读数<b>数值上就是 τ·u</b>（τ 用 µC/m、u 用 mm/s ⇒ nA）</li>'+
      '<li>载流子沿导线一个个流过那个点 —— 每流过一个，就有一份 τ·L/N 的电荷穿过去</li></ul>'+
      '<div class="ex-note">⚠️ "穿过一个点"不是说不占空间，而是说：'+
      '<b>在这一页里我们不再区分导线内部的位置</b>，整根线对电流的贡献已经缩成一个数。</div>'},
    {k:'2',tab:'2. 三条公式，同一个模子',cls:'c2',body:
      '<b>三个页签的公式其实是同一个：</b>'+
      '<div class="frm">J = ρ·u　（A/m²）　　K = σ·u　（A/m）　　I = τ·u　（A）</div>'+
      '<ul><li>差别<b>只在电荷密度的量纲</b>：ρ 除过体积、σ 除过面积、τ 只除过长度</li>'+
      '<li>共同结构永远是：<b>单位长度里的电荷 × 速度</b>'+
      '（= 单位时间垂直穿过的电荷）</li>'+
      '<li>所以三者的单位必然差一个几何量：A/m² → A/m → A</li></ul>'+
      '<div class="ex-note">左下角那块「三级阶梯」画的就是这件事 —— '+
      '同一个式子，三种量纲，定义的口径从头到尾没有变过。</div>'},
    {k:'3',tab:'3. 同一根导体，三种说法',cls:'c3',body:
      '<b>同一个电流，可以按三种口径报出来，它们严格相等：</b>'+
      '<div class="frm">I = ∬_S @{J}·d@{S} = ∮_l @{K}·dl = τ·u</div>'+
      '<ul><li>右上方卡片里 <b>J = I/S、K = I/l、I</b> 三行就是同一个 I 的三种摊法</li>'+
      '<li>其中的 S、l 用的是 ①② 页签的 a、b —— 切回去改那两个滑块，'+
      '这三行会跟着变，但三者<b>始终彼此自洽</b></li>'+
      '<li>均匀时更简单：I = J·πa² = K·2πb = τ·u</li></ul>'+
      '<div class="ex-note">⟶ 这一页是 3.1 的小结：电流分体 / 面 / 线三种，'+
      '<b>分的只是电荷分布的维度</b>；"单位时间垂直穿过单位面积 / 长度 / 点的电荷量"'+
      '这一句定义，对三者一字不差地通用。</div>'},
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
  if(state.mode==='volume'){
    const J=Jval(), S=Math.PI*state.a*state.a, perp=state.dS*Math.cos(state.th*D2R);
    html += kchip('J = ρ·u =', J.toFixed(2)+' nA/m²','acc');
    html += kchip('横截面 S = πa² =', S.toFixed(3)+' m²');
    html += kchip('总电流 I = J·S =', ItotV().toFixed(2)+' nA','warn');
    html += kchip('面元 dS =', state.dS.toFixed(3)+' m²');
    html += kchip('倾角 θ =', state.th.toFixed(0)+'°');
    html += kchip('dS⊥ = dS·cosθ =', perp.toFixed(3)+' m²');
    html += kchip('穿过 dS 的电流 =', IelemV().toFixed(3)+' nA','acc');
    html += kchip('载流子过整截面 =', rateV().toFixed(2)+' 个/s');
    lgT.textContent='体电流：穿过一个面';
    lgN.innerHTML=richHTML('J = ρ·u（A/m²）　·　只有垂直于面元的分量算数 ⇒ 乘 cosθ');
  } else if(state.mode==='surface'){
    const K=Kval(), l=2*Math.PI*state.b;
    html += kchip('K = σ·u =', K.toFixed(2)+' nA/m','acc');
    html += kchip('横截线 l = 2πb =', l.toFixed(3)+' m');
    html += kchip('总电流 I = K·l =', ItotS().toFixed(2)+' nA','warn');
    html += kchip('线元 dl =', state.dl.toFixed(2)+' m');
    html += kchip('dl 占横截线 =', (state.dl/l*100).toFixed(1)+' %');
    html += kchip('穿过 dl 的电流 =', IelemS().toFixed(3)+' nA','acc');
    html += kchip('载流子过整条线 =', rateS().toFixed(2)+' 个/s');
    lgT.textContent='面电流：穿过一条线';
    lgN.innerHTML=richHTML('K = σ·u（A/m）　·　横截面从「面积」退化成「长度」');
  } else {
    const I=Ival(), S=Math.PI*state.a*state.a, l=2*Math.PI*state.b;
    html += kchip('I = τ·u =', I.toFixed(2)+' nA','acc');
    html += kchip('摊成体电流 J = I/S =', (I/S).toFixed(3)+' nA/m²');
    html += kchip('摊成面电流 K = I/l =', (I/l).toFixed(3)+' nA/m');
    html += kchip('线电流口径 I =', I.toFixed(2)+' nA','warn');
    html += kchip('载流子过该点 =', rateL().toFixed(2)+' 个/s');
    lgT.textContent='线电流：穿过一个点';
    lgN.innerHTML=richHTML('I = τ·u（A）　·　J·πa² = K·2πb = I，三种口径同一个电流');
  }
  strip.innerHTML=html;
  placeLegend();
}
function updateModeTag(){
  const t=document.getElementById('modeTag'); if(!t) return;
  const sb=document.getElementById('moduleSub');
  if(state.mode==='volume'){
    t.innerHTML=richHTML('① 体电流 · J = ρu = <b>'+Jval().toFixed(2)+' nA/m²</b>　'+
      '穿过横截面 S = '+ (Math.PI*state.a*state.a).toFixed(3) +' m²');
    if(sb) sb.innerHTML=richHTML('电荷充满一块体积 ⇒ 穿过<b>横截面</b> ⇒ 电流密度 J（A/m²）');
  } else if(state.mode==='surface'){
    t.innerHTML=richHTML('② 面电流 · K = σu = <b>'+Kval().toFixed(2)+' nA/m</b>　'+
      '穿过横截线 l = '+(2*Math.PI*state.b).toFixed(3)+' m');
    if(sb) sb.innerHTML=richHTML('电荷分布在一个面上 ⇒ 穿过<b>横截线</b> ⇒ 电流密度 K（A/m）');
  } else {
    t.innerHTML=richHTML('③ 线电流 · I = τu = <b>'+Ival().toFixed(2)+' nA</b>　'+
      '穿过<b>横截点</b>，不再除任何几何量');
    if(sb) sb.innerHTML=richHTML('电荷分布在一条线上 ⇒ 穿过<b>一个点</b> ⇒ 电流 I（A）');
  }
}

/* ══════════════════════════════ 主循环 ══════════════════════════════ */
let needsRender=true;
const DRIFT_SPEED = 30;        /* ⏱ 载流子动画按真实速度的 30 倍走，纯粹为了看得见。
                                  读数（含"载流子过整截面 个/s"）一律按滑块上的真实 u 算。 */
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
    state.drift += state.u*1e-3*dt*DRIFT_SPEED;
    if(state.drift>1e6) state.drift%=1;              /* 防累积溢出 */
    needsRender=true;                                 /* 载流子在动 ⇒ 每帧都要重画 */
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
/* ★ 面元拖动：指针落在面元中心 30px 内 ⇒ 按住拖的是面元，否则才是相机旋转/平移。
   屏幕位移 → 世界位移：Δp·camU = Δsx/cs、Δp·camV = −Δsy/cs（pr 的逆映射）。 */
const ELEM_HIT_PX=30;
function elemScreenNear(m){
  if(state.mode!=='volume'||!state.show.elem) return false;
  const s=pr(elemCenter());
  return Math.hypot(m.x-s.x,m.y-s.y)<=ELEM_HIT_PX;
}
canvas.addEventListener('pointerdown',ev=>{
  try{ canvas.setPointerCapture(ev.pointerId); }catch(e){}
  const m=localPos(ev);
  if(ev.button===0 && !ev.ctrlKey && elemScreenNear(m)){
    drag={x:m.x,y:m.y,btn:ev.button,mode:'elem'};
    canvas.style.cursor='grabbing';
  } else {
    drag={x:m.x,y:m.y,btn:ev.button,mode:(ev.button===2||ev.ctrlKey)?'pan':'rot'};
  }
  ev.preventDefault();
});
canvas.addEventListener('pointermove',ev=>{
  const m=localPos(ev);
  if(!drag){ canvas.style.cursor=elemScreenNear(m)?'grab':''; return; }
  const dx=m.x-drag.x, dy=m.y-drag.y; drag.x=m.x; drag.y=m.y;
  if(drag.mode==='elem'){
    /* 世界位移 → 盘内比例坐标。盘内坐标：竖放 = (world.x, world.y)；
       放倒后面元在 x=0 盘（elemCenter = (0, fy·a, −fx·a)）⇒ fx = −world.z/a */
    const wx=(dx/camScale)*camU.x + (-dy/camScale)*camV.x;
    const wy=(dx/camScale)*camU.y + (-dy/camScale)*camV.y;
    const wz=(dx/camScale)*camU.z + (-dy/camScale)*camV.z;
    if(state.lay){ state.elemFX += -wz/state.a; state.elemFY += wy/state.a; }
    else         { state.elemFX +=  wx/state.a; state.elemFY += wy/state.a; }
    elemClampFrac();
    needsRender=true;
  }
  else if(drag.mode==='pan'){ cam.px+=dx; cam.py+=dy; needsRender=true; }
  else { cam.az-=dx*0.0075; cam.el=Math.max(-1.45,Math.min(1.45,cam.el+dy*0.0062)); needsRender=true; }
});
canvas.addEventListener('pointerup',()=>{ if(drag&&drag.mode==='elem') canvas.style.cursor='grab'; drag=null; });
canvas.addEventListener('pointercancel',()=>{ canvas.style.cursor=''; drag=null; });
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
  if(save){ try{ localStorage.setItem('em31-panel-w', String(w)); }catch(e){} }
  return w;
}
(()=>{ let v=0; try{ v=parseInt(localStorage.getItem('em31-panel-w')||'0',10)||0; }catch(e){}
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
   ★ 每个页签有自己的预设（电荷密度 / 速度 / 几何）⇒ 每个演示的起点都可复现，
     自检也才有确定的期望值。 */
const MT=[{k:'volume', t:'① 体电流 · J（A/m²）'},
          {k:'surface',t:'② 面电流 · K（A/m）'},
          {k:'line',   t:'③ 线电流 · I（A）'}];
const modeTabs=document.getElementById('modeTabs');
MT.forEach(m=>{const b=document.createElement('button');b.textContent=m.t;b.dataset.k=m.k;
  b.onclick=()=>{ state.mode=m.k; state.cardTab='1';
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
