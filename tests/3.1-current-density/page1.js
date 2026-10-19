/* ============================================================================
   3.1 电流的分类 —— 页面专属（一）：图元助手 / 场景装配 / 信息卡 / 面板上半
   ⚠️ 所有进画布的串都必须走 parseRich()（@{...} 矢量 / _x 下标），
      所有进 DOM 的串都必须走 richHTML()；本引擎**不认 Markdown 星号**，加粗只能用 <b>。
   ============================================================================ */

/* ---------- 画布小卡助手（与 2.1 / 2.2 / 2.3 / 2.4 同源） ---------- */
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
const ZL = 1e4+40;                 /* 标注深度档：压在导体之上 */
const O  = pt(0,0,0);
const VOL_HEX = '#2E86AB';         /* 导体体积（淡蓝，与 2.1 球壳同族） */
const SEC_HEX = '#7FB3CE';         /* 横截面（更淡） */
const ELEM_HEX= C.orange;          /* 面元 / 线元（橙 = "正在被测量"的那一块） */
const CAR_HEX = C.teal;            /* 载流子 */
const CAR_HIT = C.crimson;         /* 正穿过面元的载流子 */

/* ══════════════════════════ 右上角信息卡 ══════════════════════════ */
function infoCard(title,rows,h){
  const x0=CARD_X(), y0=CARD_Y, w=CARD_W;
  crd(x0,y0,w,h);
  txt(x0+12,y0+15,title,{size:11.5,bold:true,color:'#1F3D4C'});
  rows.forEach((r,i)=>{
    const y=y0+38+i*19;
    /* ⚠️ 章节行要同时认两种写法：['§','文本'] 与 ['§ 文本']。
       只认前者 ⇒ 单元素那种被当成普通行、右列取 r[1] 得 undefined，
       而 parseRich(undefined) **不抛异常**（静默排版成 "undefined"）⇒ 只能靠插桩抓。 */
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

/* ══════════════════════════ 场景装配 ══════════════════════════ */
/* 载流子：屏幕上间距要够（≥20px）才不会读成一团 */
function drawCarriers(){
  if(!state.show.car) return;
  if(state.mode==='volume'){
    for(const b0 of BASE_V){
      const p=carrierPos(state.a,b0,A_L), hit=hitV(p);
      screenDot(p, hit?4.2:2.7, hit?CAR_HIT:CAR_HEX, hit?0.98:0.72, hit?ZL+0.4:undefined);
    }
  } else if(state.mode==='surface'){
    for(const b0 of BASE_S){
      const p=carrierPos(state.b,b0,B_L), hit=hitS(p);
      screenDot(p, hit?4.2:2.7, hit?CAR_HIT:CAR_HEX, hit?0.98:0.72, hit?ZL+0.4:undefined);
    }
  } else {
    for(const b0 of BASE_L){
      const p=carrierPos(0,b0,C_L), hit=hitL(p);
      screenDot(p, hit?5.0:3.2, hit?CAR_HIT:CAR_HEX, hit?0.98:0.80, hit?ZL+0.4:undefined);
    }
  }
}
/* 平面上的一段圆弧（中心 c、面内两正交方向 u/v）—— 画 θ 角用 */
function arcUV(c,u,v,r,a0,a1,n){
  const out=[];
  for(let i=0;i<=n;i++){ const a=a0+(a1-a0)*i/n;
    out.push(vadd(c, vadd(vmul(u,r*Math.cos(a)), vmul(v,r*Math.sin(a))))); }
  return out;
}
/* ① 体电流：横截面（圆盘）+ 面元 dS（带法矢）+ 半径标注 */
function drawVolumeScene(){
  if(state.show.vol){
    cylShell(state.a, A_L, VOL_HEX, false, 0.17);
    /* 上下底：让"这是一块材料"读得出来 */
    poly(ringPts(state.a,A_L/2), {fill:VOL_HEX,stroke:VOL_HEX,w:1,fillAlpha:0.10,strokeAlpha:0.10});
    poly(ringPts(state.a,-A_L/2),{fill:VOL_HEX,stroke:VOL_HEX,w:1,fillAlpha:0.10,strokeAlpha:0.10});
  }
  if(state.show.sec){
    /* 横截面：z = 0 的圆盘 —— "体电流穿过的东西" */
    poly(ringPts(state.a,0), {fill:SEC_HEX,stroke:C.blue,w:1.2,dash:[6,4],
      fillAlpha:0.22,strokeAlpha:0.55, z:ZL-2});
    /* ⚠️ 标签放在圆盘的 **−x 侧 rim 外**（−x 正是面元 / n̂ 的反侧，那一侧永远空着）：
       曾经放"圆盘左半侧"，θ=80° 时 n̂ 倒向 +x、投影恰好落到屏幕左侧，重叠 48%；
       也曾经放"正上方"，θ=40° 时与 θ 角标签重叠 92%。
       现在这个位置在 4 组相机角 × θ∈{0,40,80} 下都不撞（chk_vis 逐画面断言）。 */
    text(pt(-state.a*0.92,0,0), '横截面 S', {color:'#136A9B',size:12,bold:true,
      dx:10,dy:-10,align:'left',z:ZL});
  }
  if(state.show.elem){
    const c=elemCenter(), n=elemN();
    poly(elemCorners(), {fill:ELEM_HEX,stroke:'#B85A1E',w:1.6,fillAlpha:0.42,strokeAlpha:0.9, z:ZL+6});
    if(state.show.nrm){
      arrow(c, vadd(c,vmul(n,0.19)), {color:ELEM_HEX,w:2.1,headScale:1.05,z:ZL+8});
      /* ⚠️ dy 用 -18 而不是 -9：θ 拖大后 n̂ 倒向 +x，标签会降到面元附近，
         θ=80° 时与「dS = …」实测重叠 44%。抬高 9 px 后在 4 组相机角下都不撞。 */
      text(vadd(c,vmul(n,0.24)), 'n̂', {color:'#B85A1E',size:12.5,bold:true,dx:5,dy:-18,z:ZL+8});
      /* 漂移方向（+z）与 n̂ 的夹角 —— "只有垂直投影算数"的几何来源 */
      if(state.th>0.5){
        line(c, vadd(c,pt(0,0,0.17)), {color:C.green,w:1.4,dash:[5,4],z:ZL+8});
        curve(arcUV(c,pt(0,0,1),pt(1,0,0),0.13,0,state.th*D2R,22),
              {color:'#8A6A2F',w:1.3,z:ZL+8});
        const am=state.th/2*D2R;
        text(vadd(c,pt(0.13*Math.sin(am)*1.35,0,0.13*Math.cos(am))), 'θ = '+state.th+'°',
             {color:'#8A6A2F',size:11.5,bold:true,dx:6,dy:-4,z:ZL+8});
      }
    }
    /* dS 标签挂在面元**正下方**（沿 u₁，而 u₁=(0,1,0) 与 θ 无关 ⇒ 位置不随倾角跳）。
       ⚠️ 曾经挂在 u₂ 方向（θ=0 时是 −x，正撞上半径标注 a 的杆中点）：
         实测两个标签屏幕重叠 49%。自检 chk_vis 用 richLayout 的宽度算包围盒、
         两两求交来盯这件事。 */
    text(vadd(c,vmul(elemU1(),-elemSide()*1.0)), 'dS = '+state.dS.toFixed(3)+' m²',
         {color:'#B85A1E',size:11.5,bold:true,dx:0,dy:15,align:'center',z:ZL+8});
  }
  /* 半径标注：沿 camU 拉（投影恒为水平半径，不会在某些视角下缩成一点） */
  dimLine(O, vmul(camU,state.a), {color:'#9FB4C0',dash:[5,4],w:1.2,z:ZL,
    label:'a = '+state.a.toFixed(2)+' m', lsize:11.5, ldy:12});
}
function ringPts(r,z){
  const out=[]; for(let i=0;i<40;i++){ const a=2*Math.PI*i/40; out.push(pt(r*Math.cos(a),r*Math.sin(a),z)); }
  return out;
}
/* ② 面电流：圆柱壳 + 横截线（整条圆周 + 高亮线元 dl） */
function drawSurfaceScene(){
  if(state.show.vol){
    cylShell(state.b, B_L, VOL_HEX, false, 0.16);
    poly(ringPts(state.b, B_L/2), {fill:VOL_HEX,stroke:VOL_HEX,w:1,fillAlpha:0.08,strokeAlpha:0.08});
    poly(ringPts(state.b,-B_L/2),{fill:VOL_HEX,stroke:VOL_HEX,w:1,fillAlpha:0.08,strokeAlpha:0.08});
  }
  /* 横截线 = 圆柱壳被 z=0 切出来的那一圈圆周 */
  if(state.show.sec){
    curve(arcPts(state.b,0,-Math.PI,Math.PI,72), {color:C.blue,w:1.4,dash:[6,4],alpha:0.75,z:ZL-2});
    text(pt(0,0,0), '横截线 l', {color:'#136A9B',size:12,bold:true,dx:-5,dy:-13,align:'right',z:ZL});
  }
  if(state.show.arc){
    const h=arcHalf();
    curve(arcPts(state.b,0,-h,h,26), {color:ELEM_HEX,w:3.4,z:ZL+6});
    const e=arcEnds();
    marker(e[0],{r:4.0,color:'#B85A1E',z:ZL+6});
    marker(e[1],{r:4.0,color:'#B85A1E',z:ZL+6});
    const m=pt(state.b*Math.cos(0),state.b*Math.sin(0),0);
    text(m,'dl = '+state.dl.toFixed(2)+' m',{color:'#B85A1E',size:11.5,bold:true,dx:9,dy:-6,z:ZL+8});
  }
  dimLine(O, vmul(camU,state.b), {color:'#9FB4C0',dash:[5,4],w:1.2,z:ZL,
    label:'b = '+state.b.toFixed(2)+' m', lsize:11.5, ldy:12});
}
/* ③ 线电流：一根线 + 横截"点" + 三级阶梯（屏幕空间，左下） */
function drawLineScene(){
  if(state.show.wire){
    /* 线电流的导体已经退化成一维：画成一根极细的实心柱（半径刻意比①②大一点，
       否则 0.60 m 的线在画面上只有一根头发，③ 页会显得空） */
    cylShell(0.012, C_L, C.teal, true, 1.0);
    poly(ringPts(0.012, C_L/2), {fill:C.teal,stroke:C.teal,w:1,fillAlpha:1,strokeAlpha:1});
    poly(ringPts(0.012,-C_L/2),{fill:C.teal,stroke:C.teal,w:1,fillAlpha:1,strokeAlpha:1});
  }
  if(state.show.dot){
    marker(O, {r:7.0,color:C.orange,ring:'#E8B48A',z:ZL+8});
    text(O, '横截点', {color:'#B85A1E',size:12.5,bold:true,dx:11,dy:-11,z:ZL+8});
    /* 用一小段虚线把"截面已经退化成一个点"这件事标出来 */
    line(pt(0,0,0),pt(0,0,0.16),{color:C.orange,w:1.5,dash:[5,4],z:ZL+6});
  }
}
/* 三级阶梯：同一个式子 ρ·u / σ·u / τ·u，只是电荷密度的量纲不同 */
function ladderRow(y,glyph,lab,col){
  const x=18, gx=x+13, gy=y-4;
  P_(1e6+3,()=>{ ctx.save();
    if(glyph==='sq'){
      ctx.fillStyle=hexA(col,0.28); ctx.strokeStyle=col; ctx.lineWidth=1.4;
      ctx.strokeRect(gx-7,gy-7,14,14); ctx.fillRect(gx-7,gy-7,14,14);
    } else if(glyph==='ln'){
      ctx.strokeStyle=col; ctx.lineWidth=3.4; ctx.lineCap='round';
      ctx.beginPath(); ctx.moveTo(gx-8,gy); ctx.lineTo(gx+8,gy); ctx.stroke();
    } else {
      ctx.fillStyle=col; ctx.beginPath(); ctx.arc(gx,gy,4.2,0,7); ctx.fill();
      ctx.strokeStyle='#fff'; ctx.lineWidth=1.6; ctx.stroke();
    }
    ctx.restore(); });
  txt(x+30,y,lab,{size:12,bold:true,color:'#1F3D4C'});
}
function drawLadder(){
  const y=H-112;
  P_(1e6+3,()=>{ ctx.save();
    ctx.shadowColor='rgba(30,60,80,.10)'; ctx.shadowBlur=8; ctx.shadowOffsetY=2;
    rrPath(12,y-30,236,86,10); ctx.fillStyle='rgba(255,255,255,.93)'; ctx.fill();
    ctx.restore(); ctx.save();
    rrPath(12,y-30,236,86,10); ctx.strokeStyle='#DCE6EB'; ctx.lineWidth=1; ctx.stroke(); ctx.restore(); });
  txt(24,y-16,'同一个式子，三种量纲',{size:11.5,bold:true,color:'#1F3D4C'});
  ladderRow(y+4,  'sq','体电流　J = ρ·u　A/m²',C.blue);
  ladderRow(y+28, 'ln','面电流　K = σ·u　A/m', C.green);
  ladderRow(y+52, 'dt','线电流　I = τ·u　A',   C.orange);
}
function buildScene(){
  prims=[];                     /* ★ 第一句必须是 prims=[]（否则每次重绘再叠一层整场景） */
  if(state.show.box) drawAxes(EXT_AX);
  if(state.mode==='volume')   drawVolumeScene();
  if(state.mode==='surface')  drawSurfaceScene();
  if(state.mode==='line')     drawLineScene();
  drawCarriers();
  if(state.mode==='line' && state.show.ladder) drawLadder();
}

/* ══════════ 信息卡内容 ══════════ */
function currentCard(){
  if(state.mode==='volume'){
    const J=Jval(), S=Math.PI*state.a*state.a, I=ItotV();
    const perp=state.dS*Math.cos(state.th*D2R);
    return ['体电流 · 电流密度 J',[
      ['J = ρ·u', J.toFixed(2)+' nA/m²'],
      ['　ρ = '+state.rho.toFixed(1)+' µC/m³','u = '+state.u.toFixed(1)+' mm/s'],
      ['横截面 S = πa²', S.toFixed(3)+' m²'],
      ['总电流 I = J·S', I.toFixed(2)+' nA'],
      ['§ 横截面上取一小块面元 dS'],
      ['面元面积 dS', state.dS.toFixed(3)+' m²'],
      ['法矢与漂移方向夹角 θ', state.th+'°'],
      ['垂直投影 dS⊥ = dS·cosθ', perp.toFixed(3)+' m²'],
      ['穿过 dS 的电流 J·dS⊥', IelemV().toFixed(3)+' nA'],
      ['载流子穿过整截面', rateV().toFixed(2)+' 个/s'],
      ['§ 单位：A/m²（nA/m²）'],
      ['方向', '正电荷漂移方向'],
    ],238];
  }
  if(state.mode==='surface'){
    const K=Kval(), l=2*Math.PI*state.b;
    return ['面电流 · 电流密度 K',[
      ['K = σ·u', K.toFixed(2)+' nA/m'],
      ['　σ = '+state.sig.toFixed(1)+' µC/m²','u = '+state.u.toFixed(1)+' mm/s'],
      ['横截线 l = 2πb', l.toFixed(3)+' m'],
      ['总电流 I = K·l', ItotS().toFixed(2)+' nA'],
      ['§ 横截线上取一小段线元 dl'],
      ['线元长度 dl', state.dl.toFixed(2)+' m'],
      ['占整条横截线', (state.dl/l*100).toFixed(1)+' %'],
      ['穿过 dl 的电流 K·dl', IelemS().toFixed(3)+' nA'],
      ['载流子穿过整条线', rateS().toFixed(2)+' 个/s'],
      ['§ 单位：A/m（nA/m）'],
      ['方向', '面上正电荷漂移方向'],
    ],238];
  }
  const I=Ival(), S=Math.PI*state.a*state.a, l=2*Math.PI*state.b;
  return ['线电流 · 电流 I',[
    ['I = τ·u', I.toFixed(2)+' nA'],
    ['　τ = '+state.tau.toFixed(1)+' µC/m','u = '+state.u.toFixed(1)+' mm/s'],
    ['§ 同一个 I，换成另外两种口径'],
    ['体电流口径  J = I/S', (I/S).toFixed(3)+' nA/m²'],
    ['面电流口径  K = I/l', (I/l).toFixed(3)+' nA/m'],
    ['线电流口径  I', I.toFixed(2)+' nA'],
    ['载流子穿过该点', rateL().toFixed(2)+' 个/s'],
    ['§ 三者的定义口径完全一致'],
    ['单位时间垂直穿过', '单位面积 / 线 / 点'],
    ['各自的单位', 'A/m² · A/m · A'],
  ],224];
}
function drawOverlays(){ const c=currentCard(); infoCard(c[0],c[1],c[2]); }

/* ══════════════════════════ 面板底部的实时结论条 ══════════════════════════ */
function subNote(){
  if(state.mode==='volume')
    return '<b>电荷充满整块导体</b> ⇒ 电流要"穿过"的是一个<b>面</b>（横截面），'+
      '所以密度要<b>再除一次面积</b>：J = dI/dS，单位 A/m²。<br>'+
      '把 <b>θ</b> 拖大：面元还是那么大，但它正对漂移方向的<b>投影</b> dS⊥ = dS·cosθ 越来越小，'+
      '<b>穿过它的电流跟着一起缩</b> —— θ = 90° 时恰好为 0（电荷顺着面元滑过去，一个也不穿）。';
  if(state.mode==='surface')
    return '<b>电荷只分布在一个面上</b>（例如圆柱壳的表面）⇒ 电流穿过的是<b>一条线</b>（横截线），'+
      '密度只除一次长度：K = dI/dl，单位 A/m。<br>'+
      '把 <b>壳半径 b</b> 拖大：横截线 l = 2πb 变长 ⇒ 同一条壳上的总电流 I = K·l 跟着变大。';
  return '<b>电荷只在一条线上</b> ⇒ 截面退化成一个<b>点</b>，再也没有可除的几何量，'+
    '于是就是最朴素的 <b>I = dq/dt</b>，单位 A。<br>'+
    '注意左下角那三级阶梯：<b>J = ρ·u、K = σ·u、I = τ·u 是同一个式子</b>，'+
    '差只差在电荷密度的量纲上 —— 定义的口径从头到尾没有变过。';
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
  volume: [{k:'vol',t:'导体体积'},{k:'sec',t:'横截面 S'},{k:'elem',t:'面元 dS'},{k:'nrm',t:'法矢与夹角'},{k:'car',t:'载流子'},{k:'box',t:'坐标轴'}],
  surface:[{k:'vol',t:'导体表面'},{k:'sec',t:'横截线 l'},{k:'arc',t:'线元 dl'},{k:'car',t:'载流子'},{k:'box',t:'坐标轴'}],
  line:   [{k:'wire',t:'导线'},{k:'dot',t:'横截点'},{k:'car',t:'载流子'},{k:'ladder',t:'三级阶梯'},{k:'box',t:'坐标轴'}],
};
function mkRange(sec,d){
  const r=h('<div class="slider-row'+(d.wide?' w':'')+'"><label>'+richHTML(d.label)+'</label>'+
    '<input type="range" id="s_'+d.k+'" min="'+d.min+'" max="'+d.max+'" step="'+d.step+'" value="'+d.get()+'">'+
    '<span class="val" id="v_'+d.k+'">'+d.fmt(d.get())+'</span></div>');
  const inp=r.querySelector('input');
  inp.oninput=()=>{
    /* ⚠️ 必须用 d.set() 的**返回值**（生效值）来格式化与回写滑块：
       一旦 set() 内部做了钳制，直接格式化 inp.value 就会造成
       "滑块显示 0.040 / 真实 state 0.024"的**静默不一致**（不报任何错）。
       目前所有 set 都不钳制，但把这个契约固定下来，以后加钳制不会踩坑。 */
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
    /* ⚠️ 不许把层全关掉：全关 ⇒ prims=0 ⇒ 整块画布纯白 */
    const othersOn=SHOW_ITEMS[state.mode].some(it=>it.k!==k && state.show[it.k]);
    if(!next && !othersOn){ toastMsg('至少保留一层显示'); return; }
    state.show[k]=next; needsRender=true; renderPanel();
  });
  sec.appendChild(h('<div class="ex-note" style="margin-top:7px">'+richHTML(subNote())+'</div>'));
}
/* ⚠️ 这里的格式必须与 mkRange 建滑块时的 fmt **完全一致**（syncSliders 会反复调用）。 */
const SLIDER_FMT={
  rho:v=>v.toFixed(1)+' µC/m³', sig:v=>v.toFixed(1)+' µC/m²', tau:v=>v.toFixed(1)+' µC/m',
  u:v=>v.toFixed(1)+' mm/s', a:v=>v.toFixed(2)+' m', b:v=>v.toFixed(2)+' m',
  dS:v=>v.toFixed(3)+' m²', th:v=>v.toFixed(0)+'°', dl:v=>v.toFixed(2)+' m',
};
function syncSliders(){
  const set=(k,v)=>{ const s=document.getElementById('s_'+k); if(s) s.value=v;
    const e=document.getElementById('v_'+k); if(e) e.textContent=SLIDER_FMT[k]?SLIDER_FMT[k](v):String(v); };
  set('rho',state.rho); set('sig',state.sig); set('tau',state.tau); set('u',state.u);
  set('a',state.a); set('b',state.b); set('dS',state.dS); set('th',state.th); set('dl',state.dl);
}
function renderSliders(sec){
  sec.innerHTML='';
  if(state.mode==='volume'){
    sec.appendChild(h('<div class="slider-group-label">体电荷密度与漂移速度</div>'));
    mkRange(sec,{k:'rho',label:'体电荷密度 ρ',wide:true,min:RHO_RANGE[0],max:RHO_RANGE[1],step:0.1,
      get:()=>state.rho,set:v=>{state.rho=v;},fmt:v=>v.toFixed(1)+' µC/m³'});
    mkRange(sec,{k:'u',label:'漂移速度 u',wide:true,min:U_RANGE[0],max:U_RANGE[1],step:0.1,
      get:()=>state.u,set:v=>{state.u=v;},fmt:v=>v.toFixed(1)+' mm/s'});
    sec.appendChild(h('<div class="slider-group-label g" style="margin-top:12px">导体与面元</div>'));
    mkRange(sec,{k:'a',label:'导体半径 a',wide:true,min:A_R_RANGE[0],max:A_R_RANGE[1],step:0.005,
      get:()=>state.a,set:v=>{state.a=v;},fmt:v=>v.toFixed(2)+' m'});
    mkRange(sec,{k:'dS',label:'面元面积 dS',wide:true,min:DS_RANGE[0],max:DS_RANGE[1],step:0.001,
      get:()=>state.dS,set:v=>{state.dS=v;},fmt:v=>v.toFixed(3)+' m²'});
    mkRange(sec,{k:'th',label:'面元倾角 θ（法矢 vs 漂移方向）',wide:true,min:TH_RANGE[0],max:TH_RANGE[1],step:1,
      get:()=>state.th,set:v=>{state.th=v;},fmt:v=>v.toFixed(0)+'°'});
    btnRow(sec,[
      {t:'θ = 0°（正对，最大）', on:state.th===0,
        act:()=>{ state.th=0; renderPanel(); updateAll(); }},
      {t:'θ = 60°（只剩一半）', on:state.th===60,
        act:()=>{ state.th=60; renderPanel(); updateAll(); }},
      {t:'ρ 翻倍（J 翻倍）', on:state.rho>=3.95,
        act:()=>{ state.rho=Math.min(4.0,state.rho*2); renderPanel(); updateAll(); }},
    ]);
  } else if(state.mode==='surface'){
    sec.appendChild(h('<div class="slider-group-label">面电荷密度与漂移速度</div>'));
    mkRange(sec,{k:'sig',label:'面电荷密度 σ',wide:true,min:SIG_RANGE[0],max:SIG_RANGE[1],step:0.1,
      get:()=>state.sig,set:v=>{state.sig=v;},fmt:v=>v.toFixed(1)+' µC/m²'});
    mkRange(sec,{k:'u',label:'漂移速度 u',wide:true,min:U_RANGE[0],max:U_RANGE[1],step:0.1,
      get:()=>state.u,set:v=>{state.u=v;},fmt:v=>v.toFixed(1)+' mm/s'});
    sec.appendChild(h('<div class="slider-group-label g" style="margin-top:12px">导体与线元</div>'));
    mkRange(sec,{k:'b',label:'壳半径 b（决定横截线 2πb）',wide:true,min:B_R_RANGE[0],max:B_R_RANGE[1],step:0.005,
      get:()=>state.b,set:v=>{state.b=v;},fmt:v=>v.toFixed(2)+' m'});
    mkRange(sec,{k:'dl',label:'线元长度 dl',wide:true,min:DL_RANGE[0],max:DL_RANGE[1],step:0.01,
      get:()=>state.dl,set:v=>{state.dl=v;},fmt:v=>v.toFixed(2)+' m'});
    btnRow(sec,[
      /* ⚠️ 必须 clamp 到 DL_RANGE：b=0.40 时 πb=1.257 > 上限 1.20，
         不 clamp 就是"按钮把 state 设到 1.257、滑块却显示 1.20"的静默不一致。 */
      {t:'dl 取半圈（πb）', on:Math.abs(state.dl-Math.min(DL_RANGE[1],Math.PI*state.b))<0.02,
        act:()=>{ state.dl=Math.min(DL_RANGE[1],Math.PI*state.b); renderPanel(); updateAll(); }},
      {t:'σ 翻倍（K 翻倍）', on:state.sig>=3.95,
        act:()=>{ state.sig=Math.min(4.0,state.sig*2); renderPanel(); updateAll(); }},
    ]);
  } else {
    sec.appendChild(h('<div class="slider-group-label">线电荷密度与漂移速度</div>'));
    mkRange(sec,{k:'tau',label:'线电荷密度 τ',wide:true,min:TAU_RANGE[0],max:TAU_RANGE[1],step:0.1,
      get:()=>state.tau,set:v=>{state.tau=v;},fmt:v=>v.toFixed(1)+' µC/m'});
    mkRange(sec,{k:'u',label:'漂移速度 u',wide:true,min:U_RANGE[0],max:U_RANGE[1],step:0.1,
      get:()=>state.u,set:v=>{state.u=v;},fmt:v=>v.toFixed(1)+' mm/s'});
    btnRow(sec,[
      {t:'τ 翻倍（I 翻倍）', on:state.tau>=3.95,
        act:()=>{ state.tau=Math.min(4.0,state.tau*2); renderPanel(); updateAll(); }},
      {t:'回到默认（I = 4.00 nA）', on:Math.abs(state.tau-1)<1e-9 && Math.abs(state.u-4)<1e-9,
        act:()=>{ state.tau=1.0; state.u=4.0; renderPanel(); updateAll(); }},
    ]);
    sec.appendChild(h('<div class="ex-note" style="margin-top:9px">'+richHTML(
      '右上角卡片里那三行 <b>J = I/S、K = I/l、I</b> 是<b>同一个电流</b>的三种口径：'+
      '同一个 I，摊到面积上是 J、摊到长度上是 K、不再摊就是 I 本身。<br>'+
      '其中 S、l 沿用 ①② 页签的 a、b —— 切回去看一眼那两个滑块，数字是对得上的。')+'</div>'));
  }
  /* 三个页签共用的一句说明（三个页签都有载流子漂移动画） */
  sec.appendChild(h('<div class="ex-note" style="margin-top:9px">'+richHTML(
    '⏱ 载流子的漂移动画按真实速度的 <b>30 倍</b>播放，纯粹为了看得见；'+
    '所有读数（包括「载流子过整截面 个/s」）一律按滑块上的<b>真实 u</b> 计算，与动画快慢无关。<br>'+
    '💡 面元面积 <b>dS</b> 的量程是按"最小半径下也整块装进横截面"定死的，'+
    '所以怎么拖都不会画到导体外面去。')+'</div>'));
}
