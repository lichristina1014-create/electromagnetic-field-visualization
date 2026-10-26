/* ============================================================================
   3.2 恒定电场的特点 —— 页面专属（一）：图元助手 / 场景装配 / 信息卡 / 面板上半
   ⚠️ 所有进画布的串都必须走 parseRich()（@{...} 矢量 / _x 下标），
      所有进 DOM 的串都必须走 richHTML()；本引擎**不认 Markdown 星号**，加粗只能用 <b>。
   ============================================================================ */

/* ---------- 画布小卡助手（与 2.1~2.5 / 3.1 / 4.2 同源） ---------- */
function txt(x,y,str,o={}){
  ctx.save();
  const lo=richLayout(ctx,parseRich(str),o.size||12,!!o.bold);
  richDraw(ctx,lo,x,y,o.align||'left',o.color||C.ink);
  ctx.restore();
}
function rrPath(x,y,w,h,r){
  ctx.beginPath(); ctx.moveTo(x+r,y); ctx.lineTo(x+w-r,y); ctx.quadraticCurveTo(x+w,y,x+w,y+r);
  ctx.lineTo(x+w,y+h-r); ctx.quadraticCurveTo(x+w,y+h,x+w,y+h-r);
  ctx.lineTo(x+r,y+h); ctx.quadraticCurveTo(x,y+h,x+r,y+h);
  ctx.lineTo(x,y+h-r); ctx.quadraticCurveTo(x,y,x+r,y); ctx.closePath();
}
function crd(x,y,w,h){
  ctx.save(); ctx.shadowColor='rgba(30,60,80,.10)'; ctx.shadowBlur=8; ctx.shadowOffsetY=2;
  rrPath(x,y,w,h,10); ctx.fillStyle='rgba(255,255,255,.95)'; ctx.fill(); ctx.restore();
  ctx.save(); rrPath(x,y,w,h,10); ctx.strokeStyle='#DCE6EB'; ctx.lineWidth=1; ctx.stroke(); ctx.restore();
}
const ZL = 1e4+40;                 /* 标注深度档：压在场景之上 */
const O  = pt(0,0,0);
const WIRE_HEX = '#2E86AB';          /* 导线（淡蓝，与 3.1 导体同族） */
const E_HEX    = '#136A9B';          /* 库仑场 E（青） */
const EE_HEX   = C.orange;           /* 局外场 E_e（橙 = "非静电的那一份"） */
const CAR_HEX  = C.teal;             /* 载流子 */
const PLT_HEX  = '#37474F';          /* 极板 */
const PTH_HEX  = '#136A9B';          /* ③ 路径 A */
const PTHB_HEX = '#8A6A2F';          /* ③ 路径 B */

/* ══════════════════════════ 右上角信息卡 ══════════════════════════ */
function infoCard(title,rows,h){
  const x0=CARD_X(), y0=CARD_Y, w=CARD_W;
  crd(x0,y0,w,h);
  txt(x0+12,y0+15,title,{size:11.5,bold:true,color:'#1F3D4C'});
  rows.forEach((r,i)=>{
    const y=y0+38+i*19;
    /* ⚠️ 章节行要同时认两种写法：['§','文本'] 与 ['§ 文本']（2.3 踩过：只认前者 ⇒ 右列 undefined） */
    const markerOnly=(r[0]==='§');
    if(markerOnly || (r.length===1 && String(r[0]||'')[0]==='§')){
      const lab=markerOnly ? String(r[1]==null?'':r[1]) : String(r[0]).slice(1);
      txt(x0+11,y,lab.trim(),{size:11,bold:true,color:r[2]||'#1F3D4C'}); return;
    }
    let lab=String(r[0]==null?'':r[0]);
    if(lab[0]==='§') lab=lab.slice(1).trim();
    txt(x0+13,y,lab,{size:11,color:'#5F7482'});
    txt(x0+w-13,y,r[1]==null?'':String(r[1]),{size:11,bold:true,color:r[2]||'#0E4A66',align:'right'});
  });
}

/* ══════════════════════════ 场景零件 ══════════════════════════ */
/* 导线（②③ 是完整闭环、穿过电源；① 没电源 ⇒ 极板间绝缘，只画外电路）
   ★★ ① 的导线两端正好是 +/− 极板中心：loopPt(SEG.d)=(x0,+SRC_H)、
     loopPt(LP_L)=(x0,−SRC_H) —— "外导线把两块极板连起来"。
     ⚠️ 绝不能让 ① 的导线穿过间隙（2026-10-26 修的物理错误）。 */
function wirePts(){
  const N=160, pts=[];
  if(state.mode==='nosrc'){
    for(let i=0;i<=N;i++) pts.push(loopPt(SEG.d + (LP_L-SEG.d)*i/N));
  } else {
    for(let i=0;i<=N;i++) pts.push(loopPt(LP_L*i/N));
  }
  return pts;
}
function drawWire(){
  const pts=wirePts();
  curve(pts, {color:WIRE_HEX, w:5.2, alpha:0.95});
  curve(pts, {color:'#0F4C66', w:1.6, alpha:0.9});   /* 描边加强存在感 */
}
/* ① 的极板间隙：绝缘 ⇒ 只有库仑场 @{E} 的场线（+ 板 → − 板），没有载流子。
   透明度随 Q(t) 衰减 —— "场在变弱"与"电荷在中和"同步可见。 */
function drawGapField(){
  if(state.mode!=='nosrc' || !state.show.fld) return;
  const x0=-LP_W/2, a=0.2+0.8*Math.max(0, Math.min(1, Qnow()/state.Q0));
  for(const dx of [-0.033, 0, 0.033])
    arrow(pt(x0+dx, SRC_H-0.018, 0), pt(x0+dx, -SRC_H+0.018, 0),
          {color:E_HEX, w:1.6, headScale:1.1, alpha:a, z:ZL-3});
  /* ⚠️ 源区（极板+符号+场线）在斜视角下投影成一团 ⇒ 标注用固定屏幕偏移；
     ⚠️ 极板投到右半屏时（如 az=0.8）会撞右上信息卡 ⇒ 换到左侧；
     ⚠️ 但左侧 −58px 处是「+/− 极板」标签 ⇒ 左放时直接越过去（−200px） */
  const leftSide = pr(pt(x0,0,0)).x > CARD_X()-240;
  text(pt(x0,0,0), '极板间绝缘：只有电场 @{E}，无载流子',
       {color:'#5F7482', size:11, dx:leftSide?-200:58, dy:2, align:leftSide?'right':'left', z:ZL});
}
/* 电源盒（②③）：左边中段的方框 + 标签 */
function drawSourceBox(){
  const x0=-LP_W/2, g=PL_HALF+0.022;
  const c=[ pt(x0-g,-SRC_H-g,0), pt(x0+g,-SRC_H-g,0), pt(x0+g,SRC_H+g,0), pt(x0-g,SRC_H+g,0) ];
  poly(c, {fill:'#FFF3E4', stroke:EE_HEX, w:1.6, fillAlpha:0.35, strokeAlpha:0.95, z:ZL-4});
  /* ⚠️ 「电源」标签必须离开盒区：源区（盒+极板+电荷符号+两列箭头）在斜视角下
     全部投影进 ~60px 的一团 ⇒ 标签一律用「锚盒中心 + 固定屏幕偏移」（与相机无关）。
     底中不行（撞上 − 极板的 − 号），取左下。 */
  text(pt(x0,0,0), '电源', {color:'#B85A1E',size:12,bold:true,dx:-55,dy:40,align:'right',z:ZL});
}
/* 极板：两横板 + 电荷符号（个数 ∝ Q(t)） */
function drawPlates(){
  const x0=-LP_W/2;
  line(pt(x0-PL_HALF,SRC_H,0), pt(x0+PL_HALF,SRC_H,0), {color:PLT_HEX,w:4.2,z:ZL-2});
  line(pt(x0-PL_HALF,-SRC_H,0), pt(x0+PL_HALF,-SRC_H,0), {color:PLT_HEX,w:4.2,z:ZL-2});
  text(pt(x0,SRC_H,0), '+ 极板', {color:PLT_HEX,size:11,bold:true,dx:-100,dy:-2,align:'right',z:ZL});
  text(pt(x0,-SRC_H,0), '− 极板', {color:PLT_HEX,size:11,bold:true,dx:-100,dy:-2,align:'right',z:ZL});
  /* ⚠️ 极板标签要**远远离开板体**（左移 100px）：斜视角下极板近乎"端视"，
     锚在板端/近旁必然撞上板上 +/− 符号和 E_e/E 标签（vis32 实测撞过三轮 36%/68%/72%）。
     「驻立电荷」一词在 E 标签和讲解卡里已有，不丢概念。 */
  /* 电荷符号：个数 ∝ Q（上 + 下 −）。
     ⚠️ 上限 4 个：符号是 ~8px 宽的字形，板长只有 0.11 m（~30px），
     n=6 时间距只有 5px ⇒ 相邻符号重叠 37%（vis32 实测）。 */
  const n=Math.min(4, Math.round(Qnow()/2));
  for(let i=0;i<n;i++){
    const dx=-PL_HALF+ (2*PL_HALF)*(i+0.5)/Math.max(1,n);
    text(pt(x0+dx, SRC_H,0), '+', {color:'#C62828',size:12,bold:true,dx:0,dy:-9,align:'center',z:ZL+2});
    text(pt(x0+dx,-SRC_H,0), '−', {color:'#1565C0',size:12,bold:true,dx:0,dy:16,align:'center',z:ZL+2});
  }
}
/* 载流子：沿环流动；速度 ∝ I(t) ⇒ ① 里自己慢下来、最后停住
   （白心青圈：压在 5.2px 宽的青蓝导线上要跳得出来） */
function drawCarriers(){
  if(!state.show.car) return;
  for(let i=0;i<NC_C;i++){
    marker(carrierAt(i), {r:3.6, color:'#F5FAFC', ring:'#0F4C66', z:ZL+4});
  }
}
/* 导线上的 E 箭头（青）：方向沿电流，长度 ∝ 当地 E（极板对的库仑场，沿线不均匀是真实的） */
const LE_K=0.010, LE_MIN=0.6, LE_MAX=0.095;      /* E 显示比例：线性 + 上下限钳制（学 2.1 的 LE） */
function drawFieldArrows(){
  if(!state.show.fld) return;
  const step=0.12;
  for(let s=SEG.d+0.03; s<LP_L-0.02; s+=step){
    const p=loopPt(s), E=Efield(p), t=loopTan(s);
    const Et=vdot(E,t);
    if(Math.abs(Et)<LE_MIN) continue;             /* 太弱不画（下限以下不画） */
    const len=Math.min(LE_MAX, Math.abs(Et)*LE_K);
    arrow(p, vadd(p, vmul(t, Math.sign(Et)*len)), {color:E_HEX, w:1.8, headScale:0.95, alpha:0.9});
  }
  text(pt(0.15, -LP_H/2, 0), '@{E}（驻立电荷的库仑场）', {color:E_HEX,size:11.5,bold:true,dx:0,dy:20,align:'center',z:ZL});
}
/* 电源内部：E_e 向上（橙）与 E 向下（青）并排画 —— "两股力在电源里对着干"
   ⚠️ 两条并排箭头起点间距 ≥20px（0.11·cs≈26px）⇒ 左右错开画 */
function drawEe(){
  if(!state.show.efe) return;
  if(state.mode==='nosrc') return;                /* ① 没有电源 ⇒ 没有局外场 */
  const x0=-LP_W/2;
  const xe=x0+PL_HALF+0.028, xE=x0-PL_HALF-0.028;
  for(const y of [-0.058,0,0.058])
    arrow(pt(xe,y-0.048,0), pt(xe,y+0.048,0), {color:EE_HEX,w:2.2,headScale:1.0,z:ZL+2});
  const Emid=Efield(pt(x0,0,0));                  /* 电源段中点的库仑场（向下） */
  const lenE=Math.min(LE_MAX, Math.abs(Emid.y)*0.0040);
  arrow(pt(xE,0.048,0), pt(xE,0.048-lenE,0), {color:E_HEX,w:2.2,headScale:1.0,z:ZL+2});
  /* ⚠️ 标签沿「源区中心 → 箭头列」的屏幕方向水平外移（与相机无关，永不回撞盒区）：
     斜视角下源区投影成一团，任何"世界方向"的锚都会撞上极板符号（vis32 实测 82%）。 */
  const scC=pr(pt(x0,0,0)), scEe=pr(pt(xe,0,0)), scE=pr(pt(xE,0,0));
  const sgnEe=(scEe.x-scC.x)>=0?1:-1, sgnE=(scE.x-scC.x)>=0?1:-1;
  text(pt(xe,0,0), '@{E}_e', {color:'#B85A1E',size:12.5,bold:true,dx:sgnEe*40,dy:-2,align:sgnEe>0?'left':'right',z:ZL+2});
  text(pt(xE,0,0), '@{E}', {color:E_HEX,size:12.5,bold:true,dx:sgnE*26,dy:-2,align:sgnE>0?'left':'right',z:ZL+2});
}
/* ③ 的试探路径 + 动点 + 累计积分 */
function drawTestPath(){
  if(state.mode!=='loop' || !state.show.path) return;
  const N=96, pts=[];
  if(state.path==='A'){
    for(let i=0;i<=N;i++) pts.push(pathPt(i/N));
    curve(pts, {color:PTH_HEX, w:1.6, dash:[6,4], alpha:0.9, z:ZL-2});
    /* 标签锚圆心 + 屏幕左下移（斜视角下圆被压扁，"圆顶/正下方"会撞上动点 P 与极板标签） */
    text(PA_C, '路径 l：不经电源的小环', {color:PTH_HEX,size:11.5,bold:true,dx:-30,dy:52,align:'right',z:ZL});
  } else {
    /* 沿导线外偏 0.018（看清楚"贴着导线走一整圈"；外向 = (−t.y, t.x)） */
    for(let i=0;i<=N;i++){
      const s=LP_L*i/N, p=loopPt(s), t=loopTan(s);
      pts.push(vadd(p, vmul(pt(-t.y,t.x,0), 0.018)));
    }
    curve(pts, {color:PTHB_HEX, w:1.8, dash:[7,4], alpha:0.95, z:ZL-2});
    text(pt(LP_W/2+0.018, 0, 0), '路径 l：沿导线一圈（穿过电源）', {color:PTHB_HEX,size:11.5,bold:true,dx:10,dy:-4,align:'left',z:ZL});
  }
  /* 动点 P + 已走过的一段加粗 */
  const q=Math.max(0.001, state.s);
  const segs=[];
  for(let i=0;i<=Math.round(N*q);i++) segs.push(state.path==='A'?pathPt(i/N):vadd(loopPt(LP_L*i/N), (()=>{const t=loopTan(LP_L*i/N);return vmul(pt(-t.y,t.x,0),0.018);})()));
  if(segs.length>1) curve(segs, {color:state.path==='A'?PTH_HEX:PTHB_HEX, w:3.6, alpha:0.95, z:ZL+2});
  const P=pathPt(state.s);
  marker(P, {r:6.0, color:C.orange, ring:'#E8B48A', z:ZL+6});
  text(P, 'P', {color:'#B85A1E',size:12.5,bold:true,dx:11,dy:-9,z:ZL+6});
}

/* ══════════════════════════ 场景装配 ══════════════════════════ */
function buildScene(){
  prims=[];                     /* ★ 第一句必须是 prims=[]（否则每次重绘再叠一层整场景） */
  if(state.show.box) drawAxes(EXT_AX);
  if(state.show.wire) drawWire();
  if(state.show.src && state.mode!=='nosrc') drawSourceBox();
  if(state.show.plate) drawPlates();
  drawFieldArrows();
  drawGapField();
  drawEe();
  drawCarriers();
  drawTestPath();
}

/* ══════════ 信息卡内容 ══════════ */
function fmtI(){  /* ① 用 µA、②③ 用 mA */
  const I=Inow();
  return state.mode==='nosrc' ? I.toFixed(2)+' µA' : I.toFixed(3)+' mA';
}
function currentCard(){
  if(state.mode==='nosrc'){
    return ['没有电源：放电暂态',[
      ['极板电荷 Q(t) = Q₀·e^(−t/τ)', Qnow().toFixed(2)+' µC'],
      ['板间场强 E(t)', Eplates().toFixed(1)+' V/m'],
      ['回路电流 I(t) = −dQ/dt', fmtI()],
      ['t / τ', (state.t/state.TAU).toFixed(2)],
      ['再过 1 个 τ，Q 只剩 37%', 'e⁻¹ ≈ 0.37'],
      ['§ 结论'],
      ['没有局外力，静电场把自己"抹平"', 'I → 0'],
      ['电流转瞬即逝 ⇒', '不是恒定电流','#C62828'],
    ],238];
  }
  if(state.mode==='source'){
    return ['有电源：局外场强维持恒定',[
      ['电动势 ℰ', state.EMF.toFixed(1)+' V'],
      ['局外场强 E_e = ℰ/d（只在电源内）', EeVal().toFixed(1)+' V/m','#B85A1E'],
      ['极板电荷 Q(t) → Q∞', Qnow().toFixed(2)+' / '+qInf().toFixed(1)+' µC'],
      ['回路电流 I(t) → I∞ = ℰ/R', fmtI()+' → '+iInf().toFixed(3)+' mA'],
      ['t / τ', (state.t/state.TAU).toFixed(2)],
      ['§ 动态平衡（PPT 第 16 页）'],
      ['E_e 把正电荷从 − 极搬回 + 极', '维持 Q 不变'],
      ['Q 不变 ⇒ E 不变 ⇒ I 不变', '恒定电场','#2E7D32'],
    ],238];
  }
  const iE=intE(state.path), iEe=intEe(state.path);
  return ['环量：恒定电场是保守场',[
    ['路径 l', state.path==='A'?'不经电源的小环':'沿导线一圈（穿过电源）'],
    ['∮ @{E}·d@{l}（实测，数值积分）', iE.toFixed(3)+' V'],
    ['∫ @{E}_e·d@{l}（只在电源段）', iEe.toFixed(1)+' V','#B85A1E'],
    ['∮ (@{E}+@{E}_e)·d@{l}', (iE+iEe).toFixed(2)+' V','#0E4A66'],
    ['§ 结论（PPT 第 16 页）'],
    ['回路不经电源', '∮E·dl = 0'],
    ['回路穿过电源', '∮(E+E_e)·dl = ℰ'],
    ['E 是保守场 ⇒ 绕一圈电位回原值', '电动势来自 E_e'],
  ],238];
}
function drawOverlays(){ const c=currentCard(); infoCard(c[0],c[1],c[2]); }

/* ══════════════════════════ 面板底部的实时结论条 ══════════════════════════ */
function subNote(){
  if(state.mode==='nosrc')
    return '<b>充了电的极板 + 一根导线</b>：极板间是绝缘介质，电荷穿不过间隙，库仑场 @{E} 只能驱动正电荷'+
      '<b>沿外导线</b>从 + 极流向 − 极；每流过去一份，极板电荷就少一份 ⇒ <b>E 跟着变弱 ⇒ I 跟着变小</b>，'+
      '最后全部中和、电流归零。<br>'+
      '🔑 没有局外力把电荷<b>搬回去</b>，静电场是"一次性"的 —— 这就是<b>为什么必须有电源</b>。';
  if(state.mode==='source')
    return '<b>局外场强 @{E}_e</b>（橙色，只在电源内部）：非静电起源的搬运工（化学能 / 磁 / 热），'+
      '把正电荷<b>逆着库仑场</b>从 − 极搬回 + 极。<br>'+
      '🔑 动态平衡：@{E}_e 搬上去多少，@{E} 就沿导线流下来多少 ⇒ <b>电荷分布不变 ⇒ 场不变 ⇒ 电流恒定</b>。';
  return '沿路径 l 移动进度 s，看 <b>∮@{E}·d@{l} 的累计值</b>：'+
    '<b>路径 A</b>（不经电源）绕一圈回到 0；<b>路径 B</b>（穿过电源）的 @{E} 积分同样是 0，'+
    '但 @{E}_e 在电源段贡献了整个电动势 ℰ。<br>'+
    '🔑 驻立电荷的场与静电场<b>环量特性相同</b>（∇×@{E}=0）；恒定电流能转圈，靠的是 @{E}_e。';
}

/* ══════════════════════════ 右侧面板 ══════════════════════════ */
const panel=document.getElementById('panel');
function h(html){const d=document.createElement('div');d.innerHTML=html;return d;}
let _toastTimer=0;
function toastMsg(msg){
  const el=document.getElementById('toast'); if(!el) return;
  el.textContent=msg; el.classList.add('show');
  clearTimeout(_toastTimer); _toastTimer=setTimeout(()=>el.classList.remove('show'),1700);
}
function kchip(k,v,cls){return '<span class="coord-chip '+(cls||'')+'">'+richHTML(k)+'<b>'+richHTML(v)+'</b></span>';}
function chipRow(parent,items,isOn,onPick){
  const box=h('<div class="sub-chips"></div>').firstChild;
  items.forEach(it=>{
    const lab=richHTML(String(it.t??it.sub??it.label??''));
    const b=h('<button class="chip '+(it.col||'')+(isOn(it.k)?' on':'')+'" data-k="'+it.k+'">'+lab+'</button>').firstChild;
    b.onclick=()=>onPick(it.k);
    box.appendChild(b);
  });
  parent.appendChild(box);
  return box;
}
const SHOW_ITEMS={
  nosrc: [{k:'wire',t:'导线回路'},{k:'plate',t:'极板与电荷'},{k:'car',t:'载流子'},{k:'fld',t:'电场 @{E}'},{k:'box',t:'坐标轴'}],
  source:[{k:'wire',t:'导线回路'},{k:'src',t:'电源'},{k:'plate',t:'极板与电荷'},{k:'car',t:'载流子'},{k:'fld',t:'电场 @{E}'},{k:'efe',t:'局外场 @{E}_e'},{k:'box',t:'坐标轴'}],
  loop:  [{k:'wire',t:'导线回路'},{k:'src',t:'电源'},{k:'plate',t:'极板与电荷'},{k:'car',t:'载流子'},{k:'fld',t:'电场 @{E}'},{k:'efe',t:'局外场 @{E}_e'},{k:'path',t:'试探路径'},{k:'box',t:'坐标轴'}],
};
function mkRange(sec,d){
  const r=h('<div class="slider-row'+(d.wide?' w':'')+'"><label>'+richHTML(d.label)+'</label>'+
    '<input type="range" id="s_'+d.k+'" min="'+d.min+'" max="'+d.max+'" step="'+d.step+'" value="'+d.get()+'">'+
    '<span class="val" id="v_'+d.k+'">'+d.fmt(d.get())+'</span></div>');
  const inp=r.querySelector('input');
  inp.oninput=()=>{
    /* ⚠️ 必须用 d.set() 的**返回值**（生效值）来回写滑块（钳制契约，3.1 起钉死） */
    const eff=d.set(parseFloat(inp.value));
    const v=(eff==null||!isFinite(eff))?parseFloat(inp.value):eff;
    if(String(inp.value)!==String(v)) inp.value=String(v);
    document.getElementById('v_'+d.k).textContent=d.fmt(v);
    needsRender=true; updateReadout(); updateModeTag();
    if(d.after) d.after();
  };
  sec.appendChild(r);
}
function btnRow(sec,specs){
  const bx=h('<div class="sub-chips"></div>').firstChild;
  specs.forEach(s=>{ const b=h('<button class="chip '+(s.col||'')+(s.on?' on':'')+'">'+richHTML(s.t)+'</button>').firstChild;
    b.onclick=s.act; bx.appendChild(b); });
  sec.appendChild(bx);
}
function renderSubSec(sec){
  sec.innerHTML='';
  sec.appendChild(h('<div class="sec-title">显示</div>'));
  chipRow(sec,SHOW_ITEMS[state.mode],k=>state.show[k],k=>{
    const next=!state.show[k];
    /* ⚠️ 不许把层全关掉：全关 ⇒ prims=0 ⇒ 整块画布纯白（2.3 踩过） */
    const othersOn=SHOW_ITEMS[state.mode].some(it=>it.k!==k && state.show[it.k]);
    if(!next && !othersOn){ toastMsg('至少保留一层显示'); return; }
    state.show[k]=next; needsRender=true; renderPanel();
  });
  sec.appendChild(h('<div class="ex-note" style="margin-top:7px">'+richHTML(subNote())+'</div>'));
}
/* ⚠️ 这里的格式必须与 mkRange 建滑块时的 fmt **完全一致**（syncSliders 会反复调用）。 */
const SLIDER_FMT={
  EMF:v=>v.toFixed(1)+' V', RES:v=>v.toFixed(1)+' kΩ', Q0:v=>v.toFixed(1)+' µC',
  TAU:v=>v.toFixed(1)+' s', t:v=>v.toFixed(2)+' s', s:v=>(v*100).toFixed(0)+' %',
};
function syncSliders(){
  const set=(k,v)=>{ const s=document.getElementById('s_'+k); if(s) s.value=v;
    const e=document.getElementById('v_'+k); if(e) e.textContent=SLIDER_FMT[k]?SLIDER_FMT[k](v):String(v); };
  set('EMF',state.EMF); set('RES',state.RES); set('Q0',state.Q0);
  set('TAU',state.TAU); set('t',state.t); set('s',state.s);
}
function renderSliders(sec){
  sec.innerHTML='';
  if(state.mode==='nosrc'){
    sec.appendChild(h('<div class="slider-group-label">放电回路（无电源）</div>'));
    mkRange(sec,{k:'Q0',label:'极板初始电荷 Q₀',wide:true,min:Q0_RANGE[0],max:Q0_RANGE[1],step:0.1,
      get:()=>state.Q0,set:v=>{state.Q0=v;},fmt:v=>v.toFixed(1)+' µC'});
    mkRange(sec,{k:'TAU',label:'放电时间常数 τ',wide:true,min:TAU_RANGE[0],max:TAU_RANGE[1],step:0.1,
      get:()=>state.TAU,set:v=>{state.TAU=v; state.t=Math.min(state.t,tMax());},fmt:v=>v.toFixed(1)+' s'});
    sec.appendChild(h('<div class="slider-group-label g" style="margin-top:12px">放电进程</div>'));
    mkRange(sec,{k:'t',label:'时间 t（拖到 4τ 看"电流没了"）',wide:true,min:0,max:tMax(),step:0.02,
      get:()=>state.t,set:v=>{state.anim=null; state.t=v;},fmt:v=>v.toFixed(2)+' s'});
    btnRow(sec,[
      {t:(state.anim&&state.anim.playing)?'⏸ 暂停':'▶ 播放放电过程', on:!!(state.anim&&state.anim.playing), col:'acc',
        act:()=>{ if(state.anim&&state.anim.playing){ stopAnim(); } else { playT(); } renderPanel(); }},
      {t:'↺ 回到 t = 0（极板重新带电）', on:false,
        act:()=>{ stopAnim(); state.t=0; renderPanel(); updateAll(); }},
    ]);
  } else if(state.mode==='source'){
    sec.appendChild(h('<div class="slider-group-label">电源与回路</div>'));
    mkRange(sec,{k:'EMF',label:'电动势 ℰ',wide:true,min:EMF_RANGE[0],max:EMF_RANGE[1],step:0.5,
      get:()=>state.EMF,set:v=>{state.EMF=v;},fmt:v=>v.toFixed(1)+' V'});
    mkRange(sec,{k:'RES',label:'回路电阻 R',wide:true,min:RES_RANGE[0],max:RES_RANGE[1],step:0.5,
      get:()=>state.RES,set:v=>{state.RES=v;},fmt:v=>v.toFixed(1)+' kΩ'});
    mkRange(sec,{k:'TAU',label:'建立时间常数 τ',wide:true,min:TAU_RANGE[0],max:TAU_RANGE[1],step:0.1,
      get:()=>state.TAU,set:v=>{state.TAU=v; state.t=Math.min(state.t,tMax());},fmt:v=>v.toFixed(1)+' s'});
    sec.appendChild(h('<div class="slider-group-label g" style="margin-top:12px">建立进程</div>'));
    mkRange(sec,{k:'t',label:'时间 t（看电荷、场、电流怎样建立）',wide:true,min:0,max:tMax(),step:0.02,
      get:()=>state.t,set:v=>{state.anim=null; state.t=v;},fmt:v=>v.toFixed(2)+' s'});
    btnRow(sec,[
      {t:(state.anim&&state.anim.playing)?'⏸ 暂停':'▶ 播放建立过程', on:!!(state.anim&&state.anim.playing), col:'acc',
        act:()=>{ if(state.anim&&state.anim.playing){ stopAnim(); } else { playT(); } renderPanel(); }},
      {t:'↺ 回到 t = 0（刚接通瞬间）', on:false,
        act:()=>{ stopAnim(); state.t=0; renderPanel(); updateAll(); }},
    ]);
  } else {
    sec.appendChild(h('<div class="slider-group-label">试探路径（③）</div>'));
    btnRow(sec,[
      {t:'路径 A：不经电源的小环', on:state.path==='A', col:'acc',
        act:()=>{ state.path='A'; state.s=0; renderPanel(); updateAll(); }},
      {t:'路径 B：沿导线一圈（穿过电源）', on:state.path==='B',
        act:()=>{ state.path='B'; state.s=0; renderPanel(); updateAll(); }},
    ]);
    mkRange(sec,{k:'s',label:'路径进度 s（看 ∮ 累计值怎样转一圈回 0）',wide:true,min:0,max:1,step:0.005,
      get:()=>state.s,set:v=>{state.anim=null; state.s=v;},fmt:v=>(v*100).toFixed(0)+' %'});
    btnRow(sec,[
      {t:(state.anim&&state.anim.playing)?'⏸ 暂停':'▶ 动点走一圈', on:!!(state.anim&&state.anim.playing), col:'acc',
        act:()=>{ if(state.anim&&state.anim.playing){ stopAnim(); } else { playS(); } renderPanel(); }},
    ]);
    sec.appendChild(h('<div class="ex-note" style="margin-top:9px">'+richHTML(
      '⚠️ @{E} 的环积分为什么是 0：@{E} 是<b>驻立电荷</b>产生的库仑场（−∇φ），'+
      '绕任何闭合回路一圈，起点终点是同一个点 ⇒ 电位差必然是 0。<br>'+
      '本页的 ∮ 不是贴出来的：<b>是沿路径逐段数值积分出来的</b>（720 段中点规则），'+
      '残差 ~10⁻³ V 如实显示。')+'</div>'));
  }
}
