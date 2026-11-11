/* ============================================================================
   5.2 变化的电场激发磁场 —— 页面专属（一）：场景装配 / 信息卡 / 面板上半
   ⚠️ 所有进画布的串都必须走 parseRich()，所有进 DOM 的串都必须走 richHTML()。
   ★ 场景造型对齐经典教材图：圆盘极板正对（水平间隙沿 x）、E 水平穿间隙（品红）、
     B 环画成页面里的椭圆（y-z 平面圆在近正视相机下呈窄椭圆）、标 a/b/r/R 与 i_C。
   ============================================================================ */

/* ---------- 画布小卡助手 ---------- */
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
const ZL = 1e4+40;
const WIRE_HEX= '#8AA3AF';         /* 导线（灰青，让电流箭头跳出来） */
const IC_HEX  = '#7B5EA7';         /* 传导电流 i_C（紫，教材图同款） */
const E_HEX   = '#D4537E';         /* 极板间电场 E（品红，教材图同款） */
const B_HEX   = '#0F9ED5';         /* 磁场 B（蓝） */
const JD_HEX  = '#3E9B4F';         /* 位移电流标注（绿） */
const DISK_FILL='#F5E7C1';         /* 圆盘极板（教材图的米黄） */
const DISK_EDGE='#B98F3E';
const SURF_HEX= '#B85A1E';         /* 曲面 S1/S2 */

function loopPts(x0,r,n=N_LP){
  const pts=[]; for(let i=0;i<=n;i++){ const a=2*Math.PI*i/n; pts.push(loopPt(x0,r,a)); }
  return pts;
}
/* 圆盘（y-z 平面，圆心 x0，半径 r） */
function diskPts(x0,r,n=48){
  const pts=[]; for(let i=0;i<=n;i++){ const a=2*Math.PI*i/n; pts.push(pt(x0,r*Math.cos(a),r*Math.sin(a))); }
  return pts;
}

/* ══════════════════════════ 右上角信息卡 ══════════════════════════ */
function infoCard(title,rows,h){
  const x0=CARD_X(), y0=CARD_Y, w=CARD_W;
  crd(x0,y0,w,h);
  txt(x0+12,y0+15,title,{size:11.5,bold:true,color:'#1F3D4C'});
  rows.forEach((r,i)=>{
    const y=y0+38+i*19;
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
/* 导线 + 中轴 + i_C 箭头（紫） + 载流子 */
function drawWire(){
  if(!state.show.wire) return;
  /* 贯穿两盘的细黑轴（参考图的中心杆） */
  line(pt(-WIRE_X,0,0), pt(WIRE_X,0,0), {color:'#26343B',w:1.25,z:ZL-6});
  /* 盘外的粗导线 */
  line(pt(-WIRE_X,0,0), pt(-PL_X-PL_T,0,0), {color:WIRE_HEX,w:4.8,z:ZL-3});
  line(pt(PL_X+PL_T,0,0), pt(WIRE_X,0,0), {color:WIRE_HEX,w:4.8,z:ZL-3});
  /* 灰色接线套管（参考图盘两侧的小圆角套筒） */
  for(const s of [-1,1]){
    const x0=s*(PL_X+PL_T+0.035), x1=s*(PL_X+PL_T+0.135);
    line(pt(x0,0,0), pt(x1,0,0), {color:'#C9D3D8',w:9.5,z:ZL-2});
    line(pt(x0,0,0), pt(x1,0,0), {color:'#8A9AA3',w:1.0,z:ZL-1});
  }
  const I=conductionI(state.t);
  if(Math.abs(I)>1e-14){
    const sgn=Math.sign(I);
    arrow(pt(-0.545,0,0), pt(-0.545+sgn*0.13,0,0), {color:IC_HEX,w:3.2,headScale:1.15,z:ZL-2});
    arrow(pt(PL_X+0.26,0,0), pt(PL_X+0.26+sgn*0.13,0,0), {color:IC_HEX,w:3.2,headScale:1.15,z:ZL-2});
  }
  text(pt(-0.545,0,0), 'i_C', {color:IC_HEX,size:14,bold:true,dx:-10,dy:-18,align:'right',z:ZL});
  text(pt(PL_X+0.30,0,0), 'i_C', {color:IC_HEX,size:14,bold:true,dx:12,dy:-18,z:ZL});
}
function drawCarriers(){
  if(!state.show.car || !state.show.wire) return;
  const N=14;
  for(let i=0;i<N;i++){
    const u=((i/N+state.flow)%1+1)%1;
    const x=u<0.5 ? -WIRE_X+u*2*(WIRE_X-PL_X) : PL_X+(u-0.5)*2*(WIRE_X-PL_X);
    marker(pt(x,0,0), {r:3.0,color:'#F5FAFC',ring:'#0F4C66',z:ZL+4});
  }
}
/* 圆盘极板：有厚度的米黄圆盘 + 盘面电荷网格（参考教材图） */
function drawPlates(){
  if(!state.show.plate) return;
  const Q=qPlate(state.t), frac=Math.abs(Q)/(EPS0*state.E0*1e3*S_PLATE);
  /* 盘的厚度：先画背面的暗色盘，再画朝向间隙的亮色盘，最后补上下两条侧壁 */
  for(const s of [-1,1]){
    const xf=s*PL_X, xb=s*(PL_X+PL_T);
    poly(diskPts(xb,PL_R), {fill:'#E3BF74',stroke:'#B98F3E',w:1.4,fillAlpha:0.98,strokeAlpha:0.95,z:ZL-7});
    line(pt(xb,PL_R,0), pt(xf,PL_R,0), {color:'#B98F3E',w:6.2,z:ZL-6});
    line(pt(xb,-PL_R,0), pt(xf,-PL_R,0), {color:'#B98F3E',w:6.2,z:ZL-6});
    poly(diskPts(xf,PL_R), {fill:DISK_FILL,stroke:DISK_EDGE,w:1.7,fillAlpha:0.96,strokeAlpha:1,z:ZL-3});
  }
  /* 盘面电荷：固定网格位置，符号与颜色随 Q(t) 翻转 */
  if(frac>0.04){
    const PTS=[[-.62,.42],[-.66,.02],[-.56,-.44],[-.18,.62],[-.12,.10],[-.20,-.62],[.42,.54],[.52,.04],[.44,-.52]];
    const sgn=Math.sign(Q)||1;
    const col=sgn>0?'#C62828':'#1565C0';
    for(const [yn,zn] of PTS){
      const y=yn*PL_R, z=zn*PL_R;
      text(pt(-PL_X+0.004,y,z), sgn>0?'+':'−', {color:col,size:15,bold:true,dx:0,dy:5,align:'center',z:ZL+2});
      text(pt(PL_X-0.004,y,z),  sgn>0?'−':'+', {color:sgn>0?'#1565C0':'#C62828',size:15,bold:true,dx:0,dy:5,align:'center',z:ZL+2});
    }
  }
  /* R：左盘中心 → 盘缘（竖直尺寸线，参考图同款；显式画箭头保证不被盘面填充压住） */
  line(pt(-PL_X,0,0), pt(-PL_X,PL_R,0), {color:'#7A5A18',w:1.7,z:ZL+4});
  arrow(pt(-PL_X,0,0), pt(-PL_X,PL_R,0), {color:'#7A5A18',w:1.7,headScale:0.95,z:ZL+5});
  text(pt(-PL_X,PL_R*0.56,0), 'R', {color:'#7A5A18',size:13,bold:true,dx:-14,dy:0,align:'right',z:ZL+5});
  /* q / −q：放在盘底（符号本身已标出正负，这里只补符号名） */
  text(pt(-PL_X,-PL_R-0.045,0), Q>=0?'q':'−q', {color:'#C62828',size:14,bold:true,dx:0,dy:18,align:'center',z:ZL});
  text(pt(PL_X,-PL_R-0.045,0), Q>=0?'−q':'q', {color:'#1565C0',size:14,bold:true,dx:0,dy:18,align:'center',z:ZL});
}
/* 极板间电场：一排水平品红箭头（沿 +x；|y|<R 内五根），随 E(t) 翻转与强弱 */
function drawGapE(){
  if(!state.show.egap) return;
  const E=gapE(state.t), frac=Math.abs(E)/(state.E0*1e3);
  if(frac>0.04){
    const sgn=Math.sign(E), half=(PL_X-0.018)*frac;
    const al=0.32+0.68*frac;
    for(const y of [-0.118,-0.059,0,0.059,0.118]){
      arrow(pt(-sgn*half,y,0), pt(sgn*half,y,0), {color:E_HEX,w:2.0,headScale:0.92,alpha:al,z:ZL-2});
    }
  }
  text(pt(0.055,0.182,0), '@{E}', {color:E_HEX,size:13,bold:true,dx:0,dy:-10,align:'center',z:ZL});
}
/* 位移电流（绿色虚线箭头，与 E 平行） */
function drawJd(){
  if(!state.show.egap) return;
  const dE=dEdt(state.t), peak=state.E0*1e3*OM();
  if(Math.abs(dE)/peak<0.08) return;               /* 变化率太小不画（下限以下不画） */
  const sgn=Math.sign(dE);
  arrow(pt(-0.10*sgn,0.155,0), pt(0.10*sgn,0.155,0), {color:JD_HEX,w:1.7,dash:[4,3],headScale:0.92,z:ZL-2});
}
/* B 场环（蓝）+ 安培环 L1/L2（紫，按需显示） */
function drawLoops(){
  const r=state.rLoop, showB=state.show.bloop, showA=state.show.amp;
  if(!showB && !showA) return;
  const I=conductionI(state.t), hasI=Math.abs(I)>1e-14, sgn=hasI?Math.sign(I):1;
  const lenB=clampLen(Math.abs(bGap(R_BIG,state.t))*3e12,0.03,0.09);
  const lenIn=clampLen(Math.abs(bGap(r,state.t))*3e12,0.03,0.08);
  if(showB){
    /* 教材图：外大环 + 穿过间隙的内环，都是蓝色 B 场线 */
    curve(loopPts(LOOP_X2,R_BIG), {color:B_HEX,w:2.0,alpha:0.85,z:ZL-6});
    curve(loopPts(LOOP_X2,r), {color:B_HEX,w:1.9,alpha:0.9,z:ZL-5});
    if(hasI){
      for(let k=0;k<6;k++){
        const th=2*Math.PI*k/6, p0=loopPt(LOOP_X2,R_BIG,th);
        arrow(p0, vadd(p0, vmul(bDir(th,sgn),lenB)), {color:B_HEX,w:1.8,headScale:0.9,alpha:0.9,z:ZL-2});
      }
      for(let k=0;k<4;k++){
        const th=2*Math.PI*k/4+Math.PI/4, p0=loopPt(LOOP_X2,r,th);
        arrow(p0, vadd(p0, vmul(bDir(th,sgn),lenIn)), {color:B_HEX,w:1.7,headScale:0.88,alpha:0.9,z:ZL-2});
      }
    }
    text(pt(LOOP_X2,R_BIG,0), '@{B}', {color:B_HEX,size:13,bold:true,dx:12,dy:-10,z:ZL});
  }
  if(showA){
    /* 安培环：L1 套导线；L2 套间隙。已有蓝色 B 环时 L2 用紫色虚线叠加 */
    curve(loopPts(LOOP_X1,r), {color:'#7B5EA7',w:1.8,alpha:0.95,z:ZL-5});
    curve(loopPts(LOOP_X2,r), {color:'#7B5EA7',w:showB?1.2:1.8,alpha:showB?0.8:0.95,dash:showB?[5,4]:null,z:ZL-4});
    if(hasI){
      const len1=clampLen(Math.abs(bLoop(r,state.t))*3e12,0.03,0.08);
      for(let k=0;k<4;k++){
        const th=2*Math.PI*k/4+Math.PI/4, p0=loopPt(LOOP_X1,r,th);
        arrow(p0, vadd(p0, vmul(bDir(th,sgn),len1)), {color:'#7B5EA7',w:1.6,headScale:0.85,z:ZL-1});
      }
      if(!showB){
        for(let k=0;k<4;k++){
          const th=2*Math.PI*k/4+Math.PI/4, p0=loopPt(LOOP_X2,r,th);
          arrow(p0, vadd(p0, vmul(bDir(th,sgn),lenIn)), {color:'#7B5EA7',w:1.6,headScale:0.85,z:ZL-1});
        }
      }
    }
    text(pt(LOOP_X1,r,0), 'L_1', {color:'#7B5EA7',size:11,bold:true,dx:-8,dy:-10,align:'right',z:ZL});
    text(pt(LOOP_X2,-r,0), 'L_2', {color:'#7B5EA7',size:11,bold:true,dx:20,dy:28,z:ZL});
  }
  /* a、b 两点 + r 标注（内环上的上下两点） */
  if(r<PL_R*1.2){
    marker(pt(LOOP_X2,r,0), {r:4.4,color:'#37474F',z:ZL+2});
    marker(pt(LOOP_X2,-r,0), {r:4.4,color:'#37474F',z:ZL+2});
    text(pt(LOOP_X2,r,0), 'a', {color:'#26343B',size:13,bold:true,dx:14,dy:-8,z:ZL+2});
    text(pt(LOOP_X2,-r,0), 'b', {color:'#26343B',size:13,bold:true,dx:26,dy:14,z:ZL+2});
    /* r：内环半径，中心 → a（显式画，避免与粉色 E 线混在一起看不清） */
    line(pt(LOOP_X2,0,0), pt(LOOP_X2,r,0), {color:'#26343B',w:1.5,z:ZL+4});
    arrow(pt(LOOP_X2,0,0), pt(LOOP_X2,r,0), {color:'#26343B',w:1.5,headScale:0.85,z:ZL+5});
    text(pt(LOOP_X2,r*0.55,0), 'r', {color:'#26343B',size:13,bold:true,dx:10,dy:0,align:'left',z:ZL+5});
  }
}
/* 曲面：S1 = L1 上的平盘（导线穿过）；S2 = 从 L1 鼓起、穿过极板间隙 */
function drawSurf(){
  if(!state.show.surf || !state.show.amp) return;
  if(state.surf==='S1'){
    poly(loopPts(LOOP_X1,state.rLoop), {fill:SURF_HEX,stroke:SURF_HEX,w:1.2,fillAlpha:0.16,strokeAlpha:0.8,z:ZL-6});
    textScreen(12,62, 'S_1 平盘：导线穿过 ⇒ 有 I_c', {color:SURF_HEX,size:11.5,bold:true});
  } else {
    const tipX=LOOP_X1+0.36;
    for(const u of [0.25,0.5,0.75]){
      const xu=LOOP_X1+0.36*u, ru=state.rLoop*(1-u*0.96);
      curve(loopPts(xu,ru), {color:SURF_HEX,w:0.9,alpha:0.45,z:ZL-6});
    }
    for(let k=0;k<8;k++){
      const th=2*Math.PI*k/8, pts=[];
      for(let i=0;i<=12;i++){
        const u=i/12, xu=LOOP_X1+0.36*u, ru=state.rLoop*(1-u*0.96);
        pts.push(loopPt(xu,ru,th));
      }
      curve(pts,{color:SURF_HEX,w:0.9,alpha:0.45,z:ZL-6});
    }
    marker(pt(tipX,0,0), {r:2.6,color:SURF_HEX,z:ZL-5});
    textScreen(12,62, 'S_2 鼓起穿间隙：没有电荷穿过 ⇒ 但有 I_d', {color:SURF_HEX,size:11.5,bold:true});
  }
}
/* 位移电流绿色标注（固定槽位竖排） */
function drawJdLabel(){
  if(!state.show.egap) return;
  textScreen(12,84, '@{J}_d = ε₀·∂@{E}/∂t（位移电流，绿虚线）', {color:JD_HEX,size:11.5,bold:true});
}

/* ══════════════════════════ 场景装配 ══════════════════════════ */
function buildScene(){
  prims=[];                     /* ★ 第一句必须是 prims=[] */
  drawWire();
  drawCarriers();
  drawPlates();
  drawGapE();
  drawJd();
  drawSurf();
  drawLoops();
  drawJdLabel();
}

/* ══════════ 信息卡内容 ══════════ */
function currentCard(){
  const I=conductionI(state.t), r=state.rLoop;
  const sat=r>=PL_R;
  return ['全电流定律：I_c ≡ I_d',[
    ['极板间 E(t)', (gapE(state.t)/1e3).toFixed(1)+' kV/m',E_HEX],
    ['dE/dt', (dEdt(state.t)/1e3).toFixed(1)+' kV/(m·s)'],
    ['极板电荷 Q(t) = ε₀ES', (qPlate(state.t)*1e9).toFixed(2)+' nC'],
    ['传导电流 I_c（导线）', (I*1e9).toFixed(2)+' nA','#B85A1E'],
    ['位移电流 I_d = ε₀S·dE/dt', (displaceI(state.t)*1e9).toFixed(2)+' nA','#2E7D32'],
    ['L_1 环上 B(r)', (bLoop(r,state.t)*1e12).toFixed(3)+' pT','#7B5EA7'],
    ['L_2 环上 B(r)'+(sat?'（包围全部 I_d）':'（包围部分 I_d）'), (bGap(r,state.t)*1e12).toFixed(3)+' pT','#7B5EA7'],
    ['§ 同一个环 L_1：两个曲面，同一个 B'],
    sat ? ['r ≥ R：L_1 与 L_2 包围全部电流','B 相同','#2E7D32']
        : ['r < R：L_2 只包围 (r/R)²·I_d','B 较小','#B85A1E'],
  ],38+9*19+8];
}
function drawOverlays(){ const c=currentCard(); infoCard(c[0],c[1],c[2]); }

/* ══════════════════════════ 面板底部结论条 ══════════════════════════ */
function subNote(){
  const ringNote=state.rLoop>=PL_R
    ? '当前 r ≥ R，L_1 与 L_2 都包围全部电流，所以两环上的 @{B} <b>相同</b>。'
    : '当前 r < R，L_2 只包围 (r/R)²·I_d，所以它的 @{B} 比 L_1 小；把 r 拖过 R 即可看到二者相同。';
  return '导线里的电荷没有穿过极板间隙 —— 间隙里<b>没有电荷在动</b>，只有 @{E} 在变化。'+
    '绿虚线 @{J}_d = ε₀·∂@{E}/∂t（<b>位移电流</b>）接过了这一棒，激发环形 @{B}。'+ringNote+'<br>'+
    '🔑 位移电流不是电荷的位移，是<b>变化的电场本身</b>在激发磁场。';
}

/* ══════════════════════════ 右侧面板（上半） ══════════════════════════ */
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
const SHOW_ITEMS=[
  {k:'wire',t:'导线与 i_C'},{k:'car',t:'载流子'},{k:'plate',t:'圆盘极板与电荷'},
  {k:'egap',t:'间隙 @{E} 与 @{J}_d'},{k:'bloop',t:'@{B} 场环'},{k:'amp',t:'安培环 L_1/L_2'},
  {k:'surf',t:'曲面 S_1/S_2'},
];
function mkRange(sec,d){
  const r=h('<div class="slider-row'+(d.wide?' w':'')+'"><label>'+richHTML(d.label)+'</label>'+
    '<input type="range" id="s_'+d.k+'" min="'+d.min+'" max="'+d.max+'" step="'+d.step+'" value="'+d.get()+'">'+
    '<span class="val" id="v_'+d.k+'">'+d.fmt(d.get())+'</span></div>');
  const inp=r.querySelector('input');
  inp.oninput=()=>{
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
  chipRow(sec,SHOW_ITEMS,k=>state.show[k],k=>{
    const next=!state.show[k];
    const othersOn=SHOW_ITEMS.some(it=>it.k!==k && state.show[it.k]);
    if(!next && !othersOn){ toastMsg('至少保留一层显示'); return; }
    state.show[k]=next; needsRender=true; renderPanel();
  });
  sec.appendChild(h('<div class="ex-note" style="margin-top:7px">'+richHTML(subNote())+'</div>'));
}
const SLIDER_FMT={
  E0:v=>'E₀ = '+v.toFixed(0)+' kV/m', fHz:v=>'f = '+v.toFixed(1)+' Hz',
  rLoop:v=>'r = '+v.toFixed(2)+' m', t:v=>'t = '+v.toFixed(2)+' s',
};
function syncSliders(){
  const set=(k,v)=>{ const s=document.getElementById('s_'+k); if(s) s.value=v;
    const e=document.getElementById('v_'+k); if(e) e.textContent=SLIDER_FMT[k]?SLIDER_FMT[k](v):String(v); };
  set('E0',state.E0); set('fHz',state.fHz); set('rLoop',state.rLoop); set('t',state.t);
}
function renderSliders(sec){
  sec.innerHTML='';
  sec.appendChild(h('<div class="slider-group-label">充电过程</div>'));
  mkRange(sec,{k:'E0',label:'极板间场强幅值 E₀',wide:true,min:E0_RANGE[0],max:E0_RANGE[1],step:5,
    get:()=>state.E0,set:v=>{state.E0=v; return clampState().E0;},fmt:v=>'E₀ = '+v.toFixed(0)+' kV/m'});
  mkRange(sec,{k:'fHz',label:'变化频率 f',wide:true,min:F_RANGE[0],max:F_RANGE[1],step:0.1,
    get:()=>state.fHz,set:v=>{state.fHz=v; return clampState().fHz;},fmt:v=>'f = '+v.toFixed(1)+' Hz'});
  mkRange(sec,{k:'rLoop',label:'安培环半径 r（拖过 R=0.16 看 I_d 包围量饱和）',wide:true,min:R_LOOP_RANGE[0],max:R_LOOP_RANGE[1],step:0.01,
    get:()=>state.rLoop,set:v=>{state.rLoop=v; return clampState().rLoop;},fmt:v=>'r = '+v.toFixed(2)+' m',
    after:()=>renderSubSec(document.getElementById('subSec'))});
  sec.appendChild(h('<div class="slider-group-label q" style="margin-top:10px">曲面选择（同一个环 L_1）</div>'));
  chipRow(sec,[{k:'s1',t:'S_1 平盘（导线穿过）'},{k:'s2',t:'S_2 鼓起（穿过极板间隙）'}],
    k=>(state.surf==='S1')===(k==='s1'),
    k=>{ state.surf=(k==='s1')?'S1':'S2'; state.show.surf=true; state.show.amp=true; renderPanel(); updateAll(); });
  sec.appendChild(h('<div class="slider-group-label g" style="margin-top:10px">时间进程</div>'));
  mkRange(sec,{k:'t',label:'时间 t（看 i_C 与 I_d 同步涨落）',wide:true,min:0,max:periodT(),step:0.01,
    get:()=>state.t,set:v=>{state.playing=false; state.t=v;},fmt:v=>'t = '+v.toFixed(2)+' s'});
  btnRow(sec,[
    {t:state.playing?'⏸ 暂停':'▶ 播放', on:!!state.playing, col:'acc',
      act:()=>{ playPause(); renderPanel(); }},
    {t:'↺ t = 0', on:false,
      act:()=>{ state.playing=false; state.t=0; renderPanel(); updateAll(); }},
  ]);
}
