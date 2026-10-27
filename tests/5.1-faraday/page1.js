/* ============================================================================
   5.1 变化的磁场激发电场 —— 页面专属（一）：场景装配 / 信息卡 / 面板上半
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
const B_HEX   = '#0F9ED5';         /* 磁场区（蓝） */
const EI_HEX  = '#D04A3A';         /* 感应电场 E_i（红） */
const RING_HEX= '#E97132';         /* 导体环（橙） */
const CAR_HEX = C.teal;            /* 载流子 */
const FLX_HEX = '#B85A1E';         /* 磁通阴影 */

function circlePts(r,n=N_RING_PTS){
  const pts=[]; for(let i=0;i<=n;i++){ const a=2*Math.PI*i/n; pts.push(pt(r*Math.cos(a),r*Math.sin(a),0)); }
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
/* 磁区：虚线圆界 + 内部点阵（大小/透明度 ∝ |B|）+ 中心方向符号 ⊙/⊗ */
function drawBField(){
  if(!state.show.bfield) return;
  curve(circlePts(R_B), {color:B_HEX,w:1.6,dash:[7,5],alpha:0.9,z:ZL-4});
  const B=Bt(state.t), a=Math.min(1,Math.abs(B)/state.B0);
  for(let gx=-2;gx<=2;gx++) for(let gy=-2;gy<=2;gy++){
    const x=gx*R_B*0.34, y=gy*R_B*0.34;
    if(Math.hypot(x,y)>R_B*0.80) continue;
    marker(pt(x,y,0), {r:1.2+2.6*a, color:hexA(B_HEX,0.25+0.65*a), z:ZL-5});
  }
  text(pt(0,0,0), B>=0?'⊙':'⊗', {color:B_HEX,size:22,bold:true,dx:0,dy:0,align:'center',z:ZL-3});
  /* ⚠️ B 标签要锚到磁区外（0.30）：锚在 R_B 边上时，低仰角（el=0.5）下
     世界 y 投影被压缩 ⇒ 撞上盘心 ⊙/⊗ 符号（vis51 实测 52%） */
  text(pt(0,0.30,0), '@{B}(t) 垂直纸面、随时间正弦变化', {color:B_HEX,size:11.5,bold:true,dx:0,dy:-10,align:'center',z:ZL});
}
/* 感应电场：三个半径的同心圆环，切向箭头（长度 ∝ |E_φ|，方向随 dB/dt 反号翻转） */
const EI_RINGS=[0.07, R_B, 0.26];
function drawEField(){
  if(!state.show.efield) return;
  for(const r of EI_RINGS){
    const E=EiAt(r,state.t);
    const len=clampLen(Math.abs(E)*LE,0,LE_MAX);
    const pts=circlePts(r);
    curve(pts, {color:EI_HEX,w:1.0,alpha:0.35,z:ZL-6});
    if(len<LE_MIN) continue;                       /* dB/dt 过零瞬间：只留淡环 */
    const sgn=Math.sign(E);                        /* E_φ>0 ⇒ 逆时针 */
    for(let k=0;k<8;k++){
      const a=2*Math.PI*k/8;
      const p0=pt(r*Math.cos(a),r*Math.sin(a),0);
      const da=sgn*len/r;                          /* 弧长 → 角度 */
      const p1=pt(r*Math.cos(a+da),r*Math.sin(a+da),0);
      arrow(p0,p1,{color:EI_HEX,w:1.8,headScale:0.9,alpha:0.95,z:ZL-3});
    }
  }
  /* ⚠️ 标签组 = 世界原点锚 + 屏幕固定偏移竖排（盘左下）：
     圆心密集区里锚在圆上的标签在任何相机角下都会互撞（vis51 实测三连） */
  text(pt(EI_RINGS[2],0,0), '@{E}_i', {color:EI_HEX,size:11.5,bold:true,dx:8,dy:-8,z:ZL});
  text(pt(0,0,0), '@{E}_i（红环 · 涡旋切向）', {color:EI_HEX,size:10.5,dx:-168,dy:108,z:ZL});
}
/* 磁通阴影：环套住的磁通区域（r=min(rLoop,R) 的圆盘） */
function drawFlux(){
  if(!state.show.flux) return;
  const r=Math.min(state.rLoop,R_B);
  const pts=circlePts(r);
  poly(pts, {fill:FLX_HEX,stroke:FLX_HEX,w:0.8,fillAlpha:0.10,strokeAlpha:0.35,z:ZL-8});
  text(pt(0,0,0), 'Φ 穿的面积（橙色阴影）', {color:FLX_HEX,size:10.5,dx:-168,dy:126,z:ZL});
}
/* 导体环 + 载流子（方向与快慢 ∝ I） */
function drawRing(){
  if(!state.show.ring) return;
  curve(circlePts(state.rLoop), {color:RING_HEX,w:3.2,alpha:0.95,z:ZL-2});
  curve(circlePts(state.rLoop), {color:'#8A4A12',w:1.0,alpha:0.8,z:ZL-2});
  text(pt(0,0,0), '导体环（橙环 · 半径可调）', {color:'#8A4A12',size:10.5,dx:-168,dy:144,z:ZL});
}
function drawCarriers(){
  if(!state.show.car || !state.show.ring) return;
  const N=22;
  for(let i=0;i<N;i++){
    const a=state.flow+2*Math.PI*i/N;
    marker(pt(state.rLoop*Math.cos(a),state.rLoop*Math.sin(a),0),
           {r:3.2,color:'#F5FAFC',ring:'#0F4C66',z:ZL+4});
  }
}

/* ══════════════════════════ 场景装配 ══════════════════════════ */
function buildScene(){
  prims=[];                     /* ★ 第一句必须是 prims=[] */
  drawFlux();
  drawBField();
  drawEField();
  drawRing();
  drawCarriers();
}

/* ══════════ 信息卡内容 ══════════ */
function fmtEmf(){ const e=emfAt(state.rLoop,state.t); return (e*1000).toFixed(1)+' mV'; }
function currentCard(){
  const B=Bt(state.t), dB=dBdt(state.t), inB=state.rLoop<R_B;
  return ['法拉第电磁感应定律',[
    ['@{B}(t) = B₀·sin(ωt)', B.toFixed(3)+' T',B_HEX],
    ['dB/dt', (dB>=0?'+':'')+dB.toFixed(2)+' T/s'],
    ['穿过环的磁通 Φ', (fluxAt(state.rLoop,state.t)*1000).toFixed(2)+' mWb'],
    ['感应电动势 ℰ = −dΦ/dt', fmtEmf(),'#B85A1E'],
    ['环上感应电场 E_i(r环)', EiAt(state.rLoop,state.t).toFixed(3)+' V/m'],
    ['环电流 I = ℰ/R', (ringI(state.t)*1000).toFixed(1)+' mA'],
    ['§ 环的位置'],
    inB?['环在磁区内','E_i ∝ r（越大越强）','#2E7D32']
       :['环套住整个磁区','ℰ 已饱和（不再随 r 变大）','#B85A1E'],
  ],38+8*19+8];
}
function drawOverlays(){ const c=currentCard(); infoCard(c[0],c[1],c[2]); }

/* ══════════════════════════ 面板底部结论条 ══════════════════════════ */
function subNote(){
  return '磁场 @{B}(t) 一变，空间就激发出<b>涡旋状感应电场 @{E}_i</b>（红环，切向）——'+
    '它不附着于导线，<b>没有导体环也存在</b>；导体环只是"接住"它：环里出现感应电流。<br>'+
    '🔑 方向看楞次：电流的效果总是<b>阻碍磁通的变化</b>（dB/dt 变号时红环整体掉头）。';
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
  {k:'bfield',t:'磁场区 @{B}'},{k:'efield',t:'感应电场 @{E}_i'},{k:'flux',t:'磁通阴影'},
  {k:'ring',t:'导体环'},{k:'car',t:'载流子'},
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
  B0:v=>'B₀ = '+v.toFixed(2)+' T', fHz:v=>'f = '+v.toFixed(1)+' Hz',
  rLoop:v=>'r = '+v.toFixed(2)+' m', t:v=>'t = '+v.toFixed(2)+' s',
};
function syncSliders(){
  const set=(k,v)=>{ const s=document.getElementById('s_'+k); if(s) s.value=v;
    const e=document.getElementById('v_'+k); if(e) e.textContent=SLIDER_FMT[k]?SLIDER_FMT[k](v):String(v); };
  set('B0',state.B0); set('fHz',state.fHz); set('rLoop',state.rLoop); set('t',state.t);
}
function renderSliders(sec){
  sec.innerHTML='';
  sec.appendChild(h('<div class="slider-group-label">磁场与导体环</div>'));
  mkRange(sec,{k:'B0',label:'磁感应强度幅值 B₀',wide:true,min:B0_RANGE[0],max:B0_RANGE[1],step:0.05,
    get:()=>state.B0,set:v=>{state.B0=v; return clampState().B0;},fmt:v=>'B₀ = '+v.toFixed(2)+' T'});
  mkRange(sec,{k:'fHz',label:'磁场变化频率 f',wide:true,min:F_RANGE[0],max:F_RANGE[1],step:0.1,
    get:()=>state.fHz,set:v=>{state.fHz=v; return clampState().fHz;},fmt:v=>'f = '+v.toFixed(1)+' Hz'});
  mkRange(sec,{k:'rLoop',label:'导体环半径 r（拖过 R=0.15 看 ℰ 饱和）',wide:true,min:R_LOOP_RANGE[0],max:R_LOOP_RANGE[1],step:0.01,
    get:()=>state.rLoop,set:v=>{state.rLoop=v; return clampState().rLoop;},fmt:v=>'r = '+v.toFixed(2)+' m'});
  sec.appendChild(h('<div class="slider-group-label g" style="margin-top:10px">时间进程</div>'));
  mkRange(sec,{k:'t',label:'时间 t（看红环掉头、载流子换向）',wide:true,min:0,max:periodT(),step:0.01,
    get:()=>state.t,set:v=>{state.playing=false; state.t=v;},fmt:v=>'t = '+v.toFixed(2)+' s'});
  btnRow(sec,[
    {t:state.playing?'⏸ 暂停':'▶ 播放', on:!!state.playing, col:'acc',
      act:()=>{ playPause(); renderPanel(); }},
    {t:'↺ t = 0', on:false,
      act:()=>{ state.playing=false; state.t=0; renderPanel(); updateAll(); }},
  ]);
}
