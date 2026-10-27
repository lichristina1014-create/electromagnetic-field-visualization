/* ============================================================================
   5.8 电磁波传播实验室 —— 页面专属（一）：图元助手 / 场景装配 / 信息卡 / 面板上半
   ⚠️ 所有进画布的串都必须走 parseRich()（@{...} 矢量 / _x 下标），
      所有进 DOM 的串都必须走 richHTML()；本引擎**不认 Markdown 星号**，加粗只能用 <b>。
   ============================================================================ */

/* ---------- 画布小卡助手（与 2.1~2.5 / 3.x / 4.2 同源） ---------- */
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
const E_HEX   = '#D04A3A';         /* 电场 E（红，y 方向） */
const H_HEX   = '#0F9ED5';         /* 磁场 H（蓝，z 方向） */
const P_HEX   = '#3E9B4F';         /* 传播方向（绿，+x） */
const S_HEX   = '#E97132';         /* 坡印廷矢量 S（橙） */
const PH_HEX  = '#9B59B6';         /* 相位点（紫） */
const AXI_HEX = '#8AA3AF';         /* 参考轴线（浅灰青） */

/* ══════════════════════════ 右上角信息卡 ══════════════════════════ */
function infoCard(title,rows,h){
  const x0=CARD_X(), y0=CARD_Y, w=CARD_W;
  crd(x0,y0,w,h);
  txt(x0+12,y0+15,title,{size:11.5,bold:true,color:'#1F3D4C'});
  rows.forEach((r,i)=>{
    const y=y0+38+i*19;
    /* ⚠️ 章节行要同时认两种写法：['§','文本'] 与 ['§ 文本'] */
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
/* 方向三脚架（左下角）：+x 绿 = 传播方向、+y 红 = E、+z 蓝 = H —— 三者两两垂直 */
function drawTriad(){
  if(!state.show.triad) return;
  const o=pt(X0-0.02,-0.30,-0.26);
  arrow(o, vadd(o,pt(EXT_AX,0,0)), {color:P_HEX,w:2.2,headScale:1.1,z:ZL-2});
  arrow(o, vadd(o,pt(0,EXT_AX,0)), {color:E_HEX,w:2.2,headScale:1.1,z:ZL-2});
  arrow(o, vadd(o,pt(0,0,EXT_AX)), {color:H_HEX,w:2.2,headScale:1.1,z:ZL-2});
  text(vadd(o,pt(EXT_AX,0,0)), 'x 传播', {color:P_HEX,size:11,bold:true,dx:8,dy:2,z:ZL});
  text(vadd(o,pt(0,EXT_AX,0)), 'y @{E}', {color:E_HEX,size:11,bold:true,dx:8,dy:0,z:ZL});
  text(vadd(o,pt(0,0,EXT_AX)), 'z @{H}', {color:H_HEX,size:11,bold:true,dx:8,dy:-4,z:ZL});
}
/* 波源面（x = X0 的半透明薄片） */
function drawSourcePlane(){
  const g=0.21;
  poly([pt(X0,-g,-g),pt(X0,g,-g),pt(X0,g,g),pt(X0,-g,g)],
       {fill:'#BFD6DE',stroke:'#5B7C8A',w:1.0,fillAlpha:0.28,strokeAlpha:0.85,z:ZL-6});
  /* ⚠️ 标签放波源面**顶边上方**：放底部会撞三脚架的 y @{E} 标签（visWL 实测 80%） */
  text(pt(X0,0,g), '波源面', {color:'#40606E',size:11,bold:true,dx:-12,dy:-10,align:'right',z:ZL});
}
/* 参考轴线（波列所在的 x 轴，浅灰细线） */
function drawAxisLine(){
  const pts=[pt(X0,0,0),pt(X0+WAVE_L,0,0)];
  curve(pts,{color:AXI_HEX,w:1.0,alpha:0.8});
}
/* E 箭头列（红，±y；长度 ∝ 当地 E，下限以下不画 —— 学 2.1 的 LE 口径） */
const N_ST=36;
function drawEArrows(){
  if(!state.show.eArr) return;
  for(let i=0;i<=N_ST;i++){
    const x=X0+WAVE_L*i/N_ST, E=waveE(x,state.t), len=E*LE_K;
    if(Math.abs(len)<LE_MIN) continue;             /* 节点处不画（节点本身就可见） */
    arrow(pt(x,0,0), pt(x,clampLen(Math.abs(len),0,LE_MAX)*Math.sign(E),0),
          {color:E_HEX,w:1.8,headScale:0.9,alpha:0.92});
  }
  const xl=X0+WAVE_L*3/N_ST;
  /* ⚠️ 标签与 H 标签同站错向：E 向上偏左（align right）、H 向下偏右，
     否则默认相机下两者投影几乎重合（visWL 实测 46%） */
  text(pt(xl,LE_K*1.02,0), '@{E}（沿 y 振荡）', {color:E_HEX,size:11.5,bold:true,dx:-6,dy:-10,align:'right',z:ZL});
}
/* H 箭头列（蓝，±z） */
function drawHArrows(){
  if(!state.show.hArr) return;
  for(let i=0;i<=N_ST;i++){
    const x=X0+WAVE_L*i/N_ST, H=waveH(x,state.t), len=H*LH_K;
    if(Math.abs(len)<LH_MIN) continue;
    arrow(pt(x,0,0), pt(x,0,clampLen(Math.abs(len),0,LH_MAX)*Math.sign(H)),
          {color:H_HEX,w:1.8,headScale:0.9,alpha:0.92});
  }
  /* ⚠️ H 标签要放到第一波程之外：相位点的波峰恒在 x∈[−0.55,−0.18] 内巡游
     （第一波长 λ_w≈0.37），第 6 站（x≈−0.36）必撞 ⇒ 放到第 14 站（x≈−0.12） */
  const xl=X0+WAVE_L*14/N_ST;
  text(pt(xl,0,LH_K/ETA0*1.05), '@{H}（沿 z 振荡）', {color:H_HEX,size:11.5,bold:true,dx:8,dy:14,z:ZL});
}
/* 波形曲线：E 在 xy 平面（红）、H 在 xz 平面（蓝） —— 与箭头尖端重合 */
function drawWaves(){
  if(!state.show.wave) return;
  const N=200, pe=[], ph=[];
  for(let i=0;i<=N;i++){
    const x=X0+WAVE_L*i/N;
    pe.push(pt(x, waveE(x,state.t)*LE_K, 0));
    ph.push(pt(x, 0, waveH(x,state.t)*LH_K));
  }
  curve(pe,{color:E_HEX,w:2.2,alpha:0.95,z:ZL-3});
  curve(ph,{color:H_HEX,w:2.2,alpha:0.95,z:ZL-3});
}
/* 传播方向：绿色粗箭头（固定在波列下方） */
function drawProp(){
  if(!state.show.prop) return;
  const y=-0.27;
  arrow(pt(X0+0.06,y,0), pt(X0+WAVE_L-0.06,y,0), {color:P_HEX,w:3.0,headScale:1.3,z:ZL-4});
  text(pt(X0+WAVE_L/2,y,0), '传播方向 +x', {color:P_HEX,size:11.5,bold:true,dx:0,dy:16,align:'center',z:ZL});
}
/* 坡印廷矢量 S = E×H（橙，+x；长度 ∝ 瞬时能流，隔站画） */
function drawSVec(){
  if(!state.show.sVec) return;
  for(let i=2;i<=N_ST;i+=4){
    const x=X0+WAVE_L*i/N_ST, S=waveE(x,state.t)*waveH(x,state.t);
    const len=clampLen(Math.abs(S)*LS_K,0,0.14);
    if(len<0.01) continue;
    arrow(pt(x,0,0), pt(x+len*Math.sign(S),0,0), {color:S_HEX,w:2.6,headScale:1.05,alpha:0.95,z:ZL-1});
  }
  /* ⚠️ S 标签不能放波列中点上方（az=0.6 时三脚架旋进中区，连撞两处）⇒
     放传播箭头尾端右下（与"传播方向 +x"标签一左一右拉开） */
  text(pt(X0+WAVE_L,-0.27,0), '@{S}=@{E}×@{H}（能流，橙）',
       {color:'#B85A1E',size:11.5,bold:true,dx:-4,dy:32,align:'right',z:ZL});
}
/* 相位点（紫）：盯住一个波峰 —— "向前跑的是它，不是箭头" */
function drawPhaseMark(){
  if(!state.show.phase) return;
  const kw=kWorld();
  const m=Math.floor(OM_D*state.t/(2*Math.PI));
  const xRel=(OM_D*state.t-2*Math.PI*m)/kw;        /* 视野内第一个波峰 */
  const x=X0+xRel, E=waveE(x,state.t);
  line(pt(x,0,0), pt(x,E*LE_K,0), {color:PH_HEX,w:1.2,dash:[4,3],z:ZL-2});
  marker(pt(x,E*LE_K,0), {r:5.2,color:PH_HEX,ring:'#E4D5F0',z:ZL+2});
  /* ⚠️ 相位点标签放波峰**下方**：E 标签在波列上方，紫点在波峰上，
     再上移必撞（visWL 实测 88%） */
  text(pt(x,E*LE_K,0), '相位点', {color:PH_HEX,size:11,bold:true,dx:10,dy:14,z:ZL+2});
}

/* ══════════════════════════ 场景装配 ══════════════════════════ */
function buildScene(){
  prims=[];                     /* ★ 第一句必须是 prims=[]（否则每次重绘再叠一层整场景） */
  drawAxisLine();
  drawSourcePlane();
  drawTriad();
  drawEArrows();
  drawHArrows();
  drawWaves();
  drawProp();
  drawSVec();
  drawPhaseMark();
}

/* ══════════ 信息卡内容 ══════════ */
function fmtV(){ return (waveParams().v/1e8).toFixed(2)+'×10⁸ m/s'; }
function currentCard(){
  const p=waveParams();
  const rows=[
    ['频率 f', FREQS[state.freqIdx]+' MHz'],
    ['波速 v = 1/√(με)', fmtV()],
    ['波长 λ = v/f', p.lam.toFixed(2)+' m'],
  ];
  if(state.lossy){
    rows.push(['|η|（波阻抗的模）', p.eta.toFixed(1)+' Ω']);
    rows.push(['衰减常数 α（tanδ=0.3）', p.alpha.toFixed(3)+' Np/m']);
    rows.push(['@{E} 超前 @{H} 的相位 φ_η', (p.phiEta*57.2958).toFixed(1)+'°','#B85A1E']);
    rows.push(['S_avg（源面处）', (sAvg(X0)*1000).toFixed(3)+' mW/m²']);
    rows.push(['§ 有耗介质']);
    rows.push(['振幅沿 x 按 e^(−αx) 衰减','能量被介质吸收','#B85A1E']);
    rows.push(['@{E} 与 @{H} 不再同相','φ_η = ½·atan(tanδ)','#B85A1E']);
  } else {
    rows.push(['波阻抗 η = √(μ/ε)', p.eta.toFixed(1)+' Ω']);
    rows.push(['S_avg（处处相同）', (sAvg(X0)*1000).toFixed(3)+' mW/m²']);
    rows.push(['§ 无耗介质中的均匀平面波']);
    rows.push(['@{E} ⊥ @{H} ⊥ 传播方向','三者同相','#2E7D32']);
    rows.push(['E/H = η（波阻抗）','@{S} = @{E}×@{H} 沿 +x','#2E7D32']);
  }
  return [state.lossy?'有耗介质中的平面波':'无耗介质中的平面波', rows, 38+rows.length*19+8];
}
function drawOverlays(){ const c=currentCard(); infoCard(c[0],c[1],c[2]); }

/* ══════════════════════════ 面板底部的实时结论条 ══════════════════════════ */
function subNote(){
  return '红箭头 <b>@{E}</b> 沿 y、蓝箭头 <b>@{H}</b> 沿 z、绿箭头 <b>+x</b> 是传播方向：'+
    '<b>三者两两垂直</b>。注意看：<b>箭头只在原地振荡</b>，向前跑的是紫色<b>相位点</b>和橙色能流 —— '+
    '传播的是相位与能量，不是电场箭头沿 x 跑过去。';
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
  {k:'eArr',t:'电场 @{E}（红）'},{k:'hArr',t:'磁场 @{H}（蓝）'},{k:'wave',t:'波形曲线'},
  {k:'sVec',t:'坡印廷矢量 @{S}'},{k:'phase',t:'相位点'},{k:'prop',t:'传播方向'},{k:'triad',t:'方向三脚架'},
];
function mkRange(sec,d){
  const r=h('<div class="slider-row'+(d.wide?' w':'')+'"><label>'+richHTML(d.label)+'</label>'+
    '<input type="range" id="s_'+d.k+'" min="'+d.min+'" max="'+d.max+'" step="'+d.step+'" value="'+d.get()+'">'+
    '<span class="val" id="v_'+d.k+'">'+d.fmt(d.get())+'</span></div>');
  const inp=r.querySelector('input');
  inp.oninput=()=>{
    /* ⚠️ 必须用 d.set() 的**返回值**（生效值）来回写滑块（钳制契约） */
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
    /* ⚠️ 不许把层全关掉：全关 ⇒ prims=0 ⇒ 整块画布纯白 */
    const othersOn=SHOW_ITEMS.some(it=>it.k!==k && state.show[it.k]);
    if(!next && !othersOn){ toastMsg('至少保留一层显示'); return; }
    state.show[k]=next; needsRender=true; renderPanel();
  });
  sec.appendChild(h('<div class="ex-note" style="margin-top:7px">'+richHTML(subNote())+'</div>'));
}
const SLIDER_FMT={
  epsr:v=>'ε_r = '+v.toFixed(0),
  t:v=>'t = '+v.toFixed(2)+' s',
};
function syncSliders(){
  const set=(k,v)=>{ const s=document.getElementById('s_'+k); if(s) s.value=v;
    const e=document.getElementById('v_'+k); if(e) e.textContent=SLIDER_FMT[k]?SLIDER_FMT[k](v):String(v); };
  set('epsr',state.epsr); set('t',state.t);
}
function renderSliders(sec){
  sec.innerHTML='';
  sec.appendChild(h('<div class="slider-group-label">波与介质</div>'));
  mkRange(sec,{k:'epsr',label:'相对介电常数 ε_r（μ_r=1）',wide:true,min:EPSR_RANGE[0],max:EPSR_RANGE[1],step:1,
    get:()=>state.epsr,set:v=>{state.epsr=v; return clampState().epsr;},fmt:v=>'ε_r = '+v.toFixed(0)});
  sec.appendChild(h('<div class="slider-group-label q" style="margin-top:10px">频率</div>'));
  chipRow(sec,[{k:'f0',t:'低 · 100 MHz'},{k:'f1',t:'中 · 200 MHz'},{k:'f2',t:'高 · 400 MHz'}],
    k=>state.freqIdx===+k.slice(1),
    k=>{ state.freqIdx=+k.slice(1); renderPanel(); updateAll(); });
  sec.appendChild(h('<div class="slider-group-label g" style="margin-top:10px">介质类型</div>'));
  chipRow(sec,[{k:'loss0',t:'无耗介质'},{k:'loss1',t:'有耗介质（tanδ=0.3）'}],
    k=>state.lossy===(k==='loss1'),
    k=>{ state.lossy=(k==='loss1'); renderPanel(); updateAll(); });
  sec.appendChild(h('<div class="slider-group-label o" style="margin-top:10px">时间进程</div>'));
  mkRange(sec,{k:'t',label:'时间 t（拖动看箭头原地振荡、相位点前进）',wide:true,min:0,max:T_D,step:0.01,
    get:()=>state.t,set:v=>{state.playing=false; state.t=v;},fmt:v=>'t = '+v.toFixed(2)+' s'});
  btnRow(sec,[
    {t:state.playing?'⏸ 暂停':'▶ 播放', on:!!state.playing, col:'acc',
      act:()=>{ playPause(); renderPanel(); }},
    {t:'↺ t = 0（回到初始相位）', on:false,
      act:()=>{ state.playing=false; state.t=0; renderPanel(); updateAll(); }},
  ]);
}
