/* ============================================================================
   5.4 电磁场遇到介质边界会怎样 —— 页面专属（一）：场景装配 / 信息卡 / 面板上半
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
const M1_FILL = '#0F9ED5';         /* 介质 1（淡蓝） */
const M2_FILL = '#E97132';         /* 介质 2（淡橙） */
const IF_HEX  = '#37474F';         /* 界面线 */
const E1_HEX  = '#136A9B';         /* E_1 */
const E2_HEX  = '#B85A1E';         /* E_2 */
const ET_HEX  = '#D04A3A';         /* 切向分量 */
const EN_HEX  = '#9B59B6';         /* 法向分量 */
const RI_HEX  = '#D04A3A';         /* 入射 */
const RR_HEX  = '#E97132';         /* 反射 */
const RT_HEX  = '#3E9B4F';         /* 透射 */

function arcPts(cx,cy,r,a0,a1,n=24){     /* xy 平面角弧（从 a0 到 a1，°） */
  const pts=[];
  for(let i=0;i<=n;i++){ const a=(a0+(a1-a0)*i/n)*Math.PI/180; pts.push(pt(cx+r*Math.cos(a),cy+r*Math.sin(a),0)); }
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

/* ══════════════════════════ 公共：界面与介质 ══════════════════════════ */
function drawMedia(){
  poly([pt(-0.5,0,0),pt(0.5,0,0),pt(0.5,0.36,0),pt(-0.5,0.36,0)],
       {fill:M1_FILL,stroke:false,w:0,fillAlpha:0.10,z:ZL-9});
  poly([pt(-0.5,0,0),pt(0.5,0,0),pt(0.5,-0.36,0),pt(-0.5,-0.36,0)],
       {fill:M2_FILL,stroke:false,w:0,fillAlpha:0.12,z:ZL-9});
  line(pt(-0.5,0,0), pt(0.5,0,0), {color:IF_HEX,w:3.0,z:ZL-5});
  /* ⚠️ 介质标签 = 原点锚 + 屏幕固定偏移（左下竖排）：左缘撞扁盒、右缘撞 E_2、
     顶部被信息卡带扫（vis54 三连）⇒ 固定槽位 */
  text(pt(0,0,0), '介质 1：ε_r1 = '+state.epsr1, {color:'#0C447C',size:11,bold:true,dx:-168,dy:96,z:ZL});
  text(pt(0,0,0), '介质 2：ε_r2 = '+state.epsr2, {color:'#712B13',size:11,bold:true,dx:-168,dy:114,z:ZL});
}

/* ══════════════════════════ ① 衔接条件推导 ══════════════════════════ */
function drawBC(){
  if(state.mode!=='bc') return;
  const {E1,E2}=bcFields();
  /* E_1（介质1，入射点左）与 E_2（介质2，右） */
  const P1=pt(-0.20,0.17,0), P2=pt(0.22,-0.17,0);
  const L1=0.15, L2=0.15*Math.hypot(E2.t,E2.n);
  arrow(P1, vadd(P1,pt(E1.t*L1,E1.n*L1,0)), {color:E1_HEX,w:2.6,headScale:1.05,z:ZL-1});
  arrow(P2, vadd(P2,pt(E2.t*L2/Math.hypot(E2.t,E2.n),E2.n*L2/Math.hypot(E2.t,E2.n),0)), {color:E2_HEX,w:2.6,headScale:1.05,z:ZL-1});
  text(P1, '@{E}_1', {color:E1_HEX,size:12,bold:true,dx:-10,dy:-14,align:'right',z:ZL});
  text(P2, '@{E}_2', {color:E2_HEX,size:12,bold:true,dx:10,dy:16,z:ZL});
  /* 切向/法向分量（E_2 的分解，界面附近） */
  if(state.show.bc){
    const b0=pt(0.22,0,0);
    arrow(b0, vadd(b0,pt(E2.t*0.15,0,0)), {color:ET_HEX,w:2.0,dash:[5,3],headScale:0.9,z:ZL-1});
    arrow(b0, vadd(b0,pt(0,E2.n*0.15,0)), {color:EN_HEX,w:2.0,dash:[5,3],headScale:0.9,z:ZL-1});
    text(b0, 'E_2t', {color:ET_HEX,size:10.5,bold:true,dx:16,dy:-4,z:ZL});
    text(b0, 'E_2n', {color:EN_HEX,size:10.5,bold:true,dx:6,dy:-18,z:ZL});
  }
  /* 小矩形回路（跨界面，高 h 可压扁）：∮E·dl=(E_1t−E_2t)·l */
  const h=state.hLoop, x0=-0.10, l=0.20;
  const yT=h/2, yB=-h/2;
  arrow(pt(x0,yT,0), pt(x0+l,yT,0), {color:ET_HEX,w:1.8,headScale:0.9,z:ZL-2});
  arrow(pt(x0+l,yB,0), pt(x0,yB,0), {color:ET_HEX,w:1.8,headScale:0.9,z:ZL-2});
  line(pt(x0,yB,0), pt(x0,yT,0), {color:'#8AA3AF',w:1.2,dash:[4,3],z:ZL-2});
  line(pt(x0+l,yB,0), pt(x0+l,yT,0), {color:'#8AA3AF',w:1.2,dash:[4,3],z:ZL-2});
  text(pt(x0+l/2,yT,0), 'l（上边在介质 1）', {color:ET_HEX,size:10.5,dx:0,dy:-8,align:'center',z:ZL});
  text(pt(x0,yB,0), 'h→0', {color:'#5F7482',size:10.5,dx:-6,dy:14,align:'right',z:ZL});
  /* 高斯扁盒（法向 D_n） */
  if(state.show.dn){
    const gx=-0.34, gw=0.12, gh=0.05;
    poly([pt(gx,-gh,0),pt(gx+gw,-gh,0),pt(gx+gw,gh,0),pt(gx,gh,0)],
         {fill:EN_HEX,stroke:EN_HEX,w:1.2,dash:[5,3],fillAlpha:0.08,strokeAlpha:0.9,z:ZL-2});
    const {E1:F1,E2:F2}=bcFields();
    const D1n=state.epsr1*F1.n, D2n=state.epsr2*F2.n;
    arrow(pt(gx+gw/2,gh,0), pt(gx+gw/2,gh+0.09*Math.sign(D1n||1)*Math.min(1,Math.abs(D1n)),0), {color:EN_HEX,w:2.0,headScale:0.9,z:ZL-1});
    arrow(pt(gx+gw/2,-gh,0), pt(gx+gw/2,-gh-0.09*Math.sign(D2n||1)*Math.min(1,Math.abs(D2n)),0), {color:EN_HEX,w:2.0,headScale:0.9,z:ZL-1});
    text(pt(gx+gw/2,-gh,0), 'D_n 扁盒', {color:EN_HEX,size:10.5,bold:true,dx:0,dy:26,align:'center',z:ZL});
  }
}

/* ══════════════════════════ ② 反射与透射 ══════════════════════════ */
function drawRT(){
  if(state.mode!=='rt') return;
  const thI=state.thI*Math.PI/180;
  const F=fresnel(state.thI);
  const OG=pt(0,0,0), RAY=0.46;
  /* 入射（左上→原点）、反射（→右上）、透射（→右下，折射角 θ_t） */
  const di=pt(Math.sin(thI),-Math.cos(thI),0);
  const Pi=vsub(OG,vmul(di,RAY));
  arrow(Pi, OG, {color:RI_HEX,w:3.0,headScale:1.15,z:ZL-1});
  arrow(OG, vadd(OG,pt(Math.sin(thI)*RAY*0.9,Math.cos(thI)*RAY*0.9,0)),
        {color:RR_HEX,w:1.4+2.2*Math.abs(F.G),headScale:1.15,z:ZL-1});
  if(F.thT!==null){
    const thT=F.thT*Math.PI/180;
    arrow(OG, vadd(OG,pt(Math.sin(thT)*RAY*0.9,-Math.cos(thT)*RAY*0.9,0)),
          {color:RT_HEX,w:1.4+2.2*Math.abs(F.T),headScale:1.15,z:ZL-1});
  } else {
    /* 全反射：界面下方画衰减隐失波提示 */
    for(let i=0;i<3;i++)
      line(pt(0.06+i*0.05,-0.03,0), pt(0.06+i*0.05,-0.05,0), {color:RT_HEX,w:1.2,alpha:0.5-0.15*i,dash:[3,3],z:ZL-2});
  }
  /* 相位脉冲沿三条射线走（t∈[0,1)） */
  const pulse=(p0,p1,col)=>{
    const q=vadd(p0,vmul(vsub(p1,p0),state.t));
    marker(q,{r:4.2,color:col,ring:'#fff',z:ZL+2});
  };
  pulse(Pi,OG,RI_HEX);
  pulse(OG,vadd(OG,pt(Math.sin(thI)*RAY*0.9,Math.cos(thI)*RAY*0.9,0)),RR_HEX);
  if(F.thT!==null){ const thT=F.thT*Math.PI/180;
    pulse(OG,vadd(OG,pt(Math.sin(thT)*RAY*0.9,-Math.cos(thT)*RAY*0.9,0)),RT_HEX); }
  /* 法线 + 角弧（θ_i 在法线左侧，θ_r 在右侧，θ_t 在下方） */
  line(pt(0,0.40,0), pt(0,-0.40,0), {color:'#8AA3AF',w:1.2,dash:[5,4],z:ZL-3});
  if(state.show.fronts){
    curve(arcPts(0,0,0.17,90,90+state.thI), {color:RI_HEX,w:1.4,z:ZL-2});
    curve(arcPts(0,0,0.17,90-state.thI,90), {color:RR_HEX,w:1.4,z:ZL-2});
    text(pt(0,0,0), 'θ_i', {color:RI_HEX,size:11,bold:true,dx:-30,dy:30,align:'right',z:ZL});
    if(F.thT!==null){
      curve(arcPts(0,0,0.17,-90,-90+F.thT), {color:RT_HEX,w:1.4,z:ZL-2});
      text(pt(0,0,0), 'θ_t', {color:RT_HEX,size:11,bold:true,dx:26,dy:44,z:ZL});
    }
  }
  /* 射线标签（固定屏幕偏移，避免与弧撞） */
  text(Pi, '入射 1.0', {color:RI_HEX,size:11,bold:true,dx:-10,dy:18,align:'right',z:ZL});
  text(vadd(OG,pt(Math.sin(thI)*RAY*0.9,Math.cos(thI)*RAY*0.9,0)), '反射 |Γ|='+Math.abs(F.G).toFixed(2),
       {color:'#8A4A12',size:11,bold:true,dx:10,dy:-10,z:ZL});
  text(vadd(OG,pt(0.10,-0.30,0)), F.thT!==null?('透射 |T|='+Math.abs(F.T).toFixed(2)):'全反射（θ_i > θ_c）',
       {color:'#27500A',size:11,bold:true,dx:0,dy:16,z:ZL});
}

/* ══════════════════════════ 场景装配 ══════════════════════════ */
function buildScene(){
  prims=[];                     /* ★ 第一句必须是 prims=[] */
  drawMedia();
  drawBC();
  drawRT();
}

/* ══════════ 信息卡内容 ══════════ */
function currentCard(){
  if(state.mode==='bc'){
    const {E1,E2}=bcFields();
    const D1n=state.epsr1*E1.n, D2n=state.epsr2*E2.n;
    return ['衔接条件（小回路压扁 ⇒ 切向连续）',[
      ['E_1t（介质 1 切向）', E1.t.toFixed(3)+'（= cosθ₁）',E1_HEX],
      ['E_2t（介质 2 切向）', E2.t.toFixed(3),'#2E7D32'],
      ['|E_1t − E_2t|', '0（恒连续）','#2E7D32'],
      ['∮@{E}·d@{l} = (E_1t−E_2t)·l', loopCirc().toFixed(4),'#2E7D32'],
      ['电磁项 −dΦ_B/dt ∝ l·h', 'h='+state.hLoop.toFixed(2)+' m ⇒ 随 h→0', '#B85A1E'],
      ['D_2n − D_1n', (D2n-D1n).toFixed(2)+' = σ_s = '+state.sigmaS.toFixed(2),'#72243E'],
      ['§ 结论（PPT 第 44–48 页）'],
      ['E_t 连续 · H_t 连续（无面电流）','D_n 跳 σ_s · B_n 连续','#2E7D32'],
    ],38+8*19+8];
  }
  const F=fresnel(state.thI), thC=criticalDeg();
  const rows=[
    ['入射角 θ_i', state.thI.toFixed(1)+'°'],
    ['反射角 θ_r', state.thI.toFixed(1)+'°（= θ_i）'],
  ];
  if(F.thT!==null){
    rows.push(['透射角 θ_t（斯涅尔）', F.thT.toFixed(1)+'°','#27500A']);
    rows.push(['Γ（'+(state.pol==='perp'?'⊥':'∥')+' 极化反射系数）', F.G.toFixed(3),'#B85A1E']);
    rows.push(['T（透射系数）', F.T.toFixed(3),'#27500A']);
    rows.push(['能量：R + T_能', (F.R+F.Te).toFixed(4)+'（=1）','#2E7D32']);
  } else {
    rows.push(['透射角', '无实数解 ⇒ 全反射','#C62828']);
    rows.push(['|Γ|', '1（全反射）','#C62828']);
    rows.push(['界面下方', '只剩隐失波（不进能量）','#B85A1E']);
  }
  if(thC!==null) rows.push(['临界角 θ_c = asin(n₂/n₁)', thC.toFixed(1)+'°','#72243E']);
  rows.push(['§ 物理图像']);
  rows.push([F.thT!==null?'光密→光疏还是光疏→光密，看折射角':'能量 100% 反射回介质 1',
             nmed(1)>nmed(2)?'n₁>n₂（向光疏）':'n₁<n₂（向光密）']);
  return ['反射与透射（扩展）', rows, 38+rows.length*19+8];
}
function drawOverlays(){ const c=currentCard(); infoCard(c[0],c[1],c[2]); }

/* ══════════════════════════ 面板底部结论条 ══════════════════════════ */
function subNote(){
  if(state.mode==='bc')
    return '把跨界面的<b>小矩形回路压扁</b>（拖 h）：∮@{E}·d@{l}=(E_1t−E_2t)·l，'+
      '而电磁感应项 −dΦ_B/dt 正比于回路面积 l·h ⇒ <b>h→0 时右端归零 ⇒ E_1t=E_2t</b>（切向连续）。<br>'+
      '🔑 同理用高斯扁盒：D_2n−D_1n=σ_s（法向跳变=自由面电荷）。';
  return '斜入射到界面的波分成两路：<b>反射</b>（θ_r=θ_i）与<b>透射</b>（斯涅尔定律弯折）。'+
    '幅值由菲涅尔系数定（随极化方式不同）。<br>'+
    '🔑 n₁>n₂ 且 θ_i>θ_c 时 θ_t 无实数解 ⇒ <b>全反射</b>：能量 100% 反射，界下只剩不进能的隐失波。';
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
const SHOW_ITEMS={
  bc:[{k:'bc',t:'E_t 小回路与分量'},{k:'dn',t:'D_n 扁盒'}],
  rt:[{k:'fronts',t:'角弧 θ_i/θ_t'}],
};
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
  chipRow(sec,SHOW_ITEMS[state.mode],k=>state.show[k],k=>{
    const next=!state.show[k];
    const othersOn=SHOW_ITEMS[state.mode].some(it=>it.k!==k && state.show[it.k]);
    if(!next && !othersOn){ toastMsg('至少保留一层显示'); return; }
    state.show[k]=next; needsRender=true; renderPanel();
  });
  sec.appendChild(h('<div class="ex-note" style="margin-top:7px">'+richHTML(subNote())+'</div>'));
}
const SLIDER_FMT={
  th1:v=>'θ₁ = '+v.toFixed(0)+'°', hLoop:v=>'h = '+v.toFixed(2)+' m',
  epsr1:v=>'ε_r1 = '+v.toFixed(0), epsr2:v=>'ε_r2 = '+v.toFixed(0),
  sigmaS:v=>'σ_s = '+v.toFixed(2), thI:v=>'θ_i = '+v.toFixed(0)+'°',
  t:v=>(v*100).toFixed(0)+' %',
};
function syncSliders(){
  const set=(k,v)=>{ const s=document.getElementById('s_'+k); if(s) s.value=v;
    const e=document.getElementById('v_'+k); if(e) e.textContent=SLIDER_FMT[k]?SLIDER_FMT[k](v):String(v); };
  set('th1',state.th1); set('hLoop',state.hLoop); set('epsr1',state.epsr1); set('epsr2',state.epsr2);
  set('sigmaS',state.sigmaS); set('thI',state.thI); set('t',state.t);
}
function renderSliders(sec){
  sec.innerHTML='';
  if(state.mode==='bc'){
    sec.appendChild(h('<div class="slider-group-label">两侧介质与场</div>'));
    mkRange(sec,{k:'epsr1',label:'介质 1：ε_r1',wide:true,min:EPSR_RANGE[0],max:EPSR_RANGE[1],step:1,
      get:()=>state.epsr1,set:v=>{state.epsr1=v; return clampState().epsr1;},fmt:v=>'ε_r1 = '+v.toFixed(0)});
    mkRange(sec,{k:'epsr2',label:'介质 2：ε_r2',wide:true,min:EPSR_RANGE[0],max:EPSR_RANGE[1],step:1,
      get:()=>state.epsr2,set:v=>{state.epsr2=v; return clampState().epsr2;},fmt:v=>'ε_r2 = '+v.toFixed(0)});
    mkRange(sec,{k:'th1',label:'@{E}_1 与界面夹角 θ₁',wide:true,min:TH1_RANGE[0],max:TH1_RANGE[1],step:1,
      get:()=>state.th1,set:v=>{state.th1=v; return clampState().th1;},fmt:v=>'θ₁ = '+v.toFixed(0)+'°'});
    mkRange(sec,{k:'sigmaS',label:'界面自由面电荷 σ_s',wide:true,min:SIGS_RANGE[0],max:SIGS_RANGE[1],step:0.05,
      get:()=>state.sigmaS,set:v=>{state.sigmaS=v; return clampState().sigmaS;},fmt:v=>'σ_s = '+v.toFixed(2)});
    sec.appendChild(h('<div class="slider-group-label g" style="margin-top:10px">小矩形回路</div>'));
    mkRange(sec,{k:'hLoop',label:'回路高度 h（拖到 0.02 看压扁）',wide:true,min:H_RANGE[0],max:H_RANGE[1],step:0.01,
      get:()=>state.hLoop,set:v=>{state.hLoop=v; return clampState().hLoop;},fmt:v=>'h = '+v.toFixed(2)+' m'});
  } else {
    sec.appendChild(h('<div class="slider-group-label">入射波与介质</div>'));
    mkRange(sec,{k:'epsr1',label:'介质 1：ε_r1',wide:true,min:EPSR_RANGE[0],max:EPSR_RANGE[1],step:1,
      get:()=>state.epsr1,set:v=>{state.epsr1=v; return clampState().epsr1;},fmt:v=>'ε_r1 = '+v.toFixed(0)});
    mkRange(sec,{k:'epsr2',label:'介质 2：ε_r2',wide:true,min:EPSR_RANGE[0],max:EPSR_RANGE[1],step:1,
      get:()=>state.epsr2,set:v=>{state.epsr2=v; return clampState().epsr2;},fmt:v=>'ε_r2 = '+v.toFixed(0)});
    mkRange(sec,{k:'thI',label:'入射角 θ_i（与法线的夹角）',wide:true,min:THI_RANGE[0],max:THI_RANGE[1],step:1,
      get:()=>state.thI,set:v=>{state.thI=v; return clampState().thI;},fmt:v=>'θ_i = '+v.toFixed(0)+'°'});
    sec.appendChild(h('<div class="slider-group-label q" style="margin-top:10px">极化方式</div>'));
    chipRow(sec,[{k:'pperp',t:'⊥ 极化（E⊥入射面）'},{k:'ppara',t:'∥ 极化（E∥入射面）'}],
      k=>(state.pol==='perp')===(k==='pperp'),
      k=>{ state.pol=(k==='pperp')?'perp':'para'; renderPanel(); updateAll(); });
    sec.appendChild(h('<div class="slider-group-label g" style="margin-top:10px">传播进程</div>'));
    mkRange(sec,{k:'t',label:'相位脉冲位置',wide:true,min:0,max:1,step:0.005,
      get:()=>state.t,set:v=>{state.playing=false; state.t=v;},fmt:v=>(v*100).toFixed(0)+' %'});
    btnRow(sec,[
      {t:state.playing?'⏸ 暂停':'▶ 播放', on:!!state.playing, col:'acc',
        act:()=>{ playPause(); renderPanel(); }},
    ]);
  }
  if(state.mode==='rt' && nmed(1)>nmed(2)){
    sec.appendChild(h('<div class="ex-note" style="margin-top:9px">'+richHTML(
      '当前 n₁>n₂：存在临界角 θ_c = '+criticalDeg().toFixed(1)+'°，把 θ_i 拖过它看<b>全反射</b>。')+'</div>'));
  }
}
