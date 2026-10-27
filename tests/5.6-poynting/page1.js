/* ============================================================================
   5.6 电磁能量如何传播 —— 页面专属（一）：场景装配 / 信息卡 / 能量条 / 面板上半
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
const E_HEX   = '#D04A3A';         /* 电场 E（红，y） */
const H_HEX   = '#0F9ED5';         /* 磁场 H（蓝，z） */
const S_HEX   = '#E97132';         /* 坡印廷矢量 S（橙） */
const BOX_HEX = '#3E9B4F';         /* 体积 V（绿） */
const LOSS_HEX= '#B85A1E';         /* 损耗 */

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
/* 波列：E 红箭头（±y）+ H 蓝箭头（±z）+ 两条波形曲线 */
function drawWave(){
  if(!state.show.arr) return;
  for(let i=0;i<=N_ST;i++){
    const x=X0+WAVE_L*i/N_ST;
    const E=fieldE(x,state.t), H=fieldH(x,state.t);
    const lE=clampLen(Math.abs(E)*LE_K,0,0.17), lH=clampLen(Math.abs(H)*LH_K,0,0.17);
    if(lE>0.01) arrow(pt(x,0,0), pt(x,lE*Math.sign(E),0), {color:E_HEX,w:1.7,headScale:0.9,alpha:0.92});
    if(lH>0.01) arrow(pt(x,0,0), pt(x,0,lH*Math.sign(H)), {color:H_HEX,w:1.7,headScale:0.9,alpha:0.92});
  }
}
function drawWaveCurves(){
  if(!state.show.wave) return;
  const N=160, pe=[], ph=[];
  for(let i=0;i<=N;i++){
    const x=X0+WAVE_L*i/N;
    pe.push(pt(x, fieldE(x,state.t)*LE_K, 0));
    ph.push(pt(x, 0, fieldH(x,state.t)*LH_K));
  }
  curve(pe,{color:E_HEX,w:2.0,alpha:0.9,z:ZL-3});
  curve(ph,{color:H_HEX,w:2.0,alpha:0.9,z:ZL-3});
  /* ⚠️ E/H 标签错站点（5.8 的教训：同站错向仍撞 41%） */
  text(pt(X0+0.08,0.16,0), '@{E}（红·y）', {color:E_HEX,size:11,bold:true,dx:0,dy:-8,z:ZL});
  text(pt(X0+0.38,0,0.16), '@{H}（蓝·z）', {color:H_HEX,size:11,bold:true,dx:0,dy:16,z:ZL});
}
/* 体积 V：半透明绿盒（跨过波列，内含损耗层） */
function drawBoxV(){
  if(!state.show.box) return;
  const g=0.19;
  for(const x of [VA,VB]){
    poly([pt(x,-g,-g),pt(x,g,-g),pt(x,g,g),pt(x,-g,g)],
         {fill:BOX_HEX,stroke:BOX_HEX,w:1.2,fillAlpha:0.10,strokeAlpha:0.75,z:ZL-7});
  }
  /* 顶/底连线勾出盒子轮廓 */
  for(const [y,z] of [[-g,-g],[g,-g],[g,g],[-g,g]]){
    line(pt(VA,y,z), pt(VB,y,z), {color:BOX_HEX,w:1.0,alpha:0.55,z:ZL-7});
  }
  /* 损耗层填充（σ>0 时） */
  if(state.sigma>1e-9){
    for(let i=0;i<5;i++){
      const x=VA+(VB-VA)*(i+0.5)/5;
      line(pt(x,-g,-g), pt(x,g,-g), {color:LOSS_HEX,w:1.0,dash:[3,4],alpha:0.5,z:ZL-7});
    }
  }
  text(pt((VA+VB)/2,g,0), '体积 V（内有耗层 σ）', {color:BOX_HEX,size:11.5,bold:true,dx:0,dy:-12,align:'center',z:ZL});
}
/* 进/出面的坡印廷矢量：左面 S_in（大）、右面 S_out（小） */
function drawSVec(){
  if(!state.show.sVec) return;
  const b=energyBooks(state.t);
  const lIn=clampLen(Math.abs(b.Sin)*LS_K,0,0.20), lOut=clampLen(Math.abs(b.Sout)*LS_K,0,0.20);
  for(const dy of [-0.10,0.10]) for(const dz of [-0.10,0.10]){
    if(lIn>0.01)  arrow(pt(VA,dy,dz), pt(VA+lIn*Math.sign(b.Sin||1),dy,dz), {color:S_HEX,w:2.6,headScale:1.1,z:ZL-2});
    if(lOut>0.01) arrow(pt(VB,dy,dz), pt(VB+lOut*Math.sign(b.Sout||1),dy,dz), {color:S_HEX,w:2.6,headScale:1.1,alpha:0.85,z:ZL-2});
  }
  text(pt(VA,0,0), '@{S}_in 流入', {color:'#B85A1E',size:11,bold:true,dx:-8,dy:-24,align:'right',z:ZL});
  /* ⚠️ S_out 放下面：与"体积 V"顶标签同侧必撞（vis56 实测 56%） */
  text(pt(VB,0,0), '@{S}_out 流出', {color:'#B85A1E',size:11,bold:true,dx:8,dy:30,z:ZL});
}
/* 能量收支条（屏幕空间，P_ 自定义图元）：流入 = 流出 + 储能变化 + 损耗 */
function drawBars(){
  if(!state.show.bars) return;
  const b=energyBooks(state.t), dW=dWdt(state.t);
  P_(1e6-10, (c)=>{
    const bx=16, by=H-118, bw=190, bh=13, gap=7;
    const rows=[
      ['流入 S_in', b.Sin, '#3E9B4F'],
      ['流出 S_out', b.Sout, '#B4B2A9'],
      ['储能变化 dW/dt', dW, '#0F9ED5'],
      ['损耗 P_loss', b.Ploss, '#B85A1E'],
    ];
    const mx=Math.max(0.25, b.Sin, b.Sout, Math.abs(dW), b.Ploss)*1.08;
    c.save();
    rrPath(bx-8,by-24,bw+16,rows.length*(bh+gap)+34);
    c.fillStyle='rgba(255,255,255,.92)'; c.fill();
    c.strokeStyle='#DCE6EB'; c.lineWidth=1; c.stroke();
    txt(bx,by-12,'能量收支（单位面积 · 实时）',{size:10.5,bold:true,color:'#1F3D4C'});
    rows.forEach((r,i)=>{
      const y=by+i*(bh+gap);
      const w=clampLen(Math.abs(r[1])/mx*bw*0.62,1.5,bw*0.62);
      c.fillStyle=r[2]; c.fillRect(bx+86,y,w,bh);
      c.fillStyle='#3D5A68'; c.font='10.5px sans-serif';
      c.textAlign='left'; c.textBaseline='middle';
      c.fillText(r[0], bx, y+bh/2);
      const v=r[1];
      c.fillText((v>=0?'+':'')+v.toFixed(3), bx+86+w+4, y+bh/2);
    });
    c.restore();
  });
}

/* ══════════════════════════ 场景装配 ══════════════════════════ */
function buildScene(){
  prims=[];                     /* ★ 第一句必须是 prims=[] */
  drawWaveCurves();
  drawWave();
  drawBoxV();
  drawSVec();
  drawBars();
}

/* ══════════ 信息卡内容 ══════════ */
function currentCard(){
  const b=energyBooks(state.t), dW=dWdt(state.t), res=poyntingResidual(state.t);
  const p=slabParams();
  return ['坡印廷定理：能量收支实时账',[
    ['流入 S_in（左面）', b.Sin.toFixed(3),'#2E7D32'],
    ['流出 S_out（右面）', b.Sout.toFixed(3)],
    ['储能变化率 dW/dt', (dW>=0?'+':'')+dW.toFixed(3),'#0C447C'],
    ['损耗 P_loss = ∫σE²', b.Ploss.toFixed(3),'#B85A1E'],
    ['收支残差（应≈0）', res.toFixed(4), Math.abs(res)<0.01?'#2E7D32':'#C62828'],
    ['§ 坡印廷定理'],
    ['S_in − S_out = dW/dt + P_loss','流入=流出+存下+耗掉','#2E7D32'],
    ['V 内损耗角正切 tanδ', state.sigma<1e-9?'0（无耗）':p.tanD.toFixed(2)],
  ],38+8*19+8];
}
function drawOverlays(){ const c=currentCard(); infoCard(c[0],c[1],c[2]); }

/* ══════════════════════════ 面板底部结论条 ══════════════════════════ */
function subNote(){
  return '@{S} = @{E}×@{H}：单位时间穿过单位面积的电磁能量。<b>盯住体积 V</b>：'+
    '左面流入的能流（橙箭头）比右面流出的大 —— 差额哪去了？看左下能量条：'+
    '<b>一部分变成 V 里储能的涨落（dW/dt），一部分被损耗层吃掉（P_loss）</b>，三项逐秒平衡。<br>'+
    '🔑 能量是在<b>场里</b>流动的 —— 这是理解"导线只是引导、能量走空间"的第一步。';
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
  {k:'wave',t:'波形曲线'},{k:'arr',t:'@{E}/@{H} 箭头'},{k:'box',t:'体积 V'},
  {k:'sVec',t:'@{S} 流入/流出'},{k:'bars',t:'能量收支条'},
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
  E0:v=>'E₀ = '+v.toFixed(1), fD:v=>'f = '+v.toFixed(2)+' Hz',
  sigma:v=>'σ = '+v.toFixed(1), t:v=>'t = '+v.toFixed(2)+' s',
};
function syncSliders(){
  const set=(k,v)=>{ const s=document.getElementById('s_'+k); if(s) s.value=v;
    const e=document.getElementById('v_'+k); if(e) e.textContent=SLIDER_FMT[k]?SLIDER_FMT[k](v):String(v); };
  set('E0',state.E0); set('fD',state.fD); set('sigma',state.sigma); set('t',state.t);
}
function renderSliders(sec){
  sec.innerHTML='';
  sec.appendChild(h('<div class="slider-group-label">波与损耗层</div>'));
  mkRange(sec,{k:'E0',label:'入射波幅值 E₀',wide:true,min:E0_RANGE[0],max:E0_RANGE[1],step:0.1,
    get:()=>state.E0,set:v=>{state.E0=v; return clampState().E0;},fmt:v=>'E₀ = '+v.toFixed(1)});
  mkRange(sec,{k:'fD',label:'频率 f（显示）',wide:true,min:F_RANGE[0],max:F_RANGE[1],step:0.05,
    get:()=>state.fD,set:v=>{state.fD=v; return clampState().fD;},fmt:v=>'f = '+v.toFixed(2)+' Hz'});
  mkRange(sec,{k:'sigma',label:'V 内电导率 σ（0=无耗，波无损穿过）',wide:true,min:SIG_RANGE[0],max:SIG_RANGE[1],step:0.1,
    get:()=>state.sigma,set:v=>{state.sigma=v; return clampState().sigma;},fmt:v=>'σ = '+v.toFixed(1)});
  sec.appendChild(h('<div class="slider-group-label g" style="margin-top:10px">时间进程</div>'));
  mkRange(sec,{k:'t',label:'时间 t（看能量条随相位起伏）',wide:true,min:0,max:periodT(),step:0.005,
    get:()=>state.t,set:v=>{state.playing=false; state.t=v;},fmt:v=>'t = '+v.toFixed(2)+' s'});
  btnRow(sec,[
    {t:state.playing?'⏸ 暂停':'▶ 播放', on:!!state.playing, col:'acc',
      act:()=>{ playPause(); renderPanel(); }},
    {t:'↺ t = 0', on:false,
      act:()=>{ state.playing=false; state.t=0; renderPanel(); updateAll(); }},
  ]);
}
