/* ============================================================================
   2.4 高斯定理及其应用 —— 页面专属（一）：图元助手 / 场景装配 / 信息卡 / 面板上半
   ============================================================================ */

/* ---------- 画布小卡助手（与 2.1 / 2.2 / 2.3 同源） ---------- */
function txt(x,y,str,o={}){
  ctx.save();
  const lo=richLayout(ctx,parseRich(str),o.size||12,!!o.bold);
  richDraw(ctx,lo,x,y,o.align||'left',o.color||C.ink);
  ctx.restore();
}
function rrPath(x,y,w,h,r){
  ctx.beginPath();
  ctx.moveTo(x+r,y); ctx.lineTo(x+w-r,y); ctx.quadraticCurveTo(x+w,y,x+w,y+r);
  ctx.lineTo(x+w,y+h-r); ctx.quadraticCurveTo(x+w,y+h,x+w-r,y+h);
  ctx.lineTo(x+r,y+h); ctx.quadraticCurveTo(x,y+h,x,y+h-r);
  ctx.lineTo(x,y+r); ctx.quadraticCurveTo(x,y,x+r,y); ctx.closePath();
}
function crd(x,y,w,h){
  ctx.save();
  ctx.shadowColor='rgba(30,60,80,.10)'; ctx.shadowBlur=8; ctx.shadowOffsetY=2;
  rrPath(x,y,w,h,10); ctx.fillStyle='rgba(255,255,255,.95)'; ctx.fill();
  ctx.restore(); ctx.save();
  rrPath(x,y,w,h,10); ctx.strokeStyle='#DCE6EB'; ctx.lineWidth=1; ctx.stroke();
  ctx.restore();
}
const ZL = 1e4+40;            /* 标注深度档：压在球壳之上 */
const O  = pt(0,0,0);
const SPH_HEX = '#2E86AB';    /* 高斯面的玻璃壳配色（淡蓝，与 2.1 同族） */
const EXT_AX  = 0.84;         /* 坐标轴长度。⚠️ 本页场景半宽只有 ~0.70 m（球面 ≤0.38、电荷 ≤0.48），
                                 按 2.3 的"轴略大于场景"惯例取 0.84；写 1.00 会让轴比球长出两三倍、抢戏 */

/* ══════════════════════════ 画布右上角信息卡 ══════════════════════════ */
function infoCard(title,rows,h){
  const x0=CARD_X(), y0=CARD_Y, w=CARD_W;
  crd(x0,y0,w,h);
  txt(x0+12,y0+15,title,{size:11.5,bold:true,color:'#1F3D4C'});
  rows.forEach((r,i)=>{
    const y=y0+38+i*19;
    /* ⚠️ 章节行的判定看**写法**，别只认 r[0]==='§'：本页的章节行全都写成单元素 ['§ 文本']，
       而旧判据 r[0]==='§' 只认 ['§','文本'] ⇒ 单元素那种会被当成"普通行"、右列去取 r[1]
       得 undefined。⚠️⚠️ 而 **parseRich(undefined) 根本不抛异常**（静默 String 成 "undefined"
       再照常排版）⇒ 看控制台、看报错永远发现不了，只能靠"给 txt 插桩扫传入的 str"抓（2.3 踩过）。 */
    const markerOnly = (r[0]==='§');
    if(markerOnly || (r.length===1 && String(r[0]||'')[0]==='§')){
      const lab = markerOnly ? String(r[1]==null?'':r[1]) : String(r[0]).slice(1);
      txt(x0+11,y,lab.trim(),{size:11,bold:true,color:r[2]||'#1F3D4C'}); return;
    }
    let lab=String(r[0]==null?'':r[0]);
    if(lab[0]==='§') lab=lab.slice(1).trim();
    txt(x0+13,y,lab,{size:11,color:'#5F7482'});
    txt(x0+w-13,y,r[1]==null?'':String(r[1]),{size:11,bold:true,color:r[2]||'#0E4A66',align:'right'});
  });
}

/* ══════════════════════════ 场景装配 ══════════════════════════ */
function drawFieldLines(){
  if(!state.show.lines) return;
  const FL=fieldLines();
  for(const L of FL.list){
    const outside = CHARGES[L.src].out;
    const col = outside ? CH_LINE_OUT : CH_LINE_IN;
    const alpha = outside ? 0.50 : 0.80;
    const w = outside ? 1.15 : 1.35;
    const gap = outside ? 76 : 62;
    for(const run of flowRuns(L.pts)) flowLine(run.pts, L.sgn, {color:col, z:run.z, alpha, w, gap});
  }
}
/* 穿越点：红 = 场线沿 @{E} 穿出球面；蓝 = 穿入 */
function crossMark(p,outward){
  const S=pr(p);
  P_(S.d+0.03, ()=>{ ctx.save();
    ctx.beginPath(); ctx.arc(S.x,S.y,4.2,0,7); ctx.fillStyle='rgba(255,255,255,.94)'; ctx.fill();
    ctx.lineWidth=1.2; ctx.strokeStyle=outward?'#B83A2B':'#136A9B'; ctx.stroke();
    ctx.beginPath(); ctx.arc(S.x,S.y,2.5,0,7);
    ctx.fillStyle = outward ? '#D94F3D' : '#1D7FB8'; ctx.fill();
    ctx.restore(); });
}
function drawCrossMarks(){
  if(!state.show.cross) return;
  const c=crossNow();
  for(const m of c.marks) crossMark(m.p, m.outward);
}
/* 球面上的 @{E}·@{n} 采样箭头（"通量云"） */
function drawFluxCloud(){
  if(!state.show.flux) return;
  const R=state.R, S=fluxSamples();
  for(const it of S.list){
    const v=it.v; if(Math.abs(v) < S.mx*0.05) continue;
    const u=it.u, len=Math.min(1, Math.abs(v)/S.mx)*FLUX_LMAX, sg=v>0?1:-1;
    const A=pt(R*u.x, R*u.y, R*u.z);
    const B=pt(A.x+u.x*len*sg, A.y+u.y*len*sg, A.z+u.z*len*sg);
    arrow(A,B,{color: v>0?'#D94F3D':'#1D7FB8', w:1.5, headScale:0.80, alpha:0.70});
  }
}
function drawCharges(){
  if(!state.show.chg) return;
  CHARGES.forEach((ch,i)=>{
    const q=state.q[i]; if(q===0) return;
    chgBall(ch.pos, chgRadius(q), ch.out?CH_OUT:CH_IN, q>0);
    /* 标签按**屏幕**左右避让，免得压在小球上 */
    const S=pr(ch.pos), right = S.x>=CX2;
    text(ch.pos, 'q_'+ch.sub, {color: ch.out?CH_OUT:CH_IN, size:12.5, bold:true,
      dx: right?13:-13, dy:-13, align: right?'left':'right'});
  });
}
/* 半径标注：沿**屏幕水平方向**（camU）拉一条 —— 投影恰好是水平半径，
   不会像随机方向那样在某些视角下缩成一点。 */
function drawRadiusDim(){
  dimLine(O, vmul(camU, -state.R), {color:'#9FB4C0', dash:[5,4], w:1.2,
    label:'R = '+state.R.toFixed(3)+' m', lsize:11.5, ldy:-9});
}
/* ══════════ ③ 的探针 P：总 @{E} 与"只算球内 / 只算球外"当场对照 ══════════
   ★ 定标规则：**总场恒画到满长**，另两支乘同一个比例 —— 三支共用一个比例，
     平行四边形才闭合（各画各的长度会读出错误的相对大小，是 2.1 的硬教训）。 */
const PARR_MAX = 0.40;
function drawProbe(){
  if(state.mode!=='allfield' || !state.show.dec) return;
  const P=Ppoint();
  const Eall=Efield(P), Ein=EfieldOf(IDX_IN,P), Eout=EfieldOf(IDX_OUT,P);
  const sc = PARR_MAX/Math.max(0.60, vlen(Eall));
  const tip = E => vadd(P, vmul(E, sc));
  const Aall=tip(Eall), Ain=tip(Ein), Aout=tip(Eout);
  arrow(P, Ain,  {color:C.teal,    w:1.9, headScale:0.95, dash:[6,4], z:ZL});
  arrow(P, Aout, {color:C.purple,  w:1.9, headScale:0.95, dash:[6,4], z:ZL});
  arrow(P, Aall, {color:C.crimson, w:2.7, headScale:1.12, z:ZL});
  marker(P, {r:4.6, color:'#1F3D4C', z:ZL});
  text(P, 'P', {color:'#1F3D4C', size:13, bold:true, dx:-5, dy:-15, align:'right'});
  text(Aall, '总 @{E}', {color:C.crimson, size:11.5, bold:true, dx:7, dy:-9});
  text(Ain,  '仅球内',  {color:C.teal,    size:11,   bold:true, dx:6, dy:13});
  text(Aout, '仅球外',  {color:C.purple,  size:11,   bold:true, dx:6, dy:-16});
}
function buildScene(){
  prims=[];                     /* ★ 第一句必须是 prims=[]（否则每次重绘再叠一层整场景） */
  if(state.show.box) drawAxes(EXT_AX);
  drawFieldLines();
  drawCrossMarks();
  drawFluxCloud();
  if(state.show.ball){ shellBall(O, state.R, SPH_HEX, true); drawRadiusDim(); }
  drawCharges();
  drawProbe();
}

/* ══════════ 信息卡内容 ══════════ */
function gaussCard(){
  const R=state.R, Qi=qInside(), Qo=qOutside(), c=crossNow();
  const want=Math.round(Qi/Q0);
  if(state.mode==='allfield'){
    const P=Ppoint();
    const Lall=vlen(Efield(P)), Lin=vlen(EfieldOf(IDX_IN,P)), Lout=vlen(EfieldOf(IDX_OUT,P));
    infoCard('高斯面 · 定量',[
      ['球面半径 R', R.toFixed(3)+' m'],
      ['探针 P（θ, φ）', state.Pth.toFixed(0)+'°, '+state.Pph.toFixed(0)+'°'],
      ['§ 球面上这一点 P 的电场'],
      ['总 @{E}（全部电荷）', Lall.toFixed(1)+' kV/m'],
      ['　只有球内电荷', Lin.toFixed(1)+' kV/m'],
      ['　只有球外电荷', Lout.toFixed(1)+' kV/m'],
      ['§ 整个球面的通量（与球外无关）'],
      ['净穿出根数  Q内/q₀', c.net+' / '+want+' 根'],
      ['Φ = Q内/ε₀', fmtSci(PHI_V(Qi))+' V·m'],
    ],224);
    return;
  }
  infoCard('高斯面 · 定量',[
    ['球面半径 R', R.toFixed(3)+' m'],
    ['球内电荷 Q内', sgnTxt(Qi,2)+' µC'],
    ['球外电荷 Q外', sgnTxt(Qo,2)+' µC'],
    ['§ 约定：1 条场线 ≡ q₀ = '+Q0.toFixed(3)+' µC'],
    ['理论净根数  Q内/q₀', want+' 根'],
    ['实测  穿出 / 穿入', c.out+' / '+c.inn],
    ['净穿出根数', c.net+' 根'+(c.net===want?'　✓':''), c.net===want?'#0E6E4A':'#B26A1E'],
    ['净根数 × q₀', c.net+' × '+Q0.toFixed(3)+' = '+(c.net*Q0).toFixed(2)+' µC'],
    ['Φ = Q内/ε₀', fmtSci(PHI_V(Qi))+' V·m'],
  ],244);
}
function drawOverlays(){ gaussCard(); }

/* ══════════════════════════ 面板底部的实时结论条 ══════════════════════════
   ⚠️ 凡进 DOM 的串必须过 richHTML()（它只认 @{...} 与 _x 下标，不认 Markdown 的星号）。 */
function subNote(){
  if(state.mode==='inside')
    return '<b>球面里只有 "+" 电荷</b>：@{E} 的场线一律从球内发出、一路穿出球面（本页签里球外没有电荷，'+
      '所以没有一条线会折回来）。把 <b>q₁ 往上拖</b>，穿过球面的场线会<b>一根一根地多出来</b> —— '+
      '每拖一格（0.25 µC）就正好多 <b>2 条</b>线 —— 因为约定的 <b>q₀ = 0.125 µC</b> 就是"一条线所代表的电荷量"。<br>'+
      '这就是高斯定理最朴素的读法：<b>净穿出的根数 × q₀ = Q内</b>。';
  if(state.mode==='outside')
    return '<b>现在球外也放了电荷</b>（紫色场线）。注意看：球外的线每一条都是<b>先穿进球面、再穿出球面</b>，'+
      '成对出现 ⇒ 对"净根数"的贡献恒为 <b>0</b>。<br>'+
      '所以把 <b>q₃ / q₄ 拖到任意值</b>，读数条上的<b>穿出、穿入会一起变大</b>，'+
      '但 <b>净穿出根数纹丝不动</b>，永远等于 Q内/q₀ —— 这就是"<b>球外电荷不影响通量</b>"。';
  return '<b>任意一点的 @{E}，都是空间中所有电荷共同产生的</b>：把 P 拖到球面各处，'+
    '看那一红（总 @{E}）、一青（只算球内电荷）、一紫（只算球外电荷）三支箭头 —— '+
    '<b>红 = 青 + 紫（矢量相加）</b>。<br>'+
    '⚠️ 但不管 P 挪到哪儿、球外电荷怎么改，右上方卡片里 <b>Φ = Q内/ε₀ 那一行始终不变</b>：'+
    '<b>场强处处被球外电荷改写，通量却只认球内的电荷</b> —— 这就是高斯定理最反直觉的地方。';
}

/* ══════════════════════════════ 右侧面板 ══════════════════════════════ */
const panel=document.getElementById('panel');
function h(html){const d=document.createElement('div');d.innerHTML=html;return d;}
let _toastTimer=0;
function toastMsg(msg){
  const el=document.getElementById('toast'); if(!el) return;
  el.textContent=msg; el.classList.add('show');
  clearTimeout(_toastTimer); _toastTimer=setTimeout(()=>el.classList.remove('show'),1700);
}
/* ⚠️ k 与 v **两个都要过 richHTML()**：只处理 k 会让带标记的**值**泄出字面 @{...} */
function kchip(k,v,cls){return '<span class="coord-chip '+(cls||'')+'">'+richHTML(k)+'<b>'+richHTML(v)+'</b></span>';}
/* ⚠️ 标签字段必须容错地取（t ?? sub ?? label）—— 只读死 it.t 会让某一页变成字面 "undefined" */
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
/* ⚠️ 每页签的显示项都写成 {k,t} 的对象（不是裸字符串）—— 2.3 那种混合写法最容易漏掉一处容错 */
const SHOW_ITEMS={
  inside:  [{k:'lines',t:'场线'},{k:'cross',t:'穿越点'},{k:'flux',t:'球面 @{E}·@{n}'},{k:'chg',t:'电荷'},{k:'ball',t:'高斯面'},{k:'box',t:'坐标轴'}],
  outside: [{k:'lines',t:'场线'},{k:'cross',t:'穿越点'},{k:'flux',t:'球面 @{E}·@{n}'},{k:'chg',t:'电荷'},{k:'ball',t:'高斯面'},{k:'box',t:'坐标轴'}],
  allfield:[{k:'lines',t:'场线'},{k:'cross',t:'穿越点'},{k:'flux',t:'球面 @{E}·@{n}'},{k:'dec',t:'P 点场分解'},{k:'chg',t:'电荷'},{k:'ball',t:'高斯面'},{k:'box',t:'坐标轴'}],
};
function mkRange(sec,d){
  const r=h('<div class="slider-row'+(d.wide?' w':'')+'"><label>'+richHTML(d.label)+'</label>'+
    '<input type="range" id="s_'+d.k+'" min="'+d.min+'" max="'+d.max+'" step="'+d.step+'" value="'+d.get()+'">'+
    '<span class="val" id="v_'+d.k+'">'+d.fmt(d.get())+'</span></div>');
  const inp=r.querySelector('input');
  inp.oninput=()=>{
    d.set(parseFloat(inp.value));
    document.getElementById('v_'+d.k).textContent=d.fmt(parseFloat(inp.value));
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
    /* ⚠️ 不许把所有层都关掉：本页所有元素都由开关控制，全关 ⇒ prims=0 ⇒ 整块画布纯白。
       ⇒ 统一守一道：要关的这层若已是最后一层开着的，就拒绝并给一句提示。 */
    const othersOn=SHOW_ITEMS[state.mode].some(it=>it.k!==k && state.show[it.k]);
    if(!next && !othersOn){ toastMsg('至少保留一层显示'); return; }
    state.show[k]=next; needsRender=true; renderPanel();
  });
  let note=null;
  if(state.mode==='inside')
    note='球面上那些小圆点就是 <b>穿越点</b>：红圈 = 场线沿 @{E} <b>穿出</b>、蓝圈 = <b>穿入</b>。'+
      '本页签里球外没有电荷 ⇒ 全是红圈，穿入恒为 0。';
  else if(state.mode==='outside')
    note='球外的紫色场线<b>每一条都会穿进又穿出</b>球面 ⇒ 穿越点上红、蓝同时增加。'+
      '把 <b>球面 @{E}·@{n} 采样</b> 打开，可以看见球面上各处"进进出出的箭头"大小悬殊，'+
      '但把它们按面积加权加起来，恰好还是 Φ = Q内/ε₀。';
  else
    note='<b>P 点场分解</b>打开后，P 处会画出三支箭头：<b>红 = 全部电荷的合成场</b>、'+
      '青 = 只算球内电荷、紫 = 只算球外电荷，满足 <b>红 = 青 + 紫</b>。'+
      '拖动 θ_P / φ_P 把 P 挪到球面各处，看看合成场被球外电荷"拉偏"了多少。';
  if(note) sec.appendChild(h('<div class="ex-note" style="margin-top:7px">'+richHTML(note)+'</div>'));
}
/* ⚠️ 这里的格式必须与 mkRange 建滑块时的 fmt **完全一致**（syncSliders 会反复调用）。 */
const SLIDER_FMT={
  q1:v=>sgnTxt(v,2)+' µC', q2:v=>sgnTxt(v,2)+' µC',
  q3:v=>sgnTxt(v,2)+' µC', q4:v=>sgnTxt(v,2)+' µC',
  R: v=>v.toFixed(3)+' m', th:v=>v.toFixed(0)+'°', ph:v=>v.toFixed(0)+'°',
};
function syncSliders(){
  const set=(k,v)=>{ const s=document.getElementById('s_'+k); if(s) s.value=v;
    const e=document.getElementById('v_'+k); if(e) e.textContent=SLIDER_FMT[k]?SLIDER_FMT[k](v):String(v); };
  set('q1',state.q[0]); set('q2',state.q[1]); set('q3',state.q[2]); set('q4',state.q[3]);
  set('R',state.R); set('th',state.Pth); set('ph',state.Pph);
}
const QSTEP=0.25;
function sliderQ(sec,k,i,label){
  const lo = i===0 ? Q_IN_RANGE[0] : (i===1 ? Q_IN2_RANGE[0] : Q_OUT_RANGE[0]);
  const hi = i===0 ? Q_IN_RANGE[1] : (i===1 ? Q_IN2_RANGE[1] : Q_OUT_RANGE[1]);
  mkRange(sec,{k, label, wide:true, min:lo, max:hi, step:QSTEP,
    get:()=>state.q[i], set:v=>{ state.q[i]=v; }, fmt:v=>sgnTxt(v,2)+' µC'});
}
function sliderR(sec){
  mkRange(sec,{k:'R', label:'球面半径 R', wide:true,
    min:GS_R_RANGE[0], max:GS_R_RANGE[1], step:0.01,
    get:()=>state.R, set:v=>{ state.R=Math.round(v*100)/100; }, fmt:v=>v.toFixed(3)+' m'});
}
function renderSliders(sec){
  sec.innerHTML='';
  if(state.mode==='inside'){
    sec.appendChild(h('<div class="sec-title">球内的电荷 · 单位 µC</div>'));
    sliderQ(sec,'q1',0,'q_1（球心）');
    sliderQ(sec,'q2',1,'q_2（球内偏置）');
    sec.appendChild(h('<div class="ex-note" style="margin-top:9px">'+richHTML(
      'q₁ 每变化 <b>0.25 µC</b>（滑块一格），穿过球面的场线就正好多/少 <b>2 条</b> —— '+
      '因为本页约定"1 条场线 ≡ q₀ = 0.125 µC"。<br>'+
      '把 <b>q₁ 拖到 0</b>：球内没有净电荷，穿出与穿入的根数<b>一样多</b>，净根数 = 0 ⇒ Φ = 0。'+
      '⚠️ 这时画面上仍有场线（q₂ 自己的），只是它们<b>穿出多少就穿入多少</b>。')+'</div>'));
    sec.appendChild(h('<div class="sec-title" style="margin-top:14px">高斯面</div>'));
    sliderR(sec);
    btnRow(sec,[
      {t:'q₁ = 0（净通量为 0）', on:Math.abs(state.q[0])<1e-9,
        act:()=>{ state.q[0]=0; renderPanel(); updateAll(); }},
      {t:'q₁ = +2.00 µC', on:Math.abs(state.q[0]-2)<1e-9,
        act:()=>{ state.q[0]=2; renderPanel(); updateAll(); }},
    ]);
  } else if(state.mode==='outside'){
    sec.appendChild(h('<div class="sec-title">球外电荷 · 单位 µC</div>'));
    sliderQ(sec,'q3',2,'球外 q_3');
    sliderQ(sec,'q4',3,'球外 q_4');
    sec.appendChild(h('<div class="ex-note" style="margin-top:9px">'+richHTML(
      '★ <b>把这两个滑块随便拖，"净穿出根数"永远不变</b>（只要球内电荷不动）。'+
      '变大的是"穿出"和"穿入"这两个数 —— 它们<b>同步增加、互相抵消</b>。<br>'+
      '⚠️ 球外电荷当然不是"什么都没做"：它们把球面附近的场强改得<b>高低不平</b>（切到 ③ 看）。'+
      '只是"穿过球面的净条数"这件事，它们做不了主。')+'</div>'));
    sec.appendChild(h('<div class="sec-title" style="margin-top:14px">球内的电荷（保持不动看结论）</div>'));
    sliderQ(sec,'q1',0,'q_1（球心）');
    sec.appendChild(h('<div class="sec-title" style="margin-top:12px">高斯面</div>'));
    sliderR(sec);
    btnRow(sec,[
      {t:'球外全清 0', on:Math.abs(state.q[2])<1e-9 && Math.abs(state.q[3])<1e-9,
        act:()=>{ state.q[2]=0; state.q[3]=0; renderPanel(); updateAll(); }},
      {t:'球外 q₃=+2 / q₄=−1', on:Math.abs(state.q[2]-2)<1e-9 && Math.abs(state.q[3]+1)<1e-9,
        act:()=>{ state.q[2]=2; state.q[3]=-1; renderPanel(); updateAll(); }},
      /* ⚠️ 预设值必须落在 Q_OUT_RANGE=[−2,2] 内：写成 3 的话滑块会自己 clamp 到 2，
         而 state 仍是 3 ⇒ 滑块显示与真实状态不一致（静默 bug，不报错） */
      {t:'球外 q₃=+2 / q₄=+2（净 +4）', on:Math.abs(state.q[2]-2)<1e-9 && Math.abs(state.q[3]-2)<1e-9,
        act:()=>{ state.q[2]=2; state.q[3]=2; renderPanel(); updateAll(); }},
    ]);
  } else {
    sec.appendChild(h('<div class="sec-title">探针 P 在球面上的位置</div>'));
    mkRange(sec,{k:'th', label:'θ_P', wide:true, min:0, max:180, step:1,
      get:()=>state.Pth, set:v=>{ state.Pth=v; }, fmt:v=>v.toFixed(0)+'°'});
    mkRange(sec,{k:'ph', label:'φ_P', wide:true, min:0, max:360, step:1,
      get:()=>state.Pph, set:v=>{ state.Pph=v; }, fmt:v=>v.toFixed(0)+'°'});
    sec.appendChild(h('<div class="ex-note" style="margin-top:9px">'+richHTML(
      '<b>球面上每一处的 @{E} 都不一样</b>（大小和方向都变）—— 这正是"场是逐点定义的"的直观含义。'+
      '但右上角卡片里 <b>Φ = Q内/ε₀ 那一行，无论怎么拖 P 都不会变</b>：'+
      '通量是"整块面"的事，不是"某一点"的事。')+'</div>'));
    sec.appendChild(h('<div class="sec-title" style="margin-top:14px">球外电荷（改它们，看 P 点的场怎么被拉偏）</div>'));
    sliderQ(sec,'q3',2,'球外 q_3');
    sliderQ(sec,'q4',3,'球外 q_4');
    sec.appendChild(h('<div class="sec-title" style="margin-top:12px">高斯面</div>'));
    sliderR(sec);
    btnRow(sec,[
      {t:'球外全清 0（P 点只剩球内的场）', on:Math.abs(state.q[2])<1e-9 && Math.abs(state.q[3])<1e-9,
        act:()=>{ state.q[2]=0; state.q[3]=0; renderPanel(); updateAll(); }},
      {t:'恢复 q₃=+2 / q₄=−1', on:Math.abs(state.q[2]-2)<1e-9 && Math.abs(state.q[3]+1)<1e-9,
        act:()=>{ state.q[2]=2; state.q[3]=-1; renderPanel(); updateAll(); }},
      /* ★ 一对对照按钮：P 正对 q₃ ⇒ 球外分量最强（红紫几乎重合）；
         P 挪到关于球心的正对面 ⇒ 球外分量最弱、球内分量相对最大（青最长，三段差异最清楚）。
         ⚠️ "正对面"要 θ、φ 同时取反（θ→180−θ、φ→φ+180），只改 φ 那是绕 z 轴的镜像、不是对面。 */
      {t:'P 正对 q₃（球外场最强）', on:Math.abs(state.Pth-79)<3 && Math.abs(state.Pph-27)<3,
        act:()=>{ state.Pth=79;  state.Pph=27;  renderPanel(); updateAll(); }},
      {t:'P 挪到 q₃ 的正对面（球外最弱）', on:Math.abs(state.Pth-101)<3 && Math.abs(state.Pph-207)<3,
        act:()=>{ state.Pth=101; state.Pph=207; renderPanel(); updateAll(); }},
    ]);
  }
}
