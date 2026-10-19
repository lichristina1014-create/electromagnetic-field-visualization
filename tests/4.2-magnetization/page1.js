/* ============================================================================
   4.2 磁介质的磁化 —— 页面专属（一）：图元助手 / 场景装配 / 信息卡 / 面板上半
   ⚠️ 所有进画布的串都必须走 parseRich()（@{...} 矢量 / _x 下标），
      所有进 DOM 的串都必须走 richHTML()；本引擎**不认 Markdown 星号**，加粗只能用 <b>。
   ============================================================================ */

/* ---------- 画布小卡助手（与 2.1~2.4、3.1 同源） ---------- */
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
const ZL = 1e4+40;                 /* 标注深度档：压在介质棒之上 */
const O  = pt(0,0,0);
const MED_HEX  = '#2E86AB';        /* 介质棒（淡蓝，与 3.1 导体同族） */
const LOOP_HEX = '#8A6BB8';        /* 分子电流环（紫 = 微观） */
const LOOP_HI  = '#6B4FA0';        /* 环上的流向箭头（深紫） */
const CUR_HEX  = C.crimson;        /* 表面束缚电流（红） */
const BP_HEX   = C.orange;         /* 磁化场 @{B}′ 线（橙） */
const BT_HEX   = C.teal;           /* 总场 @{B} 线（主色） */
const B0_HEX   = '#9FB4C0';        /* 外场参考线（灰蓝） */
let loopPhase=0;                   /* 分子环上流向箭头的滑动相位（tick 里推进） */

/* ══════════════════════════ 右上角信息卡 ══════════════════════════ */
function infoCard(title,rows,h){
  const x0=CARD_X(), y0=CARD_Y, w=CARD_W;
  crd(x0,y0,w,h);
  txt(x0+12,y0+15,title,{size:11.5,bold:true,color:'#1F3D4C'});
  rows.forEach((r,i)=>{
    const y=y0+38+i*19;
    /* ⚠️ 章节行要同时认两种写法：['§','文本'] 与 ['§ 文本']（2.3 的教训：
       只认前者 ⇒ 单元素那种右列取 r[1] 得 undefined，而 parseRich(undefined)
       **不抛异常**、静默排版成 "undefined"）。 */
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

/* ══════════════════════════ 通用场景件 ══════════════════════════ */
function ringPts(r,z){
  const out=[]; for(let i=0;i<40;i++){ const a=2*Math.PI*i/40; out.push(pt(r*Math.cos(a),r*Math.sin(a),z)); }
  return out;
}
/* 半透明介质棒（逐面片填充 + 伪光照；fill 与 stroke 同色，否则相邻面露发丝缝） */
const GX_LX=-0.55, GX_LY=-0.83;
function cylShell(radius,h,hex,alpha){
  const hh=h/2, N=40;
  for(let i=0;i<N;i++){
    const a0=2*Math.PI*i/N, a1=2*Math.PI*(i+1)/N;
    const p0=pt(radius*Math.cos(a0), radius*Math.sin(a0),-hh);
    const p1=pt(radius*Math.cos(a1), radius*Math.sin(a1),-hh);
    const p2=pt(radius*Math.cos(a1), radius*Math.sin(a1), hh);
    const p3=pt(radius*Math.cos(a0), radius*Math.sin(a0), hh);
    const nx=Math.cos((a0+a1)/2), ny=Math.sin((a0+a1)/2);
    const lam=Math.max(0,Math.min(1, Math.abs(nx*GX_LX+ny*GX_LY)));
    poly([p0,p1,p2,p3],{fill:hex, stroke:hex, w:1,
      fillAlpha:alpha*(0.55+0.85*lam), strokeAlpha:alpha*(0.55+0.85*lam)});
  }
}
/* 分子电流环 + 环上滑动的流向小箭头（右手定论：绕 n 环流）
   ⚠️ 不给 o.z 覆盖：环在棒子深处就该被棒子罩住，标注才抬 ZL（同 3.1 的纪律）。 */
function drawLoop(c,n,r,col,ahAlpha){
  curve(loopPts(c,n,r,22), {color:col, w:1.5, alpha:0.92});
  /* 箭头相位：按位置错开（无理数系数）⇒ 不会一齐指向同一处。
     ⚠️ 取模必须归一到 [0,1)：hash 对负坐标为负，(−3.3)%1 = −0.3 ⇒ idx 为负
        ⇒ pts[负下标] = undefined ⇒ vsub 抛异常（实测：切到 ②③ 页签必崩，
        而 tick 的 try/catch 会把症状伪装成"画面卡住"）。 */
  const ph=((loopPhase*0.4 + (c.x*7.13+c.y*3.71+c.z*5.17))%1+1)%1;
  const t=2*Math.PI*ph;
  const pts=loopPts(c,n,r,22);
  const idx=Math.floor(ph*22);
  const A=pts[Math.min(22,idx+1)], B=pts[Math.max(0,idx-1)];
  const dir=vnorm(vsub(A,B));
  const side=vmul(vnorm(vcross(n,dir)), r*0.17);
  poly([A, vadd(B,side), vsub(B,side)], {fill:LOOP_HI, stroke:LOOP_HI, w:1,
    fillAlpha:ahAlpha, strokeAlpha:ahAlpha});
}
/* ②③ 的整副分子点阵（s = 取向度：② 传 0，③ 传 sVis()） */
function drawLattice(s){
  if(!state.show.mol) return;
  const norms=loopNorms();
  for(let i=0;i<LATTICE.length;i++){
    const p=LATTICE[i];
    drawLoop(pt(p.x,p.y,p.z), loopNormal(i,s), RCD, LOOP_HEX, 0.85);
  }
}
/* ③ 的表面束缚电流：圆柱侧面的一圈圈 φ̂ 向环流（随取向度长出来） */
function drawSurfaceCurrent(){
  if(!state.show.cur) return;
  const s=sVis();
  if(s<0.02) return;
  const al=0.20+0.75*s;
  LOOP_Z.forEach(z=>{
    [0.5,2.1,3.8,5.4].forEach(ph=>{
      const a0=ph, a1=ph+0.5, pts=[];
      for(let i=0;i<=10;i++){ const a=a0+(a1-a0)*i/10;
        pts.push(pt(A42*Math.cos(a), A42*Math.sin(a), z)); }
      curve(pts, {color:CUR_HEX, w:3.0, alpha:al, arrowEnd:true, z:ZL+2});
    });
  });
  /* 一个标签就够（其余交给卡片 / 插图 / 图例） */
  text(pt(A42,0,LOOP_Z[4]), '@{K}_b = M', {color:'#B23A2B', size:12, bold:true,
    dx:12, dy:-12, z:ZL+6});
}
/* 子午面 (u,z) → 世界（只画正对镜头的那一个面：u 轴 ≡ camU） */
const mP=(u,z)=>pt(u*camU.x, u*camU.y, z);
/* 场线上某处的小箭头（沿行进方向） */
function lineArrow(pts,frac,col,w,z,al){
  const i=Math.max(1,Math.min(pts.length-2, Math.floor(pts.length*frac)));
  const a=pts[i-1], b=pts[i+1];
  const A=mP(a[0],a[1]), B=mP(b[0],b[1]);
  const d=vsub(B,A); if(vlen(d)<1e-6) return;
  const u=vnorm(d), sd=vmul(vnorm(vcross(pt(0,0,1),u)), 0.016);
  const aa=(al==null?0.95:al);
  poly([B, vsub(vadd(A,sd),vmul(u,0.004)), vsub(vsub(A,sd),vmul(u,0.004))],
       {fill:col, stroke:col, w:1, fillAlpha:aa, strokeAlpha:aa, z:z});
}
/* ③ 的全部场线 */
function drawFieldLines(){
  /* ⚠️ 磁化场线随取向度一起长出来：M→0 时 B′≡0，线上不该还在（t<18% 与 ② 页签一致） */
  const s=sVis(), alBp=Math.max(0,Math.min(1,s/0.08));
  if(state.show.bp && alBp>0.02){
    for(const L of bpLines()){
      const pts=L.pts.map(p=>mP(p[0],p[1]));
      if(pts.length<2) continue;
      curve(pts, {color:BP_HEX, w:1.7, dash:[5,4], alpha:0.92*alBp, z:ZL-1});
      if(!L.axis && pts.length>6) lineArrow(L.pts,0.22,BP_HEX,1.7,ZL+1,0.92*alBp);
    }
  }
  const tl=totalLines();
  if(state.show.bt && tl){
    for(const L of tl){
      const pts=L.pts.map(p=>mP(p[0],p[1]));
      if(pts.length<2) continue;
      curve(pts, {color:BT_HEX, w:2.1, alpha:0.95, z:ZL});
      if(pts.length>6) lineArrow(L.pts,0.30,BT_HEX,2.1,ZL+1);
    }
  }
  /* 外场参考线：与总场线**同种子**的浅灰直线 —— 弯掉的部分就是磁化场的贡献 */
  if(state.show.b0){
    const al=0.5*b0Alpha();
    if(al>0.01){
      B0_SEEDS.forEach(u0=>{
        line(mP(u0,-1.0), mP(u0,1.0), {color:B0_HEX, w:1.2, alpha:al, z:ZL-3});
      });
    }
  }
}

/* ══════════════════════════ ① 分子电流（放大） ══════════════════════════ */
let _loop1Cache={key:null,pts:null};
function loop1Pts(){
  const key=(state.flip?1:0)+'';
  if(_loop1Cache.key===key) return _loop1Cache.pts;
  const n=pt(0,0,1), c=O, r=BIG_R;
  const [u,v]=loopFrame(n);
  const out=[];
  const N=48, sgn=state.flip?-1:1;
  for(let i=0;i<=N;i++){ const t=sgn*2*Math.PI*i/N;
    out.push(vadd(c, vadd(vmul(u,r*Math.cos(t)), vmul(v,r*Math.sin(t))))); }
  _loop1Cache={key,pts:out};
  return out;
}
let _fld1Cache={key:null,lines:null};
function loop1Lines(){
  const key=(state.flip?1:0)+'';
  if(_fld1Cache.key===key) return _fld1Cache.lines;
  const iA=state.flip?-1:1, lines=[];
  [-0.12,-0.06,0,0.06,0.12].forEach(u0=>lines.push(traceLoop(u0,0.025,BIG_R,iA)));
  [BIG_R+0.03,-(BIG_R+0.03)].forEach(u0=>lines.push(traceLoop(u0,0,BIG_R,iA)));
  _fld1Cache={key,lines};
  return lines;
}
function drawMolecularScene(){
  if(state.show.box) drawAxes(EXT_AX);
  /* 陪衬小环：说"磁介质里充满这样的小环"（位置固定，取向同主环） */
  if(state.show.lat){
    const n=state.flip?pt(0,0,-1):pt(0,0,1);
    [[0.44,0.20,0.14],[0.52,-0.12,-0.06],[0.40,-0.30,0.18]].forEach(p=>{
      drawLoop(pt(p[0],p[1],p[2]), n, 0.055, LOOP_HEX, 0.4);
    });
  }
  if(state.show.loop){
    const pts=loop1Pts();
    curve(pts, {color:LOOP_HEX, w:2.6, alpha:0.95, z:ZL-1});
    /* 环上流向箭头（比点阵里的大一号） */
    const ph=(loopPhase*0.4)%1, t=2*Math.PI*ph;
    const n=state.flip?pt(0,0,-1):pt(0,0,1);
    const [uu,vv]=loopFrame(n);
    const c=O;
    const A=vadd(c, vadd(vmul(uu,BIG_R*Math.cos(t+0.10)), vmul(vv,BIG_R*Math.sin(t+0.10))));
    const B=vadd(c, vadd(vmul(uu,BIG_R*Math.cos(t-0.05)), vmul(vv,BIG_R*Math.sin(t-0.05))));
    const dir=vnorm(vsub(A,B)), side=vmul(vnorm(vcross(n,dir)), BIG_R*0.15);
    poly([A, vadd(B,side), vsub(B,side)], {fill:LOOP_HI, stroke:LOOP_HI, w:1,
      fillAlpha:0.95, strokeAlpha:0.95, z:ZL+2});
    /* 磁矩 @{m}：沿环流右手定则的方向，长度随 m 线性涨（有钳制，见下） */
    const mRef=3.0e-6*Math.PI*Math.pow(15e-10,2);       /* 量程上端处的 m */
    const Lm=0.13+0.32*Math.max(0,Math.min(1,mMol()/mRef));
    const tip=pt(0,0,state.flip?-Lm:Lm);
    arrow(O, tip, {color:LOOP_HI, w:2.6, headScale:1.15, z:ZL+4});
    text(tip, '@{m}', {color:LOOP_HI, size:13.5, bold:true, dx:9, dy:-8, z:ZL+6});
  }
  if(state.show.fld){
    for(const L of loop1Lines()){
      if(L.length<3) continue;
      const pts=L.map(p=>mP(p[0],p[1]));
      curve(pts, {color:LOOP_HEX, w:1.4, alpha:0.5, z:ZL-2});
      lineArrow(L,0.30,LOOP_HEX,1.4,ZL);
    }
  }
  /* ① 没有插图，左下角是空的 ⇒ caption 放屏幕空间（不进 3D、不压轴线） */
  textScreen(16,H-18,'一个分子电流：画面大小是示意的，真实是原子尺度',
             {size:10.5,color:'#7A8F9B'});
}

/* ══════════════════════════ ② 无外场 ══════════════════════════ */
function drawNoFieldScene(){
  if(state.show.box) drawAxes(EXT_AX);
  cylShell(A42, L42, MED_HEX, 0.17);
  poly(ringPts(A42, L42/2), {fill:MED_HEX,stroke:MED_HEX,w:1,fillAlpha:0.10,strokeAlpha:0.10});
  poly(ringPts(A42,-L42/2),{fill:MED_HEX,stroke:MED_HEX,w:1,fillAlpha:0.10,strokeAlpha:0.10});
  drawLattice(0);
  drawInset(0);
}

/* ══════════════════════════ ③ 加外场 ══════════════════════════ */
function drawPolingScene(){
  if(state.show.box) drawAxes(EXT_AX);
  cylShell(A42, L42, MED_HEX, 0.17);
  poly(ringPts(A42, L42/2), {fill:MED_HEX,stroke:MED_HEX,w:1,fillAlpha:0.10,strokeAlpha:0.10});
  poly(ringPts(A42,-L42/2),{fill:MED_HEX,stroke:MED_HEX,w:1,fillAlpha:0.10,strokeAlpha:0.10});
  drawLattice(sVis());
  drawSurfaceCurrent();
  drawFieldLines();
  drawInset(sVis());
}

/* ══════════════════════ 表层放大插图（屏幕空间，左下） ══════════════════════
   ★ 这是全页的**教学核心**：垂直轴向看下去，分子电流在小方块里排成六方密排。
     ② 随机取向（投影成各种倾斜的椭圆、顺逆都有）⇒ 接触点电流反向、互相抵消；
     ③ 全部取向一致（投影成整圆、同一转向）⇒ 内部的抵消掉，
        **外边界剩下一圈同向环流 = 宏观束缚电流 @{K}_b**（ textbook 原图 ）。 */
function drawInset(s){
  if(!state.show.inset) return;
  /* ⚠️ 底部三行文字（K_b 标签 + 两行说明）必须分层排开：早先 K_b 在 by+158、
     第二行说明在 by+160，两者只差 2px ⇒ 视觉自检报 28% 重叠。现在的布句：
     环底 by+138 → K_b by+152 → 说明1 by+168 → 说明2 by+184（面板底 by+192）。 */
  const bx=14, by=H-206, bw=176, bh=192;
  const cx=bx+bw/2, cy=by+94;
  P_(1e6+2,()=>{
    ctx.save();
    ctx.shadowColor='rgba(30,60,80,.10)'; ctx.shadowBlur=8; ctx.shadowOffsetY=2;
    rrPath(bx,by,bw,bh,10); ctx.fillStyle='rgba(255,255,255,.94)'; ctx.fill();
    ctx.restore();
    ctx.save(); rrPath(bx,by,bw,bh,10); ctx.strokeStyle='#DCE6EB'; ctx.lineWidth=1; ctx.stroke(); ctx.restore();
  });
  /* ⚠️ 插图内文字必须用 textScreen（prim 制）：txt() 在 buildScene 期间直接画，
     会被随后按深度排序的 3D prims 盖住（2.3 教训） */
  textScreen(bx+12,by+15,'表层放大 · 俯视分子排列',{size:11,bold:true,color:'#1F3D4C'});
  /* 边界环（= 宏观束缚电流）：随取向度长出来 */
  const ringAl=Math.max(0,Math.min(1,(s-0.03)/0.25));
  if(ringAl>0.01){
    P_(1e6+3,()=>{ ctx.save();
      ctx.strokeStyle=CUR_HEX; ctx.lineWidth=2.2; ctx.globalAlpha=ringAl*0.9;
      if(s<0.6) ctx.setLineDash([4,3]);
      ctx.beginPath(); ctx.arc(cx,cy,44,0,7); ctx.stroke();
      /* 两个流向箭头（φ̂ = 俯视逆时针） */
      ctx.setLineDash([]);
      [Math.PI*0.25, Math.PI*1.25].forEach(a=>{
        const px=cx+44*Math.cos(a), py=cy+44*Math.sin(a);
        const ta=a+Math.PI/2;                          /* 逆时针切向 */
        ctx.beginPath();
        ctx.moveTo(px+7*Math.cos(ta), py+7*Math.sin(ta));
        ctx.lineTo(px-4*Math.cos(ta)+4.5*Math.cos(ta+Math.PI/2), py-4*Math.sin(ta)+4.5*Math.sin(ta+Math.PI/2));
        ctx.lineTo(px-4*Math.cos(ta)-4.5*Math.cos(ta+Math.PI/2), py-4*Math.sin(ta)-4.5*Math.sin(ta+Math.PI/2));
        ctx.closePath(); ctx.fillStyle=CUR_HEX; ctx.fill();
      });
      ctx.restore(); });
  }
  /* 7 个分子环（第一层的中心 + 第一环），法矢与 3D 场景同源 */
  const layer0=hexLayer();
  const norms=loopNorms();
  for(let k=0;k<7;k++){
    const p=layer0[k];
    const n=loopNormal(k,s);                          /* 前 7 个正好是第一层 */
    const ex=cx+280*p.x, ey=cy-280*p.y;
    const nz=n.z, nx2=Math.hypot(n.x,n.y);
    /* 投影：长轴 = 水平直径（长 2r，沿 tilt 的垂向）；短轴 = 2r·|n·ẑ| */
    const rot=nx2>1e-6 ? Math.atan2(-(n.x),-(n.y)) : 0;   /* 屏幕角（y 向下） */
    const rx=14, ry=14*Math.abs(nz);
    const ccw=nz>=0;
    P_(1e6+3,()=>{ ctx.save();
      ctx.strokeStyle=LOOP_HEX; ctx.lineWidth=1.5; ctx.globalAlpha=0.9;
      ctx.beginPath(); ctx.ellipse(ex,ey,rx,ry,rot,0,7); ctx.stroke();
      ctx.restore(); });
    /* 滑动流向小点（沿椭圆；顺/逆由 n·ẑ 的符号决定） */
    const ph=(loopPhase*0.4 + k*0.137)%1;
    const th=(ccw?1:-1)*2*Math.PI*ph;
    const dx=rx*Math.cos(th), dy=ry*Math.sin(th);
    const c2=Math.cos(rot), s2=Math.sin(rot);
    const px=ex+dx*c2-dy*s2, py=ey+dx*s2+dy*c2;
    P_(1e6+4,()=>{ ctx.save(); ctx.globalAlpha=0.9;
      ctx.fillStyle=LOOP_HI; ctx.beginPath(); ctx.arc(px,py,2.2,0,7); ctx.fill(); ctx.restore(); });
  }
  /* 接触点的「✕ 反向抵消」标记（只有取向一致后才出现） */
  const xAl=Math.max(0,Math.min(1,(s-0.05)/0.3));
  if(xAl>0.01){
    P_(1e6+3,()=>{ ctx.save(); ctx.globalAlpha=xAl*0.85; ctx.strokeStyle='#8A9AA5'; ctx.lineWidth=1.4;
      for(let k=0;k<6;k++){
        const a=Math.PI/3*k, mx=cx+14*Math.cos(a), my=cy-14*Math.sin(a);
        ctx.beginPath(); ctx.moveTo(mx-3,my-3); ctx.lineTo(mx+3,my+3);
        ctx.moveTo(mx+3,my-3); ctx.lineTo(mx-3,my+3); ctx.stroke();
      }
      ctx.restore(); });
  }
  textScreen(cx,cy+58,'@{K}_b = M',{size:11.5,bold:true,color:'#B23A2B',align:'center'});
  /* 底部两行说明（拆两行防溢出 176 宽的卡） */
  textScreen(bx+12,by+bh-24, s<0.05
      ? '取向杂乱 ⇒ 接触点电流反向'
      : '取向一致 ⇒ 内部反向互相抵消',
    {size:10,color:'#5F7482'});
  textScreen(bx+12,by+bh-8, s<0.05
      ? '表面无宏观环流'
      : '外表面合成宏观环形电流 @{K}_b',
    {size:10,color:'#5F7482'});
}

/* ══════════════════════════ 场景装配 ══════════════════════════ */
function buildScene(){
  prims=[];                     /* ★ 第一句必须是 prims=[]（否则每次重绘再叠一层整场景） */
  if(state.mode==='molecular')   drawMolecularScene();
  if(state.mode==='nofield')     drawNoFieldScene();
  if(state.mode==='poling')      drawPolingScene();
}

/* ══════════════ 信息卡内容 ══════════ */
function currentCard(){
  if(state.mode==='molecular'){
    const m=mMol(), S=Math.PI*Math.pow(state.rC*1e-10,2), mub=m/9.2740100783e-24;
    return ['分子电流 · 磁矩 @{m}',[
      ['分子电流 i', state.iC.toFixed(2)+' µA'],
      ['环半径 r_c', state.rC.toFixed(1)+' Å'],
      ['环面积 S = πr_c²', (S/1e-18).toFixed(2)+'×10'+supStr(-18)+' m²'],
      ['磁矩 m = i·S', (m/1e-24).toFixed(2)+'×10'+supStr(-24)+' A·m²'],
      ['　折合玻尔磁子', mub.toFixed(2)+' µ_B'],
      ['§ 一块磁介质里充满这样的小环'],
      ['　分子数密度 n', '1×10'+supStr(28)+' /m³'],
      ['　全部同向时 M = n·m', (mMax()/1e3).toFixed(1)+' kA/m'],
      ['　届时 @{B}′ = µ₀M', (MU0*mMax()*1e3).toFixed(1)+' mT'],
      ['§ 磁矩方向：右手定则'],
      ['　四指顺电流、拇指指 @{m}', state.flip?'当前沿 −z':'当前沿 +z'],
    ],238];
  }
  if(state.mode==='nofield'){
    return ['无外加磁场',[
      ['外加磁场 @{B}₀', '0 mT'],
      ['§ 分子层面'],
      ['　分子电流', '环流方向各异'],
      ['　磁矩 @{m} 取向', '杂乱无章'],
      ['§ 宏观层面'],
      ['　磁化强度 M', '0'],
      ['　表面束缚电流 @{K}_b', '0'],
      ['　磁化磁场 @{B}′', '0'],
      ['　总磁场 @{B}', '0'],
      ['§ 结论'],
      ['　介质显磁性吗', '完全不显', '#0E6E4A'],
    ],220];
  }
  const B0e=B0eff(), M=Mval(), a=aParam(B0e);
  return ['加外场 · 磁化 · 总场',[
    ['外场（终值）@{B}₀', state.B0.toFixed(0)+' mT'],
    ['加场进程 t', Math.round(state.t*100)+'%'],
    ['当前外场 @{B}₀·g', B0e.toFixed(1)+' mT'],
    ['§ 分子层面（i 用 ① 的设定）'],
    ['　分子磁矩 m = i·S', (mMol()/1e-24).toFixed(2)+'×10'+supStr(-24)+' A·m²'],
    ['　取向度 s（示意）', (sVis()*100).toFixed(0)+'%'],
    ['　真实取向度 L(a)', (sReal()*100).toExponential(1)+'%（a='+a.toExponential(2)+'）','#8A9AA5'],
    ['§ 宏观层面'],
    ['　磁化强度 M = n·m·s', (M/1e3).toFixed(1)+' kA/m'],
    ['　表面束缚电流 @{K}_b = M', (M/1e3).toFixed(1)+' kA/m'],
    ['　磁化磁场 @{B}′ = µ₀M', BpMT().toFixed(1)+' mT'],
    ['　总磁场 @{B} = @{B}₀+@{B}′', BtMT().toFixed(1)+' mT'],
    ['　相对磁导率 µ_r = @{B}/@{B}₀', isFinite(muR())?muR().toFixed(2):'—'],
  ],276];
}
function drawOverlays(){ const c=currentCard(); infoCard(c[0],c[1],c[2]); }

/* ══════════════════════════ 面板底部的实时结论条 ══════════════════════════ */
function subNote(){
  if(state.mode==='molecular')
    return '<b>每个分子电流是一个小环</b>，磁矩 @{m} = i·S，方向由右手定则给出。'+
      '把 <b>i 或 r_c</b> 拖大一倍：m 分别翻一倍 / 翻四倍（S 按 r_c² 涨）。<br>'+
      '右下角那块<b>表层放大</b>在 ②③ 才出现 —— 它回答"这么多小环怎么变成一圈表面电流"。';
  if(state.mode==='nofield')
    return '<b>没有外加磁场时，分子电流的取向杂乱无章</b>：每一个环都在流，'+
      '但环流的朝向 / 转向处处不同，<b>宏观上互相抵消</b>。<br>'+
      '按<b>「重新随机」</b>换一种摆法 —— 画面全变，<b>结论一点不变</b>（M、@{K}_b、@{B}′ 恒为 0）。';
  return '外场沿 <b>+z</b>（绿轴）。分子电流取向排列后：<b>内部相邻环流在接触点反向抵消</b>，'+
    '<b>外表面剩下一圈同向环流</b> = 束缚电流 @{K}_b = M —— 它就像一个螺线管，'+
    '产生沿 +z 的磁化磁场 @{B}′ = µ₀M。<br>'+
    '★ <b>总场 = 外场 + 磁化场</b>：浅灰直线是"只有外场"时的路径，实线弯掉的部分就是 @{B}′ 的贡献。'+
    'µ_r > 1 表示介质让磁场变强了。';
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
  molecular:[{k:'loop',t:'分子电流环（放大）'},{k:'lat',t:'周围的分子环'},{k:'fld',t:'环电流的场线'},{k:'box',t:'坐标轴'}],
  nofield:  [{k:'mol',t:'分子点阵'},{k:'inset',t:'表层放大插图'},{k:'box',t:'坐标轴'}],
  poling:   [{k:'mol',t:'分子点阵'},{k:'cur',t:'表面束缚电流'},{k:'bp',t:'磁化场 @{B}′ 线'},
             {k:'bt',t:'总场 @{B} 线'},{k:'b0',t:'外场参考线'},{k:'inset',t:'表层放大插图'},{k:'box',t:'坐标轴'}],
};
function mkRange(sec,d){
  const r=h('<div class="slider-row'+(d.wide?' w':'')+'"><label>'+richHTML(d.label)+'</label>'+
    '<input type="range" id="s_'+d.k+'" min="'+d.min+'" max="'+d.max+'" step="'+d.step+'" value="'+d.get()+'">'+
    '<span class="val" id="v_'+d.k+'">'+d.fmt(d.get())+'</span></div>');
  const inp=r.querySelector('input');
  inp.oninput=()=>{
    /* ⚠️ 必须用 d.set() 的**返回值**（生效值）来格式化与回写滑块（防"显示≠真实状态"） */
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
    /* ⚠️ 不许把层全关掉：全关 ⇒ 只剩坐标轴/空画布，三页签行为不一致 */
    const othersOn=SHOW_ITEMS[state.mode].some(it=>it.k!==k && state.show[it.k]);
    if(!next && !othersOn){ toastMsg('至少保留一层显示'); return; }
    state.show[k]=next; needsRender=true; renderPanel();
  });
  sec.appendChild(h('<div class="ex-note" style="margin-top:7px">'+richHTML(subNote())+'</div>'));
}
/* ⚠️ 这里的格式必须与 mkRange 建滑块时的 fmt **完全一致**（syncSliders 会反复调用）。 */
const SLIDER_FMT={
  iC:v=>v.toFixed(2)+' µA', rC:v=>v.toFixed(1)+' Å',
  B0:v=>v.toFixed(0)+' mT', t:v=>Math.round(v*100)+'%',
};
function syncSliders(){
  const set=(k,v)=>{ const s=document.getElementById('s_'+k); if(s) s.value=v;
    const e=document.getElementById('v_'+k); if(e) e.textContent=SLIDER_FMT[k]?SLIDER_FMT[k](v):String(v); };
  set('iC',state.iC); set('rC',state.rC); set('B0',state.B0); set('t',state.t);
}
function renderSliders(sec){
  sec.innerHTML='';
  if(state.mode==='molecular'){
    sec.appendChild(h('<div class="slider-group-label">一个分子电流有多大</div>'));
    mkRange(sec,{k:'iC',label:'分子电流 i',wide:true,min:IC_RANGE[0],max:IC_RANGE[1],step:0.02,
      get:()=>state.iC,set:v=>{state.iC=v;},fmt:v=>v.toFixed(2)+' µA'});
    mkRange(sec,{k:'rC',label:'环半径 r_c',wide:true,min:RC_RANGE[0],max:RC_RANGE[1],step:0.1,
      get:()=>state.rC,set:v=>{state.rC=v;},fmt:v=>v.toFixed(1)+' Å'});
    btnRow(sec,[
      {t:'翻转电流方向（看 @{m} 反向）', col:'p', on:state.flip,
        act:()=>{ state.flip=!state.flip; renderPanel(); updateAll(); }},
      {t:'回到默认', on:Math.abs(state.iC-1)<1e-9&&Math.abs(state.rC-10)<1e-9,
        act:()=>{ state.iC=1.0; state.rC=10; renderPanel(); updateAll(); }},
    ]);
    sec.appendChild(h('<div class="ex-note" style="margin-top:9px">'+richHTML(
      'r_c 用的是<b>真实原子尺度</b>（Å）；画面上的环按同一比例放大到看得见。'+
      '右上角卡片里的 m = i·S、M = n·m 都按滑块上的<b>真实值</b>算 —— '+
      '③ 页的磁化强度由这两个滑块决定。')+'</div>'));
  } else if(state.mode==='nofield'){
    btnRow(sec,[
      {t:'重新随机（换一种杂乱摆法）', col:'p',
        act:()=>{ state.seed=(state.seed+1)|0; renderPanel(); updateAll(); }},
    ]);
    sec.appendChild(h('<div class="ex-note" style="margin-top:9px">'+richHTML(
      '每一幅摆法都是<b>确定性</b>的（同一seed画同一幅图，截图才可复现）；'+
      '按一次换一个 seed，取向分布始终均匀。<br>'+
      '💡 盯着左下角插图看：每个环都在流，但<b>顺逆方向各异</b> —— '+
      '这就是"杂乱无章"的微观含义。')+'</div>'));
  } else {
    sec.appendChild(h('<div class="slider-group-label">外加磁场</div>'));
    mkRange(sec,{k:'B0',label:'外场 @{B}₀',wide:true,min:B0_RANGE[0],max:B0_RANGE[1],step:1,
      get:()=>state.B0,set:v=>{state.B0=v;},fmt:v=>v.toFixed(0)+' mT'});
    sec.appendChild(h('<div class="slider-group-label g" style="margin-top:12px">加场进程 · 全过程</div>'));
    /* ★★ 进度条：t 就是"加场/取向进行到哪儿"，可以拖到**任意时刻**停住（2.3 的同款设计） */
    mkRange(sec,{k:'t',label:'进程 t',wide:true,min:0,max:1,step:0.01,
      get:()=>state.t,
      set:v=>{ state.t=v; state.g=animG(v); state.anim=null; },
      fmt:v=>Math.round(v*100)+'%',
      after:()=>{ syncNotes(); updatePlayBtn(); }});
    sec.appendChild(h('<div class="ex-note" style="margin-top:4px">'+richHTML(
      't 在 <b>0~18%</b> 之间是「还没有外加场」（分子仍杂乱）；<b>18%→100%</b> 才在建立外场 —— '+
      '分子随之取向排列，表面电流与磁化场一起长出来。')+'</div>'));
    const pb=h('<button class="chip o" id="btnPlay">'+((state.anim&&state.anim.playing)?'⏸ 暂停':'▶ 播放全过程')+'</button>').firstChild;
    pb.onclick=()=>{
      if(state.anim) state.anim.playing=!state.anim.playing;
      else { const u=(state.t>=0.999?0:state.t); state.anim={u, playing:true}; state.t=u; state.g=animG(u); }
      renderPanel(); needsRender=true; syncSliders(); updateReadout(); updateModeTag();
    };
    const bx=h('<div class="sub-chips"></div>').firstChild; bx.appendChild(pb);
    const rb=h('<button class="chip" id="btnNoField">⏮ 回到无外场</button>').firstChild;
    rb.onclick=()=>{ stopAnim(); state.t=0; state.g=0; renderPanel(); syncSliders(); updateAll(); };
    const fb=h('<button class="chip" id="btnFull">⏭ 直接到最强场</button>').firstChild;
    fb.onclick=()=>{ stopAnim(); state.t=1; state.g=1; renderPanel(); updateAll(); };
    bx.appendChild(rb); bx.appendChild(fb);
    sec.appendChild(bx);
    sec.appendChild(h('<div class="ex-note" id="polNote" style="margin-top:9px">'+richHTML(polNote())+'</div>'));
  }
  /* 三个页签共用的一句说明 */
  sec.appendChild(h('<div class="ex-note" style="margin-top:9px">'+richHTML(
    '⏱ 分子环上滑落的小箭头表示<b>环流方向</b>（按右手定则对应磁矩方向），'+
    '只为看得见，不代表真实流速。<br>'+
    '💡 ②③ 的分子点阵是<b>同一套几何</b>：切页签时只有"朝向"在变，别的一个像素都不动。')+'</div>'));
}
function polNote(){
  const B0e=B0eff(), M=Mval();
  if(B0e<0.05)
    return '现在<b>还没有外加场</b>（t < 18%）：分子电流仍杂乱无章，'+
      'M、@{K}_b、@{B}′ 全部为 0 —— 和 ② 页签完全一样。';
  return '当前外场 <b>'+B0e.toFixed(1)+' mT</b>，取向度（示意）<b>'+(sVis()*100).toFixed(0)+'%</b>：'+
    'M = <b>'+(M/1e3).toFixed(1)+' kA/m</b>，@{B}′ = µ₀M = <b>'+BpMT().toFixed(1)+' mT</b>，'+
    '总场 @{B} = <b>'+BtMT().toFixed(1)+' mT</b>（µ_r = '+(isFinite(muR())?muR().toFixed(2):'—')+'）。';
}
