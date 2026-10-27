/* ============================================================================
   5.2 变化的电场激发磁场 —— 页面专属（一）：场景装配 / 信息卡 / 面板上半
   ⚠️ 所有进画布的串都必须走 parseRich()，所有进 DOM 的串都必须走 richHTML()。
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
const WIRE_HEX= '#2E86AB';         /* 导线（淡蓝） */
const E_HEX   = '#D04A3A';         /* 极板间电场 E（红） */
const B_HEX   = '#9B59B6';         /* 磁场 B（紫） */
const IC_HEX  = '#E97132';         /* 传导电流箭头（橙） */
const JD_HEX  = '#3E9B4F';         /* 位移电流标注（绿） */
const PLT_HEX = '#37474F';
const SURF_HEX= '#B85A1E';         /* 曲面（S1/S2） */

function loopPts(x0,r,n=N_LP){
  const pts=[]; for(let i=0;i<=n;i++){ const a=2*Math.PI*i/n; pts.push(loopPt(x0,r,a)); }
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
/* 导线（两段）+ 传导电流箭头 + 载流子 */
function drawWire(){
  if(!state.show.wire) return;
  line(pt(-WIRE_X,0,0), pt(-PL_X,0,0), {color:WIRE_HEX,w:4.6,z:ZL-4});
  line(pt(PL_X,0,0), pt(WIRE_X,0,0), {color:WIRE_HEX,w:4.6,z:ZL-4});
  const I=conductionI(state.t);
  if(Math.abs(I)>1e-12){
    const len=clampLen(Math.abs(I)*4e9,0.02,0.09), sgn=Math.sign(I);
    for(const x of [-0.42,-0.30,-0.18])
      arrow(pt(x,0,0), pt(x+sgn*len,0,0), {color:IC_HEX,w:2.2,headScale:1.0,z:ZL-2});
    for(const x of [0.18,0.30,0.42])
      arrow(pt(x,0,0), pt(x+sgn*len,0,0), {color:IC_HEX,w:2.2,headScale:1.0,z:ZL-2});
  }
  /* ⚠️ 标签组 = 原点锚 + 屏幕固定偏移：I_c 标签锚在导线上时，az=0.7 相机下
     −x 旋进中区 ⇒ 撞 E 标签（vis52 实测 37%）⇒ 收进左上固定槽位 */
  text(pt(0,0,0), 'I_c 传导电流（导线，橙箭头）', {color:'#B85A1E',size:11,bold:true,dx:-168,dy:-114,z:ZL});
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
/* 极板：竖板 + 电荷符号（个数 ∝ |Q|，符号随 Q 翻转） */
function drawPlates(){
  if(!state.show.plate) return;
  const Q=qPlate(state.t), n=Math.min(4,Math.round(Math.abs(Q)/2.5e-10));
  line(pt(-PL_X,-PL_H,0), pt(-PL_X,PL_H,0), {color:PLT_HEX,w:4.2,z:ZL-2});
  line(pt(PL_X,-PL_H,0), pt(PL_X,PL_H,0), {color:PLT_HEX,w:4.2,z:ZL-2});
  /* 极板着色（3.2 的 plateTint 思路：红/蓝随 |Q| 深浅） */
  const a=0.15+0.85*Math.min(1,Math.abs(Q)/(EPS0*state.E0*1e3*S_PLATE));
  const cPos=hexA('#D85A30',a), cNeg=hexA('#378ADD',a);
  line(pt(-PL_X,-PL_H,0), pt(-PL_X,PL_H,0), {color:Q>=0?cPos:cNeg,w:4.2,z:ZL-1});
  line(pt(PL_X,-PL_H,0), pt(PL_X,PL_H,0), {color:Q>=0?cNeg:cPos,w:4.2,z:ZL-1});
  for(let i=0;i<n;i++){
    const y=-PL_H+2*PL_H*(i+0.5)/Math.max(1,n);
    text(pt(-PL_X,y,0), Q>=0?'+':'−', {color:'#C62828',size:11,bold:true,dx:-8,dy:0,align:'right',z:ZL+2});
    text(pt(PL_X,y,0), Q>=0?'−':'+', {color:'#1565C0',size:11,bold:true,dx:8,dy:0,align:'left',z:ZL+2});
  }
}
/* 极板间电场：三列竖直箭头（方向 ±y 随 E 翻转，长度 ∝ E） */
function drawGapE(){
  if(!state.show.egap) return;
  const E=gapE(state.t), h=PL_H*0.85*Math.abs(E)/(state.E0*1e3);
  if(h>LE_MIN){
    const sgn=Math.sign(E);
    for(const x of [-0.05, 0, 0.05])
      arrow(pt(x,-sgn*h,0), pt(x,sgn*h,0), {color:E_HEX,w:2.0,headScale:1.0,z:ZL-2});
  }
  text(pt(0,0,0), '@{E}(t) 极板间', {color:E_HEX,size:11,bold:true,dx:10,dy:-64,z:ZL});
}
/* 位移电流标注（绿色虚线箭头，与 E 平行但标明"不是电荷在动"） */
function drawJd(){
  if(!state.show.egap) return;
  const dE=dEdt(state.t), peak=state.E0*1e3*OM();
  if(Math.abs(dE)/peak<0.08) return;               /* 变化率太小不画（下限以下不画） */
  const sgn=Math.sign(dE), len=0.07;
  arrow(pt(0.02,0,0.055), pt(0.02,sgn*len,0.055), {color:JD_HEX,w:1.6,dash:[4,3],headScale:0.95,z:ZL-2});
}
/* 安培环 L1（套导线）与 L2（套间隙）：圆环 + B 切向箭头 */
function drawLoops(){
  if(!state.show.loop) return;
  for(const x0 of [LOOP_X1, LOOP_X2]){
    curve(loopPts(x0,state.rLoop), {color:B_HEX,w:1.6,alpha:0.9,z:ZL-5});
  }
  const B=bLoop(state.rLoop,state.t), I=conductionI(state.t);
  if(Math.abs(B)>1e-20){
    const sgn=Math.sign(I);
    const len=clampLen(LB_K*Math.abs(I)/(EPS0*S_PLATE*state.E0*1e3*OM()),0,0.10);
    if(len>0.008){
      for(const x0 of [LOOP_X1, LOOP_X2]){
        for(let k=0;k<6;k++){
          const th=2*Math.PI*k/6;
          const p0=loopPt(x0,state.rLoop,th);
          arrow(p0, vadd(p0, vmul(bDir(th,sgn),len)), {color:B_HEX,w:1.8,headScale:0.9,z:ZL-1});
        }
      }
    }
  }
  /* ⚠️ 环上不再放 L_1/L_2 小标签（环 x=0 与右板 x=+0.10 只差 0.10，任何相机角下
     都会与极板符号投影重叠：vis52 三连）⇒ 收进固定标签组 */
  text(pt(0,0,0), '紫环 L_1（套导线）· L_2（套间隙）', {color:B_HEX,size:11,bold:true,dx:-168,dy:-96,z:ZL});
}
/* 曲面：S1 = L1 上的平盘（导线穿过）；S2 = 从 L1 鼓起、穿过极板间的"鼓膜" */
function drawSurf(){
  if(!state.show.surf || !state.show.loop) return;
  if(state.surf==='S1'){
    poly(loopPts(LOOP_X1,state.rLoop), {fill:SURF_HEX,stroke:SURF_HEX,w:1.2,fillAlpha:0.16,strokeAlpha:0.8,z:ZL-6});
    /* ⚠️ 标签组 = 原点锚 + 屏幕固定偏移（环区密集，锚在环上必撞极板符号，vis52 实测 98%） */
    text(pt(0,0,0), 'S_1 平盘：导线穿过 ⇒ 有 I_c', {color:SURF_HEX,size:11,bold:true,dx:-168,dy:96,z:ZL});
  } else {
    /* 鼓膜：从 L1（x=−0.30）向 +x 鼓起，尖端穿过极板间隙（x≈+0.06） */
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
    text(pt(0,0,0), 'S_2 鼓起穿间隙：没有电荷穿过 ⇒ 但有 I_d', {color:SURF_HEX,size:11,bold:true,dx:-168,dy:96,z:ZL});
  }
}
/* 位移电流的绿色标注（与 S 标签同组竖排，跟 egap 开关走） */
function drawJdLabel(){
  if(!state.show.egap) return;
  text(pt(0,0,0), '@{J}_d = ε₀·∂@{E}/∂t（位移电流，绿）', {color:JD_HEX,size:11,bold:true,dx:-168,dy:114,z:ZL});
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
  const I=conductionI(state.t);
  return ['全电流定律：I_c ≡ I_d',[
    ['极板间 E(t)', (gapE(state.t)/1e3).toFixed(1)+' kV/m',E_HEX],
    ['dE/dt', (dEdt(state.t)/1e3).toFixed(1)+' kV/(m·s)'],
    ['极板电荷 Q(t) = ε₀ES', (qPlate(state.t)*1e9).toFixed(2)+' nC'],
    ['传导电流 I_c（导线）', (I*1e9).toFixed(2)+' nA','#B85A1E'],
    ['位移电流 I_d = ε₀S·dE/dt', (displaceI(state.t)*1e9).toFixed(2)+' nA','#2E7D32'],
    ['环上 B(r='+state.rLoop.toFixed(2)+' m)', (bLoop(state.rLoop,state.t)*1e12).toFixed(3)+' pT',B_HEX],
    ['§ 两个曲面，同一个 B'],
    ['S_1 算 I_c，S_2 算 I_d','严格相等 ⇒ 自洽','#2E7D32'],
  ],38+8*19+8];
}
function drawOverlays(){ const c=currentCard(); infoCard(c[0],c[1],c[2]); }

/* ══════════════════════════ 面板底部结论条 ══════════════════════════ */
function subNote(){
  return '导线里的电流没有穿过极板间隙 —— 间隙里<b>没有电荷在动</b>，只有 @{E} 在增长。'+
    '但绿箭头 @{J}_d = ε₀·∂@{E}/∂t（<b>位移电流</b>）接过了这一棒：'+
    '同一个安培环，无论配平盘 S_1 还是鼓膜 S_2，算出的 @{B} <b>完全一样</b>。<br>'+
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
  {k:'wire',t:'导线与 I_c'},{k:'car',t:'载流子'},{k:'plate',t:'极板与电荷'},
  {k:'egap',t:'间隙 @{E} 与 @{J}_d'},{k:'loop',t:'安培环 L_1/L_2 与 @{B}'},{k:'surf',t:'曲面 S_1/S_2'},
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
  mkRange(sec,{k:'rLoop',label:'安培环半径 r',wide:true,min:R_LOOP_RANGE[0],max:R_LOOP_RANGE[1],step:0.01,
    get:()=>state.rLoop,set:v=>{state.rLoop=v; return clampState().rLoop;},fmt:v=>'r = '+v.toFixed(2)+' m'});
  sec.appendChild(h('<div class="slider-group-label q" style="margin-top:10px">曲面选择（同一个环 L_1）</div>'));
  chipRow(sec,[{k:'s1',t:'S_1 平盘（导线穿过）'},{k:'s2',t:'S_2 鼓起（穿过极板间隙）'}],
    k=>(state.surf==='S1')===(k==='s1'),
    k=>{ state.surf=(k==='s1')?'S1':'S2'; renderPanel(); updateAll(); });
  sec.appendChild(h('<div class="slider-group-label g" style="margin-top:10px">时间进程</div>'));
  mkRange(sec,{k:'t',label:'时间 t（看 I_c 与 I_d 同步涨落）',wide:true,min:0,max:periodT(),step:0.01,
    get:()=>state.t,set:v=>{state.playing=false; state.t=v;},fmt:v=>'t = '+v.toFixed(2)+' s'});
  btnRow(sec,[
    {t:state.playing?'⏸ 暂停':'▶ 播放', on:!!state.playing, col:'acc',
      act:()=>{ playPause(); renderPanel(); }},
    {t:'↺ t = 0', on:false,
      act:()=>{ state.playing=false; state.t=0; renderPanel(); updateAll(); }},
  ]);
}
